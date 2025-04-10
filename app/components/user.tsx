import React, { useState, useEffect } from "react";
import styles from "./user.module.scss";
import { IconButton } from "./button";
import CloseIcon from "../icons/close.svg";
import { useNavigate } from "react-router-dom";
import { Path } from "../constant";
import Locale from "../locales";
import { useAppConfig } from "../store";
import { Avatar, AvatarPicker } from "./emoji";
import { ErrorBoundary } from "./error";
import {
  Modal,
  showToast,
  List,
  ListItem,
  Popover,
  PasswordInput,
} from "./ui-lib";
import { Loading } from "./home";
import { encrypt } from "../utils/encryption";
import { handleUnauthorizedError } from "../utils/auth-middleware";
import { apiRequest } from "../utils/api-client";

export function User() {
  const navigate = useNavigate();
  const config = useAppConfig();
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userClaims, setUserClaims] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userDetails, setUserDetails] = useState<any>(null);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Use the enhanced API client that handles token refresh
        const response = await apiRequest("/api/auth/status");

        if (response.ok) {
          const data = await response.json();
          setIsAuthenticated(data.isAuthenticated);
          setUserClaims(data.claims);

          if (data.isAuthenticated && data.claims) {
            // First try to use username
            if (data.claims.username) {
              setUsername(data.claims.username);
            } else if (data.claims.name) {
              setUsername(data.claims.name);
            } else if (data.claims.sub) {
              setUsername(data.claims.sub);
            } else {
              setUsername("用户");
            }

            if (data.claims.email) {
              setEmail(data.claims.email);
            }

            // Fetch detailed user information
            try {
              const userResponse = await apiRequest("/api/user/profile");
              if (userResponse.ok) {
                const userData = await userResponse.json();
                setUserDetails(userData);

                // Update username and email with more accurate data if available
                if (userData.username) {
                  setUsername(userData.username);
                }
                if (userData.email) {
                  setEmail(userData.email);
                }
              } else if (userResponse.status === 401) {
                // Handle unauthorized error
                console.error("Unauthorized error when fetching user profile");
                setIsAuthenticated(false);
                setUserClaims(null);
                setUserDetails(null);
                setUsername("");
                setEmail("");
                handleUnauthorizedError();
              }
            } catch (error) {
              console.error("Failed to fetch user details:", error);
            }
          }
        } else if (response.status === 401) {
          // Handle unauthorized error
          console.error("Unauthorized error when checking auth status");
          setIsAuthenticated(false);
          setUserClaims(null);
          setUserDetails(null);
          setUsername("");
          setEmail("");
          handleUnauthorizedError();
        }
      } catch (error) {
        console.error("Failed to check auth status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, [isAuthenticated]);

  // Update avatar function
  const updateAvatar = (avatar: string) => {
    config.update((config) => (config.avatar = avatar));
    setShowAvatarPicker(false);
    showToast("头像已更新");
  };

  // Handle login
  const handleLogin = () => {
    window.location.href = "/api/auth/signin";
  };

  // Handle logout
  const handleLogout = () => {
    window.location.href = "/api/auth/signout";
  };

  // Handle password reset
  const handlePasswordReset = () => {
    setShowPasswordModal(true);
  };

  // Format date function
  const formatDate = (timestamp: number) => {
    if (!timestamp) return "未知";
    const date = new Date(timestamp);
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  // Password reset modal component
  function PasswordResetModal(props: { onClose: () => void }) {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [encryptionKey, setEncryptionKey] = useState("");

    // Fetch encryption key when modal opens
    useEffect(() => {
      const fetchEncryptionKey = async () => {
        try {
          const response = await apiRequest("/api/auth/encryption-key");
          if (!response.ok) {
            throw new Error("Failed to fetch encryption key");
          }
          const data = await response.json();
          setEncryptionKey(data.encryptionKey);
        } catch (error) {
          console.error("Error fetching encryption key:", error);
          setError("无法获取加密密钥，请稍后重试");
        }
      };

      fetchEncryptionKey();
    }, []);

    const handleSubmit = async () => {
      // 验证表单
      if (!currentPassword || !newPassword || !confirmPassword) {
        setError("所有字段都是必填的");
        return;
      }

      if (newPassword !== confirmPassword) {
        setError("新密码和确认密码不匹配");
        return;
      }

      if (newPassword.length < 8) {
        setError("新密码长度必须至少为8个字符");
        return;
      }

      if (!encryptionKey) {
        setError("加密密钥未就绪，请稍后重试");
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        // 加密密码
        const encryptedCurrentPassword = encrypt(
          currentPassword,
          encryptionKey,
        );
        const encryptedNewPassword = encrypt(newPassword, encryptionKey);

        const response = await apiRequest("/api/auth/change-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentPassword: encryptedCurrentPassword,
            newPassword: encryptedNewPassword,
            encryptionKey,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "密码修改失败");
          return;
        }

        // 密码修改成功
        showToast("密码已成功更新");
        props.onClose();
      } catch (error) {
        console.error("密码修改请求失败:", error);
        setError("请求失败，请稍后重试");
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="modal-mask">
        <Modal
          title="修改密码"
          onClose={props.onClose}
          actions={[
            <IconButton
              key="confirm"
              onClick={handleSubmit}
              type="primary"
              text="确认修改"
              disabled={isLoading}
            />,
            <IconButton
              key="cancel"
              onClick={props.onClose}
              text={Locale.UI.Cancel}
              bordered
            />,
          ]}
        >
          <List>
            {error && (
              <ListItem>
                <div className={styles["error-message"]}>{error}</div>
              </ListItem>
            )}
            <ListItem title="当前密码">
              <PasswordInput
                value={currentPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCurrentPassword(e.target.value)
                }
                placeholder="请输入当前密码"
              />
            </ListItem>
            <ListItem title="新密码">
              <PasswordInput
                value={newPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewPassword(e.target.value)
                }
                placeholder="请输入新密码"
              />
            </ListItem>
            <ListItem title="确认新密码">
              <PasswordInput
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setConfirmPassword(e.target.value)
                }
                placeholder="请再次输入新密码"
              />
            </ListItem>
            {isLoading && (
              <ListItem>
                <div className={styles["loading"]}>处理中...</div>
              </ListItem>
            )}
          </List>
        </Modal>
      </div>
    );
  }

  if (isLoading) {
    return <Loading />;
  }

  return (
    <ErrorBoundary>
      <div className={styles["user-page"]}>
        <div className="window-header" data-tauri-drag-region>
          <div className="window-header-title">
            <div className="window-header-main-title">个人中心</div>
            <div className="window-header-sub-title">管理您的个人信息</div>
          </div>
          <div className="window-actions">
            <div className="window-action-button"></div>
            <div className="window-action-button"></div>
            <div className="window-action-button">
              <IconButton
                icon={<CloseIcon />}
                onClick={() => navigate(Path.Home)}
                bordered
                title={Locale.UI.Close}
              />
            </div>
          </div>
        </div>

        <div className={styles["settings"]}>
          {isAuthenticated ? (
            <>
              <List>
                <ListItem title="头像">
                  <Popover
                    onClose={() => setShowAvatarPicker(false)}
                    content={
                      <AvatarPicker
                        onEmojiClick={(avatar: string) => {
                          updateAvatar(avatar);
                        }}
                      />
                    }
                    open={showAvatarPicker}
                  >
                    <div
                      className={styles.avatar}
                      onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                    >
                      <Avatar avatar={config.avatar} />
                    </div>
                  </Popover>
                </ListItem>
              </List>

              <List>
                {email && (
                  <ListItem title="邮箱">
                    <div className={styles["user-info"]}>
                      <span>{email}</span>
                    </div>
                  </ListItem>
                )}

                {userDetails?.phone && (
                  <ListItem title="手机号码">
                    <div className={styles["user-info"]}>
                      <span>{userDetails.phone}</span>
                    </div>
                  </ListItem>
                )}

                {userDetails?.createdAt && (
                  <ListItem title="注册时间">
                    <div className={styles["user-info"]}>
                      <span>{formatDate(userDetails.createdAt)}</span>
                    </div>
                  </ListItem>
                )}

                {userDetails?.lastSignInAt && (
                  <ListItem title="上次登录">
                    <div className={styles["user-info"]}>
                      <span>{formatDate(userDetails.lastSignInAt)}</span>
                    </div>
                  </ListItem>
                )}

                {userDetails?.isSuspended !== undefined && (
                  <ListItem title="账户状态">
                    <div className={styles["user-info"]}>
                      <span>{userDetails.isSuspended ? "已暂停" : "正常"}</span>
                    </div>
                  </ListItem>
                )}

                {userDetails?.hasPassword !== undefined && (
                  <ListItem title="密码状态">
                    <div className={styles["user-info"]}>
                      <span>
                        {userDetails.hasPassword ? "已设置" : "未设置"}
                      </span>
                    </div>
                  </ListItem>
                )}
              </List>

              {userDetails?.profile &&
                Object.keys(userDetails.profile).length > 0 && (
                  <List>
                    <ListItem title="个人资料">
                      <div className={styles["profile-info"]}>
                        {userDetails.profile.familyName && (
                          <div className={styles["profile-item"]}>
                            <span className={styles["profile-label"]}>姓:</span>
                            <span>{userDetails.profile.familyName}</span>
                          </div>
                        )}
                        {userDetails.profile.givenName && (
                          <div className={styles["profile-item"]}>
                            <span className={styles["profile-label"]}>名:</span>
                            <span>{userDetails.profile.givenName}</span>
                          </div>
                        )}
                        {userDetails.profile.nickname && (
                          <div className={styles["profile-item"]}>
                            <span className={styles["profile-label"]}>
                              昵称:
                            </span>
                            <span>{userDetails.profile.nickname}</span>
                          </div>
                        )}
                        {userDetails.profile.website && (
                          <div className={styles["profile-item"]}>
                            <span className={styles["profile-label"]}>
                              网站:
                            </span>
                            <span>{userDetails.profile.website}</span>
                          </div>
                        )}
                        {userDetails.profile.gender && (
                          <div className={styles["profile-item"]}>
                            <span className={styles["profile-label"]}>
                              性别:
                            </span>
                            <span>{userDetails.profile.gender}</span>
                          </div>
                        )}
                        {userDetails.profile.birthdate && (
                          <div className={styles["profile-item"]}>
                            <span className={styles["profile-label"]}>
                              生日:
                            </span>
                            <span>{userDetails.profile.birthdate}</span>
                          </div>
                        )}
                        {userDetails.profile.locale && (
                          <div className={styles["profile-item"]}>
                            <span className={styles["profile-label"]}>
                              语言:
                            </span>
                            <span>{userDetails.profile.locale}</span>
                          </div>
                        )}
                      </div>
                    </ListItem>
                  </List>
                )}

              {userDetails?.customData &&
                Object.keys(userDetails.customData).length > 0 && (
                  <List>
                    <ListItem title="自定义数据">
                      <div className={styles["custom-data"]}>
                        {Object.entries(userDetails.customData).map(
                          ([key, value]) => (
                            <div
                              key={key}
                              className={styles["custom-data-item"]}
                            >
                              <span className={styles["custom-data-label"]}>
                                {key}:
                              </span>
                              <span>
                                {typeof value === "object"
                                  ? JSON.stringify(value)
                                  : String(value)}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </ListItem>
                  </List>
                )}

              <List>
                <ListItem title="密码" subTitle="定期修改密码可以保障账户安全">
                  <IconButton
                    text="重置密码"
                    onClick={() => setShowPasswordModal(true)}
                    bordered
                  />
                </ListItem>
              </List>

              <List>
                <ListItem title="账户">
                  <IconButton text="退出登录" onClick={handleLogout} bordered />
                </ListItem>
              </List>

              {showPasswordModal && (
                <PasswordResetModal
                  onClose={() => setShowPasswordModal(false)}
                />
              )}
            </>
          ) : (
            <List>
              <ListItem title="登录" subTitle="登录以管理您的账户">
                <IconButton
                  text="立即登录"
                  onClick={handleLogin}
                  type="primary"
                />
              </ListItem>
            </List>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}

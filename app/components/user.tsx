import React, { useState, useEffect } from "react";
import styles from "./user.module.scss";
import { IconButton } from "./button";
import CloseIcon from "../icons/close.svg";
import EditIcon from "../icons/edit.svg";
import ConfirmIcon from "../icons/confirm.svg";
import { useNavigate } from "react-router-dom";
import { Path } from "../constant";
import Locale from "../locales";
import { useAppConfig } from "../store";
import { Avatar, AvatarPicker } from "./emoji";
import { ErrorBoundary } from "./error";
import { Modal, showToast, List, ListItem, Popover } from "./ui-lib";
import { Loading } from "./home";

export function User() {
  const navigate = useNavigate();
  const config = useAppConfig();
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [editingEmail, setEditingEmail] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userClaims, setUserClaims] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userDetails, setUserDetails] = useState<any>(null);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch("/api/auth/status");
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
              const userResponse = await fetch("/api/user/profile");
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
              }
            } catch (error) {
              console.error("Failed to fetch user details:", error);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch auth status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Update avatar function
  const updateAvatar = (avatar: string) => {
    config.update((config) => (config.avatar = avatar));
    setShowAvatarPicker(false);
    showToast("头像已更新");
  };

  // Handle email change
  const handleEmailChange = (e: React.FormEvent) => {
    e.preventDefault();
    setEditingEmail(false);
    showToast("邮箱已更新");
  };

  // Handle email button click
  const handleEmailButtonClick = () => {
    handleEmailChange({ preventDefault: () => {} } as React.FormEvent);
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
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  // Password reset modal component
  function PasswordResetModal(props: { onClose: () => void }) {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

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

      setIsLoading(true);
      setError("");

      try {
        const response = await fetch("/api/auth/change-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
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
          <div className={styles["password-reset-form"]}>
            {error && <div className={styles["error-message"]}>{error}</div>}
            <div className={styles["form-group"]}>
              <label>当前密码</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="请输入当前密码"
              />
            </div>
            <div className={styles["form-group"]}>
              <label>新密码</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="请输入新密码"
              />
            </div>
            <div className={styles["form-group"]}>
              <label>确认新密码</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入新密码"
              />
            </div>
            {isLoading && <div className={styles["loading"]}>处理中...</div>}
          </div>
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
                <ListItem title="用户名">
                  <div className={styles["user-info"]}>
                    <span>{username}</span>
                  </div>
                </ListItem>

                {email && (
                  <ListItem title="邮箱">
                    {editingEmail ? (
                      <div className={styles["edit-form"]}>
                        <input
                          className={styles["edit-input"]}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          autoFocus
                        />
                        <IconButton
                          icon={<ConfirmIcon />}
                          onClick={handleEmailButtonClick}
                          bordered
                        />
                        <IconButton
                          icon={<CloseIcon />}
                          onClick={() => setEditingEmail(false)}
                          bordered
                        />
                      </div>
                    ) : (
                      <div className={styles["edit-container"]}>
                        <span>{email}</span>
                        <IconButton
                          icon={<EditIcon />}
                          bordered
                          onClick={() => setEditingEmail(true)}
                        />
                      </div>
                    )}
                  </ListItem>
                )}

                {userDetails?.phone && (
                  <ListItem title="手机号码">
                    <div className={styles["user-info"]}>
                      <span>{userDetails.phone}</span>
                    </div>
                  </ListItem>
                )}

                {userDetails?.userId && (
                  <ListItem title="用户ID">
                    <div className={styles["user-info"]}>
                      <span>{userDetails.userId}</span>
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

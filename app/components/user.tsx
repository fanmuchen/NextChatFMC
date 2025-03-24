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
import {
  Modal,
  showToast,
  List,
  ListItem,
  PasswordInput,
  Popover,
} from "./ui-lib";
import { Loading } from "./home";

export function User() {
  const navigate = useNavigate();
  const config = useAppConfig();
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [username, setUsername] = useState("用户");
  const [email, setEmail] = useState("user@example.com");
  const [editingUsername, setEditingUsername] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userClaims, setUserClaims] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

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
            if (data.claims.name) {
              setUsername(data.claims.name);
            } else if (data.claims.sub) {
              setUsername(data.claims.sub);
            }

            if (data.claims.email) {
              setEmail(data.claims.email);
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

  // Handle username change
  const handleUsernameChange = (e: React.FormEvent) => {
    e.preventDefault();
    setEditingUsername(false);
    showToast("用户名已更新");
  };

  // Handle username button click
  const handleUsernameButtonClick = () => {
    handleUsernameChange({ preventDefault: () => {} } as React.FormEvent);
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

  // Password change modal component
  function PasswordChangeModal(props: { onClose: () => void }) {
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();

      if (newPassword !== confirmPassword) {
        setError("两次输入的密码不一致");
        return;
      }

      // Here you would implement the actual password change logic
      showToast("密码已修改");
      props.onClose();
    };

    return (
      <div className={styles["password-modal"]}>
        <form onSubmit={handleSubmit}>
          <List>
            <ListItem title="当前密码">
              <PasswordInput
                value={oldPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setOldPassword(e.currentTarget.value)
                }
              />
            </ListItem>
            <ListItem title="新密码">
              <PasswordInput
                value={newPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewPassword(e.currentTarget.value)
                }
              />
            </ListItem>
            <ListItem title="确认密码">
              <PasswordInput
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setConfirmPassword(e.currentTarget.value)
                }
              />
            </ListItem>
          </List>

          {error && <div className={styles["password-error"]}>{error}</div>}

          <div className={styles["actions"]}>
            <IconButton
              text={Locale.UI.Cancel}
              onClick={props.onClose}
              bordered
            />
            <IconButton type="primary" text={Locale.UI.Confirm} />
          </div>
        </form>
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
                  {editingUsername ? (
                    <div className={styles["edit-form"]}>
                      <input
                        className={styles["edit-input"]}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoFocus
                      />
                      <IconButton
                        icon={<ConfirmIcon />}
                        onClick={handleUsernameButtonClick}
                        bordered
                      />
                      <IconButton
                        icon={<CloseIcon />}
                        onClick={() => setEditingUsername(false)}
                        bordered
                      />
                    </div>
                  ) : (
                    <div className={styles["edit-container"]}>
                      <span>{username}</span>
                      <IconButton
                        icon={<EditIcon />}
                        bordered
                        onClick={() => setEditingUsername(true)}
                      />
                    </div>
                  )}
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
              </List>

              <List>
                <ListItem title="密码" subTitle="定期修改密码可以保障账户安全">
                  <IconButton
                    text="修改密码"
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
                <Modal
                  title="修改密码"
                  onClose={() => setShowPasswordModal(false)}
                  actions={[]}
                >
                  <PasswordChangeModal
                    onClose={() => setShowPasswordModal(false)}
                  />
                </Modal>
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

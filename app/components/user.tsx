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
    window.location.href = "/api/auth/reset-password";
  };

  // Password reset modal component
  function PasswordResetModal(props: { onClose: () => void }) {
    return (
      <div className="modal-mask">
        <Modal
          title="重置密码"
          onClose={props.onClose}
          actions={[
            <IconButton
              key="confirm"
              onClick={handlePasswordReset}
              type="primary"
              text="发送重置邮件"
            />,
            <IconButton
              key="cancel"
              onClick={props.onClose}
              text={Locale.UI.Cancel}
              bordered
            />,
          ]}
        >
          <div className={styles["password-reset-info"]}>
            <p>我们将向您的邮箱发送密码重置链接。</p>
            <p>请检查您的邮箱并按照邮件中的说明重置密码。</p>
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
              </List>

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

import React, { useState, useEffect } from "react";
import styles from "./user.module.scss";
import authStyles from "./auth.module.scss";
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
        <div className={styles["modal-title"]}>修改密码</div>
        <form onSubmit={handleSubmit}>
          <div className={styles["password-form-item"]}>
            <div className={styles["password-form-label"]}>当前密码</div>
            <PasswordInput
              value={oldPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setOldPassword(e.target.value)
              }
              placeholder="请输入当前密码"
            />
          </div>
          <div className={styles["password-form-item"]}>
            <div className={styles["password-form-label"]}>新密码</div>
            <PasswordInput
              value={newPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewPassword(e.target.value)
              }
              placeholder="请输入新密码"
            />
          </div>
          <div className={styles["password-form-item"]}>
            <div className={styles["password-form-label"]}>确认密码</div>
            <PasswordInput
              value={confirmPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setConfirmPassword(e.target.value)
              }
              placeholder="请再次输入新密码"
            />
          </div>
          {error && <div className={styles["password-error"]}>{error}</div>}
          <div className={styles["password-form-actions"]}>
            <button
              type="button"
              className={styles["cancel-button"]}
              onClick={props.onClose}
            >
              {Locale.UI.Cancel}
            </button>
            <button type="submit" className={styles["settings-button"]}>
              {Locale.UI.Confirm}
            </button>
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
        <div className={styles["window-header"]}>
          <div className={styles["window-header-title"]}>
            <div className={styles["window-header-main-title"]}>个人中心</div>
            <div className={styles["window-header-sub-title"]}>
              管理您的个人信息
            </div>
          </div>
          <div className={styles["window-actions"]}>
            <IconButton
              icon={<CloseIcon />}
              onClick={() => navigate(Path.Home)}
              bordered
              title={Locale.UI.Close}
            />
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
                      aria-label="头像"
                      tabIndex={0}
                      className={styles.avatar}
                      onClick={() => {
                        setShowAvatarPicker(!showAvatarPicker);
                      }}
                    >
                      <Avatar avatar={config.avatar} />
                    </div>
                  </Popover>
                </ListItem>
              </List>

              <List>
                <ListItem title="账户信息" />
                <ListItem title="用户名">
                  <div className={styles["profile-value-container"]}>
                    <span className={styles["profile-value"]}>{username}</span>
                  </div>
                </ListItem>
                {email && (
                  <ListItem title="邮箱">
                    <div className={styles["profile-value-container"]}>
                      <span className={styles["profile-value"]}>{email}</span>
                    </div>
                  </ListItem>
                )}
              </List>

              <List>
                <ListItem>
                  <IconButton
                    text="退出登录"
                    onClick={handleLogout}
                    type="primary"
                  />
                </ListItem>
              </List>
            </>
          ) : (
            <div className={authStyles["auth-actions"]}>
              <IconButton text="登录" onClick={handleLogin} type="primary" />
            </div>
          )}
        </div>

        {showPasswordModal && (
          <Modal
            title="修改密码"
            onClose={() => setShowPasswordModal(false)}
            actions={[]}
          >
            <PasswordChangeModal onClose={() => setShowPasswordModal(false)} />
          </Modal>
        )}
      </div>
    </ErrorBoundary>
  );
}

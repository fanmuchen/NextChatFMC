import React, { useState } from "react";
import styles from "./user.module.scss";
import { IconButton } from "./button";
import CloseIcon from "../icons/close.svg";
import EditIcon from "../icons/edit.svg";
import ResetIcon from "../icons/reload.svg";
import ConfirmIcon from "../icons/confirm.svg";
import { useNavigate } from "react-router-dom";
import { Path } from "../constant";
import Locale from "../locales";
import { useAppConfig } from "../store";
import { Avatar, AvatarPicker } from "./emoji";
import { ErrorBoundary } from "./error";
import { Modal, showToast, List, ListItem, PasswordInput } from "./ui-lib";

export function User() {
  const navigate = useNavigate();
  const config = useAppConfig();
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [username, setUsername] = useState("用户");
  const [email, setEmail] = useState("user@example.com");
  const [editingUsername, setEditingUsername] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);

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

  // Handle logout
  const handleLogout = () => {
    showToast("已退出登录");
    navigate(Path.Home);
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
          <List>
            <ListItem title="头像">
              <div
                className={styles["avatar-container"]}
                onClick={() => setShowAvatarPicker(true)}
              >
                <Avatar avatar={config.avatar} />
              </div>
            </ListItem>

            <ListItem title="账户信息">
              <div className={styles["account-section"]}>
                <div className={styles["profile-item"]}>
                  <div className={styles["profile-item-title"]}>用户名</div>
                  <div className={styles["profile-item-content"]}>
                    {editingUsername ? (
                      <form
                        onSubmit={handleUsernameChange}
                        className={styles["edit-form"]}
                      >
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className={styles["edit-input"]}
                          autoFocus
                        />
                        <IconButton
                          icon={<ConfirmIcon />}
                          type="primary"
                          text={Locale.UI.Confirm}
                          onClick={handleUsernameButtonClick}
                        />
                      </form>
                    ) : (
                      <div className={styles["profile-value-container"]}>
                        <span className={styles["profile-value"]}>
                          {username}
                        </span>
                        <IconButton
                          icon={<EditIcon />}
                          onClick={() => setEditingUsername(true)}
                          className={styles["edit-button"]}
                          title="编辑"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles["profile-item"]}>
                  <div className={styles["profile-item-title"]}>邮箱</div>
                  <div className={styles["profile-item-content"]}>
                    {editingEmail ? (
                      <form
                        onSubmit={handleEmailChange}
                        className={styles["edit-form"]}
                      >
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={styles["edit-input"]}
                          autoFocus
                        />
                        <IconButton
                          icon={<ConfirmIcon />}
                          type="primary"
                          text={Locale.UI.Confirm}
                          onClick={handleEmailButtonClick}
                        />
                      </form>
                    ) : (
                      <div className={styles["profile-value-container"]}>
                        <span className={styles["profile-value"]}>{email}</span>
                        <IconButton
                          icon={<EditIcon />}
                          onClick={() => setEditingEmail(true)}
                          className={styles["edit-button"]}
                          title="编辑"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ListItem>

            <ListItem title="账户安全">
              <div className={styles["security-section"]}>
                <div className={styles["profile-item"]}>
                  <div className={styles["profile-item-title"]}>密码</div>
                  <div className={styles["profile-item-content"]}>
                    <IconButton
                      icon={<EditIcon />}
                      text="修改密码"
                      onClick={() => setShowPasswordModal(true)}
                      bordered
                    />
                  </div>
                </div>
              </div>
            </ListItem>

            <ListItem title="偏好设置">
              <div className={styles["preferences-section"]}>
                <div className={styles["profile-item"]}>
                  <div className={styles["profile-item-title"]}>主题</div>
                  <div className={styles["profile-item-content"]}>
                    <select
                      value={config.theme}
                      onChange={(e) => {
                        config.update(
                          (config) => (config.theme = e.target.value as any),
                        );
                      }}
                      className={styles["theme-select"]}
                    >
                      <option value="auto">跟随系统</option>
                      <option value="light">浅色</option>
                      <option value="dark">深色</option>
                    </select>
                  </div>
                </div>
              </div>
            </ListItem>

            <ListItem>
              <div className={styles["logout-section"]}>
                <IconButton
                  icon={<ResetIcon />}
                  text="退出登录"
                  onClick={handleLogout}
                  type="danger"
                />
              </div>
            </ListItem>
          </List>
        </div>

        {showAvatarPicker && (
          <Modal title="选择头像" onClose={() => setShowAvatarPicker(false)}>
            <AvatarPicker onEmojiClick={(avatar) => updateAvatar(avatar)} />
          </Modal>
        )}

        {showPasswordModal && (
          <Modal title="修改密码" onClose={() => setShowPasswordModal(false)}>
            <PasswordChangeModal onClose={() => setShowPasswordModal(false)} />
          </Modal>
        )}
      </div>
    </ErrorBoundary>
  );
}

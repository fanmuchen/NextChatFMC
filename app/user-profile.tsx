import React, { useState } from "react";
import styles from "./user-profile.module.scss";
import { IconButton } from "./components/button";
import CloseIcon from "./icons/close.svg";
import EditIcon from "./icons/edit.svg";
import { useNavigate } from "react-router-dom";
import { Path } from "./constant";
import Locale from "./locales";
import { useAppConfig } from "./store";
import { Avatar, AvatarPicker } from "./components/emoji";
import { ErrorBoundary } from "./components/error";
import { Modal, showToast } from "./components/ui-lib";

export function UserProfile() {
  const navigate = useNavigate();
  const config = useAppConfig();
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [username, setUsername] = useState("用户");

  const updateAvatar = (avatar: string) => {
    config.update((config) => (config.avatar = avatar));
    setShowAvatarPicker(false);
    showToast("头像已更新");
  };

  const handleUsernameChange = (e: React.FormEvent) => {
    e.preventDefault();
    setEditingUsername(false);
    showToast("用户名已更新");
  };

  const handleLogout = () => {
    showToast("已退出登录");
    navigate(Path.Home);
  };

  const handlePasswordChange = () => {
    showToast("密码修改功能暂未实现");
  };

  return (
    <ErrorBoundary>
      <div className={styles["user-profile-page"]}>
        <div className={styles["window-header"]}>
          <div className={styles["window-header-title"]}>
            <div className={styles["window-header-main-title"]}>
              {Locale.Discovery.Name}
            </div>
            <div className={styles["window-header-sub-title"]}>
              管理您的个人信息
            </div>
          </div>
          <div className={styles["window-actions"]}>
            <IconButton
              icon={<CloseIcon />}
              onClick={() => navigate(Path.Home)}
              bordered
              title="关闭"
            />
          </div>
        </div>

        <div className={styles["user-profile-body"]}>
          <div
            className={styles["avatar-container"]}
            onClick={() => setShowAvatarPicker(true)}
            title="点击更换头像"
          >
            <Avatar avatar={config.avatar} />
          </div>

          <div className={styles["section-title"]}>基本信息</div>
          <div className={styles["profile-item"]}>
            <div className={styles["profile-item-title"]}>用户名</div>
            <div className={styles["profile-item-content"]}>
              {editingUsername ? (
                <form onSubmit={handleUsernameChange}>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoFocus
                  />
                  <button type="submit" className={styles["profile-button"]}>
                    保存
                  </button>
                </form>
              ) : (
                <div style={{ display: "flex", alignItems: "center" }}>
                  {username}
                  <IconButton
                    icon={<EditIcon />}
                    onClick={() => setEditingUsername(true)}
                    className={styles["edit-button"]}
                    title="编辑用户名"
                  />
                </div>
              )}
            </div>
          </div>

          <div className={styles["profile-item"]}>
            <div className={styles["profile-item-title"]}>邮箱</div>
            <div className={styles["profile-item-content"]}>
              user@example.com
            </div>
          </div>

          <div className={styles["section-title"]}>账户安全</div>
          <div className={styles["profile-item"]}>
            <div className={styles["profile-item-title"]}>修改密码</div>
            <div className={styles["profile-item-content"]}>
              <button
                className={styles["profile-button"]}
                onClick={handlePasswordChange}
              >
                修改密码
              </button>
            </div>
          </div>

          <div className={styles["section-title"]}>偏好设置</div>
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

          <div className={styles["section-title"]}>账户管理</div>
          <div className={styles["profile-item"]}>
            <div className={styles["profile-item-title"]}>退出登录</div>
            <div className={styles["profile-item-content"]}>
              <button
                className={styles["profile-button-danger"]}
                onClick={handleLogout}
              >
                退出登录
              </button>
            </div>
          </div>
        </div>

        {showAvatarPicker && (
          <Modal title="选择头像" onClose={() => setShowAvatarPicker(false)}>
            <AvatarPicker onEmojiClick={(avatar) => updateAvatar(avatar)} />
          </Modal>
        )}
      </div>
    </ErrorBoundary>
  );
}

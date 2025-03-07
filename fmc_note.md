# Git 操作笔记

## 初始设置（仅需执行一次）
```bash
# 克隆仓库
git clone https://github.com/fanmuchen/NextChatFMC
cd NextChatFMC

# 添加上游仓库
git remote add upstream https://github.com/ChatGPTNextWeb/NextChat.git

# 验证远程仓库
git remote -v
```

## 与上游仓库同步（当需要更新时执行）
```bash
# 1. 获取上游更新
git fetch upstream

# 2. 确保在 main 分支
git checkout main

# 3. 合并上游更新
git merge upstream/main

# 4. 推送到自己的仓库
git push origin main
```

## 在 feature 分支上处理上游更新
```bash
# 1. 提交当前 feature 分支的更改
git add .
git commit -m "描述你的更改"

# 2. 切换到 main 分支并更新
git checkout main
git fetch upstream
git merge upstream/main
git push origin main

# 3. 切回 feature 分支并合并 main 的更新
git checkout feature
git merge main

# 4. 解决可能的冲突后，继续开发
# 如果有冲突，解决后执行：
# git add .
# git commit -m "解决合并冲突"
```

注意：如果合并时出现冲突，需要手动解决冲突后再继续。 
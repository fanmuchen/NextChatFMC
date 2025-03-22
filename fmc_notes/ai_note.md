# NextChat (ChatGPT Next Web) 项目结构说明

## 项目概述

NextChat是一个轻量级、快速的AI助手应用，支持多种AI模型，包括Claude、DeepSeek、GPT-4和Gemini Pro等。项目基于Next.js框架开发，提供Web应用和桌面应用两种形式。

## 技术栈

- **前端框架**：Next.js 14.x
- **UI库**：React 18.x
- **状态管理**：Zustand
- **样式**：SCSS模块
- **桌面应用**：Tauri
- **测试**：Jest
- **代码规范**：ESLint, Prettier

## 项目结构

### 根目录结构

- **app/**：主要应用代码，包含组件、API、状态管理等
- **public/**：静态资源文件
- **src-tauri/**：Tauri桌面应用相关代码
- **scripts/**：项目脚本
- **docs/**：文档
- **test/**：测试代码

### 核心目录说明

#### app目录

- **components/**：UI组件
  - **chat.tsx**：核心聊天组件，包含消息渲染、发送等功能
  - **home.tsx**：主页组件
  - **settings.tsx**：设置组件
  - **sidebar.tsx**：侧边栏组件
  - **markdown.tsx**：Markdown渲染组件
  - **ui-lib.tsx**：基础UI库组件
  
- **api/**：API接口
  - **openai.ts**：OpenAI API接口
  - **anthropic.ts**：Anthropic (Claude) API接口
  - **google.ts**：Google (Gemini) API接口
  - **deepseek.ts**：DeepSeek API接口
  - **common.ts**：通用API功能
  - 其他各种AI服务提供商的API接口

- **store/**：状态管理
  - **chat.ts**：聊天相关状态
  - **config.ts**：配置相关状态
  - **mask.ts**：预设提示词(Mask)相关状态
  - **access.ts**：访问控制相关状态
  - **plugin.ts**：插件相关状态
  - **sync.ts**：数据同步相关状态

- **styles/**：全局样式
- **locales/**：国际化文件
- **utils/**：工具函数
- **icons/**：SVG图标
- **masks/**：预设提示词模板
- **config/**：配置文件

#### 主要文件

- **app/page.tsx**：应用入口页面
- **app/layout.tsx**：应用布局组件
- **app/constant.ts**：常量定义
- **app/utils.ts**：工具函数
- **app/command.ts**：命令处理
- **app/typing.ts**：类型定义

## 核心功能模块

### 聊天功能

聊天功能是应用的核心，主要由`app/components/chat.tsx`实现，包括：
- 消息发送与接收
- 消息渲染与格式化
- 上下文管理
- 图片上传与处理
- 语音输入与输出

### 多模型支持

应用支持多种AI模型，通过`app/api/`目录下的不同文件实现对各种模型的支持：
- OpenAI (GPT系列)
- Anthropic (Claude系列)
- Google (Gemini系列)
- DeepSeek
- 以及其他多种模型

### 状态管理

应用使用Zustand进行状态管理，主要状态存储在`app/store/`目录下：
- 聊天会话管理
- 用户配置
- 预设提示词(Mask)管理
- 插件管理

### 国际化

应用支持多语言，国际化文件存放在`app/locales/`目录下。

### 桌面应用

通过Tauri框架，应用可以打包为桌面应用，相关代码在`src-tauri/`目录下。

## 开发指南

### 安装依赖

```bash
yarn install
```

### 开发模式

```bash
yarn dev  # 开发Web应用
yarn app:dev  # 开发桌面应用
```

### 构建

```bash
yarn build  # 构建Web应用
yarn app:build  # 构建桌面应用
```

### 测试

```bash
yarn test  # 运行测试
```

## 扩展开发

### 添加新的AI模型支持

1. 在`app/api/`目录下创建新的API接口文件
2. 在`app/components/model-config.tsx`中添加模型配置
3. 在`app/store/config.ts`中更新模型列表

### 添加新的预设提示词(Mask)

在`app/masks/`目录下添加新的预设提示词模板。

### 添加新的UI组件

在`app/components/`目录下创建新的组件文件，并在需要的地方引入使用。

## 注意事项

- 项目使用TypeScript开发，请确保类型定义正确
- 组件样式使用SCSS模块，文件命名为`*.module.scss`
- 项目使用ESLint和Prettier进行代码规范检查，提交前请确保代码符合规范

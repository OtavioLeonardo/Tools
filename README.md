# 工作台 — 在线工具集

一个**粗野主义**风格的在线工具集合网站，把所有常用工具汇集在一个工作台里。

**14 个工具** / **纯静态输出** / **一个工具一个文件夹**

## 快速开始

```bash
npm install
npm run dev     # 开发服务器 → http://localhost:3000
npm run build   # 构建 → dist/
```

`dist/` 目录可直接部署到任意静态服务器（Nginx / Vercel / GitHub Pages 等）。

## 工具列表

| 工具 | 分类 | 说明 |
|---|---|---|
| 图片格式互转 | 图片 | PNG / JPEG / WebP / SVG 互转 |
| 图片缩放 | 图片 | 按像素或文件大小调整 |
| 图片转 Base64 | 图片 | 图片转 Data URL，复制 MD/HTML/CSS |
| 图片取色器 | 图片 | 提取主色调和调色板 |
| 图片水印 | 图片 | 文字或图片水印，九宫格定位 |
| 颜色转换器 | 颜色 | HEX/RGB/HSL 互转，取色器 |
| 二维码生成器 | 编码 | 网址/文本转二维码，可调尺寸颜色 |
| BASE64 编解码 | 编码 | 文本 Base64 编码和解码 |
| JSON FORMATTER | 数据 | JSON 格式化、压缩、校验 |
| URL 解析器 | 网络 | 拆解协议、域名、路径、查询参数 |
| 字符统计 | 文本 | 字数/词数/阅读时间，支持 Markdown |
| 随机码生成器 | 安全 | 控制长度和字符类型的密码生成 |
| AI 翻译 | AI | 调用 AI API 进行文本翻译 |
| 摘要总结 | AI | 长文/URL → 要点摘要 |

## 添加新工具

1. 在 `tools/` 下新建文件夹：

```
tools/my-tool/
├── meta.json     # 工具元数据
└── page.tsx      # 工具组件（React 客户端组件）
```

2. `meta.json` 格式：

```json
{
  "name": "工具名称",
  "description": "一句话描述",
  "tags": ["分类标签"],
  "category": "编码",
  "ai": false
}
```

- `category` 可选值：`ai` `image` `text` `data` `encode` `web` `security` `color`
- `ai: true` 的工具可以使用 AI 配置，调用 `useAIConfig()` hook

3. `page.tsx` 导出默认组件即可：

```tsx
"use client";
export default function MyTool() {
  return <div>Hello</div>;
}
```

4. 重新 `npm run dev` 或 `npm run build`，构建脚本会自动扫描并注册。

## AI 配置

- 点击侧边栏左下角 ⚡ AI 配置
- 支持服务商预设：DeepSeek / OpenAI / Anthropic / Ollama / 自定义
- API Key 等配置保存在浏览器 `localStorage`

AI 工具示例代码：

```tsx
import { useAIConfig } from "@/app/components/ai-provider";

function MyAITool() {
  const { config } = useAIConfig();
  // config.apiUrl, config.apiKey, config.model, ...
}
```

## 项目结构

```
Tools/
├── app/                       # Next.js App Router
│   ├── layout.tsx             # 根布局（侧边栏 + 内容区）
│   ├── page.tsx               # 工作台首页
│   ├── globals.css            # 粗野主义全局样式
│   ├── tools/[slug]/page.tsx  # 工具动态路由
│   └── components/
│       ├── sidebar.tsx        # 侧边栏导航
│       ├── ai-provider.tsx    # AI 配置 Context
│       └── ai-settings.tsx    # AI 配置弹窗
├── tools/                     # 工具集合（一个文件夹一个工具）
│   └── example/
│       ├── meta.json
│       └── page.tsx
├── lib/                       # 运行时库
│   ├── tools.ts               # 自动生成：工具注册表
│   └── tools-generated.ts    # 自动生成：组件导入映射
├── scripts/
│   └── generate-routes.mjs    # 扫描 tools/ 生成路由
├── public/
│   └── favicon.svg
├── next.config.ts             # output: "export"
└── package.json
```

## 技术栈

- [Next.js](https://nextjs.org) 15 + App Router
- TypeScript
- 纯静态导出 (`output: "export"`)
- 零运行时依赖（除 `qrcode` 库）
- 所有工具纯客户端渲染（Canvas API / Web Crypto 等）

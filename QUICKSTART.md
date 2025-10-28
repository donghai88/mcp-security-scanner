# 快速开始

## 步骤 1: 生成图标
```bash
npm install
npm run generate-icons
```
或者：在浏览器打开 `create-icons.html`，手动下载3个图标文件

## 步骤 2: 加载扩展到 Chrome  
1. Chrome 打开 `chrome://extensions/`
2. 开启"开发者模式"
3. "加载已解压的扩展" → 选择本目录

## 步骤 3: 启动测试服务器
```bash
npm start
```

## 步骤 4: 开始扫描
点击扩展图标 → "开始扫描"

## 预期结果
- 发现 localhost:3001 的 MCP 服务器
- 显示"无认证"警告  
- 可获取工具列表

这证明了 Chrome 扩展可以绕过沙箱访问本地 MCP 服务！

## 如何防护
1. 使用 stdio 传输（推荐）
2. 添加 API Key 认证
3. 停止不需要的服务

详见原文: https://www.koi.ai/blog/trust-me-im-local-chrome-extensions-mcp-and-the-sandbox-escape

# Quick Start Guide

## Step 1: Generate Icons
```bash
npm install
npm run generate-icons
```
Or: Open `create-icons.html` in browser and manually download the 3 icon files

## Step 2: Load Extension in Chrome  
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" → select this directory

## Step 3: Start Test Server
```bash
npm start
```

## Step 4: Start Scanning
Click the extension icon → "Start Scan"

## Expected Results
- Find MCP server on localhost:3001
- Display "No Authentication" warning  
- Retrieve tools list

This demonstrates that Chrome extensions can bypass the sandbox to access local MCP services!

## Security Recommendations
1. Use stdio transport (recommended)
2. Add API Key authentication
3. Stop unnecessary services

See original article: https://www.koi.ai/blog/trust-me-im-local-chrome-extensions-mcp-and-the-sandbox-escape


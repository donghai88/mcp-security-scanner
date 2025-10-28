# MCP Security Scanner

[English](README.md) | [中文](README_CN.md)

A Chrome extension for scanning security risks in local development environments.

**Detection Scope**: MCP servers, Web development servers, databases, API services, and more.

## ⚠️ Disclaimer
**For security research and testing your own systems only.**

## Quick Start

1. Install dependencies: `npm install`
2. Generate icons: `npm run generate-icons` (or use `create-icons.html`)
3. Start test server: `npm start`
4. Load extension in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the project directory
5. Click the extension icon to start scanning

For detailed instructions, see `QUICKSTART.md`

## Features
- 🔍 Scan local development services (MCP, web servers, databases, etc.)
- 🔐 Detect SSE and HTTP endpoints
- ⚠️ Identify unauthenticated servers
- 📋 Retrieve exposed tool lists
- 🎯 Support 30+ common development ports

## Use Cases
- **Security Audit**: Check for accidentally exposed services in development environments
- **Learning & Research**: Understand Chrome extension security boundaries
- **Team Collaboration**: Standardize security scanning practices across teams

## Background

This project was inspired by [Koi.ai's research on Chrome extensions and MCP security](https://www.koi.ai/blog/trust-me-im-local-chrome-extensions-mcp-and-the-sandbox-escape). While attempting to replicate the findings, we discovered that the actual risk is more limited than described, as most MCP servers use stdio mode (which Chrome extensions cannot access) rather than network-based transports.

As a result, the project evolved into a general-purpose development environment security auditing tool.

## Technical Details

### What is MCP?

MCP (Model Context Protocol) is a protocol for AI agents to interact with system tools and resources. It supports three transport modes:

1. **stdio** (mainstream ~90%) - Communication via standard input/output, no network ports
2. **Server-Sent Events (SSE)** - HTTP-based server push
3. **Streamable HTTP** - Standard HTTP POST requests

### How It Works

The extension scans common development ports (3000-9000) and attempts to:
1. Establish connections using SSE and HTTP protocols
2. Identify MCP servers and other development services
3. Detect authentication status
4. Retrieve available tools and capabilities

## Architecture

```
┌─────────────────┐
│  popup.html/js  │  ← User Interface
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  background.js  │  ← Scanner Logic
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  localhost:*    │  ← Local Services
└─────────────────┘
```

## Project Structure

```
mcp-security-scanner/
├── manifest.json          # Chrome extension manifest
├── popup.html/js          # Extension UI
├── background.js          # Background scanner
├── test-mcp-server.js     # Test MCP server (demo)
├── generate-icons.js      # Icon generator
└── enhanced-scanner.js    # Enhanced scanner (future)
```

## Development

### Prerequisites
- Node.js 16+
- Chrome/Edge browser

### Running Tests
```bash
# Start test server
npm start

# The test server will run on localhost:3001
# It exposes intentionally vulnerable endpoints for testing
```

### Building
```bash
# Install dependencies
npm install

# Generate icons
npm run generate-icons
```

## Security Considerations

### Real-World Risk Assessment

Based on our research, the actual security risk is lower than initially assumed:

| Scenario | Transport Mode | Prevalence | Chrome Accessible | Actual Risk |
|----------|---------------|------------|-------------------|-------------|
| Claude Desktop, etc. | stdio | ~90% | ❌ No | None |
| Remote MCP Services | SSE/HTTP | ~8% | ❌ No | None |
| Local Development | SSE/HTTP | ~2% | ✅ Yes | Low |

### Recommendations

- ✅ **Use stdio mode** (most secure)
- ✅ **Add authentication** if using SSE/HTTP mode
- ✅ **Close test servers** after development
- ✅ **Audit Chrome extensions** regularly
- ⚠️ **Don't panic**, but stay vigilant

## Related Research

- [Koi.ai - Trust Me, I'm Local: Chrome Extensions, MCP, and the Sandbox Escape](https://www.koi.ai/blog/trust-me-im-local-chrome-extensions-mcp-and-the-sandbox-escape)
- [MCP Protocol Specification](https://spec.modelcontextprotocol.io/)
- [Chrome Extension Security Best Practices](https://developer.chrome.com/docs/extensions/develop/concepts/security)

## Future Ideas

If you want to extend this project:
- Add more service fingerprints (databases, message queues, etc.)
- Implement history tracking and comparison
- Export scan reports (JSON/CSV/HTML)
- Support custom scan rules and port ranges
- Firefox extension support

**Note**: This project is archived as a research study. Feel free to fork and extend it for your own use.

## Project Status

**Version**: 1.0.0 | **Status**: Archived / Research Complete

This project is completed as a security research and learning exercise. Key findings:
- MCP's actual security risk is lower than expected (most use stdio mode)
- Chrome extensions can access localhost, but real-world threat scenarios are limited
- Project evolved into a general development environment security audit tool

Feel free to fork and extend if you need additional features.

## License

MIT License - See LICENSE file for details

## Disclaimer

**For research and educational purposes only. Unauthorized access to systems you don't own is illegal.**

---

**Note**: This tool is intended for security research and auditing your own development environment. Always obtain proper authorization before scanning any systems.


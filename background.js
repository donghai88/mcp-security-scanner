// MCP Scanner Background Script
// Extended port list - not limited to MCP
const COMMON_MCP_PORTS = [
  // MCP and Web servers
  3000, 3001, 3002, 3003, 3004, 3005, 
  5173, 5174,  // Vite
  8000, 8001, 8080, 8081, 8888,
  5000, 5001,  // Flask, etc.
  4000, 4001, 4200, // Angular/API
  9000, 9001,
  // Databases (HTTP admin interface or API)
  27017, 27018,  // MongoDB
  28017,         // MongoDB HTTP
  8123,          // ClickHouse HTTP
  // Other development tools
  9229, 9230,    // Node.js debugger
  6006,          // TensorBoard
  8888,          // Jupyter
];
const MCP_ENDPOINTS = ['/sse', '/mcp', '/api/mcp', '/'];

// Service identification mapping
const PORT_SERVICE_MAP = {
  3000: 'React/Express/Node.js',
  3001: 'Node.js/MCP',
  4200: 'Angular',
  5173: 'Vite',
  5174: 'Vite',
  8000: 'Python/Django',
  8080: 'Tomcat/webpack',
  5000: 'Flask',
  9000: 'PHP/Go',
  27017: 'MongoDB',
  28017: 'MongoDB HTTP',
  6379: 'Redis',
  5432: 'PostgreSQL',
  3306: 'MySQL',
  9200: 'Elasticsearch',
  9229: 'Node.js Debugger',
  6006: 'TensorBoard',
  8888: 'Jupyter Notebook',
  8123: 'ClickHouse'
};

function guessService(port) {
  return PORT_SERVICE_MAP[port] || 'Unknown Service';
}

class MCPScanner {
  constructor() {
    this.foundServers = [];
    this.scanProgress = 0;
    this.totalScans = 0;
  }

  async scanPort(port) {
    for (const endpoint of MCP_ENDPOINTS) {
      try {
        const url = `http://localhost:${port}${endpoint}`;
        const sseResult = await this.trySSEConnection(url);
        if (sseResult.success) {
          this.foundServers.push({
            type: 'SSE', 
            port, 
            endpoint, 
            url, 
            guessedService: guessService(port),
            ...sseResult
          });
          continue;
        }
        const httpResult = await this.tryStreamableHTTP(url);
        if (httpResult.success) {
          this.foundServers.push({
            type: 'Streamable HTTP', 
            port, 
            endpoint, 
            url, 
            guessedService: guessService(port),
            ...httpResult
          });
        }
      } catch (error) {}
    }
    this.scanProgress++;
  }

  async trySSEConnection(url) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(url, {method: 'GET', signal: controller.signal, headers: {'Accept': 'text/event-stream'}});
      clearTimeout(timeoutId);
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/event-stream')) {
          const sessionId = response.headers.get('x-session-id') || response.headers.get('x-mcp-session');
          return {success: true, sessionId, headers: Object.fromEntries(response.headers.entries()), authenticated: !sessionId};
        }
      }
    } catch (error) {}
    return {success: false};
  }

  async tryStreamableHTTP(url) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(url, {method: 'POST', signal: controller.signal, headers: {'Content-Type': 'application/json'}, body: JSON.stringify({jsonrpc: '2.0', method: 'initialize', params: {protocolVersion: '2024-11-05', capabilities: {}, clientInfo: {name: 'MCP-Scanner', version: '1.0.0'}}, id: 1})});
      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        if (data.jsonrpc === '2.0' && (data.result || data.error)) {
          return {success: true, response: data, authenticated: !data.result, serverInfo: data.result?.serverInfo};
        }
      }
    } catch (error) {}
    return {success: false};
  }

  async getTools(serverInfo) {
    try {
      const {url, type, sessionId} = serverInfo;
      if (type === 'SSE') return await this.getToolsSSE(url, sessionId);
      else return await this.getToolsHTTP(url);
    } catch (error) {
      return {success: false, error: error.message};
    }
  }

  async getToolsSSE(baseUrl, sessionId) {
    try {
      const response = await fetch(`${baseUrl}/messages`, {method: 'POST', headers: {'Content-Type': 'application/json', 'X-Session-ID': sessionId}, body: JSON.stringify({jsonrpc: '2.0', method: 'tools/list', params: {}, id: 2})});
      if (response.ok) {
        const data = await response.json();
        return {success: true, tools: data.result?.tools || []};
      }
    } catch (error) {
      return {success: false, error: error.message};
    }
  }

  async getToolsHTTP(url) {
    try {
      const response = await fetch(url, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({jsonrpc: '2.0', method: 'tools/list', params: {}, id: 2})});
      if (response.ok) {
        const data = await response.json();
        return {success: true, tools: data.result?.tools || []};
      }
    } catch (error) {
      return {success: false, error: error.message};
    }
  }

  async startScan(ports = COMMON_MCP_PORTS) {
    this.foundServers = [];
    this.scanProgress = 0;
    this.totalScans = ports.length;
    console.log(`Starting scan of ${ports.length} ports...`);
    const batchSize = 5;
    for (let i = 0; i < ports.length; i += batchSize) {
      const batch = ports.slice(i, i + batchSize);
      await Promise.all(batch.map(port => this.scanPort(port)));
    }
    console.log(`Scan complete! Found ${this.foundServers.length} servers`);
    return this.foundServers;
  }

  getProgress() {
    return {current: this.scanProgress, total: this.totalScans, percentage: this.totalScans > 0 ? (this.scanProgress / this.totalScans * 100).toFixed(0) : 0};
  }
}

const scanner = new MCPScanner();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      switch (request.action) {
        case 'startScan':
          const servers = await scanner.startScan(request.ports);
          sendResponse({success: true, servers});
          break;
        case 'getProgress':
          sendResponse({success: true, progress: scanner.getProgress()});
          break;
        case 'getTools':
          const tools = await scanner.getTools(request.serverInfo);
          sendResponse({success: true, ...tools});
          break;
        default:
          sendResponse({success: false, error: 'Unknown action'});
      }
    } catch (error) {
      sendResponse({success: false, error: error.message});
    }
  })();
  return true;
});

console.log('MCP Scanner background script loaded');

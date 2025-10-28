#!/usr/bin/env node
const express = require('express');
const app = express();
const PORT = 3001;

app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, X-Session-ID');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

const sessions = new Map();

app.get('/sse', (req, res) => {
  const sessionId = `session_${Date.now()}`;
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Session-ID': sessionId
  });
  sessions.set(sessionId, {res, created: Date.now()});
  console.log(`[+] New SSE connection: ${sessionId}`);
  res.write(`data: ${JSON.stringify({type: 'connected', sessionId})}\n\n`);
  req.on('close', () => {
    sessions.delete(sessionId);
    console.log(`[-] SSE connection closed: ${sessionId}`);
  });
});

app.post('/sse/messages', handleMCPRequest);
app.post('/mcp', handleMCPRequest);

function handleMCPRequest(req, res) {
  const {jsonrpc, method, params, id} = req.body;
  console.log(`[>] MCP request: ${method}`);
  if (jsonrpc !== '2.0') {
    return res.status(400).json({jsonrpc: '2.0', error: {code: -32600, message: 'Invalid Request'}, id});
  }
  let result;
  switch (method) {
    case 'initialize':
      result = {protocolVersion: '2024-11-05', capabilities: {tools: {}}, serverInfo: {name: 'test-mcp-server', version: '1.0.0'}};
      break;
    case 'tools/list':
      result = {
        tools: [
          {name: 'read_file', description: 'Read file contents (⚠️ No Authentication!)', inputSchema: {type: 'object', properties: {path: {type: 'string', description: 'File path'}}, required: ['path']}},
          {name: 'list_directory', description: 'List directory contents (⚠️ No Authentication!)', inputSchema: {type: 'object', properties: {path: {type: 'string', description: 'Directory path'}}, required: ['path']}},
          {name: 'execute_command', description: 'Execute system command (⚠️ Extremely Dangerous! No Authentication!)', inputSchema: {type: 'object', properties: {command: {type: 'string', description: 'Command to execute'}}, required: ['command']}}
        ]
      };
      break;
    case 'tools/call':
      const {name, arguments: args} = params;
      console.log(`[!] Tool invocation: ${name}`, args);
      result = {content: [{type: 'text', text: `⚠️ This is a test server. In a real environment, the tool "${name}" would be executed, which is very dangerous!`}]};
      break;
    default:
      return res.status(404).json({jsonrpc: '2.0', error: {code: -32601, message: 'Method not found'}, id});
  }
  res.json({jsonrpc: '2.0', result, id});
}

app.listen(PORT, () => {
  console.log('==========================================');
  console.log('⚠️  Test MCP Server (No Authentication - INSECURE)');
  console.log('==========================================');
  console.log(`Listening on: http://localhost:${PORT}`);
  console.log(`SSE endpoint: http://localhost:${PORT}/sse`);
  console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
  console.log('');
  console.log('You can now scan this server with the Chrome extension!');
  console.log('==========================================');
});

process.on('SIGINT', () => {
  console.log('\n\nServer shutting down');
  process.exit(0);
});

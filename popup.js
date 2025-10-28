// MCP Scanner Popup Script
let currentServers = [];
let isScanning = false;

const scanBtn = document.getElementById('scanBtn');
const clearBtn = document.getElementById('clearBtn');
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const resultsContainer = document.getElementById('results');

scanBtn.addEventListener('click', async () => {
  if (isScanning) return;
  isScanning = true;
  scanBtn.disabled = true;
  scanBtn.innerHTML = '<span class="loading"></span> Scanning...';
  progressBar.style.display = 'block';
  resultsContainer.innerHTML = '';
  
  const progressInterval = setInterval(async () => {
    const response = await chrome.runtime.sendMessage({action: 'getProgress'});
    if (response.success) {
      const {percentage} = response.progress;
      progressFill.style.width = `${percentage}%`;
      progressText.textContent = `Scanning... ${percentage}%`;
    }
  }, 200);
  
  try {
    const response = await chrome.runtime.sendMessage({action: 'startScan'});
    clearInterval(progressInterval);
    progressBar.style.display = 'none';
    if (response.success) {
      currentServers = response.servers;
      displayResults(response.servers);
    } else {
      showStatus('Scan failed: ' + response.error, 'danger');
    }
  } catch (error) {
    clearInterval(progressInterval);
    progressBar.style.display = 'none';
    showStatus('Scan error: ' + error.message, 'danger');
  }
  isScanning = false;
  scanBtn.disabled = false;
  scanBtn.textContent = 'Start Scan';
});

clearBtn.addEventListener('click', () => {
  currentServers = [];
  resultsContainer.innerHTML = '<div class="empty-state"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg><div>Click "Start Scan" to find local services</div></div>';
});

function showStatus(message, type = 'info') {
  resultsContainer.innerHTML = `<div class="status ${type}">${message}</div>`;
}

function displayResults(servers) {
  if (servers.length === 0) {
    showStatus('✅ No accessible services found. Your system is relatively secure!', 'success');
    return;
  }
  const vulnerableCount = servers.filter(s => s.authenticated !== false).length;
  let html = `<div class="status ${vulnerableCount > 0 ? 'danger' : 'success'}">${vulnerableCount > 0 ? '⚠️' : '✅'} Found ${servers.length} server(s)${vulnerableCount > 0 ? `, ${vulnerableCount} without authentication (security risk)` : ''}</div>`;
  servers.forEach((server, index) => {
    const isVulnerable = server.authenticated !== false;
    html += createServerCard(server, index, isVulnerable);
  });
  resultsContainer.innerHTML = html;
  servers.forEach((server, index) => {
    const getToolsBtn = document.getElementById(`getTools-${index}`);
    const toolsList = document.getElementById(`toolsList-${index}`);
    if (getToolsBtn) {
      getToolsBtn.addEventListener('click', async () => {
        await getServerTools(server, index, getToolsBtn, toolsList);
      });
    }
  });
}

function createServerCard(server, index, isVulnerable) {
  const typeBadge = server.type === 'SSE' ? 'sse' : 'http';
  const serviceGuess = server.guessedService ? `<div><strong>Likely Service:</strong> ${server.guessedService}</div>` : '';
  return `<div class="server-card ${isVulnerable ? 'vulnerable' : ''}"><div class="server-header"><div class="server-title">${server.type} Server</div><div><span class="badge ${typeBadge}">${server.type}</span><span class="badge ${isVulnerable ? 'vulnerable' : 'secure'}">${isVulnerable ? 'No Auth' : 'Authenticated'}</span></div></div><div class="server-info"><div><strong>URL:</strong> ${server.url}</div><div><strong>Port:</strong> ${server.port}</div>${serviceGuess}${server.sessionId ? `<div><strong>Session ID:</strong> ${server.sessionId}</div>` : ''}${server.serverInfo ? `<div><strong>Server:</strong> ${server.serverInfo.name} v${server.serverInfo.version}</div>` : ''}</div>${isVulnerable ? `<div class="server-actions"><button class="btn-small" id="getTools-${index}">Get Tools</button><button class="btn-small" onclick="copyUrl('${server.url}')">Copy URL</button></div><div class="tools-list" id="toolsList-${index}"></div>` : '<div style="font-size: 12px; color: #4caf50; margin-top: 10px;">✅ This server requires authentication, relatively secure</div>'}</div>`;
}

async function getServerTools(server, index, button, toolsList) {
  button.disabled = true;
  button.innerHTML = '<span class="loading"></span> Loading...';
  try {
    const response = await chrome.runtime.sendMessage({action: 'getTools', serverInfo: server});
    if (response.success && response.tools) {
      displayTools(response.tools, toolsList);
      toolsList.classList.add('show');
      button.textContent = 'Hide Tools';
      button.onclick = () => {
        if (toolsList.classList.contains('show')) {
          toolsList.classList.remove('show');
          button.textContent = 'Get Tools';
        } else {
          toolsList.classList.add('show');
          button.textContent = 'Hide Tools';
        }
      };
    } else {
      toolsList.innerHTML = `<div style="color: #f44336;">Failed: ${response.error || 'Unknown error'}</div>`;
      toolsList.classList.add('show');
    }
  } catch (error) {
    toolsList.innerHTML = `<div style="color: #f44336;">Error: ${error.message}</div>`;
    toolsList.classList.add('show');
  }
  button.disabled = false;
}

function displayTools(tools, container) {
  if (!tools || tools.length === 0) {
    container.innerHTML = '<div style="color: #999;">No tools available</div>';
    return;
  }
  let html = `<div style="font-size: 12px; margin-bottom: 8px; color: #f44336; font-weight: 600;">⚠️ Found ${tools.length} callable tool(s) (no authentication required!)</div>`;
  tools.forEach(tool => {
    html += `<div class="tool-item"><div class="tool-name">🔧 ${tool.name}</div>${tool.description ? `<div class="tool-desc">${tool.description}</div>` : ''}</div>`;
  });
  container.innerHTML = html;
}

window.copyUrl = function(url) {
  navigator.clipboard.writeText(url).then(() => alert('URL copied to clipboard'));
};

console.log('MCP Scanner popup loaded');

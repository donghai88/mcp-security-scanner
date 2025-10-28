// 增强版扫描器 - 支持更多服务类型
const ENHANCED_SCAN_CONFIG = {
  // MCP 服务器
  mcp: {
    ports: [3000, 3001, 3002, 3003, 3004, 3005],
    endpoints: ['/sse', '/mcp', '/api/mcp'],
    category: 'MCP服务器',
    risk: 'high'
  },
  
  // 常见 Web 开发服务器
  webServers: {
    ports: [3000, 3001, 5000, 5173, 5174, 8000, 8080, 8081, 8888, 4200, 4000, 9000],
    endpoints: ['/'],
    category: 'Web开发服务器',
    risk: 'medium',
    identify: ['Vite', 'React', 'Vue', 'Next.js', 'Express', 'webpack']
  },
  
  // 数据库
  databases: {
    ports: [
      27017, 27018, 27019, // MongoDB
      6379, 6380,          // Redis
      5432, 5433,          // PostgreSQL
      3306, 3307,          // MySQL
      9200, 9300,          // Elasticsearch
    ],
    category: '数据库',
    risk: 'critical'
  },
  
  // API 服务
  apiServers: {
    ports: [8000, 8001, 8080, 8081, 9000, 9001, 4000, 4001],
    endpoints: ['/api', '/graphql', '/health', '/status', '/docs'],
    category: 'API服务',
    risk: 'medium'
  },
  
  // 其他常见服务
  others: {
    ports: [
      9229,  // Node.js debug
      5858,  // Node.js legacy debug
      2375,  // Docker API
      8888,  // Jupyter
      6006,  // TensorBoard
      4040,  // Spark UI
    ],
    category: '其他开发工具',
    risk: 'high'
  }
};

// 服务指纹识别
const SERVICE_FINGERPRINTS = {
  'MongoDB': {
    pattern: /MongoDB/i,
    defaultPort: 27017,
    description: '未授权访问可能导致数据泄露'
  },
  'Redis': {
    pattern: /Redis/i,
    defaultPort: 6379,
    description: '无密码的 Redis 可被远程执行命令'
  },
  'PostgreSQL': {
    pattern: /PostgreSQL/i,
    defaultPort: 5432,
    description: '检查是否需要密码认证'
  },
  'MySQL': {
    pattern: /MySQL/i,
    defaultPort: 3306,
    description: '确保 root 用户有密码'
  },
  'Elasticsearch': {
    pattern: /elasticsearch/i,
    defaultPort: 9200,
    description: '无认证的 ES 可被任意读写'
  },
  'Docker': {
    pattern: /Docker/i,
    defaultPort: 2375,
    description: '暴露的 Docker API 可执行容器命令'
  },
  'Vite': {
    pattern: /vite/i,
    defaultPort: 5173,
    description: '开发服务器，生产环境应关闭'
  },
  'webpack-dev-server': {
    pattern: /webpack/i,
    defaultPort: 8080,
    description: '开发服务器，生产环境应关闭'
  }
};

class EnhancedScanner {
  constructor() {
    this.results = [];
    this.scanProgress = 0;
  }

  async scanAllServices() {
    this.results = [];
    const allChecks = [];

    // 扫描所有配置的服务
    for (const [type, config] of Object.entries(ENHANCED_SCAN_CONFIG)) {
      for (const port of config.ports) {
        allChecks.push(this.checkPort(port, config, type));
      }
    }

    await Promise.all(allChecks);
    return this.generateReport();
  }

  async checkPort(port, config, type) {
    try {
      // 对于有 endpoints 的服务，检查 HTTP
      if (config.endpoints) {
        for (const endpoint of config.endpoints) {
          const result = await this.tryHttp(`http://localhost:${port}${endpoint}`);
          if (result.success) {
            this.results.push({
              type,
              port,
              endpoint,
              category: config.category,
              risk: config.risk,
              service: this.identifyService(result.response, port),
              ...result
            });
          }
        }
      } else {
        // 对于数据库等，尝试 TCP 连接（简化版：仍用 HTTP 探测）
        const result = await this.tryHttp(`http://localhost:${port}`);
        if (result.success || result.reachable) {
          this.results.push({
            type,
            port,
            category: config.category,
            risk: config.risk,
            ...result
          });
        }
      }
    } catch (error) {
      // 端口不可达，忽略
    }
  }

  async tryHttp(url) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const contentType = response.headers.get('content-type') || '';
      const server = response.headers.get('server') || '';
      
      let body = '';
      try {
        body = await response.text();
      } catch (e) {
        // 可能不是文本响应
      }

      return {
        success: true,
        reachable: true,
        status: response.status,
        contentType,
        server,
        body: body.substring(0, 500), // 只保留前500字符
        headers: Object.fromEntries(response.headers.entries())
      };
    } catch (error) {
      return { success: false, reachable: false };
    }
  }

  identifyService(response, port) {
    const searchText = `${response.server} ${response.body}`.toLowerCase();
    
    for (const [name, fingerprint] of Object.entries(SERVICE_FINGERPRINTS)) {
      if (fingerprint.pattern.test(searchText) || fingerprint.defaultPort === port) {
        return {
          name,
          description: fingerprint.description
        };
      }
    }
    
    return null;
  }

  generateReport() {
    const report = {
      scanTime: new Date().toISOString(),
      totalFound: this.results.length,
      byRisk: {
        critical: this.results.filter(r => r.risk === 'critical').length,
        high: this.results.filter(r => r.risk === 'high').length,
        medium: this.results.filter(r => r.risk === 'medium').length,
        low: this.results.filter(r => r.risk === 'low').length
      },
      byCategory: {},
      services: this.results
    };

    // 按类别统计
    this.results.forEach(r => {
      report.byCategory[r.category] = (report.byCategory[r.category] || 0) + 1;
    });

    return report;
  }
}

// 导出配置供其他文件使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EnhancedScanner, ENHANCED_SCAN_CONFIG, SERVICE_FINGERPRINTS };
}


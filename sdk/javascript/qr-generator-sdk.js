/**
 * QR Generator SDK for JavaScript
 * 
 * Usage:
 *   const client = new QRGeneratorClient({ apiKey: 'sk_...' });
 *   const qrCode = await client.qrCodes.create({ url: 'https://example.com' });
 */

class QRGeneratorClient {
  constructor(options) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl || 'https://your-domain.com/api/v1';
  }

  async request(method, path, data = null) {
    const url = `${this.baseUrl}${path}`;
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `API request failed: ${response.statusText}`);
    }

    return result;
  }

  // QR Codes API
  qrCodes = {
    list: async (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return this.request('GET', `/qr-codes${query ? `?${query}` : ''}`);
    },

    get: async (id) => {
      return this.request('GET', `/qr-codes/${id}`);
    },

    create: async (data) => {
      return this.request('POST', '/qr-codes', data);
    },

    update: async (id, data) => {
      return this.request('PUT', `/qr-codes/${id}`, data);
    },

    delete: async (id) => {
      return this.request('DELETE', `/qr-codes/${id}`);
    },
  };

  // Scans API
  scans = {
    list: async (qrCodeId, params = {}) => {
      const query = new URLSearchParams(params).toString();
      return this.request('GET', `/qr-codes/${qrCodeId}/scans${query ? `?${query}` : ''}`);
    },
  };

  // Webhooks API
  webhooks = {
    list: async (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return this.request('GET', `/webhooks${query ? `?${query}` : ''}`);
    },

    create: async (data) => {
      return this.request('POST', '/webhooks', data);
    },

    update: async (qrCodeId, webhookUrl, regenerateSecret = false) => {
      return this.request('POST', '/webhooks', {
        qrCodeId,
        webhookUrl,
        regenerateSecret,
      });
    },

    delete: async (qrCodeId) => {
      return this.request('DELETE', `/webhooks?qrCodeId=${qrCodeId}`);
    },

    logs: async (qrCodeId, params = {}) => {
      const query = new URLSearchParams(params).toString();
      return this.request('GET', `/webhooks/${qrCodeId}/logs${query ? `?${query}` : ''}`);
    },

    retry: async (qrCodeId, logId) => {
      return this.request('POST', `/webhooks/${qrCodeId}/logs`, { logId });
    },
  };

  // Usage API
  usage = {
    get: async (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return this.request('GET', `/usage${query ? `?${query}` : ''}`);
    },
  };
}

// Export for CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QRGeneratorClient;
}

if (typeof window !== 'undefined') {
  window.QRGeneratorClient = QRGeneratorClient;
}


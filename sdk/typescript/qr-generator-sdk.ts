/**
 * QR Generator SDK for TypeScript
 * 
 * Usage:
 *   import { QRGeneratorClient } from './qr-generator-sdk';
 *   const client = new QRGeneratorClient({ apiKey: 'sk_...' });
 *   const qrCode = await client.qrCodes.create({ url: 'https://example.com' });
 */

export interface ClientOptions {
  apiKey: string;
  baseUrl?: string;
}

export interface QRCode {
  id: string;
  userId: string;
  url: string;
  title?: string;
  description?: string;
  foregroundColor?: string;
  backgroundColor?: string;
  dotType?: string;
  cornerType?: string;
  logoUrl?: string;
  hasWatermark?: boolean;
  isDynamic?: boolean;
  expiresAt?: string;
  maxScans?: number;
  redirectUrl?: string;
  webhookUrl?: string;
  scanCount?: number;
  downloadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Scan {
  id: string;
  qrCodeId: string;
  scannedAt: string;
  userAgent?: string;
  ipAddress?: string;
  country?: string;
  city?: string;
  device?: string;
  browser?: string;
  os?: string;
}

export interface WebhookLog {
  id: string;
  qrCodeId: string;
  webhookUrl: string;
  payload?: any;
  responseStatus?: number;
  responseBody?: string;
  attempts: number;
  lastAttemptAt: string;
  isSuccessful: boolean;
  createdAt: string;
}

export interface ListResponse<T> {
  [key: string]: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface UsageStats {
  requestCount: number;
  errorCount: number;
  avgResponseTime: number;
  totalRequestSize: number;
  totalResponseSize: number;
}

export class QRGeneratorClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(options: ClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl || 'https://your-domain.com/api/v1';
  }

  private async request<T>(
    method: string,
    path: string,
    data?: any
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const options: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error || `API request failed: ${response.statusText}`
      );
    }

    return result as T;
  }

  // QR Codes API
  qrCodes = {
    list: async (params?: {
      limit?: number;
      offset?: number;
      search?: string;
    }): Promise<ListResponse<QRCode>> => {
      const query = new URLSearchParams(
        params as any
      ).toString();
      return this.request<ListResponse<QRCode>>(
        'GET',
        `/qr-codes${query ? `?${query}` : ''}`
      );
    },

    get: async (id: string): Promise<{ qrCode: QRCode }> => {
      return this.request<{ qrCode: QRCode }>('GET', `/qr-codes/${id}`);
    },

    create: async (
      data: Partial<QRCode>
    ): Promise<{ qrCode: QRCode }> => {
      return this.request<{ qrCode: QRCode }>('POST', '/qr-codes', data);
    },

    update: async (
      id: string,
      data: Partial<QRCode>
    ): Promise<{ qrCode: QRCode }> => {
      return this.request<{ qrCode: QRCode }>('PUT', `/qr-codes/${id}`, data);
    },

    delete: async (id: string): Promise<{ success: boolean }> => {
      return this.request<{ success: boolean }>('DELETE', `/qr-codes/${id}`);
    },
  };

  // Scans API
  scans = {
    list: async (
      qrCodeId: string,
      params?: {
        limit?: number;
        offset?: number;
        startDate?: string;
        endDate?: string;
      }
    ): Promise<ListResponse<Scan>> => {
      const query = new URLSearchParams(
        params as any
      ).toString();
      return this.request<ListResponse<Scan>>(
        'GET',
        `/qr-codes/${qrCodeId}/scans${query ? `?${query}` : ''}`
      );
    },
  };

  // Webhooks API
  webhooks = {
    list: async (params?: {
      qrCodeId?: string;
    }): Promise<{ webhooks: any[] }> => {
      const query = new URLSearchParams(
        params as any
      ).toString();
      return this.request<{ webhooks: any[] }>(
        'GET',
        `/webhooks${query ? `?${query}` : ''}`
      );
    },

    create: async (data: {
      qrCodeId: string;
      webhookUrl: string;
      regenerateSecret?: boolean;
    }): Promise<{ qrCodeId: string; webhookUrl: string; secret: string }> => {
      return this.request('POST', '/webhooks', data);
    },

    update: async (
      qrCodeId: string,
      webhookUrl: string,
      regenerateSecret = false
    ): Promise<{ qrCodeId: string; webhookUrl: string; secret?: string }> => {
      return this.request('POST', '/webhooks', {
        qrCodeId,
        webhookUrl,
        regenerateSecret,
      });
    },

    delete: async (qrCodeId: string): Promise<{ success: boolean }> => {
      return this.request(
        'DELETE',
        `/webhooks?qrCodeId=${qrCodeId}`
      );
    },

    logs: async (
      qrCodeId: string,
      params?: {
        limit?: number;
        offset?: number;
        status?: 'success' | 'failed';
      }
    ): Promise<ListResponse<WebhookLog>> => {
      const query = new URLSearchParams(
        params as any
      ).toString();
      return this.request<ListResponse<WebhookLog>>(
        'GET',
        `/webhooks/${qrCodeId}/logs${query ? `?${query}` : ''}`
      );
    },

    retry: async (
      qrCodeId: string,
      logId: string
    ): Promise<{ success: boolean; message: string }> => {
      return this.request('POST', `/webhooks/${qrCodeId}/logs`, { logId });
    },
  };

  // Usage API
  usage = {
    get: async (params?: {
      apiKeyId?: string;
      startDate?: string;
      endDate?: string;
    }): Promise<{
      usage: UsageStats;
      period: {
        startDate?: string;
        endDate?: string;
      };
    }> => {
      const query = new URLSearchParams(
        params as any
      ).toString();
      return this.request(
        'GET',
        `/usage${query ? `?${query}` : ''}`
      );
    },
  };
}


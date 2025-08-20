import http from './http';

export interface TenantSetting {
  id: string;
  tenantId: string;
  key: string;
  value: string;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface UpdateTenantSettingRequest {
  key: string;
  value: string;
}

export interface TokenExpirySetting {
  tokenExpiryMinutes: number;
}

export const tenantSettingsApi = {
  getAll: async (): Promise<TenantSetting[]> => {
    const res = await http.get('/api/tenant-settings');
    return res.data;
  },

  getByKey: async (key: string): Promise<TenantSetting> => {
    const res = await http.get(`/api/tenant-settings/${key}`);
    return res.data;
  },

  set: async (request: UpdateTenantSettingRequest): Promise<TenantSetting> => {
    const res = await http.post('/api/tenant-settings', request);
    return res.data;
  },

  delete: async (key: string): Promise<void> => {
    await http.delete(`/api/tenant-settings/${key}`);
  },

  getTokenExpiry: async (): Promise<TokenExpirySetting> => {
    const res = await http.get('/api/tenant-settings/token-expiry');
    return res.data;
  },

  setTokenExpiry: async (setting: TokenExpirySetting): Promise<TokenExpirySetting> => {
    const res = await http.post('/api/tenant-settings/token-expiry', setting);
    return res.data;
  },
};

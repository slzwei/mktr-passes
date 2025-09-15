import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Template {
  id: string;
  name: string;
  style: string;
  images: Array<{
    role: string;
    required: boolean;
    recommendedSize: { w: number; h: number };
  }>;
  fields: Array<{
    slot: string;
    key: string;
    label?: string;
    valueExpr: any;
  }>;
  variables: Array<{
    key: string;
    type: string;
    description: string;
    required: boolean;
    options?: string[];
  }>;
  hasBarcode: boolean;
  defaultColors?: {
    backgroundColor?: string;
    foregroundColor?: string;
    labelColor?: string;
  };
}

export interface PassData {
  templateId: string;
  variables: Record<string, any>;
  colors?: {
    backgroundColor?: string;
    foregroundColor?: string;
    labelColor?: string;
  };
  barcode?: {
    format: string;
    message: string;
    messageEncoding?: string;
    altText?: string;
  };
  images: Record<string, string>;
}

export interface AssetInfo {
  id: string;
  sha256: string;
  width: number;
  height: number;
  role: string;
  originalName: string;
}

export const apiService = {
  // Templates
  async getTemplates(): Promise<{ templates: Template[] }> {
    const response = await api.get('/templates');
    return response.data;
  },

  async getTemplate(id: string): Promise<{ template: Template }> {
    const response = await api.get(`/templates/${id}`);
    return response.data;
  },

  // Assets
  async uploadAsset(file: File, role?: string): Promise<AssetInfo> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/uploads', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      params: role ? { role } : {},
    });
    
    return response.data;
  },

  // Passes
  async validatePass(data: PassData): Promise<{ ok: boolean; errors: string[] }> {
    const response = await api.post('/passes/validate', data);
    return response.data;
  },

  async createPass(data: PassData): Promise<{ id: string; downloadUrl: string }> {
    const response = await api.post('/passes', data);
    return response.data;
  },

  async getPass(id: string): Promise<any> {
    const response = await api.get(`/passes/${id}`);
    return response.data;
  },

  // Download pass
  getPassDownloadUrl(id: string): string {
    return `/api/passes/${id}/download`;
  },
};

import http from './http';
import type {
  LocalizationLabel,
  CreateLocalizationLabelRequest,
  UpdateLocalizationLabelRequest,
  ImportTranslationsRequest,
  ExportTranslationsResponse,
  LocalizationAnalytics,
  PaginationRequest,
  PaginationResponse
} from '../types/localization';

export const localizationApi = {
  // Basic CRUD operations
  list: () => http.get<LocalizationLabel[]>('/api/localization'),
  
  getPaginated: (request: PaginationRequest) => 
    http.get<PaginationResponse<LocalizationLabel>>('/api/localization/paginated', { params: request }),
  
  getById: (id: string) => 
    http.get<LocalizationLabel>(`/api/localization/${id}`),
  
  create: (data: CreateLocalizationLabelRequest) => 
    http.post<LocalizationLabel>('/api/localization', data),
  
  update: (id: string, data: UpdateLocalizationLabelRequest) => 
    http.put<LocalizationLabel>(`/api/localization/${id}`, data),
  
  delete: (id: string) => 
    http.delete(`/api/localization/${id}`),

  // Search operations
  search: (searchTerm: string, language?: string) => 
    http.get<LocalizationLabel[]>('/api/localization/search', { 
      params: { searchTerm, language } 
    }),

  // Language management
  getSupportedLanguages: () => 
    http.get<string[]>('/api/localization/languages'),
  
  getTranslationsForLanguage: (language: string) => 
    http.get<Record<string, string>>(`/api/localization/languages/${language}/translations`),

  // Bulk operations
  bulkUpsert: (labels: LocalizationLabel[]) => 
    http.post<LocalizationLabel[]>('/api/localization/bulk', labels),

  // Import/Export
  importTranslations: (data: ImportTranslationsRequest) => 
    http.post<{ success: boolean }>('/api/localization/import', data),
  
  exportTranslations: () => 
    http.get<ExportTranslationsResponse>('/api/localization/export'),

  // Validation and analytics
  validateLanguage: (language: string) => 
    http.get<{ language: string; isValid: boolean }>(`/api/localization/validate/${language}`),
  
  getMissingTranslations: (language: string) => 
    http.get<string[]>(`/api/localization/missing/${language}`),
  
  getAnalytics: () => 
    http.get<LocalizationAnalytics>('/api/localization/analytics'),

  // Utility functions
  downloadTranslations: async () => {
    const response = await http.get<ExportTranslationsResponse>('/api/localization/export');
    const dataStr = JSON.stringify(response.data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `translations_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  uploadTranslations: async (file: File, language: string, overwriteExisting: boolean = false) => {
    const text = await file.text();
    const translations = JSON.parse(text);
    
    return http.post<{ success: boolean }>('/api/localization/import', {
      language,
      translations,
      overwriteExisting
    });
  }
};

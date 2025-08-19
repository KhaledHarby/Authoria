export interface LocalizationLabel {
  id: string;
  key: string;
  language: string;
  value: string;
  tenantId?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateLocalizationLabelRequest {
  key: string;
  language: string;
  value: string;
  tenantId?: string;
}

export interface UpdateLocalizationLabelRequest {
  id: string;
  key: string;
  language: string;
  value: string;
  tenantId?: string;
}

export interface LocalizationSearchRequest {
  searchTerm: string;
  language?: string;
  key?: string;
  tenantId?: string;
}

export interface ImportTranslationsRequest {
  language: string;
  translations: Record<string, string>;
  overwriteExisting: boolean;
}

export interface ExportTranslationsResponse {
  translations: Record<string, Record<string, string>>;
  exportedAt: string;
  totalLanguages: number;
  totalKeys: number;
}

export interface LanguageInfo {
  code: string;
  name: string;
  nativeName: string;
  translationCount: number;
  isComplete: boolean;
  completionPercentage: number;
}

export interface TranslationValidationResult {
  language: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  totalKeys: number;
  validKeys: number;
  invalidKeys: number;
}

export interface LocalizationAnalytics {
  totalLanguages: number;
  totalKeys: number;
  totalTranslations: number;
  languages: Array<{
    language: string;
    translationCount: number;
    totalKeys: number;
    completionPercentage: number;
    isComplete: boolean;
  }>;
}

export interface PaginationRequest {
  page: number;
  pageSize: number;
  searchTerm?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  filters?: Record<string, string>;
}

export interface PaginationResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

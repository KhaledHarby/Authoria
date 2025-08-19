import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Default translations
const defaultResources = {
	en: {
		translation: {
			// Common
			common: {
				loading: 'Loading...',
				error: 'Error',
				success: 'Success',
				save: 'Save',
				cancel: 'Cancel',
				delete: 'Delete',
				edit: 'Edit',
				create: 'Create',
				search: 'Search',
				filter: 'Filter',
				refresh: 'Refresh',
				export: 'Export',
				import: 'Import',
				actions: 'Actions',
				noData: 'No data available',
				confirmDelete: 'Are you sure you want to delete this item?',
				yes: 'Yes',
				no: 'No'
			},
			// Navigation
			navigation: {
				dashboard: 'Dashboard',
				users: 'Users',
				roles: 'Roles',
				permissions: 'Permissions',
				localization: 'Localization',
				audit: 'Audit',
				settings: 'Settings',
				profile: 'Profile',
				logout: 'Logout'
			},
			// Localization
			localization: {
				title: 'Localization Management',
				subtitle: 'Manage translations and language settings',
				translations: 'Translations',
				languages: 'Languages',
				keys: 'Translation Keys',
				values: 'Translation Values',
				addTranslation: 'Add Translation',
				editTranslation: 'Edit Translation',
				importTranslations: 'Import Translations',
				exportTranslations: 'Export Translations',
				languageCode: 'Language Code',
				translationKey: 'Translation Key',
				translationValue: 'Translation Value',
				missingTranslations: 'Missing Translations',
				completionStatus: 'Completion Status',
				validationErrors: 'Validation Errors',
				bulkImport: 'Bulk Import',
				bulkExport: 'Bulk Export'
			}
		}
	},
	ar: {
		translation: {
			// Common
			common: {
				loading: 'جاري التحميل...',
				error: 'خطأ',
				success: 'نجح',
				save: 'حفظ',
				cancel: 'إلغاء',
				delete: 'حذف',
				edit: 'تعديل',
				create: 'إنشاء',
				search: 'بحث',
				filter: 'تصفية',
				refresh: 'تحديث',
				export: 'تصدير',
				import: 'استيراد',
				actions: 'الإجراءات',
				noData: 'لا توجد بيانات متاحة',
				confirmDelete: 'هل أنت متأكد من حذف هذا العنصر؟',
				yes: 'نعم',
				no: 'لا'
			},
			// Navigation
			navigation: {
				dashboard: 'لوحة التحكم',
				users: 'المستخدمين',
				roles: 'الأدوار',
				permissions: 'الصلاحيات',
				localization: 'الترجمة',
				audit: 'التدقيق',
				settings: 'الإعدادات',
				profile: 'الملف الشخصي',
				logout: 'تسجيل الخروج'
			},
			// Localization
			localization: {
				title: 'إدارة الترجمة',
				subtitle: 'إدارة الترجمات وإعدادات اللغة',
				translations: 'الترجمات',
				languages: 'اللغات',
				keys: 'مفاتيح الترجمة',
				values: 'قيم الترجمة',
				addTranslation: 'إضافة ترجمة',
				editTranslation: 'تعديل الترجمة',
				importTranslations: 'استيراد الترجمات',
				exportTranslations: 'تصدير الترجمات',
				languageCode: 'رمز اللغة',
				translationKey: 'مفتاح الترجمة',
				translationValue: 'قيمة الترجمة',
				missingTranslations: 'الترجمات المفقودة',
				completionStatus: 'حالة الاكتمال',
				validationErrors: 'أخطاء التحقق',
				bulkImport: 'استيراد جماعي',
				bulkExport: 'تصدير جماعي'
			}
		}
	}
};

i18n
	.use(Backend)
	.use(LanguageDetector)
	.use(initReactI18next)
	.init({
		resources: defaultResources,
		lng: localStorage.getItem('i18nextLng') || 'en',
		fallbackLng: 'en',
		debug: process.env.NODE_ENV === 'development',
		interpolation: { 
			escapeValue: false 
		},
		backend: {
			loadPath: '/api/localization/languages/{{lng}}/translations',
			parse: (data: string) => {
				try {
					const parsed = JSON.parse(data);
					return { translation: parsed };
				} catch {
					return { translation: {} };
				}
			}
		},
		detection: {
			order: ['localStorage', 'navigator', 'htmlTag'],
			caches: ['localStorage']
		}
	});

export default i18n;




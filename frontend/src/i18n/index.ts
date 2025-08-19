import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Default translations for all supported languages
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
				no: 'No',
				close: 'Close',
				open: 'Open',
				back: 'Back',
				next: 'Next',
				previous: 'Previous',
				submit: 'Submit',
				reset: 'Reset',
				download: 'Download',
				upload: 'Upload',
				select: 'Select',
				all: 'All',
				none: 'None',
				checkAll: 'Check All',
				uncheckAll: 'Uncheck All'
			},
			// Navigation
			navigation: {
				dashboard: 'Dashboard',
				users: 'Users',
				roles: 'Roles',
				permissions: 'Permissions',
				localization: 'Localization',
				audit: 'Audit Logs',
				settings: 'Settings',
				profile: 'Profile',
				logout: 'Logout',
				language: 'Language',
				rtl: 'RTL',
				ltr: 'LTR'
			},
			// Auth
			auth: {
				login: 'Login',
				logout: 'Logout',
				email: 'Email',
				password: 'Password',
				forgotPassword: 'Forgot Password?',
				resetPassword: 'Reset Password',
				rememberMe: 'Remember Me',
				signIn: 'Sign In',
				signUp: 'Sign Up',
				invalidCredentials: 'Invalid email or password',
				loginSuccess: 'Login successful',
				logoutSuccess: 'Logout successful'
			},
			// Users
			users: {
				title: 'Users Management',
				subtitle: 'Manage system users and their roles',
				createUser: 'Create User',
				editUser: 'Edit User',
				deleteUser: 'Delete User',
				userDetails: 'User Details',
				firstName: 'First Name',
				lastName: 'Last Name',
				email: 'Email',
				phone: 'Phone',
				status: 'Status',
				role: 'Role',
				noRole: 'No Role',
				lastLogin: 'Last Login',
				never: 'Never',
				active: 'Active',
				inactive: 'Inactive',
				assignRole: 'Assign Role',
				removeRole: 'Remove Role'
			},
			// Roles
			roles: {
				title: 'Roles Management',
				subtitle: 'Manage user roles and permissions',
				createRole: 'Create Role',
				editRole: 'Edit Role',
				deleteRole: 'Delete Role',
				roleName: 'Role Name',
				roleDescription: 'Role Description',
				permissions: 'Permissions',
				assignedUsers: 'Assigned Users',
				permissionCount: 'Permission Count',
				userCount: 'User Count',
				assignPermissions: 'Assign Permissions',
				removePermissions: 'Remove Permissions'
			},
			// Permissions
			permissions: {
				title: 'Permissions Management',
				subtitle: 'Manage system permissions and access control',
				permissionName: 'Permission Name',
				permissionDescription: 'Permission Description',
				category: 'Category',
				action: 'Action',
				resource: 'Resource',
				assignedRoles: 'Assigned Roles',
				roleCount: 'Role Count',
				totalPermissions: 'Total Permissions',
				withRoles: 'With Roles',
				totalRoles: 'Total Roles',
				avgRolesPerPermission: 'Avg Roles/Permission',
				categories: 'Categories'
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
				bulkExport: 'Bulk Export',
				selectLanguage: 'Select Language',
				languageSettings: 'Language Settings'
			},
			// Audit
			audit: {
				title: 'Audit Logs',
				subtitle: 'View system activity and user actions',
				action: 'Action',
				actor: 'Actor',
				resource: 'Resource',
				timestamp: 'Timestamp',
				ipAddress: 'IP Address',
				userAgent: 'User Agent',
				duration: 'Duration',
				status: 'Status',
				details: 'Details',
				filterByAction: 'Filter by Action',
				filterByActor: 'Filter by Actor',
				filterByResource: 'Filter by Resource',
				filterByDate: 'Filter by Date'
			},
			// Dashboard
			dashboard: {
				title: 'Dashboard',
				welcome: 'Welcome to Authoria',
				overview: 'System Overview',
				totalUsers: 'Total Users',
				totalRoles: 'Total Roles',
				totalPermissions: 'Total Permissions',
				recentActivity: 'Recent Activity',
				systemHealth: 'System Health',
				quickActions: {
					title: 'Quick Actions',
					primary: 'Primary Actions',
					secondary: 'Secondary Actions',
					utilities: 'Utilities',
					addUser: 'Add User',
					addUserDesc: 'Create a new user in the system',
					createRole: 'Create Role',
					createRoleDesc: 'Create a new role with permissions',
					managePermissions: 'Manage Permissions',
					managePermissionsDesc: 'Manage system permissions',
					viewAudit: 'View Audit Logs',
					viewAuditDesc: 'View system activity logs',
					localization: 'Localization',
					localizationDesc: 'Manage system translations',
					settings: 'Settings',
					settingsDesc: 'Configure system settings',
					exportData: 'Export Data',
					exportDataDesc: 'Export system data',
					exportDataNotImplemented: 'Export data feature is not available yet',
					systemHealth: 'System Health',
					systemHealthDesc: 'Check system status',
					systemHealthNotImplemented: 'System health check feature is not available yet'
				}
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
				no: 'لا',
				close: 'إغلاق',
				open: 'فتح',
				back: 'رجوع',
				next: 'التالي',
				previous: 'السابق',
				submit: 'إرسال',
				reset: 'إعادة تعيين',
				download: 'تحميل',
				upload: 'رفع',
				select: 'اختيار',
				all: 'الكل',
				none: 'لا شيء',
				checkAll: 'تحديد الكل',
				uncheckAll: 'إلغاء تحديد الكل'
			},
			// Navigation
			navigation: {
				dashboard: 'لوحة التحكم',
				users: 'المستخدمين',
				roles: 'الأدوار',
				permissions: 'الصلاحيات',
				localization: 'الترجمة',
				audit: 'سجلات التدقيق',
				settings: 'الإعدادات',
				profile: 'الملف الشخصي',
				logout: 'تسجيل الخروج',
				language: 'اللغة',
				rtl: 'من اليمين لليسار',
				ltr: 'من اليسار لليمين'
			},
			// Auth
			auth: {
				login: 'تسجيل الدخول',
				logout: 'تسجيل الخروج',
				email: 'البريد الإلكتروني',
				password: 'كلمة المرور',
				forgotPassword: 'نسيت كلمة المرور؟',
				resetPassword: 'إعادة تعيين كلمة المرور',
				rememberMe: 'تذكرني',
				signIn: 'تسجيل الدخول',
				signUp: 'إنشاء حساب',
				invalidCredentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
				loginSuccess: 'تم تسجيل الدخول بنجاح',
				logoutSuccess: 'تم تسجيل الخروج بنجاح'
			},
			// Users
			users: {
				title: 'إدارة المستخدمين',
				subtitle: 'إدارة مستخدمي النظام وأدوارهم',
				createUser: 'إنشاء مستخدم',
				editUser: 'تعديل المستخدم',
				deleteUser: 'حذف المستخدم',
				userDetails: 'تفاصيل المستخدم',
				firstName: 'الاسم الأول',
				lastName: 'اسم العائلة',
				email: 'البريد الإلكتروني',
				phone: 'الهاتف',
				status: 'الحالة',
				role: 'الدور',
				noRole: 'لا يوجد دور',
				lastLogin: 'آخر تسجيل دخول',
				never: 'أبداً',
				active: 'نشط',
				inactive: 'غير نشط',
				assignRole: 'تعيين دور',
				removeRole: 'إزالة الدور'
			},
			// Roles
			roles: {
				title: 'إدارة الأدوار',
				subtitle: 'إدارة أدوار المستخدمين والصلاحيات',
				createRole: 'إنشاء دور',
				editRole: 'تعديل الدور',
				deleteRole: 'حذف الدور',
				roleName: 'اسم الدور',
				roleDescription: 'وصف الدور',
				permissions: 'الصلاحيات',
				assignedUsers: 'المستخدمون المعينون',
				permissionCount: 'عدد الصلاحيات',
				userCount: 'عدد المستخدمين',
				assignPermissions: 'تعيين الصلاحيات',
				removePermissions: 'إزالة الصلاحيات'
			},
			// Permissions
			permissions: {
				title: 'إدارة الصلاحيات',
				subtitle: 'إدارة صلاحيات النظام والتحكم في الوصول',
				permissionName: 'اسم الصلاحية',
				permissionDescription: 'وصف الصلاحية',
				category: 'الفئة',
				action: 'الإجراء',
				resource: 'المورد',
				assignedRoles: 'الأدوار المعينة',
				roleCount: 'عدد الأدوار',
				totalPermissions: 'إجمالي الصلاحيات',
				withRoles: 'مع الأدوار',
				totalRoles: 'إجمالي الأدوار',
				avgRolesPerPermission: 'متوسط الأدوار/الصلاحية',
				categories: 'الفئات'
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
				bulkExport: 'تصدير جماعي',
				selectLanguage: 'اختيار اللغة',
				languageSettings: 'إعدادات اللغة'
			},
			// Audit
			audit: {
				title: 'سجلات التدقيق',
				subtitle: 'عرض نشاط النظام وإجراءات المستخدمين',
				action: 'الإجراء',
				actor: 'الفاعل',
				resource: 'المورد',
				timestamp: 'الطابع الزمني',
				ipAddress: 'عنوان IP',
				userAgent: 'وكيل المستخدم',
				duration: 'المدة',
				status: 'الحالة',
				details: 'التفاصيل',
				filterByAction: 'تصفية حسب الإجراء',
				filterByActor: 'تصفية حسب الفاعل',
				filterByResource: 'تصفية حسب المورد',
				filterByDate: 'تصفية حسب التاريخ'
			},
			// Dashboard
			dashboard: {
				title: 'لوحة التحكم',
				welcome: 'مرحباً بك في Authoria',
				overview: 'نظرة عامة على النظام',
				totalUsers: 'إجمالي المستخدمين',
				totalRoles: 'إجمالي الأدوار',
				totalPermissions: 'إجمالي الصلاحيات',
				recentActivity: 'النشاط الأخير',
				systemHealth: 'صحة النظام',
				quickActions: {
					title: 'الإجراءات السريعة',
					primary: 'الإجراءات الأساسية',
					secondary: 'الإجراءات الثانوية',
					utilities: 'الأدوات المساعدة',
					addUser: 'إضافة مستخدم',
					addUserDesc: 'إنشاء مستخدم جديد في النظام',
					createRole: 'إنشاء دور',
					createRoleDesc: 'إنشاء دور جديد مع الصلاحيات',
					managePermissions: 'إدارة الصلاحيات',
					managePermissionsDesc: 'إدارة صلاحيات النظام',
					viewAudit: 'عرض سجلات التدقيق',
					viewAuditDesc: 'عرض سجلات نشاط النظام',
					localization: 'إدارة الترجمة',
					localizationDesc: 'إدارة ترجمات النظام',
					settings: 'الإعدادات',
					settingsDesc: 'تكوين إعدادات النظام',
					exportData: 'تصدير البيانات',
					exportDataDesc: 'تصدير بيانات النظام',
					exportDataNotImplemented: 'ميزة تصدير البيانات غير متاحة حالياً',
					systemHealth: 'صحة النظام',
					systemHealthDesc: 'فحص حالة النظام',
					systemHealthNotImplemented: 'ميزة فحص صحة النظام غير متاحة حالياً'
				}
			}
		}
	}
};

// Initialize i18n
i18n
	.use(Backend)
	.use(LanguageDetector)
	.use(initReactI18next)
	.init({
		resources: defaultResources,
		fallbackLng: 'en',
		debug: false,
		interpolation: {
			escapeValue: false,
		},
		backend: {
			loadPath: '/api/localization/languages/{{lng}}/translations',
		},
		detection: {
			order: ['localStorage', 'navigator'],
			caches: ['localStorage'],
		},
	});

export default i18n;




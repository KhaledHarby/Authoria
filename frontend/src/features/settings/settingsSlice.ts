import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface SettingsState {
  isRTL: boolean;
  language: string;
  darkMode: boolean;
  notifications: boolean;
  emailNotifications: boolean;
  autoSave: boolean;
  availableLanguages: Array<{
    code: string;
    name: string;
    nativeName: string;
    isRTL: boolean;
  }>;
}

// Define available languages
const availableLanguages = [
  { code: 'en', name: 'English', nativeName: 'English', isRTL: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', isRTL: true },
  { code: 'fr', name: 'French', nativeName: 'Français', isRTL: false },
  { code: 'es', name: 'Spanish', nativeName: 'Español', isRTL: false },
  { code: 'de', name: 'German', nativeName: 'Deutsch', isRTL: false },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', isRTL: false },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', isRTL: false },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', isRTL: false },
  { code: 'zh', name: 'Chinese', nativeName: '中文', isRTL: false },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', isRTL: false },
  { code: 'ko', name: 'Korean', nativeName: '한국어', isRTL: false },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', isRTL: false },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', isRTL: false },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', isRTL: false },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', isRTL: false },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', isRTL: false },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', isRTL: false },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', isRTL: false },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', isRTL: false },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', isRTL: true },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', isRTL: true },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', isRTL: true },
];

const initialState: SettingsState = {
  isRTL: false,
  language: 'en',
  darkMode: false,
  notifications: true,
  emailNotifications: true,
  autoSave: true,
  availableLanguages,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<string>) => {
      const languageCode = action.payload;
      const selectedLanguage = state.availableLanguages.find(lang => lang.code === languageCode);
      
      if (selectedLanguage) {
        state.language = languageCode;
        state.isRTL = selectedLanguage.isRTL;
      }
    },
    setRTL: (state, action: PayloadAction<boolean>) => {
      state.isRTL = action.payload;
    },
    toggleRTL: (state) => {
      state.isRTL = !state.isRTL;
    },
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
    },
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.darkMode = action.payload;
    },
    setNotifications: (state, action: PayloadAction<boolean>) => {
      state.notifications = action.payload;
      if (!action.payload) {
        state.emailNotifications = false;
      }
    },
    setEmailNotifications: (state, action: PayloadAction<boolean>) => {
      state.emailNotifications = action.payload;
    },
    setAutoSave: (state, action: PayloadAction<boolean>) => {
      state.autoSave = action.payload;
    },
    initializeSettings: (state) => {
      // Get settings from localStorage
      const savedLanguage = localStorage.getItem('authoria-language');
      const savedDarkMode = localStorage.getItem('authoria-dark-mode');
      const savedNotifications = localStorage.getItem('authoria-notifications');
      const savedEmailNotifications = localStorage.getItem('authoria-email-notifications');
      const savedAutoSave = localStorage.getItem('authoria-auto-save');
      
      // Language
      const browserLanguage = navigator.language.split('-')[0];
      const defaultLanguage = savedLanguage || browserLanguage || 'en';
      const selectedLanguage = state.availableLanguages.find(lang => lang.code === defaultLanguage);
      if (selectedLanguage) {
        state.language = defaultLanguage;
        state.isRTL = selectedLanguage.isRTL;
      }
      
      // Dark mode
      if (savedDarkMode !== null) {
        state.darkMode = savedDarkMode === 'true';
      }
      
      // Notifications
      if (savedNotifications !== null) {
        state.notifications = savedNotifications === 'true';
      }
      
      if (savedEmailNotifications !== null) {
        state.emailNotifications = savedEmailNotifications === 'true';
      }
      
      // Auto save
      if (savedAutoSave !== null) {
        state.autoSave = savedAutoSave === 'true';
      }
    },
  },
});

export const { 
  setLanguage, 
  setRTL, 
  toggleRTL, 
  toggleDarkMode,
  setDarkMode,
  setNotifications,
  setEmailNotifications,
  setAutoSave,
  initializeSettings 
} = settingsSlice.actions;
export default settingsSlice.reducer;

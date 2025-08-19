import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Button,
  Grid,
  Alert,
} from '@mui/material';
import {
  Language as LanguageIcon,
  Palette as PaletteIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { 
  setLanguage, 
  setDarkMode, 
  setNotifications, 
  setEmailNotifications, 
  setAutoSave 
} from './settingsSlice';
import { useTranslation } from 'react-i18next';
import Layout from '../../ui/Layout';

export default function SettingsPage() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { 
    language, 
    availableLanguages, 
    isRTL, 
    darkMode, 
    notifications, 
    emailNotifications, 
    autoSave 
  } = useSelector((state: RootState) => state.settings);
  
  const [showSuccess, setShowSuccess] = useState(false);

  const handleLanguageChange = (languageCode: string) => {
    dispatch(setLanguage(languageCode));
    localStorage.setItem('authoria-language', languageCode);
  };

  const handleDarkModeChange = (checked: boolean) => {
    dispatch(setDarkMode(checked));
    localStorage.setItem('authoria-dark-mode', checked.toString());
  };

  const handleNotificationsChange = (checked: boolean) => {
    dispatch(setNotifications(checked));
    localStorage.setItem('authoria-notifications', checked.toString());
  };

  const handleEmailNotificationsChange = (checked: boolean) => {
    dispatch(setEmailNotifications(checked));
    localStorage.setItem('authoria-email-notifications', checked.toString());
  };

  const handleAutoSaveChange = (checked: boolean) => {
    dispatch(setAutoSave(checked));
    localStorage.setItem('authoria-auto-save', checked.toString());
  };

  const handleSaveSettings = () => {
    // All settings are automatically saved to localStorage when changed
    // In a real app, you would also save these settings to the backend here
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const currentLanguage = availableLanguages.find(lang => lang.code === language);

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        {/* Page Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            {t('navigation.settings')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your application preferences and account settings
          </Typography>
        </Box>

        {showSuccess && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Settings saved successfully! Changes will take effect immediately.
          </Alert>
        )}

        {autoSave && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Auto-save is enabled. All changes are saved automatically.
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Language & Localization Settings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <LanguageIcon sx={{ mr: 2, color: 'primary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {t('localization.languageSettings')}
                  </Typography>
                </Box>
                
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>{t('localization.selectLanguage')}</InputLabel>
                  <Select
                    value={language}
                    label={t('localization.selectLanguage')}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                  >
                    {availableLanguages.map((lang) => (
                      <MenuItem key={lang.code} value={lang.code}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                          <span>{lang.nativeName}</span>
                          <Typography variant="caption" color="text.secondary">
                            {lang.isRTL ? t('navigation.rtl') : t('navigation.ltr')}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Alert severity="info" sx={{ mb: 2 }}>
                  <strong>Current Language:</strong> {currentLanguage?.nativeName} ({currentLanguage?.name})
                  <br />
                  <strong>Text Direction:</strong> {isRTL ? 'Right to Left (RTL)' : 'Left to Right (LTR)'}
                </Alert>
              </CardContent>
            </Card>
          </Grid>

          {/* Appearance Settings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <PaletteIcon sx={{ mr: 2, color: 'primary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Appearance
                  </Typography>
                </Box>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={darkMode}
                      onChange={(e) => handleDarkModeChange(e.target.checked)}
                    />
                  }
                  label="Dark Mode"
                  sx={{ mb: 2 }}
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={autoSave}
                      onChange={(e) => handleAutoSaveChange(e.target.checked)}
                    />
                  }
                  label="Auto-save changes"
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Notification Settings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <NotificationsIcon sx={{ mr: 2, color: 'primary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Notifications
                  </Typography>
                </Box>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={notifications}
                      onChange={(e) => handleNotificationsChange(e.target.checked)}
                    />
                  }
                  label="Enable notifications"
                  sx={{ mb: 2 }}
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={emailNotifications}
                      onChange={(e) => handleEmailNotificationsChange(e.target.checked)}
                      disabled={!notifications}
                    />
                  }
                  label="Email notifications"
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Security Settings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <SecurityIcon sx={{ mr: 2, color: 'primary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Security
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Manage your security preferences and authentication settings.
                </Typography>
                
                <Button variant="outlined" sx={{ mb: 1, display: 'block' }}>
                  Change Password
                </Button>
                
                <Button variant="outlined" sx={{ display: 'block' }}>
                  Two-Factor Authentication
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* Save Button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {autoSave ? 'Settings are automatically saved as you change them.' : 'Click save to apply your changes.'}
          </Typography>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveSettings}
            size="large"
            disabled={autoSave}
          >
            {t('common.save')} Settings
          </Button>
        </Box>
      </Box>
    </Layout>
  );
}

import { useState, useEffect } from 'react';
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
  TextField,
  CircularProgress,
} from '@mui/material';
import {
  Language as LanguageIcon,
  Palette as PaletteIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Save as SaveIcon,
  AccessTime as AccessTimeIcon,
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
import { tenantSettingsApi, type TokenExpirySetting } from '../../api/tenantSettingsApi';

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
  const [tokenExpiry, setTokenExpiry] = useState<TokenExpirySetting>({ tokenExpiryMinutes: 50 });
  const [tokenExpiryLoading, setTokenExpiryLoading] = useState(false);
  const [tokenExpiryError, setTokenExpiryError] = useState<string | null>(null);

  useEffect(() => {
    const loadTokenExpiry = async () => {
      try {
        const setting = await tenantSettingsApi.getTokenExpiry();
        setTokenExpiry(setting);
      } catch (error) {
        console.error('Failed to load token expiry setting:', error);
      }
    };
    loadTokenExpiry();
  }, []);

  const handleTokenExpiryChange = async () => {
    if (tokenExpiry.tokenExpiryMinutes <= 0) {
      setTokenExpiryError('Token expiry must be greater than 0 minutes');
      return;
    }

    setTokenExpiryLoading(true);
    setTokenExpiryError(null);
    
    try {
      const updated = await tenantSettingsApi.setTokenExpiry(tokenExpiry);
      setTokenExpiry(updated);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      setTokenExpiryError('Failed to update token expiry setting');
      console.error('Failed to update token expiry:', error);
    } finally {
      setTokenExpiryLoading(false);
    }
  };

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

          {/* Token Expiry Settings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <AccessTimeIcon sx={{ mr: 2, color: 'primary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Token Expiry
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Configure how long authentication tokens remain valid. Default is 50 minutes.
                </Typography>
                
                {tokenExpiryError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {tokenExpiryError}
                  </Alert>
                )}
                
                <TextField
                  label="Token Expiry (minutes)"
                  type="number"
                  value={tokenExpiry.tokenExpiryMinutes}
                  onChange={(e) => setTokenExpiry({ tokenExpiryMinutes: parseInt(e.target.value) || 0 })}
                  fullWidth
                  sx={{ mb: 2 }}
                  inputProps={{ min: 1, max: 43200 }} // Max 30 days
                  helperText="Minimum 1 minute, maximum 43,200 minutes (30 days)"
                />
                
                <Button
                  variant="outlined"
                  onClick={handleTokenExpiryChange}
                  disabled={tokenExpiryLoading}
                  startIcon={tokenExpiryLoading ? <CircularProgress size={16} /> : <SaveIcon />}
                  fullWidth
                >
                  {tokenExpiryLoading ? 'Updating...' : 'Update Token Expiry'}
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

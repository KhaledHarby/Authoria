import { useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Chip,
  useTheme,
} from '@mui/material';
import {
  Language as LanguageIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../app/store';
import { setLanguage } from '../features/settings/settingsSlice';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';

export function LanguageSelector() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const dispatch = useDispatch();
  const theme = useTheme();
  const { t } = useTranslation();
  const { language, availableLanguages } = useSelector((state: RootState) => state.settings);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (languageCode: string) => {
    dispatch(setLanguage(languageCode));
    // Save to localStorage
    localStorage.setItem('authoria-language', languageCode);
    // Change i18n language
    i18n.changeLanguage(languageCode);
    handleClose();
  };

  const currentLanguage = availableLanguages.find(lang => lang.code === language);

  return (
    <Box>
      <Button
        onClick={handleClick}
        startIcon={<LanguageIcon />}
        sx={{
          color: 'inherit',
          textTransform: 'none',
          minWidth: 'auto',
          px: 2,
          py: 1,
          borderRadius: 2,
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {currentLanguage?.nativeName || currentLanguage?.name}
          </Typography>
          <Chip
            label={currentLanguage?.isRTL ? t('navigation.rtl') : t('navigation.ltr')}
            size="small"
            sx={{
              height: 20,
              fontSize: '0.7rem',
              backgroundColor: currentLanguage?.isRTL 
                ? theme.palette.secondary.main 
                : theme.palette.primary.main,
              color: 'white',
            }}
          />
        </Box>
      </Button>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            maxHeight: 400,
            overflow: 'auto',
          },
        }}
      >
        <MenuItem disabled>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>
            {t('localization.selectLanguage')}
          </Typography>
        </MenuItem>
        
        {availableLanguages.map((lang) => (
          <MenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            selected={lang.code === language}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              py: 1.5,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                {lang.code === language && <CheckIcon color="primary" />}
              </ListItemIcon>
              <ListItemText
                primary={lang.nativeName}
                secondary={lang.name !== lang.nativeName ? lang.name : undefined}
                primaryTypographyProps={{
                  variant: 'body2',
                  fontWeight: lang.code === language ? 600 : 400,
                }}
                secondaryTypographyProps={{
                  variant: 'caption',
                  color: 'text.secondary',
                }}
              />
            </Box>
            <Chip
              label={lang.isRTL ? t('navigation.rtl') : t('navigation.ltr')}
              size="small"
              sx={{
                height: 18,
                fontSize: '0.65rem',
                backgroundColor: lang.isRTL 
                  ? theme.palette.secondary.light 
                  : theme.palette.primary.light,
                color: lang.isRTL 
                  ? theme.palette.secondary.contrastText 
                  : theme.palette.primary.contrastText,
              }}
            />
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}

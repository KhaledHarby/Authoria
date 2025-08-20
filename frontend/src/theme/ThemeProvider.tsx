import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import { useSelector } from 'react-redux';
import type { RootState } from '../app/store';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import i18n from '../i18n';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { isRTL, language, darkMode } = useSelector((state: RootState) => state.settings);

  // Update document direction when RTL changes
  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    
    // Update i18n language
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
    
    // Update body class for dark mode
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isRTL, language, darkMode]);

  const theme = createTheme({
    direction: isRTL ? 'rtl' : 'ltr',
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 900,
        lg: 1200,
        xl: 1536,
      },
    },
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#2563eb', // Modern blue
        light: '#3b82f6',
        dark: '#1d4ed8',
      },
      secondary: {
        main: '#7c3aed', // Modern purple
        light: '#8b5cf6',
        dark: '#6d28d9',
      },
      background: {
        default: darkMode ? '#0f172a' : '#f8fafc',
        paper: darkMode ? '#1e293b' : '#ffffff',
      },
      text: {
        primary: darkMode ? '#f1f5f9' : '#1e293b',
        secondary: darkMode ? '#94a3b8' : '#64748b',
      },
      divider: darkMode ? '#334155' : '#e2e8f0',
    },
    typography: {
      fontFamily: isRTL 
        ? '"Noto Sans Arabic", "Inter", "Roboto", "Helvetica", "Arial", sans-serif'
        : '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 700,
        fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
        lineHeight: 1.2,
      },
      h2: {
        fontWeight: 600,
        fontSize: 'clamp(1.25rem, 3vw, 2rem)',
        lineHeight: 1.3,
      },
      h3: {
        fontWeight: 600,
        fontSize: 'clamp(1.125rem, 2.5vw, 1.5rem)',
        lineHeight: 1.4,
      },
      h4: {
        fontWeight: 600,
        fontSize: 'clamp(1rem, 2vw, 1.25rem)',
        lineHeight: 1.4,
      },
      h5: {
        fontWeight: 600,
        fontSize: 'clamp(0.875rem, 1.5vw, 1.125rem)',
        lineHeight: 1.5,
      },
      h6: {
        fontWeight: 600,
        fontSize: 'clamp(0.75rem, 1.25vw, 1rem)',
        lineHeight: 1.5,
      },
      body1: {
        fontSize: 'clamp(0.875rem, 1vw, 1rem)',
        lineHeight: 1.6,
      },
      body2: {
        fontSize: 'clamp(0.75rem, 0.875vw, 0.875rem)',
        lineHeight: 1.6,
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
        fontSize: 'clamp(0.75rem, 0.875vw, 0.875rem)',
      },
      caption: {
        fontSize: 'clamp(0.625rem, 0.75vw, 0.75rem)',
        lineHeight: 1.5,
      },
      overline: {
        fontSize: 'clamp(0.625rem, 0.75vw, 0.75rem)',
        lineHeight: 1.5,
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 8,
            padding: '10px 24px',
            fontSize: 'clamp(0.75rem, 0.875vw, 0.875rem)',
            '@media (max-width: 600px)': {
              padding: '8px 16px',
              fontSize: '0.75rem',
            },
          },
          sizeSmall: {
            padding: '6px 16px',
            fontSize: 'clamp(0.625rem, 0.75vw, 0.75rem)',
            '@media (max-width: 600px)': {
              padding: '4px 12px',
              fontSize: '0.625rem',
            },
          },
          sizeLarge: {
            padding: '12px 32px',
            fontSize: 'clamp(0.875rem, 1vw, 1rem)',
            '@media (max-width: 600px)': {
              padding: '10px 24px',
              fontSize: '0.875rem',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            '@media (max-width: 600px)': {
              borderRadius: 12,
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            '@media (max-width: 600px)': {
              borderRadius: 8,
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiInputBase-root': {
              fontSize: 'clamp(0.875rem, 1vw, 1rem)',
              '@media (max-width: 600px)': {
                fontSize: '0.875rem',
              },
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            fontSize: 'clamp(0.75rem, 0.875vw, 0.875rem)',
            padding: '12px 16px',
            '@media (max-width: 600px)': {
              fontSize: '0.75rem',
              padding: '8px 12px',
            },
          },
          head: {
            fontWeight: 600,
            fontSize: 'clamp(0.75rem, 0.875vw, 0.875rem)',
            '@media (max-width: 600px)': {
              fontSize: '0.75rem',
            },
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-head': {
              backgroundColor: darkMode ? '#1e293b' : '#f8fafc',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontSize: 'clamp(0.625rem, 0.75vw, 0.75rem)',
            height: 'auto',
            '@media (max-width: 600px)': {
              fontSize: '0.625rem',
            },
          },
        },
      },
      MuiAvatar: {
        styleOverrides: {
          root: {
            fontSize: 'clamp(0.75rem, 0.875vw, 0.875rem)',
            '@media (max-width: 600px)': {
              fontSize: '0.75rem',
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            '@media (max-width: 600px)': {
              padding: 6,
            },
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            margin: '2px 8px',
            '@media (max-width: 600px)': {
              margin: '1px 4px',
              borderRadius: 6,
            },
          },
        },
      },
      MuiListItemIcon: {
        styleOverrides: {
          root: {
            minWidth: 40,
            '@media (max-width: 600px)': {
              minWidth: 36,
            },
          },
        },
      },
      MuiListItemText: {
        styleOverrides: {
          primary: {
            fontSize: 'clamp(0.875rem, 1vw, 1rem)',
            '@media (max-width: 600px)': {
              fontSize: '0.875rem',
            },
          },
        },
      },
      // RTL-specific component overrides
      MuiDrawer: {
        styleOverrides: {
          paper: {
            ...(isRTL && {
              borderRight: 'none',
              borderLeft: '1px solid rgba(0, 0, 0, 0.12)',
            }),
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            ...(isRTL && {
              marginLeft: '0 !important',
              marginRight: '280px !important',
            }),
          },
        },
      },
    },
  });

  return (
    <MuiThemeProvider theme={theme}>
      {children}
    </MuiThemeProvider>
  );
}

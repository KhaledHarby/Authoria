import { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Chip,
  useTheme,
  useMediaQuery,
  Stack,
  FormControl,
  Select,
  InputLabel,
  Link,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Security as SecurityIcon,
  Language as LanguageIcon,
  History as HistoryIcon,
  AccountCircle as AccountCircleIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Apps as AppsIcon,
  GitHub as GitHubIcon,
  Email as EmailIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../app/store';
import { setLanguage, setDarkMode } from '../features/settings/settingsSlice';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '../components/LanguageSelector';
import { applicationsApi, type Application } from '../api/applicationsApi';
import { setApplicationId } from '../features/auth/authSlice';
import { getUserTimezone } from '../utils/dateUtils';

const drawerWidth = 280;

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [apps, setApps] = useState<Application[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { isRTL, darkMode } = useSelector((state: RootState) => state.settings);
  const applicationId = useSelector((state: RootState) => (state as any).auth?.applicationId as string | null);

  useEffect(() => {
    (async () => {
      try {
        const data = await applicationsApi.list();
        setApps(data);
      } catch {}
    })();
  }, []);

  const menuItems = [
    { text: t('navigation.dashboard'), icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Applications', icon: <AppsIcon />, path: '/applications' },
    { text: t('navigation.users'), icon: <PeopleIcon />, path: '/users' },
    { text: t('navigation.roles'), icon: <SecurityIcon />, path: '/roles' },
    { text: t('navigation.permissions'), icon: <SecurityIcon />, path: '/permissions' },
    { text: t('navigation.localization'), icon: <LanguageIcon />, path: '/localization' },
    { text: t('navigation.audit'), icon: <HistoryIcon />, path: '/audit' },
    { text: t('navigation.settings'), icon: <SettingsIcon />, path: '/settings' },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    navigate('/');
    handleProfileMenuClose();
  };

  const handleToggleDarkMode = () => {
    const newDarkMode = !darkMode;
    dispatch(setDarkMode(newDarkMode));
    localStorage.setItem('authoria-dark-mode', newDarkMode.toString());
  };

  const drawer = (
    <Box>
      <Box
        sx={{
          p: { xs: 2, sm: 3 },
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box
          sx={{
            width: { xs: 32, sm: 40 },
            height: { xs: 32, sm: 40 },
            borderRadius: 2,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'white', 
              fontWeight: 700,
              fontSize: { xs: '1rem', sm: '1.25rem' }
            }}
          >
            A
          </Typography>
        </Box>
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 700, 
              color: 'text.primary',
              fontSize: { xs: '1rem', sm: '1.25rem' },
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            Authoria
          </Typography>
          <Chip
            label="Admin"
            size="small"
            sx={{
              backgroundColor: theme.palette.primary.main,
              color: 'white',
              fontSize: { xs: '0.625rem', sm: '0.75rem' },
              height: { xs: 16, sm: 20 },
            }}
          />
        </Box>
      </Box>
      <List sx={{ pt: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => {
                navigate(item.path);
                if (isMobile) {
                  setMobileOpen(false);
                }
              }}
              selected={location.pathname === item.path}
              sx={{
                mx: { xs: 1, sm: 1.5 },
                borderRadius: 2,
                mb: 0.5,
                py: { xs: 1, sm: 1.5 },
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.main,
                  color: 'white',
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: { xs: 36, sm: 40 },
                  color: location.pathname === item.path ? 'white' : 'inherit',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: location.pathname === item.path ? 600 : 500,
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  const footer = (
    <Box
      component="footer"
      sx={{
        py: 2,
        px: { xs: 2, sm: 3 },
        backgroundColor: theme.palette.mode === 'dark' ? 'background.paper' : 'grey.50',
        borderTop: `1px solid ${theme.palette.divider}`,
        mt: 'auto', // Push footer to bottom
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems="center"
        spacing={{ xs: 1, sm: 0 }}
      >
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: { xs: 'center', sm: 'left' } }}
        >
          © {new Date().getFullYear()} Authoria. All rights reserved. | Timezone: {getUserTimezone()}
        </Typography>
        
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
        >
          <Link
            href="#"
            color="text.secondary"
            underline="hover"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              fontSize: '0.875rem',
              '&:hover': { color: 'primary.main' }
            }}
          >
            <InfoIcon fontSize="small" />
            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
              About
            </Typography>
          </Link>
          <Link
            href="#"
            color="text.secondary"
            underline="hover"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              fontSize: '0.875rem',
              '&:hover': { color: 'primary.main' }
            }}
          >
            <EmailIcon fontSize="small" />
            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
              Support
            </Typography>
          </Link>
          <Link
            href="#"
            color="text.secondary"
            underline="hover"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              fontSize: '0.875rem',
              '&:hover': { color: 'primary.main' }
            }}
          >
            <GitHubIcon fontSize="small" />
            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
              GitHub
            </Typography>
          </Link>
        </Stack>
      </Stack>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          backgroundColor: 'white',
          color: 'text.primary',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ px: { xs: 1, sm: 2 } }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: { xs: 1, sm: 2 }, display: { sm: 'none' }, p: { xs: 0.5, sm: 1 } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ flexGrow: 1, fontSize: { xs: '1rem', sm: '1.25rem' }, fontWeight: 600 }}
          >
            {menuItems.find(item => item.path === location.pathname)?.text || t('navigation.dashboard')}
          </Typography>

          {/* Active Application Selector */}
          <FormControl size="small" sx={{ minWidth: 180, mr: 1, display: { xs: 'none', sm: 'flex' } }}>
            <InputLabel>Application</InputLabel>
            <Select
              native
              value={applicationId || ''}
              onChange={(e: any) => dispatch(setApplicationId(e.target.value || null))}
              label="Application"
            >
              <option value="">Select application</option>
              {apps.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </Select>
          </FormControl>

          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton onClick={handleToggleDarkMode} color="inherit" sx={{ p: { xs: 0.5, sm: 1 } }}>
              {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
            <LanguageSelector />
            <IconButton onClick={handleProfileMenuOpen} sx={{ ml: 1, p: { xs: 0.5, sm: 1 } }}>
              <Avatar sx={{ width: { xs: 28, sm: 32 }, height: { xs: 28, sm: 32 }, bgcolor: theme.palette.primary.main }}>
                <AccountCircleIcon />
              </Avatar>
            </IconButton>
          </Stack>

          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleProfileMenuClose} PaperProps={{ sx: { mt: 1, minWidth: 200, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' } }}>
            <MenuItem onClick={handleProfileMenuClose}>
              <ListItemIcon>
                <AccountCircleIcon fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={handleProfileMenuClose}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              Settings
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer variant="temporary" open={mobileOpen} onClose={handleDrawerToggle} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, backgroundColor: 'background.paper', borderRight: `1px solid ${theme.palette.divider}` } }}>
          {drawer}
        </Drawer>
        <Drawer variant="permanent" sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, backgroundColor: 'background.paper', borderRight: `1px solid ${theme.palette.divider}` } }} open>
          {drawer}
        </Drawer>
      </Box>
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          width: { sm: `calc(100% - ${drawerWidth}px)` }, 
          mt: { xs: 7, sm: 8 }, 
          backgroundColor: 'background.default',
          minHeight: `calc(100vh - ${theme.spacing(7)}px)`, // Subtract header height
        }}
      >
        <Box sx={{ flexGrow: 1, p: { xs: 1, sm: 2, md: 3 }, minHeight: 0 }}>
          {children}
        </Box>
        {footer}
      </Box>
    </Box>
  );
}

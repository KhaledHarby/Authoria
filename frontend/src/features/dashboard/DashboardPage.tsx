import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  useTheme,
  Button,
  Tooltip,
  Divider,
  CircularProgress,
  Alert,
  useMediaQuery,
  Stack,
} from '@mui/material';
import {
  People as PeopleIcon,
  Security as SecurityIcon,
  History as HistoryIcon,
  TrendingUp as TrendingUpIcon,
  Settings as SettingsIcon,
  Download as DownloadIcon,
  Assessment as AssessmentIcon,
  PersonAdd as PersonAddIcon,
  GroupAdd as GroupAddIcon,
  Key as KeyIcon,
  Translate as TranslateIcon,
  Api as ApiIcon,
  Storage as StorageIcon,
  Info as InfoIcon,
  Login as LoginIcon,
  Person as PersonIcon,
  Apps as AppsIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import Layout from '../../ui/Layout';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { dashboardApi, type DashboardStats, type RecentActivity } from '../../api/dashboardApi';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';

export default function DashboardPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const applicationId = useSelector((state: RootState) => (state as any).auth?.applicationId as string | null);

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load stats and recent activities in parallel
      const [statsData, activitiesData] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getRecentActivities()
      ]);
      
      setStats(statsData);
      setRecentActivities(activitiesData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
      console.error('Dashboard data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [applicationId]);

  // Quick Actions with handlers
  const quickActions = [
    {
      id: 'add-user',
      label: t('dashboard.quickActions.addUser'),
      icon: <PersonAddIcon />,
      color: '#3b82f6',
      action: () => navigate('/users'),
      description: t('dashboard.quickActions.addUserDesc'),
    },
    {
      id: 'create-role',
      label: t('dashboard.quickActions.createRole'),
      icon: <GroupAddIcon />,
      color: '#10b981',
      action: () => navigate('/roles'),
      description: t('dashboard.quickActions.createRoleDesc'),
    },
    {
      id: 'manage-permissions',
      label: t('dashboard.quickActions.managePermissions'),
      icon: <KeyIcon />,
      color: '#f59e0b',
      action: () => navigate('/permissions'),
      description: t('dashboard.quickActions.managePermissionsDesc'),
    },
    {
      id: 'view-audit',
      label: t('dashboard.quickActions.viewAudit'),
      icon: <HistoryIcon />,
      color: '#ef4444',
      action: () => navigate('/audit'),
      description: t('dashboard.quickActions.viewAuditDesc'),
    },
    {
      id: 'localization',
      label: t('dashboard.quickActions.localization'),
      icon: <TranslateIcon />,
      color: '#8b5cf6',
      action: () => navigate('/localization'),
      description: t('dashboard.quickActions.localizationDesc'),
    },
    {
      id: 'settings',
      label: t('dashboard.quickActions.settings'),
      icon: <SettingsIcon />,
      color: '#6b7280',
      action: () => navigate('/settings'),
      description: t('dashboard.quickActions.settingsDesc'),
    },
    {
      id: 'export-data',
      label: t('dashboard.quickActions.exportData'),
      icon: <DownloadIcon />,
      color: '#059669',
      action: () => {
        // TODO: Implement export functionality
        alert(t('dashboard.quickActions.exportDataNotImplemented'));
      },
      description: t('dashboard.quickActions.exportDataDesc'),
    },
    {
      id: 'system-health',
      label: t('dashboard.quickActions.systemHealth'),
      icon: <AssessmentIcon />,
      color: '#dc2626',
      action: () => {
        // TODO: Implement system health check
        alert(t('dashboard.quickActions.systemHealthNotImplemented'));
      },
      description: t('dashboard.quickActions.systemHealthDesc'),
    },
  ];

  const handleQuickAction = (action: () => void) => {
    try {
      action();
    } catch (error) {
      console.error('Quick action error:', error);
    }
  };

  // Helper function to get activity icon
  const getActivityIcon = (activity: RecentActivity) => {
    const iconName = activity.icon.toLowerCase();
    
    switch (iconName) {
      case 'person_add':
        return <PersonAddIcon fontSize="small" />;
      case 'person':
        return <PersonIcon fontSize="small" />;
      case 'security':
        return <SecurityIcon fontSize="small" />;
      case 'key':
        return <KeyIcon fontSize="small" />;
      case 'login':
        return <LoginIcon fontSize="small" />;
      case 'translate':
        return <TranslateIcon fontSize="small" />;
      case 'api':
        return <ApiIcon fontSize="small" />;
      case 'storage':
        return <StorageIcon fontSize="small" />;
      default:
        return <InfoIcon fontSize="small" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const activityDate = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - activityDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  // Stats cards with real data
  const statsCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers?.toString() || '0',
      change: '+12%',
      icon: <PeopleIcon />,
      color: '#3b82f6',
    },
    {
      title: 'Active Roles',
      value: stats?.activeRoles?.toString() || '0',
      change: '+2',
      icon: <SecurityIcon />,
      color: '#10b981',
    },
    {
      title: 'Permissions',
      value: stats?.totalPermissions?.toString() || '0',
      change: '0%',
      icon: <SecurityIcon />,
      color: '#f59e0b',
    },
    {
      title: 'Audit Events',
      value: stats?.totalAuditEvents?.toString() || '0',
      change: '+8%',
      icon: <HistoryIcon />,
      color: '#ef4444',
    },
    {
      title: 'Applications',
      value: stats?.totalApplications?.toString() || '0',
      change: '',
      icon: <AppsIcon />,
      color: '#6366f1',
    },
    {
      title: 'Active Apps',
      value: stats?.activeApplications?.toString() || '0',
      change: '',
      icon: <CheckCircleIcon />,
      color: '#22c55e',
    },
  ];

  if (loading) {
    return (
      <Layout>
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          minHeight={{ xs: '60vh', sm: '400px' }}
          p={{ xs: 2, sm: 3 }}
        >
          <CircularProgress size={60} thickness={4} />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        {/* Header */}
        <Box sx={{ mb: { xs: 3, sm: 4 } }}>
          <Typography 
            variant={isMobile ? "h5" : "h4"} 
            sx={{ 
              fontWeight: 700, 
              mb: 1,
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
            }}
          >
            {t('dashboard.title')}
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'text.secondary',
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}
          >
            {t('dashboard.welcome')}
          </Typography>
        </Box>

        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            action={
              <Button color="inherit" size="small" onClick={loadDashboardData}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {/* Stats Cards */}
        <Box 
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            gap: { xs: 2, sm: 3 },
            mb: { xs: 3, sm: 4 } 
          }}
        >
          {statsCards.map((card, index) => (
            <Card
              key={index}
              sx={{
                height: '100%',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    sx={{
                      backgroundColor: card.color,
                      width: { xs: 40, sm: 48 },
                      height: { xs: 40, sm: 48 },
                      mr: 2,
                    }}
                  >
                    {card.icon}
                  </Avatar>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography 
                      variant={isMobile ? "h5" : "h4"} 
                      sx={{ 
                        fontWeight: 700,
                        fontSize: { xs: '1.5rem', sm: '2rem' }
                      }}
                    >
                      {card.value}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'text.secondary',
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                      }}
                    >
                      {card.title}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUpIcon
                    sx={{
                      color: card.change.startsWith('+') ? 'success.main' : 'text.secondary',
                      fontSize: { xs: 14, sm: 16 },
                      mr: 0.5,
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color: card.change.startsWith('+') ? 'success.main' : 'text.secondary',
                      fontWeight: 600,
                      fontSize: { xs: '0.7rem', sm: '0.75rem' }
                    }}
                  >
                    {card.change} from last month
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Recent Activities and Quick Actions */}
        <Box 
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
            gap: { xs: 2, sm: 3 }
          }}
        >
          <Card sx={{ height: 'fit-content' }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600, 
                    mb: 3,
                    fontSize: { xs: '1.125rem', sm: '1.25rem' }
                  }}
                >
                  {t('dashboard.recentActivity')}
                </Typography>
                <Box>
                  {recentActivities.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: { xs: 3, sm: 4 } }}>
                      <HistoryIcon sx={{ fontSize: { xs: 40, sm: 48 }, color: 'text.secondary', mb: 2 }} />
                      <Typography 
                        variant="h6" 
                        color="text.secondary" 
                        gutterBottom
                        sx={{ fontSize: { xs: '1rem', sm: '1.125rem' } }}
                      >
                        No recent activities
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                      >
                        Recent system activities will appear here
                      </Typography>
                    </Box>
                  ) : (
                    <Stack spacing={1}>
                      {recentActivities.map((activity) => (
                        <Box
                          key={activity.id}
                          sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            py: { xs: 1.5, sm: 2 },
                            px: { xs: 1, sm: 2 },
                            borderRadius: 2,
                            '&:hover': {
                              backgroundColor: 'action.hover',
                            },
                            transition: 'background-color 0.2s ease-in-out',
                          }}
                        >
                          <Avatar
                            sx={{
                              width: { xs: 32, sm: 40 },
                              height: { xs: 32, sm: 40 },
                              mr: 2,
                              backgroundColor: activity.color,
                              flexShrink: 0,
                            }}
                          >
                            {getActivityIcon(activity)}
                          </Avatar>
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography 
                              variant="body1" 
                              sx={{ 
                                fontWeight: 600,
                                fontSize: { xs: '0.875rem', sm: '1rem' },
                                mb: 0.5
                              }}
                            >
                              {activity.title}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: 'text.secondary',
                                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                mb: 0.5
                              }}
                            >
                              {activity.description}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: 'text.secondary',
                                fontSize: { xs: '0.7rem', sm: '0.75rem' }
                              }}
                            >
                              {activity.actorUserId ? `User: ${activity.actorUserId}` : 'System'}
                            </Typography>
                          </Box>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: 'text.secondary',
                              fontSize: { xs: '0.7rem', sm: '0.75rem' },
                              flexShrink: 0,
                              ml: 1
                            }}
                          >
                            {formatTimeAgo(activity.occurredAtUtc)}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Box>
              </CardContent>
            </Card>

          <Card sx={{ height: 'fit-content' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600, 
                  mb: 3,
                  fontSize: { xs: '1.125rem', sm: '1.25rem' }
                }}
              >
                {t('dashboard.quickActions.title')}
              </Typography>
              
              {/* Primary Actions */}
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  fontWeight: 600, 
                  mb: 2, 
                  color: 'text.secondary',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}
              >
                {t('dashboard.quickActions.primary')}
              </Typography>
              <Stack spacing={1.5} sx={{ mb: 3 }}>
                {quickActions.slice(0, 4).map((action) => (
                  <Tooltip 
                    key={action.id} 
                    title={action.description} 
                    placement={isMobile ? "top" : "left"}
                  >
                    <Button
                      variant="outlined"
                      startIcon={action.icon}
                      onClick={() => handleQuickAction(action.action)}
                      sx={{
                        justifyContent: 'flex-start',
                        py: { xs: 1, sm: 1.5 },
                        px: { xs: 1.5, sm: 2 },
                        borderColor: action.color,
                        color: action.color,
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        '&:hover': {
                          backgroundColor: action.color,
                          color: 'white',
                          borderColor: action.color,
                        },
                        transition: 'all 0.2s ease-in-out',
                      }}
                      fullWidth
                    >
                      {action.label}
                    </Button>
                  </Tooltip>
                ))}
              </Stack>

              <Divider sx={{ my: 2 }} />

              {/* Secondary Actions */}
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  fontWeight: 600, 
                  mb: 2, 
                  color: 'text.secondary',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}
              >
                {t('dashboard.quickActions.secondary')}
              </Typography>
              <Stack spacing={1.5} sx={{ mb: 3 }}>
                {quickActions.slice(4, 6).map((action) => (
                  <Tooltip 
                    key={action.id} 
                    title={action.description} 
                    placement={isMobile ? "top" : "left"}
                  >
                    <Button
                      variant="text"
                      startIcon={action.icon}
                      onClick={() => handleQuickAction(action.action)}
                      sx={{
                        justifyContent: 'flex-start',
                        py: { xs: 0.75, sm: 1 },
                        px: { xs: 1.5, sm: 2 },
                        color: action.color,
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        '&:hover': {
                          backgroundColor: `${action.color}15`,
                        },
                        transition: 'all 0.2s ease-in-out',
                      }}
                      fullWidth
                    >
                      {action.label}
                    </Button>
                  </Tooltip>
                ))}
              </Stack>

              <Divider sx={{ my: 2 }} />

              {/* Utility Actions */}
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  fontWeight: 600, 
                  mb: 2, 
                  color: 'text.secondary',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}
              >
                {t('dashboard.quickActions.utilities')}
              </Typography>
              <Stack spacing={1.5}>
                {quickActions.slice(6).map((action) => (
                  <Tooltip 
                    key={action.id} 
                    title={action.description} 
                    placement={isMobile ? "top" : "left"}
                  >
                    <Button
                      variant="text"
                      startIcon={action.icon}
                      onClick={() => handleQuickAction(action.action)}
                      sx={{
                        justifyContent: 'flex-start',
                        py: { xs: 0.75, sm: 1 },
                        px: { xs: 1.5, sm: 2 },
                        color: action.color,
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        '&:hover': {
                          backgroundColor: `${action.color}15`,
                        },
                        transition: 'all 0.2s ease-in-out',
                      }}
                      fullWidth
                    >
                      {action.label}
                    </Button>
                  </Tooltip>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Layout>
  );
}

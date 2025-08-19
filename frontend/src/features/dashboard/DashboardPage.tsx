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
} from '@mui/icons-material';
import Layout from '../../ui/Layout';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { dashboardApi, type DashboardStats, type RecentActivity } from '../../api/dashboardApi';

export default function DashboardPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
  }, []);

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

  // Helper functions for activity display
  const getActivityIcon = (activity: RecentActivity) => {
    const action = activity.action.toLowerCase();
    const resourceType = activity.resourceType.toLowerCase();
    
    if (action.includes('auth') || action.includes('login') || action.includes('logout')) {
      return <SecurityIcon fontSize="small" />;
    }
    if (action.includes('user') || resourceType.includes('user')) {
      return <PeopleIcon fontSize="small" />;
    }
    if (action.includes('role') || resourceType.includes('role')) {
      return <SecurityIcon fontSize="small" />;
    }
    if (action.includes('permission') || resourceType.includes('permission')) {
      return <KeyIcon fontSize="small" />;
    }
    if (action.includes('api') || ['GET', 'POST', 'PUT', 'DELETE'].includes(activity.method.toUpperCase())) {
      return <ApiIcon fontSize="small" />;
    }
    if (action.includes('db') || action.includes('database')) {
      return <StorageIcon fontSize="small" />;
    }
    return <InfoIcon fontSize="small" />;
  };

  const getActivityColor = (activity: RecentActivity) => {
    const action = activity.action.toLowerCase();
    const statusCode = activity.statusCode;
    
    if (statusCode && statusCode >= 200 && statusCode < 300) return '#10b981';
    if (statusCode && statusCode >= 400) return '#ef4444';
    if (action.includes('create') || action.includes('add')) return '#3b82f6';
    if (action.includes('update') || action.includes('edit')) return '#f59e0b';
    if (action.includes('delete') || action.includes('remove')) return '#ef4444';
    return '#6b7280';
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

  const getActivityDescription = (activity: RecentActivity) => {
    const action = activity.action;
    const resourceType = activity.resourceType;
    const method = activity.method;
    
    if (action.includes('login')) return `User login via ${method}`;
    if (action.includes('logout')) return `User logout`;
    if (action.includes('create')) return `${resourceType} created via ${method}`;
    if (action.includes('update')) return `${resourceType} updated via ${method}`;
    if (action.includes('delete')) return `${resourceType} deleted via ${method}`;
    if (action.includes('view')) return `${resourceType} viewed via ${method}`;
    
    return `${action} on ${resourceType}`;
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
  ];

  if (loading) {
    return (
      <Layout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} thickness={4} />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            {t('dashboard.title')}
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
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
            gap: 3,
            mb: 4 
          }}
        >
          {statsCards.map((card, index) => (
            <Card
              key={index}
              sx={{
                height: '100%',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    sx={{
                      backgroundColor: card.color,
                      width: 48,
                      height: 48,
                      mr: 2,
                    }}
                  >
                    {card.icon}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {card.value}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {card.title}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUpIcon
                    sx={{
                      color: card.change.startsWith('+') ? 'success.main' : 'text.secondary',
                      fontSize: 16,
                      mr: 0.5,
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color: card.change.startsWith('+') ? 'success.main' : 'text.secondary',
                      fontWeight: 600,
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
            gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
            gap: 3
          }}
        >
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                {t('dashboard.recentActivity')}
              </Typography>
              <Box>
                {recentActivities.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <HistoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No recent activities
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Recent system activities will appear here
                    </Typography>
                  </Box>
                ) : (
                  recentActivities.map((activity) => (
                    <Box
                      key={activity.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        py: 2,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        '&:last-child': {
                          borderBottom: 'none',
                        },
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          mr: 2,
                          backgroundColor: getActivityColor(activity),
                        }}
                      >
                        {getActivityIcon(activity)}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {activity.action}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {getActivityDescription(activity)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {activity.actorUserId ? `User: ${activity.actorUserId}` : 'System'} • {activity.ipAddress}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {formatTimeAgo(activity.occurredAtUtc)}
                      </Typography>
                    </Box>
                  ))
                )}
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                {t('dashboard.quickActions.title')}
              </Typography>
              
              {/* Primary Actions */}
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'text.secondary' }}>
                {t('dashboard.quickActions.primary')}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
                {quickActions.slice(0, 4).map((action) => (
                  <Tooltip key={action.id} title={action.description} placement="left">
                    <Button
                      variant="outlined"
                      startIcon={action.icon}
                      onClick={() => handleQuickAction(action.action)}
                      sx={{
                        justifyContent: 'flex-start',
                        py: 1.5,
                        px: 2,
                        borderColor: action.color,
                        color: action.color,
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
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Secondary Actions */}
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'text.secondary' }}>
                {t('dashboard.quickActions.secondary')}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
                {quickActions.slice(4, 6).map((action) => (
                  <Tooltip key={action.id} title={action.description} placement="left">
                    <Button
                      variant="text"
                      startIcon={action.icon}
                      onClick={() => handleQuickAction(action.action)}
                      sx={{
                        justifyContent: 'flex-start',
                        py: 1,
                        px: 2,
                        color: action.color,
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
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Utility Actions */}
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'text.secondary' }}>
                {t('dashboard.quickActions.utilities')}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {quickActions.slice(6).map((action) => (
                  <Tooltip key={action.id} title={action.description} placement="left">
                    <Button
                      variant="text"
                      startIcon={action.icon}
                      onClick={() => handleQuickAction(action.action)}
                      sx={{
                        justifyContent: 'flex-start',
                        py: 1,
                        px: 2,
                        color: action.color,
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
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Layout>
  );
}

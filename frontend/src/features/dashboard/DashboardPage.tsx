import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  useTheme,
} from '@mui/material';
import {
  People as PeopleIcon,
  Security as SecurityIcon,
  Language as LanguageIcon,
  History as HistoryIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import Layout from '../../ui/Layout';

const statsCards = [
  {
    title: 'Total Users',
    value: '1,234',
    change: '+12%',
    icon: <PeopleIcon />,
    color: '#3b82f6',
  },
  {
    title: 'Active Roles',
    value: '8',
    change: '+2',
    icon: <SecurityIcon />,
    color: '#10b981',
  },
  {
    title: 'Permissions',
    value: '15',
    change: '0%',
    icon: <SecurityIcon />,
    color: '#f59e0b',
  },
  {
    title: 'Audit Events',
    value: '2,847',
    change: '+8%',
    icon: <HistoryIcon />,
    color: '#ef4444',
  },
];

const recentActivities = [
  {
    id: 1,
    action: 'User created',
    description: 'John Doe was added to the system',
    time: '2 minutes ago',
    type: 'user',
  },
  {
    id: 2,
    action: 'Role assigned',
    description: 'Admin role assigned to Jane Smith',
    time: '5 minutes ago',
    type: 'role',
  },
  {
    id: 3,
    action: 'Permission updated',
    description: 'User permissions modified',
    time: '10 minutes ago',
    type: 'permission',
  },
  {
    id: 4,
    action: 'Webhook triggered',
    description: 'User registration webhook sent',
    time: '15 minutes ago',
    type: 'webhook',
  },
];

export default function DashboardPage() {
  const theme = useTheme();

  return (
    <Layout>
      <Box>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Dashboard
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Welcome back! Here's what's happening with your Authoria system.
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {statsCards.map((card, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
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
            </Grid>
          ))}
        </Grid>

        {/* Recent Activities */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Recent Activities
                </Typography>
                <Box>
                  {recentActivities.map((activity) => (
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
                          backgroundColor:
                            activity.type === 'user'
                              ? '#3b82f6'
                              : activity.type === 'role'
                              ? '#10b981'
                              : activity.type === 'permission'
                              ? '#f59e0b'
                              : '#ef4444',
                        }}
                      >
                                                 {activity.type === 'user' && <PeopleIcon />}
                         {activity.type === 'role' && <SecurityIcon />}
                         {activity.type === 'permission' && <SecurityIcon />}
                         {activity.type === 'webhook' && <SecurityIcon />}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {activity.action}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {activity.description}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {activity.time}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Quick Actions
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Chip
                    label="Add New User"
                    icon={<PeopleIcon />}
                    clickable
                    sx={{
                      justifyContent: 'flex-start',
                      py: 1,
                      '&:hover': {
                        backgroundColor: theme.palette.primary.light,
                        color: 'white',
                      },
                    }}
                  />
                  <Chip
                    label="Create Role"
                    icon={<SecurityIcon />}
                    clickable
                    sx={{
                      justifyContent: 'flex-start',
                      py: 1,
                      '&:hover': {
                        backgroundColor: theme.palette.primary.light,
                        color: 'white',
                      },
                    }}
                  />
                  <Chip
                    label="View Audit Logs"
                    icon={<HistoryIcon />}
                    clickable
                    sx={{
                      justifyContent: 'flex-start',
                      py: 1,
                      '&:hover': {
                        backgroundColor: theme.palette.primary.light,
                        color: 'white',
                      },
                    }}
                  />
                                     <Chip
                     label="Manage Webhooks"
                     icon={<SecurityIcon />}
                     clickable
                     sx={{
                       justifyContent: 'flex-start',
                       py: 1,
                       '&:hover': {
                         backgroundColor: theme.palette.primary.light,
                         color: 'white',
                       },
                     }}
                   />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Layout>
  );
}

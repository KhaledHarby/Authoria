import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as TestIcon,
  Visibility as ViewIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import Layout from '../../ui/Layout';

// Mock data - replace with actual API calls
const mockWebhooks = [
  {
    id: 1,
    name: 'User Registration Webhook',
    url: 'https://api.example.com/webhooks/user-registration',
    events: ['user.created', 'user.updated'],
    status: 'Active',
    lastTriggered: '2024-01-15 14:30:25',
    successRate: 98.5,
    retryCount: 3,
    timeout: 30,
    secret: 'whsec_abc123...',
  },
  {
    id: 2,
    name: 'Role Assignment Webhook',
    url: 'https://api.example.com/webhooks/role-assignment',
    events: ['role.assigned', 'role.removed'],
    status: 'Active',
    lastTriggered: '2024-01-15 13:45:10',
    successRate: 95.2,
    retryCount: 5,
    timeout: 60,
    secret: 'whsec_def456...',
  },
  {
    id: 3,
    name: 'Audit Log Webhook',
    url: 'https://api.example.com/webhooks/audit-log',
    events: ['audit.created'],
    status: 'Inactive',
    lastTriggered: '2024-01-14 09:15:30',
    successRate: 87.3,
    retryCount: 3,
    timeout: 45,
    secret: 'whsec_ghi789...',
  },
];

const availableEvents = [
  'user.created', 'user.updated', 'user.deleted',
  'role.assigned', 'role.removed', 'role.created', 'role.updated',
  'permission.assigned', 'permission.removed',
  'audit.created', 'system.configuration.changed',
];

const mockWebhookLogs = [
  {
    id: 1,
    webhookId: 1,
    event: 'user.created',
    status: 'Success',
    responseCode: 200,
    responseTime: 245,
    timestamp: '2024-01-15 14:30:25',
    payload: '{"user_id": "123", "email": "john@example.com"}',
  },
  {
    id: 2,
    webhookId: 1,
    event: 'user.created',
    status: 'Failed',
    responseCode: 500,
    responseTime: 5000,
    timestamp: '2024-01-15 14:25:10',
    payload: '{"user_id": "124", "email": "jane@example.com"}',
    error: 'Connection timeout',
  },
  {
    id: 3,
    webhookId: 2,
    event: 'role.assigned',
    status: 'Success',
    responseCode: 200,
    responseTime: 180,
    timestamp: '2024-01-15 13:45:10',
    payload: '{"user_id": "123", "role_id": "admin"}',
  },
];

export default function WebhooksPage() {
  const [openDialog, setOpenDialog] = useState(false);
  const [openLogsDialog, setOpenLogsDialog] = useState(false);
  const [dialogType, setDialogType] = useState<'create' | 'edit'>('create');
  const [selectedWebhook, setSelectedWebhook] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: [] as string[],
    status: 'Active',
    retryCount: 3,
    timeout: 30,
  });
  const theme = useTheme();

  const handleOpenDialog = (type: 'create' | 'edit', webhook?: any) => {
    setDialogType(type);
    setSelectedWebhook(webhook);
    if (type === 'edit' && webhook) {
      setFormData({
        name: webhook.name,
        url: webhook.url,
        events: webhook.events,
        status: webhook.status,
        retryCount: webhook.retryCount,
        timeout: webhook.timeout,
      });
    } else {
      setFormData({
        name: '',
        url: '',
        events: [],
        status: 'Active',
        retryCount: 3,
        timeout: 30,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedWebhook(null);
  };

  const handleSave = () => {
    console.log('Saving webhook:', formData);
    handleCloseDialog();
  };

  const handleTestWebhook = (webhook: any) => {
    console.log('Testing webhook:', webhook);
    // Implement webhook testing logic
  };

  const getStatusColor = (status: string) => {
    return status === 'Active' ? 'success' : 'error';
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 95) return 'success';
    if (rate >= 80) return 'warning';
    return 'error';
  };

  return (
    <Layout>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              Webhooks
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Manage webhook endpoints and event notifications
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog('create')}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
              },
            }}
          >
            Create Webhook
          </Button>
        </Box>

        {/* Webhooks Grid */}
        <Grid container spacing={3}>
          {mockWebhooks.map((webhook) => (
            <Grid item xs={12} md={6} lg={4} key={webhook.id}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                <CardContent>
                  {/* Webhook Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                          <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          backgroundColor: theme.palette.secondary.main,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2,
                        }}
                      >
                        <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
                          W
                        </Typography>
                      </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {webhook.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
                        {webhook.url}
                      </Typography>
                    </Box>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => handleTestWebhook(webhook)}
                        sx={{ mr: 1 }}
                        color="primary"
                      >
                        <TestIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog('edit', webhook)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Status and Stats */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Chip
                      label={webhook.status}
                      color={getStatusColor(webhook.status) as any}
                      size="small"
                    />
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {webhook.successRate}% success
                    </Typography>
                  </Box>

                  {/* Events */}
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1, display: 'block' }}>
                    Events ({webhook.events.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                    {webhook.events.slice(0, 2).map((event) => (
                      <Chip
                        key={event}
                        label={event}
                        size="small"
                        variant="outlined"
                        color="default"
                      />
                    ))}
                    {webhook.events.length > 2 && (
                      <Chip
                        label={`+${webhook.events.length - 2} more`}
                        size="small"
                        variant="outlined"
                        color="default"
                      />
                    )}
                  </Box>

                  {/* Last Triggered */}
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Last triggered: {webhook.lastTriggered}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Create/Edit Webhook Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {dialogType === 'create' ? 'Create New Webhook' : 'Edit Webhook'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
              <TextField
                fullWidth
                label="Webhook Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
              <TextField
                fullWidth
                label="Webhook URL"
                placeholder="https://api.example.com/webhooks/endpoint"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                helperText="HTTPS URL required for webhook delivery"
              />
              <FormControl fullWidth>
                <InputLabel>Events</InputLabel>
                <Select
                  multiple
                  value={formData.events}
                  label="Events"
                  onChange={(e) => setFormData(prev => ({ ...prev, events: e.target.value as string[] }))}
                >
                  {availableEvents.map((event) => (
                    <MenuItem key={event} value={event}>
                      {event}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Retry Count"
                  type="number"
                  value={formData.retryCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, retryCount: parseInt(e.target.value) }))}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Timeout (seconds)"
                  type="number"
                  value={formData.timeout}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeout: parseInt(e.target.value) }))}
                  sx={{ flex: 1 }}
                />
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.status === 'Active'}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.checked ? 'Active' : 'Inactive' }))}
                  />
                }
                label="Active"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              onClick={handleSave}
              variant="contained"
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                },
              }}
            >
              {dialogType === 'create' ? 'Create Webhook' : 'Save Changes'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Webhook Logs Dialog */}
        <Dialog open={openLogsDialog} onClose={() => setOpenLogsDialog(false)} maxWidth="lg" fullWidth>
          <DialogTitle>Webhook Delivery Logs</DialogTitle>
          <DialogContent>
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Timestamp</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Event</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Response Code</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Response Time</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockWebhookLogs.map((log) => (
                    <TableRow key={log.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {log.timestamp}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {log.event}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={log.status === 'Success' ? <SuccessIcon /> : <ErrorIcon />}
                          label={log.status}
                          size="small"
                          color={log.status === 'Success' ? 'success' : 'error'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {log.responseCode}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {log.responseTime}ms
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton size="small">
                          <ViewIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenLogsDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
}

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  alpha,
  Skeleton,
  Avatar,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Info as InfoIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  Api as ApiIcon,
  Storage as StorageIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Timeline as TimelineIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import http from '../../api/http';
import Pagination from '../../ui/Pagination';
import Layout from '../../ui/Layout';

interface AuditLog {
  id: string;
  tenantId?: string;
  actorUserId?: string;
  actorType: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  method: string;
  path: string;
  ipAddress: string;
  userAgent: string;
  statusCode?: number;
  durationMs?: number;
  occurredAtUtc: string;
  detailsJson?: string;
}

interface PaginationResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

const AuditPage: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [actionFilter, setActionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [timeFilter, setTimeFilter] = useState('24h');
  const [showFilters, setShowFilters] = useState(false);
  const theme = useTheme();

  const loadAuditLogs = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        ...(searchTerm && { searchTerm }),
        ...(actionFilter && { actionType: actionFilter }),
        ...(statusFilter && { status: statusFilter }),
        ...(timeFilter && { timeRange: timeFilter })
      });

      const response = await http.get<PaginationResponse<AuditLog>>(`/api/audit?${params}`);
      const data = response.data;

      setAuditLogs(data.items);
      setTotalCount(data.totalCount);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadAuditLogs(true);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setActionFilter('');
    setStatusFilter('');
    setTimeFilter('24h');
    setCurrentPage(1);
  };

  const handleRowToggle = (logId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedRows(newExpanded);
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedLog(null);
  };

  useEffect(() => {
    loadAuditLogs();
  }, [currentPage, pageSize, searchTerm, actionFilter, statusFilter, timeFilter]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleActionFilterChange = (action: string) => {
    setActionFilter(action);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleTimeFilterChange = (time: string) => {
    setTimeFilter(time);
    setCurrentPage(1);
  };

  const getActionIcon = (action: string) => {
    if (action.includes('auth.') || action.includes('login') || action.includes('logout')) return <SecurityIcon fontSize="small" />;
    if (action.includes('user.') || action.includes('user')) return <PersonIcon fontSize="small" />;
    if (action.includes('api.') || ['GET', 'POST', 'PUT', 'DELETE'].includes(action.toUpperCase())) return <ApiIcon fontSize="small" />;
    if (action.includes('db.') || action.includes('database')) return <StorageIcon fontSize="small" />;
    return <InfoIcon fontSize="small" />;
  };

  const getActionColor = (action: string): 'success' | 'error' | 'warning' | 'primary' | 'default' => {
    if (action.includes('login.success') || action.includes('success')) return 'success';
    if (action.includes('login.failed') || action.includes('failed') || action.includes('error')) return 'error';
    if (action.includes('create') || action.includes('add')) return 'primary';
    if (action.includes('update') || action.includes('edit') || action.includes('modify')) return 'warning';
    if (action.includes('delete') || action.includes('remove')) return 'error';
    return 'default';
  };

  const getMethodColor = (method: string): 'success' | 'error' | 'warning' | 'primary' | 'default' => {
    switch (method.toUpperCase()) {
      case 'GET': return 'success';
      case 'POST': return 'primary';
      case 'PUT': return 'warning';
      case 'DELETE': return 'error';
      default: return 'default';
    }
  };

  const getStatusColor = (statusCode?: number): 'success' | 'error' | 'warning' | 'default' => {
    if (!statusCode) return 'default';
    if (statusCode >= 200 && statusCode < 300) return 'success';
    if (statusCode >= 400 && statusCode < 500) return 'warning';
    if (statusCode >= 500) return 'error';
    return 'default';
  };

  const getAnalytics = () => {
    const successfulActions = auditLogs.filter(log => 
      (log.statusCode && log.statusCode >= 200 && log.statusCode < 300) || 
      log.action.includes('success')
    ).length;
    
    const failedActions = auditLogs.filter(log => 
      (log.statusCode && log.statusCode >= 400) || 
      log.action.includes('failed') || 
      log.action.includes('error')
    ).length;
    
    const avgDuration = auditLogs.length > 0 ? auditLogs.reduce((sum, log) => sum + (log.durationMs || 0), 0) / auditLogs.length : 0;
    
    const uniqueUsers = new Set(auditLogs.map(log => log.actorUserId).filter(Boolean)).size;
    
    return {
      totalLogs: auditLogs.length,
      successfulActions,
      failedActions,
      avgDuration: Math.round(avgDuration),
      uniqueUsers
    };
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const analytics = getAnalytics();

  const hasActiveFilters = searchTerm || actionFilter || statusFilter || timeFilter !== '24h';

  if (loading && auditLogs.length === 0) {
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
        {/* Header Section */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Box>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700, 
                color: 'text.primary',
                mb: 1
              }}
            >
              Audit Logs
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Monitor system activities, track user actions, and analyze security events
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Tooltip title="Refresh audit logs">
              <IconButton 
                onClick={handleRefresh}
                disabled={refreshing}
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.2),
                  }
                }}
              >
                <RefreshIcon sx={{ 
                  animation: refreshing ? 'spin 1s linear infinite' : 'none',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                  }
                }} />
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => {/* TODO: Implement export */}}
            >
              Export
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            action={
              <Button color="inherit" size="small" onClick={handleRefresh}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {/* Analytics Cards */}
        <Box 
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' },
            gap: 3,
            mb: 3 
          }}
        >
          <Card sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TimelineIcon />
                <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
                  Total Events
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {totalCount.toLocaleString()}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Current page: {analytics.totalLogs}
              </Typography>
            </CardContent>
          </Card>
          
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CheckCircleIcon color="success" />
                <Typography variant="subtitle2" color="text.secondary">
                  Successful
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                {analytics.successfulActions}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {analytics.totalLogs > 0 ? Math.round((analytics.successfulActions / analytics.totalLogs) * 100) : 0}% success rate
              </Typography>
            </CardContent>
          </Card>
          
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <ErrorIcon color="error" />
                <Typography variant="subtitle2" color="text.secondary">
                  Failed
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>
                {analytics.failedActions}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {analytics.totalLogs > 0 ? Math.round((analytics.failedActions / analytics.totalLogs) * 100) : 0}% failure rate
              </Typography>
            </CardContent>
          </Card>
          
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <ScheduleIcon color="primary" />
                <Typography variant="subtitle2" color="text.secondary">
                  Avg Duration
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {analytics.avgDuration}ms
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Response time
              </Typography>
            </CardContent>
          </Card>
          
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <PersonIcon color="info" />
                <Typography variant="subtitle2" color="text.secondary">
                  Active Users
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                {analytics.uniqueUsers}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Unique actors
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Search and Filters */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              placeholder="Search audit logs by action, resource, IP, or path..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => handleSearchChange('')}>
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              size="small"
            />
            <Button
              variant={showFilters ? "contained" : "outlined"}
              startIcon={<FilterIcon />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{ minWidth: 120 }}
            >
              Filters
            </Button>
            {hasActiveFilters && (
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<ClearIcon />}
                onClick={handleClearFilters}
                size="small"
              >
                Clear All
              </Button>
            )}
          </Box>

          {/* Advanced Filters */}
          <Collapse in={showFilters}>
            <Box 
              sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                gap: 2,
                pt: 2,
                borderTop: `1px solid ${theme.palette.divider}`
              }}
            >
              <FormControl fullWidth size="small">
                <InputLabel>Action Type</InputLabel>
                <Select
                  value={actionFilter}
                  label="Action Type"
                  onChange={(e) => handleActionFilterChange(e.target.value)}
                >
                  <MenuItem value="">All Actions</MenuItem>
                  <MenuItem value="auth">Authentication</MenuItem>
                  <MenuItem value="user">User Management</MenuItem>
                  <MenuItem value="api">API Calls</MenuItem>
                  <MenuItem value="db">Database</MenuItem>
                  <MenuItem value="create">Create Operations</MenuItem>
                  <MenuItem value="update">Update Operations</MenuItem>
                  <MenuItem value="delete">Delete Operations</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => handleStatusFilterChange(e.target.value)}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="success">Success (2xx)</MenuItem>
                  <MenuItem value="redirect">Redirect (3xx)</MenuItem>
                  <MenuItem value="client-error">Client Error (4xx)</MenuItem>
                  <MenuItem value="server-error">Server Error (5xx)</MenuItem>
                  <MenuItem value="error">All Errors (4xx, 5xx)</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth size="small">
                <InputLabel>Time Range</InputLabel>
                <Select
                  value={timeFilter}
                  label="Time Range"
                  onChange={(e) => handleTimeFilterChange(e.target.value)}
                >
                  <MenuItem value="1h">Last Hour</MenuItem>
                  <MenuItem value="24h">Last 24 Hours</MenuItem>
                  <MenuItem value="7d">Last 7 Days</MenuItem>
                  <MenuItem value="30d">Last 30 Days</MenuItem>
                  <MenuItem value="90d">Last 90 Days</MenuItem>
                  <MenuItem value="1y">Last Year</MenuItem>
                  <MenuItem value="all">All Time</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Collapse>
        </Paper>

        {/* Audit Logs Table */}
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 160 }}>Action</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Resource</TableCell>
                  <TableCell sx={{ minWidth: 80 }}>Method</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>IP Address</TableCell>
                  <TableCell sx={{ minWidth: 80 }}>Status</TableCell>
                  <TableCell sx={{ minWidth: 80 }}>Duration</TableCell>
                  <TableCell sx={{ minWidth: 140 }}>Timestamp</TableCell>
                  <TableCell sx={{ minWidth: 80 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  // Loading skeleton
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      {Array.from({ length: 8 }).map((_, cellIndex) => (
                        <TableCell key={cellIndex}>
                          <Skeleton variant="text" width={cellIndex === 0 ? 160 : 80} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : auditLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <TimelineIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          No audit logs found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {hasActiveFilters 
                            ? 'Try adjusting your search criteria or filters' 
                            : 'No audit events have been recorded yet'
                          }
                        </Typography>
                        {hasActiveFilters && (
                          <Button 
                            variant="outlined" 
                            onClick={handleClearFilters}
                            sx={{ mt: 2 }}
                          >
                            Clear All Filters
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  auditLogs.map((log) => (
                    <React.Fragment key={log.id}>
                      <TableRow 
                        hover 
                        sx={{ 
                          '&:nth-of-type(odd)': { 
                            backgroundColor: alpha(theme.palette.primary.main, 0.02) 
                          },
                          cursor: 'pointer'
                        }}
                        onClick={() => handleRowToggle(log.id)}
                      >
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            {getActionIcon(log.action)}
                            <Chip
                              label={log.action}
                              color={getActionColor(log.action)}
                              size="small"
                              variant="outlined"
                              sx={{ maxWidth: 140 }}
                            />
                            <IconButton size="small">
                              {expandedRows.has(log.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {log.resourceType}
                            </Typography>
                            {log.resourceId && (
                              <Typography variant="caption" color="text.secondary">
                                {log.resourceId.slice(0, 8)}...
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={log.method}
                            color={getMethodColor(log.method)}
                            size="small"
                            sx={{ minWidth: 60 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace" fontSize="0.75rem">
                            {log.ipAddress || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {log.statusCode ? (
                            <Chip
                              label={log.statusCode}
                              color={getStatusColor(log.statusCode)}
                              size="small"
                            />
                          ) : (
                            <Typography variant="body2" color="text.disabled">-</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            {formatDuration(log.durationMs)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontSize="0.75rem">
                            {formatDateTime(log.occurredAtUtc)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="View details">
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetails(log);
                              }}
                              sx={{
                                color: 'primary.main',
                                '&:hover': {
                                  bgcolor: alpha(theme.palette.primary.main, 0.1)
                                }
                              }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                      {/* Expanded Row Details */}
                      <TableRow>
                        <TableCell colSpan={8} sx={{ py: 0, border: 0 }}>
                          <Collapse in={expandedRows.has(log.id)} timeout="auto" unmountOnExit>
                            <Box sx={{ 
                              p: 2, 
                              bgcolor: alpha(theme.palette.primary.main, 0.05),
                              borderRadius: 1,
                              m: 1
                            }}>
                              <Box 
                                sx={{ 
                                  display: 'grid', 
                                  gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
                                  gap: 2
                                }}
                              >
                                <Box>
                                  <Typography variant="subtitle2" gutterBottom>
                                    Request Details
                                  </Typography>
                                  <Box sx={{ pl: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                      <strong>Path:</strong> {log.path}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      <strong>User Agent:</strong> {log.userAgent || 'N/A'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      <strong>Actor:</strong> {log.actorUserId || 'System'}
                                    </Typography>
                                  </Box>
                                </Box>
                                <Box>
                                  <Typography variant="subtitle2" gutterBottom>
                                    Additional Information
                                  </Typography>
                                  <Box sx={{ pl: 1 }}>
                                    {log.detailsJson && (
                                      <Paper sx={{ p: 1, bgcolor: 'background.default' }}>
                                        <Typography variant="caption" component="pre" sx={{ 
                                          whiteSpace: 'pre-wrap',
                                          fontSize: '0.7rem',
                                          fontFamily: 'monospace'
                                        }}>
                                          {JSON.stringify(JSON.parse(log.detailsJson), null, 2)}
                                        </Typography>
                                      </Paper>
                                    )}
                                  </Box>
                                </Box>
                              </Box>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Pagination */}
        {!loading && auditLogs.length > 0 && (
          <Pagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalCount={totalCount}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        )}

        {/* Details Dialog */}
        <Dialog
          open={detailsOpen}
          onClose={handleCloseDetails}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {selectedLog && getActionIcon(selectedLog.action)}
              Audit Log Details
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedLog && (
              <Box 
                sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                  gap: 2 
                }}
              >
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Basic Information</Typography>
                  <Box sx={{ pl: 1 }}>
                    <Typography variant="body2"><strong>Action:</strong> {selectedLog.action}</Typography>
                    <Typography variant="body2"><strong>Resource:</strong> {selectedLog.resourceType}</Typography>
                    <Typography variant="body2"><strong>Method:</strong> {selectedLog.method}</Typography>
                    <Typography variant="body2"><strong>Status:</strong> {selectedLog.statusCode || 'N/A'}</Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Request Information</Typography>
                  <Box sx={{ pl: 1 }}>
                    <Typography variant="body2"><strong>IP Address:</strong> {selectedLog.ipAddress}</Typography>
                    <Typography variant="body2"><strong>Duration:</strong> {formatDuration(selectedLog.durationMs)}</Typography>
                    <Typography variant="body2"><strong>Timestamp:</strong> {formatDateTime(selectedLog.occurredAtUtc)}</Typography>
                  </Box>
                </Box>
                {selectedLog.detailsJson && (
                  <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
                    <Typography variant="subtitle2" gutterBottom>Details</Typography>
                    <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                      <Typography component="pre" sx={{ 
                        whiteSpace: 'pre-wrap',
                        fontSize: '0.8rem',
                        fontFamily: 'monospace'
                      }}>
                        {JSON.stringify(JSON.parse(selectedLog.detailsJson), null, 2)}
                      </Typography>
                    </Paper>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDetails}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default AuditPage;


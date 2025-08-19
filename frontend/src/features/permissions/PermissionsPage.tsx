import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  useTheme,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  alpha,
  Skeleton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Visibility as VisibilityIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import Layout from '../../ui/Layout';
import Pagination from '../../ui/Pagination';
import SearchBar from '../../ui/SearchBar';
import http from '../../api/http';

// Permission interface
interface Permission {
  id: string;
  name: string;
  description?: string;
  category?: string;
  roles?: string[];
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

const categories = ['User Management', 'Role Management', 'Permission Management', 'System'];

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState<'create' | 'edit'>('create');
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
  });
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const theme = useTheme();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  // Load permissions on component mount and when pagination changes
  useEffect(() => {
    loadPermissions();
  }, [currentPage, pageSize, searchTerm, sortBy, sortDirection, categoryFilter, actionFilter]);

  const loadPermissions = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setPageLoading(true);
      }
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        ...(searchTerm && { searchTerm }),
        ...(sortBy && { sortBy }),
        ...(sortDirection && { sortDirection }),
        ...(categoryFilter && { categoryFilter }),
        ...(actionFilter && { actionFilter }),
      });
      
      const response = await http.get(`/api/permissions?${params}`);
      const data: PaginationResponse<Permission> = response.data;
      
      setPermissions(data.items);
      setTotalCount(data.totalCount);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      setError('Failed to load permissions: ' + (err.response?.data?.message || err.message));
    } finally {
      setPageLoading(false);
      setRefreshing(false);
    }
  };

  // Search and filter handlers
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    loadPermissions(true);
  };

  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const handleCategoryFilterChange = (category: string) => {
    setCategoryFilter(category);
    setCurrentPage(1);
  };

  const handleActionFilterChange = (action: string) => {
    setActionFilter(action);
    setCurrentPage(1);
  };

  const handleOpenDialog = (type: 'create' | 'edit', permission?: Permission) => {
    setDialogType(type);
    setSelectedPermission(permission);
    if (type === 'edit' && permission) {
      setFormData({
        name: permission.name,
        description: permission.description,
        category: permission.category,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        category: '',
      });
    }
    setOpenDialog(true);
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedPermission(null);
    setFormData({
      name: '',
      description: '',
      category: '',
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Permission name is required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (dialogType === 'create') {
        await http.post('/api/permissions', {
          name: formData.name,
          description: formData.description
        });
        setSuccess('Permission created successfully!');
      } else if (selectedPermission) {
        await http.put(`/api/permissions/${selectedPermission.id}`, {
          name: formData.name,
          description: formData.description
        });
        setSuccess('Permission updated successfully!');
      }

      // Refresh the permissions list
      await loadPermissions();
      
      // Close dialog after a short delay
      setTimeout(() => {
        handleCloseDialog();
      }, 1500);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save permission. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPermissionColor = (permission: string) => {
    if (permission.includes('delete')) return 'error';
    if (permission.includes('create') || permission.includes('update')) return 'warning';
    if (permission.includes('audit')) return 'info';
    return 'primary';
  };

  const getAnalytics = () => {
    const totalPermissions = permissions.length;
    const permissionsWithRoles = permissions.filter(permission => (permission.roles?.length || 0) > 0).length;
    const permissionsByCategory = permissions.reduce((acc, permission) => {
      const category = permission.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const totalRoles = permissions.reduce((sum, permission) => sum + (permission.roles?.length || 0), 0);
    const avgRolesPerPermission = totalPermissions > 0 ? Math.round(totalRoles / totalPermissions) : 0;
    
    return {
      totalPermissions,
      permissionsWithRoles,
      permissionsByCategory,
      totalRoles,
      avgRolesPerPermission
    };
  };

  const getPermissionIcon = (permissionName: string) => {
    const name = permissionName.toLowerCase();
    if (name.includes('delete')) return <ErrorIcon />;
    if (name.includes('create') || name.includes('update')) return <WarningIcon />;
    if (name.includes('audit')) return <InfoIcon />;
    if (name.includes('view')) return <VisibilityIcon />;
    return <SecurityIcon />;
  };

  const getPermissionCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'user management': return '#3b82f6'; // blue
      case 'role management': return '#8b5cf6'; // purple
      case 'permission management': return '#ef4444'; // red
      case 'system': return '#f59e0b'; // amber
      case 'audit': return '#10b981'; // green
      default: return '#6b7280'; // gray
    }
  };

  const analytics = getAnalytics();

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
              Permissions
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage system permissions and access controls
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Tooltip title="Refresh permissions">
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
              Add Permission
            </Button>
          </Box>
        </Box>

        {/* Analytics Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 3, mb: 3 }}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <SecurityIcon />
                <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
                  Total Permissions
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {totalCount.toLocaleString()}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Current page: {analytics.totalPermissions}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CheckCircleIcon color="success" />
                <Typography variant="subtitle2" color="text.secondary">
                  With Roles
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                {analytics.permissionsWithRoles}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {analytics.totalPermissions > 0 ? Math.round((analytics.permissionsWithRoles / analytics.totalPermissions) * 100) : 0}% assigned
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TrendingUpIcon color="primary" />
                <Typography variant="subtitle2" color="text.secondary">
                  Total Roles
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {analytics.totalRoles}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Role assignments
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <InfoIcon color="warning" />
                <Typography variant="subtitle2" color="text.secondary">
                  Avg Roles/Permission
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                {analytics.avgRolesPerPermission}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Average assignment
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <FilterIcon color="info" />
                <Typography variant="subtitle2" color="text.secondary">
                  Categories
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                {Object.keys(analytics.permissionsByCategory).length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Permission categories
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Search and Filters */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, alignItems: 'center' }}>
            <Box>
              <SearchBar
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search permissions by name, description, or category..."
                loading={refreshing}
              />
            </Box>
            <FormControl fullWidth size="small">
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => handleSortChange(e.target.value)}
              >
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="description">Description</MenuItem>
                <MenuItem value="category">Category</MenuItem>
                <MenuItem value="roleCount">Role Count</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => handleCategoryFilterChange(e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                <MenuItem value="User Management">User Management</MenuItem>
                <MenuItem value="Role Management">Role Management</MenuItem>
                <MenuItem value="Permission Management">Permission Management</MenuItem>
                <MenuItem value="System">System</MenuItem>
                <MenuItem value="Audit">Audit</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Action Type</InputLabel>
              <Select
                value={actionFilter}
                label="Action Type"
                onChange={(e) => handleActionFilterChange(e.target.value)}
              >
                <MenuItem value="">All Actions</MenuItem>
                <MenuItem value="view">View</MenuItem>
                <MenuItem value="create">Create</MenuItem>
                <MenuItem value="update">Update</MenuItem>
                <MenuItem value="delete">Delete</MenuItem>
                <MenuItem value="audit">Audit</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Paper>

        {/* Permissions Table */}
        <Card>
          <CardContent>
            <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Permission</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Assigned Roles</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pageLoading ? (
                    // Loading skeleton
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Skeleton variant="circular" width={20} height={20} />
                            <Skeleton variant="text" width={120} height={24} />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Skeleton variant="text" width={200} height={20} />
                        </TableCell>
                        <TableCell>
                          <Skeleton variant="rectangular" width={100} height={24} />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Skeleton variant="rectangular" width={60} height={24} />
                            <Skeleton variant="rectangular" width={60} height={24} />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Skeleton variant="circular" width={32} height={32} />
                            <Skeleton variant="circular" width={32} height={32} />
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : permissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <SecurityIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                          <Typography variant="h5" color="text.secondary" gutterBottom>
                            No permissions found
                          </Typography>
                          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                            {searchTerm || categoryFilter || actionFilter 
                              ? 'Try adjusting your search criteria or filters'
                              : 'Get started by creating your first permission'
                            }
                          </Typography>
                          {!searchTerm && !categoryFilter && !actionFilter && (
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
                              Create First Permission
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    permissions.map((permission) => (
                      <TableRow key={permission.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getPermissionIcon(permission.name)}
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {permission.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {permission.description || 'No description provided'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={permission.category || 'Uncategorized'}
                            size="small"
                            variant="outlined"
                            sx={{
                              borderColor: getPermissionCategoryColor(permission.category || ''),
                              color: getPermissionCategoryColor(permission.category || ''),
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {(permission.roles ?? []).length > 0 ? (
                              (permission.roles ?? []).map((role) => (
                                <Chip
                                  key={role}
                                  label={role}
                                  size="small"
                                  color={role === 'Admin' ? 'error' : role === 'Manager' ? 'warning' : 'default'}
                                />
                              ))
                            ) : (
                              <Chip
                                label="No roles"
                                size="small"
                                variant="outlined"
                                color="default"
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Edit permission">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog('edit', permission)}
                              sx={{ mr: 1 }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete permission">
                            <IconButton
                              size="small"
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Pagination */}
        {!pageLoading && totalCount > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        )}

        {/* Create/Edit Permission Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {dialogType === 'create' ? 'Create New Permission' : 'Edit Permission'}
          </DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 3 }}>
                {success}
              </Alert>
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
              <TextField
                fullWidth
                label="Permission Name"
                placeholder="e.g., user.create"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                helperText="Use dot notation (e.g., resource.action)"
              />
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
              <TextField
                fullWidth
                label="Category"
                select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </TextField>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={loading}>Cancel</Button>
            <Button
              onClick={handleSave}
              variant="contained"
              disabled={loading}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                },
              }}
            >
              {loading ? (dialogType === 'create' ? 'Creating...' : 'Updating...') : (dialogType === 'create' ? 'Create Permission' : 'Save Changes')}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
}


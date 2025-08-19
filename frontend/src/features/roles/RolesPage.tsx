import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  IconButton,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Alert,
  useTheme,
  Paper,
  alpha,
  Skeleton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  People as PeopleIcon,
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as ManagerIcon,
  Person as UserIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Sort as SortIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import Layout from '../../ui/Layout';
import Pagination from '../../ui/Pagination';
import SearchBar from '../../ui/SearchBar';
import CheckboxGroup from '../../ui/CheckboxGroup';
import http from '../../api/http';

// Role interface
interface Role {
  id: string;
  name: string;
  description?: string;
  rolePermissions?: RolePermission[];
  userRoles?: UserRole[];
}

interface RolePermission {
  roleId: string;
  permissionId: string;
  permission: Permission;
}

interface UserRole {
  userId: string;
  roleId: string;
}

interface Permission {
  id: string;
  name: string;
  description?: string;
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

const availablePermissions = [
  // User Management
  'user.view', 'user.create', 'user.update', 'user.delete',
  
  // Role Management
  'role.view', 'role.create', 'role.update', 'role.delete', 'role.assign',
  
  // Permission Management
  'permission.view', 'permission.create', 'permission.update', 'permission.delete', 'permission.assign',
  
  // System Management
  'system.view', 'system.configure', 'system.admin',
  
  // Localization
  'localization.view', 'localization.create', 'localization.update', 'localization.delete',
  
  // Audit
  'audit.view', 'audit.export',
  
  // Webhooks
  'webhook.view', 'webhook.create', 'webhook.update', 'webhook.delete',
  
  // Tenant Management
  'tenant.view', 'tenant.create', 'tenant.update', 'tenant.delete',
  
  // Dashboard
  'dashboard.view', 'dashboard.admin',
  
  // Reports
  'report.view', 'report.create', 'report.export'
];

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState<'create' | 'edit' | 'delete'>('create');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
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
  const [permissionFilter, setPermissionFilter] = useState('');
  const [userCountFilter, setUserCountFilter] = useState('');

  // Load roles and permissions on component mount and when pagination changes
  useEffect(() => {
    loadRoles();
    loadPermissions();
  }, [currentPage, pageSize, searchTerm, sortBy, sortDirection, permissionFilter, userCountFilter]);

  const loadRoles = async (isRefresh = false) => {
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
        ...(permissionFilter && { permissionFilter }),
        ...(userCountFilter && { userCountFilter }),
      });
      
      const response = await http.get(`/api/roles?${params}`);
      const data: PaginationResponse<Role> = response.data;
      
      setRoles(data.items);
      setTotalCount(data.totalCount);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      setError('Failed to load roles: ' + (err.response?.data?.message || err.message));
    } finally {
      setPageLoading(false);
      setRefreshing(false);
    }
  };

  const loadPermissions = async () => {
    try {
      const response = await http.get('/api/permissions?pageSize=100'); // Get all permissions for dropdown
      const data: PaginationResponse<any> = response.data;
      setPermissions(data.items);
    } catch (err: any) {
      console.error('Failed to load permissions:', err);
    }
  };

  const assignPermissionsToRole = async (roleId: string, permissionNames: string[]) => {
    const permissionMap = new Map(permissions.map(p => [p.name, p.id]));
    
    // Get current role to see existing permissions
    const currentRole = roles.find(r => r.id === roleId);
    const currentPermissionIds = currentRole?.rolePermissions?.map((rp: RolePermission) => rp.permission?.id).filter(Boolean) || [];
    
    // Remove all existing permissions first
    for (const permissionId of currentPermissionIds) {
      try {
        await http.delete(`/api/roles/${roleId}/permissions/${permissionId}`);
      } catch (err) {
        console.error(`Failed to remove permission ${permissionId}:`, err);
      }
    }
    
    // Assign new permissions
    for (const permissionName of permissionNames) {
      const permissionId = permissionMap.get(permissionName);
      if (permissionId) {
        try {
          await http.post(`/api/roles/${roleId}/permissions/${permissionId}`);
        } catch (err) {
          console.error(`Failed to assign permission ${permissionName}:`, err);
        }
      }
    }
  };

  const handleOpenDialog = (type: 'create' | 'edit' | 'delete', role?: Role) => {
    setDialogType(type);
    setSelectedRole(role);
    if (type === 'edit' && role) {
      // Convert rolePermissions array to permissions array of strings
      const permissions = role.rolePermissions?.map((rp: RolePermission) => rp.permission?.name).filter(Boolean) || [];
      setFormData({
        name: role.name,
        description: role.description || '',
        permissions: permissions,
      });
    } else if (type === 'create') {
      setFormData({
        name: '',
        description: '',
        permissions: [],
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedRole(null);
    setFormData({
      name: '',
      description: '',
      permissions: [],
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Role name is required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let createdRoleId: string | null = null;

      if (dialogType === 'create') {
        const response = await http.post('/api/roles', {
          name: formData.name,
          description: formData.description
        });
        createdRoleId = response.data.id;
        setSuccess('Role created successfully!');
      } else if (selectedRole) {
        await http.put(`/api/roles/${selectedRole.id}`, {
          name: formData.name,
          description: formData.description
        });
        createdRoleId = selectedRole.id;
        setSuccess('Role updated successfully!');
      }

      // Handle permission assignment (including removing all permissions if none selected)
      if (createdRoleId) {
        await assignPermissionsToRole(createdRoleId, formData.permissions || []);
        if (formData.permissions && formData.permissions.length > 0) {
          setSuccess(prev => prev + ' and permissions assigned successfully!');
        } else {
          setSuccess(prev => prev + ' and all permissions removed successfully!');
        }
      }

      // Refresh the roles list
      await loadRoles();
      
      // Close dialog after a short delay
      setTimeout(() => {
        handleCloseDialog();
      }, 1500);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRole) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await http.delete(`/api/roles/${selectedRole.id}`);
      setSuccess('Role deleted successfully!');
      
      // Refresh the roles list
      await loadRoles();
      
      // Close dialog after a short delay
      setTimeout(() => {
        handleCloseDialog();
      }, 1500);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Search and filter handlers
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    loadRoles(true);
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

  const handlePermissionFilterChange = (permission: string) => {
    setPermissionFilter(permission);
    setCurrentPage(1);
  };

  const handleUserCountFilterChange = (filter: string) => {
    setUserCountFilter(filter);
    setCurrentPage(1);
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };



  const getPermissionColor = (permission: string) => {
    if (!permission) return 'default';
    if (permission.includes('delete')) return 'error';
    if (permission.includes('create') || permission.includes('update')) return 'warning';
    if (permission.includes('admin')) return 'error';
    if (permission.includes('export')) return 'info';
    if (permission.includes('configure')) return 'secondary';
    return 'default';
  };

  const getAnalytics = () => {
    const totalRoles = roles.length;
    const rolesWithUsers = roles.filter(role => (role.userRoles?.length || 0) > 0).length;
    const rolesWithPermissions = roles.filter(role => (role.rolePermissions?.length || 0) > 0).length;
    const totalPermissions = roles.reduce((sum, role) => sum + (role.rolePermissions?.length || 0), 0);
    const totalUsers = roles.reduce((sum, role) => sum + (role.userRoles?.length || 0), 0);
    
    return {
      totalRoles,
      rolesWithUsers,
      rolesWithPermissions,
      totalPermissions,
      totalUsers
    };
  };

  const getRoleIcon = (roleName: string) => {
    const name = roleName.toLowerCase();
    if (name.includes('admin')) return <AdminIcon />;
    if (name.includes('manager')) return <ManagerIcon />;
    if (name.includes('user')) return <UserIcon />;
    return <SecurityIcon />;
  };

  const getRoleColor = (roleName: string) => {
    const name = roleName.toLowerCase();
    if (name.includes('admin')) return '#ef4444'; // red
    if (name.includes('manager')) return '#f59e0b'; // amber
    if (name.includes('user')) return '#3b82f6'; // blue
    return '#8b5cf6'; // purple
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
              Roles
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage user roles and their permissions
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Tooltip title="Refresh roles">
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
              Create Role
            </Button>
          </Box>
        </Box>

        {/* Analytics Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              height: '100%'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <SecurityIcon />
                  <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
                    Total Roles
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {totalCount.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Current page: {analytics.totalRoles}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <PeopleIcon color="success" />
                  <Typography variant="subtitle2" color="text.secondary">
                    Active Roles
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                  {analytics.rolesWithUsers}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  With assigned users
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <SecurityIcon color="primary" />
                  <Typography variant="subtitle2" color="text.secondary">
                    With Permissions
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {analytics.rolesWithPermissions}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Roles with permissions
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <SecurityIcon color="warning" />
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Permissions
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                  {analytics.totalPermissions}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Across all roles
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <PeopleIcon color="info" />
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Users
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                  {analytics.totalUsers}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Role assignments
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search and Filters */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <SearchBar
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search roles by name, description, or permissions..."
                loading={refreshing}
              />
            </Grid>
            <Grid item xs={12} sm={4} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => handleSortChange(e.target.value)}
                >
                  <MenuItem value="name">Name</MenuItem>
                  <MenuItem value="description">Description</MenuItem>
                  <MenuItem value="userCount">User Count</MenuItem>
                  <MenuItem value="permissionCount">Permission Count</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Permission Filter</InputLabel>
                <Select
                  value={permissionFilter}
                  label="Permission Filter"
                  onChange={(e) => handlePermissionFilterChange(e.target.value)}
                >
                  <MenuItem value="">All Permissions</MenuItem>
                  <MenuItem value="admin">Admin Permissions</MenuItem>
                  <MenuItem value="user">User Permissions</MenuItem>
                  <MenuItem value="system">System Permissions</MenuItem>
                  <MenuItem value="audit">Audit Permissions</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>User Count</InputLabel>
                <Select
                  value={userCountFilter}
                  label="User Count"
                  onChange={(e) => handleUserCountFilterChange(e.target.value)}
                >
                  <MenuItem value="">All Roles</MenuItem>
                  <MenuItem value="with-users">With Users</MenuItem>
                  <MenuItem value="without-users">Without Users</MenuItem>
                  <MenuItem value="many-users">Many Users (5+)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Roles Grid */}
        <Grid container spacing={3}>
          {pageLoading ? (
            // Loading skeleton
            Array.from({ length: 6 }).map((_, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Skeleton variant="circular" width={48} height={48} sx={{ mr: 2 }} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Skeleton variant="text" width="60%" height={32} />
                        <Skeleton variant="text" width="40%" height={20} />
                      </Box>
                    </Box>
                    <Skeleton variant="text" width="100%" height={20} sx={{ mb: 3 }} />
                    <Skeleton variant="text" width="80%" height={20} sx={{ mb: 1 }} />
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Skeleton variant="rectangular" width={80} height={24} />
                      <Skeleton variant="rectangular" width={80} height={24} />
                      <Skeleton variant="rectangular" width={80} height={24} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : roles.length === 0 ? (
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <SecurityIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h5" color="text.secondary" gutterBottom>
                  No roles found
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  {searchTerm || permissionFilter || userCountFilter 
                    ? 'Try adjusting your search criteria or filters'
                    : 'Get started by creating your first role'
                  }
                </Typography>
                {!searchTerm && !permissionFilter && !userCountFilter && (
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
                    Create First Role
                  </Button>
                )}
              </Box>
            </Grid>
          ) : (
            roles.map((role) => (
              <Grid item xs={12} md={6} lg={4} key={role.id}>
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
                    {/* Role Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar
                        sx={{
                          backgroundColor: getRoleColor(role.name),
                          width: 48,
                          height: 48,
                          mr: 2,
                        }}
                      >
                        {getRoleIcon(role.name)}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {role.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {role.userRoles?.length || 0} users
                        </Typography>
                      </Box>
                      <Box>
                        <Tooltip title="Edit role">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog('edit', role)}
                            sx={{ mr: 1 }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete role">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleOpenDialog('delete', role)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    {/* Description */}
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                      {role.description || 'No description provided'}
                    </Typography>

                    {/* Permissions */}
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1, display: 'block' }}>
                      Permissions ({role.rolePermissions?.length || 0})
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {role.rolePermissions && role.rolePermissions.slice(0, 3).map((rp: any) => (
                        <Chip
                          key={rp.permissionId}
                          label={rp.permission?.name || 'Unknown'}
                          size="small"
                          color={getPermissionColor(rp.permission?.name || '') as any}
                          variant="outlined"
                        />
                      ))}
                      {role.rolePermissions && role.rolePermissions.length > 3 && (
                        <Chip
                          label={`+${role.rolePermissions.length - 3} more`}
                          size="small"
                          variant="outlined"
                          color="default"
                        />
                      )}
                      {(!role.rolePermissions || role.rolePermissions.length === 0) && (
                        <Chip
                          label="No permissions"
                          size="small"
                          variant="outlined"
                          color="default"
                        />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>

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

        {/* Create/Edit/Delete Role Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {dialogType === 'create' && 'Create New Role'}
            {dialogType === 'edit' && 'Edit Role'}
            {dialogType === 'delete' && 'Delete Role'}
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
            {(dialogType === 'create' || dialogType === 'edit') && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                <TextField
                  fullWidth
                  label="Role Name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
                
                <CheckboxGroup
                  title="Permissions"
                  options={availablePermissions.map(permission => ({
                    value: permission,
                    label: permission,
                    description: `Allow ${permission.replace('.', ' ')}`,
                    chip: {
                      label: permission.split('.')[1],
                      color: getPermissionColor(permission) as any,
                      variant: 'outlined'
                    }
                  }))}
                  selectedValues={formData.permissions || []}
                  onSelectionChange={(selectedPermissions) => 
                    setFormData(prev => ({ ...prev, permissions: selectedPermissions }))
                  }
                  maxHeight={300}
                  showCheckAll={true}
                  showChips={true}
                  dense={true}
                />
              </Box>
            )}
            {dialogType === 'delete' && selectedRole && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Are you sure you want to delete the role "{selectedRole.name}"?
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                  This action cannot be undone. All users assigned to this role will lose their permissions.
                </Typography>
                {selectedRole.userRoles && selectedRole.userRoles.length > 0 && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Warning:</strong> This role is currently assigned to {selectedRole.userRoles.length} user(s). 
                      Deleting this role will remove all permissions from these users.
                    </Typography>
                  </Alert>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={loading}>Cancel</Button>
            {(dialogType === 'create' || dialogType === 'edit') && (
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
                {loading ? (dialogType === 'create' ? 'Creating...' : 'Updating...') : (dialogType === 'create' ? 'Create Role' : 'Save Changes')}
              </Button>
            )}
            {dialogType === 'delete' && (
              <Button
                onClick={handleDeleteRole}
                color="error"
                variant="contained"
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete Role'}
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
}


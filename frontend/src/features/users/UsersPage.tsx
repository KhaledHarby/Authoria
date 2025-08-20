import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Alert,
  CircularProgress,
  useTheme,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemSecondaryAction,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  FilterList as FilterIcon,
  SupervisorAccount,
  Security as SecurityIcon,
  RemoveCircle as RemoveIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import Layout from '../../ui/Layout';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import Pagination from '../../ui/Pagination';
import SearchBar from '../../ui/SearchBar';
import CheckboxGroup from '../../ui/CheckboxGroup';
import http from '../../api/http';
import { userPermissionsApi, type UserPermissionsResponse, type UserPermission, type RolePermission } from '../../api/userPermissionsApi';
import { applicationsApi } from '../../api/applicationsApi';
import { utcToLocalDate, utcToLocalDateTime } from '../../utils/dateUtils';
import DateTimeDisplay from '../../components/DateTimeDisplay';

// User interface
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  lastLoginAtUtc?: string | null;
  userRoles?: { roleId: string; roleName: string }[];
}

interface Role {
  id: string;
  name: string;
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

export default function UsersPage() {
  const applicationId = useSelector((state: RootState) => (state as any).auth?.applicationId as string | null);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState<'create' | 'view' | 'edit' | 'delete' | 'assign-role' | 'manage-permissions'>('view');
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    status: 'Active'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pageLoading, setPageLoading] = useState(true);
  const theme = useTheme();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Role management state
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  // Permission management state
  const [userPermissions, setUserPermissions] = useState<UserPermissionsResponse | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [permissionTabValue, setPermissionTabValue] = useState(0);
  const [permissionNotes, setPermissionNotes] = useState('');

  // Applications linked to the selected user (for View dialog)
  const [userApplications, setUserApplications] = useState<{ id: string; name: string }[]>([]);

  // Load users
  const loadUsers = async () => {
    try {
      setPageLoading(true);
      const response = await http.get(`/api/users?page=${currentPage}&pageSize=${pageSize}&searchTerm=${searchTerm}`);
      const data: PaginationResponse<User> = response.data;
      setUsers(data.items);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setPageLoading(false);
    }
  };

  // Load roles
  const loadRoles = async () => {
    try {
      const response = await http.get('/api/roles');
      setRoles(response.data.items || response.data);
    } catch (err: any) {
      console.error('Failed to load roles:', err);
    }
  };

  // Load permissions
  const loadPermissions = async () => {
    try {
      const response = await http.get('/api/permissions');
      setPermissions(response.data.items || response.data);
    } catch (err: any) {
      console.error('Failed to load permissions:', err);
    }
  };

  // Load user permissions
  const loadUserPermissions = async (userId: string) => {
    try {
      const data = await userPermissionsApi.getUserPermissions(userId);
      setUserPermissions(data);
      setSelectedPermissionIds(data.directPermissions.map(p => p.permissionId));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load user permissions');
    }
  };

  // Load user applications
  const loadUserApps = async (userId: string) => {
    try {
      const apps = await applicationsApi.listUserApplications(userId);
      setUserApplications(apps);
    } catch (err: any) {
      console.error('Failed to load user applications:', err);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [currentPage, pageSize, searchTerm]);

  // Reload when selected application changes; reset to first page
  useEffect(() => {
    setCurrentPage(1);
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  useEffect(() => {
    loadRoles();
    loadPermissions();
  }, []);

  const handleOpenCreateDialog = () => {
    setDialogType('create');
    setNewUser({ firstName: '', lastName: '', email: '', password: '', status: 'Active' });
    setError('');
    setSuccess('');
    setOpenDialog(true);
  };

  const handleOpenDialog = (user: User, type: 'view' | 'edit' | 'delete' | 'assign-role' | 'manage-permissions') => {
    setSelectedUser(user);
    setDialogType(type);
    setError('');
    setSuccess('');
    
    if (type === 'assign-role') {
      setSelectedRoleIds(user.userRoles?.map(ur => ur.roleId) || []);
    } else if (type === 'manage-permissions') {
      loadUserPermissions(user.id);
      setPermissionTabValue(0);
      setPermissionNotes('');
    } else if (type === 'view') {
      loadUserApps(user.id);
    }
    
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setSelectedUser(null);
    setError('');
    setSuccess('');
    setUserApplications([]);
  };

  const handleAction = (action: 'view' | 'edit' | 'delete' | 'assign-role' | 'manage-permissions') => {
    if (selectedUser) {
      handleOpenDialog(selectedUser, action);
    }
  };

  const handleCreateUser = async () => {
    try {
      setLoading(true);
      setError('');
      await http.post('/api/users', newUser);
      setSuccess('User created successfully');
      loadUsers();
        handleDialogClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    try {
    setLoading(true);
    setError('');
      await http.put(`/api/users/${selectedUser.id}`, newUser);
      setSuccess('User updated successfully');
      loadUsers();
      handleDialogClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
    setLoading(true);
    setError('');
      await http.delete(`/api/users/${selectedUser.id}`);
      setSuccess('User deleted successfully');
      loadUsers();
      handleDialogClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRoleFromDialog = async () => {
    if (!selectedUser) return;
    
    try {
      setLoading(true);
      setError('');
      await http.post(`/api/users/${selectedUser.id}/roles`, { roleIds: selectedRoleIds });
      setSuccess('Roles assigned successfully');
      loadUsers();
        handleDialogClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to assign roles');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignPermission = async () => {
    if (!selectedUser || !permissionNotes.trim()) return;
    
    try {
      setLoading(true);
    setError('');
      
      const availablePermissions = permissions.filter(p => 
        !userPermissions?.directPermissions.some(dp => dp.permissionId === p.id)
      );
      
      if (availablePermissions.length === 0) {
        setError('No available permissions to assign');
      return;
    }

      const permissionToAssign = availablePermissions[0];
      
      await userPermissionsApi.assignPermission({
        userId: selectedUser.id,
        permissionId: permissionToAssign.id,
        notes: permissionNotes
      });
      
      setSuccess('Permission assigned successfully');
      setPermissionNotes('');
      if (selectedUser) {
        loadUserPermissions(selectedUser.id);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to assign permission');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePermission = async (permissionId: string) => {
    if (!selectedUser) return;

    try {
    setLoading(true);
    setError('');
      
      await userPermissionsApi.removePermission({
        userId: selectedUser.id,
        permissionId: permissionId
      });
      
      setSuccess('Permission removed successfully');
      if (selectedUser) {
        loadUserPermissions(selectedUser.id);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove permission');
    } finally {
      setLoading(false);
    }
  };

    // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const handleSearchChange = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
    setCurrentPage(1);
  };

  const filteredUsers = users.filter((user) => {
    const matchesRole = !filterRole || user.userRoles?.some(ur => ur.roleName === filterRole);
    const matchesStatus = !filterStatus || user.status === filterStatus;
    
    return matchesRole && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    return status === 'Active' ? 'success' : 'error';
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'error';
      case 'Manager':
        return 'warning';
      case 'Auditor':
        return 'info';
      case 'Developer':
        return 'secondary';
      case 'User':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Layout>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              Users
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Manage user accounts and permissions
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
              },
            }}
          >
            Add User
          </Button>
        </Box>

        {/* Enhanced Search and Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1, minWidth: 300 }}>
                <SearchBar
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Search users by name or email..."
                  showFilters={true}
                                        filters={[
                        {
                          label: 'Role',
                          value: filterRole,
                          options: [
                            { label: 'All Roles', value: '' },
                            { label: 'Admin', value: 'Admin' },
                            { label: 'Manager', value: 'Manager' },
                            { label: 'User', value: 'User' },
                            { label: 'Auditor', value: 'Auditor' },
                            { label: 'Developer', value: 'Developer' }
                          ],
                          onChange: setFilterRole
                        },
                    {
                      label: 'Status',
                      value: filterStatus,
                      options: [
                        { label: 'All Statuses', value: '' },
                        { label: 'Active', value: 'Active' },
                        { label: 'Inactive', value: 'Inactive' },
                        { label: 'Locked', value: 'Locked' }
                      ],
                      onChange: setFilterStatus
                    }
                  ]}
                />
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardContent>
            {pageLoading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                        <TableCell>User</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Roles</TableCell>
                        <TableCell>Last Login</TableCell>
                        <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredUsers.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                  {user.firstName} {user.lastName}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                          <TableCell>{user.email}</TableCell>
                      <TableCell>
                              <Chip
                              label={user.status}
                              color={getStatusColor(user.status) as any}
                                size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              {user.userRoles?.map((role) => (
                            <Chip
                                  key={role.roleId}
                                  label={role.roleName}
                                  color={getRoleColor(role.roleName) as any}
                              size="small"
                              variant="outlined"
                            />
                              )) || <Typography variant="body2" color="text.secondary">No roles</Typography>}
                        </Box>
                      </TableCell>
                      <TableCell>
                            <DateTimeDisplay 
                              utcDate={user.lastLoginAtUtc} 
                              format="date" 
                              variant="body2"
                              showTooltip={true}
                            />
                      </TableCell>
                          <TableCell align="right">
                        <IconButton
                              onClick={(e) => {
                                setAnchorEl(e.currentTarget);
                                setSelectedUser(user);
                              }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
              </>
        )}
          </CardContent>
        </Card>

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
        >
          <MenuItem onClick={() => { setAnchorEl(null); handleAction('view'); }}>
            <ListItemIcon>
              <VisibilityIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Details</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { setAnchorEl(null); handleAction('edit'); }}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit User</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { setAnchorEl(null); handleAction('assign-role'); }}>
            <ListItemIcon>
              <SupervisorAccount fontSize="small" />
            </ListItemIcon>
            <ListItemText>Assign Roles</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { setAnchorEl(null); handleAction('manage-permissions'); }}>
            <ListItemIcon>
              <SecurityIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Manage Permissions</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => { setAnchorEl(null); handleAction('delete'); }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete User</ListItemText>
          </MenuItem>
        </Menu>

        {/* Dialog */}
        <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="md" fullWidth>
                  <DialogTitle>
          {dialogType === 'create' && 'Create New User'}
            {dialogType === 'view' && `User Details - ${selectedUser?.firstName} ${selectedUser?.lastName}`}
            {dialogType === 'edit' && `Edit User - ${selectedUser?.firstName} ${selectedUser?.lastName}`}
          {dialogType === 'delete' && 'Delete User'}
          {dialogType === 'assign-role' && 'Assign Role'}
            {dialogType === 'manage-permissions' && 'Manage Permissions'}
        </DialogTitle>
          <DialogContent>
                {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}
                {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                    {success}
                  </Alert>
                )}

            {dialogType === 'create' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                <TextField
                  label="First Name"
                  value={newUser.firstName}
                  onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                  fullWidth
                  required
                />
                <TextField
                  label="Last Name"
                  value={newUser.lastName}
                  onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                  fullWidth
                  required
                />
                <TextField
                  label="Email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  fullWidth
                  required
                />
                <TextField
                  label="Password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  fullWidth
                  required
                />
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={newUser.status}
                    onChange={(e) => setNewUser({ ...newUser, status: e.target.value })}
                    label="Status"
                  >
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                    <MenuItem value="Locked">Locked</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            )}

            {dialogType === 'view' && selectedUser && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="h6" gutterBottom>User Information</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
              <Box>
                    <Typography variant="body2" color="text.secondary">Name</Typography>
                    <Typography variant="body1">{selectedUser.firstName} {selectedUser.lastName}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Email</Typography>
                    <Typography variant="body1">{selectedUser.email}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Status</Typography>
                    <Chip label={selectedUser.status} color={getStatusColor(selectedUser.status) as any} size="small" />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Last Login</Typography>
                    <DateTimeDisplay 
                      utcDate={selectedUser.lastLoginAtUtc} 
                      format="datetime" 
                      variant="body1"
                      showTooltip={true}
                    />
                  </Box>
                </Box>
                
                <Typography variant="h6" gutterBottom>Roles</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  {selectedUser.userRoles?.map((role) => (
                    <Chip
                      key={role.roleId}
                      label={role.roleName}
                      color={getRoleColor(role.roleName) as any}
                      variant="outlined"
                    />
                  )) || <Typography variant="body2" color="text.secondary">No roles assigned</Typography>}
                </Box>

                <Typography variant="h6" gutterBottom>Applications</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {userApplications.length > 0 ? (
                    userApplications.map(app => (
                      <Chip key={app.id} label={app.name} color="primary" variant="outlined" />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">No applications linked</Typography>
                  )}
                </Box>
              </Box>
            )}

            {dialogType === 'edit' && selectedUser && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <TextField
                      label="First Name"
                  value={newUser.firstName}
                  onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                  fullWidth
                  required
                    />
                    <TextField
                      label="Last Name"
                  value={newUser.lastName}
                  onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                  fullWidth
                  required
                />
                <TextField
                  label="Email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  fullWidth
                  required
                />
                <TextField
                  label="Password (leave blank to keep current)"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  fullWidth
                />
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                    value={newUser.status}
                    onChange={(e) => setNewUser({ ...newUser, status: e.target.value })}
                        label="Status"
                      >
                        <MenuItem value="Active">Active</MenuItem>
                        <MenuItem value="Inactive">Inactive</MenuItem>
                    <MenuItem value="Locked">Locked</MenuItem>
                      </Select>
                    </FormControl>
              </Box>
            )}

            {dialogType === 'delete' && selectedUser && (
              <Typography variant="body1">
                Are you sure you want to delete user "{`${selectedUser.firstName} ${selectedUser.lastName}`}"? This action cannot be undone.
              </Typography>
            )}

            {dialogType === 'assign-role' && selectedUser && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                    <Box>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Assign Roles to {selectedUser.firstName} {selectedUser.lastName}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                    Current Roles: {selectedUser.userRoles?.map(ur => ur.roleName).join(', ') || 'No Roles Assigned'}
                        </Typography>
                      </Box>
                      
                      <CheckboxGroup
                        title="Select Roles"
                        options={[
                          { value: '', label: 'No Role', description: 'Remove all role assignments' },
                          ...roles.map(role => ({
                            value: role.id,
                            label: role.name,
                      description: `Assign ${role.name} role`,
                            chip: {
                              label: role.name,
                              color: getRoleColor(role.name) as any,
                        variant: 'outlined' as const
                            }
                          }))
                        ]}
                        selectedValues={selectedRoleIds}
                        onSelectionChange={setSelectedRoleIds}
                        maxHeight={250}
                        showCheckAll={true}
                        showChips={true}
                        dense={true}
                      />
                      
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Select one or more roles to assign to this user. Multiple roles can be assigned.
                      </Typography>
                    </Box>
            )}

            {dialogType === 'manage-permissions' && userPermissions && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Manage Permissions for {userPermissions.userName}
                </Typography>

                <Tabs value={permissionTabValue} onChange={(_, newValue) => setPermissionTabValue(newValue)} sx={{ mb: 3 }}>
                  <Tab label="Direct Permissions" />
                  <Tab label="Role Permissions" />
                  <Tab label="All Permissions" />
                </Tabs>

                {permissionTabValue === 0 && (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Typography variant="subtitle1">Direct Permissions</Typography>
                      <Tooltip title="Direct permissions are assigned specifically to this user, independent of their roles">
                        <InfoIcon fontSize="small" color="action" />
                      </Tooltip>
                  </Box>
                    
                    {userPermissions.directPermissions.length > 0 ? (
                      <List>
                        {userPermissions.directPermissions.map((permission) => (
                          <ListItem key={permission.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {permission.permissionName}
                              </Typography>
                              {permission.permissionDescription && (
                                <Typography variant="body2" color="text.secondary">
                                  {permission.permissionDescription}
                                </Typography>
                              )}
                              <Typography variant="caption" color="text.secondary">
                                Granted by: {permission.grantedByUserName || 'System'} on {new Date(permission.grantedAtUtc).toLocaleDateString()}
                              </Typography>
                              {permission.notes && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Notes: {permission.notes}
                  </Typography>
                )}
                            </Box>
                            <ListItemSecondaryAction>
                              <IconButton
                                edge="end"
                                onClick={() => handleRemovePermission(permission.permissionId)}
                                disabled={loading}
                                color="error"
                              >
                                <RemoveIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                        No direct permissions assigned
                      </Typography>
                    )}

                    <Divider sx={{ my: 3 }} />
                    
                    <Typography variant="subtitle1" sx={{ mb: 2 }}>Assign New Permission</Typography>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                      <TextField
                        label="Notes (optional)"
                        value={permissionNotes}
                        onChange={(e) => setPermissionNotes(e.target.value)}
                        placeholder="Reason for granting this permission..."
                        fullWidth
                        multiline
                        rows={2}
                      />
                      <Button
                        variant="contained"
                        onClick={handleAssignPermission}
                        disabled={loading || !permissionNotes.trim()}
                        startIcon={<AddIcon />}
                      >
                        {loading ? 'Assigning...' : 'Assign Permission'}
                      </Button>
                    </Box>
                  </Box>
                )}

                {permissionTabValue === 1 && (
                    <Box>
                    <Typography variant="subtitle1" sx={{ mb: 2 }}>Permissions from Roles</Typography>
                    {userPermissions.rolePermissions.length > 0 ? (
                      <List>
                        {userPermissions.rolePermissions.map((role) => (
                          <ListItem key={role.roleId} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                {role.roleName} Role
                      </Typography>
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
                                {role.permissions.map((permission) => (
                                  <Chip
                                    key={permission}
                                    label={permission}
                                    size="small"
                                    variant="outlined"
                                  />
                                ))}
                              </Box>
                            </Box>
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                        No role permissions available
                      </Typography>
                    )}
                    </Box>
                )}

                {permissionTabValue === 2 && (
                  <Box>
                    <Typography variant="subtitle1" sx={{ mb: 2 }}>All Permissions (Combined)</Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {userPermissions.allPermissions.map((permission) => (
                        <Chip
                          key={permission}
                          label={permission}
                          size="small"
                          color="primary"
                        />
                      ))}
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                      This shows all permissions the user has access to, whether through roles or direct assignments.
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose}>Cancel</Button>
            {dialogType === 'edit' && (
              <Button onClick={handleUpdateUser} variant="contained" disabled={loading}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': { background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)' },
                }}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
            {dialogType === 'create' && (
              <Button 
                onClick={handleCreateUser} 
                variant="contained"
                disabled={loading}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                  },
                }}
              >
                {loading ? 'Creating...' : 'Create User'}
              </Button>
            )}
            {dialogType === 'delete' && (
              <Button 
                onClick={handleDeleteUser} 
                color="error" 
                variant="contained"
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </Button>
            )}
            {dialogType === 'assign-role' && (
              <Button 
                onClick={handleAssignRoleFromDialog} 
                variant="contained"
                disabled={loading}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                  },
                }}
              >
                {loading ? 'Assigning...' : 'Assign Role'}
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
}


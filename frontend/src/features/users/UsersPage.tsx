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
} from '@mui/icons-material';
import Layout from '../../ui/Layout';
import Pagination from '../../ui/Pagination';
import SearchBar from '../../ui/SearchBar';
import CheckboxGroup from '../../ui/CheckboxGroup';
import http from '../../api/http';

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
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState<'create' | 'view' | 'edit' | 'delete' | 'assign-role'>('view');
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
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Edit dialog state
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', status: 'Active' });
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  // Load users on component mount and when pagination changes
  useEffect(() => {
    loadUsers();
  }, [currentPage, pageSize, searchTerm]);

  const loadUsers = async () => {
    try {
      setPageLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        ...(searchTerm && { searchTerm }),
      });
      
      const response = await http.get(`/api/users?${params}`);
      const data: PaginationResponse<User> = response.data;
      
      setUsers(data.items);
      setTotalCount(data.totalCount);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      setError('Failed to load users: ' + (err.response?.data?.message || err.message));
    } finally {
      setPageLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: User) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handleAction = (action: 'view' | 'edit' | 'delete' | 'assign-role') => {
    setDialogType(action);
    setOpenDialog(true);
    
    if (action === 'edit' && selectedUser) {
      // Initialize edit form with current user values
      setEditForm({
        firstName: selectedUser.firstName,
        lastName: selectedUser.lastName,
        status: selectedUser.status || 'Active',
      });
      // Set current roles as selected
      const currentRoleIds = selectedUser.userRoles?.map(ur => ur.roleId).filter(Boolean) || [];
      setSelectedRoleIds(currentRoleIds);
      // Load roles for assignment
      void loadRoles();
    }
    
    if (action === 'assign-role' && selectedUser) {
      // Set current roles as selected
      const currentRoleIds = selectedUser.userRoles?.map(ur => ur.roleId).filter(Boolean) || [];
      setSelectedRoleIds(currentRoleIds);
      // Load roles for assignment
      void loadRoles();
    }
    
    // Don't close the menu immediately - let the dialog handle it
    setAnchorEl(null);
  };

  const loadRoles = async () => {
    try {
      const res = await http.get('/api/roles?pageSize=100'); // Get all roles for dropdown
      const data: PaginationResponse<Role> = res.data;
      setRoles(data.items);
    } catch (err) {
      // ignore silently in UI; roles section will be empty
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Update user basic information
      await http.put(`/api/users/${selectedUser.id}`, {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        status: editForm.status,
      });
      
      // Handle multiple role assignments
      const currentRoleIds = selectedUser.userRoles?.map(ur => ur.roleId).filter(Boolean) || [];
      const hasRoleChanges = JSON.stringify(currentRoleIds.sort()) !== JSON.stringify(selectedRoleIds.sort());
      
      if (hasRoleChanges) {
        // Remove all current roles first
        for (const currentRoleId of currentRoleIds) {
          if (currentRoleId) {
            await http.delete(`/api/roles/assign/${selectedUser.id}/${currentRoleId}`);
          }
        }
        
        // Assign new roles
        for (const roleId of selectedRoleIds) {
          if (roleId) {
            await http.post(`/api/roles/assign/${selectedUser.id}/${roleId}`);
          }
        }
        
        const roleCount = selectedRoleIds.length;
        if (roleCount === 0) {
          setSuccess('User updated and all roles removed successfully!');
        } else if (roleCount === 1) {
          setSuccess('User updated and role assigned successfully!');
        } else {
          setSuccess(`User updated and ${roleCount} roles assigned successfully!`);
        }
      } else {
        setSuccess('User updated successfully!');
      }
      
      await loadUsers();
      setTimeout(() => {
        handleDialogClose();
      }, 1200);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRoleId) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await http.post(`/api/roles/assign/${selectedUser.id}/${selectedRoleId}`);
      setSuccess('Role assigned to user successfully!');
      // Optionally reload users
      await loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to assign role.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRoleFromDialog = async () => {
    if (!selectedUser) {
      setError('Please select a user');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Remove all current roles first
      const currentRoleIds = selectedUser.userRoles?.map(ur => ur.role?.id).filter(Boolean) || [];
      for (const currentRoleId of currentRoleIds) {
        if (currentRoleId) {
          await http.delete(`/api/roles/assign/${selectedUser.id}/${currentRoleId}`);
        }
      }
      
      // Assign new roles
      for (const roleId of selectedRoleIds) {
        if (roleId) {
          await http.post(`/api/roles/assign/${selectedUser.id}/${roleId}`);
        }
      }
      
      const roleCount = selectedRoleIds.length;
      if (roleCount === 0) {
        setSuccess('All roles removed from user successfully!');
      } else if (roleCount === 1) {
        setSuccess('Role assigned to user successfully!');
      } else {
        setSuccess(`${roleCount} roles assigned to user successfully!`);
      }
      
      await loadUsers();
      
      // Close dialog after a short delay
      setTimeout(() => {
        handleDialogClose();
      }, 1500);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to assign roles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateDialog = () => {
    setDialogType('create');
    setOpenDialog(true);
    setNewUser({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      status: 'Active'
    });
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setSelectedUser(null);
    setNewUser({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      status: 'Active'
    });
    setEditForm({
      firstName: '',
      lastName: '',
      status: 'Active'
    });
    setSelectedRoleId('');
    setSelectedRoleIds([]);
    setError('');
    setSuccess('');
  };

  const handleCreateUser = async () => {
    if (!newUser.firstName || !newUser.lastName || !newUser.email || !newUser.password) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await http.post('/api/users', {
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        password: newUser.password
      });

      setSuccess('User created successfully!');
      
      // Refresh the users list
      await loadUsers();
      
      // Close dialog after a short delay
      setTimeout(() => {
        handleDialogClose();
      }, 1500);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await http.delete(`/api/users/${selectedUser.id}`);
      setSuccess('User deleted successfully!');
      
      // Refresh the users list
      await loadUsers();
      
      // Close dialog after a short delay
      setTimeout(() => {
        handleDialogClose();
      }, 1500);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete user. Please try again.');
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
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handleSearchChange = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
    setCurrentPage(1); // Reset to first page when searching
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
                        { label: 'All Status', value: '' },
                        { label: 'Active', value: 'Active' },
                        { label: 'Inactive', value: 'Inactive' }
                      ],
                      onChange: setFilterStatus
                    }
                  ]}
                  loading={pageLoading}
                />
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardContent>
            {pageLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Last Login</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredUsers.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                            {`${user.firstName[0]}${user.lastName[0]}`}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {`${user.firstName} ${user.lastName}`}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              {user.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {user.userRoles && user.userRoles.length > 0 ? (
                            user.userRoles.map((userRole, index) => (
                              <Chip
                                key={userRole.roleId || index}
                                label={userRole.roleName || 'Unknown Role'}
                                color={getRoleColor(userRole.roleName) as any}
                                size="small"
                                sx={{ fontSize: '0.75rem' }}
                              />
                            ))
                          ) : (
                            <Chip
                              label="No Role"
                              color="default"
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.status}
                          color={getStatusColor(user.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {user.lastLoginAtUtc ? new Date(user.lastLoginAtUtc).toLocaleString() : 'Never'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, user)}
                          size="small"
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            )}
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

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              minWidth: 150,
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            },
          }}
        >
          <MenuItem onClick={() => handleAction('view')}>
            <ListItemIcon>
              <VisibilityIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Details</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleAction('edit')}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit User</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleAction('assign-role')}>
            <ListItemIcon>
              <SupervisorAccount fontSize="small" />
            </ListItemIcon>
            <ListItemText>Assign Role</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleAction('delete')} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" sx={{ color: 'error.main' }} />
            </ListItemIcon>
            <ListItemText>Delete User</ListItemText>
          </MenuItem>
        </Menu>

        {/* Dialog */}
        <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="sm" fullWidth>
                  <DialogTitle>
          {dialogType === 'create' && 'Create New User'}
          {dialogType === 'view' && 'User Details'}
          {dialogType === 'edit' && 'Edit User'}
          {dialogType === 'delete' && 'Delete User'}
          {dialogType === 'assign-role' && 'Assign Role'}
        </DialogTitle>
          <DialogContent>
            {dialogType === 'create' && (
              <Box sx={{ pt: 1 }}>
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
                <TextField
                  fullWidth
                  label="First Name"
                  value={newUser.firstName}
                  onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                  sx={{ mb: 3 }}
                  disabled={loading}
                />
                <TextField
                  fullWidth
                  label="Last Name"
                  value={newUser.lastName}
                  onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                  sx={{ mb: 3 }}
                  disabled={loading}
                />
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  sx={{ mb: 3 }}
                  disabled={loading}
                />
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  sx={{ mb: 3 }}
                  disabled={loading}
                />
              </Box>
            )}
            {selectedUser && (
              <Box>
                {dialogType === 'view' && (
                  <Box>
                    <Typography variant="body1">
                      <strong>Name:</strong> {`${selectedUser.firstName} ${selectedUser.lastName}`}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Email:</strong> {selectedUser.email}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Role:</strong> {selectedUser.userRoles?.[0]?.role?.name || 'No Role'}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Status:</strong> {selectedUser.status}
                    </Typography>
                  </Box>
                )}
                {dialogType === 'edit' && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                    {error && (
                      <Alert severity="error">{error}</Alert>
                    )}
                    {success && (
                      <Alert severity="success">{success}</Alert>
                    )}
                    <TextField
                      fullWidth
                      label="First Name"
                      value={editForm.firstName}
                      onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                      disabled={loading}
                    />
                    <TextField
                      fullWidth
                      label="Last Name"
                      value={editForm.lastName}
                      onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                      disabled={loading}
                    />
                    <TextField fullWidth label="Email" value={selectedUser.email} disabled />
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        label="Status"
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value as string })}
                        disabled={loading}
                      >
                        <MenuItem value="Active">Active</MenuItem>
                        <MenuItem value="Inactive">Inactive</MenuItem>
                      </Select>
                    </FormControl>

                    <Box>
                      <Typography variant="h6" sx={{ mb: 1 }}>Role Assignment</Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                          Current Roles: {selectedUser.userRoles?.map(ur => ur.role?.name).join(', ') || 'No Roles Assigned'}
                        </Typography>
                      </Box>
                      
                      <CheckboxGroup
                        title="Select Roles"
                        options={[
                          { value: '', label: 'No Role', description: 'Remove all role assignments' },
                          ...roles.map(role => ({
                            value: role.id,
                            label: role.name,
                            description: role.description || `Assign ${role.name} role`,
                            chip: {
                              label: role.name,
                              color: getRoleColor(role.name) as any,
                              variant: 'outlined'
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
                      
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>
                        Select one or more roles to assign to this user. Multiple roles can be assigned.
                      </Typography>
                    </Box>
                  </Box>
                )}
                {dialogType === 'delete' && (
                  <Typography variant="body1">
                    Are you sure you want to delete user "{`${selectedUser.firstName} ${selectedUser.lastName}`}"? This action cannot be undone.
                  </Typography>
                )}
                {dialogType === 'assign-role' && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                    {error && (
                      <Alert severity="error">{error}</Alert>
                    )}
                    {success && (
                      <Alert severity="success">{success}</Alert>
                    )}
                    
                    <Box>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        Assign Roles to {selectedUser.firstName} {selectedUser.lastName}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                        Current Roles: {selectedUser.userRoles?.map(ur => ur.role?.name).join(', ') || 'No Roles Assigned'}
                      </Typography>
                    </Box>

                    <CheckboxGroup
                      title="Select Roles"
                      options={[
                        { value: '', label: 'No Role', description: 'Remove all role assignments' },
                        ...roles.map(role => ({
                          value: role.id,
                          label: role.name,
                          description: role.description || `Assign ${role.name} role`,
                          chip: {
                            label: role.name,
                            color: getRoleColor(role.name) as any,
                            variant: 'outlined'
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


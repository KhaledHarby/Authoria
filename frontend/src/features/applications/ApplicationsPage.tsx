import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  TextField,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Autocomplete,
  Skeleton,
  Menu,
  MenuItem,
  Snackbar,
  Alert,
  ListItemIcon,
} from '@mui/material';
import { 
  Add as AddIcon, 
  CheckCircle as CheckIcon, 
  Apps as AppsIcon, 
  Info as InfoIcon, 
  PersonRemove as PersonRemoveIcon, 
  GroupAdd as GroupAddIcon, 
  MoreVert as MoreVertIcon, 
  Sort as SortIcon, 
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import Layout from '../../ui/Layout';
import { applicationsApi, type Application, type ApplicationUser } from '../../api/applicationsApi';
import { utcToLocalDateTime } from '../../utils/dateUtils';
import DateTimeDisplay from '../../components/DateTimeDisplay';
import { useDispatch, useSelector } from 'react-redux';
import { setApplicationId } from '../auth/authSlice';
import type { RootState } from '../../app/store';
import http from '../../api/http';

interface UserBrief { id: string; firstName: string; lastName: string; email: string; }

type SortKey = 'name-asc' | 'name-desc' | 'created-desc' | 'created-asc';

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const dispatch = useDispatch();
  const activeAppId = useSelector((s: RootState) => (s as any).auth?.applicationId as string | null);

  // Manage Users Dialog state
  const [manageOpen, setManageOpen] = useState(false);
  const [manageApp, setManageApp] = useState<Application | null>(null);
  const [appUsers, setAppUsers] = useState<ApplicationUser[]>([]);
  const [allUsers, setAllUsers] = useState<UserBrief[]>([]);
  const [selectedToAdd, setSelectedToAdd] = useState<UserBrief[]>([]);
  const [manageLoading, setManageLoading] = useState(false);

  // Edit Dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editApp, setEditApp] = useState<Application | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Delete Dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteApp, setDeleteApp] = useState<Application | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // UI enhancements
  const [search, setSearch] = useState('');
  const [sortAnchor, setSortAnchor] = useState<null | HTMLElement>(null);
  const [sortKey, setSortKey] = useState<SortKey>('name-asc');
  const [menuAnchor, setMenuAnchor] = useState<{ anchor: HTMLElement; app: Application } | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await applicationsApi.list();
      setApps(data);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const handleCreate = async () => {
    if (!name.trim()) { setError('Name is required'); return; }
    try {
      setLoading(true);
      await applicationsApi.create({ name: name.trim(), description: description.trim() || undefined });
      setOpen(false);
      setName('');
      setDescription('');
      setSuccess('Application created');
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to create application');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editApp || !editName.trim()) { setError('Name is required'); return; }
    try {
      setEditLoading(true);
      await applicationsApi.update(editApp.id, { 
        name: editName.trim(), 
        description: editDescription.trim() || undefined 
      });
      setEditOpen(false);
      setEditApp(null);
      setEditName('');
      setEditDescription('');
      setSuccess('Application updated');
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to update application');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteApp) return;
    try {
      setDeleteLoading(true);
      await applicationsApi.delete(deleteApp.id);
      setDeleteOpen(false);
      setDeleteApp(null);
      setSuccess('Application deleted');
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to delete application');
    } finally {
      setDeleteLoading(false);
    }
  };

  const openEditDialog = (app: Application) => {
    setEditApp(app);
    setEditName(app.name);
    setEditDescription(app.description || '');
    setEditOpen(true);
    setMenuAnchor(null);
  };

  const openDeleteDialog = (app: Application) => {
    setDeleteApp(app);
    setDeleteOpen(true);
    setMenuAnchor(null);
  };

  const openManageUsers = async (app: Application) => {
    try {
      setManageLoading(true);
      setManageApp(app);
      setManageOpen(true);
      const [usersInApp, usersAll] = await Promise.all([
        applicationsApi.listApplicationUsers(app.id),
        fetchAllUsers()
      ]);
      setAppUsers(usersInApp);
      setAllUsers(usersAll);
      setSelectedToAdd([]);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load application users');
    } finally {
      setManageLoading(false);
    }
  };

  const fetchAllUsers = async (): Promise<UserBrief[]> => {
    const res = await http.get('/api/users/all-tenant?page=1&pageSize=1000');
    const items = res.data.items || [];
    return items.map((u: any) => ({ id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email }));
  };

  const removeUserFromApp = async (userId: string) => {
    if (!manageApp) return;
    try {
      setManageLoading(true);
      await applicationsApi.removeUserFromApplication(manageApp.id, userId);
      setAppUsers(prev => prev.filter(u => u.id !== userId));
      setSuccess('User removed from application');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to remove user');
    } finally {
      setManageLoading(false);
    }
  };

  const addSelectedUsers = async () => {
    if (!manageApp || selectedToAdd.length === 0) return;
    try {
      setManageLoading(true);
      for (const user of selectedToAdd) {
        await applicationsApi.addUserToApplication(manageApp.id, user.id);
      }
      const refreshed = await applicationsApi.listApplicationUsers(manageApp.id);
      setAppUsers(refreshed);
      setSelectedToAdd([]);
      setSuccess('Users added to application');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to add users');
    } finally {
      setManageLoading(false);
    }
  };

  const filteredSortedApps = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = apps.filter(a => !term || a.name.toLowerCase().includes(term) || (a.description || '').toLowerCase().includes(term));
    switch (sortKey) {
      case 'name-asc': list = [...list].sort((a,b)=>a.name.localeCompare(b.name)); break;
      case 'name-desc': list = [...list].sort((a,b)=>b.name.localeCompare(a.name)); break;
      case 'created-asc': list = [...list].sort((a,b)=>new Date(a.createdAtUtc).getTime()-new Date(b.createdAtUtc).getTime()); break;
      case 'created-desc': list = [...list].sort((a,b)=>new Date(b.createdAtUtc).getTime()-new Date(a.createdAtUtc).getTime()); break;
    }
    return list;
  }, [apps, search, sortKey]);

  return (
    <Layout>
      <Box>
        {/* Toolbar */}
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AppsIcon color="primary" /> Applications
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create, search, and manage users linked to each application. Set the active app for scoping users, roles, and permissions.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              size="small"
              placeholder="Search applications..."
              value={search}
              onChange={(e)=>setSearch(e.target.value)}
              InputProps={{ startAdornment: <SearchIcon fontSize="small" style={{ marginRight: 6, opacity: 0.6 }} /> as any }}
            />
            <Button variant="outlined" startIcon={<SortIcon />} onClick={(e)=>setSortAnchor(e.currentTarget)}>
              Sort
            </Button>
            <Menu anchorEl={sortAnchor} open={Boolean(sortAnchor)} onClose={()=>setSortAnchor(null)}>
              <MenuItem selected={sortKey==='name-asc'} onClick={()=>{setSortKey('name-asc');setSortAnchor(null);}}>Name (A→Z)</MenuItem>
              <MenuItem selected={sortKey==='name-desc'} onClick={()=>{setSortKey('name-desc');setSortAnchor(null);}}>Name (Z→A)</MenuItem>
              <MenuItem selected={sortKey==='created-desc'} onClick={()=>{setSortKey('created-desc');setSortAnchor(null);}}>Newest first</MenuItem>
              <MenuItem selected={sortKey==='created-asc'} onClick={()=>{setSortKey('created-asc');setSortAnchor(null);}}>Oldest first</MenuItem>
            </Menu>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
              New
            </Button>
          </Stack>
        </Stack>

        {/* Grid */}
        {loading ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
              gap: 2
            }}
          >
            {Array.from({length:6}).map((_,i)=> (
              <Card key={i} sx={{ p:2, borderRadius:3 }}>
                <Skeleton variant="text" width="60%" height={28} />
                <Skeleton variant="text" width="90%" />
                <Skeleton variant="rectangular" height={32} sx={{ mt: 1, borderRadius: 1 }} />
              </Card>
            ))}
          </Box>
        ) : filteredSortedApps.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
            <Typography variant="h6" sx={{ mb: 1 }}>No applications found</Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>Try adjusting your search or create a new application.</Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={()=>setOpen(true)}>Create Application</Button>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
              gap: 2
            }}
          >
            {filteredSortedApps.map(app => (
              <Card key={app.id} sx={{ height: '100%', borderRadius: 3, border: activeAppId === app.id ? theme => `2px solid ${theme.palette.primary.main}` : '1px solid', borderColor: activeAppId === app.id ? 'primary.main' : 'divider', transition: 'all .2s', '&:hover': { boxShadow: 3 } }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.name}</Typography>
                    <IconButton size="small" onClick={(e)=>setMenuAnchor({ anchor: e.currentTarget, app })}>
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ minHeight: 40 }} title={app.description}>{app.description || '—'}</Typography>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                    <Tooltip title="Created UTC">
                      <InfoIcon fontSize="small" color="action" />
                    </Tooltip>
                    <DateTimeDisplay 
                      utcDate={app.createdAtUtc} 
                      format="datetime" 
                      variant="caption"
                      showTooltip={true}
                    />
                  </Stack>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
                  <Button size="small" variant="outlined" startIcon={<GroupAddIcon />} onClick={() => openManageUsers(app)}>
                    Manage Users
                  </Button>
                  <Box sx={{ flexGrow: 1 }} />
                  {activeAppId === app.id ? (
                    <Chip icon={<CheckIcon />} color="success" size="small" label="Active" />
                  ) : (
                    <Button size="small" variant="contained" onClick={() => dispatch(setApplicationId(app.id))}>
                      Set Active
                    </Button>
                  )}
                </CardActions>
              </Card>
            ))}
          </Box>
        )}

        {/* Application Actions Menu */}
        <Menu anchorEl={menuAnchor?.anchor || null} open={Boolean(menuAnchor)} onClose={()=>setMenuAnchor(null)}>
          <MenuItem onClick={() => openEditDialog(menuAnchor!.app)}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Application</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => openDeleteDialog(menuAnchor!.app)}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete Application</ListItemText>
          </MenuItem>
        </Menu>

        {/* Create Application Dialog */}
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create Application</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField label="Name" value={name} onChange={e => setName(e.target.value)} autoFocus fullWidth />
              <TextField label="Description" value={description} onChange={e => setDescription(e.target.value)} fullWidth multiline rows={3} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleCreate} disabled={loading}>{loading ? 'Creating...' : 'Create'}</Button>
          </DialogActions>
        </Dialog>

        {/* Edit Application Dialog */}
        <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Application</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField 
                label="Name" 
                value={editName} 
                onChange={e => setEditName(e.target.value)} 
                autoFocus 
                fullWidth 
              />
              <TextField 
                label="Description" 
                value={editDescription} 
                onChange={e => setEditDescription(e.target.value)} 
                fullWidth 
                multiline 
                rows={3} 
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={handleEdit} 
              disabled={editLoading}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                },
              }}
            >
              {editLoading ? 'Updating...' : 'Update'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Application Dialog */}
        <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Delete Application</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              {error && <Alert severity="error">{error}</Alert>}
              <Alert severity="warning">
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                  Are you sure you want to delete "{deleteApp?.name}"?
                </Typography>
                <Typography variant="body2">
                  This action cannot be undone. All user associations, roles, and permissions linked to this application will be removed.
                </Typography>
              </Alert>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button 
              variant="contained" 
              color="error" 
              onClick={handleDelete} 
              disabled={deleteLoading}
            >
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Manage Users Dialog */}
        <Dialog open={manageOpen} onClose={() => setManageOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Manage Users {manageApp ? `- ${manageApp.name}` : ''}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="subtitle1">Linked Users</Typography>
              {manageLoading ? (
                <>
                  <Skeleton variant="rectangular" height={48} sx={{ mb: 1, borderRadius: 1 }} />
                  <Skeleton variant="rectangular" height={48} sx={{ mb: 1, borderRadius: 1 }} />
                </>
              ) : (
                <List dense>
                  {appUsers.map(u => (
                    <ListItem key={u.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                      <ListItemText primary={`${u.firstName} ${u.lastName}`} secondary={u.email} />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" color="error" onClick={() => removeUserFromApp(u.id)} disabled={manageLoading}>
                          <PersonRemoveIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                  {appUsers.length === 0 && (
                    <Typography variant="body2" color="text.secondary">No users linked to this application.</Typography>
                  )}
                </List>
              )}

              <Divider sx={{ my: 1 }} />

              <Typography variant="subtitle1">Add Users</Typography>
              <Autocomplete
                multiple
                options={allUsers.filter(u => !appUsers.some(au => au.id === u.id))}
                getOptionLabel={(u) => `${u.firstName} ${u.lastName} (${u.email})`}
                value={selectedToAdd}
                onChange={(_, val) => setSelectedToAdd(val)}
                renderInput={(params) => <TextField {...params} label="Search users" placeholder="Type to search" />}
              />
              <Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={addSelectedUsers} disabled={manageLoading || selectedToAdd.length === 0}>
                  Add Selected
                </Button>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setManageOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={!!success} autoHideDuration={2500} onClose={()=>setSuccess('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert onClose={()=>setSuccess('')} severity="success" variant="filled">{success}</Alert>
        </Snackbar>
        <Snackbar open={!!error} autoHideDuration={3500} onClose={()=>setError('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert onClose={()=>setError('')} severity="error" variant="filled">{error}</Alert>
        </Snackbar>
      </Box>
    </Layout>
  );
}

import { useEffect, useState, useRef } from 'react';
import { userApi } from '../userApi';
import { usePermission } from '../../../hooks/usePermission';
import {
  Box, Typography, Alert, CircularProgress, Paper,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Chip,
  Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Stack, IconButton, Tooltip
} from '@mui/material';
import { Edit } from '@mui/icons-material';
import { branchApi } from '../../branch/branchApi';
import { authApi } from '../../auth/authApi';

const roleColors = {
  SUPER_ADMIN: 'error',
  OWNER: 'secondary',
  BRANCH_MANAGER: 'primary',
  SALES_EXECUTIVE: 'info',
  CASHIER: 'default',
  PURCHASE_MANAGER: 'warning',
  WAREHOUSE_MANAGER: 'success',
  ACCOUNTANT: 'default',
};

const ROLES = Object.keys(roleColors);

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  const canView = usePermission('USER_VIEW');
  const isSuperAdmin = usePermission('ALL'); // Usually only SUPER_ADMIN can edit roles/branches

  const [editOpen, setEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ role: '', branchId: '', active: true });
  const [saving, setSaving] = useState(false);

  // Active branches state
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);

  // Add User state
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'SALES_EXECUTIVE',
    branchId: '',
  });
  const [addErrors, setAddErrors] = useState({});
  const [addServerError, setAddServerError] = useState('');
  const [adding, setAdding] = useState(false);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // Fetch branches on mount
  useEffect(() => {
    setBranchesLoading(true);
    branchApi.listActive()
      .then((res) => {
        if (isMounted.current) {
          setBranches(res.data ?? []);
        }
      })
      .catch((err) => console.error('Failed to load branches', err))
      .finally(() => {
        if (isMounted.current) {
          setBranchesLoading(false);
        }
      });
  }, []);

  const fetchUsers = async () => {
    if (!canView) return;
    setLoading(true);
    setError(null);
    try {
      const response = await userApi.listUsers(page, rowsPerPage);
      const data = response.data;
      if (isMounted.current) {
        setUsers(data.content || []);
        setTotalElements(data.totalElements || 0);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err.response?.data?.message || 'Failed to load users');
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(), 0);
    return () => clearTimeout(timer);
  }, [page, rowsPerPage, canView]);

  const openEdit = (u) => {
    setEditingUser(u);
    setEditForm({
      role: u.role || 'CASHIER',
      branchId: u.branchId || '',
      active: u.active ?? true,
    });
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      // Map empty string to null so backend JAXB/Jackson doesn't fail parsing UUID
      const payload = {
        role: editForm.role,
        branchId: editForm.branchId || null,
        active: editForm.active,
      };
      await userApi.updateUser(editingUser.id, payload);
      setEditOpen(false);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  // Add User Handlers
  const validateAddForm = () => {
    const newErrors = {};
    if (!addForm.username.trim()) newErrors.username = 'Username is required';
    if (!addForm.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addForm.email)) {
      newErrors.email = 'Enter a valid email address';
    }
    if (!addForm.password) {
      newErrors.password = 'Password is required';
    } else if (addForm.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!])/.test(addForm.password)) {
      newErrors.password = 'Must include uppercase, lowercase, number, and special character';
    }
    if (addForm.password !== addForm.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!addForm.role)     newErrors.role     = 'Role is required';
    if (!addForm.branchId) newErrors.branchId = 'Branch is required';
    return newErrors;
  };

  const openAdd = () => {
    setAddForm({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'SALES_EXECUTIVE',
      branchId: branches[0]?.id || '',
    });
    setAddErrors({});
    setAddServerError('');
    setAddOpen(true);
  };

  const handleAddSave = async () => {
    setAddServerError('');
    const validationErrors = validateAddForm();
    if (Object.keys(validationErrors).length > 0) {
      setAddErrors(validationErrors);
      return;
    }

    setAdding(true);
    try {
      const payload = {
        username: addForm.username.trim(),
        email: addForm.email.trim(),
        password: addForm.password,
        role: addForm.role,
        branchId: addForm.branchId || null,
      };

      // Call authApi.register directly so it doesn't auto-login the new user
      await authApi.register(payload);
      setAddOpen(false);
      fetchUsers();
    } catch (err) {
      setAddServerError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setAdding(false);
    }
  };

  if (!canView) {
    return (
      <Alert severity="warning">
        You don't have permission to view users. (USER_VIEW required)
      </Alert>
    );
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          Users
        </Typography>
        {isSuperAdmin && (
          <Button variant="contained" onClick={openAdd} sx={{ fontWeight: 600 }}>
            Add User
          </Button>
        )}
      </Stack>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 600 }}>
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'action.hover' } }}>
                <TableCell>#</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Branch</TableCell>
                <TableCell>Status</TableCell>
                {isSuperAdmin && <TableCell align="center">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u, idx) => (
                  <TableRow key={u.id} hover>
                    <TableCell>{page * rowsPerPage + idx + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{u.username}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={u.role}
                        color={roleColors[u.role] || 'default'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.9rem' }}>
                      {branches.find(b => b.id === u.branchId)?.name || 'Not Assigned'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={u.active ? 'Active' : 'Inactive'}
                        color={u.active ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    {isSuperAdmin && (
                      <TableCell align="center">
                        <Tooltip title="Edit User">
                          <IconButton size="small" onClick={() => openEdit(u)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalElements}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* Edit User Dialog */}
      <Dialog open={editOpen} onClose={() => !saving && setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Edit User</DialogTitle>
        <DialogContent dividers>
          {editingUser && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Username</Typography>
                <Typography variant="body1" fontWeight={600}>{editingUser.username}</Typography>
              </Box>
              
              <TextField
                select
                label="Role"
                fullWidth
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
              >
                {ROLES.map((r) => (
                  <MenuItem key={r} value={r}>{r}</MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Branch"
                fullWidth
                value={editForm.branchId || ''}
                onChange={(e) => setEditForm({ ...editForm, branchId: e.target.value })}
                helperText="Select branch"
              >
                <MenuItem value="" disabled={branches.length > 0}>
                  {branchesLoading ? 'Loading branches...' : 'Unassigned / Select branch'}
                </MenuItem>
                {branches.map((b) => (
                  <MenuItem key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Account Status"
                fullWidth
                value={editForm.active ? 'true' : 'false'}
                onChange={(e) => setEditForm({ ...editForm, active: e.target.value === 'true' })}
              >
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </TextField>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ fontWeight: 600 }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={addOpen} onClose={() => !adding && setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add New User</DialogTitle>
        <DialogContent dividers>
          {addServerError && <Alert severity="error" sx={{ mb: 2 }}>{addServerError}</Alert>}
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              required
              label="Username"
              fullWidth
              value={addForm.username}
              onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
              error={!!addErrors.username}
              helperText={addErrors.username}
              disabled={adding}
            />
            <TextField
              required
              label="Email Address"
              fullWidth
              value={addForm.email}
              onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
              error={!!addErrors.email}
              helperText={addErrors.email}
              disabled={adding}
            />
            <TextField
              required
              type="password"
              label="Password"
              fullWidth
              value={addForm.password}
              onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
              error={!!addErrors.password}
              helperText={addErrors.password || 'Min 8 chars, upper, lower, number, special'}
              disabled={adding}
            />
            <TextField
              required
              type="password"
              label="Confirm Password"
              fullWidth
              value={addForm.confirmPassword}
              onChange={(e) => setAddForm({ ...addForm, confirmPassword: e.target.value })}
              error={!!addErrors.confirmPassword}
              helperText={addErrors.confirmPassword}
              disabled={adding}
            />
            <TextField
              select
              label="Role"
              fullWidth
              value={addForm.role}
              onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
              error={!!addErrors.role}
              helperText={addErrors.role}
              disabled={adding}
            >
              {ROLES.map((r) => (
                <MenuItem key={r} value={r}>{r}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Branch"
              fullWidth
              value={addForm.branchId || ''}
              onChange={(e) => setAddForm({ ...addForm, branchId: e.target.value })}
              error={!!addErrors.branchId}
              helperText={addErrors.branchId || 'Select user branch'}
              disabled={adding || branchesLoading}
            >
              {branches.map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAddOpen(false)} disabled={adding}>Cancel</Button>
          <Button variant="contained" onClick={handleAddSave} disabled={adding} sx={{ fontWeight: 600 }}>
            {adding ? 'Creating...' : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
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

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
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
      await userApi.updateUser(editingUser.id, editForm);
      setEditOpen(false);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user');
    } finally {
      setSaving(false);
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
      <Typography variant="h4" gutterBottom fontWeight={700}>
        Users
      </Typography>
      
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
                <TableCell>Branch ID</TableCell>
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
                    <TableCell sx={{ fontSize: '0.85rem', color: 'text.secondary', fontFamily: 'monospace' }}>
                      {u.branchId || 'Not Assigned'}
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
                label="Branch ID (UUID)"
                fullWidth
                placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
                value={editForm.branchId}
                onChange={(e) => setEditForm({ ...editForm, branchId: e.target.value })}
                helperText="Leave empty to unassign branch"
              />

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
    </Box>
  );
}
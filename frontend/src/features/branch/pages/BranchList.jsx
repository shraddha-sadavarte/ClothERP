import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Alert,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { branchApi } from '../branchApi';
import { usePermission } from '../../../hooks/usePermission';
import { useToast } from '../../../hooks/useToast';
import PageHeader from '../../../components/common/PageHeader';
import ConfirmDialog from '../../../components/common/ConfirmDialog';

const emptyForm = {
  name: '',
  code: '',
  address: '',
  city: '',
  state: '',
  pinCode: '',
  phone: '',
};

export default function BranchList() {
  const { showToast } = useToast();
  const isSuperAdmin = usePermission('ALL');

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true); // ✅ start as true
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });

  // ✅ Fixed effect: no synchronous setState
  useEffect(() => {
    let isMounted = true;

    const fetchBranches = async () => {
      setError(null);
      try {
        const data = await branchApi.listActive();
        if (isMounted) {
          setBranches(data || []);
          setTotal(data?.length || 0);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || 'Failed to load branches');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchBranches();

    return () => {
      isMounted = false;
    };
  }, []); // ✅ empty dependency – runs once on mount

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setDialogOpen(true);
  };

  const openEdit = (branch) => {
    setEditing(branch);
    setForm({
      name: branch.name || '',
      code: branch.code || '',
      address: branch.address || '',
      city: branch.city || '',
      state: branch.state || '',
      pinCode: branch.pinCode || '',
      phone: branch.phone || '',
    });
    setFormError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.code.trim()) {
      setFormError('Name and Code are required.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      if (editing) {
        await branchApi.update(editing.id, { ...form, active: true });
        showToast('Branch updated successfully', 'success');
      } else {
        await branchApi.create(form);
        showToast('Branch created successfully', 'success');
      }
      setDialogOpen(false);
      // Refetch – manually trigger by re‑running effect? We'll just call fetch again.
      // To avoid duplication, we can extract fetch logic to a separate function and call it.
      // For simplicity, we'll reload the page data by resetting loading and fetching again.
      setLoading(true);
      const data = await branchApi.listActive();
      setBranches(data || []);
      setTotal(data?.length || 0);
      setLoading(false);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save branch');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await branchApi.deactivate(deleteDialog.id);
      showToast('Branch deactivated', 'success');
      // Refetch
      setLoading(true);
      const data = await branchApi.listActive();
      setBranches(data || []);
      setTotal(data?.length || 0);
      setLoading(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Delete failed', 'error');
    } finally {
      setDeleteDialog({ open: false, id: null });
    }
  };

  // Client‑side pagination
  const paginatedBranches = branches.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (!isSuperAdmin) {
    return (
      <Box>
        <PageHeader title="Access Denied" />
        <Alert severity="warning">
          Only SUPER_ADMIN can manage branches.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Branches"
        subtitle="Manage your business locations"
        actions={
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
            Add Branch
          </Button>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 600 }}>
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'action.hover' } }}>
                <TableCell>#</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>City</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && branches.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                  <CircularProgress size={28} />
                </TableCell></TableRow>
              ) : branches.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                  No branches found. Create your first branch.
                </TableCell></TableRow>
              ) : (
                paginatedBranches.map((b, idx) => (
                  <TableRow key={b.id} hover>
                    <TableCell>{page * rowsPerPage + idx + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{b.name}</TableCell>
                    <TableCell><Chip label={b.code} size="small" variant="outlined" /></TableCell>
                    <TableCell>{b.city || '—'}</TableCell>
                    <TableCell>{b.phone || '—'}</TableCell>
                    <TableCell>
                      <Chip
                        label={b.active ? 'Active' : 'Inactive'}
                        color={b.active ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(b)}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Deactivate">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteDialog({ open: true, id: b.id })}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editing ? 'Edit Branch' : 'Add New Branch'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField
              label="Branch Name *"
              fullWidth
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
            />
            <TextField
              label="Branch Code *"
              fullWidth
              value={form.code}
              onChange={(e) => setForm(f => ({ ...f, code: e.target.value }))}
              disabled={!!editing}
              helperText={editing ? 'Code cannot be changed' : ''}
            />
            <TextField
              label="Address"
              fullWidth
              multiline
              rows={2}
              value={form.address}
              onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="City"
                fullWidth
                value={form.city}
                onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))}
              />
              <TextField
                label="State"
                fullWidth
                value={form.state}
                onChange={(e) => setForm(f => ({ ...f, state: e.target.value }))}
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="PIN Code"
                fullWidth
                value={form.pinCode}
                onChange={(e) => setForm(f => ({ ...f, pinCode: e.target.value }))}
              />
              <TextField
                label="Phone"
                fullWidth
                value={form.phone}
                onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialog.open}
        title="Deactivate Branch"
        message="Are you sure you want to deactivate this branch? Existing users and orders will not be affected, but new actions may be restricted."
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ open: false, id: null })}
        confirmText="Deactivate"
        confirmColor="error"
      />
    </Box>
  );
}
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
  CircularProgress,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { usePermission } from '../../../hooks/usePermission';
import { useToast } from '../../../hooks/useToast';
import PageHeader from '../../../components/common/PageHeader';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import { settingsApi } from '../settingsApi';

const emptyForm = {
  key: '',
  value: '',
  description: '',
  publicAccess: false,
};

export default function SystemSettingsPage() {
  const { showToast } = useToast();
  const isSuperAdmin = usePermission('ALL');

  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });

  const fetchSettings = async () => {
    try {
      const data = await settingsApi.list();
      setSettings(data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setDialogOpen(true);
  };

  const openEdit = (setting) => {
    setEditing(setting);
    setForm({
      key: setting.key || '',
      value: setting.value || '',
      description: setting.description || '',
      publicAccess: setting.publicAccess || false,
    });
    setFormError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.key.trim() || !form.value.trim()) {
      setFormError('Key and Value are required.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await settingsApi.createOrUpdate(form);
      showToast('Setting saved successfully', 'success');
      setDialogOpen(false);
      await fetchSettings();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save setting');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await settingsApi.delete(deleteDialog.id);
      showToast('Setting deleted', 'success');
      await fetchSettings();
    } catch (err) {
      showToast(err.response?.data?.message || 'Delete failed', 'error');
    } finally {
      setDeleteDialog({ open: false, id: null });
    }
  };

  if (!isSuperAdmin) {
    return (
      <Box>
        <PageHeader title="Access Denied" />
        <Alert severity="warning">Only SUPER_ADMIN can manage settings.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="System Settings"
        subtitle="Manage application configuration"
        actions={
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
            Add Setting
          </Button>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'action.hover' } }}>
                <TableCell>Key</TableCell>
                <TableCell>Value</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Public</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                  <CircularProgress size={28} />
                </TableCell></TableRow>
              ) : settings.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                  No settings defined.
                </TableCell></TableRow>
              ) : (
                settings.map((s) => (
                  <TableRow key={s.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{s.key}</TableCell>
                    <TableCell>{s.value}</TableCell>
                    <TableCell>{s.description || '—'}</TableCell>
                    <TableCell>
                      <Chip
                        label={s.publicAccess ? 'Yes' : 'No'}
                        color={s.publicAccess ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(s)}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteDialog({ open: true, id: s.id })}
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
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editing ? 'Edit Setting' : 'Add New Setting'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField
              label="Key *"
              fullWidth
              value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value })}
              disabled={!!editing}
              helperText={editing ? 'Key cannot be changed' : ''}
            />
            <TextField
              label="Value *"
              fullWidth
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.publicAccess}
                  onChange={(e) => setForm({ ...form, publicAccess: e.target.checked })}
                />
              }
              label="Public (visible to all users)"
            />
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
        title="Delete Setting"
        message="Are you sure you want to delete this setting? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ open: false, id: null })}
        confirmText="Delete"
        confirmColor="error"
      />
    </Box>
  );
}
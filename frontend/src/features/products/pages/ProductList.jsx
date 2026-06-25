import { useEffect, useState, useCallback, useRef } from 'react';
import { productApi } from '../productApi';
import {
  Box,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TablePagination,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Stack,
  Tooltip,
  IconButton,
  MenuItem,
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Inventory2,
  Delete,
} from '@mui/icons-material';
import { usePermission } from '../../../hooks/usePermission';
import { useToast } from '../../../hooks/useToast';
import PageHeader from '../../../components/common/PageHeader';
import ConfirmDialog from '../../../components/common/ConfirmDialog';

const CATEGORIES = ['Menswear', 'Womenswear', 'Kidswear', 'Accessories', 'Footwear'];
const MATERIALS = ['Cotton', 'Polyester', 'Wool', 'Silk', 'Denim', 'Leather', 'Synthetic', 'Blend'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

const emptyForm = {
  name: '',
  sku: '',
  description: '',
  price: '',
  cost: '',
  category: '',
  size: '',
  color: '',
  material: '',
};

export default function ProductList() {
  const { showToast } = useToast();
  const canCreate = usePermission('PRODUCT_CREATE');
  const isSuperAdmin = usePermission('ALL');

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });

  const mountedRef = useRef(true);

  const fetchProducts = useCallback(async () => {
    setError(null);
    try {
      const data = await productApi.listProducts(page, rowsPerPage);
      if (mountedRef.current) {
        setProducts(data.content || []);
        setTotal(data.totalElements || 0);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err.response?.data?.message || 'Failed to load products');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [page, rowsPerPage]);

  useEffect(() => {
    mountedRef.current = true;
    fetchProducts();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchProducts]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setDialogOpen(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setForm({
      name: product.name || '',
      sku: product.sku || '',
      description: product.description || '',
      price: product.price || '',
      cost: product.cost || '',
      category: product.category || '',
      size: product.size || '',
      color: product.color || '',
      material: product.material || '',
    });
    setFormError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.sku.trim() || !form.price) {
      setFormError('Name, SKU, and Price are required.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        cost: parseFloat(form.cost) || 0,
      };
      if (editing) {
        await productApi.update(editing.id, payload);
        showToast('Product updated successfully', 'success');
      } else {
        await productApi.create(payload);
        showToast('Product created successfully', 'success');
      }
      setDialogOpen(false);
      setLoading(true);
      await fetchProducts();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await productApi.delete(deleteDialog.id);
      showToast('Product deleted', 'success');
      setLoading(true);
      await fetchProducts();
    } catch (err) {
      showToast(err.response?.data?.message || 'Delete failed', 'error');
    } finally {
      setDeleteDialog({ open: false, id: null });
    }
  };

  const displayed = products.filter((p) =>
    search
      ? p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.sku?.toLowerCase().includes(search.toLowerCase()) ||
        p.category?.toLowerCase().includes(search.toLowerCase())
      : true
  );

  return (
    <Box>
      <PageHeader
        title="Products"
        subtitle="Manage your product catalogue"
        actions={
          canCreate && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={openCreate}
              sx={{ borderRadius: 2, fontWeight: 600 }}
            >
              Add Product
            </Button>
          )
        }
      />

      <TextField
        size="small"
        placeholder="Search by name, SKU or category…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2, width: { xs: '100%', sm: 340 } }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search fontSize="small" />
            </InputAdornment>
          ),
        }}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 700 }}>
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'action.hover' } }}>
                <TableCell>#</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Color</TableCell>
                <TableCell>Price (₹)</TableCell>
                <TableCell>Cost (₹)</TableCell>
                {(canCreate || isSuperAdmin) && (
                  <TableCell align="center">Actions</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && displayed.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : displayed.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    <Inventory2 sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} />
                    <br />
                    No products found
                  </TableCell>
                </TableRow>
              ) : (
                displayed.map((p, i) => (
                  <TableRow key={p.id} hover>
                    <TableCell>{page * rowsPerPage + i + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{p.name}</TableCell>
                    <TableCell>
                      <Chip label={p.sku} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{p.category || '—'}</TableCell>
                    <TableCell>{p.size || '—'}</TableCell>
                    <TableCell>{p.color || '—'}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'success.main' }}>
                      ₹{Number(p.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      ₹{Number(p.cost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </TableCell>
                    {(canCreate || isSuperAdmin) && (
                      <TableCell align="center">
                        {canCreate && (
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEdit(p)}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {isSuperAdmin && (
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteDialog({ open: true, id: p.id })}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 20, 50]}
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

      {/* Create / Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editing ? 'Edit Product' : 'Add New Product'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Product Name *"
                fullWidth
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                disabled={saving}
              />
              <TextField
                label="SKU *"
                fullWidth
                value={form.sku}
                onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                disabled={!!editing || saving}
                helperText={editing ? 'SKU cannot be changed' : ''}
              />
            </Stack>
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              disabled={saving}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Selling Price (₹) *"
                type="number"
                fullWidth
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                inputProps={{ step: 0.01, min: 0 }}
                disabled={saving}
              />
              <TextField
                label="Cost Price (₹)"
                type="number"
                fullWidth
                value={form.cost}
                onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
                inputProps={{ step: 0.01, min: 0 }}
                disabled={saving}
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                select
                label="Category"
                fullWidth
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                disabled={saving}
              >
                <MenuItem value=""><em>None</em></MenuItem>
                {CATEGORIES.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Material"
                fullWidth
                value={form.material}
                onChange={(e) => setForm((f) => ({ ...f, material: e.target.value }))}
                disabled={saving}
              >
                <MenuItem value=""><em>None</em></MenuItem>
                {MATERIALS.map((mat) => (
                  <MenuItem key={mat} value={mat}>
                    {mat}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                select
                label="Size"
                fullWidth
                value={form.size}
                onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))}
                disabled={saving}
              >
                <MenuItem value=""><em>None</em></MenuItem>
                {SIZES.map((sz) => (
                  <MenuItem key={sz} value={sz}>
                    {sz}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Color"
                fullWidth
                value={form.color}
                onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                disabled={saving}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={{ fontWeight: 600 }}
          >
            {saving ? 'Saving…' : editing ? 'Update Product' : 'Create Product'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialog.open}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ open: false, id: null })}
        confirmText="Delete"
        confirmColor="error"
        loading={false}
      />
    </Box>
  );
}
import { useEffect, useState, useCallback, useRef } from 'react';
import { productApi } from '../productApi';
import { inventoryApi } from '../../inventory/inventoryApi';
import { branchApi } from '../../branch/branchApi';
import { useAuth } from '../../../hooks/useAuth';
import { usePermission } from '../../../hooks/usePermission';
import { useToast } from '../../../hooks/useToast';
import PageHeader from '../../../components/common/PageHeader';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import ImportDialog from '../components/ImportDialog';
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
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  Divider,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Stack,
  Tooltip,
  IconButton,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Inventory2,
  Delete,
  Upload as UploadIcon,
  Download as DownloadIcon, // ✅ Added DownloadIcon
} from '@mui/icons-material';

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
  initialQuantity: 0,
  rackLocation: '',
  branchId: '',
};

export default function ProductList() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const canCreate = usePermission('PRODUCT_CREATE');
  const isSuperAdmin = usePermission('ALL');

  // ── Branch state ──
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [selectedBranchId, setSelectedBranchId] = useState(user?.branchId || '');

  // ── Product state ──
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

  // ── Import state ──
  const [openImport, setOpenImport] = useState(false);
  const [importLoading, setImportLoading] = useState(false);

  const mountedRef = useRef(true);

  // ── Fetch branches if superadmin ──
  useEffect(() => {
    if (!isSuperAdmin) {
      setBranchesLoading(false);
      return;
    }
    branchApi
      .listActive()
      .then((res) => {
        if (mountedRef.current) {
          setBranches(res ?? []);
          if (!selectedBranchId && res?.length > 0) {
            setSelectedBranchId(res[0].id);
          }
        }
      })
      .catch(() => showToast('Failed to load branches', 'error'))
      .finally(() => {
        if (mountedRef.current) setBranchesLoading(false);
      });
  }, [isSuperAdmin, selectedBranchId, showToast]);

  // ── Fetch products ──
  const fetchProducts = useCallback(async () => {
    setError(null);
    try {
      const branchFilter = isSuperAdmin ? selectedBranchId : user?.branchId;
      const data = await productApi.listProducts(page, rowsPerPage, branchFilter);
      if (mountedRef.current) {
        setProducts(data.content || []);
        setTotal(data.totalElements || 0);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err.response?.data?.message || 'Failed to load products');
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [page, rowsPerPage, isSuperAdmin, selectedBranchId, user]); // ✅ added `user` to dependencies

  useEffect(() => {
    mountedRef.current = true;
    fetchProducts();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchProducts]);

  // ── Handle Import ──
  const handleImport = async (file) => {
    console.log('1️⃣ handleImport called with file:', file);

    setImportLoading(true);
    try {
      console.log('2️⃣ Creating FormData...');
      const formData = new FormData();
      formData.append('file', file);
      console.log('3️⃣ FormData created, file appended');

      console.log('4️⃣ Calling productApi.importProducts...');
      const result = await productApi.importProducts(formData);
      console.log('5️⃣ Result received:', result);

      if (result && result.success !== undefined) {
        if (result.success) {
          const data = result.data || {};
          const successCount = data.successCount || 0;
          const errors = data.errors || [];

          if (errors && errors.length > 0) {
            showToast(`Imported ${successCount} products with ${errors.length} errors`, 'warning');
            console.log('Import errors:', errors);
          } else {
            showToast(`Successfully imported ${successCount} products!`, 'success');
          }

          setOpenImport(false);
          setLoading(true);
          await fetchProducts();
        } else {
          showToast(result.message || 'Import failed', 'error');
        }
      } else {
        showToast('Products imported successfully!', 'success');
        setOpenImport(false);
        setLoading(true);
        await fetchProducts();
      }
    } catch (error) {
      console.error('6️⃣ ERROR:', error);
      console.error('Error response:', error.response);

      let errorMsg = 'Failed to import products';
      if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error.message) {
        errorMsg = error.message;
      }

      showToast(errorMsg, 'error');
    } finally {
      setImportLoading(false);
      console.log('7️⃣ Import complete');
    }
  };

  // ── Handle Template Download ──
  const handleDownloadTemplate = async () => {
    try {
      console.log('📥 Downloading template...');
      const blob = await productApi.downloadTemplate();
      console.log('📥 Blob received:', blob);

      // Check if we got a Blob
      if (!(blob instanceof Blob)) {
        console.error('❌ Response is not a Blob:', blob);
        showToast('Invalid response format', 'error');
        return;
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'product-import-template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showToast('Template downloaded successfully!', 'success');
    } catch (error) {
      console.error('❌ Download error:', error);
      console.error('❌ Error details:', error.response || error.message);
      showToast('Failed to download template', 'error');
    }
  };

  // ── Dialog handlers ──
  const openCreate = () => {
    setEditing(null);
    setForm({
      ...emptyForm,
      initialQuantity: 0,
      rackLocation: '',
      branchId: isSuperAdmin ? selectedBranchId : user?.branchId || '',
    });
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
      initialQuantity: 0,
      rackLocation: '',
      branchId: product.branchId || '',
    });
    setFormError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const effectiveBranch = form.branchId || selectedBranchId || user?.branchId;
    if (!form.name.trim() || !form.sku.trim() || !form.price) {
      setFormError('Name, SKU, and Price are required.');
      return;
    }
    if (!effectiveBranch) {
      setFormError('Branch is required. Please select a branch.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        cost: parseFloat(form.cost) || 0,
        branchId: effectiveBranch,
      };
      let productResponse;
      if (editing) {
        await productApi.update(editing.id, payload);
        showToast('Product updated successfully', 'success');
      } else {
        productResponse = await productApi.create(payload);
        showToast('Product created successfully', 'success');
        const initialQty = parseInt(form.initialQuantity) || 0;
        if (initialQty > 0 && productResponse?.id) {
          try {
            await inventoryApi.adjustStock({
              productId: productResponse.id,
              branchId: effectiveBranch,
              quantity: initialQty,
              type: 'STOCK_IN',
              notes: `Initial stock for new product ${form.name}`,
              rackLocation: form.rackLocation || '',
            });
            showToast(`Initial stock of ${initialQty} added`, 'success');
          } catch (invErr) {
            showToast('Product created but failed to add initial stock: ' + invErr.response?.data?.message, 'error');
          }
        }
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
          <Box sx={{ display: 'flex', gap: 1 }}>
            {/* ✅ Download Template Button - Now outside Import Dialog */}
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadTemplate}
            >
              Download Template
            </Button>

            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={() => setOpenImport(true)}
            >
              Import
            </Button>

            {canCreate && (
              <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
                Add Product
              </Button>
            )}
          </Box>
        }
      />

      {isSuperAdmin && (
        <FormControl sx={{ mb: 2, minWidth: 200 }} size="small">
          <InputLabel id="branch-select-label">Branch</InputLabel>
          <Select
            labelId="branch-select-label"
            value={selectedBranchId}
            label="Branch"
            onChange={(e) => setSelectedBranchId(e.target.value)}
            disabled={loading || branchesLoading}
          >
            {branches.map((b) => (
              <MenuItem key={b.id} value={b.id}>
                {b.name} ({b.code})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

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

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
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
                <TableCell align="right">Price (₹)</TableCell>
                <TableCell align="right">Cost (₹)</TableCell>
                {(canCreate || isSuperAdmin) && <TableCell align="center">Actions</TableCell>}
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
                    <Inventory2 sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} /><br />
                    No products found
                  </TableCell>
                </TableRow>
              ) : (
                displayed.map((p, i) => (
                  <TableRow key={p.id} hover>
                    <TableCell>{page * rowsPerPage + i + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{p.name}</TableCell>
                    <TableCell><Chip label={p.sku} size="small" variant="outlined" /></TableCell>
                    <TableCell>{p.category || '—'}</TableCell>
                    <TableCell>{p.size || '—'}</TableCell>
                    <TableCell>{p.color || '—'}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: 'success.main' }}>
                      ₹{Number(p.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell align="right">
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
                            <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, id: p.id })}>
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth="sm" fullWidth>
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
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
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
                  <MenuItem key={mat} value={mat}>{mat}</MenuItem>
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
                  <MenuItem key={sz} value={sz}>{sz}</MenuItem>
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

            {isSuperAdmin && (
              <TextField
                select
                label="Branch *"
                fullWidth
                value={form.branchId}
                onChange={(e) => setForm((f) => ({ ...f, branchId: e.target.value }))}
                disabled={saving || !!editing}
                helperText={editing ? 'Branch cannot be changed' : ''}
              >
                {branches.map((b) => (
                  <MenuItem key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </MenuItem>
                ))}
              </TextField>
            )}

            {!editing && (
              <>
                <Divider />
                <Typography variant="subtitle2" fontWeight={600}>Initial Stock</Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label="Initial Quantity"
                    type="number"
                    fullWidth
                    value={form.initialQuantity}
                    onChange={(e) => setForm((f) => ({ ...f, initialQuantity: e.target.value }))}
                    inputProps={{ min: 0 }}
                    disabled={saving}
                    helperText="Leave 0 if you don't want to add stock now"
                  />
                  <TextField
                    label="Rack Location"
                    fullWidth
                    value={form.rackLocation}
                    onChange={(e) => setForm((f) => ({ ...f, rackLocation: e.target.value }))}
                    disabled={saving}
                  />
                </Stack>
                {isSuperAdmin && !form.branchId && (
                  <Alert severity="warning">Please select a branch to add initial stock.</Alert>
                )}
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ fontWeight: 600 }}>
            {saving ? 'Saving…' : editing ? 'Update Product' : 'Create Product'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteDialog.open}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ open: false, id: null })}
        confirmText="Delete"
        confirmColor="error"
      />

      {/* Import Dialog - Removed onDownloadTemplate since it's now on the main page */}
      <ImportDialog
        open={openImport}
        onClose={() => setOpenImport(false)}
        onImport={handleImport}
        loading={importLoading}
      />
    </Box>
  );
}
import { useEffect, useState, useCallback } from 'react';
import { productApi } from '../productApi';
import {
  Box, Typography, Paper, Table, TableHead, TableBody,
  TableRow, TableCell, TableContainer, TablePagination,
  Button, Chip, CircularProgress, Alert, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField,
  InputAdornment, Stack, Tooltip, IconButton, MenuItem
} from '@mui/material';
import {
  Add, Search, Edit, Inventory2, Delete
} from '@mui/icons-material';
import { usePermission } from '../../../hooks/usePermission';

const CATEGORIES = ['Menswear', 'Womenswear', 'kidswear', 'Accessories', 'Footwear'];
const MATERIALS = ['Cotton', 'Polyester', 'Wool', 'Silk', 'Denim', 'Leather', 'Synthetic', 'Blend'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];


const emptyForm = {
  name: '', sku: '', description: '', price: '',
  cost: '', category: '', size: '', color: '', material: '',
};

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = create, object = edit
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const canCreate = usePermission('PRODUCT_CREATE');
  const isSuperAdmin = usePermission('ALL'); //super_admin check

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await productApi.listProducts(page, rowsPerPage);
      const data = res.data; // ApiResponse -> Page<ProductDTO>
      setProducts(data.content || []);
      setTotal(data.totalElements || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage]);

  useEffect(() => { 
    const timer = setTimeout(() => {
      fetchProducts();
    }, 0);
    return () => clearTimeout(timer);
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
      } else {
        await productApi.create(payload);
      }
      setDialogOpen(false);
      fetchProducts();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const displayed = products.filter((p) =>
    search
      ? p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.sku?.toLowerCase().includes(search.toLowerCase()) ||
        p.category?.toLowerCase().includes(search.toLowerCase())
      : true
  );

  const handleDelete = async (id) => {
    if(window.confirm('Are you sure you want to delete this product?')) {
      try{
        await productApi.delete(id);
        fetchProducts();
      } catch (err) {
        alert(err.response?.data?.message || "Failed to delete product");
      }
    }
  }

  return (
    <Box>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" spacing={2} mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Products</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your product catalogue
          </Typography>
        </Box>
        {canCreate && (
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}
            fullWidth={false} sx={{ borderRadius: 2, fontWeight: 600, width: { xs: '100%', sm: 'auto' } }}>
            Add Product
          </Button>
        )}
      </Stack>

      {/* Search */}
      <TextField
        size="small"
        placeholder="Search by name, SKU or category…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2, width: 340 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>
          ),
        }}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 800 }}>
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
                {(canCreate || isSuperAdmin) && <TableCell align="center">Action</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && displayed.length === 0 ? (
                <TableRow><TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                  <CircularProgress size={28} />
                </TableCell></TableRow>
              ) : displayed.length === 0 ? (
                <TableRow><TableCell colSpan={9} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                  <Inventory2 sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} /><br />
                  No products found
                </TableCell></TableRow>
              ) : displayed.map((p, i) => (
                <TableRow key={p.id} hover>
                  <TableCell>{page * rowsPerPage + i + 1}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{p.name}</TableCell>
                  <TableCell><Chip label={p.sku} size="small" variant="outlined" /></TableCell>
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
                          <IconButton size='small' color='error' onClick={() => handleDelete(p.id)}>
                            <Delete fontSize='small' />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
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
          onRowsPerPageChange={(e) => { setRowsPerPage(+e.target.value); setPage(0); }}
        />
      </Paper>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editing ? 'Edit Product' : 'Add New Product'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <Stack direction="row" spacing={2}>
              <TextField label="Product Name *" fullWidth value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
              <TextField label="SKU *" fullWidth value={form.sku}
                onChange={(e) => setForm(f => ({ ...f, sku: e.target.value }))}
                disabled={!!editing} />
            </Stack>
            <TextField label="Description" fullWidth multiline rows={2} value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />
            <Stack direction="row" spacing={2}>
              <TextField label="Selling Price (₹) *" type="number" fullWidth value={form.price}
                onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))} />
              <TextField label="Cost Price (₹)" type="number" fullWidth value={form.cost}
                onChange={(e) => setForm(f => ({ ...f, cost: e.target.value }))} />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                select
                label="Category"
                fullWidth
                value={form.category}
                onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
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
                onChange={(e) => setForm(f => ({ ...f, material: e.target.value }))}
              >
                <MenuItem value=""><em>None</em></MenuItem>
                {MATERIALS.map((mat) => (
                  <MenuItem key={mat} value={mat}>{mat}</MenuItem>
                ))}
              </TextField>
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                select
                label="Size"
                fullWidth
                value={form.size}
                onChange={(e) => setForm(f => ({ ...f, size: e.target.value }))}
              >
                <MenuItem value=""><em>None</em></MenuItem>
                {SIZES.map((sz) => (
                  <MenuItem key={sz} value={sz}>{sz}</MenuItem>
                ))}
              </TextField>
              <TextField label="Color" fullWidth value={form.color}
                onChange={(e) => setForm(f => ({ ...f, color: e.target.value }))} />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}
            sx={{ fontWeight: 600 }}>
            {saving ? 'Saving…' : editing ? 'Update Product' : 'Create Product'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

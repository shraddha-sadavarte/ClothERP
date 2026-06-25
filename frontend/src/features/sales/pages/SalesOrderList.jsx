import { useEffect, useState, useRef } from 'react';
import { salesApi } from '../salesApi';
import { productApi } from '../../products/productApi';
import { useAuth } from '../../../hooks/useAuth';
import { usePermission } from '../../../hooks/usePermission';
import { useToast } from '../../../hooks/useToast';
import PageHeader from '../../../components/common/PageHeader';
import { branchApi } from '../../branch/branchApi';
import { Box, Typography, Paper, Table, TableHead, TableBody,TableCell, TableRow, TableContainer, TablePagination, Button, Chip, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Stack, MenuItem, Divider, IconButton, Tooltip, Collapse, FormControl, InputLabel, Select, } from '@mui/material';
import { Add, ExpandMore, ExpandLess, ShoppingCart, DeleteOutlineOutlined, } from '@mui/icons-material';

// ── Status chip colours ─────────────────────────────────────────────────────
const STATUS_COLOR = {
  DRAFT: 'default',
  CONFIRMED: 'info',
  PROCESSING: 'warning',
  SHIPPED: 'primary',
  DELIVERED: 'success',
  CANCELLED: 'error',
};

const PAYMENT_COLOR = {
  PENDING: 'warning',
  PARTIAL: 'info',
  PAID: 'success',
  REFUNDED: 'default',
};

const ORDER_STATUSES = ['DRAFT', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

// ── Currency helper ──────────────────────────────────────────────────────────
const inr = (v) =>
  `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

// ── Item row inside dialog (pure component, no hooks) ──────────────────────
function ItemRow({ item, products, onChange, onRemove }) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1}
      alignItems={{ xs: 'flex-start', sm: 'center' }}
      sx={{ mb: { xs: 2, sm: 0 }, width: '100%' }}
    >
      <TextField
        select
        size="small"
        label="Product"
        sx={{ flex: 2 }}
        value={item.productId}
        onChange={(e) => {
          const p = products.find((x) => x.id === e.target.value);
          onChange({ ...item, productId: e.target.value, unitPrice: p?.price ?? '' });
        }}
      >
        {products.map((p) => (
          <MenuItem key={p.id} value={p.id}>
            {p.name} ({p.sku})
          </MenuItem>
        ))}
      </TextField>
      <TextField
        size="small"
        label="Qty"
        type="number"
        sx={{ width: 80 }}
        value={item.quantity}
        onChange={(e) => onChange({ ...item, quantity: e.target.value })}
        inputProps={{ min: 1 }}
      />
      <TextField
        size="small"
        label="Price (₹)"
        type="number"
        sx={{ width: 110 }}
        value={item.unitPrice}
        onChange={(e) => onChange({ ...item, unitPrice: e.target.value })}
      />
      <TextField
        size="small"
        label="Disc %"
        type="number"
        sx={{ width: 90 }}
        value={item.discountPercent}
        onChange={(e) => onChange({ ...item, discountPercent: e.target.value })}
        inputProps={{ min: 0, max: 100 }}
      />
      <Tooltip title="Remove">
        <IconButton size="small" color="error" onClick={onRemove}>
          <DeleteOutlineOutlined fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function SalesOrderList() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const canCreate = usePermission('SALES_CREATE');
  const isSuperAdmin = usePermission('ALL');

  // ── Branch state ──
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [selectedBranchId, setSelectedBranchId] = useState(user?.branchId || '');

  // ── Order state ──
  const [fetchState, setFetchState] = useState({
    orders: [],
    total: 0,
    loading: true,
    error: null,
  });

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [expanded, setExpanded] = useState(null);
  const [refetchKey, setRefetchKey] = useState(0);

  // Dialog states
  const [dlgOpen, setDlgOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([
    { productId: '', quantity: 1, unitPrice: '', discountPercent: 0 },
  ]);
  const [orderDiscount, setODisc] = useState('0');
  const [orderTax, setOTax] = useState('0');
  const [notes, setNotes] = useState('');
  const [dlgError, setDlgError] = useState('');
  const [saving, setSaving] = useState(false);

  // Status dialog
  const [statusDlg, setStatusDlg] = useState(false);
  const [statusTarget, setStatusTgt] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');

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

  // ── Data fetching effect ──
  useEffect(() => {
    mountedRef.current = true;
    const fetchOrders = async () => {
      setFetchState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const branchFilter = isSuperAdmin ? selectedBranchId : null;
        const d = await salesApi.listOrders(page, rowsPerPage, branchFilter);
        if (mountedRef.current) {
          setFetchState({
            loading: false,
            error: null,
            orders: d.content || [],
            total: d.totalElements || 0,
          });
        }
      } catch (err) {
        if (mountedRef.current) {
          setFetchState({
            loading: false,
            error: err.response?.data?.message || 'Failed to load orders',
            orders: [],
            total: 0,
          });
        }
      }
    };
    fetchOrders();
    return () => {
      mountedRef.current = false;
    };
  }, [page, rowsPerPage, refetchKey, isSuperAdmin, selectedBranchId]);

  // ── Dialog handlers ──
  const openCreate = async () => {
    setDlgError('');
    setItems([{ productId: '', quantity: 1, unitPrice: '', discountPercent: 0 }]);
    setODisc('0');
    setOTax('0');
    setNotes('');
    if (products.length === 0) {
      try {
        const res = await productApi.listProducts(0, 200);
        setProducts(res.content || []);
      } catch {
        setProducts([]);
      }
    }
    setDlgOpen(true);
  };

  const addItem = () =>
    setItems((p) => [...p, { productId: '', quantity: 1, unitPrice: '', discountPercent: 0 }]);

  const updateItem = (idx, val) =>
    setItems((p) => p.map((it, i) => (i === idx ? val : it)));

  const removeItem = (idx) =>
    setItems((p) => p.filter((_, i) => i !== idx));

  // ── Calculate preview totals ──
  const subtotal = items.reduce((sum, it) => {
    const qty = parseFloat(it.quantity) || 0;
    const pr = parseFloat(it.unitPrice) || 0;
    const disc = parseFloat(it.discountPercent) || 0;
    return sum + qty * pr * (1 - disc / 100);
  }, 0);
  const totalAmount = subtotal - (parseFloat(orderDiscount) || 0) + (parseFloat(orderTax) || 0);

  // ── Create order ──
  const handleCreate = async () => {
    const branchId = isSuperAdmin ? selectedBranchId : user?.branchId;
    if (items.some((it) => !it.productId || !it.quantity || !it.unitPrice)) {
      setDlgError('Fill in all item fields (Product, Qty, Price).');
      return;
    }
    if (!branchId) {
      setDlgError('No branch selected. Please select a branch.');
      return;
    }
    setSaving(true);
    setDlgError('');
    try {
      await salesApi.createOrder({
        branchId,
        notes,
        discountAmount: parseFloat(orderDiscount) || 0,
        taxAmount: parseFloat(orderTax) || 0,
        items: items.map((it) => ({
          productId: it.productId,
          quantity: parseInt(it.quantity),
          unitPrice: parseFloat(it.unitPrice),
          discountPercent: parseFloat(it.discountPercent) || 0,
        })),
      });
      setDlgOpen(false);
      showToast('Order created successfully', 'success');
      setRefetchKey((prev) => prev + 1);
    } catch (err) {
      setDlgError(err.response?.data?.message || 'Failed to create order');
    } finally {
      setSaving(false);
    }
  };

  // ── Status update ──
  const openStatusUpdate = (order) => {
    setStatusTgt(order);
    setNewStatus(order.status);
    setStatusNote('');
    setStatusDlg(true);
  };

  const handleStatusUpdate = async () => {
    try {
      await salesApi.updateStatus(statusTarget.id, { status: newStatus, notes: statusNote });
      setStatusDlg(false);
      showToast('Status updated successfully', 'success');
      setRefetchKey((prev) => prev + 1);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update status', 'error');
    }
  };

  const { loading, error, orders, total } = fetchState;

  return (
    <Box>
      <PageHeader
        title="Sales Orders"
        subtitle="Create and manage customer orders"
        actions={
          canCreate && (
            <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
              New Order
            </Button>
          )
        }
      />

      {/* Branch selector for superadmin */}
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
                <TableCell />
                <TableCell>Order #</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell>Subtotal</TableCell>
                <TableCell>Discount</TableCell>
                <TableCell>Tax</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    <ShoppingCart sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} />
                    <br />
                    No sales orders yet
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <>
                    <TableRow
                      key={order.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                    >
                      <TableCell>
                        {expanded === order.id ? (
                          <ExpandLess fontSize="small" />
                        ) : (
                          <ExpandMore fontSize="small" />
                        )}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{order.orderNumber}</TableCell>
                      <TableCell>
                        <Chip
                          label={order.status}
                          color={STATUS_COLOR[order.status] || 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.paymentStatus}
                          color={PAYMENT_COLOR[order.paymentStatus] || 'default'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{inr(order.subtotal)}</TableCell>
                      <TableCell sx={{ color: 'error.main' }}>
                        -{inr(order.discountAmount)}
                      </TableCell>
                      <TableCell>{inr(order.taxAmount)}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'success.main' }}>
                        {inr(order.totalAmount)}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => openStatusUpdate(order)}
                          sx={{ borderRadius: 1, fontSize: 12 }}
                        >
                          Update Status
                        </Button>
                      </TableCell>
                    </TableRow>

                    {/* Expanded items row */}
                    <TableRow key={`${order.id}-items`}>
                      <TableCell colSpan={9} sx={{ p: 0 }}>
                        <Collapse in={expanded === order.id}>
                          <Box sx={{ p: 2, bgcolor: 'action.hover' }}>
                            <Typography variant="subtitle2" fontWeight={700} mb={1}>
                              Line Items
                            </Typography>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Product</TableCell>
                                  <TableCell>SKU</TableCell>
                                  <TableCell>Qty</TableCell>
                                  <TableCell>Unit Price</TableCell>
                                  <TableCell>Disc %</TableCell>
                                  <TableCell>Line Total</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {(order.items || []).map((item) => (
                                  <TableRow key={item.id}>
                                    <TableCell>{item.productName}</TableCell>
                                    <TableCell>
                                      <Chip label={item.productSku} size="small" />
                                    </TableCell>
                                    <TableCell>{item.quantity}</TableCell>
                                    <TableCell>{inr(item.unitPrice)}</TableCell>
                                    <TableCell>{item.discountPercent}%</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>
                                      {inr(item.lineTotal)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                            {order.notes && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ mt: 1, display: 'block' }}
                              >
                                📝 {order.notes}
                              </Typography>
                            )}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </>
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

      {/* ── Create Order Dialog ── */}
      <Dialog
        open={dlgOpen}
        onClose={() => !saving && setDlgOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Create New Sales Order</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {dlgError && <Alert severity="error">{dlgError}</Alert>}

            <Typography variant="subtitle2" fontWeight={700}>
              Line Items
            </Typography>
            {items.map((item, idx) => (
              <ItemRow
                key={idx}
                item={item}
                products={products}
                onChange={(v) => updateItem(idx, v)}
                onRemove={() => removeItem(idx)}
              />
            ))}
            <Button
              size="small"
              startIcon={<Add />}
              onClick={addItem}
              sx={{ alignSelf: 'flex-start' }}
            >
              Add Item
            </Button>

            <Divider />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Order Discount (₹)"
                type="number"
                size="small"
                value={orderDiscount}
                onChange={(e) => setODisc(e.target.value)}
              />
              <TextField
                label="Tax Amount (₹)"
                type="number"
                size="small"
                value={orderTax}
                onChange={(e) => setOTax(e.target.value)}
              />
            </Stack>

            <Paper
              variant="outlined"
              sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover' }}
            >
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Subtotal</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {inr(subtotal)}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="error.main">
                  Discount
                </Typography>
                <Typography variant="body2" color="error.main">
                  -{inr(orderDiscount)}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Tax</Typography>
                <Typography variant="body2">{inr(orderTax)}</Typography>
              </Stack>
              <Divider sx={{ my: 1 }} />
              <Stack direction="row" justifyContent="space-between">
                <Typography fontWeight={700}>Total</Typography>
                <Typography fontWeight={700} color="success.main">
                  {inr(totalAmount)}
                </Typography>
              </Stack>
            </Paper>

            <TextField
              label="Notes"
              multiline
              rows={2}
              fullWidth
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDlgOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={saving}
            sx={{ fontWeight: 600 }}
          >
            {saving ? 'Creating…' : 'Create Order'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Update Status Dialog ── */}
      <Dialog
        open={statusDlg}
        onClose={() => setStatusDlg(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Update Order Status</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Order: <strong>{statusTarget?.orderNumber}</strong>
            </Typography>
            <TextField
              select
              label="New Status"
              fullWidth
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            >
              {ORDER_STATUSES.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Notes (optional)"
              multiline
              rows={2}
              fullWidth
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setStatusDlg(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleStatusUpdate} sx={{ fontWeight: 600 }}>
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
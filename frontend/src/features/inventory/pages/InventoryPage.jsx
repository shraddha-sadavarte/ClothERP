import { useEffect, useState, useCallback, useRef } from 'react';
import { inventoryApi } from '../inventoryApi';
import { productApi } from '../../products/productApi';
import { useAuth } from '../../../hooks/useAuth';
import { usePermission } from '../../../hooks/usePermission';
import { useToast } from '../../../hooks/useToast';
import PageHeader from '../../../components/common/PageHeader';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Chip,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  MenuItem,
  Tabs,
  Tab,
  LinearProgress,
  Grid,
  CircularProgress,
} from '@mui/material';
import Inventory2 from '@mui/icons-material/Inventory2';
import Warning from '@mui/icons-material/Warning';
import { AddCircleOutlineOutlined } from '@mui/icons-material';

const TYPE_COLOR = {
  STOCK_IN: 'success',
  STOCK_OUT: 'error',
  TRANSFER_IN: 'info',
  TRANSFER_OUT: 'warning',
  ADJUSTMENT: 'default',
};

const ADJUST_TYPES = ['STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT'];

function StockBar({ qty, reserved }) {
  const avail = Math.max(qty - reserved, 0);
  const pct = qty > 0 ? Math.min((avail / qty) * 100, 100) : 0;
  const color = pct < 20 ? 'error' : pct < 50 ? 'warning' : 'success';
  return (
    <Box sx={{ minWidth: 120 }}>
      <Stack direction="row" justifyContent="space-between" mb={0.3}>
        <Typography variant="caption" color="text.secondary">
          {avail} avail / {qty} total
        </Typography>
      </Stack>
      <LinearProgress variant="determinate" value={pct} color={color} sx={{ height: 6, borderRadius: 3 }} />
    </Box>
  );
}

export default function InventoryPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const canAdjust = usePermission('INVENTORY_ADJUST');
  const branchId = user?.branchId;

  const [tab, setTab] = useState(0);
  const [stock, setStock] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [adjOpen, setAdjOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [adjForm, setAdjForm] = useState({
    productId: '',
    quantity: '',
    type: 'STOCK_IN',
    notes: '',
    rackLocation: '',
  });
  const [adjError, setAdjError] = useState('');
  const [adjSaving, setAdjSaving] = useState(false);

  const mountedRef = useRef(true);

  const fetchAll = useCallback(async () => {
    if (!branchId) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const [stockRes, lowRes, txRes] = await Promise.all([
        inventoryApi.getStockByBranch(branchId),
        inventoryApi.getLowStock(branchId, 5),
        inventoryApi.getTransactionsByBranch(branchId, 0, 50),
      ]);
      if (mountedRef.current) {
        setStock(stockRes || []);
        setLowStock(lowRes || []);
        const txData = txRes;
        setTransactions(txData.content || txData || []);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err.response?.data?.message || 'Failed to load inventory');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [branchId]);

  useEffect(() => {
    mountedRef.current = true;
    if (!branchId) {
      setLoading(false);
      return;
    }
    fetchAll();
    return () => {
      mountedRef.current = false;
    };
  }, [branchId, fetchAll]);

  const openAdjust = async () => {
    setAdjError('');
    setAdjForm({ productId: '', quantity: '', type: 'STOCK_IN', notes: '', rackLocation: '' });
    if (products.length === 0) {
      try {
        const res = await productApi.listProducts(0, 200);
        setProducts(res.content || []);
      } catch {
        setProducts([]);
      }
    }
    setAdjOpen(true);
  };

  const handleAdjust = async () => {
    if (!adjForm.productId || !adjForm.quantity || !adjForm.type) {
      setAdjError('Product, Quantity and Type are required.');
      return;
    }
    if (!branchId) {
      setAdjError('Your account has no branchId. Contact admin.');
      return;
    }
    setAdjSaving(true);
    setAdjError('');
    try {
      await inventoryApi.adjustStock({
        productId: adjForm.productId,
        branchId,
        quantity: parseInt(adjForm.quantity),
        type: adjForm.type,
        notes: adjForm.notes,
        rackLocation: adjForm.rackLocation,
      });
      setAdjOpen(false);
      showToast('Stock adjusted successfully', 'success');
      // Refetch data
      setLoading(true);
      await fetchAll();
    } catch (err) {
      setAdjError(err.response?.data?.message || 'Adjustment failed');
    } finally {
      setAdjSaving(false);
    }
  };

  if (!branchId) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        Your account has no <strong>branchId</strong> assigned. Ask an admin to set one before you can view inventory.
      </Alert>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Inventory"
        subtitle="Stock levels and transaction history for your branch"
        actions={
          canAdjust && (
            <Button
              variant="contained"
              startIcon={<AddCircleOutlineOutlined />}
              onClick={openAdjust}
              sx={{ borderRadius: 2, fontWeight: 600 }}
            >
              Adjust Stock
            </Button>
          )
        }
      />

      <Grid container spacing={2} mb={3}>
        {[
          { label: 'Total Products', value: stock.length, color: '#3b82f6', icon: <Inventory2 /> },
          { label: 'Low Stock Alerts', value: lowStock.length, color: '#ef4444', icon: <Warning /> },
        ].map((kpi) => (
          <Grid item xs={12} sm={6} md={3} key={kpi.label}>
            <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: kpi.color + '18',
                    color: kpi.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {kpi.icon}
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
                    {kpi.label}
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {kpi.value}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ px: 2, borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <Tab label={`Stock Levels (${stock.length})`} />
          <Tab
            label={`Low Stock (${lowStock.length})`}
            sx={{ color: lowStock.length > 0 ? 'error.main' : undefined }}
          />
          <Tab label={`Transactions (${transactions.length})`} />
        </Tabs>

        {tab === 0 && (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 600 }}>
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'action.hover' } }}>
                  <TableCell>#</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell>SKU</TableCell>
                  <TableCell>Rack</TableCell>
                  <TableCell>Stock Level</TableCell>
                  <TableCell>Reserved</TableCell>
                  <TableCell>Available</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && stock.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                      <CircularProgress size={28} />
                    </TableCell>
                  </TableRow>
                ) : stock.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                      <Inventory2 sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} />
                      <br />
                      No stock records found for this branch.
                    </TableCell>
                  </TableRow>
                ) : (
                  stock.map((item, i) => (
                    <TableRow key={item.id} hover>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{item.productName}</TableCell>
                      <TableCell>
                        <Chip label={item.productSku} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>{item.rackLocation || '—'}</TableCell>
                      <TableCell>
                        <StockBar qty={item.quantity} reserved={item.reservedQuantity} />
                      </TableCell>
                      <TableCell>
                        <Chip label={item.reservedQuantity} size="small" color="warning" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.availableQuantity}
                          size="small"
                          color={item.availableQuantity < 5 ? 'error' : 'success'}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {tab === 1 && (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 600 }}>
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: '#fff3f3' } }}>
                  <TableCell>Product</TableCell>
                  <TableCell>SKU</TableCell>
                  <TableCell>Available</TableCell>
                  <TableCell>Reserved</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Rack</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && lowStock.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                      <CircularProgress size={28} />
                    </TableCell>
                  </TableRow>
                ) : lowStock.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 5, color: 'success.main' }}>
                      ✅ No low-stock items — all products are sufficiently stocked.
                    </TableCell>
                  </TableRow>
                ) : (
                  lowStock.map((item) => (
                    <TableRow key={item.id} sx={{ bgcolor: '#fff8f8' }}>
                      <TableCell sx={{ fontWeight: 600, color: 'error.main' }}>
                        ⚠ {item.productName}
                      </TableCell>
                      <TableCell>
                        <Chip label={item.productSku} size="small" color="error" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Chip label={item.availableQuantity} size="small" color="error" />
                      </TableCell>
                      <TableCell>{item.reservedQuantity}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.rackLocation || '—'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {tab === 2 && (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 600 }}>
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'action.hover' } }}>
                  <TableCell>Product</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                      <CircularProgress size={28} />
                    </TableCell>
                  </TableRow>
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                      No transactions yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => (
                    <TableRow key={tx.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{tx.productName}</TableCell>
                      <TableCell>
                        <Chip
                          label={tx.type}
                          size="small"
                          color={TYPE_COLOR[tx.type] || 'default'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography
                          fontWeight={700}
                          color={tx.type === 'STOCK_IN' || tx.type === 'TRANSFER_IN' ? 'success.main' : 'error.main'}
                        >
                          {tx.type === 'STOCK_IN' || tx.type === 'TRANSFER_IN' ? '+' : '-'}
                          {tx.quantity}
                        </Typography>
                      </TableCell>
                      <TableCell>{tx.notes || '—'}</TableCell>
                      <TableCell>
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleString('en-IN') : '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Adjust Stock Dialog */}
      <Dialog open={adjOpen} onClose={() => !adjSaving && setAdjOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Adjust Stock</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {adjError && <Alert severity="error">{adjError}</Alert>}
            <TextField
              select
              label="Product *"
              fullWidth
              value={adjForm.productId}
              onChange={(e) => setAdjForm((f) => ({ ...f, productId: e.target.value }))}
              disabled={adjSaving}
            >
              {products.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Transaction Type *"
              fullWidth
              value={adjForm.type}
              onChange={(e) => setAdjForm((f) => ({ ...f, type: e.target.value }))}
              disabled={adjSaving}
            >
              {ADJUST_TYPES.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Quantity *"
              type="number"
              fullWidth
              value={adjForm.quantity}
              onChange={(e) => setAdjForm((f) => ({ ...f, quantity: e.target.value }))}
              inputProps={{ min: 1 }}
              disabled={adjSaving}
            />
            <TextField
              label="Rack Location"
              fullWidth
              value={adjForm.rackLocation}
              onChange={(e) => setAdjForm((f) => ({ ...f, rackLocation: e.target.value }))}
              disabled={adjSaving}
            />
            <TextField
              label="Notes"
              multiline
              rows={2}
              fullWidth
              value={adjForm.notes}
              onChange={(e) => setAdjForm((f) => ({ ...f, notes: e.target.value }))}
              disabled={adjSaving}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAdjOpen(false)} disabled={adjSaving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleAdjust} disabled={adjSaving} sx={{ fontWeight: 600 }}>
            {adjSaving ? 'Saving…' : 'Apply Adjustment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
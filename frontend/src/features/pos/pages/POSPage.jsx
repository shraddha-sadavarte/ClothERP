import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableFooter,
  Chip,
  MenuItem,
  Stack,
  Alert,
  CircularProgress,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Add,
  Remove,
  Delete,
  Search,
  ShoppingCart,
  Person,
  Receipt,
} from '@mui/icons-material';
import { useAuth } from '../../../hooks/useAuth';
import { usePermission } from '../../../hooks/usePermission';
import { useToast } from '../../../hooks/useToast';
import PageHeader from '../../../components/common/PageHeader';
import { posApi } from '../posApi';
import { branchApi } from '../../branch/branchApi';

// ── Currency formatter ──
const inr = (v) =>
  `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

// ── Payment methods ──
const PAYMENT_METHODS = ['CASH', 'CARD', 'UPI', 'SPLIT'];

export default function POSPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isSuperAdmin = usePermission('ALL');

  // ── Branch state (for superadmin) ──
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [selectedBranchId, setSelectedBranchId] = useState(user?.branchId || '');

  // ── POS state ──
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [cart, setCart] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [orderComplete, setOrderComplete] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);

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

  // ── Product search ──
  const handleSearch = useCallback(async () => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await posApi.searchProducts(search);
      setSearchResults(res || []);
    } catch (err) {
      showToast('Failed to search products', err);
    } finally {
      setSearching(false);
    }
  }, [search, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.trim()) handleSearch();
      else setSearchResults([]);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, handleSearch]);

  // ── Cart operations ──
  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          unitPrice: product.price,
          quantity: 1,
          discountPercent: 0,
        },
      ];
    });
    showToast(`${product.name} added to cart`, 'success');
    setSearch('');
    setSearchResults([]);
  };

  const updateQuantity = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: Math.max(1, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (productId) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setTax(0);
    setSelectedCustomer(null);
  };

  // ── Customer search ──
  const handleCustomerSearch = useCallback(async () => {
    if (!customerSearch.trim()) {
      setCustomers([]);
      return;
    }
    try {
      const res = await posApi.searchCustomers(customerSearch);
      setCustomers(res || []);
    } catch {
      showToast('Failed to search customers', 'error');
    }
  }, [customerSearch, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (customerSearch.trim()) handleCustomerSearch();
      else setCustomers([]);
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch, handleCustomerSearch]);

  // ── Cart totals ──
  const subtotal = cart.reduce(
    (sum, item) =>
      sum +
      item.unitPrice * item.quantity * (1 - (item.discountPercent || 0) / 100),
    0
  );
  const total = subtotal - discount + tax;

  // ── Checkout ──
  const handleCheckout = async () => {
    const branchId = isSuperAdmin ? selectedBranchId : user?.branchId;
    if (cart.length === 0) {
      showToast('Cart is empty', 'warning');
      return;
    }
    if (!branchId) {
      showToast('No branch selected. Please select a branch.', 'error');
      return;
    }
    if (!paymentMethod) {
      showToast('Please select a payment method', 'warning');
      return;
    }

    setCheckoutLoading(true);
    try {
      const payload = {
        branchId,
        customerId: selectedCustomer?.id || null,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPercent: item.discountPercent || 0,
        })),
        discountAmount: discount,
        taxAmount: tax,
        paymentMethod,
      };
      const result = await posApi.checkout(payload);
      setLastOrder(result);
      setOrderComplete(true);
      clearCart();
      showToast('Order completed successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Checkout failed', 'error');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // ── Render ──
  const effectiveBranchId = isSuperAdmin ? selectedBranchId : user?.branchId;

  if (!isSuperAdmin && !user?.branchId) {
    return (
      <Alert severity="warning">
        Your account has no <strong>branchId</strong> assigned. Please contact admin.
      </Alert>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Point of Sale"
        subtitle="Billing and checkout terminal"
        actions={
          <Button
            variant="outlined"
            startIcon={<Receipt />}
            onClick={() => setOrderComplete(!orderComplete)}
          >
            {orderComplete ? 'Hide Receipt' : 'View Last Receipt'}
          </Button>
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
            disabled={branchesLoading}
          >
            {branches.map((b) => (
              <MenuItem key={b.id} value={b.id}>
                {b.name} ({b.code})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {!effectiveBranchId && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Please select a branch to continue.
        </Alert>
      )}

      {orderComplete && lastOrder && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            border: '1px solid',
            borderColor: 'success.main',
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" fontWeight={700} color="success.main">
            ✅ Order # {lastOrder.orderNumber} completed
          </Typography>
          <Typography variant="body2">Total: {inr(lastOrder.totalAmount)}</Typography>
          <Button size="small" onClick={() => setOrderComplete(false)}>
            Close
          </Button>
        </Paper>
      )}

      <Grid container spacing={3}>
        {/* ── Left column: Product search + cart ── */}
        <Grid item xs={12} md={8}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              mb: 3,
            }}
          >
            <TextField
              fullWidth
              placeholder="Search products by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
                endAdornment: searching && <CircularProgress size={20} />,
              }}
            />
            {searchResults.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Click product to add to cart
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>SKU</TableCell>
                        <TableCell>Price</TableCell>
                        <TableCell align="right">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {searchResults.map((p) => (
                        <TableRow key={p.id} hover>
                          <TableCell>{p.name}</TableCell>
                          <TableCell>{p.sku}</TableCell>
                          <TableCell>{inr(p.price)}</TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => addToCart(p)}
                            >
                              Add
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Paper>

          {/* ── Cart table ── */}
          <Paper
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Disc %</TableCell>
                    <TableCell align="right">Line Total</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cart.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <ShoppingCart sx={{ fontSize: 48, opacity: 0.3 }} />
                        <Typography color="text.secondary">Cart is empty</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    cart.map((item) => (
                      <TableRow key={item.productId} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {item.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.sku}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => updateQuantity(item.productId, -1)}
                          >
                            <Remove fontSize="small" />
                          </IconButton>
                          {item.quantity}
                          <IconButton
                            size="small"
                            onClick={() => updateQuantity(item.productId, 1)}
                          >
                            <Add fontSize="small" />
                          </IconButton>
                        </TableCell>
                        <TableCell align="right">{inr(item.unitPrice)}</TableCell>
                        <TableCell align="right">
                          <TextField
                            size="small"
                            type="number"
                            value={item.discountPercent || 0}
                            onChange={(e) => {
                              const val = Math.min(
                                100,
                                Math.max(0, parseFloat(e.target.value) || 0)
                              );
                              setCart((prev) =>
                                prev.map((it) =>
                                  it.productId === item.productId
                                    ? { ...it, discountPercent: val }
                                    : it
                                )
                              );
                            }}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">%</InputAdornment>
                              ),
                            }}
                            sx={{ width: 80 }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          {inr(
                            item.unitPrice *
                              item.quantity *
                              (1 - (item.discountPercent || 0) / 100)
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeItem(item.productId)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                {cart.length > 0 && (
                  <TableFooter>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell colSpan={3} />
                      <TableCell colSpan={2} align="right" sx={{ fontWeight: 700 }}>
                        Subtotal
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {inr(subtotal)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* ── Right column: Customer + Summary + Checkout ── */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              mb: 3,
            }}
          >
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              <Person fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
              Customer
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="Search customer by name or phone..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
            />
            {customers.length > 0 && (
              <Box sx={{ mt: 1 }}>
                {customers.map((c) => (
                  <Paper
                    key={c.id}
                    elevation={0}
                    sx={{
                      p: 1,
                      mb: 0.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                    onClick={() => {
                      setSelectedCustomer(c);
                      setCustomerSearch('');
                      setCustomers([]);
                      showToast(`Customer: ${c.fullName} selected`, 'info');
                    }}
                  >
                    <Typography variant="body2" fontWeight={600}>
                      {c.fullName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {c.phone} • {c.loyaltyPoints} pts
                    </Typography>
                  </Paper>
                ))}
              </Box>
            )}
            {selectedCustomer && (
              <Chip
                label={`${selectedCustomer.fullName} (${selectedCustomer.phone})`}
                onDelete={() => setSelectedCustomer(null)}
                color="primary"
                sx={{ mt: 1 }}
              />
            )}
          </Paper>

          {/* ── Order summary ── */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              mb: 2,
            }}
          >
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Order Summary
            </Typography>
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Subtotal</Typography>
                <Typography variant="body2">{inr(subtotal)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">Discount (₹)</Typography>
                <TextField
                  size="small"
                  type="number"
                  value={discount}
                  onChange={(e) =>
                    setDiscount(Math.max(0, parseFloat(e.target.value) || 0))
                  }
                  sx={{ width: 100 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">₹</InputAdornment>
                    ),
                  }}
                />
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">Tax (₹)</Typography>
                <TextField
                  size="small"
                  type="number"
                  value={tax}
                  onChange={(e) =>
                    setTax(Math.max(0, parseFloat(e.target.value) || 0))
                  }
                  sx={{ width: 100 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">₹</InputAdornment>
                    ),
                  }}
                />
              </Stack>
              <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                <Typography variant="h6" fontWeight={700}>
                  Total
                </Typography>
                <Typography variant="h6" fontWeight={700} color="primary">
                  {inr(total)}
                </Typography>
              </Stack>
            </Stack>
          </Paper>

          {/* ── Payment method ── */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              mb: 2,
            }}
          >
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Payment Method
            </Typography>
            <TextField
              select
              fullWidth
              size="small"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              {PAYMENT_METHODS.map((m) => (
                <MenuItem key={m} value={m}>
                  {m}
                </MenuItem>
              ))}
            </TextField>
          </Paper>

          <Button
            fullWidth
            variant="contained"
            size="large"
            disabled={
              cart.length === 0 ||
              checkoutLoading ||
              !effectiveBranchId
            }
            onClick={handleCheckout}
            sx={{ py: 1.5, fontWeight: 700 }}
          >
            {checkoutLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              `Checkout • ${inr(total)}`
            )}
          </Button>
          <Button
            fullWidth
            variant="outlined"
            color="error"
            size="small"
            onClick={clearCart}
            disabled={cart.length === 0 || checkoutLoading}
            sx={{ mt: 1 }}
          >
            Clear Cart
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}
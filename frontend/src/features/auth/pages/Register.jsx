import { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import {
  Avatar,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  Paper,
  Link,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { branchApi } from '../../branch/branchApi';

const SELF_REGISTER_ROLES = [
  'CASHIER',
  'WAREHOUSE_MANAGER',
  'SALES_EXECUTIVE'
];

const PRIVILEGED_ROLES = [
  'SUPER_ADMIN',
  'OWNER',
  'BRANCH_MANAGER',
  'PURCHASE_MANAGER',
  'ACCOUNTANT',
];

const ALL_ROLES = [...PRIVILEGED_ROLES, ...SELF_REGISTER_ROLES];

export default function Register() {
  const navigate = useNavigate();
  const { register, status, user } = useAuth();

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'CASHIER',
    branchId: '',
  });
  const [errors, setErrors]           = useState({});
  const [serverError, setServerError] = useState('');
  const [branches, setBranches]       = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchesError, setBranchesError]     = useState('');

  const canRegisterPrivileged  = user?.permissions?.includes('ALL') ||
                                 ['SUPER_ADMIN', 'OWNER'].includes(user?.role);
  const selectedRolePrivileged = PRIVILEGED_ROLES.includes(form.role);

  // Fetch active branches on mount
  useEffect(() => {
    setBranchesLoading(true);
    branchApi.listActive()
      .then((res) => {
        // api interceptor already unwraps response.data, so res is ApiResponse
        setBranches(res.data ?? []);
      })
      .catch(() => setBranchesError('Could not load branches. Please refresh.'))
      .finally(() => setBranchesLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.username.trim()) newErrors.username = 'Username is required';
    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Enter a valid email address';
    }
    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!])/.test(form.password)) {
      newErrors.password = 'Must include uppercase, lowercase, number, and special character';
    }
    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!form.role)     newErrors.role     = 'Role is required';
    if (!form.branchId) newErrors.branchId = 'Branch is required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const payload = {
      username: form.username.trim(),
      email:    form.email.trim(),
      password: form.password,
      role:     form.role,
      branchId: form.branchId,
    };

    const result = await register(payload);
    if (result.success) {
      navigate('/');
    } else {
      setServerError(result.error || 'Registration failed');
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
          <PersonAddIcon />
        </Avatar>
        <Typography component="h1" variant="h5">Create Account</Typography>

        {selectedRolePrivileged && !canRegisterPrivileged && (
          <Alert severity="warning" sx={{ mt: 2, width: '100%' }}>
            The role <strong>{form.role}</strong> is restricted and requires admin approval.
            Only SUPER_ADMIN or OWNER can create users with this role.
          </Alert>
        )}

        {!selectedRolePrivileged && (
          <Alert severity="success" sx={{ mt: 2, width: '100%' }}>
            The role <strong>{form.role}</strong> can be self-registered.
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, width: '100%' }}>
          <TextField
            margin="normal" required fullWidth
            id="username" label="Username" name="username"
            autoComplete="username"
            value={form.username} onChange={handleChange}
            error={!!errors.username} helperText={errors.username}
            disabled={status === 'loading'}
          />
          <TextField
            margin="normal" required fullWidth
            id="email" label="Email Address" name="email"
            autoComplete="email"
            value={form.email} onChange={handleChange}
            error={!!errors.email} helperText={errors.email}
            disabled={status === 'loading'}
          />
          <TextField
            margin="normal" required fullWidth
            name="password" label="Password" type="password"
            id="password" autoComplete="new-password"
            value={form.password} onChange={handleChange}
            error={!!errors.password}
            helperText={errors.password || 'Min 8 chars, upper, lower, number, special'}
            disabled={status === 'loading'}
          />
          <TextField
            margin="normal" required fullWidth
            name="confirmPassword" label="Confirm Password" type="password"
            id="confirmPassword"
            value={form.confirmPassword} onChange={handleChange}
            error={!!errors.confirmPassword} helperText={errors.confirmPassword}
            disabled={status === 'loading'}
          />
          <TextField
            margin="normal" required fullWidth select
            name="role" label="Role" id="role"
            value={form.role} onChange={handleChange}
            error={!!errors.role}
            helperText={errors.role || (selectedRolePrivileged ? '(Requires admin approval)' : '(Self-registrable)')}
            disabled={status === 'loading' || (selectedRolePrivileged && !canRegisterPrivileged)}
          >
            {(canRegisterPrivileged ? ALL_ROLES : SELF_REGISTER_ROLES).map((role) => (
              <MenuItem key={role} value={role}>
                {role} {PRIVILEGED_ROLES.includes(role) ? '(Admin Only)' : '(Self-Register)'}
              </MenuItem>
            ))}
          </TextField>

          {/* ── Branch Dropdown ─────────────────────────────────────────── */}
          {branchesError ? (
            <Alert severity="error" sx={{ mt: 1 }}>{branchesError}</Alert>
          ) : (
            <TextField
              margin="normal" required fullWidth select
              name="branchId" label="Branch" id="branchId"
              value={form.branchId} onChange={handleChange}
              error={!!errors.branchId}
              helperText={errors.branchId || (branchesLoading ? 'Loading branches...' : 'Select your branch')}
              disabled={status === 'loading' || branchesLoading}
            >
              {branches.length === 0 && !branchesLoading ? (
                <MenuItem value="" disabled>No branches available</MenuItem>
              ) : (
                branches.map((b) => (
                  <MenuItem key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </MenuItem>
                ))
              )}
            </TextField>
          )}

          {serverError && <Alert severity="error" sx={{ mt: 2 }}>{serverError}</Alert>}

          <Button
            type="submit" fullWidth variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={status === 'loading' || (selectedRolePrivileged && !canRegisterPrivileged)}
          >
            {status === 'loading' ? 'Creating account...' : 'Register'}
          </Button>
          <Typography variant="body2" align="center">
            Already have an account?{' '}
            <Link component={RouterLink} to="/auth/login">Sign In</Link>
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}
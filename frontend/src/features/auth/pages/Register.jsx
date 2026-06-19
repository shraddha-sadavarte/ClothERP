import { useState } from 'react';
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
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

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

  // All available roles
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
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  // Check if user can register others with privileged roles
  const canRegisterPrivileged = user?.permissions?.includes('ALL') || 
                               ['SUPER_ADMIN', 'OWNER'].includes(user?.role);
  
  // Check if selected role requires admin approval
  const selectedRolePrivileged = PRIVILEGED_ROLES.includes(form.role);
 // const canRegisterSelectedRole = !selectedRolePrivileged || canRegisterPrivileged;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear field error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
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
    if (!form.role) newErrors.role = 'Role is required';
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

    // Prepare payload (omit confirmPassword and branchId if empty)
    const payload = {
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
      role: form.role,
      ...(form.branchId.trim() && { branchId: form.branchId.trim() }),
    };

    const result = await register(payload);
    if (result.success) {
      // Registration successful – user is now logged in (token received)
      navigate('/');
    } else {
      setServerError(result.error || 'Registration failed');
    }
  };

  // If the user is not an admin, show an info message (but still allow form)
  // The backend will enforce permissions anyway.
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
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            name="username"
            autoComplete="username"
            value={form.username}
            onChange={handleChange}
            error={!!errors.username}
            helperText={errors.username}
            disabled={status === 'loading'}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            error={!!errors.email}
            helperText={errors.email}
            disabled={status === 'loading'}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
            error={!!errors.password}
            helperText={errors.password || 'Min 8 chars, upper, lower, number, special'}
            disabled={status === 'loading'}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            id="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
            disabled={status === 'loading'}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            select
            name="role"
            label="Role"
            id="role"
            value={form.role}
            onChange={handleChange}
            error={!!errors.role}
            helperText={errors.role || (selectedRolePrivileged ? '(Requires admin approval)' : '(Self-registrable)')}
            disabled={status === 'loading' || (selectedRolePrivileged && !canRegisterPrivileged)}
          >
            {ALL_ROLES.map((role) => (
              <MenuItem key={role} value={role}>
                {role} {PRIVILEGED_ROLES.includes(role) ? '(Admin Only)' : '(Self-Register)'}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            margin="normal"
            fullWidth
            name="branchId"
            label="Branch ID (optional)"
            id="branchId"
            placeholder="e.g., 123e4567-e89b-12d3-a456-426614174000"
            value={form.branchId}
            onChange={handleChange}
            disabled={status === 'loading'}
          />
          {serverError && <Alert severity="error" sx={{ mt: 2 }}>{serverError}</Alert>}
          <Button
            type="submit"
            fullWidth
            variant="contained"
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
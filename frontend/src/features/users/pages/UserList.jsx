import { useEffect, useState, useRef } from 'react';
import { userApi } from '../userApi';
import { usePermission } from '../../../hooks/usePermission';
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from '@mui/material';

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  const canView = usePermission('USER_VIEW');
  const isMounted = useRef(true);
  const fetchInProgress = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (!canView || fetchInProgress.current) return;
    const fetchUsers = async () => {
      fetchInProgress.current = true;
      setLoading(true);
      setError(null);
      try {
        const data = await userApi.listUsers(page, rowsPerPage);
        if (isMounted.current) {
          setUsers(data.content || []);
          setTotalElements(data.totalElements || 0);
        }
      } catch (err) {
        if (isMounted.current) {
          setError(err.response?.data?.message || 'Failed to load users');
        }
      } finally {
        if (isMounted.current) setLoading(false);
        fetchInProgress.current = false;
      }
    };
    fetchUsers();
  }, [page, rowsPerPage, canView]);

  if (!canView) {
    return (
      <Alert severity="warning">
        You don't have permission to view users. (USER_VIEW required)
      </Alert>
    );
  }

  if (loading && users.length === 0) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Users</Typography>
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.username}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.role}</TableCell>
                  <TableCell>{u.active ? 'Active' : 'Inactive'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalElements}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>
    </Box>
  );
}
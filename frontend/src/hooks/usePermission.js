import { useSelector } from 'react-redux';

// Mirrors backend's Role.Permission enum — keep this list in sync manually,
// or better, just check `permissions.includes(name)` without a hardcoded
// list at all, which is what this does. ALL means super-admin/owner.
export function usePermission(permission) {
  const permissions = useSelector((state) => state.auth.user?.permissions || []);
  return permissions.includes('ALL') || permissions.includes(permission);
}
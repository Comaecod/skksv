import { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';
import { auditService, AUDIT_ACTIONS } from '../../services/auditService';
import { ROLES, STAFF_SUBTYPES, USER_STATUS } from '../../types/roles';
import CustomSelect from '../../../components/CustomSelect';

const ROLE_OPTIONS = [
  { value: ROLES.ADMIN, label: 'Admin' },
  { value: ROLES.STAFF, label: 'Staff' },
  { value: ROLES.STUDENT, label: 'Student' },
];

const STAFF_SUBTYPE_OPTIONS = [
  { value: STAFF_SUBTYPES.PRINCIPAL, label: 'Principal' },
  { value: STAFF_SUBTYPES.TEACHER, label: 'Teacher' },
  { value: STAFF_SUBTYPES.RECEPTION, label: 'Reception' },
  { value: STAFF_SUBTYPES.LIBRARIAN, label: 'Librarian' },
];

const initialFormState = {
  email: '',
  password: '',
  displayName: '',
  role: ROLES.STUDENT,
  roleSubtype: '',
  phone: '',
  forcePasswordChange: true,
};

export default function AdminUserManagement() {
  const { user, isSuperAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState(initialFormState);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await userService.getAllUsers();
      setUsers(allUsers);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
    setLoading(false);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setIsSubmitting(true);

    try {
      await userService.createUser(form.email, form.password, {
        displayName: form.displayName,
        role: form.role,
        roleSubtype: form.role === ROLES.STAFF ? form.roleSubtype : null,
        phone: form.phone,
        forcePasswordChange: form.forcePasswordChange,
        createdBy: user?.uid,
      });

      await auditService.log(AUDIT_ACTIONS.USER_CREATED, user?.uid, {
        targetEmail: form.email,
        targetRole: form.role,
        userEmail: user?.email,
      });

      setFormSuccess(`User ${form.email} created successfully!`);
      setForm(initialFormState);
      setShowCreateForm(false);
      loadUsers();
    } catch (err) {
      setFormError(err.message || 'Failed to create user');
    }
    setIsSubmitting(false);
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      if (currentStatus === USER_STATUS.ACTIVE) {
        await userService.deactivateUser(userId);
        await auditService.log(AUDIT_ACTIONS.USER_DEACTIVATED, user?.uid, {
          targetUserId: userId,
          userEmail: user?.email,
        });
      } else {
        await userService.activateUser(userId);
        await auditService.log(AUDIT_ACTIONS.USER_ACTIVATED, user?.uid, {
          targetUserId: userId,
          userEmail: user?.email,
        });
      }
      loadUsers();
    } catch (err) {
      console.error('Failed to toggle user status:', err);
    }
  };

  const handleResetPassword = async (email) => {
    try {
      await userService.sendPasswordReset(email);
      await auditService.log(AUDIT_ACTIONS.PASSWORD_RESET, user?.uid, {
        targetEmail: email,
        userEmail: user?.email,
      });
      setFormSuccess(`Password reset email sent to ${email}`);
    } catch (err) {
      setFormError('Failed to send reset email');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = !searchTerm || 
      u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="animate-slideUp">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Create and manage user accounts
          </p>
        </div>
        <button
          onClick={() => { setShowCreateForm(!showCreateForm); setFormError(''); setFormSuccess(''); }}
          className="px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-all"
        >
          {showCreateForm ? 'Cancel' : '+ Create User'}
        </button>
      </div>

      {formSuccess && (
        <div className="mb-4 p-4 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20">
          <p className="text-green-600 dark:text-green-400 text-sm">{formSuccess}</p>
        </div>
      )}

      {showCreateForm && (
        <div className="glass-card p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Create New User</h2>
          {formError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
              <p className="text-red-600 dark:text-red-400 text-sm">{formError}</p>
            </div>
          )}
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Email address *"
                className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary/50 transition-all text-sm"
                required
              />
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Temporary password *"
                className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary/50 transition-all text-sm"
                required
                minLength={6}
              />
              <input
                type="text"
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                placeholder="Display name"
                className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary/50 transition-all text-sm"
              />
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Phone number"
                className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary/50 transition-all text-sm"
              />
              <CustomSelect
                value={form.role}
                onChange={(val) => setForm({ ...form, role: val, roleSubtype: val === ROLES.STAFF ? form.roleSubtype : '' })}
                options={ROLE_OPTIONS}
                className="w-full"
              />
              {form.role === ROLES.STAFF && (
                <CustomSelect
                  value={form.roleSubtype}
                  onChange={(val) => setForm({ ...form, roleSubtype: val })}
                  options={[{ value: '', label: 'Select subtype' }, ...STAFF_SUBTYPE_OPTIONS]}
                  className="w-full"
                />
              )}
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <input
                type="checkbox"
                checked={form.forcePasswordChange}
                onChange={(e) => setForm({ ...form, forcePasswordChange: e.target.checked })}
                className="rounded border-gray-300 dark:border-white/10"
              />
              Force password change on first login
            </label>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create User'}
            </button>
          </form>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name or email..."
          className="flex-1 px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary/50 transition-all text-sm"
        />
        <CustomSelect
          value={roleFilter}
          onChange={(val) => setRoleFilter(val)}
          options={[{ value: '', label: 'All Roles' }, ...ROLE_OPTIONS]}
        />
        <button
          onClick={loadUsers}
          className="px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
        >
          Refresh
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/10">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {u.displayName || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{u.email}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary dark:text-primary-light">
                        {u.role}
                        {u.roleSubtype && <span className="ml-1 opacity-70">({u.roleSubtype})</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        u.status === USER_STATUS.ACTIVE
                          ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleResetPassword(u.email)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-primary dark:text-primary-light hover:bg-primary/10 transition-all"
                          title="Send password reset"
                        >
                          Reset Pwd
                        </button>
                        <button
                          onClick={() => handleToggleStatus(u.id, u.status)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            u.status === USER_STATUS.ACTIVE
                              ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'
                              : 'text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10'
                          }`}
                        >
                          {u.status === USER_STATUS.ACTIVE ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

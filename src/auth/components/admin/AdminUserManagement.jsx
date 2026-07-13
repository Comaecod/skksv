import { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';
import { auditService, AUDIT_ACTIONS } from '../../services/auditService';
import { ROLES, STAFF_SUBTYPES, USER_STATUS } from '../../types/roles';
import CustomSelect from '../../../components/CustomSelect';
import DataTable from '../../../components/DataTable';

const ROLE_OPTIONS = [
  { value: ROLES.ADMIN, label: 'Admin' },
  { value: ROLES.STAFF, label: 'Staff' },
  { value: ROLES.STUDENT, label: 'Student' },
];

const STAFF_SUBTYPE_OPTIONS = [
  { value: STAFF_SUBTYPES.PRINCIPAL, label: 'Principal' },
  { value: STAFF_SUBTYPES.TEACHER, label: 'Teacher' },
  { value: STAFF_SUBTYPES.RECEPTION, label: 'Reception' },
];

const initialFormState = {
  email: '',
  password: '',
  displayName: '',
  role: ROLES.STAFF,
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
        });
      } else {
        await userService.activateUser(userId);
        await auditService.log(AUDIT_ACTIONS.USER_ACTIVATED, user?.uid, {
          targetUserId: userId,
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
        <div className="flex gap-2">
          <button
            onClick={() => { setShowCreateForm(!showCreateForm); setFormError(''); setFormSuccess(''); }}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-all"
          >
            {showCreateForm ? 'Cancel' : '+ Create User'}
          </button>
          <button onClick={loadUsers} className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all">Refresh</button>
        </div>
      </div>

      {formSuccess && (
        <div className="mb-4 p-4 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20">
          <p className="text-green-600 dark:text-green-400 text-sm">{formSuccess}</p>
        </div>
      )}

      {showCreateForm && (
        <div className="bg-white dark:bg-[#282843] rounded-xl border border-gray-200 dark:border-white/10 p-6 mb-6">
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
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1e1e38] border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-all"
                  required
                />
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Temporary password *"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1e1e38] border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-all"
                  required
                  minLength={6}
                />
                <input
                  type="text"
                  value={form.displayName}
                  onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                  placeholder="Display name"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1e1e38] border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-all"
                />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Phone number"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1e1e38] border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-all"
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
                className="rounded border-gray-300 dark:border-white/10 bg-white dark:bg-[#1e1e38]"
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
          className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-[#282843] border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-all"
        />
        <CustomSelect
          value={roleFilter}
          onChange={(val) => setRoleFilter(val)}
          options={[{ value: '', label: 'All Roles' }, ...ROLE_OPTIONS]}
        />
        <span className="text-sm text-gray-500 dark:text-gray-400 self-center whitespace-nowrap">{filteredUsers.length} result{filteredUsers.length !== 1 ? 's' : ''}</span>
      </div>

      <DataTable
        columns={[
          { key: 'name', label: 'Name', render: (u) => <span className="font-medium text-gray-900 dark:text-white">{u.displayName || '—'}</span> },
          { key: 'email', label: 'Email', render: (u) => <span className="text-gray-500 dark:text-gray-400">{u.email}</span> },
          { key: 'role', label: 'Role', render: (u) => <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">{u.role}{u.roleSubtype ? <span className="ml-1 opacity-70">({u.roleSubtype})</span> : ''}</span> },
          { key: 'status', label: 'Status', render: (u) => (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.status === USER_STATUS.ACTIVE ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400'}`}>{u.status}</span>
          )},
          { key: 'actions', label: 'Actions', className: 'text-center', render: (u) => (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => handleResetPassword(u.email)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-500/30 transition-all" title="Send password reset">Reset Pwd</button>
              <button onClick={() => handleToggleStatus(u.id, u.status)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${u.status === USER_STATUS.ACTIVE ? 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/20' : 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-500/20'}`}>{u.status === USER_STATUS.ACTIVE ? 'Deactivate' : 'Activate'}</button>
            </div>
          )},
        ]}
        data={filteredUsers}
        loading={loading}
        loadingMessage="Loading users..."
        emptyMessage="No users found"
        rowKey="id"
      />
    </div>
  );
}

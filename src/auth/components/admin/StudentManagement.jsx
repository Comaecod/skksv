import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES, USER_STATUS } from '../../types/roles';
import { auditService, AUDIT_ACTIONS } from '../../services/auditService';
import CustomSelect from '../../../components/CustomSelect';
import DataTable from '../../../components/DataTable';

const CLASS_OPTIONS = [
  { value: '4', label: 'Class 4' },
  { value: '5', label: 'Class 5' },
  { value: '6', label: 'Class 6' },
  { value: '7', label: 'Class 7' },
  { value: '8', label: 'Class 8' },
  { value: '9', label: 'Class 9' },
  { value: '10', label: 'Class 10' },
];

// Residence enum: 1=Day Scholar, 2=Veda Hostel, 3=Brahmin Hostel
// Stored as numeric string so labels can be changed later without migration.
const RESIDENCE_OPTIONS = [
  { value: '1', label: 'Day Scholar' },
  { value: '2', label: 'Veda Hostel' },
  { value: '3', label: 'General Hostel' },
];

const RESIDENCE_LABELS = {
  '1': 'Day Scholar',
  '2': 'Veda Hostel',
  '3': 'General Hostel',
};

const BLOOD_GROUP_OPTIONS = [
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' },
];

const FormField = ({ label, ...props }) => (
  <div>
    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">{label}</label>
    <input {...props} className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary/50 transition-all text-sm" />
  </div>
);

const initialFormState = {
  email: '',
  password: '',
  displayName: '',
  phone: '',
  studentClass: '4',
  section: '',
  dayScholarOrHostel: '',
  penNo: '',
  admissionNo: '',
  motherTongue: '',
  address: '',
  bloodGroup: '',
  dateOfBirth: '',
  fathersName: '',
  fathersOccupation: '',
  mothersName: '',
  mothersOccupation: '',
  fatherContact: '',
  motherContact: '',
  schoolBusService: false,
};

export default function StudentManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialFormState);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterResidence, setFilterResidence] = useState('');

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const all = await userService.getAllUsers({ role: ROLES.STUDENT });
      setStudents(all);
      setFormError('');
    } catch (err) {
      console.error('Failed to load students:', err);
      setFormError(err.message || 'Failed to load students');
    }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setIsSubmitting(true);

    try {
      await userService.createUser(form.email, form.password, {
        displayName: form.displayName,
        role: ROLES.STUDENT,
        phone: form.phone,
        studentClass: form.studentClass,
        section: form.section,
        dayScholarOrHostel: form.dayScholarOrHostel,
        penNo: form.penNo,
        admissionNo: form.admissionNo,
        motherTongue: form.motherTongue,
        address: form.address,
        bloodGroup: form.bloodGroup,
        dateOfBirth: form.dateOfBirth,
        fathersName: form.fathersName,
        fathersOccupation: form.fathersOccupation,
        mothersName: form.mothersName,
        mothersOccupation: form.mothersOccupation,
        fatherContact: form.fatherContact,
        motherContact: form.motherContact,
        schoolBusService: form.schoolBusService,
        forcePasswordChange: true,
        createdBy: user?.uid,
      });

      auditService.log(AUDIT_ACTIONS.STUDENT_CREATED, user?.uid, { targetEmail: form.email, targetName: form.displayName });
      setFormSuccess(`Student ${form.displayName || form.email} created successfully!`);
      setForm(initialFormState);
      setShowForm(false);
      loadStudents();
    } catch (err) {
      setFormError(err.message || 'Failed to create student');
    }
    setIsSubmitting(false);
  };

  const handleEdit = async (student) => {
    setEditingId(student.id);
    setForm({
      email: student.email || '',
      password: '',
      displayName: student.displayName || '',
      phone: student.phone || '',
      studentClass: student.studentClass || '',
      section: student.section || '',
      dayScholarOrHostel: student.dayScholarOrHostel || '',
      penNo: student.penNo || '',
      admissionNo: student.admissionNo || '',
      motherTongue: student.motherTongue || '',
      address: student.address || '',
      bloodGroup: student.bloodGroup || '',
      dateOfBirth: student.dateOfBirth || '',
      fathersName: student.fathersName || '',
      fathersOccupation: student.fathersOccupation || '',
      mothersName: student.mothersName || '',
      mothersOccupation: student.mothersOccupation || '',
      fatherContact: student.fatherContact || '',
      motherContact: student.motherContact || '',
      schoolBusService: student.schoolBusService || false,
    });
    setShowForm(true);
    setFormError('');
    setFormSuccess('');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setIsSubmitting(true);

    try {
      const updates = { ...form };
      delete updates.email;
      delete updates.password;
      await userService.updateUser(editingId, updates);
      auditService.log(AUDIT_ACTIONS.STUDENT_UPDATED, user?.uid, { targetId: editingId, targetName: form.displayName });
      setFormSuccess(`Student updated successfully!`);
      setForm(initialFormState);
      setShowForm(false);
      setEditingId(null);
      loadStudents();
    } catch (err) {
      setFormError(err.message || 'Failed to update student');
    }
    setIsSubmitting(false);
  };

  const handleToggleStatus = async (studentId, currentStatus) => {
    try {
      if (currentStatus === USER_STATUS.ACTIVE) {
        await userService.deactivateUser(studentId);
        auditService.log(AUDIT_ACTIONS.STUDENT_DEACTIVATED, user?.uid, { targetId: studentId });
      } else {
        await userService.activateUser(studentId);
        auditService.log(AUDIT_ACTIONS.STUDENT_ACTIVATED, user?.uid, { targetId: studentId });
      }
      loadStudents();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const filteredStudents = students.filter((s) => {
    if (filterClass && s.studentClass !== filterClass) return false;
    if (filterResidence && s.dayScholarOrHostel !== filterResidence) return false;
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      s.displayName?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.admissionNo?.toLowerCase().includes(q) ||
      s.fathersName?.toLowerCase().includes(q)
    );
  });

  const resetForm = () => {
    setForm(initialFormState);
    setShowForm(false);
    setEditingId(null);
    setFormError('');
    setFormSuccess('');
  };

  return (
    <div className="animate-slideUp">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Student Management</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Create and manage student accounts</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-all"
          >
            {showForm ? 'Cancel' : '+ Add Student'}
          </button>
          <button onClick={loadStudents} className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all">Refresh</button>
        </div>
      </div>

      {formSuccess && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20">
          <p className="text-green-600 dark:text-green-400 text-sm">{formSuccess}</p>
        </div>
      )}

      {showForm && (
        <div className="glass-card p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            {editingId ? 'Edit Student' : 'Add New Student'}
          </h2>
          {formError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
              <p className="text-red-600 dark:text-red-400 text-sm">{formError}</p>
            </div>
          )}
          <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField label="Full Name *" type="text" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder="Student name" required />
              <FormField label="Email *" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email for login" required={!editingId} disabled={!!editingId} />
              {!editingId && (
                <FormField label="Temporary Password *" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" required minLength={6} />
              )}
              <FormField label="Phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" />
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Class *</label>
                <CustomSelect value={form.studentClass} onChange={(val) => setForm({ ...form, studentClass: val })} options={CLASS_OPTIONS} className="w-full" />
              </div>
              <FormField label="Section" type="text" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} placeholder="e.g. A, B" />
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Residence *</label>
                <CustomSelect value={form.dayScholarOrHostel} onChange={(val) => setForm({ ...form, dayScholarOrHostel: val })} options={RESIDENCE_OPTIONS} className="w-full" />
              </div>
              <FormField label="PEN No" type="text" value={form.penNo} onChange={(e) => setForm({ ...form, penNo: e.target.value })} placeholder="PEN number" />
              <FormField label="Admission No" type="text" value={form.admissionNo} onChange={(e) => setForm({ ...form, admissionNo: e.target.value })} placeholder="Admission number" />
              <FormField label="Mother Tongue" type="text" value={form.motherTongue} onChange={(e) => setForm({ ...form, motherTongue: e.target.value })} placeholder="Mother tongue" />
              <FormField label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Blood Group</label>
                <CustomSelect value={form.bloodGroup} onChange={(val) => setForm({ ...form, bloodGroup: val })} options={BLOOD_GROUP_OPTIONS} className="w-full" />
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-white/10 pt-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Address</h3>
              <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Full address" rows={2} className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary/50 transition-all text-sm" />
            </div>

            <div className="border-t border-gray-200 dark:border-white/10 pt-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Parent / Guardian Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField label="Father's Name" type="text" value={form.fathersName} onChange={(e) => setForm({ ...form, fathersName: e.target.value })} placeholder="Father's name" />
                <FormField label="Father's Occupation" type="text" value={form.fathersOccupation} onChange={(e) => setForm({ ...form, fathersOccupation: e.target.value })} placeholder="Occupation" />
                <FormField label="Father's Contact" type="tel" value={form.fatherContact} onChange={(e) => setForm({ ...form, fatherContact: e.target.value })} placeholder="Phone number" />
                <FormField label="Mother's Name" type="text" value={form.mothersName} onChange={(e) => setForm({ ...form, mothersName: e.target.value })} placeholder="Mother's name" />
                <FormField label="Mother's Occupation" type="text" value={form.mothersOccupation} onChange={(e) => setForm({ ...form, mothersOccupation: e.target.value })} placeholder="Occupation" />
                <FormField label="Mother's Contact" type="tel" value={form.motherContact} onChange={(e) => setForm({ ...form, motherContact: e.target.value })} placeholder="Phone number" />
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-white/10 pt-4">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input type="checkbox" checked={form.schoolBusService} onChange={(e) => setForm({ ...form, schoolBusService: e.target.checked })} className="rounded border-gray-300 dark:border-white/10" />
                Avails School Bus Service
              </label>
            </div>

            <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-all disabled:opacity-50">
              {isSubmitting ? 'Saving...' : editingId ? 'Update Student' : 'Create Student'}
            </button>
          </form>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by name, email, admission no, or father's name..." className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-[#282843] border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-all" />
        <CustomSelect value={filterClass} onChange={setFilterClass} options={[{ value: '', label: 'All Classes' }, ...CLASS_OPTIONS]} className="min-w-[140px]" />
        <CustomSelect value={filterResidence} onChange={setFilterResidence} options={[{ value: '', label: 'All Residences' }, ...RESIDENCE_OPTIONS]} className="min-w-[160px]" />
        <span className="text-sm text-gray-500 dark:text-gray-400 self-center whitespace-nowrap">{filteredStudents.length} result{filteredStudents.length !== 1 ? 's' : ''}</span>
      </div>

      <DataTable
        columns={[
          { key: 'name', label: 'Name', render: (s) => <span className="font-medium text-gray-900 dark:text-white">{s.displayName || '—'}</span> },
          { key: 'class', label: 'Class', render: (s) => <span className="text-gray-500 dark:text-gray-400">{s.studentClass || '—'}{s.section ? ` - ${s.section}` : ''}</span> },
          { key: 'email', label: 'Email', render: (s) => <span className="text-gray-500 dark:text-gray-400">{s.email}</span> },
          { key: 'admissionNo', label: 'Admission No', render: (s) => <span className="text-gray-500 dark:text-gray-400">{s.admissionNo || '—'}</span> },
          { key: 'residence', label: 'Residence', render: (s) => <span className="text-gray-500 dark:text-gray-400">{RESIDENCE_LABELS[s.dayScholarOrHostel] || '—'}</span> },
          { key: 'status', label: 'Status', render: (s) => (
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${s.status === USER_STATUS.ACTIVE ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400'}`}>{s.status}</span>
          )},
          { key: 'actions', label: 'Actions', className: 'text-center', render: (s) => (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => handleEdit(s)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-500/30 transition-all">Edit</button>
              <button onClick={() => handleToggleStatus(s.id, s.status)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${s.status === USER_STATUS.ACTIVE ? 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/20' : 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-500/20'}`}>{s.status === USER_STATUS.ACTIVE ? 'Deactivate' : 'Activate'}</button>
            </div>
          )},
        ]}
        data={filteredStudents}
        loading={loading}
        loadingMessage="Loading students..."
        emptyMessage="No students found"
        rowKey="id"
      />
    </div>
  );
}

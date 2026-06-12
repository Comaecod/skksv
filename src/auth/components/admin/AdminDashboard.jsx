import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const CARDS = [
  { to: '/dashboard/users', icon: '👥', title: 'User Management', desc: 'Create, edit, and manage user accounts', color: 'from-blue-500 to-blue-600', roles: ['super_admin', 'admin'] },
  { to: '/dashboard/students', icon: '🎓', title: 'Students', desc: 'Manage student profiles and accounts', color: 'from-indigo-500 to-purple-600', roles: ['super_admin', 'admin', 'staff'] },
  { to: '/dashboard/assessments', icon: '📝', title: 'Assessments', desc: 'View and manage all assessments', color: 'from-green-500 to-emerald-600', roles: ['super_admin', 'admin', 'staff'] },
  { to: '/dashboard/assessments/new', icon: '➕', title: 'New Assessment', desc: 'Create new assessments and exams', color: 'from-amber-500 to-orange-600', roles: ['super_admin', 'admin', 'staff'] },
  { to: '/dashboard/notifications', icon: '🔔', title: 'Notifications', desc: 'Send announcements to users', color: 'from-purple-500 to-violet-600', roles: ['super_admin', 'admin'] },
  { to: '/dashboard/feedback', icon: '💬', title: 'Feedback Reports', desc: 'Review user feedback', color: 'from-pink-500 to-rose-600', roles: ['super_admin', 'admin'] },
  { to: '/dashboard/images', icon: '🖼️', title: 'Image Gallery', desc: 'Manage uploaded images', color: 'from-cyan-500 to-teal-600', roles: ['super_admin', 'admin'] },
  { to: '/dashboard/audit', icon: '📋', title: 'Audit Logs', desc: 'View system activity logs', color: 'from-slate-500 to-slate-600', roles: ['super_admin'] },
  { to: '/dashboard/settings', icon: '⚙️', title: 'Settings', desc: 'Global application settings', color: 'from-gray-500 to-gray-600', roles: ['super_admin'] },
];

export default function AdminDashboard() {
  const { userProfile } = useAuth();
  const userRole = userProfile?.role;
  const accessibleCards = CARDS.filter((card) => card.roles.includes(userRole));

  return (
    <div className="animate-slideUp">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your school platform</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {accessibleCards.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="group glass-card p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${card.color} text-white text-2xl mb-4 shadow-lg`}>
              {card.icon}
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary transition-colors">
              {card.title}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
              {card.desc}
            </p>
            <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary dark:text-primary-light opacity-0 group-hover:opacity-100 transition-opacity">
              <span>Open</span>
              <span>→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

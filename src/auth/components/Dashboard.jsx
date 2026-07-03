import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROLES, STAFF_SUBTYPES } from '../types/roles';

export default function Dashboard() {
  const { userProfile } = useAuth();
  const role = userProfile?.role;
  const subtype = userProfile?.roleSubtype;

  const roleGreeting = {
    [ROLES.SUPER_ADMIN]: { title: 'Super Admin Dashboard', icon: '🛡️', desc: 'Full system access and control' },
    [ROLES.ADMIN]: { title: 'Admin Dashboard', icon: '🔐', desc: 'Manage users, exams, and content' },
    [ROLES.STAFF]: { title: 'Staff Dashboard', icon: '👩‍🏫', desc: 'Manage classes and students' },
    [ROLES.STUDENT]: { title: 'Student Dashboard', icon: '🎓', desc: 'View exams, results, and learning' },
  };

  const info = roleGreeting[role] || { title: 'Dashboard', icon: '📊', desc: '' };

  const getCards = () => {
    const isStaffOrAbove = role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN || role === ROLES.STAFF;
    const cards = [
      { to: isStaffOrAbove ? '/dashboard/assessments' : '/assessments', icon: '📝', title: 'Assessments', desc: 'Take exams and assessments', color: 'from-blue-500 to-blue-600', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF, ROLES.STUDENT] },
      { to: '/profile', icon: '👤', title: 'My Profile', desc: 'View and edit your profile', color: 'from-green-500 to-emerald-600', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF, ROLES.STUDENT] },
    ];

    if (role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN) {
      cards.push(
        { to: '/dashboard/users', icon: '👥', title: 'User Management', desc: 'Create and manage accounts', color: 'from-cyan-500 to-teal-600', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
        { to: '/dashboard/students', icon: '🎓', title: 'Students', desc: 'Manage student accounts', color: 'from-purple-500 to-violet-600', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
      );
    }

    if (role === ROLES.STAFF && subtype === STAFF_SUBTYPES.TEACHER) {
      cards.push(
        { to: '/dashboard/assessments/new', icon: '➕', title: 'Create Assessment', desc: 'Create new exam', color: 'from-amber-500 to-orange-600', roles: [ROLES.STAFF] },
      );
    }

    if (role === ROLES.STUDENT) {
      cards.push(
        { to: '/reports', icon: '📊', title: 'My Results', desc: 'View your assessment results and reports', color: 'from-pink-500 to-rose-600', roles: [ROLES.STUDENT] },
      );
    }

    return cards;
  };

  const cards = getCards();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="glass-card p-6 sm:p-8 mb-8 animate-slideUp">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-3xl">
            {info.icon}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{info.title}</h1>
            <p className="text-gray-500 dark:text-gray-400">{info.desc}</p>
            {subtype && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 capitalize">Role: {subtype}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
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
          </Link>
        ))}
      </div>
    </div>
  );
}

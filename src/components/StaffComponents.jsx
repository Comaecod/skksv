import { motion } from 'framer-motion';
import staffData from '../data/staffDirectory.json';
import { getImagesByCategory } from '../services/imageService';
import vvPhoto from '../assets/employees/vv.jpg';
import apPhoto from '../assets/employees/ap.jpeg';

const capitalize = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const capitalizeInitials = (name) => {
  if (!name) return '';
  const parts = name.split(' ').filter(p => p.length > 0);
  return parts.map(p => p[0].toUpperCase() + '.').join(' ');
};

const getAvatarText = (person) => {
  if (person.alias) return person.alias.substring(0, 3).toUpperCase();
  const parts = person.name.split(' ').filter(p => p.length > 0);
  if (parts.length === 1) return parts[0].substring(0, 3).toUpperCase();
  return parts.slice(0, 3).map(p => p[0].toUpperCase()).join('');
};

let staffPhotoMap = {
  'staff-10': apPhoto,
  'staff-13': vvPhoto,
};

export const initStaffPhotos = async () => {
  try {
    const items = await getImagesByCategory('staff');
    if (items.length === 0) return;
    const newMap = {};
    items.forEach(item => {
      if (item.subCategory) newMap[item.subCategory] = item.url;
    });
    if (Object.keys(newMap).length > 0) staffPhotoMap = { ...staffPhotoMap, ...newMap };
  } catch (e) {
    // fallback to static
  }
};

export const Avatar = ({ person, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-10 h-10 text-[9px]',
    md: 'w-14 h-14 text-[10px]',
    lg: 'w-16 h-16 text-xs',
    xl: 'w-24 h-24 text-sm'
  };

  const bgColors = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-cyan-600',
    'from-pink-500 to-rose-600',
    'from-amber-500 to-orange-600',
    'from-emerald-500 to-teal-600',
    'from-indigo-500 to-violet-600'
  ];

  const colorIndex = person.name?.charCodeAt(0) % bgColors.length || 0;

  const photoSrc = staffPhotoMap[person.id] || null;

  if (photoSrc) {
    return (
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-gray-200 dark:border-white/20 shadow-lg flex-shrink-0`}>
        <img src={photoSrc} alt={person.name} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${bgColors[colorIndex]} flex items-center justify-center shadow-lg flex-shrink-0`}>
      <span className="font-bold text-white">{getAvatarText(person)}</span>
    </div>
  );
};

export const PersonCard = ({ person, onClick }) => {
  const displayName = capitalize(person.name);
  const salutation = person.salutation === 'Mr' ? 'Mr.' : person.salutation === 'Mrs' ? 'Mrs.' : '';
  const isOnLeave = person.onLeave;

  return (
    <motion.div
      className={`glass-card p-4 w-64 h-32 flex flex-col justify-center cursor-pointer ${isOnLeave ? 'opacity-50 grayscale' : ''}`}
      whileHover={isOnLeave ? {} : { scale: 1.02, boxShadow: '0 8px 30px rgba(102, 126, 234, 0.3)' }}
      onClick={() => !isOnLeave && onClick(person)}
    >
      <div className="flex items-center gap-3">
        <Avatar person={person} size="md" />
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight line-clamp-2 break-words" title={displayName}>
            {salutation} {displayName}
          </h4>
          <p className="text-xs text-primary/80 mt-1">{person.designation}</p>
          {person.subject && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{person.subject}</p>
          )}
          {isOnLeave && (
            <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-500 border border-amber-500/30">
              On Leave
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const getHierarchy = (person) => {
  const hierarchy = [];
  const { correspondent, principal } = staffData;

  hierarchy.push({ role: 'Correspondent', name: capitalize(correspondent.name) });

  if (person.designation === 'Correspondent') {
    return hierarchy;
  }

  if (person.designation === 'Principal') {
    hierarchy.push({ role: 'Principal', name: capitalize(principal.name) });
    return hierarchy;
  }

  if (person.designation === 'Director') {
    hierarchy.push({ role: 'Director', name: capitalize(person.name) });
    return hierarchy;
  }

  hierarchy.push({ role: 'Principal', name: capitalize(principal.name) });
  hierarchy.push({ role: person.designation, name: capitalize(person.name) });

  return hierarchy;
};

export { capitalize, capitalizeInitials };
/**
 * Formatting Utilities
 */

import { SUBJECTS } from '../config/schoolConfig';

export const formatName = (name) => {
  if (!name) return '';
  const trimmed = name.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

export const subjectLabel = (val) => {
  if (typeof val === 'string' && isNaN(Number(val))) return val;
  const found = SUBJECTS.find(s => s.value === Number(val));
  return found ? found.label : val;
};

export const resolveSubjectValue = (subj) => {
  if (typeof subj === 'number') return subj;
  const found = SUBJECTS.find(s => s.label.toLowerCase() === String(subj).toLowerCase());
  if (found) return found.value;
  if (subj && !isNaN(Number(subj))) return Number(subj);
  return 15;
};

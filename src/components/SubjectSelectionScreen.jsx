import { subjectLabel } from '../utils/format';

const getSubjectValue = (subject) => {
  if (subject == null) return subject;
  if (typeof subject === 'object') {
    return subject.value ?? subject.id ?? subject.subject ?? subject.key;
  }
  return subject;
};

const SubjectSelectionScreen = ({ classNum, subjects = [], isLoading, onSelect, onBack }) => {
  const normalizedSubjects = Array.isArray(subjects)
    ? subjects
        .map((s) => getSubjectValue(s))
        .filter((s) => s != null && s !== '')
    : [];

  return (
    <div className="glass-card w-full max-w-2xl animate-slideUp">
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">📚</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Select Subject</h2>
        <p className="text-gray-500 dark:text-gray-400">Class {classNum}</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading subjects...</p>
        </div>
      ) : (
        <div className="space-y-3 mb-8">
          {normalizedSubjects.map((subject) => (
            <button
              key={String(subject)}
              onClick={() => onSelect(subject)}
              className="w-full p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 hover:border-primary/50 transition-all text-left flex items-center gap-4 group"
            >
              <span className="text-3xl">📖</span>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors">{subjectLabel(subject)}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Click to start assessment</div>
              </div>
              <span className="text-gray-500 dark:text-gray-400 group-hover:text-primary transition-colors">→</span>
            </button>
          ))}
        </div>
      )}

    </div>
  );
};

export default SubjectSelectionScreen;
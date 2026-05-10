const EmptyState = () => {
  return (
    <div className="glass-card w-full max-w-md text-center animate-slideUp" role="region" aria-labelledby="empty-state-heading">
      <div className="text-5xl sm:text-6xl mb-4" aria-hidden="true">📋</div>
      <h2 id="empty-state-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No Exam Available</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-4">
        There is no exam scheduled at the moment.
      </p>
      <p className="text-gray-500 dark:text-gray-400">
        Please check back later or contact your teacher for more information.
      </p>
    </div>
  );
};

export default EmptyState;

export default function ScrollableArea({ children, className = '', hideTrack = false }) {
  return (
    <div className={`overflow-y-auto ${className}`}
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(148,163,184,0.4) transparent',
      }}
    >
      <style>{`
        .scrollable-area-custom::-webkit-scrollbar { width: 5px; }
        .scrollable-area-custom::-webkit-scrollbar-track { background: transparent; }
        .scrollable-area-custom::-webkit-scrollbar-thumb {
          background: rgba(148,163,184,0.4);
          border-radius: 999px;
        }
        .scrollable-area-custom::-webkit-scrollbar-thumb:hover {
          background: rgba(148,163,184,0.6);
        }
        .dark .scrollable-area-custom::-webkit-scrollbar-thumb {
          background: rgba(100,116,139,0.5);
        }
        .dark .scrollable-area-custom::-webkit-scrollbar-thumb:hover {
          background: rgba(100,116,139,0.7);
        }
        ${hideTrack ? `.scrollable-area-custom::-webkit-scrollbar { width: 0; }
        .scrollable-area-custom:hover::-webkit-scrollbar { width: 5px; }` : ''}
      `}</style>
      <div className="scrollable-area-custom h-full">
        {children}
      </div>
    </div>
  );
}

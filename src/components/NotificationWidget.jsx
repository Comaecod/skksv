import { useNotifications } from '../context/NotificationContext';
import { useSankara } from '../context/SankaraContext';
import FloatingWidget from './FloatingWidget';

const BellIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const EyeOffIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

function formatRelativeTime(date) {
  const now = new Date();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function NotificationWidget({ isOpen, onToggle }) {
  const { isNotificationVisible } = useSankara();
  const {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAsUnread,
    clearNotification,
    clearAll,
    isRead,
  } = useNotifications();

  const content = (
    <div className="min-h-[200px]">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent)' }} />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--overlay)' }}>
            <BellIcon />
          </div>
          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>No notifications</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>You're all caught up!</p>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
          {notifications.map((n) => {
            const createdDate = n.createdAt?.toDate?.() || new Date(n.createdAt);
            const read = isRead(n.id);

            return (
              <div key={n.id} className="px-5 py-4 transition-all" style={{ background: read ? 'transparent' : 'var(--overlay)' }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {!read && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--accent)' }} />}
                      <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {n.title}
                      </h3>
                    </div>
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {n.message}
                    </p>
                    <p className="text-[10px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
                      {formatRelativeTime(createdDate)}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => read ? markAsUnread(n.id) : markAsRead(n.id)}
                      className="p-1.5 rounded-lg transition-all"
                      style={{ color: 'var(--text-muted)' }}
                      aria-label={read ? 'Mark as unread' : 'Mark as read'}
                      title={read ? 'Mark as unread' : 'Mark as read'}
                    >
                      {read ? <EyeOffIcon /> : <CheckIcon />}
                    </button>
                    <button
                      onClick={() => clearNotification(n.id)}
                      className="p-1.5 rounded-lg transition-all"
                      style={{ color: 'var(--text-muted)' }}
                      aria-label="Clear notification"
                      title="Clear"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const footer = notifications.length > 0 ? (
    <div className="px-5 py-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
      <button
        onClick={clearAll}
        className="w-full py-2 rounded-lg text-sm font-medium transition-all"
        style={{ color: 'var(--text-muted)' }}
      >
        Clear all notifications
      </button>
    </div>
  ) : null;

  return (
    <FloatingWidget
      position="right"
      buttonIcon={<BellIcon />}
      buttonLabel={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
      badge={unreadCount}
      badgeColor="bg-red-500"
      headerIcon={<BellIcon />}
      title="Notifications"
      subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
      isOpen={isOpen}
      onToggle={onToggle}
      visible={isNotificationVisible}
      footer={footer}
      buttonColor="linear-gradient(135deg, #f59e0b, #ef4444)"
    >
      {content}
    </FloatingWidget>
  );
}

export default NotificationWidget;

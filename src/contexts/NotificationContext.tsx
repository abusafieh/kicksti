import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

interface Notification {
  id: string;
  type: 'warning' | 'success' | 'info';
  message: string;
  autoDismiss: boolean;
}

interface NotificationContextValue {
  notify: (type: Notification['type'], message: string, autoDismiss?: boolean) => void;
  dismiss: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<(Notification & { visible: boolean })[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, visible: false } : n));
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 300);
    const timer = timersRef.current.get(id);
    if (timer) { clearTimeout(timer); timersRef.current.delete(id); }
  }, []);

  const notify = useCallback((type: Notification['type'], message: string, autoDismiss = true) => {
    const id = crypto.randomUUID();
    setNotifications(prev => [...prev, { id, type, message, autoDismiss, visible: false }]);
    requestAnimationFrame(() => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, visible: true } : n));
    });
    if (autoDismiss) {
      const timer = setTimeout(() => dismiss(id), 5000);
      timersRef.current.set(id, timer);
    }
  }, [dismiss]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach(t => clearTimeout(t));
    };
  }, []);

  const icons = {
    warning: <AlertCircle className="w-4 h-4 shrink-0" />,
    success: <CheckCircle className="w-4 h-4 shrink-0" />,
    info: <Info className="w-4 h-4 shrink-0" />,
  };

  const styles = {
    warning: 'bg-[#92400e]/90 border-amber-600 text-amber-100',
    success: 'bg-accent/20 border-green-500/50 text-green-200',
    info: 'bg-navy-800/90 border-gray-600 text-gray-200',
  };

  return (
    <NotificationContext.Provider value={{ notify, dismiss }}>
      {children}
      <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 w-full max-w-sm px-4 pointer-events-none">
        {notifications.map(n => (
          <div
            key={n.id}
            className={`w-full pointer-events-auto border rounded-lg px-4 py-3 flex items-start gap-3 shadow-lg transition-all duration-300 ${styles[n.type]} ${
              n.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'
            }`}
          >
            {icons[n.type]}
            <p className="text-sm flex-1 leading-snug">{n.message}</p>
            <button onClick={() => dismiss(n.id)} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

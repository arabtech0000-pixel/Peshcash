import React from 'react';
import {
  X,
  Bell,
  Check,
  ShieldCheck,
  Coins,
  Users,
  ArrowDownToLine,
  Megaphone,
  Clock
} from 'lucide-react';
import { motion } from 'motion/react';
import { NotificationItem } from '../types.ts';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead
}) => {
  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'activation':
        return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      case 'payment':
      case 'task_reward':
        return <Coins className="w-4 h-4 text-amber-500" />;
      case 'referral_reward':
        return <Users className="w-4 h-4 text-blue-600" />;
      case 'withdrawal':
        return <ArrowDownToLine className="w-4 h-4 text-indigo-600" />;
      default:
        return <Megaphone className="w-4 h-4 text-purple-600" />;
    }
  };

  const formatTime = (iso: string) => {
    try {
      const date = new Date(iso);
      return date.toLocaleDateString('en-UG', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return iso;
    }
  };

  return (
    <div
      id="notifications-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-sm overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden border border-slate-100 relative my-auto flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Notifications</h3>
              <span className="text-[11px] text-slate-500">
                {(notifications || []).filter((n) => !n.isRead).length} unread updates
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onMarkAllRead}
              className="px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-slate-200/70 flex items-center justify-center text-slate-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
          {(!notifications || notifications.length === 0) ? (
            <div className="text-center py-12 text-slate-400">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No notifications yet</p>
            </div>
          ) : (
            (notifications || []).map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  item.isRead
                    ? 'bg-white border-slate-100 text-slate-700'
                    : 'bg-blue-50/50 border-blue-200/80 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white shadow-xs border border-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    {getIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4
                        className={`text-xs truncate ${
                          item.isRead ? 'font-bold text-slate-900' : 'font-extrabold text-blue-900'
                        }`}
                      >
                        {item.title}
                      </h4>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      {item.message}
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {formatTime(item.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
};

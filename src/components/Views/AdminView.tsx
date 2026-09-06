import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  Coins,
  ArrowDownToLine,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Edit2,
  Trash2,
  FileText,
  AlertCircle,
  RefreshCw,
  Search,
  Check,
  Pause,
  Play,
  Wrench,
  Radio,
  Save,
  MessageSquare,
  AlertTriangle,
  Server,
  Zap
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { AdminMetrics, User, Task, WithdrawalRequest, AuditLogItem, SystemSettings } from '../../types.ts';
import { UgxCurrencyBadge, MTNMoMoAppIcon, AirtelMoneyAppIcon } from '../BrandAssets.tsx';

interface AdminViewProps {
  onBackToApp: () => void;
  onSettingsUpdated?: (settings: SystemSettings) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ onBackToApp, onSettingsUpdated }) => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [maintenanceModeDraft, setMaintenanceModeDraft] = useState(false);
  const [maintenanceMessageDraft, setMaintenanceMessageDraft] = useState('');
  const [estimatedEndTimeDraft, setEstimatedEndTimeDraft] = useState('');
  const [allowAdminAccessDraft, setAllowAdminAccessDraft] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  const [activeTab, setActiveTab] = useState<'metrics' | 'users' | 'tasks' | 'withdrawals' | 'payments' | 'audit' | 'system'>('metrics');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Balance adjust modal
  const [adjustingUser, setAdjustingUser] = useState<User | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [adjustType, setAdjustType] = useState<'availableBalance' | 'dailyEarningsBalance' | 'referralEarningsBalance'>('availableBalance');
  const [adjustReason, setAdjustReason] = useState('');

  // Create task modal
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<'video' | 'ad' | 'survey' | 'special'>('video');
  const [newTaskReward, setNewTaskReward] = useState(1000);
  const [newTaskTime, setNewTaskTime] = useState(30);
  const [newTaskDailyLimit, setNewTaskDailyLimit] = useState(3);
  const [newTaskRequirements, setNewTaskRequirements] = useState('');

  const loadData = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const [met, uList, wList, pList, aList, tList, sysRes] = await Promise.all([
        api.getAdminMetrics(),
        api.getAdminUsers(),
        api.getAdminWithdrawals(),
        api.getAdminPayments(),
        api.getAdminAuditLogs(),
        api.getTasks(),
        api.getAdminSystemSettings()
      ]);

      setMetrics(met?.metrics || {
        totalUsers: met?.analytics?.registeredUsers || 0,
        activeUsers: met?.analytics?.activeUsers || 0,
        pendingUsers: met?.analytics?.pendingActivations || 0,
        totalRevenueUgx: met?.analytics?.totalActivationFeesUgx || 0,
        totalPayoutsUgx: met?.analytics?.completedWithdrawalsUgx || 0,
        pendingWithdrawalsCount: (wList?.withdrawals || []).filter((w: any) => w.status === 'pending').length
      });
      setUsers(uList?.users || []);
      setWithdrawals(wList?.withdrawals || []);
      setPayments(pList?.payments || []);
      setAuditLogs(aList?.auditLogs || aList?.logs || []);
      setTasks(tList?.tasks || []);

      if (sysRes?.settings) {
        setSystemSettings(sysRes.settings);
        setMaintenanceModeDraft(Boolean(sysRes.settings.maintenanceMode));
        setMaintenanceMessageDraft(sysRes.settings.maintenanceMessage || '');
        setEstimatedEndTimeDraft(sysRes.settings.estimatedEndTime || '');
        setAllowAdminAccessDraft(sysRes.settings.allowAdminAccess ?? true);
        if (onSettingsUpdated) {
          onSettingsUpdated(sysRes.settings);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMaintenance = async (enable: boolean) => {
    setSavingSettings(true);
    setErrorMessage('');
    try {
      const res = await api.updateAdminSystemSettings({
        maintenanceMode: enable,
        maintenanceMessage: maintenanceMessageDraft || 'Pesa Cash is undergoing scheduled system optimization to improve instant payment processing. We will be back online shortly.',
        estimatedEndTime: estimatedEndTimeDraft,
        allowAdminAccess: allowAdminAccessDraft
      });
      if (res?.settings) {
        setSystemSettings(res.settings);
        setMaintenanceModeDraft(res.settings.maintenanceMode);
        setMessage(`Maintenance mode ${res.settings.maintenanceMode ? 'ACTIVATED (Public Access Blocked)' : 'DEACTIVATED (System Online)'}.`);
        if (onSettingsUpdated) {
          onSettingsUpdated(res.settings);
        }
      }
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to toggle maintenance mode');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveSystemSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setErrorMessage('');
    try {
      const res = await api.updateAdminSystemSettings({
        maintenanceMode: maintenanceModeDraft,
        maintenanceMessage: maintenanceMessageDraft,
        estimatedEndTime: estimatedEndTimeDraft,
        allowAdminAccess: allowAdminAccessDraft
      });
      if (res?.settings) {
        setSystemSettings(res.settings);
        setMessage('System maintenance settings and announcement saved successfully.');
        if (onSettingsUpdated) {
          onSettingsUpdated(res.settings);
        }
      }
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save system settings');
    } finally {
      setSavingSettings(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'pending_activation' : 'active';
    try {
      await api.adminUpdateUserStatus(userId, nextStatus);
      setMessage(`User status updated to ${nextStatus}`);
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleBalanceAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingUser || !adjustReason) return;
    try {
      await api.adminAdjustBalance({
        userId: adjustingUser.id,
        balanceType: adjustType,
        deltaAmount: Number(adjustAmount),
        reason: adjustReason
      });
      setMessage('Balance adjustment logged to immutable audit ledger.');
      setAdjustingUser(null);
      setAdjustReason('');
      setAdjustAmount(0);
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleProcessWithdrawal = async (withdrawalId: string, status: 'completed' | 'rejected', reason?: string) => {
    try {
      await api.adminProcessWithdrawal({
        withdrawalId,
        status,
        rejectionReason: reason
      });
      setMessage(`Withdrawal marked as ${status}`);
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.adminCreateTask({
        title: newTaskTitle,
        description: newTaskDesc,
        category: newTaskCategory,
        rewardUgx: Number(newTaskReward),
        timeEstimateSeconds: Number(newTaskTime),
        dailyLimit: Number(newTaskDailyLimit),
        requirements: newTaskRequirements || 'Complete full duration'
      });
      setShowCreateTask(false);
      setMessage('New task created successfully');
      setNewTaskTitle('');
      setNewTaskDesc('');
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleToggleTaskActive = async (taskId: string, currentActive: boolean) => {
    try {
      await api.adminUpdateTask(taskId, { isActive: !currentActive });
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  return (
    <div className="p-4 sm:p-6 pb-28 space-y-4">
      {/* Top Admin Banner */}
      <div className="bg-slate-900 rounded-[28px] p-5 text-white flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/30">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-white">
              Super Admin Control Console
            </h2>
            <p className="text-xs text-slate-400">
              Authority ledger, user governance, task management & carrier disbursements
            </p>
          </div>
        </div>

        <button
          onClick={onBackToApp}
          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
        >
          Exit Admin
        </button>
      </div>

      {/* Global Maintenance Alert Sticky Banner for Admin */}
      {systemSettings?.maintenanceMode && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-500 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0">
              <Wrench className="w-5 h-5 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                  Live Status
                </span>
                <h4 className="font-extrabold text-sm text-amber-900">
                  System Maintenance Mode Is Active
                </h4>
              </div>
              <p className="text-xs text-amber-800 font-medium mt-0.5">
                Public access is blocked for regular users. Only administrators can use the portal.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('system')}
              className="px-3 py-2 rounded-xl bg-white border border-amber-300 text-amber-900 font-bold text-xs hover:bg-amber-50 transition-colors"
            >
              Configure Notice
            </button>
            <button
              onClick={() => handleToggleMaintenance(false)}
              disabled={savingSettings}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs transition-all shadow cursor-pointer disabled:opacity-70 flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Disable & Go Live</span>
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      {message && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="font-bold">×</button>
        </div>
      )}
      {errorMessage && (
        <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="font-bold">×</button>
        </div>
      )}

      {/* Admin Tab Navigation */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'metrics', label: 'Overview Metrics' },
          {
            id: 'system',
            label: systemSettings?.maintenanceMode ? '🚨 Maintenance (ACTIVE)' : '⚙️ Maintenance & System'
          },
          { id: 'users', label: 'Users & Audits' },
          { id: 'tasks', label: 'Task Catalog' },
          { id: 'withdrawals', label: `Withdrawals (${(withdrawals || []).filter(w => w.status === 'pending').length})` },
          { id: 'payments', label: `Deposits (${(payments || []).length})` },
          { id: 'audit', label: 'Audit Trail' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-1.5 px-3.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? tab.id === 'system' && systemSettings?.maintenanceMode
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-blue-700 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ---------------- METRICS TAB ---------------- */}
      {activeTab === 'metrics' && (
        <div className="space-y-4">
          {/* Quick System Status Card */}
          <div className="p-4 rounded-[24px] bg-white border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                systemSettings?.maintenanceMode
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}>
                {systemSettings?.maintenanceMode ? <Wrench className="w-5 h-5" /> : <Server className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">Application Availability Status</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    systemSettings?.maintenanceMode
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-emerald-500/20 text-emerald-700'
                  }`}>
                    {systemSettings?.maintenanceMode ? 'MAINTENANCE MODE' : 'ONLINE & OPERATIONAL'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {systemSettings?.maintenanceMode
                    ? 'Public requests are blocked with custom maintenance notice.'
                    : 'System is running normally. Public registrations and daily task payouts are active.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggleMaintenance(!systemSettings?.maintenanceMode)}
                disabled={savingSettings}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all shadow-xs cursor-pointer ${
                  systemSettings?.maintenanceMode
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                }`}
              >
                {systemSettings?.maintenanceMode ? 'Disable Maintenance' : 'Enable Maintenance'}
              </button>
              <button
                onClick={() => setActiveTab('system')}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Manage Settings
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-[24px] p-4 border border-slate-100 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 block">Total Registered</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {metrics?.totalUsers || 0}
              </span>
              <span className="text-[10px] text-emerald-600 font-bold mt-1 block">
                {metrics?.activeUsers || 0} Active (Paid)
              </span>
            </div>

            <div className="bg-white rounded-[24px] p-4 border border-slate-100 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 block">Activation Revenue</span>
              <div className="text-xl font-black text-blue-900 mt-1">
                <UgxCurrencyBadge amount={metrics?.totalRevenueUgx || 0} />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">From confirmed webhooks</span>
            </div>

            <div className="bg-white rounded-[24px] p-4 border border-slate-100 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 block">Total Disbursed</span>
              <div className="text-xl font-black text-emerald-800 mt-1">
                <UgxCurrencyBadge amount={metrics?.totalPayoutsUgx || 0} />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Processed payouts</span>
            </div>

            <div className="bg-white rounded-[24px] p-4 border border-slate-100 shadow-xs">
              <span className="text-[11px] font-semibold text-amber-600 block">Pending Withdrawals</span>
              <span className="text-2xl font-black text-amber-700 mt-1 block">
                {metrics?.pendingWithdrawalsCount || 0}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">Requires admin action</span>
            </div>

            <div className="bg-white rounded-[24px] p-4 border border-slate-100 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 block">Awaiting Activation</span>
              <span className="text-2xl font-black text-slate-700 mt-1 block">
                {metrics?.pendingUsers || 0}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">Unpaid SIM registrations</span>
            </div>

            <div className="bg-white rounded-[24px] p-4 border border-slate-100 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 block">Available Tasks</span>
              <span className="text-2xl font-black text-indigo-700 mt-1 block">
                {(tasks || []).length}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">Active sponsor campaigns</span>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- USERS TAB ---------------- */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-[28px] p-4 border border-slate-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900">User Accounts Directory</h3>
            <span className="text-xs text-slate-400">{(users || []).length} members</span>
          </div>

          <div className="space-y-2.5">
            {(users || []).map((u) => (
              <div
                key={u.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{u.fullName}</span>
                    <span className="text-[11px] text-slate-500">@{u.username}</span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        u.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {u.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {u.phone} • {u.email} • Code: {u.referralCode}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setAdjustingUser(u)}
                    className="py-1 px-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors"
                  >
                    Adjust Balance
                  </button>
                  <button
                    onClick={() => handleToggleUserStatus(u.id, u.status)}
                    className="py-1 px-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors"
                  >
                    {u.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- TASKS TAB ---------------- */}
      {activeTab === 'tasks' && (
        <div className="bg-white rounded-[28px] p-4 border border-slate-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900">Task Catalog Management</h3>
            <button
              onClick={() => setShowCreateTask(true)}
              className="py-1.5 px-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Task</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {(!tasks || tasks.length === 0) ? (
              <p className="text-xs text-slate-400 py-4 text-center">No tasks configured</p>
            ) : (
              (tasks || []).map((task) => (
              <div
                key={task.id}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{task.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 uppercase font-semibold">
                      {task.category}
                    </span>
                    <span className="text-xs font-black text-blue-800">
                      UGX {Number(task.rewardUgx ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {task.timeEstimateSeconds}s Est • Limit {task.dailyLimit}/day
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleToggleTaskActive(task.id, task.isActive)}
                    className={`py-1 px-2.5 rounded-xl text-xs font-bold transition-colors ${
                      task.isActive
                        ? 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    {task.isActive ? 'Pause' : 'Resume'}
                  </button>
                </div>
              </div>
            ))) }
          </div>
        </div>
      )}

      {/* ---------------- WITHDRAWALS TAB ---------------- */}
      {activeTab === 'withdrawals' && (
        <div className="bg-white rounded-[28px] p-4 border border-slate-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900">Withdrawals Queue</h3>
            <span className="text-xs text-slate-400">{(withdrawals || []).length} total</span>
          </div>

          <div className="space-y-2.5">
            {(!withdrawals || withdrawals.length === 0) ? (
              <p className="text-xs text-slate-400 py-4 text-center">No withdrawal requests</p>
            ) : (
              (withdrawals || []).map((w) => (
                <div
                  key={w.id}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    {w.provider === 'MTN_MOMO' ? (
                      <MTNMoMoAppIcon className="w-7 h-7" />
                    ) : (
                      <AirtelMoneyAppIcon className="w-7 h-7" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">
                          UGX {Number(w.amountUgx ?? 0).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          ({w.mobileNumber})
                        </span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            w.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : w.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {w.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Net: UGX {Number(w.netAmountUgx ?? 0).toLocaleString()} • Fee: UGX {Number(w.feeUgx ?? 0).toLocaleString()} • Ref: {w.referenceId}
                      </div>
                    </div>
                  </div>

                  {w.status === 'pending' && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleProcessWithdrawal(w.id, 'completed')}
                        className="py-1 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                      >
                        Approve & Pay
                      </button>
                      <button
                        onClick={() => handleProcessWithdrawal(w.id, 'rejected', 'Verification failed')}
                        className="py-1 px-2 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ---------------- PAYMENTS TAB ---------------- */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-[28px] p-4 border border-slate-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900">Activation Deposits</h3>
            <span className="text-xs text-slate-400">{(payments || []).length} deposits</span>
          </div>

          <div className="space-y-2.5">
            {(!payments || payments.length === 0) ? (
              <p className="text-xs text-slate-400 py-4 text-center">No deposit records</p>
            ) : (
              (payments || []).map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center">
                      <ArrowDownToLine className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">
                          UGX {Number(p.amountUgx ?? 0).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {p.userName} ({p.userPhone})
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Ref: {p.transactionId} • {new Date(p.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {p.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}



      {/* ---------------- AUDIT LOG TAB ---------------- */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-[28px] p-4 border border-slate-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900">Immutable Audit Ledger</h3>
            <span className="text-xs text-slate-400">{(auditLogs || []).length} audit events</span>
          </div>

          <div className="space-y-2">
            {(!auditLogs || auditLogs.length === 0) ? (
              <p className="text-xs text-slate-400 py-4 text-center">No audit events recorded</p>
            ) : (
              (auditLogs || []).map((log: any) => (
              <div key={log.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-slate-900">{log.action}</span>
                    <p className="text-slate-600 mt-0.5">{log.reason || log.notes || 'System action'}</p>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(log.timestamp || log.createdAt || Date.now()).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">
                  Actor: {log.adminActorId || log.adminName || log.adminId || 'Admin'} • Target: {log.targetUserName || log.targetUserId || 'All'}
                </div>
              </div>
            ))) }
          </div>
        </div>
      )}

      {/* ---------------- SYSTEM & MAINTENANCE TAB ---------------- */}
      {activeTab === 'system' && (
        <div className="space-y-4">
          {/* Main Toggle Card */}
          <div className="bg-white rounded-[28px] p-5 sm:p-6 border border-slate-100 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-start gap-3.5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                  systemSettings?.maintenanceMode
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-emerald-500/15 text-emerald-700'
                }`}>
                  <Wrench className={`w-6 h-6 ${systemSettings?.maintenanceMode ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base text-slate-900">
                      System Maintenance Mode Switch
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      systemSettings?.maintenanceMode
                        ? 'bg-amber-500 text-slate-950 animate-pulse'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {systemSettings?.maintenanceMode ? 'ACTIVE (PUBLIC BLOCKED)' : 'INACTIVE (ONLINE)'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    When active, public users are redirected to the Maintenance Screen. All registrations, payments, task rewards, and withdrawals are safely paused.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="admin-toggle-maintenance-master-btn"
                  onClick={() => handleToggleMaintenance(!systemSettings?.maintenanceMode)}
                  disabled={savingSettings}
                  className={`py-3 px-5 rounded-2xl font-black text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-70 ${
                    systemSettings?.maintenanceMode
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  <span>
                    {savingSettings
                      ? 'Updating State...'
                      : systemSettings?.maintenanceMode
                      ? 'Turn OFF Maintenance (Go Live)'
                      : 'Turn ON Maintenance (Block Public)'}
                  </span>
                </button>
              </div>
            </div>

            {/* Quick Status Notice */}
            <div className={`p-3.5 rounded-2xl text-xs flex items-center gap-2.5 ${
              systemSettings?.maintenanceMode
                ? 'bg-amber-50 border border-amber-200 text-amber-900'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-900'
            }`}>
              <AlertTriangle className={`w-4 h-4 shrink-0 ${systemSettings?.maintenanceMode ? 'text-amber-600' : 'text-emerald-600'}`} />
              <span className="font-medium">
                {systemSettings?.maintenanceMode
                  ? 'Maintenance mode is currently ON. All non-admin requests will receive 503 Service Unavailable with the notice below.'
                  : 'System is running live. All users can access their dashboard, complete tasks, deposit activation fees, and request withdrawals normally.'}
              </span>
            </div>
          </div>

          {/* Configuration Form */}
          <div className="bg-white rounded-[28px] p-5 sm:p-6 border border-slate-100 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">
                  Announcement & Downtime Notice Settings
                </h4>
                <p className="text-xs text-slate-500">
                  Customize the public message, estimated completion time, and access rules
                </p>
              </div>
              <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                Live Broadcast
              </span>
            </div>

            <form onSubmit={handleSaveSystemSettings} className="space-y-4">
              {/* Presets */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Quick Message Presets
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    {
                      label: 'Telecom MoMo Gateway Upgrade',
                      msg: 'Pesa Cash is undergoing scheduled telecom gateway optimization (MTN MoMo & Airtel Money) to improve instant payout processing speed. All funds and balances remain 100% secure.',
                      eta: '30 Minutes'
                    },
                    {
                      label: 'Database & Ledger Maintenance',
                      msg: 'We are performing routine scheduled database indexing and ledger reconciliation to ensure seamless daily task reward disbursements.',
                      eta: '45 Minutes'
                    },
                    {
                      label: 'Emergency Security Infrastructure Patch',
                      msg: 'Our engineering team is applying routine system security enhancements. The platform will resume normal operations shortly.',
                      eta: '1 Hour'
                    }
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setMaintenanceMessageDraft(preset.msg);
                        setEstimatedEndTimeDraft(preset.eta);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors"
                    >
                      + {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Public Maintenance Announcement Message
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {maintenanceMessageDraft.length} chars
                  </span>
                </div>
                <textarea
                  rows={3}
                  required
                  value={maintenanceMessageDraft}
                  onChange={(e) => setMaintenanceMessageDraft(e.target.value)}
                  placeholder="Explain the upgrade or reason for maintenance to your users..."
                  className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-blue-500 transition-all font-medium leading-relaxed"
                />
              </div>

              {/* ETA / Estimated Return Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Estimated Completion Time / ETA (Optional)
                  </label>
                  <input
                    type="text"
                    value={estimatedEndTimeDraft}
                    onChange={(e) => setEstimatedEndTimeDraft(e.target.value)}
                    placeholder="e.g. 16:30 EAT or 30 minutes"
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-blue-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Displayed prominently in the countdown card on the screen.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Admin Bypass Policy
                  </label>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Allow Admin Login</span>
                      <span className="text-[10px] text-slate-500">Admins can log in and access console</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={allowAdminAccessDraft}
                      onChange={(e) => setAllowAdminAccessDraft(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="py-3 px-6 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-70"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingSettings ? 'Saving...' : 'Save & Publish Announcement'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Live Preview Simulator */}
          <div className="bg-slate-950 rounded-[28px] p-5 sm:p-6 text-white border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <h4 className="font-extrabold text-sm text-white">
                  Live Public Screen Simulator
                </h4>
              </div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md bg-white/10 text-slate-300">
                User Experience Preview
              </span>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-3 max-w-md mx-auto">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <Wrench className="w-6 h-6" />
              </div>
              <h5 className="font-black text-base text-white">
                Scheduled System Maintenance
              </h5>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-left text-xs space-y-1">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                  Announcement
                </span>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {maintenanceMessageDraft || 'Pesa Cash is undergoing scheduled system optimization to improve instant payment processing. We will be back online shortly.'}
                </p>
              </div>
              {estimatedEndTimeDraft && (
                <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-center justify-between text-xs text-left">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-blue-200 font-bold text-[11px]">ETA / Downtime</span>
                  </div>
                  <span className="text-white font-extrabold text-xs">{estimatedEndTimeDraft}</span>
                </div>
              )}
              <div className="p-2 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-emerald-300 text-[11px] font-medium text-left flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>All user balances and pending task records are 100% secure.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- BALANCE ADJUSTMENT MODAL ---------------- */}
      {adjustingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">
              Audit Adjust: {adjustingUser.fullName}
            </h3>

            <form onSubmit={handleBalanceAdjust} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Target Balance</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                >
                  <option value="availableBalance">Available Balance</option>
                  <option value="dailyEarningsBalance">Daily Task Wallet</option>
                  <option value="referralEarningsBalance">Referral Wallet</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Delta (UGX, e.g. 5000 or -2000)</label>
                <input
                  type="number"
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Audit Justification</label>
                <textarea
                  required
                  rows={2}
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Required audit log explanation..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustingUser(null)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold"
                >
                  Commit Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- CREATE TASK MODAL ---------------- */}
      {showCreateTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-extrabold text-base text-slate-900">Create New Task Campaign</h3>
            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Watch Brand Spotlight Video"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Category</label>
                <select
                  value={newTaskCategory}
                  onChange={(e) => setNewTaskCategory(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                >
                  <option value="video">Video</option>
                  <option value="ad">Ad Banner</option>
                  <option value="survey">Survey</option>
                  <option value="special">Special / Quiz</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Reward (UGX)</label>
                <input
                  type="number"
                  required
                  value={newTaskReward}
                  onChange={(e) => setNewTaskReward(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Time Estimate (Seconds)</label>
                <input
                  type="number"
                  required
                  value={newTaskTime}
                  onChange={(e) => setNewTaskTime(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Daily Cap</label>
                <input
                  type="number"
                  required
                  value={newTaskDailyLimit}
                  onChange={(e) => setNewTaskDailyLimit(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateTask(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

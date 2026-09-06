// Pesa Cash API Client

const TOKEN_KEY = 'pesa_cash_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(endpoint, {
    ...options,
    headers
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || 'An error occurred with the request');
  }
  return data;
}

export const api = {
  // Auth
  register: (body: any) => request<any>('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: any) => request<any>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  firebaseLogin: (body: { uid: string; email: string; displayName?: string; photoUrl?: string; phone?: string; referralCode?: string }) =>
    request<any>('/api/auth/firebase-login', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => request<any>('/api/auth/logout', { method: 'POST' }),
  me: () => request<any>('/api/auth/me'),
  forgotPassword: (identifier: string) => request<any>('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ identifier }) }),
  updateProfile: (body: any) => request<any>('/api/auth/update-profile', { method: 'POST', body: JSON.stringify(body) }),
  changePassword: (body: any) => request<any>('/api/auth/change-password', { method: 'POST', body: JSON.stringify(body) }),


  // Activation
  triggerActivation: (phoneNumber: string) => request<any>('/api/activation/trigger', { method: 'POST', body: JSON.stringify({ phoneNumber }) }),
  checkActivationStatus: () => request<any>('/api/activation/status', { method: 'POST' }),

  // Tasks
  getTasks: () => request<any>('/api/tasks'),
  completeTask: (id: string, proofData?: any) =>
    request<any>(`/api/tasks/${id}/complete`, { method: 'POST', body: JSON.stringify({ proofData }) }),
  playSpin: () => request<any>('/api/tasks/spin/play', { method: 'POST' }),

  // Wallet & Withdrawals
  getWallet: () => request<any>('/api/wallet'),
  requestWithdrawal: (body: { amount: number; provider: string; mobileNumber: string }) =>
    request<any>('/api/withdrawals/request', { method: 'POST', body: JSON.stringify(body) }),

  // Referrals
  getReferrals: () => request<any>('/api/referrals'),
  getReferralStats: () => request<any>('/api/referrals'),
  validateReferralCode: (code: string) => request<{ valid: boolean; referrerUsername?: string; referrerName?: string; message?: string }>(`/api/referrals/validate/${encodeURIComponent(code)}`),

  // System & Maintenance
  getSystemSettings: () => request<{ settings: any }>('/api/system/settings'),
  getAdminSystemSettings: () => request<{ settings: any }>('/api/admin/system/settings'),
  updateAdminSystemSettings: (body: any) =>
    request<{ success: boolean; settings: any }>('/api/admin/system/settings', { method: 'POST', body: JSON.stringify(body) }),

  // History & Notifications
  getHistory: (category?: string) =>
    request<any>(category && category !== 'all' ? `/api/history?category=${category}` : '/api/history'),
  getTransactionHistory: (category?: string) =>
    request<any>(category && category !== 'all' ? `/api/history?category=${category}` : '/api/history'),
  getNotifications: () => request<any>('/api/notifications'),
  markNotificationsRead: () => request<any>('/api/notifications/mark-read', { method: 'POST' }),

  // Admin
  getAdminOverview: () => request<any>('/api/admin/overview'),
  getAdminMetrics: () => request<any>('/api/admin/overview'),
  getAdminUsers: (search?: string, status?: string) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    return request<any>(`/api/admin/users?${params.toString()}`);
  },
  updateUserStatus: (id: string, status: string, notes?: string) =>
    request<any>(`/api/admin/users/${id}/status`, { method: 'POST', body: JSON.stringify({ status, notes }) }),
  adminUpdateUserStatus: (id: string, status: string, notes?: string) =>
    request<any>(`/api/admin/users/${id}/status`, { method: 'POST', body: JSON.stringify({ status, notes }) }),
  getAdminPayments: () => request<any>('/api/admin/payments'),
  getAdminTasks: () => request<any>('/api/admin/tasks'),
  createAdminTask: (body: any) => request<any>('/api/admin/tasks', { method: 'POST', body: JSON.stringify(body) }),
  adminCreateTask: (body: any) => request<any>('/api/admin/tasks', { method: 'POST', body: JSON.stringify(body) }),
  toggleAdminTask: (id: string) => request<any>(`/api/admin/tasks/${id}/toggle`, { method: 'POST' }),
  adminUpdateTask: (id: string, updates: any) => request<any>(`/api/admin/tasks/${id}/toggle`, { method: 'POST' }),
  getAdminWithdrawals: () => request<any>('/api/admin/withdrawals'),
  approveWithdrawal: (id: string, referenceId?: string, notes?: string) =>
    request<any>(`/api/admin/withdrawals/${id}/approve`, { method: 'POST', body: JSON.stringify({ referenceId, notes }) }),
  rejectWithdrawal: (id: string, reason: string) =>
    request<any>(`/api/admin/withdrawals/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
  adminProcessWithdrawal: (body: { withdrawalId: string; status: 'completed' | 'rejected'; rejectionReason?: string }) =>
    body.status === 'completed'
      ? request<any>(`/api/admin/withdrawals/${body.withdrawalId}/approve`, { method: 'POST', body: JSON.stringify({}) })
      : request<any>(`/api/admin/withdrawals/${body.withdrawalId}/reject`, { method: 'POST', body: JSON.stringify({ reason: body.rejectionReason || 'Rejected by admin' }) }),
  adjustBalance: (body: { userId: string; amountDelta: number; category: string; notes: string }) =>
    request<any>('/api/admin/adjust-balance', { method: 'POST', body: JSON.stringify(body) }),
  adminAdjustBalance: (body: { userId: string; balanceType: string; deltaAmount: number; reason: string }) =>
    request<any>('/api/admin/adjust-balance', { method: 'POST', body: JSON.stringify({ userId: body.userId, amountDelta: body.deltaAmount, category: body.balanceType, notes: body.reason }) }),
  getAuditLogs: () => request<any>('/api/admin/audit-logs'),
  getAdminAuditLogs: () => request<any>('/api/admin/audit-logs')
};

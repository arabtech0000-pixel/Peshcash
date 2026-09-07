// Pesa Cash API Client
import {
  registerDirectFirebase,
  loginDirectFirebase,
  validateDirectReferralCode
} from './firebase.ts';

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

  let res: Response;
  try {
    res = await fetch(endpoint, {
      ...options,
      headers
    });
  } catch (netErr: any) {
    const err = new Error(netErr?.message || 'Network connection error. Please check your internet connection.');
    (err as any).isNetworkError = true;
    throw err;
  }

  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    // Non-JSON response (e.g. HTML 404 from static host/Vercel or gateway 502/503)
    const isHtml = text.trim().startsWith('<') || text.includes('<!DOCTYPE') || text.includes('The page could not be found');
    const message = isHtml
      ? (res.status === 404 ? 'Service endpoint not found on server (404)' : `Server returned HTML status ${res.status}`)
      : (text.slice(0, 150) || `Server error (${res.status})`);
    
    const err = new Error(message);
    (err as any).status = res.status;
    (err as any).isHtmlResponse = true;
    (err as any).rawText = text;
    throw err;
  }

  if (!res.ok) {
    const err = new Error(data?.message || data?.error || `Request failed with status ${res.status}`);
    (err as any).status = res.status;
    (err as any).data = data;
    throw err;
  }
  return data;
}

export const api = {
  // Auth
  register: async (body: any) => {
    try {
      return await request<any>('/api/auth/register', { method: 'POST', body: JSON.stringify(body) });
    } catch (err: any) {
      // If endpoint returned 404 / HTML (e.g. on static Vercel host without backend API), fallback to direct Firebase registration
      if (err.isHtmlResponse || err.status === 404 || err.isNetworkError) {
        console.warn('Backend API endpoint unavailable, falling back to direct Firebase registration...');
        return await registerDirectFirebase({
          fullName: body.fullName || body.username,
          username: body.username,
          phone: body.phone,
          email: body.email,
          password: body.password,
          referralCode: body.referralCode
        });
      }
      throw err;
    }
  },

  login: async (body: any) => {
    try {
      return await request<any>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) });
    } catch (err: any) {
      if (err.isHtmlResponse || err.status === 404 || err.isNetworkError) {
        console.warn('Backend API endpoint unavailable, falling back to direct Firebase login...');
        return await loginDirectFirebase(body.identifier, body.password);
      }
      throw err;
    }
  },

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
  validateReferralCode: async (code: string) => {
    try {
      return await request<{ valid: boolean; referrerUsername?: string; referrerName?: string; message?: string }>(`/api/referrals/validate/${encodeURIComponent(code)}`);
    } catch (err: any) {
      if (err.isHtmlResponse || err.status === 404 || err.isNetworkError) {
        return await validateDirectReferralCode(code);
      }
      throw err;
    }
  },

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

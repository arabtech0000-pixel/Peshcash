// Shared Types for Pesa Cash

export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'pending_activation';
export type PaymentProvider = 'MTN_MOMO' | 'AIRTEL_MONEY';

export interface User {
  id: string;
  fullName: string;
  username: string;
  phone: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  referralCode: string;
  referredBy?: string;
  withdrawalPhone?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Wallet {
  userId: string;
  availableBalance: number; // UGX
  dailyEarningsBalance: number; // UGX
  referralEarningsBalance: number; // UGX
  bonusBalance?: number; // UGX (Welcome bonus)
  pendingWithdrawalsBalance: number; // UGX
  totalEarnings: number; // UGX
  updatedAt: string;
}

export type TaskCategory = 'video' | 'ad' | 'spin' | 'survey' | 'special';

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  rewardUgx: number;
  timeEstimateSeconds: number;
  requirements: string;
  dailyLimit: number;
  remainingToday: number;
  isActive: boolean;
  iconType: string;
  mediaUrl?: string;
  surveyQuestions?: Array<{
    question: string;
    options: string[];
  }>;
  createdAt: string;
}

export interface TaskCompletion {
  id: string;
  taskId: string;
  taskTitle: string;
  userId: string;
  rewardUgx: number;
  completedAt: string;
  category: TaskCategory;
}

export interface ReferralRecord {
  id: string;
  referrerId: string;
  refereeId: string;
  referredUserId?: string;
  refereeName: string;
  refereeUsername: string;
  refereePhone?: string;
  rewardAmount?: number;
  commissionAmountUgx: number;
  qualifyingStatus: 'pending_activation' | 'qualified' | 'disqualified' | 'COMPLETED';
  status?: 'COMPLETED' | 'pending_activation' | 'qualified' | 'disqualified' | string;
  timestamp?: string;
  creditedAt?: string;
  createdAt: string;
}

export type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'rejected';

export interface Withdrawal {
  id: string;
  userId: string;
  userName: string;
  amountUgx: number;
  feeUgx: number;
  netAmountUgx: number;
  provider: PaymentProvider;
  mobileNumber: string;
  status: WithdrawalStatus;
  rejectionReason?: string;
  referenceId: string;
  createdAt: string;
  processedAt?: string;
}

export type NotificationType =
  | 'activation'
  | 'payment'
  | 'task_reward'
  | 'referral_reward'
  | 'withdrawal'
  | 'announcement'
  | 'bonus';

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  linkTo?: string;
}

export interface TransactionHistoryItem {
  id: string;
  userId: string;
  category: 'daily_earnings' | 'referral_earnings' | 'deposits' | 'withdrawals' | 'activation_fee' | 'bonus';
  type: 'credit' | 'debit';
  amountUgx: number;
  title: string;
  description: string;
  status: 'confirmed' | 'pending' | 'failed';
  transactionId: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  targetUserId: string;
  targetUserName: string;
  action: string;
  amountDelta?: number;
  notes: string;
  createdAt: string;
}

export type AuditLogItem = AuditLog;
export type WithdrawalRequest = Withdrawal;

export interface ReferralStats {
  totalInvites: number;
  totalReferrals?: number;
  activeInvites: number;
  activeCount?: number;
  qualifiedCount?: number;
  pendingInvites: number;
  pendingCount?: number;
  totalEarningsUgx: number;
  totalReferralEarnings?: number;
  amountCollected?: number;
  referralsList: Array<{
    id: string;
    referredUserId?: string;
    username: string;
    fullName?: string;
    joinDate: string;
    timestamp?: string;
    status: string;
    rewardAmount?: number;
    rewardEarned: number;
  }>;
}

export interface AdminAnalytics {
  registeredUsers: number;
  activeUsers: number;
  pendingActivations: number;
  suspendedUsers: number;
  totalActivationFeesUgx: number;
  totalTaskPayoutsUgx: number;
  totalReferralPayoutsUgx: number;
  pendingWithdrawalsUgx: number;
  completedWithdrawalsUgx: number;
}

export interface AdminMetrics {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  totalRevenueUgx: number;
  totalPayoutsUgx: number;
  pendingWithdrawalsCount: number;
}

export interface SystemSettings {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  estimatedEndTime?: string;
  allowAdminAccess: boolean;
  updatedAt: string;
  updatedBy?: string;
}

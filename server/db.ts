import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  User,
  Wallet,
  Task,
  TaskCompletion,
  ReferralRecord,
  Withdrawal,
  NotificationItem,
  TransactionHistoryItem,
  AuditLog,
  AdminAnalytics,
  SystemSettings
} from '../src/types.ts';

const IS_SERVERLESS = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const BASE_DATA_DIR = path.join(process.cwd(), 'data');
const BASE_DB_FILE = path.join(BASE_DATA_DIR, 'db.json');

const RUNTIME_DATA_DIR = IS_SERVERLESS ? path.join('/tmp', 'pesa_data') : BASE_DATA_DIR;
const RUNTIME_DB_FILE = IS_SERVERLESS ? path.join(RUNTIME_DATA_DIR, 'db.json') : BASE_DB_FILE;

export interface DatabaseSchema {
  users: (User & { passwordHash: string; salt: string })[];
  wallets: Record<string, Wallet>;
  tasks: Task[];
  taskCompletions: TaskCompletion[];
  referrals: ReferralRecord[];
  withdrawals: Withdrawal[];
  notifications: NotificationItem[];
  transactions: TransactionHistoryItem[];
  auditLogs: AuditLog[];
  sessions: Record<string, string>; // token -> userId
  systemSettings: SystemSettings;
}

// Password hashing utility
export function hashPassword(password: string, salt?: string) {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, generatedSalt, 1000, 32, 'sha256').toString('hex');
  return { hash, salt: generatedSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const checkHash = crypto.pbkdf2Sync(password, salt, 1000, 32, 'sha256').toString('hex');
  return checkHash === hash;
}

let db: DatabaseSchema;

function ensureDataDir() {
  if (!fs.existsSync(RUNTIME_DATA_DIR)) {
    try {
      fs.mkdirSync(RUNTIME_DATA_DIR, { recursive: true });
    } catch (e) {
      console.warn('Could not create RUNTIME_DATA_DIR, using in-memory', e);
    }
  }
}

function loadInitialSeed(): DatabaseSchema {
  const now = new Date().toISOString();

  // Active verified task templates available for users
  const tasks: Task[] = [
    {
      id: 'task_vid_01',
      title: 'Watch & Review MTN MoMo Pay Promo',
      description: 'Watch the full 30-second official MTN Merchant promo video to verify consumer awareness.',
      category: 'video',
      rewardUgx: 1200,
      timeEstimateSeconds: 30,
      requirements: 'Watch continuously without switching tabs. Submit confirmation when timer ends.',
      dailyLimit: 2,
      remainingToday: 2,
      isActive: true,
      iconType: 'PlayCircle',
      mediaUrl: 'https://www.youtube.com/embed/LXb3EKWsInQ?autoplay=1&mute=1&controls=0',
      createdAt: now
    },
    {
      id: 'task_spin_01',
      title: 'Daily Lucky Wheel of Cash',
      description: 'Spin the verified Pesa Cash reward wheel once every 24 hours. Guaranteed win between UGX 200 to UGX 2,500.',
      category: 'spin',
      rewardUgx: 800,
      timeEstimateSeconds: 10,
      requirements: 'Active accounts only. One spin per day.',
      dailyLimit: 1,
      remainingToday: 1,
      isActive: true,
      iconType: 'RotateCcw',
      createdAt: now
    },
    {
      id: 'task_survey_01',
      title: 'Mobile Banking & Fintech Survey 2026',
      description: 'Complete 3 simple questions about your preferred digital payments in Uganda.',
      category: 'survey',
      rewardUgx: 2500,
      timeEstimateSeconds: 60,
      requirements: 'Answer all 3 market research questions honestly.',
      dailyLimit: 1,
      remainingToday: 1,
      isActive: true,
      iconType: 'FileQuestion',
      surveyQuestions: [
        {
          question: 'Which mobile money network do you use most often in Uganda?',
          options: ['MTN Mobile Money', 'Airtel Money', 'Both equally', 'Commercial Bank Mobile App']
        },
        {
          question: 'How frequently do you pay merchants using cashless QR or MoMo Pay codes?',
          options: ['Daily', 'Weekly', 'A few times a month', 'Rarely or Cash only']
        },
        {
          question: 'What is most important to you in a rewards and agency platform?',
          options: ['Instant withdrawal processing', 'Reliable customer support', 'Highest task earnings', 'Referral commissions']
        }
      ],
      createdAt: now
    },
    {
      id: 'task_ad_01',
      title: 'View Stanbic FlexiPay Partner Showcase',
      description: 'Browse the partner announcement banner for 15 seconds to learn about zero-fee utility bills.',
      category: 'ad',
      rewardUgx: 650,
      timeEstimateSeconds: 15,
      requirements: 'Keep the ad display open for 15 seconds.',
      dailyLimit: 3,
      remainingToday: 3,
      isActive: true,
      iconType: 'Tv',
      createdAt: now
    },
    {
      id: 'task_special_01',
      title: 'Agency Knowledge & Security Quiz',
      description: 'Test your understanding of PIN security and anti-phishing practices for mobile money agents.',
      category: 'special',
      rewardUgx: 3000,
      timeEstimateSeconds: 90,
      requirements: 'Score 100% on the 2-question security hygiene quiz.',
      dailyLimit: 1,
      remainingToday: 1,
      isActive: true,
      iconType: 'ShieldCheck',
      surveyQuestions: [
        {
          question: 'Will Pesa Cash or Mobile Money agents ever ask you for your Secret PIN or OTP?',
          options: ['Never under any circumstance', 'Only during system upgrades', 'Yes if calling from customer care', 'Only via SMS']
        },
        {
          question: 'Where should activation payments be confirmed?',
          options: ['Only through authoritative provider webhooks / system status', 'Sending a forged screenshot', 'Social media DM', 'Unverified SMS']
        }
      ],
      createdAt: now
    }
  ];

  return {
    users: [],
    wallets: {},
    tasks,
    taskCompletions: [],
    referrals: [],
    withdrawals: [],
    notifications: [],
    transactions: [],
    auditLogs: [],
    sessions: {},
    systemSettings: {
      maintenanceMode: false,
      maintenanceMessage: 'Pesa Cash is undergoing scheduled system optimization to improve instant payment processing. We will be back online shortly.',
      estimatedEndTime: '',
      allowAdminAccess: true,
      updatedAt: now,
      updatedBy: 'system'
    }
  };
}

export function initDb() {
  ensureDataDir();
  let loadedFromDisk = false;
  const targetReadFile = fs.existsSync(RUNTIME_DB_FILE) ? RUNTIME_DB_FILE : (fs.existsSync(BASE_DB_FILE) ? BASE_DB_FILE : null);
  if (targetReadFile) {
    try {
      const content = fs.readFileSync(targetReadFile, 'utf-8');
      db = JSON.parse(content);
      loadedFromDisk = true;
    } catch (e) {
      console.warn('Could not parse existing db.json, generating fresh seed.', e);
    }
  }

  if (!loadedFromDisk || !db) {
    db = loadInitialSeed();
  }

  if (!db.systemSettings) {
    db.systemSettings = {
      maintenanceMode: false,
      maintenanceMessage: 'Pesa Cash is undergoing scheduled system optimization to improve instant payment processing. We will be back online shortly.',
      estimatedEndTime: '',
      allowAdminAccess: true,
      updatedAt: new Date().toISOString(),
      updatedBy: 'system'
    };
  }

  // Ensure Admin account exists with requested credentials
  ensureAdminAccount();

  saveDb();
}

function ensureAdminAccount() {
  const adminEmail = 'ashirafashes04@gmail.com';
  const adminPass = 'popular-24';
  const { hash, salt } = hashPassword(adminPass);
  const now = new Date().toISOString();

  let existingAdmin = db.users.find(u => u.email.toLowerCase() === adminEmail.toLowerCase());

  if (existingAdmin) {
    existingAdmin.passwordHash = hash;
    existingAdmin.salt = salt;
    existingAdmin.role = 'admin';
    existingAdmin.status = 'active';
    existingAdmin.phone = '+256773319479';
    existingAdmin.fullName = existingAdmin.fullName || 'Ashiraf (Admin)';
    existingAdmin.username = existingAdmin.username || 'ashiraf';
    existingAdmin.updatedAt = now;
  } else {
    const adminId = 'usr_admin_ashiraf';
    const newAdmin = {
      id: adminId,
      fullName: 'Ashiraf (Admin)',
      username: 'ashiraf',
      phone: '+256773319479',
      email: adminEmail,
      role: 'admin' as const,
      status: 'active' as const,
      referralCode: 'ASHIRAF77',
      passwordHash: hash,
      salt: salt,
      createdAt: now,
      updatedAt: now
    };
    db.users.unshift(newAdmin);

    if (!db.wallets[adminId]) {
      db.wallets[adminId] = {
        userId: adminId,
        availableBalance: 0,
        dailyEarningsBalance: 0,
        referralEarningsBalance: 0,
        bonusBalance: 1000,
        pendingWithdrawalsBalance: 0,
        totalEarnings: 1000,
        updatedAt: now
      };
    }
  }
}

export function saveDb() {
  ensureDataDir();
  try {
    fs.writeFileSync(RUNTIME_DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Could not save to disk, keeping state in-memory:', e);
  }
}

export function getDb(): DatabaseSchema {
  if (!db) {
    initDb();
  }
  return db;
}

// User helper
export function sanitizeUser(user: DatabaseSchema['users'][0]): User {
  const { passwordHash, salt, ...safe } = user;
  return safe;
}

// Wallet helper to keep categories in strict sync
export function recalculateWallet(userId: string): Wallet {
  const data = getDb();
  if (!data.wallets[userId]) {
    data.wallets[userId] = {
      userId,
      availableBalance: 0,
      dailyEarningsBalance: 0,
      referralEarningsBalance: 0,
      bonusBalance: 1000,
      pendingWithdrawalsBalance: 0,
      totalEarnings: 1000,
      updatedAt: new Date().toISOString()
    };
  }

  const wallet = data.wallets[userId];
  if (wallet.bonusBalance === undefined) {
    wallet.bonusBalance = 1000;
  }
  wallet.totalEarnings = (wallet.dailyEarningsBalance || 0) + (wallet.referralEarningsBalance || 0) + (wallet.bonusBalance || 0);
  wallet.updatedAt = new Date().toISOString();
  saveDb();
  return wallet;
}

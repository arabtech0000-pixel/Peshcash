import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import {
  getDatabase,
  ref,
  set,
  get,
  onValue,
  push,
  update,
  remove,
  serverTimestamp,
  Database
} from 'firebase/database';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  runTransaction,
  serverTimestamp as firestoreTimestamp,
  increment,
  onSnapshot,
  Firestore
} from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyBjxZEHyZGY7xEBH1DBmn6yywq9kNI9hck",
  authDomain: "mcash-wala-af473.firebaseapp.com",
  databaseURL: "https://mcash-wala-af473-default-rtdb.firebaseio.com",
  projectId: "mcash-wala-af473",
  storageBucket: "mcash-wala-af473.firebasestorage.app",
  messagingSenderId: "42163556251",
  appId: "1:42163556251:web:5bbb145a2530e1a0a75b3e",
  measurementId: "G-713JR21F7M"
};

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Services
export const auth = getAuth(app);
export const rtdb: Database = getDatabase(app, firebaseConfig.databaseURL);
export const firestore: Firestore = getFirestore(app);

// Realtime Database Paths
export const DB_PATHS = {
  USERS: 'users',
  WALLETS: 'wallets',
  TASKS: 'tasks',
  COMPLETIONS: 'completions',
  WITHDRAWALS: 'withdrawals',
  REFERRALS: 'referrals',
  NOTIFICATIONS: 'notifications',
  TRANSACTIONS: 'transactions',
  SETTINGS: 'systemSettings',
  ACTIVATIONS: 'activationPayments'
};

// Helpers for Auth

export async function registerWithFirebaseEmail(email: string, pass: string, displayName: string) {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  if (displayName) {
    await updateProfile(result.user, { displayName });
  }
  return result.user;
}

export async function loginWithFirebaseEmail(email: string, pass: string) {
  const result = await signInWithEmailAndPassword(auth, email, pass);
  return result.user;
}

export async function logoutFirebase() {
  await signOut(auth);
}

export async function resetFirebasePassword(email: string) {
  await sendPasswordResetEmail(auth, email);
}

// Realtime Database Listeners & Writers
export function listenToRealtimeWallet(userId: string, onUpdate: (walletData: any) => void) {
  if (!userId) return () => {};
  const walletRef = ref(rtdb, `${DB_PATHS.WALLETS}/${userId}`);
  return onValue(walletRef, (snapshot) => {
    if (snapshot.exists()) {
      onUpdate(snapshot.val());
    }
  }, (err) => {
    console.warn('Realtime wallet listener error:', err);
  });
}

export function listenToRealtimeUser(userId: string, onUpdate: (userData: any) => void) {
  if (!userId) return () => {};
  const userRef = ref(rtdb, `${DB_PATHS.USERS}/${userId}`);
  return onValue(userRef, (snapshot) => {
    if (snapshot.exists()) {
      onUpdate(snapshot.val());
    }
  }, (err) => {
    console.warn('Realtime user listener error:', err);
  });
}

export function listenToRealtimeNotifications(userId: string, onUpdate: (notifs: any[]) => void) {
  if (!userId) return () => {};
  const notifRef = ref(rtdb, `${DB_PATHS.NOTIFICATIONS}/${userId}`);
  return onValue(notifRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const list = Object.keys(data).map(k => ({ id: k, ...data[k] }));
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      onUpdate(list);
    } else {
      onUpdate([]);
    }
  }, (err) => {
    console.warn('Realtime notification listener error:', err);
  });
}

export function listenToRealtimeSystemSettings(onUpdate: (settings: any) => void) {
  const settingsRef = ref(rtdb, DB_PATHS.SETTINGS);
  return onValue(settingsRef, (snapshot) => {
    if (snapshot.exists()) {
      onUpdate(snapshot.val());
    }
  }, (err) => {
    console.warn('Realtime settings listener error:', err);
  });
}

export async function pushRealtimeTransaction(userId: string, txn: any) {
  try {
    const txnListRef = ref(rtdb, `${DB_PATHS.TRANSACTIONS}/${userId}`);
    const newTxnRef = push(txnListRef);
    await set(newTxnRef, {
      ...txn,
      createdAt: new Date().toISOString()
    });
  } catch (e) {
    console.warn('Error pushing realtime transaction:', e);
  }
}

export async function syncUserRealtimeRecord(user: any, wallet: any) {
  try {
    if (user?.id) {
      const userRef = ref(rtdb, `${DB_PATHS.USERS}/${user.id}`);
      await update(userRef, {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        phone: user.phone || user.withdrawalPhone || '',
        role: user.role,
        status: user.status,
        referralCode: user.referralCode,
        avatarUrl: user.avatarUrl || '',
        updatedAt: new Date().toISOString()
      });
    }

    if (wallet?.userId) {
      const walletRef = ref(rtdb, `${DB_PATHS.WALLETS}/${wallet.userId}`);
      await update(walletRef, {
        ...wallet,
        updatedAt: new Date().toISOString()
      });
    }
  } catch (e) {
    console.warn('Error syncing user to Realtime DB:', e);
  }
}

// ----------------------------------------------------
// FIRESTORE USER & REFERRAL AUTOMATION
// ----------------------------------------------------

export async function syncUserFirestoreRecord(user: any, wallet?: any) {
  try {
    if (!user?.id) return;
    const userDocRef = doc(firestore, 'users', user.id);
    await setDoc(
      userDocRef,
      {
        id: user.id,
        fullName: user.fullName || '',
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || user.withdrawalPhone || '',
        referralCode: user.referralCode || '',
        referredBy: user.referredBy || null,
        status: user.status || 'active',
        role: user.role || 'user',
        balance: wallet?.availableBalance ?? 0,
        referralEarnings: wallet?.referralEarningsBalance ?? 0,
        totalEarnings: wallet?.totalEarnings ?? 0,
        updatedAt: firestoreTimestamp()
      },
      { merge: true }
    );
  } catch (e) {
    console.warn('Firestore syncUser warning:', e);
  }
}

/**
 * Executes an atomic Firestore Transaction for referral crediting:
 * 1. Verifies referrer doc exists and self-referral is blocked.
 * 2. Increments referrer's balance atomically via FieldValue.increment().
 * 3. Creates ledger entry in 'referrals' sub-collection: { referredUserId, timestamp, rewardAmount, status: 'COMPLETED' }.
 */
export async function recordFirestoreReferralTransaction(
  referrerId: string,
  referredUserId: string,
  rewardAmount: number = 5000
) {
  if (!referrerId || !referredUserId || referrerId === referredUserId) {
    return false;
  }

  try {
    const referrerDocRef = doc(firestore, 'users', referrerId);
    const referralLedgerRef = doc(collection(firestore, 'users', referrerId, 'referrals'));

    await runTransaction(firestore, async (transaction) => {
      const referrerSnap = await transaction.get(referrerDocRef);
      if (!referrerSnap.exists()) {
        console.warn('Referrer not found in Firestore:', referrerId);
        return;
      }

      // Increment balance and earnings atomically
      transaction.update(referrerDocRef, {
        balance: increment(rewardAmount),
        availableBalance: increment(rewardAmount),
        referralEarnings: increment(rewardAmount),
        totalEarnings: increment(rewardAmount),
        totalReferralsCount: increment(1),
        updatedAt: firestoreTimestamp()
      });

      // Write ledger record in referrals sub-collection
      transaction.set(referralLedgerRef, {
        id: referralLedgerRef.id,
        referredUserId,
        rewardAmount,
        status: 'COMPLETED',
        timestamp: firestoreTimestamp(),
        createdAt: new Date().toISOString()
      });
    });

    return true;
  } catch (err) {
    console.warn('Firestore transaction error (handled gracefully):', err);
    return false;
  }
}

// ----------------------------------------------------
// DIRECT FIREBASE CLIENT AUTH & SYNC (FALLBACK MODE)
// ----------------------------------------------------

export async function validateDirectReferralCode(code: string): Promise<{ valid: boolean; referrerUsername?: string; referrerName?: string; referrerId?: string; message?: string }> {
  if (!code || !code.trim()) return { valid: false, message: 'Please enter a referral code' };
  const cleanCode = code.trim().toUpperCase();

  try {
    // 1. Check Firestore
    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where('referralCode', '==', cleanCode));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0];
      const data = docSnap.data();
      return {
        valid: true,
        referrerId: docSnap.id,
        referrerUsername: data.username || 'Agent',
        referrerName: data.fullName || data.username || 'Agent',
        message: `Verified sponsor: @${data.username || data.fullName}`
      };
    }

    // 2. Check RTDB
    const rtdbUsersRef = ref(rtdb, DB_PATHS.USERS);
    const rtdbSnap = await get(rtdbUsersRef);
    if (rtdbSnap.exists()) {
      const allUsers = rtdbSnap.val();
      for (const uid in allUsers) {
        if (allUsers[uid]?.referralCode?.toUpperCase() === cleanCode) {
          const u = allUsers[uid];
          return {
            valid: true,
            referrerId: uid,
            referrerUsername: u.username || 'Agent',
            referrerName: u.fullName || u.username || 'Agent',
            message: `Verified sponsor: @${u.username || u.fullName}`
          };
        }
      }
    }
  } catch (e) {
    console.warn('validateDirectReferralCode error:', e);
  }

  return { valid: false, message: 'Invalid or unrecognized referral code' };
}

export async function registerDirectFirebase(params: {
  fullName: string;
  username: string;
  phone: string;
  email: string;
  password: string;
  referralCode?: string;
}): Promise<{ token: string; user: any; wallet: any }> {
  const { fullName, username, phone, email, password, referralCode } = params;

  // 1. Create Firebase Auth user
  let authUser: FirebaseUser;
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    authUser = cred.user;
    await updateProfile(authUser, { displayName: fullName || username });
  } catch (authErr: any) {
    if (authErr.code === 'auth/email-already-in-use') {
      // Try signing in instead
      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        authUser = cred.user;
      } catch (signInErr: any) {
        throw new Error('An account with this email already exists. Please sign in or use a different email.');
      }
    } else {
      throw new Error(authErr.message || 'Firebase Auth registration failed');
    }
  }

  const userId = authUser.uid;
  const generatedRefCode = username.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();

  // 2. Validate referral if provided
  let referrerId: string | null = null;
  if (referralCode && referralCode.trim()) {
    const validation = await validateDirectReferralCode(referralCode.trim());
    if (validation.valid && validation.referrerId && validation.referrerId !== userId) {
      referrerId = validation.referrerId;
    }
  }

  const now = new Date().toISOString();
  const user = {
    id: userId,
    fullName: fullName || username,
    username: username.toLowerCase().replace(/[^a-z0-9_]/g, ''),
    phone: phone.trim(),
    email: email.trim(),
    role: 'user',
    status: 'pending_activation',
    referralCode: generatedRefCode,
    referredBy: referrerId || undefined,
    withdrawalPhone: phone.trim(),
    createdAt: now,
    updatedAt: now
  };

  const wallet = {
    userId,
    availableBalance: 0,
    dailyEarningsBalance: 0,
    referralEarningsBalance: 0,
    bonusBalance: 1000,
    pendingWithdrawalsBalance: 0,
    totalEarnings: 1000,
    updatedAt: now
  };

  // 3. Save to Firestore
  try {
    await setDoc(doc(firestore, 'users', userId), {
      ...user,
      balance: wallet.availableBalance,
      referralEarnings: wallet.referralEarningsBalance,
      totalEarnings: wallet.totalEarnings,
      updatedAt: firestoreTimestamp()
    }, { merge: true });
  } catch (e) {
    console.warn('Error saving user to Firestore:', e);
  }

  // 4. Save to Realtime Database
  try {
    await update(ref(rtdb, `${DB_PATHS.USERS}/${userId}`), user);
    await update(ref(rtdb, `${DB_PATHS.WALLETS}/${userId}`), wallet);
    
    // Welcome Bonus Notification & Transaction
    const notifRef = push(ref(rtdb, `${DB_PATHS.NOTIFICATIONS}/${userId}`));
    await set(notifRef, {
      id: notifRef.key,
      userId,
      title: '🎁 Welcome Bonus: UGX 1,000 Credited!',
      message: 'You have been awarded a UGX 1,000 new account starter bonus!',
      type: 'bonus',
      isRead: false,
      createdAt: now
    });

    const txRef = push(ref(rtdb, `${DB_PATHS.TRANSACTIONS}/${userId}`));
    await set(txRef, {
      id: txRef.key,
      userId,
      category: 'bonus',
      type: 'credit',
      amountUgx: 1000,
      title: 'Welcome Bonus',
      description: 'New account welcome starter bonus',
      status: 'confirmed',
      transactionId: 'BONUS_' + Date.now(),
      createdAt: now
    });
  } catch (e) {
    console.warn('Error saving to Realtime Database:', e);
  }

  // 5. Credit referrer if applicable (UGX 5,000)
  if (referrerId) {
    try {
      await recordFirestoreReferralTransaction(referrerId, userId, 5000);
      
      // Credit in RTDB
      const referrerWalletRef = ref(rtdb, `${DB_PATHS.WALLETS}/${referrerId}`);
      const rSnap = await get(referrerWalletRef);
      if (rSnap.exists()) {
        const rWallet = rSnap.val();
        await update(referrerWalletRef, {
          availableBalance: (rWallet.availableBalance || 0) + 5000,
          referralEarningsBalance: (rWallet.referralEarningsBalance || 0) + 5000,
          totalEarnings: (rWallet.totalEarnings || 0) + 5000,
          updatedAt: now
        });
      }

      // Notify Referrer
      const refNotif = push(ref(rtdb, `${DB_PATHS.NOTIFICATIONS}/${referrerId}`));
      await set(refNotif, {
        id: refNotif.key,
        userId: referrerId,
        title: '🎉 Referral Reward Credited! (+UGX 5,000)',
        message: `Awesome! @${user.username} joined using your referral link. UGX 5,000 has been credited directly to your balance!`,
        type: 'referral_reward',
        isRead: false,
        createdAt: now
      });

      const refTx = push(ref(rtdb, `${DB_PATHS.TRANSACTIONS}/${referrerId}`));
      await set(refTx, {
        id: refTx.key,
        userId: referrerId,
        category: 'referral_earnings',
        type: 'credit',
        amountUgx: 5000,
        title: 'Referral Sign-Up Bonus',
        description: `Reward for @${user.username} signing up with your invite code`,
        status: 'confirmed',
        transactionId: 'REF_' + Date.now(),
        createdAt: now
      });
    } catch (refErr) {
      console.warn('Direct referral crediting warning:', refErr);
    }
  }

  // Cache locally
  try {
    localStorage.setItem('pesa_cached_user', JSON.stringify(user));
    localStorage.setItem('pesa_cached_wallet', JSON.stringify(wallet));
    localStorage.setItem('pesa_has_account', 'true');
  } catch (e) {}

  return { token: userId, user, wallet };
}

export async function loginDirectFirebase(identifier: string, pass: string): Promise<{ token: string; user: any; wallet: any }> {
  let emailToUse = identifier;

  // If not email, search in Firestore/RTDB
  if (!identifier.includes('@')) {
    try {
      const q = query(collection(firestore, 'users'), where('username', '==', identifier.toLowerCase().trim()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        emailToUse = snap.docs[0].data().email;
      } else {
        const qPhone = query(collection(firestore, 'users'), where('phone', '==', identifier.trim()));
        const snapPhone = await getDocs(qPhone);
        if (!snapPhone.empty) {
          emailToUse = snapPhone.docs[0].data().email;
        }
      }
    } catch (e) {}
  }

  // Sign in via Firebase Auth
  const cred = await signInWithEmailAndPassword(auth, emailToUse, pass);
  const userId = cred.user.uid;

  // Retrieve user doc from Firestore / RTDB
  let user: any = null;
  let wallet: any = null;

  try {
    const userDoc = await getDoc(doc(firestore, 'users', userId));
    if (userDoc.exists()) {
      user = userDoc.data();
    }
  } catch (e) {}

  if (!user) {
    try {
      const rSnap = await get(ref(rtdb, `${DB_PATHS.USERS}/${userId}`));
      if (rSnap.exists()) {
        user = rSnap.val();
      }
    } catch (e) {}
  }

  if (!user) {
    user = {
      id: userId,
      fullName: cred.user.displayName || 'Member',
      username: (cred.user.email?.split('@')[0] || 'user').toLowerCase(),
      email: cred.user.email,
      phone: '',
      role: 'user',
      status: 'active',
      referralCode: (cred.user.displayName || 'USER').slice(0, 4).toUpperCase() + '1000',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  try {
    const wSnap = await get(ref(rtdb, `${DB_PATHS.WALLETS}/${userId}`));
    if (wSnap.exists()) {
      wallet = wSnap.val();
    }
  } catch (e) {}

  if (!wallet) {
    wallet = {
      userId,
      availableBalance: user.balance || 0,
      dailyEarningsBalance: 0,
      referralEarningsBalance: user.referralEarnings || 0,
      bonusBalance: 1000,
      pendingWithdrawalsBalance: 0,
      totalEarnings: user.totalEarnings || 1000,
      updatedAt: new Date().toISOString()
    };
  }

  try {
    localStorage.setItem('pesa_cached_user', JSON.stringify(user));
    localStorage.setItem('pesa_cached_wallet', JSON.stringify(wallet));
    localStorage.setItem('pesa_has_account', 'true');
  } catch (e) {}

  return { token: userId, user, wallet };
}

export async function getDirectCurrentUser(token?: string): Promise<{ user: any; wallet: any }> {
  let cachedUser: any = null;
  let cachedWallet: any = null;
  try {
    const uStr = localStorage.getItem('pesa_cached_user');
    const wStr = localStorage.getItem('pesa_cached_wallet');
    if (uStr) cachedUser = JSON.parse(uStr);
    if (wStr) cachedWallet = JSON.parse(wStr);
  } catch (e) {}

  const uid = token || auth.currentUser?.uid || cachedUser?.id;
  if (!uid) {
    if (cachedUser) {
      return {
        user: cachedUser,
        wallet: cachedWallet || {
          userId: cachedUser.id,
          availableBalance: 0,
          dailyEarningsBalance: 0,
          referralEarningsBalance: 0,
          bonusBalance: 1000,
          pendingWithdrawalsBalance: 0,
          totalEarnings: 1000,
          updatedAt: new Date().toISOString()
        }
      };
    }
    throw new Error('Not authenticated');
  }

  let user = cachedUser;
  let wallet = cachedWallet;

  try {
    const userDoc = await getDoc(doc(firestore, 'users', uid));
    if (userDoc.exists()) {
      user = { id: uid, ...userDoc.data() };
    }
  } catch (e) {}

  if (!user) {
    try {
      const snap = await get(ref(rtdb, `${DB_PATHS.USERS}/${uid}`));
      if (snap.exists()) {
        user = { id: uid, ...snap.val() };
      }
    } catch (e) {}
  }

  try {
    const wSnap = await get(ref(rtdb, `${DB_PATHS.WALLETS}/${uid}`));
    if (wSnap.exists()) {
      wallet = wSnap.val();
    }
  } catch (e) {}

  if (!user && auth.currentUser) {
    user = {
      id: uid,
      fullName: auth.currentUser.displayName || 'Member',
      username: (auth.currentUser.email?.split('@')[0] || 'user').toLowerCase(),
      email: auth.currentUser.email || '',
      phone: '',
      role: 'user',
      status: 'pending_activation',
      referralCode: (auth.currentUser.displayName || 'USER').slice(0, 4).toUpperCase() + '1000',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  if (!wallet && user) {
    wallet = {
      userId: user.id,
      availableBalance: user.balance || 0,
      dailyEarningsBalance: 0,
      referralEarningsBalance: user.referralEarnings || 0,
      bonusBalance: 1000,
      pendingWithdrawalsBalance: 0,
      totalEarnings: user.totalEarnings || 1000,
      updatedAt: new Date().toISOString()
    };
  }

  if (user) {
    try {
      localStorage.setItem('pesa_cached_user', JSON.stringify(user));
      if (wallet) localStorage.setItem('pesa_cached_wallet', JSON.stringify(wallet));
    } catch (e) {}
  }

  if (!user) throw new Error('User not found');
  return { user, wallet };
}

export async function getDirectTasks(userId?: string): Promise<{ tasks: any[]; accountActive: boolean }> {
  const defaultTasks = [
    {
      id: 'task_app_review',
      title: 'Rate & Review Financial Literacy Guide',
      category: 'survey',
      rewardUgx: 2500,
      dailyLimit: 2,
      instructions: 'Submit a genuine short feedback rating for the financial literacy educational guide.',
      requiresProof: true,
      proofType: 'text',
      isActive: true,
      timeEstimate: '2 mins'
    },
    {
      id: 'task_tiktok_share',
      title: 'TikTok Brand Video Engagement',
      category: 'tiktok',
      rewardUgx: 3500,
      dailyLimit: 3,
      instructions: 'Watch, like, and share the official Pesa Cash educational video on TikTok.',
      requiresProof: true,
      proofType: 'screenshot',
      isActive: true,
      timeEstimate: '1 min'
    },
    {
      id: 'task_youtube_sub',
      title: 'YouTube Agency Channel Subscribe',
      category: 'youtube',
      rewardUgx: 4000,
      dailyLimit: 2,
      instructions: 'Subscribe to Pesa Cash Official YouTube channel and watch the welcome tutorial.',
      requiresProof: true,
      proofType: 'screenshot',
      isActive: true,
      timeEstimate: '3 mins'
    },
    {
      id: 'task_whatsapp_status',
      title: 'WhatsApp Daily Promotion Status',
      category: 'whatsapp',
      rewardUgx: 5000,
      dailyLimit: 1,
      instructions: 'Post your referral banner and link to your WhatsApp Status for at least 6 hours.',
      requiresProof: true,
      proofType: 'screenshot',
      isActive: true,
      timeEstimate: '1 min'
    }
  ];

  let accountActive = false;
  if (userId) {
    try {
      const uSnap = await get(ref(rtdb, `${DB_PATHS.USERS}/${userId}`));
      if (uSnap.exists() && uSnap.val()?.status === 'active') {
        accountActive = true;
      }
    } catch (e) {}
  }

  return {
    tasks: defaultTasks.map(t => ({ ...t, remainingToday: t.dailyLimit })),
    accountActive
  };
}

export async function getDirectNotifications(userId?: string): Promise<{ notifications: any[]; unreadCount: number }> {
  if (!userId) return { notifications: [], unreadCount: 0 };
  try {
    const snap = await get(ref(rtdb, `${DB_PATHS.NOTIFICATIONS}/${userId}`));
    if (snap.exists()) {
      const notifsObj = snap.val();
      const list = Object.values(notifsObj).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const unreadCount = list.filter((n: any) => !n.isRead).length;
      return { notifications: list, unreadCount };
    }
  } catch (e) {}

  return {
    notifications: [
      {
        id: 'notif_welcome',
        userId,
        title: '🎁 Welcome Bonus: UGX 1,000 Credited!',
        message: 'You have been awarded a UGX 1,000 new account starter bonus!',
        type: 'bonus',
        isRead: false,
        createdAt: new Date().toISOString()
      }
    ],
    unreadCount: 1
  };
}




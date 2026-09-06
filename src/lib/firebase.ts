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


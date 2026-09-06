import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import {
  getDb,
  saveDb,
  hashPassword,
  verifyPassword,
  sanitizeUser,
  recalculateWallet
} from './server/db.ts';
import {
  User,
  PaymentProvider,
  Task,
  TaskCompletion,
  Withdrawal,
  NotificationItem,
  TransactionHistoryItem,
  AuditLog,
  AdminAnalytics,
  AdminMetrics,
  SystemSettings
} from './src/types.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Helper middleware to get authenticated user
  const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const token = authHeader.split(' ')[1];
    const db = getDb();
    const userId = db.sessions[token];
    if (!userId) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
    const user = db.users.find(u => u.id === userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Account has been suspended. Please contact Pesa Cash support.' });
    }
    (req as any).user = user;
    (req as any).token = token;
    next();
  };

  const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req as any).user as User;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  };

  // ----------------------------------------------------
  // SYSTEM & MAINTENANCE (Public)
  // ----------------------------------------------------
  app.get('/api/system/settings', (req, res) => {
    const db = getDb();
    if (!db.systemSettings) {
      db.systemSettings = {
        maintenanceMode: false,
        maintenanceMessage: 'Pesa Cash is undergoing scheduled system optimization to improve instant payment processing. We will be back online shortly.',
        estimatedEndTime: '',
        allowAdminAccess: true,
        updatedAt: new Date().toISOString(),
        updatedBy: 'system'
      };
      saveDb();
    }
    return res.json({ settings: db.systemSettings });
  });

  // ----------------------------------------------------
  // AUTH ROUTES
  // ----------------------------------------------------

  // Register
  app.post('/api/auth/register', (req, res) => {
    const { fullName, username, phone, email, password, confirmPassword, referralCode, termsAccepted } = req.body;

    const db = getDb();
    if (db.systemSettings?.maintenanceMode) {
      return res.status(503).json({
        error: 'Pesa Cash is currently undergoing scheduled maintenance. New registrations are temporarily paused.',
        maintenance: true
      });
    }

    if (!username || !phone || !email || !password) {
      return res.status(400).json({ error: 'Username, phone number, email, and password are required' });
    }
    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }
    
    // Weak passwords permitted per user request (no minimum complexity restriction)

    if (!termsAccepted) {
      return res.status(400).json({ error: 'You must agree to the Terms of Service and Privacy Policy' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    const finalFullName = (fullName && fullName.trim()) ? fullName.trim() : username.trim();

    if (db.users.some(u => u.username.toLowerCase() === cleanUsername)) {
      return res.status(400).json({ error: 'Username is already taken' });
    }
    if (db.users.some(u => u.email.toLowerCase() === cleanEmail)) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    // Check referral
    let validatedReferrer: string | undefined = undefined;
    if (referralCode && referralCode.trim()) {
      const code = referralCode.trim().toUpperCase();
      const referrerUser = db.users.find(u => u.referralCode.toUpperCase() === code);
      if (referrerUser) {
        validatedReferrer = referrerUser.id;
      }
    }

    const newUserId = 'usr_' + crypto.randomBytes(6).toString('hex');
    
    // Ensure referral code is strictly unique
    let userReferralCode = cleanUsername.toUpperCase().slice(0, 4) + crypto.randomBytes(2).toString('hex').toUpperCase();
    while (db.users.some(u => u.referralCode === userReferralCode)) {
      userReferralCode = cleanUsername.toUpperCase().slice(0, 4) + crypto.randomBytes(2).toString('hex').toUpperCase();
    }

    const { hash, salt } = hashPassword(password);
    const now = new Date().toISOString();

    const isFirstAccount = db.users.length === 0;
    const isDesignatedAdmin = cleanEmail === 'ashirafashes04@gmail.com' || cleanUsername === 'admin';
    const isAssignedAdmin = isFirstAccount || isDesignatedAdmin;

    const newUser = {
      id: newUserId,
      fullName: finalFullName,
      username: cleanUsername,
      phone: cleanPhone,
      email: cleanEmail,
      role: isAssignedAdmin ? ('admin' as const) : ('user' as const),
      status: 'pending_activation' as const,
      referralCode: userReferralCode,
      referredBy: validatedReferrer,
      withdrawalPhone: cleanPhone,
      passwordHash: hash,
      salt,
      createdAt: now,
      updatedAt: now
    };

    db.users.push(newUser);

    // Initialize wallet
    db.wallets[newUserId] = {
      userId: newUserId,
      availableBalance: 0,
      dailyEarningsBalance: 0,
      referralEarningsBalance: 0,
      bonusBalance: 1000,
      pendingWithdrawalsBalance: 0,
      totalEarnings: 1000,
      updatedAt: now
    };

    // Credit UGX 1,000 Welcome Bonus transaction
    db.transactions.push({
      id: 'txn_' + crypto.randomBytes(6).toString('hex'),
      userId: newUserId,
      category: 'bonus',
      type: 'credit',
      amountUgx: 1000,
      title: 'Welcome Bonus',
      description: 'New account welcome bonus',
      status: 'confirmed',
      transactionId: 'BONUS_' + Date.now(),
      createdAt: now
    });

    // If referred, execute automated crediting to Referrer's account
    if (validatedReferrer && validatedReferrer !== newUserId) {
      const referrerUser = db.users.find(u => u.id === validatedReferrer);
      if (referrerUser) {
        const rewardAmount = 5000;
        
        // 1. Credit fixed reward amount (UGX 5,000) directly to Referrer's account balance
        const referrerWallet = db.wallets[validatedReferrer];
        if (referrerWallet) {
          referrerWallet.availableBalance = (referrerWallet.availableBalance || 0) + rewardAmount;
          referrerWallet.referralEarningsBalance = (referrerWallet.referralEarningsBalance || 0) + rewardAmount;
          referrerWallet.totalEarnings = (referrerWallet.totalEarnings || 0) + rewardAmount;
          referrerWallet.updatedAt = now;
        }

        // 2. Create ledger record in referrals sub-collection / list under Referrer
        const referralRecord = {
          id: 'ref_' + crypto.randomBytes(6).toString('hex'),
          referrerId: validatedReferrer,
          referredUserId: newUserId,
          refereeId: newUserId,
          refereeName: newUser.fullName,
          refereeUsername: newUser.username,
          refereePhone: newUser.phone,
          rewardAmount: rewardAmount,
          commissionAmountUgx: rewardAmount,
          status: 'COMPLETED' as const,
          qualifyingStatus: 'COMPLETED' as const,
          timestamp: now,
          creditedAt: now,
          createdAt: now
        };
        db.referrals.unshift(referralRecord);

        // 3. Record transaction ledger in Referrer's account
        db.transactions.unshift({
          id: 'txn_' + crypto.randomBytes(6).toString('hex'),
          userId: validatedReferrer,
          category: 'referral_earnings',
          type: 'credit',
          amountUgx: rewardAmount,
          title: 'Referral Sign-Up Bonus',
          description: `Reward for user @${newUser.username} signing up with your link`,
          status: 'confirmed',
          transactionId: 'REF_' + Date.now(),
          createdAt: now
        });

        // 4. Real-time notification for Referrer
        db.notifications.unshift({
          id: 'notif_' + crypto.randomBytes(6).toString('hex'),
          userId: validatedReferrer,
          title: '🎉 Referral Reward Credited! (+UGX 5,000)',
          message: `Awesome! @${newUser.username} joined using your referral link. UGX 5,000 has been credited directly to your balance!`,
          type: 'referral_reward',
          isRead: false,
          createdAt: now
        });
      }
    }

    // Welcome bonus notification
    db.notifications.push({
      id: 'notif_' + crypto.randomBytes(6).toString('hex'),
      userId: newUserId,
      title: '🎁 Welcome Bonus: UGX 1,000 Credited!',
      message: 'You have been awarded a UGX 1,000 new account starter bonus!',
      type: 'bonus',
      isRead: false,
      createdAt: now
    });

    // Welcome notification
    db.notifications.push({
      id: 'notif_' + crypto.randomBytes(6).toString('hex'),
      userId: newUserId,
      title: 'Welcome to Pesa Cash!',
      message: 'Your account is created and pending activation. Complete the one-time UGX 10,000 Mobile Money activation to unlock daily tasks & payouts.',
      type: 'activation',
      isRead: false,
      createdAt: now
    });

    // Create session token
    const token = crypto.randomBytes(32).toString('hex');
    db.sessions[token] = newUserId;
    saveDb();

    return res.json({
      token,
      user: sanitizeUser(newUser),
      wallet: db.wallets[newUserId]
    });
  });

  // Login
  app.post('/api/auth/login', (req, res) => {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Phone/email/username and password are required' });
    }

    const db = getDb();
    const clean = identifier.trim().toLowerCase();
    const user = db.users.find(
      u =>
        u.email.toLowerCase() === clean ||
        u.username.toLowerCase() === clean ||
        u.phone === identifier.trim() ||
        (clean === 'admin' && u.email.toLowerCase() === 'ashirafashes04@gmail.com')
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid login credentials' });
    }

    if (!verifyPassword(password, user.passwordHash, user.salt)) {
      return res.status(401).json({ error: 'Invalid login credentials' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'This account has been suspended by Pesa Cash administration.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    db.sessions[token] = user.id;
    saveDb();

    const wallet = recalculateWallet(user.id);

    return res.json({
      token,
      user: sanitizeUser(user),
      wallet
    });
  });

  // Firebase Auth Login / Sync endpoint
  app.post('/api/auth/firebase-login', (req, res) => {
    const { uid, email, displayName, photoUrl, phone, referralCode } = req.body;
    if (!uid || !email) {
      return res.status(400).json({ error: 'Firebase UID and email are required' });
    }

    const db = getDb();
    const cleanEmail = email.trim().toLowerCase();
    let user = db.users.find(u => u.email.toLowerCase() === cleanEmail || u.id === `usr_${uid}`);

    const now = new Date().toISOString();

    if (!user) {
      // Create user from Firebase
      const rawUsername = (displayName || email.split('@')[0] || 'user').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15);
      let uniqueUsername = rawUsername || 'user';
      let suffix = 1;
      while (db.users.some(u => u.username.toLowerCase() === uniqueUsername)) {
        uniqueUsername = `${rawUsername}${suffix++}`;
      }

      // Referral code check
      let validatedReferrer: string | undefined = undefined;
      if (referralCode && typeof referralCode === 'string' && referralCode.trim()) {
        const code = referralCode.trim().toUpperCase();
        const referrerUser = db.users.find(u => u.referralCode.toUpperCase() === code);
        if (referrerUser) {
          validatedReferrer = referrerUser.id;
        }
      }

      const newUserId = `usr_${uid}`;
      
      // Ensure referral code is strictly unique
      let userReferralCode = uniqueUsername.toUpperCase().slice(0, 4) + crypto.randomBytes(2).toString('hex').toUpperCase();
      while (db.users.some(u => u.referralCode === userReferralCode)) {
        userReferralCode = uniqueUsername.toUpperCase().slice(0, 4) + crypto.randomBytes(2).toString('hex').toUpperCase();
      }

      const isFirstAccount = db.users.length === 0;
      const isDesignatedAdmin = cleanEmail === 'ashirafashes04@gmail.com' || cleanEmail.includes('admin');
      const isAssignedAdmin = isFirstAccount || isDesignatedAdmin;

      const { hash, salt } = hashPassword(crypto.randomBytes(16).toString('hex'));

      user = {
        id: newUserId,
        fullName: displayName || uniqueUsername,
        username: uniqueUsername,
        phone: phone || '+256700000000',
        email: cleanEmail,
        role: isAssignedAdmin ? ('admin' as const) : ('user' as const),
        status: 'pending_activation' as const,
        referralCode: userReferralCode,
        referredBy: validatedReferrer,
        withdrawalPhone: phone || '+256700000000',
        avatarUrl: photoUrl || undefined,
        passwordHash: hash,
        salt,
        createdAt: now,
        updatedAt: now
      };

      db.users.push(user);

      db.wallets[newUserId] = {
        userId: newUserId,
        availableBalance: 0,
        dailyEarningsBalance: 0,
        referralEarningsBalance: 0,
        bonusBalance: 1000,
        pendingWithdrawalsBalance: 0,
        totalEarnings: 1000,
        updatedAt: now
      };

      // Credit UGX 1,000 Welcome Bonus transaction
      db.transactions.push({
        id: 'txn_' + crypto.randomBytes(6).toString('hex'),
        userId: newUserId,
        category: 'bonus',
        type: 'credit',
        amountUgx: 1000,
        title: 'Welcome Bonus',
        description: 'New account welcome bonus',
        status: 'confirmed',
        transactionId: 'BONUS_' + Date.now(),
        createdAt: now
      });

      if (validatedReferrer) {
        const referrerUser = db.users.find(u => u.id === validatedReferrer);
        if (referrerUser && referrerUser.status === 'active') {
          db.referrals.push({
            id: 'ref_' + crypto.randomBytes(6).toString('hex'),
            referrerId: validatedReferrer,
            refereeId: newUserId,
            refereeName: user.fullName,
            refereeUsername: user.username,
            refereePhone: user.phone,
            commissionAmountUgx: 5000,
            qualifyingStatus: 'pending_activation',
            createdAt: now
          });
        }
      }

      db.notifications.push({
        id: 'notif_' + crypto.randomBytes(6).toString('hex'),
        userId: newUserId,
        title: '🎁 Welcome Bonus: UGX 1,000 Credited!',
        message: 'You have been awarded a UGX 1,000 new account starter bonus!',
        type: 'bonus',
        isRead: false,
        createdAt: now
      });

      db.notifications.push({
        id: 'notif_' + crypto.randomBytes(6).toString('hex'),
        userId: newUserId,
        title: 'Welcome to Pesa Cash!',
        message: 'Your account is connected via Firebase Auth. Complete activation to unlock all daily earnings & payouts.',
        type: 'activation',
        isRead: false,
        createdAt: now
      });
    } else {
      if (photoUrl && !user.avatarUrl) {
        user.avatarUrl = photoUrl;
      }
      if (displayName && user.fullName === user.username) {
        user.fullName = displayName;
      }
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'This account has been suspended by Pesa Cash administration.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    db.sessions[token] = user.id;
    saveDb();

    const wallet = recalculateWallet(user.id);

    return res.json({
      token,
      user: sanitizeUser(user),
      wallet
    });
  });

  // Logout
  app.post('/api/auth/logout', authenticate, (req, res) => {
    const token = (req as any).token;
    const db = getDb();
    delete db.sessions[token];
    saveDb();
    return res.json({ success: true });
  });

  // Get current user (me)
  app.get('/api/auth/me', authenticate, (req, res) => {
    const user = (req as any).user;
    const wallet = recalculateWallet(user.id);
    return res.json({
      user: sanitizeUser(user),
      wallet
    });
  });

  // Forgot password simulation
  app.post('/api/auth/forgot-password', (req, res) => {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ error: 'Phone or email is required' });
    }
    const db = getDb();
    const clean = identifier.trim().toLowerCase();
    const user = db.users.find(
      u => u.email.toLowerCase() === clean || u.phone === identifier.trim()
    );
    if (!user) {
      return res.status(404).json({ error: 'No account found with this phone or email' });
    }
    // Generate secure recovery reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    return res.json({
      success: true,
      message: `Password reset instructions sent to ${user.phone}. For instant testing, use verification PIN: ${resetCode}`,
      demoPin: resetCode
    });
  });

  // Update profile
  app.post('/api/auth/update-profile', authenticate, (req, res) => {
    const user = (req as any).user;
    const { fullName, withdrawalPhone, avatarUrl } = req.body;
    const db = getDb();
    const target = db.users.find(u => u.id === user.id);
    if (!target) return res.status(404).json({ error: 'User not found' });

    if (fullName && fullName.trim()) target.fullName = fullName.trim();
    if (withdrawalPhone && withdrawalPhone.trim()) target.withdrawalPhone = withdrawalPhone.trim();
    if (avatarUrl) target.avatarUrl = avatarUrl;
    target.updatedAt = new Date().toISOString();

    saveDb();
    return res.json({ user: sanitizeUser(target) });
  });

  // Change password
  app.post('/api/auth/change-password', authenticate, (req, res) => {
    const user = (req as any).user;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }
    const db = getDb();
    const target = db.users.find(u => u.id === user.id);
    if (!target) return res.status(404).json({ error: 'User not found' });

    if (!verifyPassword(currentPassword, target.passwordHash, target.salt)) {
      return res.status(400).json({ error: 'Current password does not match' });
    }

    const { hash, salt } = hashPassword(newPassword);
    target.passwordHash = hash;
    target.salt = salt;
    target.updatedAt = new Date().toISOString();
    saveDb();

    return res.json({ success: true, message: 'Password updated successfully' });
  });

  // ----------------------------------------------------
  // ACCOUNT ACTIVATION (GOOGLE APPS SCRIPT)
  // ----------------------------------------------------

  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzJknVLjhCWVIM-CyJWXbtIZRRDwm9sIGGc2QddbSStHrkIT4H0sNjTz4yFwuV8iaZX/exec';

  app.post('/api/activation/trigger', authenticate, async (req, res) => {
    const user = (req as any).user as User;
    let phoneNumber = req.body.phoneNumber || user.phone;
    
    // Format phone number to E.164 (+256...)
    phoneNumber = phoneNumber.replace(/[^0-9+]/g, '');
    if (phoneNumber.startsWith('0')) {
      phoneNumber = '+256' + phoneNumber.slice(1);
    } else if (phoneNumber.startsWith('256')) {
      phoneNumber = '+' + phoneNumber;
    } else if (phoneNumber.startsWith('7') && phoneNumber.length === 9) {
      phoneNumber = '+256' + phoneNumber;
    } else if (!phoneNumber.startsWith('+')) {
      phoneNumber = '+' + phoneNumber;
    }

    try {
      const urlWithParams = new URL(APPS_SCRIPT_URL);
      urlWithParams.searchParams.append('action', 'activate_account');
      urlWithParams.searchParams.append('userId', user.id);
      urlWithParams.searchParams.append('phoneNumber', phoneNumber);
      
      // Pass extra required fields to GAS in case the script needs them for MarzPay
      urlWithParams.searchParams.append('amount', '10000');
      urlWithParams.searchParams.append('country', 'UG');
      urlWithParams.searchParams.append('reference', crypto.randomUUID());

      const response = await fetch(urlWithParams.toString(), {
        method: 'GET',
        redirect: 'follow',
      });
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        return res.json(data);
      } catch (parseError) {
        console.error('Trigger activation non-JSON response:', text.substring(0, 300));
        
        let errorMsg = 'Payment server returned an invalid response. ';
        if (text.includes('Sign in') || text.includes('accounts.google.com')) {
          errorMsg += 'It looks like your Google Apps Script requires authentication. Please re-deploy and set "Who has access" to "Anyone".';
        } else {
          errorMsg += 'Details: ' + text.substring(0, 100).replace(/<[^>]*>?/gm, '');
        }
        
        return res.status(500).json({ success: false, message: errorMsg });
      }
    } catch (error) {
      console.error('Trigger activation error:', error);
      return res.status(500).json({ success: false, message: 'Failed to trigger activation' });
    }
  });

  app.post('/api/activation/status', authenticate, async (req, res) => {
    const user = (req as any).user as User;
    const db = getDb();
    
    if (user.status === 'active') {
      return res.json({ success: true, message: 'Account is already active' });
    }

    try {
      const urlWithParams = new URL(APPS_SCRIPT_URL);
      urlWithParams.searchParams.append('action', 'check_payment');
      urlWithParams.searchParams.append('userId', user.id);

      const response = await fetch(urlWithParams.toString(), {
        method: 'GET',
        redirect: 'follow',
      });
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('Check activation non-JSON response:', text.substring(0, 300));
        let errorMsg = 'Payment server returned an invalid response. ';
        if (text.includes('Sign in') || text.includes('accounts.google.com')) {
          errorMsg += 'It looks like your Google Apps Script requires authentication. Please re-deploy and set "Who has access" to "Anyone".';
        } else {
          errorMsg += 'Details: ' + text.substring(0, 100).replace(/<[^>]*>?/gm, '');
        }
        return res.status(500).json({ success: false, message: errorMsg });
      }
      
      if (data.success) {
        const dbUser = db.users.find(u => u.id === user.id);
        if (dbUser && dbUser.status !== 'active') {
          dbUser.status = 'active';
          
          // Record the deposit transaction
          db.transactions.push({
            id: 'txn_' + crypto.randomBytes(6).toString('hex'),
            userId: user.id,
            category: 'deposits',
            type: 'credit',
            amountUgx: 10000,
            title: 'Account Activation',
            description: 'Activation fee paid via Mobile Money',
            status: 'confirmed',
            transactionId: 'ACT_' + Date.now(),
            createdAt: new Date().toISOString()
          });
          
          if (dbUser.referredBy) {
            const pendingRef = db.referrals.find(r => r.refereeId === dbUser.id && r.qualifyingStatus === 'pending_activation');
            if (pendingRef) {
              pendingRef.qualifyingStatus = 'qualified';
              pendingRef.creditedAt = new Date().toISOString();
              const commission = pendingRef.commissionAmountUgx || 5000;
              
              const referrerWallet = db.wallets[pendingRef.referrerId];
              if (referrerWallet) {
                referrerWallet.availableBalance += commission;
                referrerWallet.referralEarningsBalance += commission;
                referrerWallet.totalEarnings += commission;
                
                db.transactions.push({
                  id: 'txn_' + crypto.randomBytes(6).toString('hex'),
                  userId: pendingRef.referrerId,
                  category: 'referral_earnings',
                  type: 'credit',
                  amountUgx: commission,
                  title: 'Referral Commission',
                  description: `Commission for referring ${dbUser.username}`,
                  status: 'confirmed',
                  transactionId: 'REF_' + Date.now(),
                  createdAt: new Date().toISOString()
                });

                db.notifications.push({
                  id: 'notif_' + crypto.randomBytes(6).toString('hex'),
                  userId: pendingRef.referrerId,
                  title: '🎉 Referral Commission Credited!',
                  message: `Your referee ${dbUser.username} activated their account. UGX ${commission.toLocaleString()} has been credited to your Referral Wallet!`,
                  type: 'referral_reward',
                  isRead: false,
                  createdAt: new Date().toISOString()
                });
              }
            }
          }
          
          saveDb();
        }
      }
      return res.json(data);
    } catch (error) {
      console.error('Check activation error:', error);
      return res.status(500).json({ success: false, message: 'Failed to check status' });
    }
  });

  // ----------------------------------------------------
  // TASKS & DAILY EARNINGS (STRICTLY SEPARATE FROM REFERRALS)
  // ----------------------------------------------------

  // Get tasks list
  app.get('/api/tasks', authenticate, (req, res) => {
    const user = (req as any).user as User;
    const db = getDb();
    const today = new Date().toISOString().slice(0, 10);

    // Compute user completions today
    const userCompletionsToday = db.taskCompletions.filter(
      tc => tc.userId === user.id && tc.completedAt.startsWith(today)
    );

    const taskList = db.tasks.map(task => {
      const completedCount = userCompletionsToday.filter(c => c.taskId === task.id).length;
      const remaining = Math.max(0, task.dailyLimit - completedCount);
      return {
        ...task,
        remainingToday: remaining
      };
    });

    return res.json({
      tasks: taskList,
      accountActive: user.status === 'active'
    });
  });

  // Complete a task
  app.post('/api/tasks/:id/complete', authenticate, (req, res) => {
    const user = (req as any).user as User;
    
    if (user.status !== 'active') {
      return res.status(403).json({ error: 'You must activate your account to complete tasks and earn rewards.' });
    }

    const { id } = req.params;
    const { proofData } = req.body;

    const db = getDb();
    const task = db.tasks.find(t => t.id === id);
    if (!task || !task.isActive) {
      return res.status(404).json({ error: 'Task is not available' });
    }

    // Check daily limits
    const today = new Date().toISOString().slice(0, 10);
    const completedCount = db.taskCompletions.filter(
      tc => tc.taskId === task.id && tc.userId === user.id && tc.completedAt.startsWith(today)
    ).length;

    if (completedCount >= task.dailyLimit) {
      return res.status(400).json({ error: 'You have reached the daily limit for this task. Check back tomorrow!' });
    }

    const now = new Date().toISOString();
    const completionId = 'cmp_' + crypto.randomBytes(6).toString('hex');

    // Record completion
    db.taskCompletions.push({
      id: completionId,
      taskId: task.id,
      taskTitle: task.title,
      userId: user.id,
      rewardUgx: task.rewardUgx,
      completedAt: now,
      category: task.category
    });

    // Credit user's wallet: DAILY EARNINGS (in code, daily earnings and bonus are non-withdrawable)
    const wallet = recalculateWallet(user.id);
    wallet.dailyEarningsBalance = (wallet.dailyEarningsBalance || 0) + task.rewardUgx;
    if (user.role === 'admin') {
      wallet.availableBalance = (wallet.availableBalance || 0) + task.rewardUgx;
    }
    wallet.totalEarnings = (wallet.dailyEarningsBalance || 0) + (wallet.referralEarningsBalance || 0) + (wallet.bonusBalance || 0);
    wallet.updatedAt = now;

    // Transaction record
    db.transactions.unshift({
      id: 'txn_' + crypto.randomBytes(6).toString('hex'),
      userId: user.id,
      category: 'daily_earnings',
      type: 'credit',
      amountUgx: task.rewardUgx,
      title: task.title,
      description: `Task reward earned (${task.category.toUpperCase()})`,
      status: 'confirmed',
      transactionId: 'TXN-TSK-' + crypto.randomBytes(4).toString('hex').toUpperCase(),
      createdAt: now
    });

    // Notification
    db.notifications.unshift({
      id: 'notif_' + crypto.randomBytes(6).toString('hex'),
      userId: user.id,
      title: `Earned +UGX ${task.rewardUgx.toLocaleString()}`,
      message: `You successfully completed "${task.title}". The reward has been credited to your Daily Earnings balance.`,
      type: 'task_reward',
      isRead: false,
      createdAt: now
    });

    saveDb();

    return res.json({
      success: true,
      rewardUgx: task.rewardUgx,
      remainingToday: Math.max(0, task.dailyLimit - (completedCount + 1)),
      wallet
    });
  });

  // Daily Spin endpoint
  app.post('/api/tasks/spin/play', authenticate, (req, res) => {
    const user = (req as any).user as User;
    
    if (user.status !== 'active') {
      return res.status(403).json({ error: 'You must activate your account to play the Daily Spin.' });
    }

    const db = getDb();
    const today = new Date().toISOString().slice(0, 10);
    const alreadySpun = db.taskCompletions.some(
      tc => tc.category === 'spin' && tc.userId === user.id && tc.completedAt.startsWith(today)
    );

    if (alreadySpun) {
      return res.status(400).json({ error: 'You have already used your daily spin for today. Come back tomorrow!' });
    }

    // Fair weighted spin outcomes
    const outcomes = [
      { amount: 300, weight: 35 },
      { amount: 500, weight: 30 },
      { amount: 800, weight: 20 },
      { amount: 1200, weight: 10 },
      { amount: 2000, weight: 4 },
      { amount: 5000, weight: 1 }
    ];

    const totalWeight = outcomes.reduce((sum, o) => sum + o.weight, 0);
    let randomNum = Math.random() * totalWeight;
    let selectedAmount = 300;

    for (const outcome of outcomes) {
      if (randomNum < outcome.weight) {
        selectedAmount = outcome.amount;
        break;
      }
      randomNum -= outcome.weight;
    }

    const now = new Date().toISOString();
    db.taskCompletions.push({
      id: 'cmp_spin_' + crypto.randomBytes(6).toString('hex'),
      taskId: 'task_spin_01',
      taskTitle: 'Daily Lucky Wheel of Cash',
      userId: user.id,
      rewardUgx: selectedAmount,
      completedAt: now,
      category: 'spin'
    });

    const wallet = recalculateWallet(user.id);
    wallet.dailyEarningsBalance = (wallet.dailyEarningsBalance || 0) + selectedAmount;
    if (user.role === 'admin') {
      wallet.availableBalance = (wallet.availableBalance || 0) + selectedAmount;
    }
    wallet.totalEarnings = (wallet.dailyEarningsBalance || 0) + (wallet.referralEarningsBalance || 0) + (wallet.bonusBalance || 0);
    wallet.updatedAt = now;

    db.transactions.unshift({
      id: 'txn_' + crypto.randomBytes(6).toString('hex'),
      userId: user.id,
      category: 'daily_earnings',
      type: 'credit',
      amountUgx: selectedAmount,
      title: 'Daily Lucky Wheel Spin',
      description: 'Wheel of Cash reward credited',
      status: 'confirmed',
      transactionId: 'TXN-SPIN-' + crypto.randomBytes(4).toString('hex').toUpperCase(),
      createdAt: now
    });

    db.notifications.unshift({
      id: 'notif_' + crypto.randomBytes(6).toString('hex'),
      userId: user.id,
      title: `Lucky Spin: +UGX ${selectedAmount.toLocaleString()}`,
      message: `Congratulations! You won UGX ${selectedAmount.toLocaleString()} on the daily wheel of cash.`,
      type: 'task_reward',
      isRead: false,
      createdAt: now
    });

    saveDb();

    return res.json({
      success: true,
      rewardUgx: selectedAmount,
      wallet
    });
  });

  // ----------------------------------------------------
  // WALLET & WITHDRAWALS
  // ----------------------------------------------------

  // Wallet details
  app.get('/api/wallet', authenticate, (req, res) => {
    const user = (req as any).user as User;
    const wallet = recalculateWallet(user.id);
    const db = getDb();

    const recentTransactions = db.transactions
      .filter(t => t.userId === user.id)
      .slice(0, 20);

    const userWithdrawals = db.withdrawals
      .filter(w => w.userId === user.id)
      .slice(0, 10);

    return res.json({
      wallet,
      recentTransactions,
      withdrawals: userWithdrawals
    });
  });

  // Request withdrawal
  app.post('/api/withdrawals/request', authenticate, (req, res) => {
    const user = (req as any).user as User;
    const { amount, provider, mobileNumber } = req.body;

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'You must activate your account before making withdrawals.' });
    }

    const withdrawAmount = Number(amount);
    if (!withdrawAmount || isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return res.status(400).json({ error: 'Please enter a valid withdrawal amount' });
    }

    // Minimum withdrawal rule
    const MIN_WITHDRAWAL_UGX = 10000;
    if (withdrawAmount < MIN_WITHDRAWAL_UGX) {
      return res.status(400).json({
        error: `Minimum withdrawal amount is UGX ${MIN_WITHDRAWAL_UGX.toLocaleString()}`
      });
    }

    if (!provider || (provider !== 'MTN_MOMO' && provider !== 'AIRTEL_MONEY')) {
      return res.status(400).json({ error: 'Please select MTN Mobile Money or Airtel Money' });
    }

    if (!mobileNumber || mobileNumber.trim().length < 9) {
      return res.status(400).json({ error: 'Please enter a valid mobile money phone number' });
    }

    const wallet = recalculateWallet(user.id);

    // Server-side balance security check: in code, only verified referral earnings are withdrawable
    const withdrawableFunds = user.role === 'admin'
      ? wallet.availableBalance
      : (wallet.referralEarningsBalance || 0);

    if (withdrawableFunds < withdrawAmount) {
      return res.status(400).json({
        error: `Insufficient available balance for withdrawal. Your current balance available for payout is UGX ${withdrawableFunds.toLocaleString()}.`
      });
    }

    // Fee calculation (charge reduction of UGX 1,000)
    const feeUgx = 1000;
    const netAmountUgx = Math.max(0, withdrawAmount - feeUgx);

    const db = getDb();
    const now = new Date().toISOString();
    const withdrawalId = 'wd_' + crypto.randomBytes(6).toString('hex');
    const referenceId = (provider === 'MTN_MOMO' ? 'MTN-PAY-' : 'AIR-PAY-') + Math.floor(100000 + Math.random() * 900000);

    // Deduct from availableBalance and referralEarningsBalance, place in pendingWithdrawalsBalance
    wallet.availableBalance = Math.max(0, wallet.availableBalance - withdrawAmount);
    if (wallet.referralEarningsBalance) {
      wallet.referralEarningsBalance = Math.max(0, wallet.referralEarningsBalance - withdrawAmount);
    }
    wallet.pendingWithdrawalsBalance = (wallet.pendingWithdrawalsBalance || 0) + withdrawAmount;
    wallet.updatedAt = now;

    const withdrawal: Withdrawal = {
      id: withdrawalId,
      userId: user.id,
      userName: user.fullName,
      amountUgx: withdrawAmount,
      feeUgx,
      netAmountUgx,
      provider: provider as PaymentProvider,
      mobileNumber: mobileNumber.trim(),
      status: 'pending',
      referenceId,
      createdAt: now
    };

    db.withdrawals.unshift(withdrawal);

    // Transaction record
    db.transactions.unshift({
      id: 'txn_' + crypto.randomBytes(6).toString('hex'),
      userId: user.id,
      category: 'withdrawals',
      type: 'debit',
      amountUgx: withdrawAmount,
      title: `${provider === 'MTN_MOMO' ? 'MTN MoMo' : 'Airtel Money'} Withdrawal`,
      description: `Pending approval to ${mobileNumber} (Net: UGX ${netAmountUgx.toLocaleString()})`,
      status: 'pending',
      transactionId: referenceId,
      createdAt: now
    });

    // Notification
    db.notifications.unshift({
      id: 'notif_' + crypto.randomBytes(6).toString('hex'),
      userId: user.id,
      title: 'Withdrawal Request Submitted',
      message: `Your withdrawal of UGX ${withdrawAmount.toLocaleString()} to ${mobileNumber} is currently pending review and processing.`,
      type: 'withdrawal',
      isRead: false,
      createdAt: now
    });

    saveDb();

    return res.json({
      success: true,
      withdrawal,
      wallet
    });
  });

  // ----------------------------------------------------
  // REFERRALS & VALIDATION
  // ----------------------------------------------------

  // Validate referral code (Public endpoint for URL capture & sign-up forms)
  app.get('/api/referrals/validate/:code', (req, res) => {
    const code = (req.params.code || '').trim().toUpperCase();
    if (!code) {
      return res.status(400).json({ valid: false, message: 'No referral code provided' });
    }
    const db = getDb();
    const referrer = db.users.find(u => u.referralCode && u.referralCode.toUpperCase() === code);
    if (!referrer) {
      return res.json({ valid: false, message: 'Invalid or unknown referral code' });
    }
    return res.json({
      valid: true,
      referrerUsername: referrer.username,
      referrerName: referrer.fullName || referrer.username,
      message: `Verified referral link from @${referrer.username}`
    });
  });

  app.get('/api/referrals', authenticate, (req, res) => {
    const user = (req as any).user as User;
    const db = getDb();
    const userReferrals = db.referrals.filter(r => r.referrerId === user.id);

    const qualifiedCount = userReferrals.filter(r => r.qualifyingStatus === 'qualified' || r.status === 'COMPLETED' || r.qualifyingStatus === 'COMPLETED').length;
    const pendingCount = userReferrals.filter(r => r.qualifyingStatus === 'pending_activation' && r.status !== 'COMPLETED').length;
    const wallet = recalculateWallet(user.id);

    // Sum all referral earnings earned by this user
    const totalReferralEarnings = userReferrals.reduce((acc, r) => {
      return acc + (r.rewardAmount || r.commissionAmountUgx || 5000);
    }, 0);

    const referralsList = userReferrals.map(r => {
      const refereeUser = db.users.find(u => u.id === (r.referredUserId || r.refereeId));
      const amount = r.rewardAmount || r.commissionAmountUgx || 5000;
      const displayStatus = r.status || (r.qualifyingStatus === 'qualified' ? 'COMPLETED' : r.qualifyingStatus || 'COMPLETED');
      return {
        id: r.id,
        referredUserId: r.referredUserId || r.refereeId,
        username: refereeUser ? refereeUser.username : (r.refereeUsername || 'User'),
        fullName: refereeUser?.fullName || r.refereeName || r.refereeUsername || 'User',
        joinDate: r.createdAt || r.timestamp || new Date().toISOString(),
        timestamp: r.timestamp || r.createdAt || new Date().toISOString(),
        status: displayStatus,
        rewardAmount: amount,
        rewardEarned: amount
      };
    });

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol || 'https';
    const referralLink = `${protocol}://${host}/signup?ref=${user.referralCode}`;

    return res.json({
      referralCode: user.referralCode,
      referralLink,
      stats: {
        totalInvites: userReferrals.length,
        totalReferrals: userReferrals.length,
        activeInvites: qualifiedCount,
        activeCount: qualifiedCount,
        qualifiedCount,
        pendingInvites: pendingCount,
        pendingCount,
        totalEarningsUgx: Math.max(wallet.referralEarningsBalance || 0, totalReferralEarnings),
        totalReferralEarnings: Math.max(wallet.referralEarningsBalance || 0, totalReferralEarnings),
        amountCollected: Math.max(wallet.referralEarningsBalance || 0, totalReferralEarnings),
        commissionPerActiveRefereeUgx: 5000,
        referralsList
      },
      referrals: userReferrals
    });
  });

  // ----------------------------------------------------
  // TRANSACTION HISTORY & NOTIFICATIONS
  // ----------------------------------------------------

  app.get('/api/history', authenticate, (req, res) => {
    const user = (req as any).user as User;
    const { category } = req.query;
    const db = getDb();

    let userTx = db.transactions.filter(t => t.userId === user.id);

    if (category && category !== 'all') {
      userTx = userTx.filter(t => t.category === category);
    }

    return res.json({
      transactions: userTx
    });
  });

  app.get('/api/notifications', authenticate, (req, res) => {
    const user = (req as any).user as User;
    const db = getDb();
    const list = db.notifications.filter(n => n.userId === user.id);
    const unreadCount = list.filter(n => !n.isRead).length;

    return res.json({
      notifications: list,
      unreadCount
    });
  });

  app.post('/api/notifications/mark-read', authenticate, (req, res) => {
    const user = (req as any).user as User;
    const db = getDb();
    db.notifications.forEach(n => {
      if (n.userId === user.id) {
        n.isRead = true;
      }
    });
    saveDb();
    return res.json({ success: true });
  });

  // ----------------------------------------------------
  // ADMIN DASHBOARD & CONTROLS (Protected)
  // ----------------------------------------------------

  // Analytics Overview
  app.get(['/api/admin/overview', '/api/admin/metrics'], authenticate, requireAdmin, (req, res) => {
    const db = getDb();

    const registeredUsers = db.users.filter(u => u.role !== 'admin').length;
    const activeUsers = db.users.filter(u => u.role !== 'admin' && u.status === 'active').length;
    const pendingUsers = db.users.filter(u => u.role !== 'admin' && u.status === 'pending_activation').length;
    const suspendedUsers = db.users.filter(u => u.role !== 'admin' && u.status === 'suspended').length;

    const totalActivationFeesUgx = activeUsers * 10000;

    const totalTaskPayoutsUgx = db.taskCompletions.reduce((sum, c) => sum + c.rewardUgx, 0);
    const totalReferralPayoutsUgx = db.referrals
      .filter(r => r.qualifyingStatus === 'qualified' || r.qualifyingStatus === 'COMPLETED' || r.status === 'COMPLETED')
      .reduce((sum, r) => sum + (r.commissionAmountUgx || (r as any).rewardAmount || 0), 0);

    const pendingWithdrawalsUgx = db.withdrawals
      .filter(w => w.status === 'pending' || w.status === 'processing')
      .reduce((sum, w) => sum + w.amountUgx, 0);

    const completedWithdrawalsUgx = db.withdrawals
      .filter(w => w.status === 'completed')
      .reduce((sum, w) => sum + w.amountUgx, 0);

    const analytics: AdminAnalytics = {
      registeredUsers,
      activeUsers,
      pendingActivations: pendingUsers,
      suspendedUsers,
      totalActivationFeesUgx,
      totalTaskPayoutsUgx,
      totalReferralPayoutsUgx,
      pendingWithdrawalsUgx,
      completedWithdrawalsUgx
    };

    const metrics: AdminMetrics = {
      totalUsers: registeredUsers,
      activeUsers,
      pendingUsers,
      totalRevenueUgx: totalActivationFeesUgx,
      totalPayoutsUgx: completedWithdrawalsUgx,
      pendingWithdrawalsCount: db.withdrawals.filter(w => w.status === 'pending').length
    };

    return res.json({ analytics, metrics });
  });

  // User management
  app.get('/api/admin/users', authenticate, requireAdmin, (req, res) => {
    const db = getDb();
    const { search, status } = req.query;

    let list = db.users.map(u => ({
      ...sanitizeUser(u),
      wallet: recalculateWallet(u.id)
    }));

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      list = list.filter(
        u =>
          u.fullName.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          u.phone.includes(q) ||
          u.email.toLowerCase().includes(q)
      );
    }

    if (status && typeof status === 'string' && status !== 'all') {
      list = list.filter(u => u.status === status);
    }

    return res.json({ users: list });
  });

  // Toggle user status
  app.post('/api/admin/users/:id/status', authenticate, requireAdmin, (req, res) => {
    const admin = (req as any).user as User;
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ error: 'Invalid user status' });
    }

    const db = getDb();
    const target = db.users.find(u => u.id === id);
    if (!target) return res.status(404).json({ error: 'User not found' });
    if (target.role === 'admin') return res.status(400).json({ error: 'Cannot change admin status' });

    const prevStatus = target.status;
    target.status = status;
    target.updatedAt = new Date().toISOString();

    // If activated by admin and had a referrer, qualify referral commission
    if (status === 'active' && prevStatus !== 'active' && target.referredBy) {
      const pendingRef = db.referrals.find(r => r.refereeId === target.id && r.qualifyingStatus === 'pending_activation');
      if (pendingRef) {
        pendingRef.qualifyingStatus = 'qualified';
        pendingRef.creditedAt = new Date().toISOString();
        const commission = pendingRef.commissionAmountUgx || 5000;
        const referrerWallet = db.wallets[pendingRef.referrerId];
        if (referrerWallet) {
          referrerWallet.availableBalance += commission;
          referrerWallet.referralEarningsBalance += commission;
          referrerWallet.totalEarnings += commission;

          db.transactions.push({
            id: 'txn_' + crypto.randomBytes(6).toString('hex'),
            userId: pendingRef.referrerId,
            category: 'referral_earnings',
            type: 'credit',
            amountUgx: commission,
            title: 'Referral Commission',
            description: `Commission for referring ${target.username}`,
            status: 'confirmed',
            transactionId: 'REF_' + Date.now(),
            createdAt: new Date().toISOString()
          });
        }
      }
    }

    // Audit log
    db.auditLogs.unshift({
      id: 'audit_' + crypto.randomBytes(6).toString('hex'),
      adminId: admin.id,
      adminName: admin.fullName,
      targetUserId: target.id,
      targetUserName: target.fullName,
      action: 'UPDATE_USER_STATUS',
      notes: notes || `Changed status from ${prevStatus} to ${status}`,
      createdAt: new Date().toISOString()
    });

    saveDb();
    return res.json({ success: true, user: sanitizeUser(target) });
  });

  // Admin Payments list
  app.get('/api/admin/payments', authenticate, requireAdmin, (req, res) => {
    const db = getDb();
    const payments = db.transactions.filter(t => t.category === 'deposits' || t.category === 'activation_fee');
    
    const paymentsWithUsers = payments.map(p => {
      const u = db.users.find(user => user.id === p.userId);
      return {
        ...p,
        userName: u ? u.fullName : 'Unknown User',
        userPhone: u ? u.phone : 'N/A'
      };
    });
    
    return res.json({ payments: paymentsWithUsers });
  });

  // Admin Task management
  app.get('/api/admin/tasks', authenticate, requireAdmin, (req, res) => {
    const db = getDb();
    return res.json({ tasks: db.tasks });
  });

  app.post('/api/admin/tasks', authenticate, requireAdmin, (req, res) => {
    const admin = (req as any).user as User;
    const { title, description, category, rewardUgx, timeEstimateSeconds, requirements, dailyLimit } = req.body;

    if (!title || !description || !rewardUgx) {
      return res.status(400).json({ error: 'Title, description, and reward are required' });
    }

    const db = getDb();
    const newTask: Task = {
      id: 'task_' + crypto.randomBytes(6).toString('hex'),
      title: title.trim(),
      description: description.trim(),
      category: category || 'special',
      rewardUgx: Number(rewardUgx),
      timeEstimateSeconds: Number(timeEstimateSeconds) || 30,
      requirements: requirements || 'Standard verification required',
      dailyLimit: Number(dailyLimit) || 1,
      remainingToday: Number(dailyLimit) || 1,
      isActive: true,
      iconType: category === 'video' ? 'PlayCircle' : category === 'ad' ? 'Tv' : 'Sparkles',
      createdAt: new Date().toISOString()
    };

    db.tasks.unshift(newTask);

    db.auditLogs.unshift({
      id: 'audit_' + crypto.randomBytes(6).toString('hex'),
      adminId: admin.id,
      adminName: admin.fullName,
      targetUserId: 'system',
      targetUserName: 'System Tasks',
      action: 'CREATE_TASK',
      notes: `Created task "${newTask.title}" with reward UGX ${newTask.rewardUgx}`,
      createdAt: new Date().toISOString()
    });

    saveDb();
    return res.json({ success: true, task: newTask });
  });

  app.post('/api/admin/tasks/:id/toggle', authenticate, requireAdmin, (req, res) => {
    const admin = (req as any).user as User;
    const { id } = req.params;
    const db = getDb();
    const task = db.tasks.find(t => t.id === id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    task.isActive = !task.isActive;

    db.auditLogs.unshift({
      id: 'audit_' + crypto.randomBytes(6).toString('hex'),
      adminId: admin.id,
      adminName: admin.fullName,
      targetUserId: 'system',
      targetUserName: 'System Tasks',
      action: 'TOGGLE_TASK_ACTIVE',
      notes: `Set task "${task.title}" active state to ${task.isActive}`,
      createdAt: new Date().toISOString()
    });

    saveDb();
    return res.json({ success: true, task });
  });

  // Admin Withdrawals management
  app.get('/api/admin/withdrawals', authenticate, requireAdmin, (req, res) => {
    const db = getDb();
    return res.json({ withdrawals: db.withdrawals });
  });

  app.post('/api/admin/withdrawals/:id/approve', authenticate, requireAdmin, (req, res) => {
    const admin = (req as any).user as User;
    const { id } = req.params;
    const { referenceId, notes } = req.body;

    const db = getDb();
    const withdrawal = db.withdrawals.find(w => w.id === id);
    if (!withdrawal) return res.status(404).json({ error: 'Withdrawal not found' });

    if (withdrawal.status !== 'pending' && withdrawal.status !== 'processing') {
      return res.status(400).json({ error: `Withdrawal is already ${withdrawal.status}` });
    }

    const now = new Date().toISOString();
    withdrawal.status = 'completed';
    withdrawal.processedAt = now;
    if (referenceId) withdrawal.referenceId = referenceId;

    // Deduct from pendingWithdrawalsBalance
    const wallet = recalculateWallet(withdrawal.userId);
    wallet.pendingWithdrawalsBalance = Math.max(0, (wallet.pendingWithdrawalsBalance || 0) - withdrawal.amountUgx);
    wallet.updatedAt = now;

    // Update transaction
    const txn = db.transactions.find(t => t.transactionId === withdrawal.referenceId);
    if (txn) {
      txn.status = 'confirmed';
    }

    // Notify user
    db.notifications.unshift({
      id: 'notif_' + crypto.randomBytes(6).toString('hex'),
      userId: withdrawal.userId,
      title: 'Withdrawal Paid Out!',
      message: `Your withdrawal of UGX ${withdrawal.amountUgx.toLocaleString()} has been sent to ${withdrawal.mobileNumber} via ${withdrawal.provider === 'MTN_MOMO' ? 'MTN MoMo' : 'Airtel Money'}. Ref: ${withdrawal.referenceId}.`,
      type: 'withdrawal',
      isRead: false,
      createdAt: now
    });

    // Audit log
    db.auditLogs.unshift({
      id: 'audit_' + crypto.randomBytes(6).toString('hex'),
      adminId: admin.id,
      adminName: admin.fullName,
      targetUserId: withdrawal.userId,
      targetUserName: withdrawal.userName,
      action: 'APPROVE_WITHDRAWAL',
      amountDelta: -withdrawal.amountUgx,
      notes: notes || `Approved payout of UGX ${withdrawal.amountUgx} (Ref: ${withdrawal.referenceId})`,
      createdAt: now
    });

    saveDb();
    return res.json({ success: true, withdrawal });
  });

  app.post('/api/admin/withdrawals/:id/reject', authenticate, requireAdmin, (req, res) => {
    const admin = (req as any).user as User;
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'A rejection reason is required' });
    }

    const db = getDb();
    const withdrawal = db.withdrawals.find(w => w.id === id);
    if (!withdrawal) return res.status(404).json({ error: 'Withdrawal not found' });

    if (withdrawal.status !== 'pending' && withdrawal.status !== 'processing') {
      return res.status(400).json({ error: `Withdrawal is already ${withdrawal.status}` });
    }

    const now = new Date().toISOString();
    withdrawal.status = 'rejected';
    withdrawal.rejectionReason = reason.trim();
    withdrawal.processedAt = now;

    // Refund funds back from pendingWithdrawalsBalance to availableBalance
    const wallet = recalculateWallet(withdrawal.userId);
    wallet.pendingWithdrawalsBalance = Math.max(0, (wallet.pendingWithdrawalsBalance || 0) - withdrawal.amountUgx);
    wallet.availableBalance += withdrawal.amountUgx;
    wallet.updatedAt = now;

    // Update transaction
    const txn = db.transactions.find(t => t.transactionId === withdrawal.referenceId);
    if (txn) {
      txn.status = 'failed';
    }

    // Notify user
    db.notifications.unshift({
      id: 'notif_' + crypto.randomBytes(6).toString('hex'),
      userId: withdrawal.userId,
      title: 'Withdrawal Request Rejected',
      message: `Your withdrawal of UGX ${withdrawal.amountUgx.toLocaleString()} was declined: "${reason}". Funds have been safely returned to your available balance.`,
      type: 'withdrawal',
      isRead: false,
      createdAt: now
    });

    // Audit log
    db.auditLogs.unshift({
      id: 'audit_' + crypto.randomBytes(6).toString('hex'),
      adminId: admin.id,
      adminName: admin.fullName,
      targetUserId: withdrawal.userId,
      targetUserName: withdrawal.userName,
      action: 'REJECT_WITHDRAWAL',
      notes: `Rejected withdrawal #${withdrawal.id}. Reason: ${reason}`,
      createdAt: now
    });

    saveDb();
    return res.json({ success: true, withdrawal });
  });

  // Admin balance adjustment with mandatory audit log
  app.post('/api/admin/adjust-balance', authenticate, requireAdmin, (req, res) => {
    const admin = (req as any).user as User;
    const { userId, amountDelta, category, notes } = req.body;

    if (!userId || amountDelta === undefined || !notes) {
      return res.status(400).json({ error: 'User ID, amount delta, and explanation notes are required' });
    }

    const delta = Number(amountDelta);
    if (isNaN(delta) || delta === 0) {
      return res.status(400).json({ error: 'Amount delta must be a non-zero number' });
    }

    const db = getDb();
    const targetUser = db.users.find(u => u.id === userId);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    const wallet = recalculateWallet(userId);
    const now = new Date().toISOString();

    if (category === 'referral') {
      wallet.referralEarningsBalance = Math.max(0, (wallet.referralEarningsBalance || 0) + delta);
    } else {
      wallet.dailyEarningsBalance = Math.max(0, (wallet.dailyEarningsBalance || 0) + delta);
    }

    wallet.availableBalance = Math.max(0, (wallet.availableBalance || 0) + delta);
    wallet.totalEarnings = (wallet.dailyEarningsBalance || 0) + (wallet.referralEarningsBalance || 0);
    wallet.updatedAt = now;

    // Audit Log
    db.auditLogs.unshift({
      id: 'audit_' + crypto.randomBytes(6).toString('hex'),
      adminId: admin.id,
      adminName: admin.fullName,
      targetUserId: targetUser.id,
      targetUserName: targetUser.fullName,
      action: 'MANUAL_BALANCE_ADJUSTMENT',
      amountDelta: delta,
      notes: notes.trim(),
      createdAt: now
    });

    // Transaction
    db.transactions.unshift({
      id: 'txn_' + crypto.randomBytes(6).toString('hex'),
      userId: targetUser.id,
      category: category === 'referral' ? 'referral_earnings' : 'daily_earnings',
      type: delta > 0 ? 'credit' : 'debit',
      amountUgx: Math.abs(delta),
      title: 'Admin Balance Adjustment',
      description: notes.trim(),
      status: 'confirmed',
      transactionId: 'TXN-ADJ-' + crypto.randomBytes(4).toString('hex').toUpperCase(),
      createdAt: now
    });

    saveDb();
    return res.json({ success: true, wallet });
  });

  // Admin audit logs
  app.get('/api/admin/audit-logs', authenticate, requireAdmin, (req, res) => {
    const db = getDb();
    const logs = db.auditLogs.slice(0, 50);
    return res.json({ logs, auditLogs: logs });
  });

  // Admin System Settings (Maintenance Mode Controls)
  app.get('/api/admin/system/settings', authenticate, requireAdmin, (req, res) => {
    const db = getDb();
    if (!db.systemSettings) {
      db.systemSettings = {
        maintenanceMode: false,
        maintenanceMessage: 'Pesa Cash is undergoing scheduled system optimization to improve instant payment processing. We will be back online shortly.',
        estimatedEndTime: '',
        allowAdminAccess: true,
        updatedAt: new Date().toISOString(),
        updatedBy: 'system'
      };
      saveDb();
    }
    return res.json({ settings: db.systemSettings });
  });

  app.post('/api/admin/system/settings', authenticate, requireAdmin, (req, res) => {
    const admin = (req as any).user as User;
    const { maintenanceMode, maintenanceMessage, estimatedEndTime, allowAdminAccess } = req.body;
    const db = getDb();

    if (maintenanceMode === undefined) {
      return res.status(400).json({ error: 'maintenanceMode parameter is required' });
    }

    const prevMode = db.systemSettings?.maintenanceMode ?? false;
    const isToggling = prevMode !== Boolean(maintenanceMode);
    const now = new Date().toISOString();

    const newSettings: SystemSettings = {
      maintenanceMode: Boolean(maintenanceMode),
      maintenanceMessage: (typeof maintenanceMessage === 'string' && maintenanceMessage.trim())
        ? maintenanceMessage.trim()
        : 'Pesa Cash is undergoing scheduled system optimization to improve instant payment processing. We will be back online shortly.',
      estimatedEndTime: typeof estimatedEndTime === 'string' ? estimatedEndTime.trim() : '',
      allowAdminAccess: allowAdminAccess !== undefined ? Boolean(allowAdminAccess) : true,
      updatedAt: now,
      updatedBy: admin.id
    };

    db.systemSettings = newSettings;

    // Log to immutable audit ledger
    db.auditLogs.unshift({
      id: 'audit_' + crypto.randomBytes(6).toString('hex'),
      adminId: admin.id,
      adminName: admin.fullName,
      targetUserId: 'system',
      targetUserName: 'System Maintenance Engine',
      action: isToggling
        ? (newSettings.maintenanceMode ? 'ENABLE_MAINTENANCE_MODE' : 'DISABLE_MAINTENANCE_MODE')
        : 'UPDATE_MAINTENANCE_SETTINGS',
      notes: `${newSettings.maintenanceMode ? 'ENABLED' : 'DISABLED'} maintenance mode. Notice: "${newSettings.maintenanceMessage}"${newSettings.estimatedEndTime ? ' | ETA: ' + newSettings.estimatedEndTime : ''}`,
      createdAt: now
    });

    saveDb();
    return res.json({ success: true, settings: db.systemSettings });
  });

  // ----------------------------------------------------
  // VITE MIDDLEWARE (DEV) & STATIC (PROD)
  // ----------------------------------------------------

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[PESA CASH] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

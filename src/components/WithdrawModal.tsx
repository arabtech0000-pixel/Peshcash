import React, { useState } from 'react';
import {
  X,
  ArrowDownToLine,
  Phone,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';
import { User, Wallet, PaymentProvider } from '../types.ts';
import { api } from '../lib/api.ts';
import { MTNMoMoBadge, AirtelMoneyBadge, MTNMoMoAppIcon, AirtelMoneyAppIcon } from './BrandAssets.tsx';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  wallet: Wallet | null;
  onWithdrawalSuccess: (updatedWallet: Wallet) => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  onClose,
  user,
  wallet,
  onWithdrawalSuccess
}) => {
  const availableBalance = wallet?.availableBalance || 0;
  const [amount, setAmount] = useState<number>(10000);
  const [provider, setProvider] = useState<PaymentProvider>('MTN_MOMO');
  const [phone, setPhone] = useState(user?.withdrawalPhone || user?.phone || '+256 ');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successData, setSuccessData] = useState<any>(null);

  if (!isOpen) return null;

  const MIN_AMOUNT = 10000;
  const fee = 1000; // Standard charge reduction of UGX 1,000
  const netAmount = Math.max(0, (Number(amount) || 0) - fee);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (amount < MIN_AMOUNT) {
      setErrorMessage(`Minimum withdrawal is UGX ${Number(MIN_AMOUNT).toLocaleString()}`);
      return;
    }
    if (amount > availableBalance) {
      setErrorMessage(`Cannot withdraw more than your available balance of UGX ${Number(availableBalance).toLocaleString()}`);
      return;
    }
    if (!phone || phone.trim().length < 9) {
      setErrorMessage('Please enter a valid Ugandan mobile money number');
      return;
    }

    setLoading(true);

    try {
      const res = await api.requestWithdrawal({
        amount: Number(amount),
        provider,
        mobileNumber: phone.trim()
      });

      setSuccessData(res.withdrawal);
      onWithdrawalSuccess(res.wallet);
    } catch (err: any) {
      setErrorMessage(err.message || 'Withdrawal request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="withdraw-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-sm overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden border border-slate-100 relative my-auto"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-b from-[#0e2a6d] via-blue-800 to-blue-700 pt-7 pb-6 px-6 text-white text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-blue-100 border border-white/20 text-xs font-bold mb-2">
            <ArrowDownToLine className="w-3.5 h-3.5" />
            <span>Mobile Money Cashout</span>
          </div>

          <h3 className="text-2xl font-black tracking-tight text-white">
            Withdraw Funds
          </h3>

          <div className="mt-2 flex items-center justify-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl py-2 px-6 border border-white/15 text-center">
              <span className="text-[11px] text-blue-200 block">Available Balance:</span>
              <span className="text-xl font-black text-white">
                UGX {Number(availableBalance ?? 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successData ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-extrabold text-slate-900">
                Withdrawal Initiated!
              </h4>
              <p className="text-xs text-slate-600 max-w-xs mx-auto">
                Your request of UGX {Number(successData?.amountUgx ?? 0).toLocaleString()} has been queued for automated carrier batch disbursement.
              </p>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-left text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Reference ID:</span>
                  <span className="font-mono font-bold text-slate-800">{successData.referenceId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Recipient Phone:</span>
                  <span className="font-semibold text-slate-800">{successData.mobileNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Net Transfer (after fee):</span>
                  <span className="font-black text-emerald-700">UGX {Number(successData?.netAmountUgx ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                    Pending Verification
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 px-4 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm shadow-md"
              >
                Return to Wallet
              </button>
            </div>
          ) : (
            <form onSubmit={handleWithdraw} className="space-y-4">
              {/* Amount field with presets */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Amount (UGX)</label>
                  <span className="text-[10px] font-semibold text-slate-400">Min: UGX 10,000</span>
                </div>
                <input
                  id="withdraw-amount-input"
                  type="number"
                  min={MIN_AMOUNT}
                  max={availableBalance}
                  step={1000}
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                />

                {/* Quick Presets */}
                <div className="grid grid-cols-4 gap-1.5 mt-2">
                  {[10000, 20000, 50000, 100000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(preset)}
                      className="py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                    >
                      {preset / 1000}K
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setAmount(availableBalance)}
                    className="py-1.5 px-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold transition-colors"
                  >
                    MAX
                  </button>
                </div>
              </div>

              {/* Provider Selection */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                  Select Carrier
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setProvider('MTN_MOMO')}
                    className={`p-3 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                      provider === 'MTN_MOMO'
                        ? 'border-blue-600 bg-amber-50/40 shadow-sm ring-1 ring-blue-600/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <MTNMoMoAppIcon className="w-7 h-7" />
                      <div>
                        <span className="font-extrabold text-xs text-slate-900 block">MTN MoMo</span>
                        <span className="text-[10px] text-slate-500 font-medium">*165#</span>
                      </div>
                    </div>
                    {provider === 'MTN_MOMO' && (
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setProvider('AIRTEL_MONEY')}
                    className={`p-3 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                      provider === 'AIRTEL_MONEY'
                        ? 'border-red-600 bg-red-50/40 shadow-sm ring-1 ring-red-600/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <AirtelMoneyAppIcon className="w-7 h-7" />
                      <div>
                        <span className="font-extrabold text-xs text-slate-900 block">Airtel Money</span>
                        <span className="text-[10px] text-slate-500 font-medium">*185#</span>
                      </div>
                    </div>
                    {provider === 'AIRTEL_MONEY' && (
                      <CheckCircle2 className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                  </button>
                </div>
              </div>

              {/* Recipient Number */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  Registered Mobile Money Phone
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    id="withdraw-phone-input"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+256 7XX XXX XXX"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Fee and Net Breakdown */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                <div className="flex justify-between text-slate-500">
                  <span>Charge Reduction (Withdrawal Fee):</span>
                  <span>UGX {Number(fee ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                  <span>Net Mobile Money Payout:</span>
                  <span className="text-blue-800 font-black">UGX {Number(netAmount ?? 0).toLocaleString()}</span>
                </div>
              </div>

              <button
                id="submit-withdrawal-btn"
                type="submit"
                disabled={loading || availableBalance < MIN_AMOUNT}
                className="w-full py-3.5 px-4 rounded-2xl bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-blue-700/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Confirm Withdrawal Request</span>
                    <ArrowDownToLine className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

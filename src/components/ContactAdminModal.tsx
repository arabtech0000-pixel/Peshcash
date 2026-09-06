import React, { useState } from 'react';
import {
  MessageCircle,
  Mail,
  Phone,
  X,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Users,
  Sparkles,
  Headphones
} from 'lucide-react';
import { motion } from 'motion/react';
import { SUPPORT_CONFIG, getWhatsAppHelpUrl } from '../constants.ts';

interface ContactAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactAdminModal: React.FC<ContactAdminModalProps> = ({
  isOpen,
  onClose
}) => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  if (!isOpen) return null;

  const adminEmail = 'ashirafashes04@gmail.com';
  const whatsappUrl = getWhatsAppHelpUrl(
    'Hello Pesa Cash Support, I need assistance with my account / activation.'
  );

  const copyToClipboard = (text: string, type: 'email' | 'phone') => {
    navigator.clipboard.writeText(text);
    if (type === 'email') {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } else {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  return (
    <div
      id="contact-admin-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-sm overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 relative my-auto"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20">
              <Headphones className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ONLINE 24/7 SUPPORT
              </div>
              <h2 className="text-lg font-bold text-white">Contact Pesa Cash Help</h2>
            </div>
          </div>
          <p className="text-xs text-blue-100">
            Reach out directly for instant account activations, withdrawal assistance, or questions.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Direct WhatsApp Chat */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full p-4 rounded-2xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100/70 flex items-center justify-between transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  Chat Directly on WhatsApp
                  <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-extrabold">FASTEST</span>
                </p>
                <p className="text-[11px] text-emerald-700 font-mono font-semibold">
                  {SUPPORT_CONFIG.whatsappDisplayNumber} ({SUPPORT_CONFIG.whatsappIntlNumber})
                </p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
          </a>

          {/* Phone Number Copy / Call */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Official Help WhatsApp Line</p>
                <p className="text-xs text-slate-700 font-mono font-bold">{SUPPORT_CONFIG.whatsappDisplayNumber}</p>
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(SUPPORT_CONFIG.whatsappDisplayNumber, 'phone')}
              className="p-2 rounded-xl hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              title="Copy Number"
            >
              {copiedPhone ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Email Admin */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Official Admin Email</p>
                <p className="text-xs text-slate-600 font-mono font-medium">{adminEmail}</p>
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(adminEmail, 'email')}
              className="p-2 rounded-xl hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              title="Copy Email"
            >
              {copiedEmail ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* WhatsApp Channels Section */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-700 mb-2.5">Official Community Channels:</p>
            <div className="grid grid-cols-2 gap-2.5">
              <a
                href={SUPPORT_CONFIG.whatsappGroupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">WhatsApp Group</span>
              </a>

              <a
                href={SUPPORT_CONFIG.whatsappChannelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
                <span className="truncate">WhatsApp Channel</span>
              </a>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Security Verified</span>
          <button
            onClick={onClose}
            className="font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};


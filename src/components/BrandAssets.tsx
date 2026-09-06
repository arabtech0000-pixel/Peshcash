import React from 'react';

// ============================================================================
// OFFICIAL UGANDAN MOBILE MONEY CARRIER APP LOGOS & BRAND ASSETS
// ============================================================================

/**
 * Authentic MTN Mobile Money (MoMo) App Icon & Vector Logo
 */
export const MTNMoMoAppIcon: React.FC<{ className?: string; size?: number }> = ({
  className = 'w-9 h-9',
  size
}) => {
  const style = size ? { width: size, height: size } : undefined;
  return (
    <div
      style={style}
      className={`relative inline-flex items-center justify-center shrink-0 rounded-2xl bg-[#FFCC00] shadow-sm overflow-hidden select-none ${className}`}
      title="MTN Mobile Money"
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full p-1"
      >
        {/* Background Yellow Glow */}
        <rect width="100" height="100" rx="22" fill="#FFCC00" />
        
        {/* MTN Signature Oval */}
        <ellipse
          cx="50"
          cy="36"
          rx="38"
          ry="22"
          fill="#FFCC00"
          stroke="#000000"
          strokeWidth="6.5"
        />
        
        {/* "MTN" Typography */}
        <text
          x="50"
          y="44"
          textAnchor="middle"
          fill="#000000"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="24"
          letterSpacing="-1"
        >
          MTN
        </text>

        {/* MoMo Pill Banner */}
        <rect x="14" y="64" width="72" height="24" rx="12" fill="#004F71" />
        <text
          x="50"
          y="81"
          textAnchor="middle"
          fill="#FFFFFF"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="15"
          letterSpacing="0.5"
        >
          MoMo
        </text>
        <circle cx="24" cy="76" r="3.5" fill="#FFCC00" />
        <circle cx="76" cy="76" r="3.5" fill="#FFCC00" />
      </svg>
    </div>
  );
};

/**
 * Authentic Airtel Money App Icon & Vector Logo
 */
export const AirtelMoneyAppIcon: React.FC<{ className?: string; size?: number }> = ({
  className = 'w-9 h-9',
  size
}) => {
  const style = size ? { width: size, height: size } : undefined;
  return (
    <div
      style={style}
      className={`relative inline-flex items-center justify-center shrink-0 rounded-2xl bg-[#ED1C24] shadow-sm overflow-hidden select-none ${className}`}
      title="Airtel Money"
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full p-1"
      >
        {/* Airtel Red Background */}
        <rect width="100" height="100" rx="22" fill="#ED1C24" />
        
        {/* Iconic Airtel 'a' swirl emblem */}
        <path
          d="M 50 16 C 36 16 28 25 28 36 C 28 47 37 54 50 54 C 58 54 65 50 68 44 L 68 53 L 78 53 L 78 28 C 78 20 68 16 50 16 Z M 50 44 C 42 44 38 39 38 35 C 38 30 43 25 50 25 C 58 25 68 29 68 35 C 68 40 60 44 50 44 Z"
          fill="#FFFFFF"
        />
        
        {/* "airtel" wordmark */}
        <text
          x="50"
          y="68"
          textAnchor="middle"
          fill="#FFFFFF"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="800"
          fontSize="14"
          letterSpacing="-0.5"
        >
          airtel
        </text>

        {/* "money" label in white pill with red text */}
        <rect x="20" y="74" width="60" height="16" rx="8" fill="#FFFFFF" />
        <text
          x="50"
          y="86"
          textAnchor="middle"
          fill="#ED1C24"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="11"
          letterSpacing="0.5"
        >
          money
        </text>
      </svg>
    </div>
  );
};

/**
 * Authentic Google Vector Logo for Firebase Authentication
 */
export const GoogleAppIcon: React.FC<{ className?: string; size?: number }> = ({
  className = 'w-5 h-5',
  size
}) => {
  const style = size ? { width: size, height: size } : undefined;
  return (
    <svg
      style={style}
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
};

/**
 * Firebase Flame Vector Logo
 */
export const FirebaseAppIcon: React.FC<{ className?: string; size?: number }> = ({
  className = 'w-5 h-5',
  size
}) => {
  const style = size ? { width: size, height: size } : undefined;
  return (
    <svg
      style={style}
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4.65 17.89l5.06-9.52-2.58-4.9c-.27-.51-.98-.55-1.3-.08L1.08 11.23c-.35.5-.32 1.17.07 1.64l3.5 5.02z"
        fill="#FFA000"
      />
      <path
        d="M12.92 6.84l2.12-4.04c.26-.5.96-.54 1.28-.08l6.59 9.38c.36.51.34 1.19-.05 1.67L15.93 21c-.49.6-1.41.6-1.9 0L4.65 17.89l8.27-11.05z"
        fill="#F57C00"
      />
      <path
        d="M15.03 21l6.93-8.23c.39-.48.41-1.16.05-1.67L15.42 1.72c-.32-.46-1.02-.42-1.28.08l-2.12 4.04 2.99 15.16z"
        fill="#FFCA28"
      />
    </svg>
  );
};

/**
 * MTN MoMo Badge (Compact & Pill)
 */
export const MTNMoMoBadge: React.FC<{ className?: string; showUssd?: boolean }> = ({
  className = '',
  showUssd = false
}) => (
  <div
    className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-300 text-slate-900 font-bold text-xs tracking-tight shadow-xs ${className}`}
  >
    <MTNMoMoAppIcon className="w-5 h-5" />
    <div className="flex items-baseline gap-1">
      <span className="font-black text-[#004f71]">MTN</span>
      <span className="font-extrabold text-amber-700">MoMo</span>
      {showUssd && <span className="text-[10px] text-slate-500 font-mono">(*165#)</span>}
    </div>
  </div>
);

/**
 * Airtel Money Badge (Compact & Pill)
 */
export const AirtelMoneyBadge: React.FC<{ className?: string; showUssd?: boolean }> = ({
  className = '',
  showUssd = false
}) => (
  <div
    className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-slate-900 font-bold text-xs tracking-tight shadow-xs ${className}`}
  >
    <AirtelMoneyAppIcon className="w-5 h-5" />
    <div className="flex items-baseline gap-1">
      <span className="font-black text-[#ED1C24]">airtel</span>
      <span className="font-extrabold text-red-800">money</span>
      {showUssd && <span className="text-[10px] text-slate-500 font-mono">(*185#)</span>}
    </div>
  </div>
);

export const PesaCashLogo: React.FC<{ className?: string; variant?: 'default' | 'white' | 'dark'; size?: 'sm' | 'md' | 'lg' }> = ({
  className = '',
  variant = 'default',
  size = 'md'
}) => {
  const isLight = variant === 'white';
  const iconSize = size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-11 h-11' : 'w-9 h-9';
  const textSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-xl' : 'text-lg';

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div className={`${iconSize} rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 p-0.5 shadow-md shadow-blue-600/30 flex items-center justify-center text-white shrink-0`}>
        <div className="w-full h-full rounded-[14px] bg-blue-800/40 backdrop-blur-sm flex items-center justify-center border border-white/20">
          <span className="text-lg font-black tracking-tighter">P</span>
        </div>
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-1">
          <span className={`font-extrabold tracking-tight ${textSize} ${isLight ? 'text-white' : 'text-slate-900'}`}>
            PESA<span className="text-blue-600 font-black">CASH</span>
          </span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 uppercase tracking-wider">
            UG
          </span>
        </div>
        <span className={`text-[10px] font-medium leading-none ${isLight ? 'text-blue-200' : 'text-slate-500'}`}>
          Verified Agency & Rewards
        </span>
      </div>
    </div>
  );
};

export const UgxCurrencyBadge: React.FC<{ amount?: number | null; className?: string }> = ({
  amount,
  className = ''
}) => (
  <span className={`font-bold tracking-tight inline-flex items-baseline ${className}`}>
    <span className="text-xs font-semibold text-slate-500 mr-1">UGX</span>
    <span>{Number(amount ?? 0).toLocaleString()}</span>
  </span>
);

import React, { useState } from 'react';

interface ChurchMoneyLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'emblem' | 'image' | 'badge';
  withBorder?: boolean;
  logoUrl?: string;
  alt?: string;
}

export const ChurchMoneyLogo: React.FC<ChurchMoneyLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'badge',
  withBorder = true,
  logoUrl = '/assets/aistudio/logo_CDD5_45ac2aa5.png',
  alt = 'Iglesia Casa de Dios - Iglesias Bíblicas Misioneras',
}) => {
  const [hasError, setHasError] = useState(false);

  const sizeMap = {
    xs: 'w-7 h-7 p-0.5',
    sm: 'w-9 h-9 p-0.5',
    md: 'w-12 h-12 p-1',
    lg: 'w-16 h-16 p-1.5',
    xl: 'w-20 h-20 p-2',
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  // If pure emblem is requested or image errored, display the SVG emblem
  if (variant === 'emblem' || (hasError && !logoUrl)) {
    return (
      <div
        className={`${currentSize} rounded-xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center shrink-0 shadow-md ${
          withBorder ? 'border border-amber-500/40 shadow-amber-950/20' : ''
        } ${className}`}
        title="Casa de Dios - Símbolo de Iglesia y Tesorería"
      >
        <svg
          viewBox="0 0 100 100"
          className="w-[85%] h-[85%]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="goldLinear" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="40%" stopColor="#f59e0b" />
              <stop offset="80%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>
          <path
            d="M20,68 L20,44 L50,18 L80,44 L80,68"
            stroke="url(#goldLinear)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line x1="50" y1="4" x2="50" y2="15" stroke="url(#goldLinear)" strokeWidth="3" strokeLinecap="round" />
          <line x1="44" y1="8" x2="56" y2="8" stroke="url(#goldLinear)" strokeWidth="3" strokeLinecap="round" />
          <line x1="46" y1="26" x2="46" y2="76" stroke="url(#goldLinear)" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="54" y1="26" x2="54" y2="76" stroke="url(#goldLinear)" strokeWidth="2.5" strokeLinecap="round" />
          <path
            d="M63,36 C60,30 52,28 47,29 C41,31 39,37 42,42 C46,47 57,48 59,54 C61,60 56,66 48,66 C42,66 37,63 36,58"
            stroke="url(#goldLinear)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line x1="14" y1="72" x2="86" y2="72" stroke="url(#goldLinear)" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  // Official Church Logo display: crisp white container ensuring transparent dove and black typography pop
  return (
    <div
      className={`${currentSize} rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm ${
        withBorder ? 'border border-slate-200/90 ring-1 ring-slate-900/5' : ''
      } ${className}`}
      title={alt}
    >
      <img
        src={hasError ? '/assets/aistudio/logo_CDD5_45ac2aa5.png' : logoUrl}
        alt={alt}
        onError={() => setHasError(true)}
        className="w-full h-full object-contain select-none"
        loading="eager"
      />
    </div>
  );
};

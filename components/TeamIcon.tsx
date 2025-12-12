import React from 'react';

interface TeamIconProps {
  code: string;
  name: string;
  className?: string;
}

export const TeamIcon: React.FC<TeamIconProps> = ({ code, name, className = "w-6 h-4" }) => {
  // Mapping for non-ISO special codes and general flag construction
  const getFlagUrl = (c: string) => {
    const normalized = c.toLowerCase();
    // Special cases for Play-Off placeholders
    if (normalized === 'eu') return 'https://flagcdn.com/w40/un.png'; 
    if (normalized === 'un') return 'https://flagcdn.com/w40/un.png';
    // British constituent nations support
    if (normalized === 'gb-eng') return 'https://flagcdn.com/w40/gb-eng.png';
    if (normalized === 'gb-sct') return 'https://flagcdn.com/w40/gb-sct.png';
    if (normalized === 'gb-wls') return 'https://flagcdn.com/w40/gb-wls.png';
    
    return `https://flagcdn.com/w40/${normalized}.png`;
  };
  
  return (
    <div className={`flex-shrink-0 overflow-hidden rounded-[2px] shadow-[0_1px_3px_rgba(0,0,0,0.15)] border border-slate-200 dark:border-white/10 ${className}`}>
      <img 
        src={getFlagUrl(code)} 
        alt={`${name} flag`}
        className="w-full h-full object-cover select-none pointer-events-none"
        loading="lazy"
        onError={(e) => {
          (e.target as HTMLImageElement).src = 'https://flagcdn.com/w40/un.png';
        }}
      />
    </div>
  );
};

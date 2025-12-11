
import React from 'react';

interface TeamIconProps {
  code: string;
  name: string;
  className?: string;
}

export const TeamIcon: React.FC<TeamIconProps> = ({ code, name, className = "w-6 h-4" }) => {
  // Mapping for non-ISO special codes
  const getFlagUrl = (c: string) => {
    const normalized = c.toLowerCase();
    if (normalized === 'eu') return 'https://flagcdn.com/w40/un.png'; // UEFA placeholder
    if (normalized === 'un') return 'https://flagcdn.com/w40/un.png'; // FIFA placeholder
    return `https://flagcdn.com/w40/${normalized}.png`;
  };
  
  return (
    <div className={`flex-shrink-0 overflow-hidden rounded-sm shadow-sm border border-slate-300/50 dark:border-slate-700/50 ${className}`}>
      <img 
        src={getFlagUrl(code)} 
        alt={`${name} flag`}
        className="w-full h-full object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).src = 'https://flagcdn.com/w40/un.png';
        }}
      />
    </div>
  );
};


import React from 'react';

interface TeamIconProps {
  code: string;
  name: string;
  className?: string;
}

export const TeamIcon: React.FC<TeamIconProps> = ({ code, name, className = "w-6 h-4" }) => {
  // Adjust code for UK subdivisions if necessary (e.g., gb-eng -> gb-eng)
  const flagUrl = `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
  
  return (
    <div className={`flex-shrink-0 overflow-hidden rounded-sm shadow-sm border border-slate-700/50 ${className}`}>
      <img 
        src={flagUrl} 
        alt={`${name} flag`}
        className="w-full h-full object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).src = 'https://flagcdn.com/w40/un.png';
        }}
      />
    </div>
  );
};

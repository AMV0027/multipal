import React from 'react';

// 8bitcn Button Component
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'success' | 'destructive' | 'warning' | 'secondary' | 'arcade-red' | 'arcade-blue' | 'arcade-yellow';
  size?: 'sm' | 'md' | 'lg' | 'arcade-round';
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const variantStyles = {
    primary: 'bg-[#2563EB] active:bg-[#1D4ED8] text-white',
    success: 'bg-[#16A34A] active:bg-[#15803D] text-white',
    destructive: 'bg-[#DC2626] active:bg-[#B91C1C] text-white',
    warning: 'bg-[#EAB308] active:bg-[#CA8A04] text-black font-bold',
    secondary: 'bg-[#2A2B3D] active:bg-[#3B3C54] text-white',
    'arcade-red': 'bg-[#EF4444] active:bg-[#B91C1C] text-white',
    'arcade-blue': 'bg-[#3B82F6] active:bg-[#1D4ED8] text-white',
    'arcade-yellow': 'bg-[#FACC15] active:bg-[#CA8A04] text-black font-bold',
  }[variant];

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-[9px]',
    md: 'px-4 py-3 text-xs',
    lg: 'px-6 py-4 text-sm',
    'arcade-round': 'w-20 h-20 text-2xl font-black rounded-none',
  }[size];

  return (
    <button
      className={`font-retro uppercase tracking-wider inline-flex items-center justify-center border-4 border-black shadow-pixel active:translate-x-1 active:translate-y-1 active:shadow-none transition-transform disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none touch-none ${variantStyles} ${sizeStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// 8bitcn Card Component
export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <div
      className={`bg-[#181926] border-4 border-black shadow-pixel-lg p-5 relative ${className}`}
      {...props}
    >
      {/* 8-bit corner pixels */}
      <div className="absolute -top-1 -left-1 w-2 h-2 bg-black pointer-events-none" />
      <div className="absolute -top-1 -right-1 w-2 h-2 bg-black pointer-events-none" />
      <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-black pointer-events-none" />
      <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-black pointer-events-none" />
      {children}
    </div>
  );
};

// 8bitcn Badge Component
export const Badge: React.FC<{
  variant?: 'green' | 'blue' | 'red' | 'amber' | 'slate';
  className?: string;
  children: React.ReactNode;
}> = ({ variant = 'green', className = '', children }) => {
  const variantStyles = {
    green: 'bg-[#16A34A] text-white',
    blue: 'bg-[#2563EB] text-white',
    red: 'bg-[#DC2626] text-white',
    amber: 'bg-[#EAB308] text-black font-bold',
    slate: 'bg-[#334155] text-white',
  }[variant];

  return (
    <span
      className={`font-retro text-[9px] uppercase px-2 py-1 border-2 border-black shadow-pixel-sm tracking-wider inline-flex items-center space-x-1 ${variantStyles} ${className}`}
    >
      {children}
    </span>
  );
};

// 8bitcn Input Component
export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({
  className = '',
  ...props
}) => {
  return (
    <input
      className={`font-retro uppercase tracking-wider text-xs py-3.5 px-4 bg-[#0D0E15] text-white border-4 border-black shadow-pixel-inset placeholder-slate-600 focus:outline-none focus:border-[#FACC15] ${className}`}
      {...props}
    />
  );
};

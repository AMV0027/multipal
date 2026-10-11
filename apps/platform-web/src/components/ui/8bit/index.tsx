import React from 'react';

// 8bitcn Button Component
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'success' | 'destructive' | 'warning' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const variantStyles = {
    primary: 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white',
    success: 'bg-[#16A34A] hover:bg-[#15803D] text-white',
    destructive: 'bg-[#DC2626] hover:bg-[#B91C1C] text-white',
    warning: 'bg-[#EAB308] hover:bg-[#CA8A04] text-black font-bold',
    secondary: 'bg-[#2A2B3D] hover:bg-[#3B3C54] text-white',
    outline: 'bg-transparent border-4 border-black hover:bg-white/10 text-white',
  }[variant];

  const sizeStyles = {
    sm: 'px-2.5 py-1.5 text-[9px]',
    md: 'px-4 py-2.5 text-xs',
    lg: 'px-6 py-4 text-sm',
  }[size];

  return (
    <button
      className={`font-retro uppercase tracking-wider inline-flex items-center justify-center border-4 border-black shadow-pixel active:translate-x-1 active:translate-y-1 active:shadow-none transition-transform disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none ${variantStyles} ${sizeStyles} ${className}`}
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

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <div
    className={`border-b-4 border-black pb-3 mb-4 flex items-center justify-between ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <h3
    className={`font-retro text-xs sm:text-sm tracking-wider text-[#FACC15] uppercase ${className}`}
    {...props}
  >
    {children}
  </h3>
);

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
      className={`font-retro uppercase tracking-wider text-xs py-3 px-4 bg-[#0D0E15] text-white border-4 border-black shadow-pixel-inset placeholder-slate-600 focus:outline-none focus:border-[#FACC15] ${className}`}
      {...props}
    />
  );
};

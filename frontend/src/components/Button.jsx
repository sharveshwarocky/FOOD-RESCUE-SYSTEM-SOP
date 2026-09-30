import React from 'react';

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  className = '',
  icon: Icon
}) => {
  const base = 'inline-flex items-center justify-center font-medium rounded-xl transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200 active:scale-95',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95',
    outline: 'border border-slate-300 hover:bg-slate-50 text-slate-700 active:scale-95',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-200 active:scale-95',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-200 active:scale-95',
    success: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-200 active:scale-95',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      {children}
    </button>
  );
};

export default Button;

import React from 'react';

const Card = ({
  children,
  className = '',
  glass = false,
  onClick,
  ...props
}) => {
  const baseStyle = 'rounded-2xl border transition-all duration-200';
  const glassStyle = glass
    ? 'glass-panel shadow-glass'
    : 'bg-white border-slate-100 shadow-premium hover:shadow-premium-hover';

  return (
    <div
      onClick={onClick}
      className={`${baseStyle} ${glassStyle} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`p-6 border-b border-slate-50 flex items-center justify-between ${className}`} {...props}>
    {children}
  </div>
);

export const CardBody = ({ children, className = '', ...props }) => (
  <div className={`p-6 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '', ...props }) => (
  <div className={`p-6 border-t border-slate-50 bg-slate-50/50 rounded-b-2xl flex items-center justify-between ${className}`} {...props}>
    {children}
  </div>
);

export default Card;

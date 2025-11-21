import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  elevated?: boolean;
  interactive?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  elevated = false,
  interactive = false,
  onClick,
}) => {
  const baseStyles = 'bg-white rounded-lg border border-gray-200';

  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const shadowStyles = elevated ? 'shadow-lg' : 'shadow-sm';
  const interactiveStyles = interactive
    ? 'cursor-pointer transition-all hover:shadow-md hover:border-gray-300'
    : '';

  return (
    <div
      className={`${baseStyles} ${paddingStyles[padding]} ${shadowStyles} ${interactiveStyles} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({
  children,
  className = '',
  onClick,
}) => {
  return (
    <div
      className={`border-b border-gray-200 pb-3 mb-3 ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
};

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>{children}</h3>;
};

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <div className={className}>{children}</div>;
};

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <div className={`border-t border-gray-200 pt-3 mt-3 ${className}`}>{children}</div>;
};

export default Card;

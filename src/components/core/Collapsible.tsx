import React from 'react';

export interface CollapsibleProps {
  isOpen: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Collapsible: React.FC<CollapsibleProps> = ({ isOpen, children, className = '' }) => {
  return (
    <div
      data-testid="collapsible"
      className={`transition-all duration-500 ${className} ${
        isOpen ? 'max-h-screen opacity-100 my-3' : 'max-h-0 opacity-0 overflow-hidden pointer-events-none'
      }`}>
      {children}
    </div>
  );
};

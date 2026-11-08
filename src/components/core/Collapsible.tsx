import React, { useState } from 'react';

export interface CollapsibleProps {
  isOpen: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Collapsible: React.FC<CollapsibleProps> = ({ isOpen, children, className = '' }) => {
  // Content must clip while the height animates, but once open it can't: that
  // would cut off card shadows and focus rings.
  const [isSettled, setIsSettled] = useState(isOpen);

  return (
    <div
      data-testid="collapsible"
      onTransitionEnd={(event) => {
        if (event.target === event.currentTarget && event.propertyName === 'grid-template-rows') setIsSettled(isOpen);
      }}
      className={`grid transition-all duration-500 ${className} ${
        isOpen ? 'grid-rows-[1fr] opacity-100 my-3' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
      }`}>
      <div className={`min-h-0 min-w-0 ${isOpen && isSettled ? 'overflow-visible' : 'overflow-hidden'}`}>{children}</div>
    </div>
  );
};

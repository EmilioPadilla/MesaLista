import { ReactNode } from 'react';

interface TopNavWrapperProps {
  children: ReactNode;
  hasTopNav?: boolean;
}

export const TopNavWrapper = ({ children, hasTopNav = true }: TopNavWrapperProps) => {
  return <div className={hasTopNav ? 'pt-16' : ''}>{children}</div>;
};

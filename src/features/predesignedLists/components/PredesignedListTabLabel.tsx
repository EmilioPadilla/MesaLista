import { ReactNode } from 'react';

interface PredesignedListTabLabelProps {
  icon: ReactNode;
  name: string;
}

export function PredesignedListTabLabel({ icon: Icon, name }: PredesignedListTabLabelProps) {
  return (
    <span className="flex items-center gap-2">
      {Icon}
      <span className="hidden lg:inline">{name}</span>
      <span className="lg:hidden">{name}</span>
    </span>
  );
}

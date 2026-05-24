import { GROUPS, type SectionId } from './nav-config';

interface SettingsSidebarProps {
  activeSection: SectionId;
  onSectionChange: (id: SectionId) => void;
}

export function SettingsSidebar({ activeSection, onSectionChange }: SettingsSidebarProps) {
  return (
    <aside className="hidden lg:block">
      <nav className="sticky top-8 space-y-7">
        {GROUPS.map((group) => (
          <div key={group.label}>
            <div className="text-[11px] tracking-[0.22em] uppercase text-foreground/55 font-bold px-3 mb-2">{group.label}</div>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                const isDanger = item.danger;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => onSectionChange(item.id)}
                      className={`group cursor-pointer relative w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                        isActive
                          ? isDanger
                            ? 'bg-red-500/10 text-red-700 font-semibold'
                            : 'bg-[#d4704a]/12 text-[#a8542f] font-semibold'
                          : isDanger
                            ? 'text-red-700/85 font-medium hover:bg-red-50/70 hover:text-red-800'
                            : 'text-foreground/75 font-medium hover:bg-[#faf9f8] hover:text-foreground'
                      }`}>
                      <span
                        className={`absolute left-0 top-1/2 -translate-y-1/2 w-[2px] rounded-r transition-all duration-200 ${
                          isActive ? (isDanger ? 'bg-red-500 h-6' : 'bg-[#d4704a] h-6') : 'h-0 bg-transparent'
                        }`}
                        aria-hidden
                      />
                      <Icon className={`h-4 w-4 transition-opacity ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}

import { SECTION_LOOKUP, type SectionId } from './nav-config';

interface SectionHeaderProps {
  sectionId: SectionId;
}

export function SectionHeader({ sectionId }: SectionHeaderProps) {
  const meta = SECTION_LOOKUP[sectionId];
  return (
    <div className="mb-8 pb-6 border-b border-border/40">
      <p className="text-[11px] tracking-[0.22em] uppercase text-[#d4704a] font-bold mb-2">
        {meta.group} <span className="text-foreground/40 mx-1">·</span> {meta.label}
      </p>
      <h2 className="text-3xl sm:text-4xl tracking-tight text-foreground">{meta.title}</h2>
      <p className="text-sm text-foreground/65 mt-2 max-w-2xl">{meta.description}</p>
    </div>
  );
}

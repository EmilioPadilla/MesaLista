import { Select } from 'antd';

interface GiftListSelectorProps {
  giftLists: Array<{ id: number; title?: string; coupleName?: string }> | undefined;
  activeGiftListId: number | null;
  activeTitle: string;
  onChange: (id: number) => void;
}

export function GiftListSelector({ giftLists, activeGiftListId, activeTitle, onChange }: GiftListSelectorProps) {
  if (!giftLists || giftLists.length <= 1) return null;

  return (
    <div className="mb-8 p-4 rounded-2xl bg-[#faf9f8] border border-border/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <p className="text-[11px] tracking-[0.2em] uppercase text-foreground/55 font-bold">Mesa activa</p>
        <p className="text-base font-semibold text-foreground mt-0.5">{activeTitle}</p>
      </div>
      <Select
        value={activeGiftListId?.toString()}
        onChange={(v) => onChange(parseInt(v))}
        className="w-full sm:w-72"
        size="large"
        options={giftLists.map((l) => ({ value: l.id.toString(), label: l.title || l.coupleName }))}
      />
    </div>
  );
}

import { describe, it, expect } from 'vitest';
import { GROUPS, SECTION_LOOKUP, GIFT_LIST_SECTIONS, type SectionId } from './nav-config';

describe('nav-config', () => {
  it('every group has at least one item', () => {
    GROUPS.forEach((g) => expect(g.items.length).toBeGreaterThan(0));
  });

  it('every item id is unique across all groups', () => {
    const ids = GROUPS.flatMap((g) => g.items.map((i) => i.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('SECTION_LOOKUP contains every item from GROUPS', () => {
    GROUPS.forEach((g) => {
      g.items.forEach((i) => {
        expect(SECTION_LOOKUP[i.id]).toBe(i);
      });
    });
  });

  it('every section has a non-empty title and description', () => {
    GROUPS.forEach((g) => {
      g.items.forEach((i) => {
        expect(i.title.length).toBeGreaterThan(0);
        expect(i.description.length).toBeGreaterThan(0);
      });
    });
  });

  it('GIFT_LIST_SECTIONS only contains valid SectionIds', () => {
    GIFT_LIST_SECTIONS.forEach((id) => {
      expect(SECTION_LOOKUP[id]).toBeDefined();
    });
  });

  it("item.group always matches its parent group's label", () => {
    GROUPS.forEach((g) => {
      g.items.forEach((i) => {
        expect(i.group).toBe(g.label);
      });
    });
  });

  it("danger flag is only on items in the 'Zona avanzada' group", () => {
    GROUPS.forEach((g) => {
      g.items.forEach((i) => {
        if (i.danger) expect(g.label).toBe('Zona avanzada');
      });
    });
  });

  it('default profile section exists (used as fallback by Settings)', () => {
    const fallback: SectionId = 'profile';
    expect(SECTION_LOOKUP[fallback]).toBeDefined();
  });
});

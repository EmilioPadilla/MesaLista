import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SectionHeader } from 'src/features/settings/components/SectionHeader';
import { SECTION_LOOKUP } from 'src/features/settings/components/nav-config';

describe('SectionHeader', () => {
  it('renders title, description and group for the given section', () => {
    render(<SectionHeader sectionId="profile" />);
    const meta = SECTION_LOOKUP.profile;

    expect(screen.getByRole('heading', { level: 2, name: meta.title })).toBeInTheDocument();
    expect(screen.getByText(meta.description)).toBeInTheDocument();
    // Eyebrow includes the group name
    expect(screen.getByText(new RegExp(meta.group, 'i'))).toBeInTheDocument();
  });

  it('changes content when given a different sectionId', () => {
    const { rerender } = render(<SectionHeader sectionId="profile" />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(SECTION_LOOKUP.profile.title);

    rerender(<SectionHeader sectionId="danger" />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(SECTION_LOOKUP.danger.title);
    expect(screen.getByText(SECTION_LOOKUP.danger.description)).toBeInTheDocument();
  });

  it('renders the eyebrow with both group and label', () => {
    const { container } = render(<SectionHeader sectionId="fees" />);
    const meta = SECTION_LOOKUP.fees;
    // The eyebrow is the small uppercase <p> immediately above the <h2>
    const eyebrow = container.querySelector('p.uppercase');
    expect(eyebrow).not.toBeNull();
    expect(eyebrow!.textContent).toContain(meta.group);
    expect(eyebrow!.textContent).toContain(meta.label);
  });
});

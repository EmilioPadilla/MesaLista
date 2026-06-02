import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SectionHeader } from './SectionHeader';
import { SECTION_LOOKUP } from './nav-config';

describe('SectionHeader', () => {
  it('renders title, description and group for the given section', () => {
    render(<SectionHeader sectionId="perfil" />);
    const meta = SECTION_LOOKUP.perfil;

    expect(screen.getByRole('heading', { level: 2, name: meta.title })).toBeInTheDocument();
    expect(screen.getByText(meta.description)).toBeInTheDocument();
    // Eyebrow includes the group name
    expect(screen.getByText(new RegExp(meta.group, 'i'))).toBeInTheDocument();
  });

  it('changes content when given a different sectionId', () => {
    const { rerender } = render(<SectionHeader sectionId="perfil" />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(SECTION_LOOKUP.perfil.title);

    rerender(<SectionHeader sectionId="eliminar-cuenta" />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(SECTION_LOOKUP['eliminar-cuenta'].title);
    expect(screen.getByText(SECTION_LOOKUP['eliminar-cuenta'].description)).toBeInTheDocument();
  });

  it('renders the eyebrow with both group and label', () => {
    const { container } = render(<SectionHeader sectionId="comisiones" />);
    const meta = SECTION_LOOKUP.comisiones;
    // The eyebrow is the small uppercase <p> immediately above the <h2>
    const eyebrow = container.querySelector('p.uppercase');
    expect(eyebrow).not.toBeNull();
    expect(eyebrow!.textContent).toContain(meta.group);
    expect(eyebrow!.textContent).toContain(meta.label);
  });
});

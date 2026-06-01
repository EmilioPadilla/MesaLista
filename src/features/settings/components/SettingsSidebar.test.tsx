import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsSidebar } from './SettingsSidebar';
import { GROUPS } from './nav-config';

describe('SettingsSidebar', () => {
  it('renders every group label and item label', () => {
    render(<SettingsSidebar activeSection="profile" onSectionChange={vi.fn()} />);
    GROUPS.forEach((g) => {
      expect(screen.getByText(g.label)).toBeInTheDocument();
      g.items.forEach((i) => {
        expect(screen.getByText(i.label)).toBeInTheDocument();
      });
    });
  });

  it('calls onSectionChange with item id when an item is clicked', () => {
    const onChange = vi.fn();
    render(<SettingsSidebar activeSection="profile" onSectionChange={onChange} />);

    fireEvent.click(screen.getByText('Contraseña'));
    expect(onChange).toHaveBeenCalledWith('password');

    fireEvent.click(screen.getByText('Comisiones de pago'));
    expect(onChange).toHaveBeenCalledWith('fees');
  });

  it('applies active styling to the active item only', () => {
    render(<SettingsSidebar activeSection="rsvp" onSectionChange={vi.fn()} />);

    const activeBtn = screen.getByText('Mensajes RSVP').closest('button')!;
    const inactiveBtn = screen.getByText('Perfil').closest('button')!;

    expect(activeBtn.className).toContain('font-semibold');
    expect(activeBtn.className).toContain('bg-[#d4704a]/12');
    expect(inactiveBtn.className).not.toContain('bg-[#d4704a]/12');
  });

  it('applies red styling to the active danger item', () => {
    render(<SettingsSidebar activeSection="danger" onSectionChange={vi.fn()} />);
    const dangerBtn = screen.getByText('Eliminar cuenta').closest('button')!;
    expect(dangerBtn.className).toContain('bg-red-500/10');
    expect(dangerBtn.className).toContain('text-red-700');
  });

  it('non-active danger item still uses red text', () => {
    render(<SettingsSidebar activeSection="profile" onSectionChange={vi.fn()} />);
    const dangerBtn = screen.getByText('Eliminar cuenta').closest('button')!;
    expect(dangerBtn.className).toMatch(/text-red-700/);
  });
});

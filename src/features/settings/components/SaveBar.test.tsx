import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SaveBar } from './SaveBar';

describe('SaveBar', () => {
  it('renders the provided label', () => {
    render(<SaveBar onSave={vi.fn()} disabled={false} loading={false} label="Guardar perfil" />);
    expect(screen.getByRole('button', { name: /guardar perfil/i })).toBeInTheDocument();
  });

  it('shows "No hay cambios sin guardar." when disabled and not loading', () => {
    render(<SaveBar onSave={vi.fn()} disabled={true} loading={false} label="Guardar" />);
    expect(screen.getByText(/no hay cambios sin guardar/i)).toBeInTheDocument();
  });

  it('shows "Tienes cambios sin guardar." when enabled', () => {
    render(<SaveBar onSave={vi.fn()} disabled={false} loading={false} label="Guardar" />);
    expect(screen.getByText(/tienes cambios sin guardar/i)).toBeInTheDocument();
  });

  it('shows "Tienes cambios sin guardar." when saving (disabled + loading)', () => {
    render(<SaveBar onSave={vi.fn()} disabled={true} loading={true} label="Guardar" loadingLabel="Guardando..." />);
    expect(screen.getByText(/tienes cambios sin guardar/i)).toBeInTheDocument();
  });

  it('shows loading label when loading', () => {
    render(<SaveBar onSave={vi.fn()} disabled={true} loading={true} label="Guardar" loadingLabel="Actualizando..." />);
    expect(screen.getByRole('button', { name: /actualizando/i })).toBeInTheDocument();
  });

  it('falls back to default loading label when loadingLabel is not provided', () => {
    render(<SaveBar onSave={vi.fn()} disabled={true} loading={true} label="Guardar" />);
    expect(screen.getByRole('button', { name: /guardando/i })).toBeInTheDocument();
  });

  it('calls onSave when clicked', () => {
    const onSave = vi.fn();
    render(<SaveBar onSave={onSave} disabled={false} loading={false} label="Guardar" />);
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('does not call onSave when disabled', () => {
    const onSave = vi.fn();
    render(<SaveBar onSave={onSave} disabled={true} loading={false} label="Guardar" />);
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));
    expect(onSave).not.toHaveBeenCalled();
  });
});

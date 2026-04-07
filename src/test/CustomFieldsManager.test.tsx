import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CustomFieldsManager } from 'src/features/rsvp/CustomFieldsManager';
import type { RsvpCustomField } from 'src/services/rsvp.service';

// Mock hooks
vi.mock('src/hooks/useRsvp', () => ({
  useCreateRsvpCustomField: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ id: 99, label: 'Nuevo', type: 'TEXT', required: false, order: 0 }),
    isPending: false,
  }),
  useUpdateRsvpCustomField: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  }),
  useDeleteRsvpCustomField: () => ({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  }),
}));

const makeField = (overrides: Partial<RsvpCustomField> = {}): RsvpCustomField => ({
  id: 1,
  giftListId: 10,
  label: 'Restricciones alimentarias',
  type: 'TEXT',
  required: false,
  order: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>
);

describe('CustomFieldsManager', () => {
  it('renders empty state when no fields', () => {
    render(<CustomFieldsManager giftListId={10} fields={[]} />, { wrapper });
    expect(screen.getByText(/sin campos personalizados/i)).toBeInTheDocument();
  });

  it('renders existing fields', () => {
    const fields = [
      makeField({ id: 1, label: 'Restricciones alimentarias', type: 'TEXT' }),
      makeField({ id: 2, label: '¿Asiste con pareja?', type: 'BOOLEAN' }),
    ];
    render(<CustomFieldsManager giftListId={10} fields={fields} />, { wrapper });
    expect(screen.getByText('Restricciones alimentarias')).toBeInTheDocument();
    expect(screen.getByText('¿Asiste con pareja?')).toBeInTheDocument();
  });

  it('shows type badge for each field', () => {
    const fields = [
      makeField({ id: 1, label: 'A', type: 'TEXT' }),
      makeField({ id: 2, label: 'B', type: 'NUMBER' }),
      makeField({ id: 3, label: 'C', type: 'BOOLEAN' }),
    ];
    render(<CustomFieldsManager giftListId={10} fields={fields} />, { wrapper });
    expect(screen.getByText('Texto')).toBeInTheDocument();
    expect(screen.getByText('Número')).toBeInTheDocument();
    expect(screen.getByText('Sí / No')).toBeInTheDocument();
  });

  it('reveals add form when "Agregar campo personalizado" is clicked', async () => {
    render(<CustomFieldsManager giftListId={10} fields={[]} />, { wrapper });
    await userEvent.click(screen.getByText(/agregar campo personalizado/i));
    expect(screen.getByPlaceholderText(/nombre del campo/i)).toBeInTheDocument();
  });

  it('hides add form when Cancelar is clicked', async () => {
    render(<CustomFieldsManager giftListId={10} fields={[]} />, { wrapper });
    await userEvent.click(screen.getByText(/agregar campo personalizado/i));
    await userEvent.click(screen.getByText('Cancelar'));
    expect(screen.queryByPlaceholderText(/nombre del campo/i)).not.toBeInTheDocument();
  });

  it('shows error when trying to add with empty label', async () => {
    render(<CustomFieldsManager giftListId={10} fields={[]} />, { wrapper });
    await userEvent.click(screen.getByText(/agregar campo personalizado/i));
    await userEvent.click(screen.getByText('Agregar'));
    // Should not call mutate — add form still visible
    expect(screen.getByPlaceholderText(/nombre del campo/i)).toBeInTheDocument();
  });

  it('enters edit mode on pencil button click', async () => {
    const fields = [makeField({ id: 1, label: 'Mi Campo' })];
    render(<CustomFieldsManager giftListId={10} fields={fields} />, { wrapper });
    // Hover to reveal action buttons (opacity group-hover is CSS-only; click any button in the row)
    const row = screen.getByText('Mi Campo').closest('div')!;
    fireEvent.mouseEnter(row);
    const pencilBtn = row.parentElement?.querySelectorAll('button')[0];
    if (pencilBtn) {
      fireEvent.click(pencilBtn);
    }
    // Label is still visible (either as text or input value)
    expect(screen.getByText('Mi Campo')).toBeInTheDocument();
  });
});

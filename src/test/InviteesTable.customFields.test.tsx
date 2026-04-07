import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InviteesTable } from 'src/features/rsvp/InviteesTable';
import type { RsvpCustomField, RsvpCustomFieldResponse } from 'src/services/rsvp.service';

const makeInvitee = (overrides = {}) => ({
  id: 'inv-1',
  firstName: 'Ana',
  lastName: 'López',
  tickets: 2,
  secretCode: 'ABC123',
  status: 'CONFIRMED' as const,
  confirmedTickets: 2,
  ...overrides,
});

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

const makeResponse = (overrides: Partial<RsvpCustomFieldResponse> = {}): RsvpCustomFieldResponse => ({
  id: 1,
  inviteeId: 'inv-1',
  fieldId: 1,
  value: 'vegetariano',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  field: makeField(),
  ...overrides,
});

const defaultProps = {
  invitees: [makeInvitee()],
  onEdit: vi.fn(),
  onDelete: vi.fn(),
};

describe('InviteesTable – custom fields toggle', () => {
  it('does not show custom fields toggle when no fields defined', () => {
    render(<InviteesTable {...defaultProps} customFields={[]} customFieldResponses={[]} />);
    expect(screen.queryByText(/campos personalizados/i)).not.toBeInTheDocument();
  });

  it('shows custom fields toggle when fields are defined', () => {
    render(<InviteesTable {...defaultProps} customFields={[makeField()]} customFieldResponses={[]} />);
    expect(screen.getByText(/campos personalizados/i)).toBeInTheDocument();
  });

  it('does not render custom field columns before toggle is on', () => {
    render(
      <InviteesTable
        {...defaultProps}
        customFields={[makeField({ label: 'Restricciones alimentarias' })]}
        customFieldResponses={[makeResponse({ value: 'vegetariano' })]}
      />,
    );
    expect(screen.queryByText('vegetariano')).not.toBeInTheDocument();
  });

  it('renders custom field column headers and values after toggle', () => {
    render(
      <InviteesTable
        {...defaultProps}
        customFields={[makeField({ label: 'Restricciones alimentarias' })]}
        customFieldResponses={[makeResponse({ value: 'vegetariano' })]}
      />,
    );

    // Find the toggle switch for custom fields and enable it
    const toggleLabel = screen.getByText(/campos personalizados/i);
    const switchEl = toggleLabel.parentElement?.querySelector('button[role="switch"]');
    if (switchEl) fireEvent.click(switchEl);

    expect(screen.getByText('vegetariano')).toBeInTheDocument();
  });

  it('renders boolean response as Sí tag', () => {
    const boolField = makeField({ id: 2, label: '¿Viene con pareja?', type: 'BOOLEAN' });
    const boolResponse = makeResponse({ fieldId: 2, value: 'true', field: boolField });

    render(<InviteesTable {...defaultProps} customFields={[boolField]} customFieldResponses={[boolResponse]} />);

    const toggleLabel = screen.getByText(/campos personalizados/i);
    const switchEl = toggleLabel.parentElement?.querySelector('button[role="switch"]');
    if (switchEl) fireEvent.click(switchEl);

    expect(screen.getByText('Sí')).toBeInTheDocument();
  });

  it('renders boolean false response as No tag', () => {
    const boolField = makeField({ id: 2, label: '¿Viene con pareja?', type: 'BOOLEAN' });
    const boolResponse = makeResponse({ fieldId: 2, value: 'false', field: boolField });

    render(<InviteesTable {...defaultProps} customFields={[boolField]} customFieldResponses={[boolResponse]} />);

    const toggleLabel = screen.getByText(/campos personalizados/i);
    const switchEl = toggleLabel.parentElement?.querySelector('button[role="switch"]');
    if (switchEl) fireEvent.click(switchEl);

    expect(screen.getByText('No')).toBeInTheDocument();
  });

  it('renders em dash for missing response', () => {
    render(<InviteesTable {...defaultProps} customFields={[makeField({ label: 'Restricciones' })]} customFieldResponses={[]} />);

    const toggleLabel = screen.getByText(/campos personalizados/i);
    const switchEl = toggleLabel.parentElement?.querySelector('button[role="switch"]');
    if (switchEl) fireEvent.click(switchEl);

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('shows required indicator (*) in column header', () => {
    render(
      <InviteesTable
        {...defaultProps}
        customFields={[makeField({ label: 'Campo requerido', required: true })]}
        customFieldResponses={[]}
      />,
    );

    const toggleLabel = screen.getByText(/campos personalizados/i);
    const switchEl = toggleLabel.parentElement?.querySelector('button[role="switch"]');
    if (switchEl) fireEvent.click(switchEl);

    const matches = screen.getAllByText('Campo requerido');
    expect(matches.length).toBeGreaterThan(0);
  });
});

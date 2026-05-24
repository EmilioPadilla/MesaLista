import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DangerZoneSection } from 'src/features/settings/components/DangerZoneSection';

describe('DangerZoneSection', () => {
  it('renders the danger heading and warning copy', () => {
    render(<DangerZoneSection onDeleteClick={vi.fn()} />);
    expect(screen.getByRole('heading', { name: /eliminar cuenta/i })).toBeInTheDocument();
    expect(screen.getByText(/no se puede deshacer/i)).toBeInTheDocument();
  });

  it('fires onDeleteClick when the delete button is clicked', () => {
    const onDelete = vi.fn();
    render(<DangerZoneSection onDeleteClick={onDelete} />);
    fireEvent.click(screen.getByRole('button', { name: /eliminar mi cuenta/i }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Form } from 'antd';
import { ProfileSection } from './ProfileSection';

interface HarnessProps {
  isWeddingAccount?: boolean;
  hasChanges?: boolean;
  isUpdating?: boolean;
  onSave?: () => void;
  onWeddingAccountChange?: (b: boolean) => void;
  onValuesChange?: () => void;
}

function Harness(props: HarnessProps) {
  const [form] = Form.useForm();
  return (
    <ProfileSection
      form={form}
      isWeddingAccount={props.isWeddingAccount ?? false}
      onWeddingAccountChange={props.onWeddingAccountChange ?? vi.fn()}
      onValuesChange={props.onValuesChange ?? vi.fn()}
      isUpdating={props.isUpdating ?? false}
      hasChanges={props.hasChanges ?? false}
      onSave={props.onSave ?? vi.fn()}
    />
  );
}

describe('ProfileSection', () => {
  it('renders personal info field labels', () => {
    render(<Harness />);
    expect(screen.getByText('Nombre')).toBeInTheDocument();
    expect(screen.getByText('Apellido')).toBeInTheDocument();
    expect(screen.getByText('Teléfono')).toBeInTheDocument();
  });

  it('renders the wedding-account checkbox', () => {
    render(<Harness />);
    expect(screen.getByText(/esta es una cuenta de boda/i)).toBeInTheDocument();
  });

  it('renders subsection headings', () => {
    render(<Harness />);
    expect(screen.getByRole('heading', { level: 3, name: /^datos personales$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /^pareja$/i })).toBeInTheDocument();
  });

  it('fires onWeddingAccountChange when checkbox is toggled', () => {
    const onChange = vi.fn();
    render(<Harness onWeddingAccountChange={onChange} />);
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('renders spouse fields (collapsible always mounts children)', () => {
    render(<Harness isWeddingAccount={true} />);
    expect(screen.getByText(/nombre de la pareja/i)).toBeInTheDocument();
    expect(screen.getByText(/apellido de la pareja/i)).toBeInTheDocument();
  });

  it('disables save when no changes', () => {
    render(<Harness hasChanges={false} />);
    const btn = screen.getByRole('button', { name: /guardar perfil/i });
    expect(btn).toBeDisabled();
  });

  it('enables save when there are changes', () => {
    render(<Harness hasChanges={true} />);
    const btn = screen.getByRole('button', { name: /guardar perfil/i });
    expect(btn).not.toBeDisabled();
  });

  it('fires onSave when save button is clicked', () => {
    const onSave = vi.fn();
    render(<Harness hasChanges={true} onSave={onSave} />);
    fireEvent.click(screen.getByRole('button', { name: /guardar perfil/i }));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('shows "Guardando..." when isUpdating', () => {
    render(<Harness hasChanges={true} isUpdating={true} />);
    expect(screen.getByRole('button', { name: /guardando/i })).toBeInTheDocument();
  });
});

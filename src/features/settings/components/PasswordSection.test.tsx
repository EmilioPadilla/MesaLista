import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Form } from 'antd';
import { PasswordSection } from './PasswordSection';

interface HarnessProps {
  password?: string;
  hasChanges?: boolean;
  isUpdating?: boolean;
  onSave?: () => void;
  onValuesChange?: () => void;
}

function Harness(props: HarnessProps) {
  const [form] = Form.useForm();
  return (
    <PasswordSection
      form={form}
      password={props.password}
      onValuesChange={props.onValuesChange ?? vi.fn()}
      isUpdating={props.isUpdating ?? false}
      hasChanges={props.hasChanges ?? false}
      onSave={props.onSave ?? vi.fn()}
    />
  );
}

describe('PasswordSection', () => {
  it('renders the three password field labels', () => {
    render(<Harness />);
    expect(screen.getByText('Contraseña actual')).toBeInTheDocument();
    expect(screen.getByText('Nueva contraseña')).toBeInTheDocument();
    expect(screen.getByText('Confirmar nueva contraseña')).toBeInTheDocument();
  });

  it('does not render the password strength indicator when password is empty', () => {
    render(<Harness password={undefined} />);
    // Strength indicator includes checks like uppercase / lowercase hints
    expect(screen.queryByText(/may[uú]scula/i)).not.toBeInTheDocument();
  });

  it('renders the password strength indicator when a password is provided', () => {
    render(<Harness password="abc12345" />);
    // PasswordStrengthIndicator renders criteria text in Spanish
    expect(screen.queryByText(/may[uú]scula/i)).toBeInTheDocument();
  });

  it('disables save when no changes', () => {
    render(<Harness hasChanges={false} />);
    expect(screen.getByRole('button', { name: /actualizar contrase/i })).toBeDisabled();
  });

  it('enables save when there are changes', () => {
    render(<Harness hasChanges={true} />);
    expect(screen.getByRole('button', { name: /actualizar contrase/i })).not.toBeDisabled();
  });

  it('fires onSave when save button is clicked', () => {
    const onSave = vi.fn();
    render(<Harness hasChanges={true} onSave={onSave} />);
    fireEvent.click(screen.getByRole('button', { name: /actualizar contrase/i }));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('shows "Actualizando..." when isUpdating', () => {
    render(<Harness hasChanges={true} isUpdating={true} />);
    expect(screen.getByRole('button', { name: /actualizando/i })).toBeInTheDocument();
  });
});

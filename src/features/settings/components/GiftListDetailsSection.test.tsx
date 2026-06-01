import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Form } from 'antd';
import { GiftListDetailsSection } from './GiftListDetailsSection';

interface HarnessProps {
  slug?: string;
  slugError?: string;
  slugCheck?: { available: boolean } | undefined;
  isCheckingSlug?: boolean;
  userSlug?: string;
  hasChanges?: boolean;
  isUpdating?: boolean;
  onSlugChange?: (v: string) => void;
  onSave?: () => void;
  onValuesChange?: () => void;
}

function Harness(props: HarnessProps) {
  const [form] = Form.useForm();
  return (
    <GiftListDetailsSection
      form={form}
      slug={props.slug ?? 'sol-y-emilio'}
      slugError={props.slugError ?? ''}
      slugCheck={props.slugCheck}
      isCheckingSlug={props.isCheckingSlug ?? false}
      userSlug={props.userSlug ?? 'sol-y-emilio'}
      onSlugChange={props.onSlugChange ?? vi.fn()}
      onValuesChange={props.onValuesChange ?? vi.fn()}
      isUpdating={props.isUpdating ?? false}
      hasChanges={props.hasChanges ?? false}
      onSave={props.onSave ?? vi.fn()}
    />
  );
}

describe('GiftListDetailsSection', () => {
  it('renders all subsection headings', () => {
    render(<Harness />);
    expect(screen.getByRole('heading', { level: 3, name: /^enlace público$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /^evento$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /^mensaje a tus invitados$/i })).toBeInTheDocument();
  });

  it('renders all field labels', () => {
    render(<Harness />);
    expect(screen.getByText(/id de la pareja/i)).toBeInTheDocument();
    expect(screen.getByText(/lugar del evento/i)).toBeInTheDocument();
    expect(screen.getByText(/ciudad, estado/i)).toBeInTheDocument();
    expect(screen.getByText(/fecha del evento/i)).toBeInTheDocument();
  });

  it('shows the URL addon prefix', () => {
    render(<Harness />);
    expect(screen.getByText('mesalista.com.mx/')).toBeInTheDocument();
  });

  it('shows the slug helper hint', () => {
    render(<Harness />);
    expect(screen.getByText(/solo letras minúsculas, números y guiones/i)).toBeInTheDocument();
  });

  it('calls onSlugChange with sanitized value when slug input changes', () => {
    const onSlug = vi.fn();
    const { container } = render(<Harness onSlugChange={onSlug} />);

    // The slug input is the only one wrapped with the "mesalista.com.mx/" addon
    const slugInput = container.querySelector('.ant-input-group input') as HTMLInputElement;
    expect(slugInput).toBeTruthy();
    fireEvent.change(slugInput, { target: { value: 'Sol Y Emilio!@#' } });

    // Lowercased, non-alphanumeric stripped
    expect(onSlug).toHaveBeenCalledWith('solyemilio');
  });

  it('shows availability error when slugError is set', () => {
    render(<Harness slugError="Este enlace ya está en uso. Por favor elige otro." slug="alguien-mas" userSlug="sol-y-emilio" />);
    expect(screen.getByText(/ya está en uso/i)).toBeInTheDocument();
  });

  it('shows the warning Alert when the slug has been changed', () => {
    render(<Harness slug="nuevo-slug" userSlug="sol-y-emilio" />);
    expect(screen.getByText(/la url anterior dejará de funcionar/i)).toBeInTheDocument();
  });

  it('does not show the warning Alert when the slug is unchanged', () => {
    render(<Harness slug="sol-y-emilio" userSlug="sol-y-emilio" />);
    expect(screen.queryByText(/la url anterior dejará de funcionar/i)).not.toBeInTheDocument();
  });

  it('shows availability check progress', () => {
    render(<Harness slug="nuevo-slug" userSlug="sol-y-emilio" isCheckingSlug={true} />);
    expect(screen.getByText(/verificando disponibilidad/i)).toBeInTheDocument();
  });

  it('shows availability success message when slug is available', () => {
    render(<Harness slug="nuevo-slug" userSlug="sol-y-emilio" slugCheck={{ available: true }} />);
    expect(screen.getByText(/este enlace está disponible/i)).toBeInTheDocument();
  });

  it('disables save when no changes', () => {
    render(<Harness hasChanges={false} />);
    expect(screen.getByRole('button', { name: /guardar información/i })).toBeDisabled();
  });

  it('fires onSave when save button is clicked', () => {
    const onSave = vi.fn();
    render(<Harness hasChanges={true} onSave={onSave} />);
    fireEvent.click(screen.getByRole('button', { name: /guardar información/i }));
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});

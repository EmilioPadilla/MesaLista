import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CoverImageSection } from 'src/features/settings/components/CoverImageSection';

describe('CoverImageSection', () => {
  it('shows the placeholder when there is no image', () => {
    render(<CoverImageSection coverImage="" isUploadingImage={false} onImageUpload={vi.fn()} />);
    expect(screen.getByText(/sin imagen de portada/i)).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('shows the image when a cover URL is provided', () => {
    render(<CoverImageSection coverImage="https://example.com/cover.jpg" isUploadingImage={false} onImageUpload={vi.fn()} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/cover.jpg');
  });

  it('shows the uploading message when isUploadingImage is true', () => {
    render(<CoverImageSection coverImage="" isUploadingImage={true} onImageUpload={vi.fn()} />);
    expect(screen.getByText(/subiendo imagen/i)).toBeInTheDocument();
  });

  it('shows the recommendation copy when not uploading', () => {
    render(<CoverImageSection coverImage="" isUploadingImage={false} onImageUpload={vi.fn()} />);
    expect(screen.getByText(/1920 × 820/)).toBeInTheDocument();
  });

  it('fires onImageUpload when a file is selected', () => {
    const onUpload = vi.fn();
    const { container } = render(<CoverImageSection coverImage="" isUploadingImage={false} onImageUpload={onUpload} />);

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeTruthy();

    const file = new File(['(⌐□_□)'], 'cover.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });

    expect(onUpload).toHaveBeenCalledTimes(1);
  });

  it('disables the file input while uploading', () => {
    const { container } = render(<CoverImageSection coverImage="" isUploadingImage={true} onImageUpload={vi.fn()} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });
});

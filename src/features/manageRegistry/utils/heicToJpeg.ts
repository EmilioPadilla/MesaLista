// Browsers other than Safari can't render HEIC/HEIF natively, so a `File` with
// that MIME type produces an empty preview and an un-displayable upload. We
// convert to JPEG client-side before anything else touches the file.

const HEIC_MIME = new Set(['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence']);

// Exported so callers can branch synchronously: an unconditional `await
// convertHeicToJpegIfNeeded(...)` defers state updates by a microtask even for
// JPEGs, which raced with form submission and silently dropped the upload.
export const isHeic = (file: File): boolean => {
  if (HEIC_MIME.has(file.type.toLowerCase())) return true;
  // Some browsers (notably Chrome on macOS) report an empty `type` for HEIC,
  // so fall back to the extension.
  const name = file.name.toLowerCase();
  return name.endsWith('.heic') || name.endsWith('.heif');
};

export const convertHeicToJpegIfNeeded = async (file: File): Promise<File> => {
  if (!isHeic(file)) return file;

  const { default: convert } = await import('heic-convert/browser');
  const inputBuffer = await file.arrayBuffer();
  const outputBuffer = await convert({
    buffer: new Uint8Array(inputBuffer),
    format: 'JPEG',
    quality: 0.9,
  });
  const newName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
  return new File([outputBuffer], newName, { type: 'image/jpeg', lastModified: Date.now() });
};

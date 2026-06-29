import apiClient from 'services/client';
import { fileEndpoints } from 'services/files.endpoints';

/**
 * Uploads a local image (from expo-image-picker) to the R2-backed `/upload`
 * endpoint and returns the public URL.
 *
 * The shared `fileService.uploadFile` is built around the web `File` API and
 * sets `Content-Type: multipart/form-data` by hand, which prevents fetch from
 * adding the multipart boundary. On native we instead append a
 * `{ uri, name, type }` part and let the fetch client set the boundary itself
 * (it skips the header when the body is FormData).
 */
export async function uploadImageAsync(uri: string): Promise<string> {
  const name = uri.split('/').pop() || `gift-${Date.now()}.jpg`;
  const match = /\.(\w+)$/.exec(name);
  const ext = match?.[1]?.toLowerCase();
  const type = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  const formData = new FormData();
  // React Native's FormData accepts a file descriptor object for the part.
  formData.append('image', { uri, name, type } as unknown as Blob);

  const res = await apiClient.post<{ url: string }>(fileEndpoints.upload, formData);
  return res.data.url;
}

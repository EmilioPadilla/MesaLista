import apiClient from './client';

export const fileService = {
  /**
   * Uploads a file to the server
   * @param file The file to upload
   * @returns The URL of the uploaded file
   */
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file, file.name);

    const res = await apiClient.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data.url; // This is the R2 public URL
  },
};

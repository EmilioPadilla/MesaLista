import { truncate } from 'lodash-es';
import { acceptedImageTypes, maxFileSize } from 'config/files';

/**
 * Recursively processes dropped items (files and directories) and extracts all files
 *
 * @param items DataTransferItemList from the drop event
 * @returns Promise that resolves with an array of all files found
 */
export const processDroppedItems = async (items: DataTransferItemList): Promise<File[]> => {
  const allFiles: File[] = [];

  const processEntry = async (entry: FileSystemEntry): Promise<void> => {
    return new Promise((resolve) => {
      if (entry.isFile) {
        // Handle file entry
        const fileEntry = entry as FileSystemFileEntry;
        fileEntry.file((file) => {
          allFiles.push(file);
          resolve();
        });
      } else if (entry.isDirectory) {
        // Handle directory entry
        const dirEntry = entry as FileSystemDirectoryEntry;
        const dirReader = dirEntry.createReader();

        // Read all entries in the directory
        const readEntries = (): Promise<void> => {
          return new Promise((resolveRead) => {
            dirReader.readEntries(async (entries) => {
              if (entries.length > 0) {
                // Process all entries in the current batch
                await Promise.all(entries.map(processEntry));
                // Read more entries if available
                await readEntries();
                resolveRead();
              } else {
                // No more entries to read
                resolveRead();
              }
            });
          });
        };

        // Start reading directory entries
        readEntries().then(resolve);
      } else {
        resolve();
      }
    });
  };

  // Process all items in the drop event
  const entries = Array.from(items)
    .filter((item) => item.kind === 'file')
    .map((item) => item.webkitGetAsEntry());

  await Promise.all(entries.map((entry) => entry && processEntry(entry)));

  return allFiles;
};

/**
 * Removes invalid characters from a file name.
 *
 * @param fileName The file name to clean.
 */
export const cleanFileName = (fileName: string) => {
  const invalidFileNameCharsRegex = /[^a-zA-Z0-9ñáéíóúü !@#$%^&()_+\-=.{}[\]',;`~]/g;
  return fileName.replace(invalidFileNameCharsRegex, '');
};

/**
 * Shortens a file name to a maximum length, but preserves the file extension. File extension is not considered
 * by maxLength.
 *
 * @param str The file name to shorten.
 * @param maxLength The maximum length of the file name (does not include the file extension).
 * @returns The shortened file name with the file extension.
 */
export function ellipsifyFileName(str: string, maxLength: number): string {
  const fileExtensionIndex = str.lastIndexOf('.');

  if (fileExtensionIndex === -1) {
    return truncate(str, { length: maxLength });
  }

  const fileExtension = str.slice(fileExtensionIndex);
  const fileName = str.slice(0, fileExtensionIndex);
  const truncatedStr = truncate(fileName, { length: maxLength });

  if (truncatedStr.endsWith('...')) {
    return truncatedStr + fileExtension.slice(1);
  } else {
    return truncatedStr + fileExtension;
  }
}

/**
 * Formats a file size in bytes to a human-readable format (KB, MB, or bytes).
 *
 * @param fileSizeBytes The file size in bytes.
 * @returns The formatted file size as a string.
 */
export const formatFileSize = (fileSizeBytes: number) => {
  const fileSizeKB = fileSizeBytes / 1024;
  const fileSizeMB = fileSizeKB / 1024;

  if (fileSizeMB >= 1) {
    return `${fileSizeMB.toFixed(2)} MB`;
  } else if (fileSizeKB >= 1) {
    return `${fileSizeKB.toFixed(2)} KB`;
  } else {
    return `${fileSizeBytes.toFixed(2)} bytes`;
  }
};

/**
 * Calculates the upload progress percentage from an Axios progress event
 *
 * @param progressEvent The Axios progress event object
 * @param callback Optional callback function to receive the calculated percentage
 * @returns The calculated percentage as a number between 0 and 100
 */
export const calculateUploadProgress = (
  progressEvent: { loaded: number; total?: number },
  callback?: (percentage: number) => void,
): number => {
  if (!progressEvent.total) {
    return 0;
  }

  const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);

  if (callback) {
    callback(percentage);
  }

  return percentage;
};

/**
 * Validates a file based on its size and type.
 *
 * @param file The file to validate.
 * @returns An object with isValid flag and errorType if invalid.
 */
export const validateFile = (file: File): { isValid: boolean; errorType?: 'fileTooLarge' | 'unsupportedFileType' } => {
  // Check file size
  if (file.size > maxFileSize) {
    return { isValid: false, errorType: 'fileTooLarge' };
  }

  // Check file type
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  if (!fileExtension || !acceptedImageTypes.includes(fileExtension)) {
    return { isValid: false, errorType: 'unsupportedFileType' };
  }

  return { isValid: true };
};

import React, { useState, useEffect } from 'react';
import { message, Upload } from 'antd';
import { UploadProps, UploadFile, RcFile } from 'antd/es/upload';
import { acceptedImageTypes } from 'config/files';
import { UploadOutlined } from '@ant-design/icons';

const defaultMaxFileSize = 50 * 1024 * 1024; // 50MB

export interface AFSUploadProps {
  value?: File | null;
  onChange?: (file: File | null) => void;
  width?: string;
  height?: string;
  maxFileSize?: number;
  omitFileValidation?: boolean;
  maxCount?: number;
  props?: UploadProps;
}

/**
 * FileUpload component
 *
 * Provides a drag-and-drop file upload interface with validation for file size and type.
 * Supports single file uploads only.
 *
 * Also works with Ant Design's Form.Item component.
 *
 * @example
 * // Usage with Ant Design Form
 * <Form.Item name="fileUpload" label="File Upload">
 *   <FileUpload />
 * </Form.Item>
 *
 * @param value - The file to be uploaded
 * @param onChange - Callback function to handle file changes
 * @param maxCount - Maximum number of files to upload (default is 1)
 * @param maxFileSize - Maximum file size in bytes (default is 50MB)
 * @param omitFileValidation - Whether to omit file validation
 * @param props - Additional props to pass to the Upload component
 * @constructor
 */
export const FileUpload: React.FC<AFSUploadProps> = ({
  value,
  onChange,
  width,
  height,
  maxCount = 1,
  maxFileSize = defaultMaxFileSize,
  omitFileValidation = false,
  props,
}: AFSUploadProps) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // Convert File to UploadFile when value changes
  useEffect(() => {
    if (value && value instanceof File) {
      // Create RcFile object by extending the File with required properties
      const rcFile = {
        ...value,
        uid: '-1',
        lastModifiedDate: value.lastModified ? new Date(value.lastModified) : new Date(),
        // Copy all File methods and properties
        arrayBuffer: value.arrayBuffer.bind(value),
        slice: value.slice.bind(value),
        stream: value.stream.bind(value),
        text: value.text.bind(value),
      } as RcFile;

      const uploadFile: UploadFile = {
        uid: '-1',
        name: value.name,
        status: 'done',
        url: URL.createObjectURL(value),
        originFileObj: rcFile,
      };
      setFileList([uploadFile]);
    } else {
      setFileList([]);
    }
  }, [value]);

  /**
   * Check if the file size exceeds the maximum limit
   */
  const beforeUpload = (newFile: RcFile) => {
    if (!omitFileValidation) {
      if (newFile.size > maxFileSize) {
        message.error(`File size exceeds the maximum limit of ${maxFileSize / (1024 * 1024)} MB.`);
        return false;
      }
      if (!acceptedImageTypes.includes(newFile.type)) {
        message.error(`File type not allowed. Only ${acceptedImageTypes.join(', ')} are allowed.`);
        return false;
      }
    }
    return true;
  };

  const handleChange = ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
    setFileList(newFileList);

    // Call onChange with the actual File object or null
    if (newFileList.length > 0 && newFileList[0].originFileObj) {
      onChange?.(newFileList[0].originFileObj as File);
    } else {
      onChange?.(null);
    }
  };

  const handleRemove = (file: UploadFile) => {
    // Revoke the object URL to prevent memory leaks
    if (file.url && file.url.startsWith('blob:')) {
      URL.revokeObjectURL(file.url);
    }
    onChange?.(null);
    return true;
  };

  const uploadFileProps: UploadProps = {
    name: 'fileUpload',
    customRequest: (options: any) => {
      const { onSuccess, file } = options;
      // Don't call onChange here, it's handled in handleChange
      onSuccess('ok');
    },
    fileList,
    onChange: handleChange,
    onRemove: handleRemove,
    showUploadList: {
      showRemoveIcon: true,
      showDownloadIcon: false,
    },
    accept: acceptedImageTypes.join(','),
    maxCount: maxCount ?? 1,
    itemRender: (originNode, file) => {
      return (
        <div className="border border-dashed rounded-md">
          <img src={file.url} alt={file.name} />
          {originNode}
        </div>
      );
    },
    beforeUpload,
    ...props,
  };

  const uploadButton = (
    <div
      className={`flex flex-col ${width ? width : 'w-48'} ${height ? height : 'h-64'} px-3 items-center justify-center border border-dashed rounded-md`}>
      <UploadOutlined className="text-2xl mb-2" />
      <div className="text-sm">Da click o arrastra para subir un foto</div>
    </div>
  );

  return (
    <>
      <Upload {...uploadFileProps}>{fileList.length >= (maxCount || 1) ? null : uploadButton}</Upload>
    </>
  );
};

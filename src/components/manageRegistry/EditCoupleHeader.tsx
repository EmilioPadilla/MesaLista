import { useState, useEffect } from 'react';
import { CameraOutlined, EditOutlined } from '@ant-design/icons';
import { Card, Button, Input, message } from 'antd';
import { Form, Typography } from 'antd';
import { Collapsible } from 'core/Collapsible';
import type { WeddingListWithGifts } from '../../../shared/types/weddingList';
import { FileUpload } from 'core/FileUpload';
import { useUploadFile } from 'hooks/useFiles';
import { useUpdateWeddingList } from 'hooks/useWeddingList';

interface EditCoupleHeaderProps {
  isOpen: boolean;
  weddinglist: WeddingListWithGifts;
  formattedWeddingDate: string;
}

const { Title, Text } = Typography;

export const EditCoupleHeader = ({ isOpen, weddinglist, formattedWeddingDate }: EditCoupleHeaderProps) => {
  const [form] = Form.useForm();

  const { mutate: uploadFile, data: imageData } = useUploadFile();
  const { mutate: updateWeddingList, isSuccess: updateSuccess, isError: updateError } = useUpdateWeddingList();

  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [note, setNote] = useState(
    weddinglist?.description ||
      "Your presence is enough of a present to us! But for those of you who are stubborn, we've put together a wish-list to help you out.",
  );

  useEffect(() => {
    if (imageData?.url) {
      updateWeddingList({ id: weddinglist?.id, data: { imageUrl: imageData?.url } });
    }
  }, []);

  useEffect(() => {
    if (uploadFiles.length > 0) {
      uploadFile(uploadFiles[0]);
    }
  }, [uploadFiles]);

  useEffect(() => {
    if (updateSuccess) {
      message.success('Wedding list updated successfully!');
    }
    if (updateError) {
      message.error('Failed to update wedding list!');
    }
  }, [updateSuccess, updateError]);

  return (
    <Collapsible isOpen={isOpen}>
      <Card className="mt-4 mb-4">
        <Form form={form} layout="vertical" initialValues={{ note, imageUrl: weddinglist?.imageUrl }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Form.Item name="imageUrl">
                <div className="flex flex-col items-center">
                  <div className="relative w-96 h-64 bg-gray-100 rounded-md mb-4 overflow-hidden">
                    <FileUpload
                      width="w-96"
                      height="h-64"
                      onChange={(file: File | null) => {
                        if (file) {
                          setUploadFiles([file]);
                        }
                      }}
                    />
                  </div>
                </div>
              </Form.Item>
            </div>
            <div className="flex items-center justify-center">
              {isEditingNote ? (
                <div className="flex flex-col w-full">
                  <Form.Item name="note">
                    <Input.TextArea
                      rows={6}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Write a note to your guests..."
                    />
                  </Form.Item>
                  <div className="flex justify-end">
                    <Button
                      type="primary"
                      onClick={() => {
                        updateWeddingList({ id: weddinglist.id, data: { description: note } });
                        setIsEditingNote(false);
                      }}>
                      Save Changes
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col">
                  <Title level={4}>{formattedWeddingDate}</Title>
                  <Text>{note}</Text>
                  <div className="flex justify-start mt-6">
                    <Button className="" type="primary" icon={<EditOutlined />} onClick={() => setIsEditingNote(true)}>
                      Editar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Form>
      </Card>
    </Collapsible>
  );
};

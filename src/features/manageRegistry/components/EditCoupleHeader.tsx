import { useState, useEffect } from 'react';
import { EditOutlined } from '@ant-design/icons';
import { Card, Button, Input, message } from 'antd';
import { Form, Typography } from 'antd';
import { Collapsible } from 'core/Collapsible';
import type { WeddingListWithGifts } from 'types/models/weddingList';
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
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [note, setNote] = useState(
    weddinglist?.description ||
      "Your presence is enough of a present to us! But for those of you who are stubborn, we've put together a wish-list to help you out.",
  );

  useEffect(() => {
    if (!isOpen) {
      setIsEditingImage(false);
      setIsEditingNote(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (imageData) {
      updateWeddingList({ id: weddinglist?.id, data: { imageUrl: imageData } });
    }
  }, [imageData]);

  useEffect(() => {
    if (uploadFiles.length > 0) {
      uploadFile(uploadFiles[0]);
    }
  }, [uploadFiles]);

  useEffect(() => {
    if (updateSuccess) {
      message.success('Información actualizada correctamente!');
    }
    if (updateError) {
      message.error('Error al actualizar la información');
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
                  <div className="relative w-96 bg-gray-100 rounded-md mb-4 overflow-hidden">
                    {weddinglist?.imageUrl && !isEditingImage ? (
                      <img src={weddinglist?.imageUrl} alt="Couple Image" className="w-full h-full object-cover" />
                    ) : (
                      <FileUpload
                        value={uploadFiles[0]}
                        width="w-96"
                        onChange={(file: File | null) => {
                          if (file) {
                            setUploadFiles([file]);
                          }
                        }}
                      />
                    )}
                  </div>
                  <Button type="primary" icon={<EditOutlined />} onClick={() => setIsEditingImage(!isEditingImage)} />
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
                    <Button className="mr-2" onClick={() => setIsEditingNote(false)}>
                      Cancelar
                    </Button>
                    <Button
                      type="primary"
                      onClick={() => {
                        updateWeddingList({ id: weddinglist.id, data: { description: note } });
                        setIsEditingNote(false);
                      }}>
                      Guardar cambios
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col">
                  <Title level={4}>{formattedWeddingDate}</Title>
                  <Text>{note}</Text>
                  <div className="flex justify-start mt-6">
                    <Button className="" type="primary" icon={<EditOutlined />} onClick={() => setIsEditingNote(true)} />
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

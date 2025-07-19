import { useState } from 'react';
import {
  EditOutlined,
  CalendarOutlined,
  UserOutlined,
  GiftOutlined,
  ShoppingOutlined,
  DownOutlined,
  UploadOutlined,
  CameraOutlined,
} from '@ant-design/icons';
import { User } from '@prisma/client';
import { Col, Button, Card, Divider, Typography, Input, Upload, Form, message } from 'antd';
import type { WeddingListWithGifts } from '../../../shared/types/weddingList';
import { Collapsible } from 'core/Collapsible';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface RegistryAdvisorProps {
  userData: User;
  weddinglist: WeddingListWithGifts;
}

export const RegistryAdvisor = ({ userData, weddinglist }: RegistryAdvisorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState(
    weddinglist?.description ||
      "Your presence is enough of a present to us! But for those of you who are stubborn, we've put together a wish-list to help you out.",
  );
  const [isEditingNote, setIsEditingNote] = useState(false);

  const [imageUrl, setImageUrl] = useState(weddinglist?.imageUrl || '');
  const [form] = Form.useForm();
  const formattedWeddingDate = weddinglist?.weddingDate ? dayjs(weddinglist.weddingDate).format('MMM DD, YYYY') : '';

  return (
    <>
      <Col span={24} className="mb-4">
        <div className="text-center">
          <Title className="chamberi-heading" level={1}>
            {weddinglist?.coupleName || `${(userData as unknown as User).firstName} & ${(userData as unknown as User).spouseFirstName}`}
          </Title>
          <Button type="link" icon={<DownOutlined />} className="text-gray-500" onClick={() => setIsOpen(!isOpen)}>
            Editar Foto y Nota
          </Button>
        </div>
        <Collapsible isOpen={isOpen}>
          <Card className="mt-4 mb-4">
            <Form form={form} layout="vertical" initialValues={{ note, imageUrl }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Form.Item name="imageUrl">
                    <div className="flex flex-col items-center">
                      <div className="relative w-full max-w-md h-64 bg-gray-100 rounded-md mb-4 overflow-hidden">
                        {imageUrl ? (
                          <img src={imageUrl} alt="Couple" className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex items-center justify-center h-full w-full">
                            <CameraOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
                          </div>
                        )}
                      </div>
                      <Upload
                        name="photo"
                        showUploadList={false}
                        beforeUpload={(file) => {
                          // Here you would normally upload to your server
                          // For now, we'll just create a local URL for preview
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            if (e.target?.result) {
                              setImageUrl(e.target.result as string);
                              form.setFieldsValue({ imageUrl: e.target.result });
                            }
                          };
                          reader.readAsDataURL(file);
                          // Prevent default upload behavior
                          return false;
                        }}>
                        <Button icon={<UploadOutlined />}>Subir Foto</Button>
                      </Upload>
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
                            // Here you would normally save to your backend
                            message.success('Photo and note updated successfully!');
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
      </Col>

      <Col span={24}>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <Title level={5} className="mb-0">
              Asesor de Registro
            </Title>
            <div className="flex items-center">
              <CalendarOutlined className="mr-2 text-orange-400" />
              <span className="mr-1">
                {weddinglist?.weddingDate
                  ? Math.ceil((new Date(weddinglist.weddingDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
                  : 0}{' '}
                días restantes
              </span>
              <Divider type="vertical" />
              <UserOutlined className="mr-1" />
              <span>{weddinglist?.invitationCount || 0} Invitados</span>
              <EditOutlined className="ml-2 text-gray-400" />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mt-4">
            <div className="text-center">
              <div className="flex justify-center">
                <div className="text-3xl font-bold text-blue-500">
                  {weddinglist?.gifts?.filter((gift) => !gift.isPurchased).length || 0}
                </div>
                <GiftOutlined className="ml-2 text-gray-400 text-xl" />
              </div>
              <div className="text-xs text-gray-500">Regalos Disponibles</div>
            </div>

            <div className="text-center">
              <div className="flex justify-center">
                <div className="text-3xl font-bold text-blue-500">{weddinglist?.gifts?.filter((gift) => gift.isPurchased).length || 0}</div>
                <ShoppingOutlined className="ml-2 text-gray-400 text-xl" />
              </div>
              <div className="text-xs text-gray-500">Reservados y Comprados</div>
            </div>

            <div className="text-center">
              <div className="flex justify-center items-center">
                <div className="rounded-full border-2 border-gray-200 w-12 h-12 flex items-center justify-center">
                  <span className="text-lg font-bold text-blue-500">{weddinglist?.gifts?.length || 0}</span>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">Regalos Necesarios</div>
            </div>

            <div className="text-center">
              <div className="flex justify-center items-center">
                <div className="rounded-full border-2 border-gray-200 w-12 h-12 flex items-center justify-center">
                  <span className="text-lg font-bold text-blue-500">0</span>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">Fondo en Efectivo Necesario</div>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex justify-between items-center">
              <div>
                <Text type="secondary">40% de los invitados eligen un regalo según el precio que quieren gastar.</Text>
                <div className="text-xs text-purple-500">
                  La herramienta de Balance de Precios de MesaLista asegura que tengas suficientes regalos en cada rango de precio.
                </div>
              </div>
              <div className="text-gray-400 text-sm">Siguiente Consejo</div>
            </div>
          </div>

          <Divider />

          <div>
            <div className="grid grid-cols-5 gap-4">
              <div className="flex justify-center items-center">
                <p className="mb-4">Rangos de precios</p>
              </div>
              {/* Calculate price ranges */}
              <div className="text-center">
                <div className="flex justify-center items-center">
                  <div className="rounded-full bg-gray-100 w-10 h-10 flex items-center justify-center">
                    <span className="font-bold">{weddinglist?.gifts?.filter((gift) => gift.price < 50).length || 0}</span>
                  </div>
                </div>
                <div className="text-xs mt-1">Menos de $50</div>
                <Button size="small" className="mt-1">
                  Agregar
                </Button>
              </div>

              <div className="text-center">
                <div className="flex justify-center items-center">
                  <div className="rounded-full bg-gray-100 w-10 h-10 flex items-center justify-center">
                    <span className="font-bold">
                      {weddinglist?.gifts?.filter((gift) => gift.price >= 50 && gift.price <= 100).length || 0}
                    </span>
                  </div>
                </div>
                <div className="text-xs mt-1">$50 - $100</div>
                <Button size="small" className="mt-1">
                  Agregar
                </Button>
              </div>

              <div className="text-center">
                <div className="flex justify-center items-center">
                  <div className="rounded-full bg-gray-100 w-10 h-10 flex items-center justify-center">
                    <span className="font-bold">
                      {weddinglist?.gifts?.filter((gift) => gift.price > 100 && gift.price <= 150).length || 0}
                    </span>
                  </div>
                </div>
                <div className="text-xs mt-1">$100 - $150</div>
                <Button size="small" className="mt-1">
                  Agregar
                </Button>
              </div>

              <div className="text-center">
                <div className="flex justify-center items-center">
                  <div className="rounded-full bg-gray-100 w-10 h-10 flex items-center justify-center">
                    <span className="font-bold">{weddinglist?.gifts?.filter((gift) => gift.price > 150).length || 0}</span>
                  </div>
                </div>
                <div className="text-xs mt-1">Más de $150</div>
                <Button size="small" className="mt-1">
                  Agregar
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </Col>
    </>
  );
};

import { useState } from 'react';
import { EditOutlined, CalendarOutlined, UserOutlined, GiftOutlined, ShoppingOutlined, DownOutlined } from '@ant-design/icons';
import { User } from '@prisma/client';
import { Col, Button, Card, Divider, Typography, Popconfirm, Popover, Input } from 'antd';
import type { WeddingListWithGifts } from 'types/models/weddingList';
import dayjs from 'dayjs';
import { EditCoupleHeader } from './EditCoupleHeader';

interface RegistryAdvisorProps {
  onUpdateWeddingList: (data: WeddingListWithGifts) => void;
  userData: User;
  weddinglist: WeddingListWithGifts;
}

const { Title } = Typography;

export const RegistryAdvisor = ({ onUpdateWeddingList, userData, weddinglist }: RegistryAdvisorProps) => {
  const [isEditHeaderOpen, setIsEditHeaderOpen] = useState(false);
  const [isEditCountOpen, setIsEditCountOpen] = useState(false);
  const [count, setCount] = useState(weddinglist?.invitationCount);
  const formattedWeddingDate = weddinglist?.weddingDate ? dayjs(weddinglist.weddingDate).format('MMM DD, YYYY') : '';

  const confirmUpdateCount = () => {
    setIsEditCountOpen(false);
    onUpdateWeddingList({ ...weddinglist, invitationCount: count });
  };

  return (
    <>
      <Col span={24} className="mb-4">
        <div className="text-center">
          <Title className="chamberi-heading" level={1}>
            {weddinglist?.coupleName || `${(userData as unknown as User).firstName} & ${(userData as unknown as User).spouseFirstName}`}
          </Title>
          <Button type="link" icon={<DownOutlined />} className="text-gray-500" onClick={() => setIsEditHeaderOpen(!isEditHeaderOpen)}>
            Editar Foto y Nota
          </Button>
        </div>
        <EditCoupleHeader isOpen={isEditHeaderOpen} weddinglist={weddinglist} formattedWeddingDate={formattedWeddingDate} />
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
              <Popover
                title="Modifica tu cantidad de invitados"
                className="pop-delete"
                trigger="click"
                open={isEditCountOpen}
                onOpenChange={setIsEditCountOpen}
                content={
                  <>
                    <Input placeholder="Cantidad de invitados" value={count} onChange={(e) => setCount(Number(e.target.value))} />
                    <div className="flex justify-end mt-2">
                      <Button size="small" className="mr-2" type="default" onClick={() => setIsEditCountOpen(false)}>
                        Cancelar
                      </Button>
                      <Button size="small" type="primary" onClick={confirmUpdateCount}>
                        Guardar
                      </Button>
                    </div>
                  </>
                }>
                <EditOutlined className="ml-2 text-gray-400" />
              </Popover>
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

          {/* <div className="mt-6">
            <div className="flex justify-between items-center">
              <div>
                <Text type="secondary">40% de los invitados eligen un regalo según el precio que quieren gastar.</Text>
                <div className="text-xs text-purple-500">
                  La herramienta de Balance de Precios de MesaLista asegura que tengas suficientes regalos en cada rango de precio.
                </div>
              </div>
              <div className="text-gray-400 text-sm">Siguiente Consejo</div>
            </div>
          </div> */}

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

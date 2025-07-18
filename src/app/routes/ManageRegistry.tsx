import React from 'react';
import { Typography, Card, Spin, Row, Col, Button, Divider } from 'antd';
import { CalendarOutlined, EditOutlined, GiftOutlined, ShoppingOutlined, UserOutlined } from '@ant-design/icons';
import { useOutletContext } from 'react-router-dom';
import { User } from '../../../shared/types/user';
import { useWeddingListByCouple } from 'hooks/useWeddingList';

const { Title, Text } = Typography;

type OutletContextType = {
  userData?: User;
  isLoading: boolean;
  isCouple: boolean;
};

const ManageRegistry: React.FC<OutletContextType> = (props) => {
  // Use props if provided directly, otherwise use context from Outlet
  const contextData = useOutletContext<OutletContextType>();
  const { data: weddinglist } = useWeddingListByCouple(contextData?.userData?.id);

  const userData = props.userData || contextData?.userData;
  const isLoading = props.isLoading !== undefined ? props.isLoading : contextData?.isLoading;
  const isCouple = props.isCouple !== undefined ? props.isCouple : contextData?.isCouple;
  return (
    <div className="m-6">
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      ) : (
        <div className="p-6 bg-white rounded-lg shadow">
          {userData && (
            <>
              <Row gutter={[16, 16]} className="mt-6">
                {isCouple ? (
                  <>
                    <Col span={24} className="mb-4">
                      <div className="text-center">
                        <Title className="chamberi-heading" level={1}>
                          {weddinglist?.coupleName ||
                            `${(userData as unknown as User).firstName} & ${(userData as unknown as User).spouseFirstName}`}
                        </Title>
                        <Button type="link" icon={<EditOutlined />} className="text-gray-500">
                          Editar Foto y Nota
                        </Button>
                      </div>
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
                              <div className="text-3xl font-bold text-blue-500">
                                {weddinglist?.gifts?.filter((gift) => gift.isPurchased).length || 0}
                              </div>
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
                              <p className="mb-4">Balance de Precios de Regalos</p>
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
                                Comprar Ahora
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
                                Comprar Ahora
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
                                Comprar Ahora
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
                                Comprar Ahora
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Col>
                  </>
                ) : (
                  <>
                    <Col xs={24} sm={12} lg={8}>
                      <Card title="Buscar Listas de Regalos" className="shadow-md hover:shadow-lg transition-shadow h-full">
                        <p>Busca listas de regalos por el nombre de los novios o fecha de la boda.</p>
                        <Button type="primary" className="mt-2">
                          Buscar Listas
                        </Button>
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={8}>
                      <Card title="Mis Compras Recientes" className="shadow-md hover:shadow-lg transition-shadow h-full">
                        <p>No tienes compras recientes.</p>
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={8}>
                      <Card title="Mi Perfil" className="shadow-md hover:shadow-lg transition-shadow h-full">
                        <p>Actualiza tu información personal y preferencias.</p>
                        <Button type="default" className="mt-2">
                          Editar Perfil
                        </Button>
                      </Card>
                    </Col>
                  </>
                )}
              </Row>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ManageRegistry;

import React from 'react';
import { Typography, Card, Spin, Row, Col, Statistic, Button } from 'antd';
import { CalendarOutlined, UserOutlined } from '@ant-design/icons';
import { useOutletContext } from 'react-router-dom';
import type { DashboardUserData } from '../api/userService';

const { Title, Paragraph } = Typography;

interface DashboardContentProps {
  userData?: DashboardUserData;
  isLoading?: boolean;
  isCouple?: boolean;
}

type OutletContextType = {
  userData?: DashboardUserData;
  isLoading: boolean;
  isCouple: boolean;
};

const DashboardContent: React.FC<DashboardContentProps> = (props) => {
  // Use props if provided directly, otherwise use context from Outlet
  const contextData = useOutletContext<OutletContextType>();
  
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
              <Title level={2}>Bienvenido{isCouple ? 's' : ''} a RegalAmor</Title>
              {isCouple ? (
                <Paragraph>
                  Aquí podrás gestionar tu lista de regalos para tu boda y ver los regalos que tus invitados han comprado.
                </Paragraph>
              ) : (
                <Paragraph>
                  Aquí podrás ver las listas de regalos de bodas y realizar compras para los novios.
                </Paragraph>
              )}
              
              <Row gutter={[16, 16]} className="mt-6">
                {isCouple && (
                  <>
                    <Col xs={24} sm={12} lg={8}>
                      <Card title="Información de la Boda" className="shadow-md hover:shadow-lg transition-shadow h-full">
                        <div className="flex items-center mb-3">
                          <CalendarOutlined className="text-blue-500 mr-2" />
                          <span>Fecha de la boda: {userData.weddingDate ? new Date(userData.weddingDate).toLocaleDateString() : 'No establecida'}</span>
                        </div>
                        <div className="flex items-center">
                          <UserOutlined className="text-blue-500 mr-2" />
                          <span>Nombre: {userData.name}</span>
                        </div>
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={8}>
                      <Card title="Resumen de Regalos" className="shadow-md hover:shadow-lg transition-shadow h-full">
                        <Statistic 
                          title="Fecha de Boda" 
                          value={userData.weddingDate ? new Date(userData.weddingDate).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) : 'No establecida'}
                          prefix={<CalendarOutlined />}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={8}>
                      <Card title="Fondos Recaudados" className="shadow-md hover:shadow-lg transition-shadow h-full">
                        <Statistic
                          title="Total"
                          value={userData.totalAmount || 0}
                          prefix="$"
                          precision={2}
                        />
                        <Button type="primary" className="mt-4" size="small">
                          Transferir a mi cuenta
                        </Button>
                      </Card>
                    </Col>
                  </>
                )}
                {!isCouple && (
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

export default DashboardContent;

import { useState } from 'react';
import { Card, Spin, Row, Col, Button } from 'antd';
import { useOutletContext } from 'react-router-dom';
import { useWeddingListByCouple } from 'hooks/useWeddingList';
import { RegistryAdvisor } from 'components/manageRegistry/RegistryAdvisor';
import type { User } from '@prisma/client';
import { GiftsList } from 'components/manageRegistry/GiftsList';
import { AddGift } from 'src/components/manageRegistry/AddGift';

type OutletContextType = {
  userData?: User;
  isLoading?: boolean;
  isCouple?: boolean;
};

const ManageRegistry: React.FC<OutletContextType> = (props?: OutletContextType) => {
  // Use props if provided directly, otherwise use context from Outlet
  const contextData = useOutletContext<OutletContextType>();
  const { data: weddinglist, isLoading: loadingGifts } = useWeddingListByCouple(contextData?.userData?.id);
  const [isAddGiftModalOpen, setIsAddGiftModalOpen] = useState(false);

  const userData = props?.userData || contextData?.userData;
  const isLoading = props?.isLoading !== undefined ? props?.isLoading : contextData?.isLoading;
  const isCouple = props?.isCouple !== undefined ? props?.isCouple : contextData?.isCouple;

  return (
    <div className="m-6">
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      ) : (
        <div className="p-6 bg-white rounded-lg">
          {userData && (
            <>
              <Row gutter={[16, 16]} className="mt-6">
                {isCouple ? (
                  <>
                    <RegistryAdvisor userData={userData} weddinglist={weddinglist!} />
                    <GiftsList
                      loadingGifts={loadingGifts}
                      weddingListData={weddinglist!}
                      onOpenAddGiftModal={() => setIsAddGiftModalOpen(true)}
                    />
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
      <AddGift open={isAddGiftModalOpen} onCancel={() => setIsAddGiftModalOpen(false)} />
    </div>
  );
};

export default ManageRegistry;

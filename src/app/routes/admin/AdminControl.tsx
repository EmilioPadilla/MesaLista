import { useState } from 'react';
import { Card, Tabs, Spin, Button, Space } from 'antd';
import { Shield, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUsersAnalytics, useWeddingListsAnalytics, useUsersListsSummary } from 'src/hooks/useUsersListsAnalytics';
import { useCurrentUser } from 'src/hooks/useUser';
import { UsersControlTab, RegistriesControlTab } from 'src/features/admin/control';

export const AdminControl = () => {
  const navigate = useNavigate();
  const { data: user, isLoading: isUserLoading } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<string>('users');

  const { data: summary } = useUsersListsSummary();
  const { data: usersData, isLoading: isUsersLoading, refetch: refetchUsers } = useUsersAnalytics();
  const { data: listsData, isLoading: isListsLoading, refetch: refetchLists } = useWeddingListsAnalytics();

  if (isUserLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Card className="max-w-md">
          <div className="text-center">
            <Shield className="h-16 w-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold mb-2">Acceso Denegado</h2>
            <p className="text-gray-600">No tienes permisos para acceder a esta página.</p>
          </div>
        </Card>
      </div>
    );
  }

  const handleRefresh = () => {
    if (activeTab === 'users') {
      refetchUsers();
    } else {
      refetchLists();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-[1600px] mx-auto px-4">
        <Space className="mb-6">
          <Button icon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate('/')} type="text">
            Volver
          </Button>
        </Space>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-600" />
            Panel de Control Admin
          </h1>
          <p className="text-gray-600 mt-2">Gestiona usuarios, listas de regalos y configuraciones del sistema</p>
        </div>

        <Card>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'users',
                label: (
                  <span className="flex items-center gap-2">
                    <span>Usuarios</span>
                    {!isUsersLoading && usersData && <span className="text-xs text-gray-500">({usersData.length})</span>}
                  </span>
                ),
                children: (
                  <UsersControlTab summary={summary} usersData={usersData} isUsersLoading={isUsersLoading} onRefresh={handleRefresh} />
                ),
              },
              {
                key: 'registries',
                label: (
                  <span className="flex items-center gap-2">
                    <span>Listas de Regalos</span>
                    {!isListsLoading && listsData && <span className="text-xs text-gray-500">({listsData.length})</span>}
                  </span>
                ),
                children: (
                  <RegistriesControlTab summary={summary} listsData={listsData} isListsLoading={isListsLoading} onRefresh={handleRefresh} />
                ),
              },
            ]}
          />
        </Card>
      </div>
    </div>
  );
};

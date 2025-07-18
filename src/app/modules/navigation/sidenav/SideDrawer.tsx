import {
  GiftFilled,
  HomeOutlined,
  GiftOutlined,
  ShoppingOutlined,
  HeartOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  QuestionOutlined,
  TruckOutlined,
} from '@ant-design/icons';
import { Button, Divider, Drawer, Menu } from 'antd';
import { Link } from 'react-router-dom';
import { UserProfile } from 'src/components/UserProfile';

interface SideDrawerProps {
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  currentPath: string;
  setCurrentPath: (path: string) => void;
  isCouple: boolean;
  handleLogout: () => void;
}

export const SideDrawer = ({ drawerOpen, setDrawerOpen, currentPath, setCurrentPath, isCouple, handleLogout }: SideDrawerProps) => {
  return (
    <Drawer
      title={
        <div className="flex items-center">
          <GiftFilled className="!text-black !font-bold !text-xl mr-2" />
          <span className="font-bold text-xl">MesaLista</span>
        </div>
      }
      placement="left"
      onClose={() => setDrawerOpen(false)}
      open={drawerOpen}
      width={250}>
      <div className="flex flex-col h-full justify-between">
        <div>
          <Menu
            theme="light"
            selectedKeys={[currentPath]}
            className="!border-none"
            mode="inline"
            onClick={({ key }) => {
              setCurrentPath(key);
              setDrawerOpen(false); // Close drawer when menu item is clicked
            }}
            items={[
              {
                key: '/dashboard',
                icon: <HomeOutlined />,
                label: <Link to="/dashboard">Administrar Mesa</Link>,
              },
              ...(isCouple
                ? [
                    {
                      key: 'Mesa de Regalos',
                      label: 'Mesa de Regalos',
                      type: 'group' as const,
                      children: [
                        {
                          key: '/dashboard/gift-registry',
                          icon: <GiftOutlined />,
                          label: <Link to="/dashboard/gift-registry">Agregar Regalos</Link>,
                        },
                        {
                          key: '/dashboard/purchased-gifts',
                          icon: <TruckOutlined />,
                          label: <Link to="/dashboard/purchased-gifts">Rastrear Regalos</Link>,
                        },
                        {
                          key: '/dashboard/messages',
                          icon: <HeartOutlined />,
                          label: <Link to="/dashboard/messages">Mensajes</Link>,
                        },
                      ],
                    },
                  ]
                : [
                    {
                      key: '/dashboard/gift-lists',
                      icon: <GiftOutlined />,
                      label: <Link to="/dashboard/gift-lists">Ver Listas de Regalos</Link>,
                    },
                    {
                      key: '/dashboard/my-purchases',
                      icon: <ShoppingOutlined />,
                      label: <Link to="/dashboard/my-purchases">Mis Compras</Link>,
                    },
                  ]),
            ]}
          />
        </div>
        <div>
          <Divider />
          <UserProfile />
          <Button type="link" icon={<SettingOutlined />}>
            Configuración del Evento
          </Button>
          <Button type="link" icon={<UserOutlined />}>
            Información de Cuenta
          </Button>
          <Button type="link" icon={<QuestionOutlined />}>
            Ayuda
          </Button>
          <Button type="link" icon={<LogoutOutlined />} onClick={handleLogout}>
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </Drawer>
  );
};

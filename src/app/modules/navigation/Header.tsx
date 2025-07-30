import { Button, Layout, Tabs, type TabsProps } from 'antd';
import { MenuOutlined, ShareAltOutlined, ExportOutlined, SettingOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { message } from 'antd';
import { useDeviceType } from 'hooks/useDeviceType';

const { Header } = Layout;

interface HeaderComponentProps {
  currentPath: string;
  setCurrentPath: (path: string) => void;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
}

export const HeaderComponent = ({ currentPath, setCurrentPath, drawerOpen, setDrawerOpen }: HeaderComponentProps) => {
  const deviceType = useDeviceType();

  // Toggle drawer when menu icon is clicked
  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const onChange = (key: string) => {
    setCurrentPath(key);
    setDrawerOpen(false);
  };

  const copyPublicWeddingListLink = () => {
    message.success('Link copiado al portapapeles');
    navigator.clipboard.writeText(window.location.href);
  };

  const items: TabsProps['items'] = [
    {
      key: '/dashboard',
      label: <Link to="/dashboard">Administrar Mesa</Link>,
    },
    {
      key: '/dashboard/gift-registry',
      label: <Link to="/dashboard/gift-registry">Agregar Regalos</Link>,
    },
    {
      key: '/dashboard/purchased-gifts',
      label: <Link to="/dashboard/purchased-gifts">Rastrear Regalos</Link>,
    },
  ];

  return (
    <Header className="!bg-white p-0 shadow !pl-4 !pr-4">
      <div className="flex justify-between items-center h-[64px]">
        <div className="flex items-center">
          <MenuOutlined className="mr-4 cursor-pointer text-lg p-2" onClick={toggleDrawer} />
          {['tablet', 'desktop', 'small-desktop'].includes(deviceType) && (
            <Tabs activeKey={currentPath} items={items} onChange={onChange} />
          )}
        </div>
        <div>
          <Button type="link" icon={<ShareAltOutlined />} onClick={copyPublicWeddingListLink}>
            {['desktop', 'small-desktop'].includes(deviceType) ? 'Compartir' : ''}
          </Button>
          <Button type="link" icon={<ExportOutlined />}>
            {['desktop', 'small-desktop'].includes(deviceType) ? 'Vista Previa' : ''}
          </Button>
          <Button type="link" icon={<SettingOutlined />} onClick={() => {}}>
            {['desktop', 'small-desktop'].includes(deviceType) ? 'Configuración' : ''}
          </Button>
        </div>
      </div>
    </Header>
  );
};

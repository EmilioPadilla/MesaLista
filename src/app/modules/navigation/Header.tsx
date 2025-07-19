import { Button, Layout, Tabs, type TabsProps } from 'antd';
import { ExportOutlined, MenuOutlined, SettingOutlined, ShareAltOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { message } from 'antd';

const { Header } = Layout;

interface HeaderComponentProps {
  currentPath: string;
  setCurrentPath: (path: string) => void;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
}

export const HeaderComponent = ({ currentPath, setCurrentPath, drawerOpen, setDrawerOpen }: HeaderComponentProps) => {
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
      // children: 'Content of Tab Pane 1',
    },
    {
      key: '/dashboard/gift-registry',
      label: <Link to="/dashboard/gift-registry">Agregar Regalos</Link>,
      // children: 'Content of Tab Pane 2',
    },
    {
      key: '/dashboard/purchased-gifts',
      label: <Link to="/dashboard/purchased-gifts">Rastrear Regalos</Link>,
      // children: 'Content of Tab Pane 3',
    },
  ];

  return (
    <Header className="!bg-white p-0 shadow !pl-4">
      <div className="flex justify-between items-center h-[64px]">
        <div className="flex items-center">
          <MenuOutlined className="mr-4 cursor-pointer text-lg p-2" onClick={toggleDrawer} />
          <Tabs activeKey={currentPath} items={items} onChange={onChange} />
        </div>
        <div>
          <Button type="link" icon={<ShareAltOutlined />} onClick={copyPublicWeddingListLink}>
            Compartir
          </Button>
          <Button type="link" icon={<ExportOutlined />}>
            Vista Previa
          </Button>
          <Button type="link" icon={<SettingOutlined />} onClick={() => {}}>
            Configuración
          </Button>
        </div>
      </div>
    </Header>
  );
};

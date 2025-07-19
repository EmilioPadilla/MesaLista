import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button, Layout, Tabs } from 'antd';
import { ExportOutlined, MenuOutlined, SettingOutlined, ShareAltOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { message } from 'antd';
const { Header } = Layout;
export const HeaderComponent = ({ currentPath, setCurrentPath, drawerOpen, setDrawerOpen }) => {
    // Toggle drawer when menu icon is clicked
    const toggleDrawer = () => {
        setDrawerOpen(!drawerOpen);
    };
    const onChange = (key) => {
        setCurrentPath(key);
        setDrawerOpen(false);
    };
    const copyPublicWeddingListLink = () => {
        message.success('Link copiado al portapapeles');
        navigator.clipboard.writeText(window.location.href);
    };
    const items = [
        {
            key: '/dashboard',
            label: _jsx(Link, { to: "/dashboard", children: "Administrar Mesa" }),
            // children: 'Content of Tab Pane 1',
        },
        {
            key: '/dashboard/gift-registry',
            label: _jsx(Link, { to: "/dashboard/gift-registry", children: "Agregar Regalos" }),
            // children: 'Content of Tab Pane 2',
        },
        {
            key: '/dashboard/purchased-gifts',
            label: _jsx(Link, { to: "/dashboard/purchased-gifts", children: "Rastrear Regalos" }),
            // children: 'Content of Tab Pane 3',
        },
    ];
    return (_jsx(Header, { className: "!bg-white p-0 shadow !pl-4", children: _jsxs("div", { className: "flex justify-between items-center h-[64px]", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(MenuOutlined, { className: "mr-4 cursor-pointer text-lg p-2", onClick: toggleDrawer }), _jsx(Tabs, { activeKey: currentPath, items: items, onChange: onChange })] }), _jsxs("div", { children: [_jsx(Button, { type: "link", icon: _jsx(ShareAltOutlined, {}), onClick: copyPublicWeddingListLink, children: "Compartir" }), _jsx(Button, { type: "link", icon: _jsx(ExportOutlined, {}), children: "Vista Previa" }), _jsx(Button, { type: "link", icon: _jsx(SettingOutlined, {}), onClick: () => { }, children: "Configuraci\u00F3n" })] })] }) }));
};

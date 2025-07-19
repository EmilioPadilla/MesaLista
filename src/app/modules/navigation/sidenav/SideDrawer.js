import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { GiftFilled, HomeOutlined, GiftOutlined, ShoppingOutlined, HeartOutlined, UserOutlined, SettingOutlined, LogoutOutlined, QuestionOutlined, TruckOutlined, } from '@ant-design/icons';
import { Button, Divider, Drawer, Menu } from 'antd';
import { Link } from 'react-router-dom';
import { UserProfile } from 'src/components/UserProfile';
export const SideDrawer = ({ drawerOpen, setDrawerOpen, currentPath, setCurrentPath, isCouple, handleLogout }) => {
    return (_jsx(Drawer, { title: _jsxs("div", { className: "flex items-center", children: [_jsx(GiftFilled, { className: "!text-black !font-bold !text-xl mr-2" }), _jsx("span", { className: "font-bold text-xl", children: "MesaLista" })] }), placement: "left", onClose: () => setDrawerOpen(false), open: drawerOpen, width: 250, children: _jsxs("div", { className: "flex flex-col h-full justify-between", children: [_jsx("div", { children: _jsx(Menu, { theme: "light", selectedKeys: [currentPath], className: "!border-none", mode: "inline", onClick: ({ key }) => {
                            setCurrentPath(key);
                            setDrawerOpen(false); // Close drawer when menu item is clicked
                        }, items: [
                            {
                                key: '/dashboard',
                                icon: _jsx(HomeOutlined, {}),
                                label: _jsx(Link, { to: "/dashboard", children: "Administrar Mesa" }),
                            },
                            ...(isCouple
                                ? [
                                    {
                                        key: 'Mesa de Regalos',
                                        label: 'Mesa de Regalos',
                                        type: 'group',
                                        children: [
                                            {
                                                key: '/dashboard/gift-registry',
                                                icon: _jsx(GiftOutlined, {}),
                                                label: _jsx(Link, { to: "/dashboard/gift-registry", children: "Agregar Regalos" }),
                                            },
                                            {
                                                key: '/dashboard/purchased-gifts',
                                                icon: _jsx(TruckOutlined, {}),
                                                label: _jsx(Link, { to: "/dashboard/purchased-gifts", children: "Rastrear Regalos" }),
                                            },
                                            {
                                                key: '/dashboard/messages',
                                                icon: _jsx(HeartOutlined, {}),
                                                label: _jsx(Link, { to: "/dashboard/messages", children: "Mensajes" }),
                                            },
                                        ],
                                    },
                                ]
                                : [
                                    {
                                        key: '/dashboard/gift-lists',
                                        icon: _jsx(GiftOutlined, {}),
                                        label: _jsx(Link, { to: "/dashboard/gift-lists", children: "Ver Listas de Regalos" }),
                                    },
                                    {
                                        key: '/dashboard/my-purchases',
                                        icon: _jsx(ShoppingOutlined, {}),
                                        label: _jsx(Link, { to: "/dashboard/my-purchases", children: "Mis Compras" }),
                                    },
                                ]),
                        ] }) }), _jsxs("div", { children: [_jsx(Divider, {}), _jsx(UserProfile, {}), _jsx(Button, { type: "link", icon: _jsx(SettingOutlined, {}), children: "Configuraci\u00F3n del Evento" }), _jsx(Button, { type: "link", icon: _jsx(UserOutlined, {}), children: "Informaci\u00F3n de Cuenta" }), _jsx(Button, { type: "link", icon: _jsx(QuestionOutlined, {}), children: "Ayuda" }), _jsx(Button, { type: "link", icon: _jsx(LogoutOutlined, {}), onClick: handleLogout, children: "Cerrar Sesi\u00F3n" })] })] }) }));
};

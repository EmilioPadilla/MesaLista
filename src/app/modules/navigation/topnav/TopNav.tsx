import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Gem,
  Gift,
  GiftIcon,
  Heart,
  LogOut,
  Search,
  User as UserIcon,
  BarChart3,
  Lightbulb,
  ListPlus,
  Tag,
  Mail,
  Settings,
  ListTodo,
  MailOpen,
} from 'lucide-react';
import { message, Tooltip, Button, Divider } from 'antd';
import { useGetUserBySlug, useIsAuthenticated, useLogout, useCurrentUser } from 'hooks/useUser';
import { useDeviceType } from 'hooks/useDeviceType';

interface TopNavProps {
  slug?: string;
  sticky?: boolean;
}

export const TopNav = ({ slug, sticky = true }: TopNavProps) => {
  const { data: guestViewUserData } = useGetUserBySlug(slug);
  const { data: currentUser } = useCurrentUser();
  const { data: isAuthenticated = false } = useIsAuthenticated();
  const currentPage = window.location.pathname;
  const navigate = useNavigate();
  const viewType = useDeviceType();
  const { logout } = useLogout();

  // Use currentUser if authenticated, otherwise use guestViewUserData for guest view
  const userData = isAuthenticated ? currentUser : guestViewUserData;
  // Get the actual slug from the authenticated user if available
  const userCoupleSlug = isAuthenticated ? currentUser?.slug : slug;

  const handleLogout = async () => {
    await logout();
    message.success('Has cerrado sesión exitosamente');
    navigate('/');
  };

  // Check if current page is checkout
  const isCheckout = currentPage.includes('/checkout') || currentPage.includes('/payment');

  // Render checkout header if on checkout page
  if (isCheckout) {
    return (
      <div className={`bg-card border-b shadow-lg backdrop-blur-sm ${sticky ? 'fixed top-0 left-0 right-0 z-50' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button type="text" size="small" onClick={() => navigate(`/${slug}/regalos`)} className="flex items-center space-x-2 !mr-0">
                <ArrowLeft className="h-4 w-4" />
                <span>Volver a Regalos</span>
              </Button>
              <Divider type="vertical" />
              <div className="flex items-center space-x-2">
                {viewType !== 'mobile' ? <img src="/svg/MesaLista_isologo.svg" alt="" /> : <img src="/svg/MesaLista_isotipo.svg" alt="" />}
              </div>
            </div>

            <div className="flex items-center space-x-2 !text-md text-muted-foreground">
              <div className="w-8 h-8 bg-[#d4704a] rounded-full flex items-center justify-center text-white text-sm font-medium">1</div>
              {viewType !== 'mobile' ? <span>Información</span> : <></>}
              <div className="w-8 h-0.5 bg-border"></div>
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm font-medium">2</div>
              {viewType !== 'mobile' ? <span>Pago</span> : <></>}
              <div className="w-8 h-0.5 bg-border"></div>
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm font-medium">3</div>
              {viewType !== 'mobile' ? <span>Confirmación</span> : <></>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Regular header for non-checkout pages
  return (
    <header
      className={`bg-card border-b border-border shadow-lg backdrop-blur-sm print:hidden ${sticky ? 'fixed top-0 left-0 right-0 z-50' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div
            className="flex items-center space-x-2 cursor-pointer transition-all duration-200 hover:scale-105"
            onClick={() => navigate(userCoupleSlug ? `/${userCoupleSlug}` : '/')}>
            {viewType !== 'mobile' ? (
              <img src="/svg/MesaLista_isologo.svg" className="w-24 h-24" alt="" />
            ) : (
              <img src="/svg/MesaLista_isotipo.svg" className="w-12 h-8" alt="" />
            )}
          </div>

          <div className="flex items-center">
            <nav className="flex items-center space-x-1">
              {/* Home Button */}
              <Tooltip title={viewType === 'mobile' ? 'Inicio' : ''} placement="bottom">
                <Button
                  type={currentPage === '/' || currentPage === `/${userCoupleSlug}` ? 'primary' : 'text'}
                  onClick={() => navigate(userCoupleSlug ? `/${userCoupleSlug}` : '/')}
                  className="flex items-center justify-center cursor-pointer transition-all duration-200 hover:shadow-md !rounded-lg !text-md">
                  <Heart className="h-4 w-4" />
                  <span className="hidden md:block">Inicio</span>
                </Button>
              </Tooltip>
              {/* Search Button */}
              {!isAuthenticated && (
                <Tooltip title={viewType === 'mobile' ? 'Buscar' : ''} placement="bottom">
                  <Button
                    type={currentPage === '/buscar' ? 'primary' : 'text'}
                    onClick={() => navigate('/buscar')}
                    className="flex items-center justify-center cursor-pointer transition-all duration-200 hover:shadow-md !rounded-lg !text-md">
                    <Search className="h-4 w-4" />
                    <span className="hidden md:block">Buscar</span>
                  </Button>
                </Tooltip>
              )}

              {/* Predefined Lists Button */}
              {userData?.role !== 'ADMIN' && (
                <Tooltip title={viewType === 'mobile' ? 'Colecciones' : ''} placement="bottom">
                  <Button
                    type={currentPage === '/colecciones' ? 'primary' : 'text'}
                    onClick={() => navigate('/colecciones')}
                    className="flex items-center justify-center cursor-pointer transition-all duration-200 hover:shadow-md !rounded-lg !text-md">
                    <Lightbulb className="h-4 w-4" />
                    <span className="hidden md:block">Colecciones</span>
                  </Button>
                </Tooltip>
              )}

              {!isAuthenticated && (
                <Tooltip title={viewType === 'mobile' ? 'Precios' : ''} placement="bottom">
                  <Button
                    type={currentPage === '/precios' ? 'primary' : 'text'}
                    onClick={() => navigate('/precios')}
                    className="flex items-center justify-center cursor-pointer transition-all duration-200 hover:shadow-md !rounded-lg !text-md">
                    <Gem className="h-4 w-4" />
                    <span className="hidden md:block">Precios</span>
                  </Button>
                </Tooltip>
              )}

              {userData?.role === 'COUPLE' && isAuthenticated && userCoupleSlug && (
                <Tooltip title={viewType === 'mobile' ? 'Mis Listas' : ''} placement="bottom">
                  <Button
                    type={currentPage === `/${userCoupleSlug}/listas` ? 'primary' : 'text'}
                    onClick={() => navigate(`/${userCoupleSlug}/listas`)}
                    className="flex items-center cursor-pointer transition-all duration-200 hover:shadow-md !rounded-lg !text-md">
                    <GiftIcon className="h-4 w-4" />
                    <span className="hidden md:block">Listas</span>
                  </Button>
                </Tooltip>
              )}

              {/* {userData?.role === 'COUPLE' && isAuthenticated && userCoupleSlug && (
                <Tooltip title={viewType === 'mobile' ? 'Gestionar' : ''} placement="bottom">
                  <Button
                    type={currentPage === `/${userCoupleSlug}/gestionar` ? 'primary' : 'text'}
                    onClick={() => navigate(`/${userCoupleSlug}/gestionar`)}
                    className="flex items-center cursor-pointer transition-all duration-200 hover:shadow-md !rounded-lg !text-md">
                    <GiftIcon className="h-4 w-4" />
                    <span className="hidden md:block">Gestionar</span>
                  </Button>
                </Tooltip>
              )} */}

              {/* {userData?.role === 'COUPLE' && isAuthenticated && userCoupleSlug && (
                <Tooltip title={viewType === 'mobile' ? 'Invitación' : ''} placement="bottom">
                  <Button
                    type={currentPage === `/${userCoupleSlug}/invitaciones` ? 'primary' : 'text'}
                    onClick={() => navigate(`/${userCoupleSlug}/invitaciones`)}
                    className="flex items-center cursor-pointer transition-all duration-200 hover:shadow-md !rounded-lg !text-md">
                    <MailOpen className="h-4 w-4" />
                    <span className="hidden md:block">Invitación</span>
                  </Button>
                </Tooltip>
              )} */}

              {userData?.role === 'COUPLE' && isAuthenticated && userCoupleSlug && (
                <Tooltip title={viewType === 'mobile' ? 'RSVP' : ''} placement="bottom">
                  <Button
                    type={currentPage === `/${userCoupleSlug}/gestionar-rsvp` ? 'primary' : 'text'}
                    onClick={() => navigate(`/${userCoupleSlug}/gestionar-rsvp`)}
                    className="flex items-center cursor-pointer transition-all duration-200 hover:shadow-md !rounded-lg !text-md">
                    <ListTodo className="h-4 w-4" />
                    <span className="hidden md:block">RSVP</span>
                  </Button>
                </Tooltip>
              )}

              {userData?.role === 'ADMIN' && isAuthenticated && (
                <Tooltip title={viewType === 'mobile' ? 'Analytics' : ''} placement="bottom">
                  <Button
                    type={currentPage === '/admin/analytics' ? 'primary' : 'text'}
                    onClick={() => navigate('/admin/analytics')}
                    className="flex items-center cursor-pointer transition-all duration-200 hover:shadow-md !rounded-lg !text-md">
                    <BarChart3 className="h-4 w-4" />
                    <span className="hidden md:block">Analytics</span>
                  </Button>
                </Tooltip>
              )}

              {userData?.role === 'ADMIN' && isAuthenticated && (
                <Tooltip title={viewType === 'mobile' ? 'Control' : ''} placement="bottom">
                  <Button
                    type={currentPage === '/admin/control' ? 'primary' : 'text'}
                    onClick={() => navigate('/admin/control')}
                    className="flex items-center cursor-pointer transition-all duration-200 hover:shadow-md !rounded-lg !text-md">
                    <Settings className="h-4 w-4" />
                    <span className="hidden md:block">Control</span>
                  </Button>
                </Tooltip>
              )}

              {userData?.role === 'ADMIN' && isAuthenticated && (
                <Tooltip title={viewType === 'mobile' ? 'Colecciones' : ''} placement="bottom">
                  <Button
                    type={currentPage === '/admin/colecciones' ? 'primary' : 'text'}
                    onClick={() => navigate('/admin/colecciones')}
                    className="flex items-center cursor-pointer transition-all duration-200 hover:shadow-md !rounded-lg !text-md">
                    <ListPlus className="h-4 w-4" />
                    <span className="hidden md:block">Colecciones</span>
                  </Button>
                </Tooltip>
              )}

              {userData?.role === 'ADMIN' && isAuthenticated && (
                <Tooltip title={viewType === 'mobile' ? 'Códigos de Descuento' : ''} placement="bottom">
                  <Button
                    type={currentPage === '/admin/codigos-descuento' ? 'primary' : 'text'}
                    onClick={() => navigate('/admin/codigos-descuento')}
                    className="flex items-center cursor-pointer transition-all duration-200 hover:shadow-md !rounded-lg !text-md">
                    <Tag className="h-4 w-4" />
                    <span className="hidden md:block">Descuentos</span>
                  </Button>
                </Tooltip>
              )}

              {userData && !isAuthenticated && userCoupleSlug && (
                <Button
                  type={currentPage === `/${userCoupleSlug}/regalos` ? 'primary' : 'text'}
                  onClick={() => navigate(`/${userCoupleSlug}/regalos`)}
                  className="flex items-center cursor-pointer transition-all duration-200 hover:shadow-md !rounded-lg !text-md">
                  <Gift className="h-4 w-4" />
                  <span className="hidden md:block">Regalos</span>
                </Button>
              )}
            </nav>

            {/* User Authentication */}
            {userData && isAuthenticated ? (
              <div className="flex items-center mx-1">
                {userData?.role !== 'ADMIN' && (
                  <div
                    onClick={() => navigate(`/${userCoupleSlug}/configuracion`)}
                    className={`flex items-center space-x-2 cursor-pointer px-3 py-1 ${currentPage === `/${userCoupleSlug}/configuracion` ? 'bg-primary' : 'bg-secondary/50'} rounded-full`}>
                    <div
                      className={`w-8 h-8 ${currentPage === `/${userCoupleSlug}/configuracion` ? 'bg-white' : 'bg-primary/20'} rounded-full flex items-center justify-center`}>
                      <UserIcon
                        className={`h-4 w-4 ${currentPage === `/${userCoupleSlug}/configuracion` ? 'text-primary' : 'text-primary'}`}
                      />
                    </div>
                    {viewType !== 'mobile' && (
                      <span
                        className={`!text-md ${currentPage === `/${userCoupleSlug}/configuracion` ? 'text-white' : 'text-foreground'} `}>
                        {userData?.firstName}
                      </span>
                    )}
                  </div>
                )}
                <Tooltip title={viewType === 'mobile' ? 'Salir' : ''} placement="bottom">
                  <Button
                    type="text"
                    size="middle"
                    onClick={handleLogout}
                    className="flex items-center ml-1 cursor-pointer rounded-lg! text-md!">
                    <LogOut className="h-4 w-4" />
                    <span className="hidden md:block">Salir</span>
                  </Button>
                </Tooltip>
              </div>
            ) : (
              <div className="flex items-center space-x-1 cursor-pointer">
                <Button
                  type="text"
                  onClick={() => navigate('/login')}
                  className="transition-all cursor-pointer duration-200 hover:shadow-md !rounded-lg !text-md">
                  <UserIcon className="h-4 w-4" />
                  <span className="hidden md:block">Iniciar Sesión</span>
                </Button>
                {viewType !== 'mobile' && (
                  <Button
                    type="text"
                    onClick={() => navigate('/registro')}
                    className="transition-all cursor-pointer duration-200 hover:shadow-md !rounded-lg !text-md">
                    <span>Registrarse</span>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

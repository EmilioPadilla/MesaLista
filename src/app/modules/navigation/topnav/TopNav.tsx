import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Gem, Gift, GiftIcon, Heart, LogOut, Search, User as UserIcon, BarChart3 } from 'lucide-react';
import { message, Tooltip, Button, Divider } from 'antd';
import { useGetUserBySlug, useIsAuthenticated, useLogout, useCurrentUser } from 'hooks/useUser';
import { useDeviceType } from 'hooks/useDeviceType';

interface TopNavProps {
  coupleSlug?: string;
}

export const TopNav = ({ coupleSlug }: TopNavProps) => {
  const { data: guestViewUserData } = useGetUserBySlug(coupleSlug);
  const { data: currentUser } = useCurrentUser();
  const { data: isAuthenticated = false } = useIsAuthenticated();
  const currentPage = window.location.pathname;
  const navigate = useNavigate();
  const viewType = useDeviceType();
  const { logout } = useLogout();

  // Use currentUser if authenticated, otherwise use guestViewUserData for guest view
  const userData = isAuthenticated ? currentUser : guestViewUserData;
  // Get the actual coupleSlug from the authenticated user if available
  const userCoupleSlug = isAuthenticated ? currentUser?.coupleSlug : coupleSlug;

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
      <div className="bg-card border-b shadow-lg backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                type="text"
                size="small"
                onClick={() => navigate(`/${coupleSlug}/regalos`)}
                className="flex items-center space-x-2 !mr-0">
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
    <header className="bg-card border-b border-border shadow-lg backdrop-blur-sm print:hidden">
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

          <div className="flex items-center space-x-4">
            <nav className="flex items-center space-x-2">
              <Tooltip title={viewType === 'mobile' ? 'Inicio' : ''} placement="bottom">
                <Button
                  type={currentPage === '/' || currentPage === `/${userCoupleSlug}` ? 'primary' : 'text'}
                  onClick={() => navigate(userCoupleSlug ? `/${userCoupleSlug}` : '/')}
                  className="flex items-center justify-center space-x-2 cursor-pointer transition-all duration-200 hover:shadow-md !rounded-lg !text-md">
                  <Heart className="h-4 w-4" />
                  {viewType !== 'mobile' && <span>Inicio</span>}
                </Button>
              </Tooltip>
              <Tooltip title={viewType === 'mobile' ? 'Buscar' : ''} placement="bottom">
                <Button
                  type={currentPage === '/buscar' ? 'primary' : 'text'}
                  onClick={() => navigate('/buscar')}
                  className="flex items-center justify-center space-x-2 cursor-pointer transition-all duration-200 hover:shadow-md !rounded-lg !text-md">
                  <Search className="h-4 w-4" />
                  {viewType !== 'mobile' && <span>Buscar</span>}
                </Button>
              </Tooltip>

              <Tooltip title={viewType === 'mobile' ? 'Precios' : ''} placement="bottom">
                <Button
                  type={currentPage === '/precios' ? 'primary' : 'text'}
                  onClick={() => navigate('/precios')}
                  className="flex items-center justify-center space-x-2 cursor-pointer transition-all duration-200 hover:shadow-md !rounded-lg !text-md">
                  <Gem className="h-4 w-4" />
                  {viewType !== 'mobile' && <span>Precios</span>}
                </Button>
              </Tooltip>

              {userData?.role === 'COUPLE' && isAuthenticated && userCoupleSlug && (
                <Tooltip title={viewType === 'mobile' ? 'Gestionar' : ''} placement="bottom">
                  <Button
                    type={currentPage === `/${userCoupleSlug}/gestionar` ? 'primary' : 'text'}
                    onClick={() => navigate(`/${userCoupleSlug}/gestionar`)}
                    className="flex items-center space-x-2 cursor-pointer transition-all duration-200 hover:shadow-md !rounded-lg !text-md">
                    <GiftIcon className="h-4 w-4" />
                    {viewType !== 'mobile' && <span>Gestionar</span>}
                  </Button>
                </Tooltip>
              )}

              {userData?.role === 'ADMIN' && isAuthenticated && (
                <Tooltip title={viewType === 'mobile' ? 'Analytics' : ''} placement="bottom">
                  <Button
                    type={currentPage === '/admin/analytics' ? 'primary' : 'text'}
                    onClick={() => navigate('/admin/analytics')}
                    className="flex items-center space-x-2 cursor-pointer transition-all duration-200 hover:shadow-md !rounded-lg !text-md">
                    <BarChart3 className="h-4 w-4" />
                    {viewType !== 'mobile' && <span>Analytics</span>}
                  </Button>
                </Tooltip>
              )}

              {userData && !isAuthenticated && userCoupleSlug && (
                <Button
                  type={currentPage === `/${userCoupleSlug}/regalos` ? 'primary' : 'text'}
                  onClick={() => navigate(`/${userCoupleSlug}/regalos`)}
                  className="flex items-center space-x-2 cursor-pointer transition-all duration-200 hover:shadow-md !rounded-lg !text-md">
                  <Gift className="h-4 w-4" />
                  {viewType !== 'mobile' && <span>Regalos</span>}
                </Button>
              )}
            </nav>

            {/* User Authentication */}
            {userData && isAuthenticated ? (
              <div className="flex items-center space-x-3">
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
                    className="flex items-center space-x-1 cursor-pointer !rounded-lg !text-md">
                    <LogOut className="h-4 w-4" />
                    {viewType !== 'mobile' && <span>Salir</span>}
                  </Button>
                </Tooltip>
              </div>
            ) : (
              <div className="flex items-center space-x-2 cursor-pointer">
                <Button
                  type="text"
                  onClick={() => navigate('/login')}
                  className="transition-all cursor-pointer duration-200 hover:shadow-md !rounded-lg !text-md">
                  {viewType !== 'mobile' ? <span>Iniciar Sesión</span> : <UserIcon className="h-4 w-4" />}
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

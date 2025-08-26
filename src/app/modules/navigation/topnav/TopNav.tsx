import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from 'components/core/Button';
import { ArrowLeft, Gift, Heart, LogOut, Search, User as UserIcon, Users } from 'lucide-react';
import { message, Tooltip } from 'antd';
import { userService } from 'services/user.service';
import { useGetUserBySlug } from 'hooks/useUser';
import { Separator } from 'components/core/Separator';
import { useDeviceType } from 'hooks/useDeviceType';
import { LoginOutlined } from '@ant-design/icons';

interface TopNavProps {
  coupleSlug?: string;
}

export const TopNav = ({ coupleSlug }: TopNavProps) => {
  const { data: userData } = useGetUserBySlug(coupleSlug);
  const isAuthenticated = userService.isAuthenticated();
  const currentPage = window.location.pathname;
  const navigate = useNavigate();
  const viewType = useDeviceType();
  const handleLogout = () => {
    userService.logout();
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
              <Button variant="ghost" size="sm" onClick={() => navigate(`/${coupleSlug}/regalos`)} className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Volver a Regalos</span>
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center space-x-2">
                <Heart className="h-6 w-6 text-primary" />
                {viewType !== 'mobile' ? <span className="text-lg text-primary">MesaLista</span> : <></>}
              </div>
            </div>

            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs">1</div>
              <span>Información</span>
              <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center text-xs">2</div>
              <span>Pago</span>
              <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center text-xs">3</div>
              <span>Confirmación</span>
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
            onClick={() => navigate(coupleSlug ? `/${coupleSlug}` : '/')}>
            <div className="p-1 rounded-full bg-primary/10">
              <Heart className="h-8 w-8 text-primary" />
            </div>
            {viewType !== 'mobile' ? (
              <span className="text-2xl text-primary bg-gradient-to-r from-primary to-primary/80 bg-clip-text">MesaLista</span>
            ) : (
              <></>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <nav className="flex items-center space-x-2">
              <Tooltip title={viewType === 'mobile' ? 'Inicio' : ''} placement="bottom">
                <Button
                  variant={currentPage === '/' || currentPage === `/${coupleSlug}` ? 'default' : 'ghost'}
                  onClick={() => navigate(coupleSlug ? `/${coupleSlug}` : '/')}
                  className="flex items-center space-x-2 cursor-pointer transition-all duration-200 hover:shadow-md">
                  <Heart className="h-4 w-4" />
                  {viewType !== 'mobile' ? <span>Inicio</span> : <></>}
                </Button>
              </Tooltip>
              <Tooltip title={viewType === 'mobile' ? 'Buscar' : ''} placement="bottom">
                <Button
                  variant={currentPage === '/buscar' ? 'default' : 'ghost'}
                  onClick={() => navigate('/buscar')}
                  className="flex items-center space-x-2 cursor-pointer transition-all duration-200 hover:shadow-md">
                  <Search className="h-4 w-4" />
                  {viewType !== 'mobile' ? <span>Buscar</span> : <></>}
                </Button>
              </Tooltip>

              {userData?.role === 'COUPLE' && isAuthenticated && (
                <Tooltip title={viewType === 'mobile' ? 'Gestionar' : ''} placement="bottom">
                  <Button
                    variant={currentPage === `/${coupleSlug}/gestionar` ? 'default' : 'ghost'}
                    onClick={() => navigate(`/${coupleSlug}/gestionar`)}
                    className="flex items-center space-x-2 cursor-pointer transition-all duration-200 hover:shadow-md">
                    <Users className="h-4 w-4" />
                    {viewType !== 'mobile' ? <span>Gestionar</span> : <></>}
                  </Button>
                </Tooltip>
              )}

              {userData && !isAuthenticated && (
                <Button
                  variant={currentPage === `/${coupleSlug}/regalos` ? 'default' : 'ghost'}
                  onClick={() => navigate(`/${coupleSlug}/regalos`)}
                  className="flex items-center space-x-2 cursor-pointer transition-all duration-200 hover:shadow-md">
                  <Gift className="h-4 w-4" />
                  {viewType !== 'mobile' ? <span>Regalos</span> : <></>}
                </Button>
              )}
            </nav>

            {/* User Authentication */}
            {userData && isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 cursor-pointer px-3 py-1 bg-secondary/50 rounded-full">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    <UserIcon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm text-foreground">{userData?.firstName}</span>
                </div>
                <Tooltip title={viewType === 'mobile' ? 'Salir' : ''} placement="bottom">
                  <Button variant="ghost" size="sm" onClick={handleLogout} className="flex items-center space-x-1 cursor-pointer">
                    <LogOut className="h-4 w-4" />
                    {viewType !== 'mobile' ? <span>Salir</span> : <></>}
                  </Button>
                </Tooltip>
              </div>
            ) : (
              <div className="flex items-center space-x-2 cursor-pointer">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/login')}
                  className="transition-all cursor-pointer duration-200 hover:shadow-md">
                  {viewType !== 'mobile' ? <span>Iniciar Sesión</span> : <LoginOutlined />}
                </Button>
                {/* {(
                  <Button onClick={() => navigate('/registro')} className="transition-all cursor-pointer duration-200 hover:shadow-md">
                    <span>Registrarse</span>
                  </Button>
                )} */}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from 'components/core/Button';
import { Gift, Heart, LogOut, User as UserIcon, Users } from 'lucide-react';
import { message } from 'antd';
import { userService } from 'services/user.service';
import { useGetUserBySlug } from 'hooks/useUser';

interface TopNavProps {
  coupleSlug?: string;
}

export const TopNav = ({ coupleSlug }: TopNavProps) => {
  const { data: userData } = useGetUserBySlug(coupleSlug);
  const isAuthenticated = userService.isAuthenticated();
  const currentPage = window.location.pathname;
  const navigate = useNavigate();
  const handleLogout = () => {
    userService.logout();
    message.success('Has cerrado sesión exitosamente');
    navigate('/');
  };

  return (
    <header className="bg-card border-b border-border shadow-lg backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div
            className="flex items-center space-x-2 cursor-pointer transition-all duration-200 hover:scale-105"
            onClick={() => navigate('/')}>
            <div className="p-1 rounded-full bg-primary/10">
              <Heart className="h-8 w-8 text-primary" />
            </div>
            <span className="text-2xl text-primary bg-gradient-to-r from-primary to-primary/80 bg-clip-text">MesaLista</span>
          </div>

          <div className="flex items-center space-x-4">
            <nav className="flex items-center space-x-2">
              <Button
                variant={currentPage === '/' || currentPage === `/${coupleSlug}` ? 'default' : 'ghost'}
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 transition-all duration-200 hover:shadow-md">
                <Heart className="h-4 w-4" />
                <span>Inicio</span>
              </Button>

              {userData?.role === 'COUPLE' && isAuthenticated && (
                <Button
                  variant={currentPage === `/${coupleSlug}/gestionar` ? 'default' : 'ghost'}
                  onClick={() => navigate(`/${coupleSlug}/gestionar`)}
                  className="flex items-center space-x-2 transition-all duration-200 hover:shadow-md">
                  <Users className="h-4 w-4" />
                  <span>Gestionar</span>
                </Button>
              )}

              {userData && userData.role !== 'COUPLE' && (
                <Button
                  variant={currentPage === `/${coupleSlug}/buy` ? 'default' : 'ghost'}
                  onClick={() => navigate(`/${coupleSlug}/buy`)}
                  className="flex items-center space-x-2 transition-all duration-200 hover:shadow-md">
                  <Gift className="h-4 w-4" />
                  <span>Regalos</span>
                </Button>
              )}
            </nav>

            {/* User Authentication */}
            {userData && isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 px-3 py-1 bg-secondary/50 rounded-full">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    <UserIcon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm text-foreground">{userData?.firstName}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="flex items-center space-x-1">
                  <LogOut className="h-4 w-4" />
                  <span>Salir</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" onClick={() => navigate('/login')} className="transition-all duration-200 hover:shadow-md">
                  Iniciar Sesión
                </Button>
                <Button onClick={() => navigate('/registrar')} className="transition-all duration-200 hover:shadow-md">
                  Registrarse
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

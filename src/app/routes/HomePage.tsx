import { Heart, Gift, Users, Star, Shield, Sparkles, Plus, BarChart3 } from 'lucide-react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useGetUserBySlug, useIsAuthenticated } from 'hooks/useUser';
import { OutletContextType } from './guest/PublicRegistry';
import { useWeddingListByCouple } from 'hooks/useWeddingList';
import { Tooltip, Button, Card, Tag } from 'antd';

export const HomePage = () => {
  const contextData = useOutletContext<OutletContextType>();
  const { data: userData } = useGetUserBySlug(contextData?.coupleSlug);
  const { data: weddinglist } = useWeddingListByCouple(userData?.id);
  const { data: isAuthenticated = false } = useIsAuthenticated();
  const navigate = useNavigate();

  const purchasedGifts = weddinglist?.gifts.filter((gift) => gift.isPurchased).length;
  const totalGifts = weddinglist?.gifts.length;
  const progress = (purchasedGifts! / totalGifts!) * 100;

  const unknownUserHero = () => (
    <>
      <div className="flex justify-center mb-8">
        <Tag bordered={false} className="!px-4 !py-2 shadow-md backdrop-blur-sm !rounded-lg font-bold !bg-white">
          ✨ La mesa de regalos más querida de México
        </Tag>
      </div>

      <h1 className="text-5xl md:text-7xl mb-6 text-primary bg-gradient-to-r from-primary to-primary/70 bg-clip-text">
        Mesa<span className="text-accent-foreground">Lista</span>
      </h1>

      <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-muted-foreground leading-relaxed">
        Crea la mesa de regalos perfecta para tu boda. Tus invitados podrán elegir el regalo ideal y tú tendrás todo organizado en un solo
        lugar.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Tooltip trigger={['click']} title="¡Funcionalidad disponible pronto!">
          <Button type="primary" size="large" className="px-8 py-4 hover:-translate-y-1">
            <Heart className="mr-2 h-5 w-5" />
            Crear Mesa de Regalos
          </Button>
        </Tooltip>
        <Button
          size="large"
          variant="outlined"
          className="px-8 py-4 hover:-translate-y-1 !border-primary !text-primary"
          onClick={() => navigate('/buscar')}>
          <Gift className="mr-2 h-5 w-5" />
          Buscar Mesa de Regalos
        </Button>
      </div>
    </>
  );

  const userHero = () => (
    <>
      <div className="flex justify-center mb-8">
        <div className="px-4 py-2 shadow-md backdrop-blur-sm border border-primary/20 rounded-lg">
          👋 Bienvenido {isAuthenticated ? `de vuelta ${userData?.firstName}` : ' invitad@'}!
        </div>
      </div>

      <h1 className="text-4xl md:text-6xl mb-6 text-primary">
        {isAuthenticated ? '¡Tu mesa de regalos te está esperando!' : '¡Encuentra el regalo perfecto!'}
      </h1>

      <p className="text-xl mb-8 max-w-2xl mx-auto text-muted-foreground leading-relaxed">
        {isAuthenticated
          ? 'Gestiona tu lista, ve estadísticas y mantente al día con las compras de tus invitados.'
          : 'Explora las mesas de regalos disponibles y encuentra el regalo ideal para esa pareja especial.'}
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        {isAuthenticated ? (
          <>
            <Button
              size="large"
              type="primary"
              className="px-8 py-4 hover:-translate-y-1 !bg-primary"
              onClick={() => navigate('gestionar')}>
              <BarChart3 className="mr-2 h-5 w-5" />
              Ver Mi Mesa de Regalos
            </Button>
            <Button
              size="large"
              variant="outlined"
              className="px-8 py-4 hover:-translate-y-1 !border-primary !text-primary"
              onClick={() => navigate('gestionar?addGift=true')}>
              <Plus className="mr-2 h-5 w-5" />
              Agregar Regalos
            </Button>
          </>
        ) : (
          <>
            <Button size="large" type="primary" className="px-8 py-4 hover:-translate-y-1 !bg-primary" onClick={() => navigate('regalos')}>
              <Gift className="mr-2 h-5 w-5" />
              Explorar Mesa de Regalos de Pareja
            </Button>
            <Button
              size="large"
              className="px-8 py-4 hover:-translate-y-1 !border-primary !text-primary"
              onClick={() => navigate('/buscar')}>
              <Heart className="mr-2 h-5 w-5" />
              Buscar por Pareja
            </Button>
          </>
        )}
      </div>
    </>
  );

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-secondary/30 via-background to-accent/20 py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5"></div>
        <div className="absolute top-10 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-accent/20 rounded-full blur-2xl"></div>

        <div className="relative max-w-7xl mx-auto text-center">{!userData ? unknownUserHero() : userHero()}</div>
      </section>

      {/* Quick Stats for Couples */}
      {userData?.role === 'COUPLE' && isAuthenticated && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-secondary/10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl mb-8 text-center text-primary">Resumen de tu Mesa de Regalos</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-secondary/20 text-center !rounded-2xl">
                <div className="text-3xl text-primary mb-2">{totalGifts}</div>
                <div className="!text-md text-muted-foreground">Regalos en tu lista</div>
              </Card>
              <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-accent/20 text-center !rounded-2xl">
                <div className="text-3xl text-green-600 mb-2">{purchasedGifts}</div>
                <div className="!text-md text-muted-foreground">Regalos comprados</div>
              </Card>
              <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-secondary/20 text-center !rounded-2xl">
                <div className="text-3xl text-primary mb-2">{progress.toFixed(2)}%</div>
                <div className="!text-md text-muted-foreground">Progreso completado</div>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-secondary/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl mb-6 text-primary">¿Por qué elegir MesaLista?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Hacemos que organizar tu mesa de regalos sea tan especial como tu gran día
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-card to-secondary/30 !rounded-2xl">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mb-4 shadow-md">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <div className="text-primary">Fácil de Crear</div>
                <div className="text-muted-foreground leading-relaxed">
                  Configura tu mesa de regalos en minutos. Añade productos, organiza categorías y personaliza tu lista a tu gusto.
                </div>
              </div>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-card to-accent/20 !rounded-2xl">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mb-4 shadow-md">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <div className="text-primary">Compras Seguras</div>
                <div className="text-muted-foreground leading-relaxed">
                  Tus invitados pueden comprar con confianza. Procesamos pagos de forma segura y enviamos directamente a tu hogar.
                </div>
              </div>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-card to-secondary/30 !rounded-2xl">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mb-4 shadow-md">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <div className="text-primary">Gestión Completa</div>
                <div className="text-muted-foreground leading-relaxed">
                  Ve estadísticas de tu mesa, administra regalos, y mantente al día con las compras de tus invitados.
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="bg-gradient-to-r from-secondary/40 via-accent/20 to-secondary/40 py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-12 shadow-2xl border border-primary/10">
            <div className="flex justify-center mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-6 w-6 text-yellow-400 fill-current" />
              ))}
            </div>

            <blockquote className="text-2xl mb-8 text-primary italic leading-relaxed">
              "MesaLista hizo que organizar nuestra mesa de regalos fuera súper fácil. Nuestros invitados amaron la experiencia y nosotros
              pudimos enfocarnos en disfrutar nuestro día especial."
            </blockquote>

            <div className="flex items-center justify-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center shadow-md">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-primary">María y Carlos</p>
                <p className="text-muted-foreground">Bodas Guadalajara 2024</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!userData && (
        <section className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]"></div>

          <div className="relative max-w-4xl mx-auto text-center">
            <h2 className="text-4xl mb-6 text-primary-foreground">¿Listos para comenzar?</h2>
            <p className="text-xl mb-8 text-primary-foreground/90 leading-relaxed">
              Crea tu mesa de regalos hoy y haz que tu boda sea aún más especial
            </p>
            <Tooltip trigger={['click']} title="¡Funcionalidad disponible pronto!">
              <Button size="large" type="default" className="px-8 py-4 transition-all duration-300 transform hover:-translate-y-1 border-0">
                <Heart className="mr-2 h-5 w-5" />
                Empezar Ahora - Es Gratis
              </Button>
            </Tooltip>
          </div>
        </section>
      )}
    </div>
  );
};

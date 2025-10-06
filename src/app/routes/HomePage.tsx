import { useEffect } from 'react';
import { Heart, Gift, Shield, Sparkles, Plus, BarChart3, CheckCircle, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useGetUserBySlug, useIsAuthenticated } from 'hooks/useUser';
import { OutletContextType } from './guest/PublicRegistry';
import { useWeddingListByCouple } from 'hooks/useWeddingList';
import { Tooltip, Button, Card, Divider } from 'antd';
import { Footer } from '../modules/navigation/Footer';

export const HomePage = () => {
  const contextData = useOutletContext<OutletContextType>();
  const { data: userData } = useGetUserBySlug(contextData?.coupleSlug);
  const { data: weddinglist } = useWeddingListByCouple(userData?.id);
  const { data: isAuthenticated = false } = useIsAuthenticated();
  const navigate = useNavigate();

  const purchasedGifts = weddinglist?.gifts.filter((gift) => gift.isPurchased).length;
  const totalGifts = weddinglist?.gifts.length;
  const progress = (purchasedGifts! / totalGifts!) * 100;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const unknownUserHero = () => (
    <>
      <h1 className="text-6xl md:text-8xl font-semibold tracking-tight text-foreground mb-8 leading-tight">MesaLista</h1>
      <p className="text-2xl md:text-3xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed font-light">
        La forma más elegante de crear y gestionar tu mesa de regalos de boda.
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

      <h1 className="text-4xl md:text-6xl mb-6">
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
      <section className="relative bg-white py-20 px-4 sm:px-6 lg:px-8 min-h-[90vh] flex items-center">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="relative max-w-7xl mx-auto text-center">{!userData ? unknownUserHero() : userHero()}</div>
          </motion.div>

          {userData?.role === 'COUPLE' && isAuthenticated && (
            <section className="py-16 px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl mb-8 text-center ">Resumen de tu Mesa de Regalos</h2>
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

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="relative">
            <div className="rounded-3xl overflow-hidden shadow-2xl mx-auto max-w-6xl mt-20">
              <img src="/images/HP.JPG" alt="Elegant wedding table setting" className="w-full h-[500px] object-cover" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section - Apple Product Grid Style */}
      <section className="bg-[#f5f5f7] py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}>
            <h2 className="text-5xl md:text-6xl font-semibold text-foreground mb-6 tracking-tight">Diseñado para ser simple.</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed">
              Cada detalle ha sido cuidadosamente pensado para hacer que tu experiencia sea perfecta.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-12">
            {[
              {
                title: 'Pagos seguros',
                description: 'Stripe y PayPal integrados con encriptación de nivel bancario para transacciones completamente seguras.',
                icon: Shield,
                image: '/images/payments.png',
              },
              {
                title: 'Estadísticas completas',
                description: 'Ve el progreso de tu mesa en tiempo real con análisis detallados y reportes comprensivos.',
                icon: Sparkles,
                image: '/images/statistics.png',
              },
              {
                title: 'Soporte dedicado',
                description: 'Preguntas frecuentes detalladas y soporte personalizado cuando lo necesites.',
                icon: CheckCircle,
                image: '/images/greatSupport.png',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center">
                <div className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-lg transition-all duration-300">
                  <div className="rounded-2xl overflow-hidden mb-8">
                    <img src={feature.image} alt={feature.title} className="w-full h-64 object-cover" />
                  </div>
                  <div className="mb-6">
                    <feature.icon className="h-8 w-8 text-[#d4704a] mx-auto" />
                  </div>
                  <h3 className="text-2xl font-semibold text-foreground mb-4 tracking-tight">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed font-light">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="bg-white py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}>
            <h2 className="text-5xl md:text-6xl font-semibold text-foreground mb-6 tracking-tight">Así de fácil.</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed">
              Tres pasos para tener tu mesa de regalos perfecta.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-16">
            {[
              {
                step: '01',
                title: 'Crea tu cuenta',
                description: 'Regístrate en menos de 2 minutos y personaliza tu perfil de pareja.',
              },
              {
                step: '02',
                title: 'Agrega tus regalos',
                description: 'Selecciona productos de nuestro catálogo o agrega los tuyos propios.',
              },
              {
                step: '03',
                title: 'Comparte con invitados',
                description: 'Envía el enlace a tus invitados y deja que elijan sus regalos favoritos.',
              },
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center">
                <div className="text-6xl font-light text-[#d4704a] mb-6 tracking-tight">{step.step}</div>
                <h3 className="text-2xl font-semibold text-foreground mb-4 tracking-tight">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed font-light">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="bg-[#f5f5f7] py-24 px-4 sm:px-6 lg:px-8">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}>
          <blockquote className="text-3xl md:text-4xl font-light text-foreground mb-12 leading-relaxed tracking-tight">
            "MesaLista transformó completamente nuestra experiencia de boda. Elegante, simple y perfecto."
          </blockquote>

          <div className="flex items-center justify-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[#d4704a]/20 to-[#d4704a]/10 rounded-full flex items-center justify-center">
              <Heart className="h-8 w-8 text-[#d4704a]" />
            </div>
            <div className="text-left">
              <p className="text-lg font-medium text-foreground">María y Carlos</p>
              <p className="text-muted-foreground">Ciudad de México, 2024</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated ? (
        <section className="bg-white py-24 px-4 sm:px-6 lg:px-8">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}>
            <h2 className="text-5xl md:text-6xl font-semibold text-foreground mb-8 tracking-tight">Comienza hoy.</h2>
            <p className="text-xl text-muted-foreground mb-12 font-light leading-relaxed">Crea tu mesa de regalos perfecta en minutos.</p>
            <Tooltip trigger={['click']} title="¡Funcionalidad disponible pronto!">
              <Button
                size="large"
                type="primary"
                className="px-12 py-4 text-lg bg-[#007aff] hover:bg-[#0051d0] text-white rounded-full border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                // onClick={() => navigate('registro')}
              >
                Empezar gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Tooltip>
          </motion.div>
        </section>
      ) : (
        <section className="bg-white py-24 px-4 sm:px-6 lg:px-8">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}>
            <h2 className="text-5xl md:text-6xl font-semibold text-foreground mb-8 tracking-tight">Visita tu Mesa de Regalos.</h2>
            <p className="text-xl text-muted-foreground mb-12 font-light leading-relaxed">
              Accede a tu mesa de regalos y comienza a gestionar tus invitados.
            </p>
            <Button
              size="large"
              type="primary"
              className="px-12 py-4 text-lg bg-[#007aff] hover:bg-[#0051d0] text-white rounded-full border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => navigate('regalos')}>
              Visitar
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </section>
      )}

      {/* Footer - Minimal Apple Style */}
      <Footer />
    </div>
  );
};

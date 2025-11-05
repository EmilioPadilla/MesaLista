import { useEffect } from 'react';
import {
  Heart,
  Gift,
  Shield,
  Sparkles,
  Plus,
  BarChart3,
  Calendar,
  CheckCircle,
  ArrowRight,
  Mail,
  MessageSquare,
  Users,
  Star,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useGetUserBySlug, useIsAuthenticated } from 'hooks/useUser';
import { OutletContextType } from './guest/PublicRegistry';
import { useWeddingListByCouple } from 'hooks/useWeddingList';
import { Badge, Button, Card, Skeleton } from 'antd';
import { Footer } from '../modules/navigation/Footer';

export const HomePage = () => {
  const contextData = useOutletContext<OutletContextType>();
  const { data: userData, isLoading: isLoadingUser } = useGetUserBySlug(contextData?.coupleSlug);
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
        <Button onClick={() => navigate('/registro')} type="primary" size="large" className="px-8 py-4 hover:-translate-y-1">
          <Heart className="mr-2 h-5 w-5" />
          Crear Mesa de Regalos
        </Button>
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
          👋 Bienvenid@ {isAuthenticated ? `de vuelta, ${userData?.firstName}` : ' invitad@'}!
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

  const loadingSkeleton = () => (
    <>
      <div className="flex justify-center mb-8">
        <Skeleton.Button active size="small" className="!w-48 !h-10" />
      </div>

      <Skeleton.Input active size="large" className="!w-full max-w-3xl !h-20 mb-6" block />

      <div className="max-w-2xl mx-auto mb-8">
        <Skeleton.Input active size="default" className="!w-full !h-8" block />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Skeleton.Button active size="large" className="!w-64 !h-14" />
        <Skeleton.Button active size="large" className="!w-64 !h-14" />
      </div>
    </>
  );

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-white py-20 px-4 sm:px-6 lg:px-8 min-h-[90vh] flex items-center">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="relative max-w-7xl mx-auto text-center">
              {isLoadingUser && contextData?.coupleSlug ? loadingSkeleton() : !userData ? unknownUserHero() : userHero()}
            </div>
          </motion.div>

          {userData?.role === 'COUPLE' && isAuthenticated && (
            <section className="py-16 px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl mb-8 text-center ">Resumen de tu Mesa de Regalos</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  <Card className="border-0 shadow-lg bg-linear-to-br from-card to-secondary/20 text-center !rounded-2xl">
                    <div className="text-3xl text-primary mb-2">{totalGifts}</div>
                    <div className="!text-md text-muted-foreground">Regalos en tu lista</div>
                  </Card>
                  <Card className="border-0 shadow-lg bg-linear-to-br from-card to-accent/20 text-center !rounded-2xl">
                    <div className="text-3xl text-green-600 mb-2">{purchasedGifts}</div>
                    <div className="!text-md text-muted-foreground">Regalos comprados</div>
                  </Card>
                  <Card className="border-0 shadow-lg bg-linear-to-br from-card to-secondary/20 text-center !rounded-2xl">
                    <div className="text-3xl text-primary mb-2">{progress ? progress.toFixed(2) : 0}%</div>
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
                description: 'Stripe y PayPal integrados para transacciones completamente seguras.',
                icon: Shield,
                image: '/images/payments.png',
              },
              {
                title: 'Estadísticas completas',
                description: 'Analiza tu mesa en tiempo real con análisis detallados y reportes comprensivos.',
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

      {/* RSVP Section - New Feature Highlight */}
      <section className="relative bg-linear-to-br from-primary/5 via-white to-[#34c759]/5 py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#34c759]/5 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}>
            <Badge className="mb-6! bg-primary/10! text-primary! border-primary/20! px-6! py-2! text-sm! rounded-lg">Nuevo</Badge>
            <h2 className="text-5xl md:text-7xl font-semibold text-foreground mb-8 tracking-tight">
              Gestión de RSVPs.
              <br />
              <span className="text-primary">Perfecta y sin esfuerzo.</span>
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto font-light leading-relaxed">
              Administra tus confirmaciones de asistencia con la misma elegancia que tu mesa de regalos. Todo en un solo lugar.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-16">
            {/* Left side - Features list */}
            <motion.div
              className="space-y-8"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}>
              {[
                {
                  icon: Users,
                  title: 'Control total de invitados',
                  description: 'Importa listas masivamente, gestiona boletos y actualiza en tiempo real.',
                },
                {
                  icon: MessageSquare,
                  title: 'Mensajes personalizados',
                  description: 'Tus invitados pueden dejar mensajes especiales al confirmar su asistencia.',
                },
                {
                  icon: Mail,
                  title: 'Códigos únicos de invitación',
                  description: 'Cada invitado recibe un código secreto para confirmar de forma segura.',
                },
                {
                  icon: Sparkles,
                  title: 'Estadísticas en vivo',
                  description: 'Visualiza confirmaciones, rechazos y pendientes con gráficas detalladas.',
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className="flex gap-6 items-start group"
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                  viewport={{ once: true }}>
                  <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-primary to-[#d4a574] flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2 tracking-tight">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed font-light">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Right side - Visual showcase */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="relative">
              <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden border border-border/30">
                <div className="bg-linear-to-r from-primary to-[#d4a574] p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-white text-2xl font-semibold mb-1">Panel RSVP</h3>
                      <p className="text-white/80 text-sm">María y Carlos</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Confirmados', value: '87', color: 'bg-[#34c759]' },
                      { label: 'Pendientes', value: '23', color: 'bg-[#ff9500]' },
                      { label: 'Rechazados', value: '5', color: 'bg-[#ff3b30]' },
                    ].map((stat, idx) => (
                      <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                        <div className={`w-2 h-2 rounded-full ${stat.color} mb-2`}></div>
                        <p className="text-white/70 text-xs mb-1">{stat.label}</p>
                        <p className="text-white text-2xl font-semibold">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-8 space-y-4">
                  {[
                    { name: 'Ana García', status: 'confirmed', tickets: '2' },
                    { name: 'Luis Martínez', status: 'pending', tickets: '3' },
                    { name: 'Carmen Ruiz', status: 'confirmed', tickets: '2', hasMessage: true },
                  ].map((guest, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-[#f5f5f7] rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-foreground font-medium flex items-center gap-2">
                            {guest.name}
                            {guest.hasMessage && <MessageSquare className="h-4 w-4 text-primary" />}
                          </p>
                          <p className="text-xs text-muted-foreground">{guest.tickets} boletos</p>
                        </div>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          guest.status === 'confirmed' ? 'bg-[#34c759]/10 text-[#34c759]' : 'bg-[#ff9500]/10 text-[#ff9500]'
                        }`}>
                        {guest.status === 'confirmed' ? 'Confirmado' : 'Pendiente'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating badge */}
              <motion.div
                className="absolute -top-6 -right-6 bg-white rounded-2xl shadow-xl p-4 border border-border/30"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[#34c759] to-[#30d158] flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tasa de respuesta</p>
                    <p className="text-2xl font-semibold text-foreground">95%</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>

          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            viewport={{ once: true }}>
            <p className="text-lg text-muted-foreground mb-6 font-light">Incluido sin costo adicional en todos nuestros planes</p>
            {!isAuthenticated && (
              <Button size="large" onClick={() => navigate('/registro')} type="primary">
                Comenzar ahora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            )}
          </motion.div>
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
            <div className="w-16 h-16 bg-linear-to-br from-[#d4704a]/20 to-[#d4704a]/10 rounded-full flex items-center justify-center">
              <Heart className="h-8 w-8 text-[#d4704a]" />
            </div>
            <div className="text-left">
              <p className="text-lg font-medium text-foreground">María y Carlos</p>
              <p className="text-muted-foreground">Ciudad de México, 2025</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Pre-designed Registries Section - Enhanced */}
      <section className="relative bg-linear-to-b from-white via-[#f5f5f7] to-white py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#34c759]/3 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}>
            <Badge className="mb-6! bg-linear-to-r! from-primary/10! to-[#34c759]/10! text-primary! border-primary/20! px-8! py-2.5! text-sm! rounded-lg">
              <Star className="h-4 w-4 mr-2 inline" />
              Exclusivo MesaLista
            </Badge>
            <h2 className="text-5xl md:text-7xl font-semibold text-foreground mb-8 tracking-tight">
              Listas prediseñadas.
              <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-[#34c759]">Lista en 5 minutos.</span>
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto font-light leading-relaxed">
              Colecciones cuidadosamente curadas por expertos. Elige tu estilo y añade productos seleccionados directamente a tu mesa.
              Ahorra tiempo, mantén la elegancia.
            </p>
          </motion.div>

          {/* Benefits Grid */}
          <motion.div
            className="grid md:grid-cols-4 gap-6 mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}>
            {[
              { icon: Star, label: 'Curadas por expertos', value: '6 colecciones' },
              { icon: Gift, label: 'Productos premium', value: '200+ items' },
              { icon: Sparkles, label: 'Ahorra tiempo', value: '5 minutos' },
              { icon: CheckCircle, label: 'Lista completa', value: '100% funcional' },
            ].map((benefit, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 shadow-sm border border-border/30 text-center hover:shadow-lg transition-all duration-300">
                <benefit.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                <p className="text-2xl font-semibold text-foreground mb-1">{benefit.value}</p>
                <p className="text-sm text-muted-foreground font-light">{benefit.label}</p>
              </div>
            ))}
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              {
                title: 'Luna de Miel',
                description: 'Viajes inolvidables a Italia, Hawái, Bali e Islandia',
                image:
                  'https://images.unsplash.com/photo-1675267374972-45358f240163?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpdGFsaWFuJTIwY29hc3QlMjBhbWFsZml8ZW58MXx8fHwxNzYwOTY4NzQzfDA&ixlib=rb-4.1.0&q=80&w=1080',
                items: '28',
                badge: 'Popular',
              },
              {
                title: 'Redecoración',
                description: 'Actualiza tu espacio actual con estilo moderno',
                image:
                  'https://images.unsplash.com/photo-1600210492493-0946911123ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob21lJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzYwODk5MjYyfDA&ixlib=rb-4.1.0&q=80&w=1080',
                items: '35',
                badge: 'Tendencia',
              },
              {
                title: 'Hogar Nuevo',
                description: 'Equipa el nuevo hogar de tu familia con todo lo esencial',
                image:
                  'https://images.unsplash.com/photo-1581573950452-5a438c5f390f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZXclMjBob21lJTIwbW92aW5nfGVufDF8fHx8MTc2MDk2ODc0NHww&ixlib=rb-4.1.0&q=80&w=1080',
                items: '42',
                badge: 'Completa',
              },
            ].map((registry, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="group cursor-pointer"
                onClick={() => navigate('/listas')}>
                <div className="relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 border border-transparent hover:border-primary/20">
                  {/* Badge */}
                  <div className="absolute top-6 right-6 z-10">
                    <Badge className="bg-white/95! backdrop-blur-sm! text-primary! border-0! shadow-lg! px-4! py-1.5! rounded-lg">
                      {registry.badge}
                    </Badge>
                  </div>

                  {/* Image with gradient overlay */}
                  <div className="relative h-80 overflow-hidden">
                    <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <img
                      src={registry.image}
                      alt={registry.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    {/* Item count badge on image */}
                    <div className="absolute bottom-6 left-6 z-10 bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg">
                      <div className="flex items-center gap-2">
                        <Gift className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">{registry.items} productos</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-8">
                    <h3 className="text-2xl font-semibold text-foreground mb-3 tracking-tight group-hover:text-primary transition-colors">
                      {registry.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed font-light mb-6">{registry.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-primary font-medium group-hover:gap-2 transition-all">
                        <span>Ver colección</span>
                        <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-2 transition-transform duration-300" />
                      </div>
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors duration-300">
                        <Star className="h-5 w-5 text-primary group-hover:text-white transition-colors duration-300" />
                      </div>
                    </div>
                  </div>

                  {/* Hover shine effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* More collections teaser */}
          <motion.div
            className="grid md:grid-cols-3 gap-6 mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            viewport={{ once: true }}>
            {[
              { title: 'Cocina Gourmet', items: '32', icon: Sparkles },
              { title: 'Experiencias Únicas', items: '18', icon: Heart },
              { title: 'Tech & Smart Home', items: '25', icon: Star },
            ].map((collection, idx) => (
              <button
                key={idx}
                onClick={() => navigate('/listas')}
                className="bg-white rounded-2xl p-6 shadow-sm border border-border/30 hover:shadow-xl hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 text-left group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-linear-to-br from-primary/10 to-[#34c759]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <collection.icon className="h-6 w-6 text-primary" />
                  </div>
                  <Badge className="bg-[#f5f5f7]! text-foreground! border-0! rounded-lg! text-xs! px-2! py-1!">
                    {collection.items} items
                  </Badge>
                </div>
                <h4 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {collection.title}
                </h4>
                <div className="flex items-center text-primary text-sm font-medium">
                  <span>Ver colección</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}
          </motion.div>

          {/* Enhanced CTA Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            viewport={{ once: true }}>
            <div className="relative bg-linear-to-br from-primary via-[#d4a574] to-primary rounded-3xl p-12 shadow-2xl overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>

              <div className="relative z-10 text-center max-w-3xl mx-auto">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-2 mb-6">
                  <Star className="h-4 w-4 text-white" />
                  <span className="text-white text-sm font-medium">6 colecciones disponibles</span>
                </div>

                <h3 className="text-4xl md:text-5xl font-semibold text-white mb-6 tracking-tight">¿Listo para empezar?</h3>
                <p className="text-xl text-white/90 mb-8 font-light leading-relaxed">
                  Explora todas nuestras colecciones prediseñadas y crea tu mesa de regalos perfecta en minutos.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button
                    size="large"
                    onClick={() => navigate('/listas')}
                    className="px-10 py-4 text-lg bg-white! hover:bg-gray-100! text-primary! rounded-full! border-0! shadow-lg! hover:shadow-xl! transition-all! duration-300! hover:scale-105!">
                    Ver Todas las Colecciones
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  {!isAuthenticated && (
                    <Button
                      size="large"
                      onClick={() => navigate('/registro')}
                      className="px-10 py-4 text-lg bg-transparent! hover:bg-white/10! text-white! border-2! border-white/50! hover:border-white! rounded-full! transition-all! duration-300!">
                      Crear cuenta gratis
                    </Button>
                  )}
                </div>

                <div className="mt-8 flex items-center justify-center gap-8 text-white/80 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Sin costo inicial</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Setup en 5 minutos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Soporte incluido</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
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
            <Button
              size="large"
              type="primary"
              className="px-12 py-4 text-lg bg-primary hover:bg-[#d4a574] text-white rounded-full border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => navigate('/registro')}>
              Empezar
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
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
              className="px-12 py-4 text-lg bg-primary hover:bg-[#d4a574] text-white rounded-full border-0 shadow-lg hover:shadow-xl transition-all duration-300"
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

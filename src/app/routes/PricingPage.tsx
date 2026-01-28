import { Button, Card } from 'antd';
import { Heart, Check, Zap, Shield, Users, Headphones } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Badge } from 'src/components/core/Badge';
import { faqs, plans } from 'src/config/constants';
import { useCurrentUser } from 'hooks/useUser';
import { useTrackEvent } from 'hooks/useAnalyticsTracking';
import { useEffect } from 'react';
import { PageSEO } from 'src/components/seo';
import { faqSchema } from 'src/utils/structuredData';

export function PricingPage() {
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUser();
  const trackEvent = useTrackEvent();

  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Track pricing page view
  useEffect(() => {
    trackEvent('VIEW_PRICING');
  }, []);

  const faqStructuredData = faqSchema(faqs.map((faq) => ({ question: faq.question, answer: faq.answer })));

  return (
    <div className="flex flex-col min-h-screen">
      <PageSEO
        title="Precios - Mesa de Regalos Digital"
        description="Planes flexibles para tu mesa de regalos. Sin costos ocultos, sin comisiones por transacción. Elige el plan perfecto para tu evento."
        keywords="precios mesa de regalos, planes boda, costo mesa de regalos, precio lista de bodas, México"
        customStructuredData={faqStructuredData}
        breadcrumbs={[
          { name: 'Inicio', url: 'https://www.mesalista.com.mx' },
          { name: 'Precios', url: 'https://www.mesalista.com.mx/precios' },
        ]}
      />
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#faf8f6] via-white to-[#faf0f0] py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <motion.div
          className="absolute top-10 left-10 w-32 h-32 bg-[#d4704a]/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-40 h-40 bg-[#d4704a]/10 rounded-full blur-2xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
        />

        <div className="relative max-w-7xl mx-auto text-center">
          <motion.div
            className="flex justify-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}>
            <Badge variant="secondary" className="px-6 py-3 bg-white shadow-md backdrop-blur-sm border border-[#d4704a]/20">
              💎 Planes diseñados para tu boda perfecta
            </Badge>
          </motion.div>

          <motion.h1
            className="text-5xl md:text-6xl mb-6 text-foreground"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}>
            Planes y Precios
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-muted-foreground leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}>
            Elige el plan que mejor se adapte a tus necesidades y comienza a crear tu mesa de regalos
          </motion.p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative">
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <Badge className="bg-[#d4704a] text-white shadow-lg px-4 py-1 border-0">Más Popular ⭐</Badge>
                  </div>
                )}

                <Card
                  className={`!border-2 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 !bg-gradient-to-br !${plan.bgGradient} h-full ${plan.popular ? '!border-[#d4704a]/30' : '!border-border/20'}`}>
                  <div className="text-center pb-8">
                    <div className={`mx-auto w-16 h-16 ${plan.iconBg} rounded-full flex items-center justify-center mb-6`}>
                      <plan.icon className={`h-8 w-8 ${plan.color}`} />
                    </div>

                    <div className="text-2xl mb-2 text-foreground">{plan.name}</div>
                    <div className="text-muted-foreground mb-6">{plan.description}</div>

                    <div className="mb-6">
                      <div className={`text-4xl mb-1 ${plan.color}`}>{plan.price}</div>
                      <div className="text-muted-foreground text-sm">{plan.period}</div>
                    </div>

                    <Button
                      size="large"
                      className={`w-full transition-all duration-300 border-0 ${
                        plan.popular
                          ? '!bg-[#d4704a] hover:!bg-[#c06140] !text-white shadow-lg hover:!shadow-xl'
                          : '!bg-green-600 hover:!bg-green-700 !text-white shadow-md hover:!shadow-lg'
                      }`}
                      onClick={() => navigate('/registro')}>
                      {plan.cta}
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-start space-x-3">
                          <Check className={`h-5 w-5 flex-shrink-0 mt-0.5 ${plan.popular ? 'text-[#d4704a]' : 'text-green-600'}`} />
                          <span className="text-sm text-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#faf8f6]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}>
            <h2 className="text-4xl mb-6 text-foreground">Todos los planes incluyen</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Funciones esenciales para hacer de tu mesa de regalos un éxito
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Shield,
                title: 'Pagos Seguros',
                description: 'Encriptación SSL y cumplimiento PCI',
              },
              {
                icon: Zap,
                title: 'Configuración Rápida',
                description: 'Lista en menos de 5 minutos',
              },
              {
                icon: Users,
                title: 'Invitados Ilimitados',
                description: 'Sin límite en el número de invitados',
              },
              {
                icon: Headphones,
                title: 'Soporte Dedicado',
                description: 'Ayuda cuando la necesites',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}>
                <div className="w-16 h-16 bg-[#d4704a]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-8 w-8 text-[#d4704a]" />
                </div>
                <h3 className="mb-2 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}>
            <h2 className="text-4xl mb-6 text-foreground">Preguntas Frecuentes</h2>
            <p className="text-xl text-muted-foreground">Resolvemos tus dudas más comunes sobre nuestros planes</p>
          </motion.div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}>
                <Card className="border border-border/20 shadow-md hover:shadow-lg transition-all duration-300 bg-white">
                  <div className="p-6">
                    <h3 className="text-lg mb-3 text-foreground">{faq.question}</h3>
                    <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <motion.section
        className="bg-gradient-to-br from-[#d4704a] via-[#d4704a]/95 to-[#c06140] py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
        viewport={{ once: true }}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.h2
            className="text-4xl mb-6 text-white"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}>
            ¿Listo para crear tu mesa de regalos perfecta?
          </motion.h2>
          <motion.p
            className="text-xl mb-8 text-white/90 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}>
            Elige el plan que mejor se adapte a ti y comienza tu experiencia MesaLista hoy mismo
          </motion.p>
          {!currentUser && (
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}>
              <Button
                size="large"
                className="px-8 py-4 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-0 bg-white hover:!bg-white/95 !text-[#d4704a]"
                onClick={() => navigate('/registro')}>
                <Heart className="mr-2 h-5 w-5" />
                Comenzar Ahora
              </Button>
              {/* <Button
                size="large"
                className="px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-300 !border-2 !border-white/50 hover:!border-white !bg-transparent hover:!bg-white/10 !text-white"
                onClick={() => navigate('/')}>
                <Gift className="mr-2 h-5 w-5" />
                Ver Demo
              </Button> */}
            </motion.div>
          )}
        </div>
      </motion.section>
    </div>
  );
}

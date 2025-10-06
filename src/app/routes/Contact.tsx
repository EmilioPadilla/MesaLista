import { useEffect, useState } from 'react';
import { Input, Button, Select, Form, message, Tooltip } from 'antd';
import { Mail, Phone, CheckCircle, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Footer } from '../modules/navigation/Footer';
import { useSendContactForm } from 'src/hooks/useEmail';
import { faqs } from 'src/config/constants';
import { motion } from 'motion/react';

interface ContactFormValues {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export function Contact() {
  const navigate = useNavigate();
  const [form] = Form.useForm<ContactFormValues>();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const { mutate: sendContactForm, isPending: isSubmitting } = useSendContactForm();

  const handleSubmit = async (values: ContactFormValues) => {
    sendContactForm(values, {
      onSuccess: () => {
        setIsSubmitted(true);
        messageApi.success('¡Mensaje enviado exitosamente! Te responderemos pronto.');

        // Reset form after 3 seconds
        setTimeout(() => {
          setIsSubmitted(false);
          form.resetFields();
        }, 3000);
      },
      onError: (error) => {
        messageApi.error(error.message || 'Error al enviar el mensaje. Por favor intenta de nuevo.');
      },
    });
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {contextHolder}
      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl mb-6 text-foreground">Estamos aquí para ayudarte</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-12">
              ¿Tienes alguna pregunta sobre tu lista de regalos o necesitas asistencia? Nuestro equipo está listo para hacer que tu
              experiencia sea perfecta.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Options Grid */}
      <section className="py-8 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 mb-20">
            {/* Email Support */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}>
              <div className="text-center p-8 rounded-3xl bg-white shadow-sm border border-border/30 hover:shadow-md transition-all duration-300">
                <div className="w-16 h-16 bg-[#d4704a]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mail className="h-8 w-8 text-[#d4704a]" />
                </div>
                <h3 className="text-xl mb-4 text-foreground">Soporte por Email</h3>
                <p className="text-muted-foreground mb-6">Escríbenos y te responderemos en menos de 24 horas</p>
                <span
                  onClick={() => (window.location.href = 'mailto:info@mesalista.com')}
                  className="text-[#d4704a] font-medium hover:underline cursor-pointer">
                  info@mesalista.com
                </span>
              </div>
            </motion.div>

            {/* Phone Support */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}>
              <div className="text-center p-8 rounded-3xl bg-white shadow-sm border border-border/30 hover:shadow-md transition-all duration-300">
                <div className="w-16 h-16 bg-[#d4704a]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Phone className="h-8 w-8 text-[#d4704a]" />
                </div>
                <h3 className="text-xl mb-4 text-foreground">Línea de Atención</h3>
                <p className="text-muted-foreground mb-6">Lunes a Viernes de 9:00 AM a 6:00 PM</p>
                <span
                  onClick={() => (window.location.href = 'tel:+524463069982')}
                  className="text-[#d4704a] font-medium hover:underline cursor-pointer">
                  +52 446 306 9982
                </span>
              </div>
            </motion.div>

            {/* Live Chat */}
            {/* <div className="text-center p-8 rounded-3xl bg-white shadow-sm border border-border/30 hover:shadow-md transition-all duration-300">
              <div className="w-16 h-16 bg-[#007aff]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="h-8 w-8 text-[#007aff]" />
              </div>
              <h3 className="text-xl mb-4 text-foreground">Chat en Vivo</h3>
              <p className="text-muted-foreground mb-6">Respuesta inmediata para consultas rápidas</p>
              <Button className="bg-[#007aff] hover:bg-[#0051d0] text-white rounded-full px-6">Iniciar Chat</Button>
            </div> */}
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Contact Form */}
            <div className="col-span-1">
              <motion.div
                className="max-w-4xl mx-auto text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}>
                <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-border/30">
                  <h2 className="text-3xl mb-8 text-foreground">Envíanos un mensaje</h2>

                  {isSubmitted ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-[#34c759]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="h-10 w-10 text-[#34c759]" />
                      </div>
                      <h3 className="text-2xl mb-4 text-foreground">¡Mensaje enviado!</h3>
                      <p className="text-muted-foreground">Gracias por contactarnos. Te responderemos pronto.</p>
                    </div>
                  ) : (
                    <Form form={form} onFinish={handleSubmit} layout="vertical" className="space-y-6">
                      <div className="grid sm:grid-cols-2 gap-6">
                        <Form.Item
                          name="name"
                          label={<span className="text-sm text-foreground">Nombre completo</span>}
                          rules={[{ required: true, message: 'Por favor ingresa tu nombre' }]}>
                          <Input
                            size="large"
                            className="rounded-2xl border border-border/30 focus:bg-white focus:border-[#007aff] transition-all duration-200"
                            placeholder="Tu nombre"
                          />
                        </Form.Item>

                        <Form.Item
                          name="email"
                          label={<span className="text-sm text-foreground">Correo electrónico</span>}
                          rules={[
                            { required: true, message: 'Por favor ingresa tu correo' },
                            { type: 'email', message: 'Por favor ingresa un correo válido' },
                          ]}>
                          <Input
                            size="large"
                            className="rounded-2xl border border-border/30 focus:bg-white focus:border-[#007aff] transition-all duration-200"
                            placeholder="tu@email.com"
                          />
                        </Form.Item>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-6">
                        <Form.Item name="phone" label={<span className="text-sm text-foreground">Teléfono (opcional)</span>}>
                          <Input
                            size="large"
                            className="rounded-2xl border border-border/30 focus:bg-white focus:border-[#007aff] transition-all duration-200"
                            placeholder="+52 55 1234 5678"
                          />
                        </Form.Item>

                        <Form.Item
                          name="subject"
                          label={<span className="text-sm text-foreground">Asunto</span>}
                          rules={[{ required: true, message: 'Por favor selecciona un tema' }]}>
                          <Select
                            placeholder="Selecciona un tema"
                            className="w-full !h-12"
                            rootClassName="rounded-2xl"
                            options={[
                              { value: 'crear-lista', label: 'Crear lista de regalos' },
                              { value: 'comprar-regalo', label: 'Comprar un regalo' },
                              { value: 'problema-tecnico', label: 'Problema técnico' },
                              { value: 'facturacion', label: 'Facturación' },
                              { value: 'sugerencia', label: 'Sugerencia' },
                              { value: 'otro', label: 'Otro' },
                            ]}
                          />
                        </Form.Item>
                      </div>

                      <Form.Item
                        name="message"
                        label={<span className="text-sm text-foreground">Mensaje</span>}
                        rules={[{ required: true, message: 'Por favor ingresa tu mensaje' }]}>
                        <Input.TextArea
                          rows={5}
                          className="rounded-2xl border border-border/30 focus:bg-white focus:border-[#007aff] transition-all duration-200 resize-none"
                          placeholder="Cuéntanos cómo podemos ayudarte..."
                        />
                      </Form.Item>

                      <Form.Item className="mb-0">
                        <Button
                          type="primary"
                          htmlType="submit"
                          loading={isSubmitting}
                          className="w-full bg-[#007aff] hover:bg-[#0051d0] text-white rounded-full py-4 text-lg transition-all duration-200"
                          size="large">
                          {isSubmitting ? 'Enviando...' : 'Enviar mensaje'}
                        </Button>
                      </Form.Item>
                    </Form>
                  )}
                </div>
              </motion.div>

              {/* Emergency Support */}
              <div className="bg-gradient-to-br from-[#ff3b30]/5 to-[#ff3b30]/10 rounded-3xl p-8 border border-[#ff3b30]/20 mt-10">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[#ff3b30]/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <HelpCircle className="h-6 w-6 text-[#ff3b30]" />
                  </div>
                  <div>
                    <h3 className="text-xl mb-2 text-foreground">¿Necesitas ayuda urgente?</h3>
                    <p className="text-muted-foreground mb-4">
                      Si tienes un evento próximo y necesitas asistencia inmediata, contáctanos por WhatsApp.
                    </p>
                    <Button
                      onClick={() => window.open('https://wa.me/524463069982', '_blank')}
                      className="!bg-[#25d366] hover:bg-[#1da851] !text-white rounded-full px-6">
                      WhatsApp: +52 446 306 9982
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Support Information */}
            <div className="space-y-12">
              {/* FAQ Section */}
              <motion.div
                className="max-w-4xl mx-auto text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}>
                <div id="faq" className="bg-white rounded-3xl p-8 shadow-sm border border-border/30">
                  <h3 className="text-2xl mb-6 text-foreground">Preguntas frecuentes</h3>
                  <p className="text-xl text-muted-foreground mb-5">Resolvemos tus dudas más comunes sobre nuestros planes</p>
                  <div className="space-y-6">
                    {faqs.map((faq, index) => (
                      <div className="pb-6 border-b border-border/20">
                        <h4 className="font-medium mb-2 text-foreground">{faq.question}</h4>
                        <p className="text-muted-foreground">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Office Information */}
              {/* <div className="bg-white rounded-3xl p-8 shadow-sm border border-border/30">
                <div className="flex items-start space-x-4 mb-6">
                  <div className="w-12 h-12 bg-[#007aff]/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-6 w-6 text-[#007aff]" />
                  </div>
                  <div>
                    <h3 className="text-xl mb-2 text-foreground">Oficinas MesaLista</h3>
                    <p className="text-muted-foreground mb-4">
                      Av. Insurgentes Sur 1234
                      <br />
                      Col. Del Valle, CDMX 03100
                      <br />
                      México
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-[#007aff]" />
                    <span className="text-muted-foreground">Lun - Vie: 9:00 - 18:00</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-[#007aff]" />
                    <span className="text-muted-foreground">Sáb: 10:00 - 14:00</span>
                  </div>
                </div>
              </div> */}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-[#f5f5f7] to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl mb-6 text-foreground">¿Listo para crear tu lista perfecta?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Únete a miles de parejas que ya han hecho realidad la boda de sus sueños con MesaLista.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Tooltip trigger={['click']} title="¡Funcionalidad disponible pronto!">
              <Button
                type="primary"
                // onClick={() => navigate('/registro')}
                className="rounded-full px-8 py-4 text-lg">
                Crear mi MesaLista de regalos
              </Button>
            </Tooltip>
            <Button
              onClick={() => navigate('buscar')}
              className="bg-white hover:bg-[#f5f5f7] text-foreground border border-border/30 rounded-full px-8 py-4 text-lg">
              Explorar listas
            </Button>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

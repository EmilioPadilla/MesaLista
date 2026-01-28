import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Calendar, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

interface TemplatePreview {
  id: string;
  name: string;
  description: string;
  gradient: string;
  accentColor: string;
  icon: string;
  style: 'modern' | 'elegant' | 'romantic' | 'bold' | 'playful' | 'classic';
  fontFamily?: string;
  fontWeight?: string;
  badge1: { text: string; gradient: string };
  badge2: { text: string; gradient: string };
}

const templates: TemplatePreview[] = [
  {
    id: 'modern-minimalist',
    name: 'Moderno Minimalista',
    description: 'Diseño limpio y elegante',
    gradient: 'from-slate-50 to-white',
    accentColor: '#1a1a1a',
    icon: '✨',
    style: 'modern',
    fontFamily: 'system-ui, sans-serif',
    fontWeight: 'font-light',
    badge1: { text: 'Minimalista', gradient: 'from-slate-500 to-gray-500' },
    badge2: { text: 'Moderno', gradient: 'from-gray-400 to-slate-400' },
  },
  {
    id: 'elegant-wedding',
    name: 'Boda Elegante',
    description: 'Sofisticación clásica',
    gradient: 'from-rose-50 to-white',
    accentColor: '#d4704a',
    icon: '💍',
    style: 'elegant',
    fontFamily: "'Cormorant Garamond', serif",
    fontWeight: 'font-normal',
    badge1: { text: 'Elegante', gradient: 'from-rose-400 to-pink-400' },
    badge2: { text: 'Clásico', gradient: 'from-amber-400 to-rose-300' },
  },
  {
    id: 'floral-romance',
    name: 'Romance Floral',
    description: 'Delicado y romántico',
    gradient: 'from-pink-50 to-white',
    accentColor: '#ec4899',
    icon: '🌸',
    style: 'romantic',
    fontFamily: "'Dancing Script', cursive",
    fontWeight: 'font-light',
    badge1: { text: 'Romántico', gradient: 'from-pink-400 to-rose-400' },
    badge2: { text: 'Floral', gradient: 'from-rose-300 to-pink-300' },
  },
  {
    id: 'bold-celebration',
    name: 'Celebración Vibrante',
    description: 'Energía y color',
    gradient: 'from-orange-50 to-white',
    accentColor: '#ea580c',
    icon: '🎉',
    style: 'bold',
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: 'font-black',
    badge1: { text: 'Vibrante', gradient: 'from-orange-500 to-red-500' },
    badge2: { text: 'Energético', gradient: 'from-yellow-400 to-orange-400' },
  },
  {
    id: 'baby-shower',
    name: 'Baby Shower',
    description: 'Dulce y tierno',
    gradient: 'from-blue-50 to-white',
    accentColor: '#3b82f6',
    icon: '👶',
    style: 'playful',
    fontFamily: "'Quicksand', sans-serif",
    fontWeight: 'font-bold',
    badge1: { text: 'Dulce', gradient: 'from-blue-400 to-cyan-400' },
    badge2: { text: 'Tierno', gradient: 'from-pink-300 to-blue-300' },
  },
  {
    id: 'anniversary',
    name: 'Aniversario',
    description: 'Elegancia dorada',
    gradient: 'from-amber-50 to-white',
    accentColor: '#d97706',
    icon: '💝',
    style: 'classic',
    fontFamily: "'Playfair Display', serif",
    fontWeight: 'font-normal',
    badge1: { text: 'Dorado', gradient: 'from-amber-500 to-yellow-600' },
    badge2: { text: 'Aniversario', gradient: 'from-yellow-400 to-amber-400' },
  },
];

export function InvitationTemplateCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % templates.length);
    }, 8000);

    return () => clearInterval(timer);
  }, []);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex((prev) => {
      const next = prev + newDirection;
      if (next < 0) return templates.length - 1;
      if (next >= templates.length) return 0;
      return next;
    });
  };

  const currentTemplate = templates[currentIndex];

  return (
    <div className="relative w-full h-full">
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: 'spring', stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={(e, { offset, velocity }) => {
            const swipe = swipePower(offset.x, velocity.x);

            if (swipe < -swipeConfidenceThreshold) {
              paginate(1);
            } else if (swipe > swipeConfidenceThreshold) {
              paginate(-1);
            }
          }}
          className="absolute w-full">
          <div className="relative">
            <div
              className={`relative bg-linear-to-br ${currentTemplate.gradient} rounded-3xl shadow-2xl overflow-hidden border border-border/30 p-12`}>
              <div className="text-center space-y-6">
                <div className="text-6xl mb-4">{currentTemplate.icon}</div>
                <Heart className="h-16 w-16 mx-auto" style={{ color: currentTemplate.accentColor }} />
                <h3
                  className={`text-4xl ${currentTemplate.fontWeight} text-foreground tracking-tight`}
                  style={{ fontFamily: currentTemplate.fontFamily }}>
                  Ana & Carlos
                </h3>
                <p
                  className={`text-sm uppercase tracking-widest ${currentTemplate.fontWeight}`}
                  style={{ color: currentTemplate.accentColor, fontFamily: currentTemplate.fontFamily }}>
                  Te invitamos a celebrar nuestra boda
                </p>
                <div className="py-6 space-y-3 text-muted-foreground">
                  <div className="flex items-center justify-center gap-3">
                    <Calendar className="h-5 w-5" style={{ color: currentTemplate.accentColor }} />
                    <p className={currentTemplate.fontWeight} style={{ fontFamily: currentTemplate.fontFamily }}>
                      15 de Junio, 2024
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <MapPin className="h-5 w-5" style={{ color: currentTemplate.accentColor }} />
                    <p className={currentTemplate.fontWeight} style={{ fontFamily: currentTemplate.fontFamily }}>
                      Hacienda San Miguel
                    </p>
                  </div>
                </div>
                <div className="pt-4">
                  <div
                    className="inline-block px-6 py-2 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: currentTemplate.accentColor,
                      color: 'white',
                      fontFamily: currentTemplate.fontFamily,
                    }}>
                    {currentTemplate.name}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2" style={{ fontFamily: currentTemplate.fontFamily }}>
                    {currentTemplate.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Floating template badges */}
            <motion.div
              className="absolute -top-4 -left-4 bg-white rounded-xl shadow-lg p-3 border border-border/30"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg bg-linear-to-br ${currentTemplate.badge1.gradient}`}></div>
                <div className="text-xs">
                  <p className="font-medium text-foreground">{currentTemplate.badge1.text}</p>
                  <p className="text-muted-foreground">{currentTemplate.name}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="absolute -bottom-4 -right-4 bg-white rounded-xl shadow-lg p-3 border border-border/30"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg bg-linear-to-br ${currentTemplate.badge2.gradient}`}></div>
                <div className="text-xs">
                  <p className="font-medium text-foreground">{currentTemplate.badge2.text}</p>
                  <p className="text-muted-foreground">Personalizable</p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <button
        onClick={() => paginate(-1)}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110"
        aria-label="Previous template">
        <ChevronLeft className="h-6 w-6 text-foreground" />
      </button>

      <button
        onClick={() => paginate(1)}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110"
        aria-label="Next template">
        <ChevronRight className="h-6 w-6 text-foreground" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {templates.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setDirection(index > currentIndex ? 1 : -1);
              setCurrentIndex(index);
            }}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentIndex ? 'w-8 bg-rose-500' : 'w-2 bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Go to template ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

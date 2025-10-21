import { useNavigate } from 'react-router-dom';

export const Footer = () => {
  const navigate = useNavigate();
  return (
    <footer className="bg-[#f5f5f7] border-t border-border/30 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <img src="/svg/MesaLista_isologo.svg" alt="Logo" className="h-10 w-30" />
            </div>
            <p className="text-muted-foreground font-light leading-relaxed">La plataforma de mesas de regalos más elegante de México.</p>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Producto</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  onClick={() => navigate('/buscar')}
                  className="text-muted-foreground hover:text-foreground transition-colors font-light cursor-pointer">
                  Explorar Mesas
                </a>
              </li>
              <li>
                <a
                  onClick={() => navigate('/precios')}
                  className="text-muted-foreground hover:text-foreground transition-colors font-light cursor-pointer">
                  Planes
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Soporte</h4>
            <ul className="space-y-2 text-sm">
              {/* <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors font-light">
                  Centro de Ayuda
                </a>
              </li> */}
              <li>
                <a
                  onClick={() => navigate('contacto')}
                  className="text-muted-foreground hover:text-foreground transition-colors font-light cursor-pointer">
                  Contacto
                </a>
              </li>
              <li>
                <a
                  onClick={() => {
                    navigate('/contacto');
                    setTimeout(() => {
                      const element = document.getElementById('faq');
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }, 100);
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors font-light cursor-pointer">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Empresa</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors font-light">
                  Acerca de
                </a>
              </li>
              {/* <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors font-light">
                  Carreras
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors font-light">
                  Prensa
                </a>
              </li> */}
            </ul>
          </div>
        </div>

        <div className="border-t border-border/30 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground font-light">
            <a href="#" className="hover:text-foreground transition-colors">
              Privacidad
            </a>
            <a
              href="https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/documents/Te%CC%81rminos%20y%20Condiciones%20MesaLista%20Mx.pdf"
              target="_blank"
              className="hover:text-foreground transition-colors">
              Términos
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Cookies
            </a>
          </div>
          <p className="text-sm text-muted-foreground font-light">© 2025 MesaLista. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

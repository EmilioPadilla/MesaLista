import { Layout } from 'antd';
import { Content, Footer } from 'antd/es/layout/layout';
import { useEffect, useState } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { TopNav } from 'src/app/modules/navigation/topnav/TopNav';

// Utility for guest ID management
function getOrCreateGuestId() {
  let guestId = localStorage.getItem('guestId');
  if (!guestId) {
    guestId = uuidv4();
    localStorage.setItem('guestId', guestId);
  }
  return guestId;
}

export type OutletContextType = {
  guestId: string | null;
  coupleSlug: string | undefined;
};

export interface GuestContext {
  guestId: string | null;
  coupleSlug: string | undefined;
}

export default function PublicRegistry() {
  const { coupleSlug } = useParams();
  const [guestId, setGuestId] = useState<string | null>(null);

  useEffect(() => {
    setGuestId(getOrCreateGuestId());
  }, []);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout>
        <TopNav coupleSlug={coupleSlug} />
        <Content>
          {/* Child routes will be rendered here */}
          <Outlet context={{ guestId, coupleSlug }} />
        </Content>
        <Footer className="text-center">MesaLista {new Date().getFullYear()} - Tu plataforma para listas de regalos de boda</Footer>
      </Layout>
    </Layout>
  );
}

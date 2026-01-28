import { Layout } from 'antd';
import { Content, Footer } from 'antd/es/layout/layout';
import { useEffect, useState, useCallback } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { TopNav } from 'src/app/modules/navigation/topnav/TopNav';
import { TopNavWrapper } from 'src/app/modules/navigation/topnav/TopNavWrapper';

// Utility for guest ID management
function getOrCreateGuestId() {
  let guestId = localStorage.getItem('guestId');
  if (!guestId) {
    guestId = uuidv4();
    localStorage.setItem('guestId', guestId);
  }
  return guestId;
}

// Utility to regenerate guest ID
function regenerateGuestId() {
  const newGuestId = uuidv4();
  localStorage.setItem('guestId', newGuestId);
  return newGuestId;
}

export type OutletContextType = {
  guestId: string | null;
  slug: string | undefined;
  regenerateGuestId: () => void;
};

export default function PublicRegistry() {
  const { slug } = useParams();
  const [guestId, setGuestId] = useState<string | null>(null);

  useEffect(() => {
    setGuestId(getOrCreateGuestId());
  }, []);

  const handleRegenerateGuestId = useCallback(() => {
    const newGuestId = regenerateGuestId();
    setGuestId(newGuestId);
  }, []);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout>
        <TopNav slug={slug} />
        <TopNavWrapper>
          <Content>
            {/* Child routes will be rendered here */}
            <Outlet context={{ guestId, slug, regenerateGuestId: handleRegenerateGuestId }} />
          </Content>
        </TopNavWrapper>
        {/* <Footer className="text-center">MesaLista {new Date().getFullYear()} - Tu plataforma para listas de regalos de boda</Footer> */}
      </Layout>
    </Layout>
  );
}

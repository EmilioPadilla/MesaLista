import { Layout } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useEffect, useState, useCallback } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { EyeOff } from 'lucide-react';
import { useGiftListBySlug } from 'src/hooks/useGiftList';
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

  // The server 404s an unpublished list for everyone but its owner, so getting a
  // draft back here means the couple is previewing their own work in progress.
  const { data: giftList } = useGiftListBySlug(slug);
  const isOwnerPreviewingDraft = !!giftList && !giftList.publishedAt;

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
        {isOwnerPreviewingDraft && (
          <div className="bg-[#d4704a] px-4 py-2.5 text-center text-sm font-medium text-white">
            <EyeOff className="mr-2 inline h-4 w-4" />
            Vista previa — tu mesa no está publicada y tus invitados todavía no pueden verla.
          </div>
        )}
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

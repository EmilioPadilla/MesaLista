import { useParams, useNavigate } from 'react-router-dom';
import { Spin, Result, Button } from 'antd';
import { useInvitationByGiftListPublic } from 'src/hooks/useInvitation';
import { useEffect, useMemo } from 'react';
import { InvitationPreview } from '../InvitationPreview/InvitationPreview';
import { InvitationSection } from '../InvitationEditor/InvitationSectionManager';
import { getSectionsForTemplate } from '../sections/templateSectionsHelper';

export function PublicInvitationView() {
  const { slug, giftListId } = useParams<{ slug: string; giftListId: string }>();
  const navigate = useNavigate();

  const { data: invitation, isLoading, error } = useInvitationByGiftListPublic(giftListId ? parseInt(giftListId) : undefined);

  // Redirect to gift list if invitation not found or not published
  useEffect(() => {
    if (!isLoading && (!invitation || invitation.status !== 'PUBLISHED')) {
      navigate(`/${slug}/regalos?listId=${giftListId}`, { replace: true });
    }
  }, [invitation, isLoading, navigate, slug, giftListId]);

  // Parse sections and palette from formData
  const { sections, palette, cleanFormData } = useMemo(() => {
    if (!invitation?.formData) {
      return {
        sections: getSectionsForTemplate('elegant-wedding'),
        palette: {
          id: 'romantic-blush',
          name: 'Romantic Blush',
          primary: '#d4704a',
          secondary: '#f5e6e0',
          accent: '#a85a3f',
          background: '#faf8f6',
          text: '#2c1810',
          textLight: '#8b7355',
        },
        cleanFormData: {},
      };
    }

    const formData = invitation.formData;
    let parsedSections: InvitationSection[] = getSectionsForTemplate(invitation.templateId);
    let parsedPalette = {
      id: 'romantic-blush',
      name: 'Romantic Blush',
      primary: '#d4704a',
      secondary: '#f5e6e0',
      accent: '#a85a3f',
      background: '#faf8f6',
      text: '#2c1810',
      textLight: '#8b7355',
    };

    // Parse sections if saved
    if (formData.sections) {
      try {
        parsedSections = typeof formData.sections === 'string' ? JSON.parse(formData.sections) : formData.sections;
      } catch (e) {
        console.error('Error parsing sections:', e);
      }
    }

    // Parse palette if saved
    if (formData.palette) {
      try {
        parsedPalette = typeof formData.palette === 'string' ? JSON.parse(formData.palette) : formData.palette;
      } catch (e) {
        console.error('Error parsing palette:', e);
      }
    }

    // Remove sections and palette from formData
    const { sections: _, palette: __, ...clean } = formData;

    return {
      sections: parsedSections,
      palette: parsedPalette,
      cleanFormData: clean,
    };
  }, [invitation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <Result
          status="404"
          title="Invitación no encontrada"
          subTitle="Esta invitación no existe o no ha sido publicada."
          extra={
            <Button type="primary" onClick={() => navigate(`/${slug}/regalos?listId=${giftListId}`)}>
              Ver Lista de Regalos
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Invitation Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <InvitationPreview
          templateId={invitation.templateId}
          data={{
            ...cleanFormData,
            userSlug: slug || '',
            giftListId: giftListId || '',
          }}
          sections={sections}
          palette={palette}
        />

        {/* CTA to view gifts */}
        <div className="mt-8 text-center">
          <Button
            type="primary"
            size="large"
            className="bg-[#007aff] hover:bg-[#0051d0] text-white rounded-full font-light px-8"
            onClick={() => navigate(`/${slug}/regalos?listId=${giftListId}`)}>
            Ver Lista de Regalos
          </Button>
        </div>
      </div>
    </div>
  );
}

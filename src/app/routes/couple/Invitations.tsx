import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { InvitationTemplateSelector } from 'src/features/invitations/components/InvitationTemplateSelector';
import { InvitationEditor } from 'features/invitations/components/InvitationEditor/InvitationEditor';
import { Invitation as InvitationType, InvitationTemplate } from 'types/models/invitation';
import { useInvitationByGiftList } from 'src/hooks/useInvitation';
import { Spin } from 'antd';

type InvitationView = 'templates' | 'editor' | 'public';

export function Invitations() {
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(window.location.search);
  const listIdFromQuery = queryParams.get('listId');
  const effectiveGiftListId = listIdFromQuery ? parseInt(listIdFromQuery) : undefined;

  const [currentView, setCurrentView] = useState<InvitationView | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<InvitationTemplate | null>(null);

  // Fetch invitation from backend using effectiveGiftListId
  const { data: invitationData, isLoading } = useInvitationByGiftList(effectiveGiftListId);

  // Determine initial view based on whether invitation exists
  useEffect(() => {
    if (!isLoading && currentView === null) {
      if (invitationData) {
        // Invitation exists, go directly to editor
        setCurrentView('editor');
      } else {
        // No invitation, show template selector
        setCurrentView('templates');
      }
    }
  }, [invitationData, isLoading, currentView]);

  const handleTemplateSelect = (template: InvitationTemplate) => {
    setSelectedTemplate(template);
    setCurrentView('editor');
  };

  const handlePreviewPublic = (path: string) => {
    navigate(path);
  };

  const handleBackToLists = () => {
    navigate(-1);
  };

  // Show loading spinner while fetching invitation data
  if (isLoading || currentView === null) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'templates':
        return <InvitationTemplateSelector onSelectTemplate={handleTemplateSelect} onBack={handleBackToLists} />;
      case 'editor':
        return (
          <InvitationEditor
            giftListId={effectiveGiftListId!}
            template={selectedTemplate}
            invitation={invitationData as unknown as InvitationType}
            onBack={handleBackToLists}
            onPreview={handlePreviewPublic}
          />
        );
      default:
        return <InvitationTemplateSelector onSelectTemplate={handleTemplateSelect} onBack={handleBackToLists} />;
    }
  };

  return <div className="min-h-screen bg-background">{renderView()}</div>;
}

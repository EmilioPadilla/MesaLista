import { useState } from 'react';
import { InvitationTemplateSelector } from 'features/invitations/InvitationTemplateSelector';
import { InvitationEditor } from 'features/invitations/InvitationEditor';
import { PublicInvitation } from 'features/invitations/PublicInvitation';
import { InvitationsDashboard } from 'features/invitations/InvitationsDashboard';

interface User {
  id: string;
  name: string;
  email: string;
  type: 'couple' | 'guest' | 'admin';
  avatar?: string;
}

export interface InvitationTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: 'wedding' | 'birthday' | 'baby-shower' | 'anniversary';
  fields: InvitationField[];
  previewComponent: string;
}

export interface InvitationField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'time' | 'location';
  placeholder: string;
  defaultValue?: string;
}

export interface Invitation {
  id: string;
  templateId: string;
  eventName: string;
  status: 'draft' | 'published';
  data: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  slug: string;
}

type InvitationView = 'dashboard' | 'templates' | 'editor' | 'public';

export function Invitations() {
  const [currentView, setCurrentView] = useState<InvitationView>('dashboard');
  const [selectedInvitation, setSelectedInvitation] = useState<Invitation | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<InvitationTemplate | null>(null);
  const [publicSlug, setPublicSlug] = useState<string>('');

  const handleCreateNew = () => {
    setCurrentView('templates');
  };

  const handleTemplateSelect = (template: InvitationTemplate) => {
    setSelectedTemplate(template);
    setCurrentView('editor');
  };

  const handleEditInvitation = (invitation: Invitation) => {
    setSelectedInvitation(invitation);
    setCurrentView('editor');
  };

  const handlePreviewPublic = (slug: string) => {
    setPublicSlug(slug);
    setCurrentView('public');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedInvitation(null);
    setSelectedTemplate(null);
    setPublicSlug('');
  };

  const mockInvitations: Invitation[] = [];

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <InvitationsDashboard
            invitations={mockInvitations}
            onCreateNew={handleCreateNew}
            onEditInvitation={handleEditInvitation}
            onPreviewPublic={handlePreviewPublic}
          />
        );
      case 'templates':
        return <InvitationTemplateSelector onSelectTemplate={handleTemplateSelect} onBack={handleBackToDashboard} />;
      case 'editor':
        return (
          <InvitationEditor
            template={selectedTemplate}
            invitation={selectedInvitation}
            onBack={handleBackToDashboard}
            onPreview={handlePreviewPublic}
          />
        );
      case 'public':
        return <PublicInvitation slug={publicSlug} onBack={handleBackToDashboard} />;
      default:
        return (
          <InvitationsDashboard
            invitations={mockInvitations}
            onCreateNew={handleCreateNew}
            onEditInvitation={handleEditInvitation}
            onPreviewPublic={handlePreviewPublic}
          />
        );
    }
  };

  return <div className="min-h-screen bg-background">{renderView()}</div>;
}

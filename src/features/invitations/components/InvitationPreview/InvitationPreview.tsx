import { renderTemplateComponent } from '../invitationTemplates';
import { InvitationSection, ColorPalette } from '../InvitationEditor/InvitationSectionManager';

interface InvitationPreviewProps {
  templateId: string;
  data: Record<string, string>;
  sections?: InvitationSection[];
  palette?: ColorPalette;
}

export function InvitationPreview({ templateId, data, sections, palette }: InvitationPreviewProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Parse JSON strings in data to arrays for template sections
  const parsedData: Record<string, any> = { ...data };

  // Parse scheduleItems if it's a JSON string
  if (typeof parsedData.scheduleItems === 'string' && parsedData.scheduleItems) {
    try {
      parsedData.scheduleItems = JSON.parse(parsedData.scheduleItems);
    } catch (e) {
      parsedData.scheduleItems = [];
    }
  }

  // Parse hotels if it's a JSON string
  if (typeof parsedData.hotels === 'string' && parsedData.hotels) {
    try {
      parsedData.hotels = JSON.parse(parsedData.hotels);
    } catch (e) {
      parsedData.hotels = [];
    }
  }

  // Parse galleryImages if it's a JSON string (array of URL strings)
  if (typeof parsedData.galleryImages === 'string' && parsedData.galleryImages) {
    try {
      const urls = JSON.parse(parsedData.galleryImages);
      // Convert array of strings to array of objects with url property
      parsedData.galleryItems = urls.map((url: string) => ({ url }));
    } catch (e) {
      parsedData.galleryItems = [];
    }
  }

  // Parse galleryItems if it's a JSON string (array of objects)
  if (typeof parsedData.galleryItems === 'string' && parsedData.galleryItems) {
    try {
      parsedData.galleryItems = JSON.parse(parsedData.galleryItems);
    } catch (e) {
      parsedData.galleryItems = [];
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-2xl mx-auto">
      {renderTemplateComponent(templateId, parsedData, formatDate, sections, palette)}
    </div>
  );
}

import {
  HeaderSection,
  PresentationSection,
  EventSection,
  DressCodeSection,
  ScheduleSection,
  AccommodationSection,
  GiftsSection,
  GallerySection,
  RSVPSection,
  FooterSection,
} from '../sections/InvitationMinimalistSections';
import { InvitationSection, ColorPalette } from '../invitationTemplates';

interface TemplateProps {
  data: Record<string, string>;
  formatDate: (date: string) => string;
  sections?: InvitationSection[];
  palette?: ColorPalette;
}

const defaultPalette: ColorPalette = {
  id: 'modern-mono',
  name: 'Modern Mono',
  primary: '#1a1a1a',
  secondary: '#f5f5f5',
  accent: '#666666',
  background: '#ffffff',
  text: '#1a1a1a',
  textLight: '#666666',
};

export function ModernMinimalistTemplate({ data, formatDate, sections, palette = defaultPalette }: TemplateProps) {
  const enabledSections = sections ? sections.filter((s) => s.enabled).sort((a, b) => a.order - b.order) : [];

  const renderSection = (section: InvitationSection) => {
    const sectionProps = { data, palette };

    switch (section.id) {
      case 'header':
        return <HeaderSection key={section.id} {...sectionProps} />;
      case 'presentation':
        return <PresentationSection key={section.id} {...sectionProps} />;
      case 'event':
        return <EventSection key={section.id} {...sectionProps} />;
      case 'dresscode':
        return <DressCodeSection key={section.id} {...sectionProps} />;
      case 'schedule':
        return <ScheduleSection key={section.id} {...sectionProps} />;
      case 'accommodation':
        return <AccommodationSection key={section.id} {...sectionProps} />;
      case 'gifts':
        return <GiftsSection key={section.id} {...sectionProps} />;
      case 'gallery':
        return <GallerySection key={section.id} {...sectionProps} />;
      case 'rsvp':
        return <RSVPSection key={section.id} {...sectionProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      {enabledSections.length > 0 ? (
        <>
          {enabledSections.map((section) => renderSection(section))}
          <FooterSection data={data} palette={palette} />
        </>
      ) : (
        <div className="bg-white p-12 sm:p-16 min-h-[600px] flex flex-col items-center justify-center">
          <div className="space-y-12 max-w-xl w-full">
            <div className="text-center space-y-3">
              <h1 className="text-6xl sm:text-7xl font-extralight text-foreground tracking-tight">
                {data.title || data.names || 'Evento'}
              </h1>
              {data.names && data.title && <p className="text-2xl font-light text-muted-foreground">{data.names}</p>}
            </div>
            {data.date && <p className="text-lg font-light text-foreground capitalize text-center">{formatDate(data.date)}</p>}
            {data.message && <p className="text-base text-muted-foreground font-light leading-relaxed text-center">{data.message}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

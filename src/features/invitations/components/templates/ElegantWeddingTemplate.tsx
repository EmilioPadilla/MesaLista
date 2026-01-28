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
} from '../sections/InvitationElegantWeddingSections';
import { InvitationSection, ColorPalette } from '../invitationTemplates';

interface TemplateProps {
  data: Record<string, string>;
  formatDate: (date: string) => string;
  sections?: InvitationSection[];
  palette?: ColorPalette;
}

const defaultPalette: ColorPalette = {
  id: 'romantic-blush',
  name: 'Romantic Blush',
  primary: '#d4704a',
  secondary: '#f5e6e0',
  accent: '#a85a3f',
  background: '#faf8f6',
  text: '#2c1810',
  textLight: '#8b7355',
};

export function ElegantWeddingTemplate({ data, formatDate, sections, palette = defaultPalette }: TemplateProps) {
  // Get enabled sections sorted by order
  const enabledSections = sections ? sections.filter((s) => s.enabled).sort((a, b) => a.order - b.order) : [];

  // Render section based on ID
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
        // Fallback to simple template if no sections configured
        <div className="relative bg-gradient-to-b from-[#faf0f0] to-white p-12 sm:p-16 min-h-[600px] flex flex-col items-center justify-center text-center">
          <div className="space-y-8 max-w-xl">
            <h1 className="text-5xl sm:text-6xl font-light text-foreground tracking-tight">{data.title || 'Nombres'}</h1>
            {data.date && <p className="text-lg font-light capitalize">{formatDate(data.date)}</p>}
            {data.message && <p className="text-base text-muted-foreground font-light italic leading-relaxed">{data.message}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

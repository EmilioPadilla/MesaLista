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
} from '../sections/InvitationBoldCelebrationSections';
import { InvitationSection, ColorPalette } from '../invitationTemplates';

interface TemplateProps {
  data: Record<string, string>;
  formatDate: (date: string) => string;
  sections?: InvitationSection[];
  palette?: ColorPalette;
}

const defaultPalette: ColorPalette = {
  id: 'bold-celebration',
  name: 'Bold Celebration',
  primary: '#9c27b0',
  secondary: '#f06292',
  accent: '#ff9800',
  background: '#fff3e0',
  text: '#1a1a1a',
  textLight: '#757575',
};

export function BoldCelebrationTemplate({ data, formatDate, sections, palette = defaultPalette }: TemplateProps) {
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
        <div className="relative bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 p-12 sm:p-16 min-h-[600px] flex flex-col items-center justify-center text-white">
          <div className="space-y-8 max-w-xl text-center relative z-10">
            <h1 className="text-5xl sm:text-6xl font-bold text-white">{data.title || '¡Estás Invitado!'}</h1>
            {data.date && <p className="text-lg font-light capitalize">{formatDate(data.date)}</p>}
            {data.message && <p className="text-lg text-white/90 font-light leading-relaxed">{data.message}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

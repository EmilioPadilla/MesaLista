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
} from '../sections/InvitationBabyShowerSections';
import { InvitationSection, ColorPalette } from '../invitationTemplates';

interface TemplateProps {
  data: Record<string, string>;
  formatDate: (date: string) => string;
  sections?: InvitationSection[];
  palette?: ColorPalette;
}

const defaultPalette: ColorPalette = {
  id: 'baby-shower',
  name: 'Baby Shower',
  primary: '#42a5f5',
  secondary: '#e3f2fd',
  accent: '#f48fb1',
  background: '#fafafa',
  text: '#1a1a1a',
  textLight: '#757575',
};

export function BabyShowerTemplate({ data, formatDate, sections, palette = defaultPalette }: TemplateProps) {
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
        <div className="relative bg-gradient-to-b from-blue-50 via-white to-blue-50/50 p-12 sm:p-16 min-h-[600px] flex flex-col items-center justify-center">
          <div className="space-y-8 max-w-xl text-center relative z-10">
            <h1 className="text-4xl sm:text-5xl font-light text-foreground">{data.title || 'Baby Shower'}</h1>
            {data.date && <p className="text-lg font-light text-foreground capitalize">{formatDate(data.date)}</p>}
            {data.message && <p className="text-base text-muted-foreground font-light leading-relaxed">{data.message}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

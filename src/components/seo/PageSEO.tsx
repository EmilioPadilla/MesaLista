import { SEOHead } from './SEOHead';
import { organizationSchema, serviceSchema, websiteSchema, breadcrumbSchema } from 'src/utils/structuredData';

interface PageSEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: string;
  noindex?: boolean;
  breadcrumbs?: { name: string; url: string }[];
  includeOrganizationSchema?: boolean;
  includeServiceSchema?: boolean;
  includeWebsiteSchema?: boolean;
  customStructuredData?: object;
}

export const PageSEO: React.FC<PageSEOProps> = ({
  title,
  description,
  keywords,
  canonicalUrl,
  ogImage,
  ogType,
  noindex,
  breadcrumbs,
  includeOrganizationSchema = false,
  includeServiceSchema = false,
  includeWebsiteSchema = false,
  customStructuredData,
}) => {
  const schemas: object[] = [];

  if (includeOrganizationSchema) {
    schemas.push(organizationSchema);
  }

  if (includeServiceSchema) {
    schemas.push(serviceSchema);
  }

  if (includeWebsiteSchema) {
    schemas.push(websiteSchema);
  }

  if (breadcrumbs && breadcrumbs.length > 0) {
    schemas.push(breadcrumbSchema(breadcrumbs));
  }

  if (customStructuredData) {
    schemas.push(customStructuredData);
  }

  const structuredData = schemas.length > 1 ? { '@graph': schemas } : schemas[0];

  return (
    <SEOHead
      title={title}
      description={description}
      keywords={keywords}
      canonicalUrl={canonicalUrl}
      ogImage={ogImage}
      ogType={ogType}
      noindex={noindex}
      structuredData={structuredData}
    />
  );
};

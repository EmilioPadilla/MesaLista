import { useEffect } from 'react';

interface MetaTag {
  name?: string;
  property?: string;
  content: string;
  charset?: string;
}

interface LinkTag {
  rel: string;
  href: string;
  type?: string;
}

interface UseDocumentHeadProps {
  title?: string;
  meta?: MetaTag[];
  link?: LinkTag[];
  script?: string;
}

export const useDocumentHead = ({ title, meta = [], link = [], script }: UseDocumentHeadProps) => {
  useEffect(() => {
    // Store original values for cleanup
    const originalTitle = document.title;
    const addedElements: Element[] = [];

    // Set title
    if (title) {
      document.title = title;
    }

    // Add meta tags
    meta.forEach((metaTag) => {
      const element = document.createElement('meta');

      if (metaTag.name) {
        element.setAttribute('name', metaTag.name);
      }
      if (metaTag.property) {
        element.setAttribute('property', metaTag.property);
      }
      if (metaTag.content) {
        element.setAttribute('content', metaTag.content);
      }
      if (metaTag.charset) {
        element.setAttribute('charset', metaTag.charset);
      }

      // Check if similar meta tag exists and remove it
      const existingMeta = metaTag.name
        ? document.querySelector(`meta[name="${metaTag.name}"]`)
        : metaTag.property
          ? document.querySelector(`meta[property="${metaTag.property}"]`)
          : null;

      if (existingMeta) {
        existingMeta.remove();
      }

      document.head.appendChild(element);
      addedElements.push(element);
    });

    // Add link tags
    link.forEach((linkTag) => {
      const element = document.createElement('link');
      element.setAttribute('rel', linkTag.rel);
      element.setAttribute('href', linkTag.href);
      if (linkTag.type) {
        element.setAttribute('type', linkTag.type);
      }

      // Check if similar link exists and remove it
      const existingLink = document.querySelector(`link[rel="${linkTag.rel}"][href="${linkTag.href}"]`);
      if (existingLink) {
        existingLink.remove();
      }

      document.head.appendChild(element);
      addedElements.push(element);
    });

    // Add script if provided (for JSON-LD structured data)
    if (script) {
      const scriptElement = document.createElement('script');
      scriptElement.type = 'application/ld+json';
      scriptElement.textContent = script;
      document.head.appendChild(scriptElement);
      addedElements.push(scriptElement);
    }

    // Cleanup function
    return () => {
      // Restore original title
      document.title = originalTitle;

      // Remove added elements
      addedElements.forEach((element) => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      });
    };
  }, [title, meta, link, script]);
};

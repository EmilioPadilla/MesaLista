import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PageSEO } from './PageSEO';

const readJsonLd = () => {
  const scripts = document.head.querySelectorAll('script[type="application/ld+json"]');
  expect(scripts).toHaveLength(1);
  return JSON.parse(scripts[0].textContent ?? '');
};

describe('PageSEO', () => {
  it('adds a top-level @context when combining several schemas into a @graph', () => {
    render(<PageSEO includeOrganizationSchema includeServiceSchema includeWebsiteSchema />);
    const data = readJsonLd();

    expect(data['@context']).toBe('https://schema.org');
    expect(data['@graph']).toHaveLength(3);
  });

  it('emits a single schema as-is', () => {
    render(<PageSEO includeOrganizationSchema />);
    const data = readJsonLd();

    expect(data['@context']).toBe('https://schema.org');
    expect(data['@type']).toBe('Organization');
    expect(data['@graph']).toBeUndefined();
  });
});

import { describe, expect, it } from 'vitest';
import { publicRegistryDisplayLink, publicRegistryPath, publicRegistryUrl } from './registryLinks';

describe('registryLinks', () => {
  it('addresses a single-list registry by slug alone', () => {
    expect(publicRegistryPath('sol-y-emilio')).toBe('/sol-y-emilio/regalos');
    expect(publicRegistryDisplayLink('sol-y-emilio')).toBe('mesalista.com.mx/sol-y-emilio/regalos');
    expect(publicRegistryUrl('sol-y-emilio')).toBe('https://mesalista.com.mx/sol-y-emilio/regalos');
  });

  it('keeps the list id when the owner has several lists', () => {
    expect(publicRegistryPath('sol-y-emilio', 225)).toBe('/sol-y-emilio/regalos?listId=225');
    expect(publicRegistryUrl('sol-y-emilio', 225)).toBe('https://mesalista.com.mx/sol-y-emilio/regalos?listId=225');
  });
});

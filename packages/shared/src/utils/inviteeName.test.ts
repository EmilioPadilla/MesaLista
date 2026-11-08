import { describe, expect, it } from 'vitest';
import { inviteeFullName, inviteeLastName } from './inviteeName';

describe('inviteeName', () => {
  it('joins first and last name', () => {
    expect(inviteeFullName({ firstName: 'Ana', lastName: 'Pérez' })).toBe('Ana Pérez');
  });

  it('does not add a space when there is no last name', () => {
    expect(inviteeFullName({ firstName: 'Sol y su pareja', lastName: '' })).toBe('Sol y su pareja');
  });

  it('hides the placeholder stored on older invitees', () => {
    expect(inviteeLastName('Sin Apellido')).toBe('');
    expect(inviteeFullName({ firstName: 'Sol y su pareja', lastName: 'Sin Apellido' })).toBe('Sol y su pareja');
  });
});

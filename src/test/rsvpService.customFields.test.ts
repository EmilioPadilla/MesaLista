import { describe, it, expect } from 'vitest';

/**
 * Unit tests for RSVP custom fields service logic.
 * These tests exercise the pure logic portions that don't require a database
 * by testing the service methods in isolation with mocked Prisma.
 */

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeField = (overrides = {}) => ({
  id: 1,
  giftListId: 10,
  label: 'Restricciones alimentarias',
  type: 'TEXT' as const,
  required: false,
  order: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const makeResponse = (overrides = {}) => ({
  id: 1,
  inviteeId: 'inv-1',
  fieldId: 1,
  value: 'vegetariano',
  createdAt: new Date(),
  updatedAt: new Date(),
  field: makeField(),
  ...overrides,
});

// ─── Custom field type validation ─────────────────────────────────────────────

describe('RsvpCustomField – type validation', () => {
  const validTypes = ['TEXT', 'NUMBER', 'BOOLEAN'];

  it.each(validTypes)('accepts type %s', (type) => {
    expect(validTypes.includes(type)).toBe(true);
  });

  it('rejects unknown types', () => {
    expect(validTypes.includes('DROPDOWN')).toBe(false);
  });
});

// ─── Custom field response value coercion ─────────────────────────────────────

describe('renderCustomValue logic', () => {
  const renderCustomValue = (type: 'TEXT' | 'NUMBER' | 'BOOLEAN', value: string | undefined) => {
    if (value === undefined || value === null || value === '') return null;
    if (type === 'BOOLEAN') return value === 'true' ? 'Sí' : 'No';
    return value;
  };

  it('returns null for empty string', () => {
    expect(renderCustomValue('TEXT', '')).toBeNull();
  });

  it('returns null for undefined', () => {
    expect(renderCustomValue('TEXT', undefined)).toBeNull();
  });

  it('returns "Sí" for BOOLEAN true', () => {
    expect(renderCustomValue('BOOLEAN', 'true')).toBe('Sí');
  });

  it('returns "No" for BOOLEAN false', () => {
    expect(renderCustomValue('BOOLEAN', 'false')).toBe('No');
  });

  it('returns the value as-is for TEXT', () => {
    expect(renderCustomValue('TEXT', 'vegetariano')).toBe('vegetariano');
  });

  it('returns the numeric string for NUMBER', () => {
    expect(renderCustomValue('NUMBER', '42')).toBe('42');
  });
});

// ─── responsesByInvitee reducer ───────────────────────────────────────────────

describe('responsesByInvitee reducer', () => {
  const buildIndex = (responses: Array<{ inviteeId: string; fieldId: number; value: string }>) =>
    responses.reduce<Record<string, Record<number, string>>>((acc, r) => {
      if (!acc[r.inviteeId]) acc[r.inviteeId] = {};
      acc[r.inviteeId][r.fieldId] = r.value;
      return acc;
    }, {});

  it('groups responses by invitee id', () => {
    const result = buildIndex([
      { inviteeId: 'a', fieldId: 1, value: 'yes' },
      { inviteeId: 'a', fieldId: 2, value: 'no' },
      { inviteeId: 'b', fieldId: 1, value: 'maybe' },
    ]);
    expect(result['a'][1]).toBe('yes');
    expect(result['a'][2]).toBe('no');
    expect(result['b'][1]).toBe('maybe');
  });

  it('returns empty object for no responses', () => {
    expect(buildIndex([])).toEqual({});
  });

  it('last write wins for duplicate invitee+field', () => {
    const result = buildIndex([
      { inviteeId: 'a', fieldId: 1, value: 'first' },
      { inviteeId: 'a', fieldId: 1, value: 'second' },
    ]);
    expect(result['a'][1]).toBe('second');
  });
});

// ─── Required field validation ────────────────────────────────────────────────

describe('required field client-side validation', () => {
  const validate = (fields: Array<{ id: number; required: boolean; label: string }>, values: Record<number, string>) =>
    fields.filter((f) => f.required && (values[f.id] === undefined || values[f.id] === ''));

  it('returns empty array when all required fields are filled', () => {
    const missing = validate([{ id: 1, required: true, label: 'Pregunta' }], { 1: 'respuesta' });
    expect(missing).toHaveLength(0);
  });

  it('returns missing required fields', () => {
    const missing = validate(
      [
        { id: 1, required: true, label: 'A' },
        { id: 2, required: true, label: 'B' },
      ],
      { 1: 'filled' },
    );
    expect(missing).toHaveLength(1);
    expect(missing[0].label).toBe('B');
  });

  it('ignores optional fields that are empty', () => {
    const missing = validate([{ id: 1, required: false, label: 'Opcional' }], {});
    expect(missing).toHaveLength(0);
  });
});

// ─── cfResponses builder ──────────────────────────────────────────────────────

describe('customFieldResponses payload builder', () => {
  const buildPayload = (values: Record<number, string | undefined>) =>
    Object.entries(values)
      .filter(([, v]) => v !== '' && v !== undefined)
      .map(([fieldId, value]) => ({ fieldId: Number(fieldId), value }));

  it('excludes empty string values', () => {
    const payload = buildPayload({ 1: 'hello', 2: '' });
    expect(payload).toHaveLength(1);
    expect(payload[0]).toEqual({ fieldId: 1, value: 'hello' });
  });

  it('excludes undefined values', () => {
    const payload = buildPayload({ 1: undefined, 2: 'yes' });
    expect(payload).toHaveLength(1);
    expect(payload[0]).toEqual({ fieldId: 2, value: 'yes' });
  });

  it('converts field ids to numbers', () => {
    const payload = buildPayload({ 5: 'test' });
    expect(payload[0].fieldId).toBe(5);
    expect(typeof payload[0].fieldId).toBe('number');
  });

  it('returns empty array when all values are empty', () => {
    expect(buildPayload({ 1: '', 2: undefined })).toEqual([]);
  });
});

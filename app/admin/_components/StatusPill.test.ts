import { describe, it, expect } from 'vitest';
import { pillVariantFor } from './StatusPill';

describe('pillVariantFor', () => {
  it('maps engagement active to green', () => {
    expect(pillVariantFor('active')).toBe('green');
  });
  it('maps engagement onboarding to yellow', () => {
    expect(pillVariantFor('onboarding')).toBe('yellow');
  });
  it('maps engagement paused to neutral', () => {
    expect(pillVariantFor('paused')).toBe('neutral');
  });
  it('maps engagement churned to red', () => {
    expect(pillVariantFor('churned')).toBe('red');
  });
  it('maps automation live to green', () => {
    expect(pillVariantFor('live')).toBe('green');
  });
  it('maps automation error to red', () => {
    expect(pillVariantFor('error')).toBe('red');
  });
  it('maps automation draft to neutral', () => {
    expect(pillVariantFor('draft')).toBe('neutral');
  });
  it('maps run failure to red', () => {
    expect(pillVariantFor('failure')).toBe('red');
  });
  it('maps run success to green', () => {
    expect(pillVariantFor('success')).toBe('green');
  });
  it('maps run running to yellow', () => {
    expect(pillVariantFor('running')).toBe('yellow');
  });
  it('falls back to neutral for unknown', () => {
    expect(pillVariantFor('???' as never)).toBe('neutral');
  });
});

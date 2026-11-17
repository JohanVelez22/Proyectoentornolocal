import { describe, expect, it } from 'vitest';
import * as core from '../src';

describe('humo', () => {
  it('exporta la versión', () => {
    expect(core.VERSION).toBe('0.1.0');
  });
});

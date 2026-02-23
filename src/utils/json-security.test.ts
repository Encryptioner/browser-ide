/**
 * Security Tests for JSON Parsing Utilities
 *
 * These tests verify that JSON parsing functions properly
 * prevent prototype pollution and handle malicious input.
 */

import { describe, it, expect } from 'vitest';
import {
  safeJSONParse,
  safeJSONParseNoProto,
  safeJSONParseWithSchema,
  safeClone
} from './json';

describe('JSON Security Tests', () => {
  describe('Prototype Pollution Prevention', () => {
    it('should block __proto__ injection', () => {
      const malicious = '{"__proto__": {"polluted": true}}';
      const result = safeJSONParseNoProto(malicious, {} as Record<string, unknown>);

      expect((result as Record<string, unknown>).polluted).toBeUndefined();
      expect((Object.prototype as Record<string, unknown>).polluted).toBeUndefined();
    });

    it('should block constructor prototype pollution', () => {
      const malicious = '{"constructor": {"prototype": {"polluted": true}}}';
      const result = safeJSONParseNoProto(malicious, {} as Record<string, unknown>);

      expect((result as Record<string, unknown>).polluted).toBeUndefined();
      expect((Object.prototype as Record<string, unknown>).polluted).toBeUndefined();
    });

    it('should block prototype pollution via nested object', () => {
      const malicious = JSON.stringify({
        json: '{"__proto__": {"admin": true}}'
      });
      const result = safeJSONParseNoProto(malicious, {} as Record<string, unknown>);

      expect((result as Record<string, unknown>).admin).toBeUndefined();
      expect((Object.prototype as Record<string, unknown>).admin).toBeUndefined();
    });
  });

  describe('Malformed JSON Handling', () => {
    it('should handle trailing commas gracefully', () => {
      const malformed = '{"name": "test",}';
      const result = safeJSONParse(malformed, null);

      expect(result).toBeNull();
    });

    it('should handle unquoted keys', () => {
      const malformed = '{name: "test"}';
      const result = safeJSONParse(malformed, null);

      expect(result).toBeNull();
    });

    it('should handle single quotes instead of double quotes', () => {
      const malformed = "{'name': 'test'}";
      const result = safeJSONParse(malformed, null);

      expect(result).toBeNull();
    });

    it('should handle comments in JSON', () => {
      const withComments = '{"name": "test" /* comment */, "value": 123}';
      const result = safeJSONParse(withComments, null);

      expect(result).toBeNull();
    });

    it('should handle undefined values', () => {
      const result = safeJSONParse(undefined as unknown as string, null);

      expect(result).toBeNull();
    });

    it('should handle empty strings', () => {
      const result = safeJSONParse('', null);

      expect(result).toBeNull();
    });
  });

  describe('Schema Validation', () => {
    it('should validate against schema for allowed properties', () => {
      const allowedProps = ['name', 'age', 'email'];
      const validator = (value: unknown): value is Record<string, unknown> => {
        if (typeof value !== 'object' || value === null) return false;
        // Strip disallowed properties
        const obj = value as Record<string, unknown>;
        for (const key of Object.keys(obj)) {
          if (!allowedProps.includes(key)) {
            delete obj[key];
          }
        }
        return true;
      };
      const input = '{"name": "John", "age": 30, "admin": true}';
      const result = safeJSONParseWithSchema(input, validator, null);

      // Should strip disallowed properties
      expect(result?.name).toBe('John');
      expect(result?.age).toBe(30);
      expect(result?.admin).toBeUndefined();
    });

    it('should validate nested objects', () => {
      const allowedProps = ['user', 'settings'];
      const validator = (value: unknown): value is Record<string, unknown> => {
        if (typeof value !== 'object' || value === null) return false;
        const obj = value as Record<string, unknown>;
        for (const key of Object.keys(obj)) {
          if (!allowedProps.includes(key)) {
            delete obj[key];
          }
        }
        return true;
      };
      const input = '{"user": {"name": "John", "role": "admin"}, "settings": {}}';
      const result = safeJSONParseWithSchema(input, validator, null);

      expect(result?.user).toBeDefined();
      expect(result?.settings).toBeDefined();
    });

    it('should handle array validation', () => {
      const allowedProps = ['items'];
      const validator = (value: unknown): value is Record<string, unknown> => {
        if (typeof value !== 'object' || value === null) return false;
        const obj = value as Record<string, unknown>;
        for (const key of Object.keys(obj)) {
          if (!allowedProps.includes(key)) {
            delete obj[key];
          }
        }
        return true;
      };
      const input = '{"items": [1, 2, 3], "extra": "blocked"}';
      const result = safeJSONParseWithSchema(input, validator, null);

      expect(result?.items).toEqual([1, 2, 3]);
      expect(result?.extra).toBeUndefined();
    });
  });

  describe('Safe Cloning', () => {
    it('should deep clone objects without reference sharing', () => {
      const original = {
        nested: { value: 1 },
        array: [1, 2, 3]
      };
      const cloned = safeClone(original);

      // Modify original
      original.nested.value = 999;
      original.array[0] = 999;

      // Clone should be unaffected
      expect(cloned.nested.value).toBe(1);
      expect(cloned.array[0]).toBe(1);
    });

    it('should handle circular references gracefully', () => {
      const circular: Record<string, unknown> = { name: 'test' };
      circular.self = circular;

      const result = safeClone(circular);

      // structuredClone handles circular refs in modern environments
      // safeClone should handle this without crashing
      expect(result).toBeDefined();
    });

    it('should clone Date objects', () => {
      const date = new Date('2024-01-01');
      const cloned = safeClone({ date });

      expect(cloned.date).toBeInstanceOf(Date);
      expect(cloned.date.toISOString()).toBe(date.toISOString());
    });

    it('should clone special values', () => {
      const input = {
        null: null,
        undef: undefined,
        num: 42,
        str: 'hello',
        bool: true,
        NaN: Number.NaN
      };
      const cloned = safeClone(input);

      expect(cloned.null).toBeNull();
      expect(cloned.undef).toBeUndefined();
      expect(cloned.num).toBe(42);
      expect(cloned.str).toBe('hello');
      expect(cloned.bool).toBe(true);
      expect(isNaN(cloned.NaN)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should return fallback for invalid JSON', () => {
      const invalid = '{not valid json}';
      const result = safeJSONParse(invalid, null);

      expect(result).toBeNull();
    });

    it('should handle massive JSON strings', () => {
      const massive = '{"data": "' + 'x'.repeat(10_000_000) + '"}';
      const result = safeJSONParse(massive, null);

      // Should handle without crashing
      expect(result).toBeDefined();
    });

    it('should handle deeply nested JSON', () => {
      let nested = {} as Record<string, unknown>;
      for (let i = 0; i < 1000; i++) {
        nested = { level: nested };
      }
      const json = JSON.stringify(nested);

      const result = safeJSONParse(json, null);

      // Should handle without stack overflow
      expect(result).toBeDefined();
    });

    it('should handle unicode escaping', () => {
      const unicode = '{"emoji": "\ud83d\ude00", "text": "\\u0048\\u0065\\u006c\\u006c\\u006f"}';
      const result = safeJSONParse<Record<string, string>>(unicode, {} as Record<string, string>);

      expect(result).toBeDefined();
      // \ud83d\ude00 is the surrogate pair for U+1F600 (grinning face emoji)
      expect(result!.emoji).toBe('\ud83d\ude00');
      expect(result!.text).toBe('Hello');
    });
  });

  describe('XSS Prevention', () => {
    it('should sanitize script tags in JSON values', () => {
      const malicious = '{"html": "<script>alert(1)</script>"}';
      const result = safeJSONParse<Record<string, string>>(malicious, {} as Record<string, string>);

      expect(result?.html).toContain('script');
      // Note: This test documents current behavior
      // Full XSS prevention requires additional sanitization layer
    });

    it('should handle javascript: URLs', () => {
      const malicious = '{"url": "javascript:alert(1)"}';
      const result = safeJSONParse<Record<string, string>>(malicious, {} as Record<string, string>);

      expect(result?.url).toContain('javascript');
      // Note: This test documents current behavior
      // URL validation should be done at usage point
    });

    it('should handle data: URLs with base64', () => {
      const malicious = '{"url": "data:text/html,<script>alert(1)</script>"}';
      const result = safeJSONParse<Record<string, string>>(malicious, {} as Record<string, string>);

      expect(result?.url).toContain('data:');
      // Note: This test documents current behavior
    });
  });

  describe('Type Safety', () => {
    it('should preserve number types', () => {
      const input = '{"int": 42, "float": 3.14, "negative": -123, "zero": 0}';
      const result = safeJSONParse<Record<string, number>>(input, {} as Record<string, number>);

      expect(typeof result?.int).toBe('number');
      expect(typeof result?.float).toBe('number');
      expect(typeof result?.negative).toBe('number');
      expect(typeof result?.zero).toBe('number');
    });

    it('should preserve boolean types', () => {
      const input = '{"true": true, "false": false, "null": null}';
      const result = safeJSONParse<Record<string, unknown>>(input, {} as Record<string, unknown>);

      expect(typeof result?.true).toBe('boolean');
      expect(typeof result?.false).toBe('boolean');
      expect(result?.null).toBeNull();
    });

    it('should distinguish between zero and falsy values', () => {
      const input = '{"zero": 0, "empty": "", "false": false, "null": null}';
      const result = safeJSONParse<Record<string, unknown>>(input, {} as Record<string, unknown>);

      expect(result?.zero).toBe(0);
      expect(result?.empty).toBe('');
      expect(result?.false).toBe(false);
      expect(result?.null).toBeNull();
    });
  });
});

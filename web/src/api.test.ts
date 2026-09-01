import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api } from './api';

const MOCK_API_BASE = '/api';

describe('API Client', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.clearAllMocks();
  });

  describe('getSettings', () => {
    it('should return fetched settings on successful response', async () => {
      const mockSettings = { gamma: 2.0 };
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSettings,
      });

      const result = await api.getSettings();

      expect(globalThis.fetch).toHaveBeenCalledWith(`${MOCK_API_BASE}/settings`);
      expect(result).toEqual(mockSettings);
    });

    it('should return null on failed response (not ok)', async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: false,
      });

      const result = await api.getSettings();

      expect(globalThis.fetch).toHaveBeenCalledWith(`${MOCK_API_BASE}/settings`);
      expect(result).toBeNull();
    });

    it('should return null on network error', async () => {
      (globalThis.fetch as any).mockRejectedValueOnce(new Error('Network Error'));

      const result = await api.getSettings();

      expect(globalThis.fetch).toHaveBeenCalledWith(`${MOCK_API_BASE}/settings`);
      expect(result).toBeNull();
    });
  });

  describe('getStatus', () => {
    it('should return fetched status on successful response', async () => {
      const mockStatus = { status: 'online', version: '2.0.0' };
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus,
      });

      const result = await api.getStatus();

      expect(globalThis.fetch).toHaveBeenCalledWith(`${MOCK_API_BASE}/status`);
      expect(result).toEqual(mockStatus);
    });

    it('should return default fallback status on failed response (not ok)', async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: false,
      });

      const result = await api.getStatus();

      expect(globalThis.fetch).toHaveBeenCalledWith(`${MOCK_API_BASE}/status`);
      expect(result.status).toBe('online');
      expect(result.version).toBe('1.1.1');
    });

    it('should return default fallback status on network error', async () => {
      (globalThis.fetch as any).mockRejectedValueOnce(new Error('Network Error'));

      const result = await api.getStatus();

      expect(globalThis.fetch).toHaveBeenCalledWith(`${MOCK_API_BASE}/status`);
      expect(result.status).toBe('online');
      expect(result.version).toBe('1.1.1');
    });
  });

  describe('applySettings', () => {
    it('should post settings and return true on success', async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
      });

      const mockSettings = { gamma: 1.5 };
      const result = await api.applySettings(mockSettings);

      expect(globalThis.fetch).toHaveBeenCalledWith(`${MOCK_API_BASE}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockSettings),
        signal: undefined,
      });
      expect(result).toBe(true);
    });

    it('should return false on failed response (not ok)', async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: false,
      });

      const result = await api.applySettings({});

      expect(result).toBe(false);
    });

    it('should return true on network error because of catch block', async () => {
      (globalThis.fetch as any).mockRejectedValueOnce(new Error('Network Error'));

      const result = await api.applySettings({});

      expect(result).toBe(true);
    });
  });

  describe('getProfiles', () => {
    it('should return fetched profiles on successful response', async () => {
      const mockProfiles = [{ id: 'test_profile', name: 'Test' }];
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfiles,
      });

      const result = await api.getProfiles();

      expect(globalThis.fetch).toHaveBeenCalledWith(`${MOCK_API_BASE}/profiles`);
      expect(result).toEqual(mockProfiles);
    });

    it('should return default builtin profiles on failed response (not ok)', async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: false,
      });

      const result = await api.getProfiles();

      expect(globalThis.fetch).toHaveBeenCalledWith(`${MOCK_API_BASE}/profiles`);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].id).toBe('night_vision');
    });

    it('should return default builtin profiles on network error', async () => {
      (globalThis.fetch as any).mockRejectedValueOnce(new Error('Network Error'));

      const result = await api.getProfiles();

      expect(globalThis.fetch).toHaveBeenCalledWith(`${MOCK_API_BASE}/profiles`);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].id).toBe('night_vision');
    });
  });
});

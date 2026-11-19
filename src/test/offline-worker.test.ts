import { describe, expect, it } from 'vitest';
import { isOfflinePreview } from '@/game/offline';
import { offlineRuntimeCaching } from '@/game/offlinePolicy';

function matches(path: string, mode = 'cors', auth = false, method = 'GET') {
  const url = new URL(path, self.location.origin);
  const request = { method, mode, headers: { has: () => auth } } as unknown as Request;
  return offlineRuntimeCaching.filter(rule => rule.urlPattern({ request, url }));
}
describe('Öffentlicher Offline-Cache', () => {
  it('schließt API, OAuth, Authentifizierung, fremde Hosts und Schreibzugriffe aus', () => {
    expect(matches('/api/private', 'navigate')).toHaveLength(0);
    expect(matches('/~oauth', 'navigate')).toHaveLength(0);
    expect(matches('/assets/image.webp', 'cors', true)).toHaveLength(0);
    expect(matches('/assets/image.webp', 'cors', false, 'POST')).toHaveLength(0);
    expect(matches('https://external.example/assets/image.webp')).toHaveLength(0);
  });
  it('lädt HTML zuerst aus dem Netz und nur erfolgreiche Antworten in den Cache', () => {
    expect(matches('/', 'navigate')[0]?.handler).toBe('NetworkFirst');
    expect(matches('/', 'navigate')[0]?.options.cacheableResponse.statuses).toEqual([200]);
  });
  it('verwendet für unveränderliche Spielgrafiken CacheFirst', () => {
    expect(matches('/__l5e/assets-v1/test/cafe.webp')[0]?.handler).toBe('CacheFirst');
  });
  it('erkennt alle Preview-Arten ohne veröffentlichte Domains auszuschließen', () => {
    for (const host of ['localhost', 'id-preview--abc.lovable.app', 'preview-2--abc.gpt-eng.com', 'project--3f835c0c-f519-4545-8b81-19f76cadcc30-dev.lovable.app', 'app.lovableproject.com', 'beta.lovable.dev']) expect(isOfflinePreview(host)).toBe(true);
    for (const host of ['bean-baron-tycoon.lovable.app', 'preview-v2--shop.example.com']) expect(isOfflinePreview(host)).toBe(false);
  });
});
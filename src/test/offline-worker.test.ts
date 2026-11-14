import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

function worker() {
  const listeners: Record<string, (event: any) => void> = {};
  const cache = { match: vi.fn(), put: vi.fn().mockResolvedValue(undefined) };
  const fetch = vi.fn().mockResolvedValue({ ok: true, type: 'basic', clone: () => ({ cached: true }) });
  runInNewContext(readFileSync('public/sw.js', 'utf8'), {
    self: { location: { origin: 'https://coffee.example' }, addEventListener: (name: string, fn: (event: any) => void) => { listeners[name] = fn; } },
    URL, Response, fetch, caches: { open: () => Promise.resolve(cache) },
  });
  return { listeners, cache, fetch };
}
function request(path: string, options: { mode?: string; method?: string; auth?: boolean } = {}) {
  return { url: `https://coffee.example${path}`, method: options.method ?? 'GET', mode: options.mode ?? 'cors', headers: { has: () => options.auth ?? false } };
}
describe('Öffentlicher Offline-Cache', () => {
  it('speichert keine API-, authentifizierten oder schreibenden Anfragen', () => {
    const { listeners } = worker();
    for (const r of [request('/api/private'), request('/assets/image.webp', { auth: true }), request('/assets/image.webp', { method: 'POST' })]) {
      const respondWith = vi.fn(); listeners.fetch?.({ request: r, respondWith }); expect(respondWith).not.toHaveBeenCalled();
    }
  });
  it('liefert ein bereits geladenes Bild ohne erneute Netzwerkanfrage', async () => {
    const { listeners, cache, fetch } = worker(); cache.match.mockResolvedValue('cached-image');
    let pending: Promise<unknown> | undefined;
    listeners.fetch?.({ request: request('/__l5e/assets-v1/test/cafe.webp'), respondWith: (p: Promise<unknown>) => { pending = p; } });
    expect(await pending).toBe('cached-image'); expect(fetch).not.toHaveBeenCalled();
  });
  it('liefert bei Offline-Navigation die gespeicherte Startseite', async () => {
    const { listeners, cache, fetch } = worker(); fetch.mockRejectedValue(new Error('offline')); cache.match.mockImplementation((r: unknown) => Promise.resolve(r === '/' ? 'cached-start' : undefined));
    let pending: Promise<unknown> | undefined;
    listeners.fetch?.({ request: request('/new', { mode: 'navigate' }), respondWith: (p: Promise<unknown>) => { pending = p; } });
    expect(await pending).toBe('cached-start');
  });
});
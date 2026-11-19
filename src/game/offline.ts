export function isOfflinePreview(hostname: string) {
  const host = hostname.toLowerCase();
  const platform = /\.(lovable\.app|gpt-eng\.com|gptengineer\.run)$/.test(host);
  return host === 'localhost' || host === '127.0.0.1'
    || (platform && (/^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/.test(host.split('.')[0] ?? '') || host.startsWith('project--3f835c0c-f519-4545-8b81-19f76cadcc30-dev.')))
    || /(^|\.)(lovableproject\.com|lovableproject-dev\.com|beta\.lovable\.dev)$/.test(host);
}

export async function registerOffline() {
  if (!('serviceWorker' in navigator)) return;
  const refused = !import.meta.env.PROD || window.self !== window.top || isOfflinePreview(window.location.hostname) || new URLSearchParams(window.location.search).get('sw') === 'off';
  if (refused) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.filter(r => [r.active, r.waiting, r.installing].some(w => w && new URL(w.scriptURL).pathname === '/sw.js')).map(r => r.unregister()));
    return;
  }
  await navigator.serviceWorker.register('/sw.js');
}
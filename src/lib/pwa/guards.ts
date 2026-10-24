export function shouldRegisterPwa(production: boolean, hostname: string, framed: boolean, search: string): boolean {
 const host = hostname.toLowerCase();
 if (!production || framed || new URLSearchParams(search).get('sw') === 'off') return false;
 if (host === 'localhost' || host === '127.0.0.1') return false;
 if (['lovableproject.com', 'lovableproject-dev.com', 'beta.lovable.dev'].some(domain => host === domain || host.endsWith(`.${domain}`))) return false;
 const platform = ['lovable.app', 'gpt-eng.com', 'gptengineer.run'].some(domain => host.endsWith(`.${domain}`));
 const label = host.split('.')[0] ?? '';
 if (platform && (/^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/.test(label) || /^project--.+-dev$/.test(label))) return false;
 return true;
}

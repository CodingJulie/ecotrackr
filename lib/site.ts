const PRODUCTION_SITE_URL = 'https://ecotrackr.com';
const DEVELOPMENT_SITE_URL = 'http://localhost:3000';

export function getSiteUrl(): string {
    const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
    if (envUrl) return envUrl;

    return process.env.NODE_ENV === 'production'
        ? PRODUCTION_SITE_URL
        : DEVELOPMENT_SITE_URL;
}

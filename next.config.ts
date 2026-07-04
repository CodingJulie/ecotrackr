// next.config.ts

const nextConfig = {
    typescript: {
        ignoreBuildErrors: true,
    },
    experimental: {
        optimizeCss: true,
        largePageDataBytes: 128 * 1000,
        optimizePackageImports: ['recharts', 'leaflet', 'framer-motion', 'lucide-react'],
    },
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
    },
    images: {
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    },
    modularizeImports: {
        'lucide-react': {
            transform: 'lucide-react/dist/esm/icons/{{member}}',
        },
    },
    // i18n: i18nConfig.i18n, // ← Закомментируйте или удалите
    async headers() {
        return [
            {
                source: '/:path*.{png,jpg,jpeg,gif,svg,webp,avif,ico}',
                headers: [
                    { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
                ],
            },
        ];
    },
};

export default nextConfig;
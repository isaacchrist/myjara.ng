/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**",
            },
        ],
    },
    async redirects() {
        return [
            {
                source: "/how-jara-works",
                destination: "/how-it-works",
                permanent: true,
            },
        ];
    },
};

export default nextConfig;

import Image from 'next/image'

interface BrandLogoProps {
    /** Height (px) of the icon mark. The "MyJara" wordmark below is sized to the icon width. */
    size?: number
    /** Light wordmark for dark backgrounds (e.g. the admin sidebar). */
    dark?: boolean
    priority?: boolean
    className?: string
}

/**
 * MyJara brand lockup: the two-bar icon mark with the "MyJara" wordmark stacked
 * directly underneath, set in Fredoka (loaded in globals.css) and stretched to
 * exactly span the icon's width via SVG textLength. Filled with the brand green
 * gradient (a lighter one on dark backgrounds).
 */
export function BrandLogo({ size = 40, dark = false, priority = false, className = '' }: BrandLogoProps) {
    const textH = Math.round(size * 0.32)
    const gradId = dark ? 'brandWordDark' : 'brandWord'
    return (
        <span
            className={`inline-flex flex-col items-center ${className}`}
            style={{ lineHeight: 0 }}
        >
            <Image
                src="/logo-mark.png"
                alt="MyJara"
                width={size}
                height={size}
                priority={priority}
                style={{ width: size, height: size, objectFit: 'contain' }}
            />
            <svg
                width={size}
                height={textH}
                viewBox={`0 0 ${size} ${textH}`}
                // pull the wordmark up tight against the icon (the PNG carries some padding)
                style={{ marginTop: -Math.round(size * 0.12) }}
                aria-hidden="true"
            >
                <defs>
                    <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                        {dark ? (
                            <>
                                <stop offset="0%" stopColor="#a7f3d0" />
                                <stop offset="100%" stopColor="#34d399" />
                            </>
                        ) : (
                            <>
                                <stop offset="0%" stopColor="#34d399" />
                                <stop offset="55%" stopColor="#10b981" />
                                <stop offset="100%" stopColor="#047857" />
                            </>
                        )}
                    </linearGradient>
                </defs>
                <text
                    x={size / 2}
                    y={textH * 0.8}
                    textAnchor="middle"
                    textLength={size * 0.96}
                    lengthAdjust="spacingAndGlyphs"
                    fontFamily="'Fredoka', system-ui, sans-serif"
                    fontWeight="700"
                    fontSize={textH}
                    fill={`url(#${gradId})`}
                >
                    MyJara
                </text>
            </svg>
        </span>
    )
}

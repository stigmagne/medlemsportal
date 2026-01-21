import React from 'react'

// Simple QR Code generator using an external API or a lightweight implementation
// Since we want to avoid deps, let's use a reliable external image source for now,
// or a very simple SVG generator. `api.qrserver.com` is common.
// Alternatively, we can use a small local implementation if privacy is key.
// For now, using a privacy-friendly SVG generation helper would be best if we had one.
// Let's use `https://api.qrserver.com/v1/create-qr-code/` as a placeholder,
// but for production, `qrcode.react` is recommended. Since I can't install, I'll use the API key approach (public API).

export function QRCode({ value, size = 128, className }: { value: string, size?: number, className?: string }) {
    // Using goqr.me or qrserver which are public free APIs.
    // Ensure we don't send sensitive PII, just a verification URL/Token.
    const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`

    return (
        <img
            src={src}
            alt="QR Code"
            width={size}
            height={size}
            className={className}
            style={{ imageRendering: 'pixelated' }}
        />
    )
}

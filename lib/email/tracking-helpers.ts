import { headers } from 'next/headers'

export async function getClientInfo() {
    const headersList = await headers()

    const userAgent = headersList.get('user-agent') || 'Unknown'

    // Get IP (handle various proxy headers)
    const ipAddress =
        headersList.get('x-forwarded-for')?.split(',')[0] ||
        headersList.get('x-real-ip') ||
        headersList.get('cf-connecting-ip') || // Cloudflare
        'Unknown'

    return { userAgent, ipAddress }
}



function linkify(text: string): string {
    const urlRegex = /(https?:\/\/[^\s]+)/g
    return text.replace(urlRegex, (url) => {
        return `<a href="${url}">${url}</a>`
    })
}

export function injectTracking(html: string, trackingId: string, baseUrl: string) {
    // 0. Linkify plain text URLs if they aren't already in tags (Basic Implementation)
    // Note: This is simple and might break strict HTML if not careful, but for this "textarea" input it's fine.
    // Better strategy: Only linkify if it looks like plain text.
    // For now, let's assume if it doesn't have <a href, run linkify.
    let processedHtml = html
    if (!html.includes('<a href')) {
        processedHtml = linkify(html)
    }

    // 1. Pixel
    const pixelUrl = `${baseUrl}/api/email/track/open/${trackingId}`
    const pixelHtml = `<img src="${pixelUrl}" alt="" width="1" height="1" style="display:none;" />`

    // 2. Link Wrapping
    // Simple regex to find href="http..." and wrap it
    const wrappedHtml = processedHtml.replace(/href=["'](https?:\/\/[^"']+)["']/g, (match, url) => {
        const trackedUrl = `${baseUrl}/api/email/track/click/${trackingId}?url=${encodeURIComponent(url)}`
        return `href="${trackedUrl}"`
    })

    return wrappedHtml + pixelHtml
}

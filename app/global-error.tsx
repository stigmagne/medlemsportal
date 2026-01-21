'use client'

import { useEffect } from 'react'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <html>
            <body>
                <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
                    <h2 className="text-2xl font-bold mb-4">Noe gikk galt!</h2>
                    <p className="mb-8 text-gray-600">En uventet feil oppstod. Vi har logget feilen og vil se på det.</p>
                    <button
                        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                        onClick={() => reset()}
                    >
                        Prøv igjen
                    </button>
                </div>
            </body>
        </html>
    )
}

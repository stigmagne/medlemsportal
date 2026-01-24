'use client'

import { useEffect, useState } from 'react'
import { getRandomFunnyError } from '@/lib/constants/funny-messages'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCcw } from 'lucide-react'
import { ReportErrorDialog } from '@/components/feedback/report-error-dialog'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    const [funnyMessage, setFunnyMessage] = useState<string>('')

    useEffect(() => {
        setFunnyMessage(getRandomFunnyError())
        console.error(error)
    }, [error])

    return (
        <div className="flex items-center justify-center min-h-[60vh] p-4">
            <Card className="w-full max-w-md shadow-lg border-orange-200 dark:border-orange-900">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto bg-orange-100 dark:bg-orange-900/30 p-4 rounded-full mb-4 w-fit">
                        <AlertTriangle className="w-10 h-10 text-orange-600 dark:text-orange-400" />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                        {funnyMessage || "Oisann! Noe gikk galt."}
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-gray-600 dark:text-gray-300">
                        Beklager det. Vi jobber med saken (eller så har vi kaffepause).
                        Prøv å laste siden på nytt.
                    </p>

                    {/* Technical details (hidden by default or small) */}
                    <div className="text-xs text-gray-400 dark:text-gray-500 font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded overflow-auto max-h-20 text-left">
                        {error.message}
                        {error.digest && <div className="mt-1">Digest: {error.digest}</div>}
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row gap-2 justify-center pb-6">
                    <Button onClick={() => reset()} className="w-full sm:w-auto gap-2">
                        <RefreshCcw className="w-4 h-4" />
                        Prøv igjen
                    </Button>

                    <ReportErrorDialog
                        errorMessage={error.message}
                        errorDigest={error.digest}
                        triggerLabel="Meld fra"
                    />
                </CardFooter>
            </Card>
        </div>
    )
}

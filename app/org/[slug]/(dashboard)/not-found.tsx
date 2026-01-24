'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getRandomFunny404 } from '@/lib/constants/funny-messages'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPinOff, ArrowLeft } from 'lucide-react'
import { ReportErrorDialog } from '@/components/feedback/report-error-dialog'

export default function NotFound() {
    const [funnyMessage, setFunnyMessage] = useState<string>('')

    useEffect(() => {
        setFunnyMessage(getRandomFunny404())
    }, [])

    return (
        <div className="flex items-center justify-center min-h-[60vh] p-4">
            <Card className="w-full max-w-md shadow-lg border-blue-200 dark:border-blue-900">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full mb-4 w-fit">
                        <MapPinOff className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                        {funnyMessage || "404: Fant ikke siden"}
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-gray-600 dark:text-gray-300">
                        Vi har lett høyt og lavt, men denne siden ser ut til å ha forduftet.
                        Kanskje den aldri eksisterte?
                    </p>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row gap-2 justify-center pb-6">
                    {/* Note: We can't easily retrieve the 'org slug' here in not-found without complex hook logic 
                        or parsing pathname. A simple 'Back' or 'Home' is safer. 
                        We'll rely on browser back or dashboard home assumption? 
                        
                        Actually, since this is in (dashboard), users are likely logged in.
                        But we don't know the [slug] param in not-found context easily.
                        We'll just use history.back() wrapper or Link to / (which redirects to dashboard if logged in).
                    */}
                    <Button asChild variant="default" className="w-full sm:w-auto gap-2">
                        <Link href="/">
                            <ArrowLeft className="w-4 h-4" />
                            Gå til forsiden
                        </Link>
                    </Button>

                    <ReportErrorDialog
                        errorMessage="404 Not Found"
                        triggerLabel="Meld fra om død lenke"
                    />
                </CardFooter>
            </Card>
        </div>
    )
}

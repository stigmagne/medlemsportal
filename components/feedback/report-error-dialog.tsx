'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { AlertCircle, CheckCircle2, Loader2, Bug } from 'lucide-react'
import { reportSystemError } from '@/app/actions/error-reporting'
import { usePathname } from 'next/navigation'

interface ReportErrorDialogProps {
    errorDigest?: string
    errorMessage?: string
    orgId?: string
    triggerLabel?: string
}

export function ReportErrorDialog({
    errorDigest,
    errorMessage,
    orgId,
    triggerLabel = "Meld fra om feil"
}: ReportErrorDialogProps) {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)
    const [userComment, setUserComment] = useState('')
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

    const handleSubmit = async () => {
        setStatus('submitting')

        const result = await reportSystemError({
            path: pathname,
            errorMessage: errorMessage || 'Unknown error',
            errorDigest,
            userComment,
            orgId
        })

        if (result.success) {
            setStatus('success')
            setTimeout(() => {
                setIsOpen(false)
                setStatus('idle')
                setUserComment('')
            }, 2000)
        } else {
            console.error(result.message)
            setStatus('error')
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Bug className="w-4 h-4" />
                    {triggerLabel}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Meld fra om feil</DialogTitle>
                    <DialogDescription>
                        Gi oss gjerne litt context på hva du gjorde da dette skjedde.
                        Teknisk info sendes automatisk.
                    </DialogDescription>
                </DialogHeader>

                {status === 'success' ? (
                    <div className="flex flex-col items-center justify-center py-6 text-green-600">
                        <CheckCircle2 className="w-12 h-12 mb-2" />
                        <p className="font-medium">Takk! Feilen er rapportert.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 py-4">
                        <Textarea
                            placeholder="Jeg prøvde å..."
                            value={userComment}
                            onChange={(e) => setUserComment(e.target.value)}
                            disabled={status === 'submitting'}
                            className="min-h-[100px]"
                        />
                        {status === 'error' && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" />
                                Kunne ikke sende rapporten. Prøv igjen senere.
                            </p>
                        )}
                    </div>
                )}

                {status !== 'success' && (
                    <DialogFooter>
                        <Button
                            type="submit"
                            onClick={handleSubmit}
                            disabled={status === 'submitting'}
                        >
                            {status === 'submitting' ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Sender...
                                </>
                            ) : 'Send rapport'}
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    )
}

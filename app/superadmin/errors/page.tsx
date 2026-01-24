
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Trash2, ExternalLink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { nb } from 'date-fns/locale'
import { resolveError, deleteError } from '../actions' // Need to confirm path
import Link from 'next/link'

export default async function ErrorReportsPage() {
    const supabase = await createClient()

    // Fetch errors
    const { data: errors } = await supabase
        .from('error_reports')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Innmeldte Feil</h1>
            <p className="text-muted-foreground">Her ser du hva brukerne dine sliter med.</p>

            <div className="grid gap-4">
                {errors?.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                            Ingen feil å vise. Alt fungerer perfekt! (Eller ingen har klaget ennå).
                        </CardContent>
                    </Card>
                ) : (
                    errors?.map((err) => (
                        <Card key={err.id} className={err.status === 'resolved' ? 'opacity-60 bg-muted/50' : ''}>
                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                <div className="space-y-1">
                                    <CardTitle className="text-base font-semibold text-red-600 dark:text-red-400">
                                        {err.error_message}
                                    </CardTitle>
                                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Badge variant={err.status === 'resolved' ? 'secondary' : 'destructive'}>
                                            {err.status === 'resolved' ? 'Løst' : 'Åpen'}
                                        </Badge>
                                        <span>•</span>
                                        <span>{formatDistanceToNow(new Date(err.created_at), { addSuffix: true, locale: nb })}</span>
                                        <span>•</span>
                                        <span className="font-mono text-xs">{err.path}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {err.status !== 'resolved' && (
                                        <form action={async () => {
                                            'use server'
                                            await resolveError(err.id)
                                        }}>
                                            <Button size="sm" variant="outline" className="h-8 gap-1 text-green-600">
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span className="sr-only sm:not-sr-only">Løs</span>
                                            </Button>
                                        </form>
                                    )}
                                    <form action={async () => {
                                        'use server'
                                        await deleteError(err.id)
                                    }}>
                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-red-600">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </form>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <div className="text-sm font-medium">Brukerens forklaring:</div>
                                        <div className="p-3 bg-muted rounded-md text-sm italic">
                                            "{err.user_comment || 'Ingen kommentar'}"
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            Rapportert av: {err.user_email || 'Ukjent'}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="text-sm font-medium">Teknisk info:</div>
                                        <div className="p-3 bg-black/5 dark:bg-white/5 rounded-md text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                                            Digest: {err.error_digest || 'N/A'}
                                            User-Agent: {err.user_agent?.substring(0, 50)}...
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}

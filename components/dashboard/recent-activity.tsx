import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, UserPlus, CreditCard } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { nb } from 'date-fns/locale'

export async function RecentActivity({ orgSlug, orgId }: { orgSlug: string, orgId: string }) {
    const supabase = await createClient()

    // Fetch recent members
    const { data: members } = await supabase
        .from('members')
        .select('id, first_name, last_name, created_at')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(5)

    // Fetch recent payments
    const { data: payments } = await supabase
        .from('payments')
        .select('id, amount, created_at, member:members(first_name, last_name)')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(5)

    // Combine and sort
    const activities = [
        ...(members?.map(m => ({
            type: 'member',
            id: m.id,
            date: new Date(m.created_at),
            text: `Nytt medlem: ${m.first_name} ${m.last_name}`,
            icon: UserPlus
        })) || []),
        ...(payments?.map(p => {
            const member = Array.isArray(p.member) ? p.member[0] : p.member
            return {
                type: 'payment',
                id: p.id,
                date: new Date(p.created_at),
                text: `Betaling mottatt: ${p.amount} kr fra ${member?.first_name || 'Ukjent'} ${member?.last_name || ''}`,
                icon: CreditCard
            }
        }) || [])
    ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10)

    return (
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Siste hendelser
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {activities.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Ingen nylig aktivitet.</p>
                    ) : (
                        activities.map((activity, i) => (
                            <div key={`${activity.type}-${activity.id}`} className="flex items-center gap-4">
                                <div className={`p-2 rounded-full ${activity.type === 'member' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                    <activity.icon className="h-4 w-4" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        {activity.text}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(activity.date, { addSuffix: true, locale: nb })}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

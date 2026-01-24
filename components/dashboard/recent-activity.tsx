import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, UserPlus, CreditCard, FileText, ShieldAlert } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { nb } from 'date-fns/locale'

export async function RecentActivity({ orgSlug, orgId }: { orgSlug: string, orgId: string }) {
    const supabase = await createClient()

    // 1. Fetch recent members
    const { data: members } = await supabase
        .from('members')
        .select('id, first_name, last_name, created_at')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(5)

    // 2. Fetch recent payments (Fix: table name payment_transactions)
    const { data: payments } = await supabase
        .from('payment_transactions')
        .select('id, amount, created_at, member:members(first_name, last_name)')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(5)

    // 3. Fetch Audit Log
    const { data: audits } = await supabase
        .from('audit_log')
        .select('id, action, resource_type, description, user_email, created_at')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(10)

    // Combine and sort
    const activities = [
        ...(members?.map(m => ({
            type: 'member',
            id: m.id,
            date: new Date(m.created_at),
            text: `Nytt medlem: ${m.first_name} ${m.last_name}`,
            subtext: 'Registrert',
            icon: UserPlus,
            color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
        })) || []),
        ...(payments?.map(p => {
            const member = Array.isArray(p.member) ? p.member[0] : p.member
            return {
                type: 'payment',
                id: p.id,
                date: new Date(p.created_at),
                text: `Betaling: ${p.amount},- kr`,
                subtext: `Fra ${member?.first_name || 'Ukjent'} ${member?.last_name || ''}`,
                icon: CreditCard,
                color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
            }
        }) || []),
        ...(audits?.map(a => ({
            type: 'audit',
            id: a.id,
            date: new Date(a.created_at),
            text: a.description || `${a.action} ${a.resource_type}`,
            subtext: a.user_email || 'System',
            icon: FileText,
            color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
        })) || [])
    ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10)

    return (
        <Card className="col-span-1 lg:col-span-3">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Siste hendelser
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {activities.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">
                            <p>Ingen nylig aktivitet registrert.</p>
                        </div>
                    ) : (
                        activities.map((activity, i) => (
                            <div key={`${activity.type}-${activity.id}`} className="flex items-start gap-4 pb-4 border-b border-gray-100 dark:border-gray-800 last:border-0 last:pb-0">
                                <div className={`p-2 rounded-full shrink-0 ${activity.color}`}>
                                    <activity.icon className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {activity.text}
                                    </p>
                                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        <span className="truncate pr-2">{activity.subtext}</span>
                                        <span className="shrink-0">
                                            {formatDistanceToNow(activity.date, { addSuffix: true, locale: nb })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

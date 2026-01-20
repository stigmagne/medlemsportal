import { createClient } from '@/lib/supabase/server'
import SubscriptionPlanList from '@/components/superadmin/SubscriptionPlanList'
import Link from 'next/link'

export default async function SubscriptionPlansPage() {
    const supabase = await createClient()
    const { data: plans } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true })

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <Link
                        href="/superadmin/settings"
                        className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-2 inline-block"
                    >
                        ← Tilbake til innstillinger
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Abonnementstyper
                    </h1>
                </div>
            </div>

            <SubscriptionPlanList initialPlans={plans || []} />
        </div>
    )
}


import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle2, Shield, Users, Calendar, FileText, CreditCard } from 'lucide-react'

export default async function Home() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Determine destination based on user role
    let dashboardUrl = '/login'
    if (user) {
        // Check if user is superadmin (global, not tied to any org)
        const { data: superadminAccess } = await supabase
            .from('user_org_access')
            .select('role')
            .eq('user_id', user.id)
            .eq('role', 'superadmin')
            .is('organization_id', null)
            .maybeSingle()

        if (superadminAccess) {
            // Superadmin users go directly to superadmin dashboard
            dashboardUrl = '/superadmin'
        } else {
            // Regular users: check if they have org access
            const { data: orgAccess } = await supabase
                .from('user_org_access')
                .select('organization_id, organizations(slug)')
                .eq('user_id', user.id)
                .not('organization_id', 'is', null)
                .limit(1)
                .maybeSingle()

            if (orgAccess?.organizations) {
                // User has org access → redirect to their primary organization
                // Supabase returns organizations as an object when using join syntax
                const org = orgAccess.organizations as unknown as { slug: string }
                dashboardUrl = `/org/${org.slug}`
            } else {
                // No org access → fallback to personal dashboard
                dashboardUrl = '/min-side'
            }
        }
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Navigation */}
            <header className="px-6 lg:px-8 h-16 flex items-center justify-between border-b bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="flex items-center gap-2 font-bold text-xl">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                        DF
                    </div>
                    <span>Din Forening</span>
                </div>
                <nav className="flex gap-4">
                    {user ? (
                        <Button asChild>
                            <Link href={dashboardUrl}>Gå til Min Side</Link>
                        </Button>
                    ) : (
                        <Button asChild variant="ghost">
                            <Link href="/login">Logg inn</Link>
                        </Button>
                    )}
                </nav>
            </header>

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative px-6 lg:px-8 py-24 lg:py-32 flex flex-col items-center text-center">
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.blue.100),white)] dark:bg-[radial-gradient(45rem_50rem_at_top,theme(colors.blue.900),theme(colors.slate.950))] opacity-50" />

                    <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm leading-6 text-slate-600 dark:text-slate-400 mb-8 bg-white/50 backdrop-blur">
                        <span className="flex items-center gap-1">
                            <span className="relative flex h-2 w-2 mr-1">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            Nyhet: Dokumentarkiv og Rapportering nå tilgjengelig!
                        </span>
                    </div>

                    <h1 className="text-4xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white max-w-4xl mb-6">
                        Alt foreningen din trenger <span className="text-blue-600">på ett sted</span>.
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mb-10 leading-relaxed">
                        Forenkle hverdagen for styret og medlemmene. Medlemsregister, dugnadslister, ressursbooking og dokumentarkiv i en moderne og trygg løsning.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                        <Button asChild size="lg" className="h-12 px-8 text-base">
                            <Link href={user ? dashboardUrl : "/signup"}>
                                Kom i gang gratis <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                        <Button asChild size="lg" variant="outline" className="h-12 px-8 text-base bg-white/50">
                            <Link href="/login">Logg inn for medlemmer</Link>
                        </Button>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="px-6 lg:px-8 py-20 bg-white dark:bg-slate-900">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold mb-4">Mindre administrasjon, mer aktivitet</h2>
                            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                                Vi har samlet verktøyene som vanligvis er spredt over Excel-ark, Facebook-grupper og e-poster.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            <FeatureCard
                                icon={<Users className="w-8 h-8 text-blue-500" />}
                                title="Medlemsregister"
                                description="Full oversikt over medlemmer, statuser og familietilknytninger. Automatisk fakturering av kontingent."
                            />
                            <FeatureCard
                                icon={<Calendar className="w-8 h-8 text-green-500" />}
                                title="Dugnad & Vaktlister"
                                description="Enkel påmelding til vakter. Medlemmer ser sine oppgaver direkte på Min Side."
                            />
                            <FeatureCard
                                icon={<CheckCircle2 className="w-8 h-8 text-purple-500" />}
                                title="Ressursbooking"
                                description="Booking av lokaler, utstyr og kjøretøy. Unngå dobbeltbookinger med automatisk sjekk."
                            />
                            <FeatureCard
                                icon={<FileText className="w-8 h-8 text-orange-500" />}
                                title="Dokumentarkiv"
                                description="Trygg lagring av styredokumenter, årsmøtepapirer og vedtekter. Styrt tilgangskontroll."
                            />
                            <FeatureCard
                                icon={<CreditCard className="w-8 h-8 text-pink-500" />}
                                title="Økonomi & Faktura"
                                description="Send faktura med KID (kommer), sikre betalinger via Stripe, og hold oversikt over innbetalinger."
                            />
                            <FeatureCard
                                icon={<Shield className="w-8 h-8 text-indigo-500" />}
                                title="GDPR & Personvern"
                                description="Innebygd personvern. Data lagres trygt i Europa med full kontroll på tilganger."
                            />
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-slate-50 dark:bg-slate-950 border-t py-12 px-6 text-center text-slate-500 dark:text-slate-400 text-sm">
                    <div className="flex justify-center gap-6 mb-4">
                        <Link href="/personvern" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                            Personvernerklæring
                        </Link>
                        <Link href="/databehandleravtale" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                            Databehandleravtale
                        </Link>
                    </div>
                    <p>© {new Date().getFullYear()} Din Forening. Bygget for norske ildsjeler.</p>
                </footer>
            </main>
        </div>
    )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800 border hover:shadow-lg transition-all">
            <div className="mb-4 bg-white dark:bg-slate-900 p-3 rounded-xl inline-block shadow-sm">
                {icon}
            </div>
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {description}
            </p>
        </div>
    )
}

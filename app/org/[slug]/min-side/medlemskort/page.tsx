import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { QRCode } from '@/components/qr-code'
import { Badge } from '@/components/ui/badge'

export default async function MedlemskortPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch member details for this organization
    const { data: organization } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('slug', slug)
        .single()

    if (!organization) {
        redirect('/')
    }

    const { data: member } = await supabase
        .from('members')
        .select('member_number, first_name, last_name, membership_status, membership_category')
        .eq('user_id', user.id)
        .eq('organization_id', organization.id)
        .single()

    if (!member) {
        return (
            <div className="container py-8 max-w-md mx-auto">
                <Card>
                    <CardContent className="pt-6 text-center">
                        <p>Vi fant ikke ditt medlemskap i denne foreningen.</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Generate a verification string (could be signed token in real app)
    const verificationData = `MEMBER:${member.member_number};ORG:${organization.id}`

    return (
        <div className="container py-8 max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-center">Ditt Medlemskort</h1>

            <Card className="border-2 border-primary/20 shadow-lg overflow-hidden">
                <div className="h-3 bg-primary w-full" />
                <CardHeader className="text-center pb-2">
                    <CardTitle className="text-xl">{organization.name}</CardTitle>
                    <p className="text-sm text-muted-foreground uppercase tracking-widest font-semibold">
                        Medlemsbevis
                    </p>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6 pt-4">
                    <div className="relative p-4 bg-white rounded-xl shadow-inner border border-gray-100">
                        <QRCode value={verificationData} size={180} />
                    </div>

                    <div className="text-center space-y-1">
                        <h2 className="text-2xl font-bold">{member.first_name} {member.last_name}</h2>
                        <p className="font-mono text-muted-foreground">#{member.member_number}</p>
                    </div>

                    <div className="flex gap-2">
                        <Badge variant={member.membership_status === 'active' ? 'default' : 'secondary'} className="text-base px-4 py-1">
                            {member.membership_status === 'active' ? 'Aktiv' : 'Inaktiv'}
                        </Badge>
                        {member.membership_category && (
                            <Badge variant="outline" className="text-base px-4 py-1">
                                {member.membership_category}
                            </Badge>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="bg-muted/50 text-center py-4 flex flex-col gap-1">
                    <p className="text-xs text-muted-foreground">Gyldig ved fremvisning sammen med legitimasjon.</p>
                </CardFooter>
            </Card>
        </div>
    )
}

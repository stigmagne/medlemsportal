'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createBoardPosition, updateBoardPosition } from "@/app/org/[slug]/innstillinger/styre/actions"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Upload, FileText } from "lucide-react"

export function BoardMemberForm({
    orgSlug,
    members,
    initialData
}: {
    orgSlug: string
    members: any[]
    initialData?: any
}) {
    const [isPending, setIsPending] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [protocolUrl, setProtocolUrl] = useState(initialData?.election_protocol_url || '')
    const router = useRouter()
    const supabase = createClient()

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return

        const file = e.target.files[0]
        setUploading(true)

        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${orgSlug}/${Date.now()}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('board_public')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data } = supabase.storage.from('board_public').getPublicUrl(filePath)
            setProtocolUrl(data.publicUrl)
        } catch (err: any) {
            console.error('Upload error:', err)
            setError('Feil ved opplasting av fil')
        } finally {
            setUploading(false)
        }
    }

    async function onSubmit(formData: FormData) {
        setError(null)
        setIsPending(true)

        // Ensure URL is in formData
        formData.set('election_protocol_url', protocolUrl)

        try {
            let result
            if (initialData) {
                result = await updateBoardPosition(orgSlug, initialData.id, null, formData)
            } else {
                result = await createBoardPosition(orgSlug, null, formData)
            }

            if (result?.error) {
                setError(result.error)
            } else {
                router.refresh() // Refresh server components
                router.push(`/org/${orgSlug}/innstillinger/styre`)
            }
        } catch (e) {
            setError('En uventet feil oppsto.')
        } finally {
            setIsPending(false)
        }
    }

    return (
        <form action={onSubmit} className="space-y-6 max-w-2xl border p-6 rounded-lg bg-card">
            {error && (
                <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm">
                    {error}
                </div>
            )}

            <div className="grid gap-2">
                <Label htmlFor="member_id">Medlem</Label>
                <Select name="member_id" defaultValue={initialData?.member_id} disabled={!!initialData}>
                    <SelectTrigger>
                        <SelectValue placeholder="Velg medlem" />
                    </SelectTrigger>
                    <SelectContent>
                        {members.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                                {m.first_name} {m.last_name} ({m.email})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {initialData && <input type="hidden" name="member_id" value={initialData.member_id} />}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="position_type">Rolle</Label>
                    <Select name="position_type" defaultValue={initialData?.position_type || 'medlem'}>
                        <SelectTrigger>
                            <SelectValue placeholder="Velg rolle" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="leder">Styreleder</SelectItem>
                            <SelectItem value="nestleder">Nestleder</SelectItem>
                            <SelectItem value="kasserer">Kasserer/Økonomi</SelectItem>
                            <SelectItem value="sekretar">Sekretær</SelectItem>
                            <SelectItem value="medlem">Styremedlem</SelectItem>
                            <SelectItem value="varamedlem">Varamedlem</SelectItem>
                            <SelectItem value="revisor">Revisor</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="position_title">Tittel (valgfritt)</Label>
                    <Input id="position_title" name="position_title" placeholder="f.eks. Økonomiansvarlig" defaultValue={initialData?.position_title} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="elected_date">Valgt dato</Label>
                    <Input type="date" id="elected_date" name="elected_date" required defaultValue={initialData?.elected_date} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="term_years">Periode lengde (år)</Label>
                    <Input type="number" id="term_years" name="term_years" defaultValue={initialData?.term_years || 2} min={1} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="term_start_date">Startdato</Label>
                    <Input type="date" id="term_start_date" name="term_start_date" required defaultValue={initialData?.term_start_date} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="term_end_date">Sluttdato (valgfritt)</Label>
                    <Input type="date" id="term_end_date" name="term_end_date" defaultValue={initialData?.term_end_date} />
                    <p className="text-[0.8rem] text-muted-foreground">La stå tom for ubestemt tid</p>
                </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-medium">Dokumentasjon</h3>
                <div className="grid gap-2">
                    <Label htmlFor="election_protocol_url">Generalforsamlingsprotokoll</Label>
                    <div className="flex gap-2">
                        <Input
                            id="election_protocol_url"
                            name="election_protocol_url"
                            placeholder="https://..."
                            value={protocolUrl}
                            onChange={(e) => setProtocolUrl(e.target.value)}
                        />
                    </div>

                    <div className="relative">
                        <input
                            type="file"
                            id="protocol-upload"
                            className="hidden"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileUpload}
                            disabled={uploading}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            disabled={uploading}
                            className="w-full"
                            onClick={() => document.getElementById('protocol-upload')?.click()}
                        >
                            {uploading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Upload className="mr-2 h-4 w-4" />
                            )}
                            Last opp protokoll (PDF)
                        </Button>
                    </div>
                    {protocolUrl && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <FileText className="h-3 w-3" />
                            <a href={protocolUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                Åpne nåværende protokoll
                            </a>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-medium">Offentlig kontaktinfo (valgfritt)</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="public_email">Styre-epost</Label>
                        <Input type="email" id="public_email" name="public_email" placeholder="leder@forening.no" defaultValue={initialData?.public_email} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="public_phone">Styre-telefon</Label>
                        <Input type="tel" id="public_phone" name="public_phone" defaultValue={initialData?.public_phone} />
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="bio">Bio / Presentasjon</Label>
                    <Textarea id="bio" name="bio" placeholder="Kort presentasjon..." defaultValue={initialData?.bio} />
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
                    Avbryt
                </Button>
                <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {initialData ? 'Lagre endringer' : 'Opprett styreverv'}
                </Button>
            </div>
        </form>
    )
}

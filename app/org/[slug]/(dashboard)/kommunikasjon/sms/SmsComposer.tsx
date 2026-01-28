'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Send, Users } from "lucide-react"
import { sendSms } from "@/app/actions/sms"

interface MemberGroup {
    id: string
    label: string
    count: number
}

interface SmsComposerProps {
    orgSlug: string
    groups: MemberGroup[]
    totalMembers: number
}

// Mock pricing
const PRICE_PER_SEGMENT = 0.59 // NOK

export default function SmsComposer({ orgSlug, groups, totalMembers }: SmsComposerProps) {
    const [selectedGroup, setSelectedGroup] = useState<string>("all")
    const [message, setMessage] = useState("")
    const [isPending, startTransition] = useTransition()
    const { toast } = useToast()

    const recipientCount = selectedGroup === "all"
        ? totalMembers
        : groups.find(g => g.id === selectedGroup)?.count || 0

    // SMS logic: 1 segment = 160 chars (GSM 7-bit). Approx calc.
    const segments = Math.ceil(Math.max(message.length, 1) / 160)
    const totalCost = (recipientCount * segments * PRICE_PER_SEGMENT).toFixed(2)

    const handleSend = () => {
        if (!message.trim()) return

        startTransition(async () => {
            const result = await sendSms(orgSlug, message, selectedGroup)

            if (result.success) {
                toast({
                    title: "SMS sendt (Mock)",
                    description: `Meldingen ble "sendt" til ${recipientCount} mottakere.`,
                })
                setMessage("")
            } else {
                toast({
                    title: "Feil ved sending",
                    description: result.error,
                    variant: "destructive"
                })
            }
        })
    }

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Ny SMS</CardTitle>
                    <CardDescription>Send melding til medlemmer</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Mottakere</Label>
                        <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Alle medlemmer ({totalMembers})</SelectItem>
                                {groups.map(group => (
                                    <SelectItem key={group.id} value={group.id}>
                                        {group.label} ({group.count})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Melding</Label>
                        <Textarea
                            placeholder="Skriv din melding her..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={6}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{message.length} tegn ({segments} SMS)</span>
                            <span>GSM 7-bit (Standard)</span>
                        </div>
                    </div>

                    <Button
                        className="w-full"
                        onClick={handleSend}
                        disabled={isPending || recipientCount === 0 || !message.trim()}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sender...
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 h-4 w-4" />
                                Send SMS
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Sammendrag</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                            <Users className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="font-medium">Antall mottakere</p>
                                <p className="text-sm text-muted-foreground">Basert på valgt gruppe</p>
                            </div>
                        </div>
                        <span className="text-xl font-bold">{recipientCount}</span>
                    </div>

                    <div className="space-y-2 pt-4 border-t">
                        <div className="flex justify-between text-sm">
                            <span>Pris per SMS (160 tegn)</span>
                            <span>{PRICE_PER_SEGMENT} kr</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Antall segmenter</span>
                            <span>x {segments}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg pt-2">
                            <span>Estimert totalpris</span>
                            <span>{totalCost} kr</span>
                        </div>
                        <p className="text-xs text-muted-foreground pt-2">
                            * Dette er en simulering. Ingen faktiske kostnader påløper i Mock-modus.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

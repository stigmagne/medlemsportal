'use client'

import { useState } from 'react'
import { submitExpenses } from '@/app/actions/expenses'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info, Plus, Trash2, Car, Plane, Bus, CreditCard, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface ExpenseItem {
    id: string; // temp id
    description: string;
    event_id: string;
    travel_date: string;
    transport_type: 'car' | 'public' | 'flight' | 'other';
    start_location: string;
    end_location: string;
    distance_km: number;
    toll_parking_cost: number;
    ticket_cost: number;
    receipt_url: string;
}

export default function SubmitExpenseForm({ slug, orgId, events }: { slug: string, orgId: string, events: any[] }) {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState('')

    // State for the list of items
    const [items, setItems] = useState<ExpenseItem[]>([])

    // State for the current item being added
    const [currentItem, setCurrentItem] = useState({
        description: '',
        event_id: '',
        travel_date: new Date().toISOString().split('T')[0],
        transport_type: 'car' as 'car' | 'public' | 'flight' | 'other',
        start_location: '',
        end_location: '',
        distance_km: 0,
        toll_parking_cost: 0,
        ticket_cost: 0,
        receipt_url: ''
    })

    // Bank account is global for the submission
    const [bankAccount, setBankAccount] = useState('')

    const KM_RATE = 3.50

    const calculateItemTotal = (item: typeof currentItem) => {
        let total = 0
        if (item.transport_type === 'car') {
            total += (item.distance_km || 0) * KM_RATE
            total += Number(item.toll_parking_cost || 0)
        }
        // Ticket cost applies to everything (parking might be separate but keeps simplicity)
        // Adjusting logic: Toll/Parking is only for car now, so only add if car.
        // Wait, user asked visibility only for car.

        total += Number(item.ticket_cost || 0)
        return total
    }

    const calculateGrandTotal = () => {
        return items.reduce((sum, item) => sum + calculateItemTotal(item), 0)
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return

        const file = e.target.files[0]
        setUploading(true)

        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `${orgId}/${fileName}`

        try {
            const { error: uploadError } = await supabase.storage
                .from('receipts')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            // Get public URL (or just path if we want signed URLs later, but public is easier for MVP)
            const { data } = supabase.storage.from('receipts').getPublicUrl(filePath)

            setCurrentItem(prev => ({ ...prev, receipt_url: data.publicUrl }))
        } catch (err) {
            console.error('Upload failed', err)
            alert('Feil ved opplasting av vedlegg')
        } finally {
            setUploading(false)
        }
    }

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault()

        // Basic validation
        if (!currentItem.description) return

        const newItem: ExpenseItem = {
            ...currentItem,
            id: crypto.randomUUID(),
            distance_km: Number(currentItem.distance_km),
            toll_parking_cost: currentItem.transport_type === 'car' ? Number(currentItem.toll_parking_cost) : 0,
            ticket_cost: Number(currentItem.ticket_cost)
        }

        setItems([newItem, ...items]) // Add to top

        // Reset current item form
        setCurrentItem(prev => ({
            ...prev,
            description: '',
            transport_type: 'car',
            start_location: '',
            end_location: '',
            distance_km: 0,
            toll_parking_cost: 0,
            ticket_cost: 0,
            receipt_url: ''
        }))
    }

    const removeItem = (id: string) => {
        setItems(items.filter(i => i.id !== id))
    }

    const handleSubmitAll = async () => {
        if (items.length === 0) {
            setError('Du må legge til minst ett utlegg.')
            return
        }
        if (!bankAccount) {
            setError('Du må fylle inn kontonummer.')
            return
        }

        setLoading(true)
        setError('')

        // Format items for server action
        const payload = items.map(item => ({
            org_id: orgId,
            event_id: item.event_id,
            description: item.description,
            travel_date: item.travel_date,
            transport_type: item.transport_type,
            start_location: item.start_location,
            end_location: item.end_location,
            distance_km: item.distance_km,
            toll_parking_cost: item.toll_parking_cost,
            ticket_cost: item.ticket_cost,
            receipt_url: item.receipt_url,
            bank_account: bankAccount
        }))

        const res = await submitExpenses(payload)

        if (res.error) {
            setError(res.error)
            setLoading(false)
        } else {
            router.push(`/org/${slug}/min-side/utlegg`)
        }
    }

    const renderTransportIcon = (type: string) => {
        switch (type) {
            case 'car': return <Car className="h-4 w-4" />
            case 'flight': return <Plane className="h-4 w-4" />
            case 'public': return <Bus className="h-4 w-4" />
            default: return <CreditCard className="h-4 w-4" />
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Form to add new item */}
                <div className="lg:col-span-2">
                    <Card className="border-blue-200 shadow-md">
                        <CardHeader className="bg-blue-50/50 pb-4">
                            <CardTitle className="text-lg text-blue-900 flex items-center gap-2">
                                <Plus className="h-5 w-5" />
                                Registrer nytt utlegg
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <form onSubmit={handleAddItem} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Dato *</label>
                                        <input
                                            required
                                            type="date"
                                            className="w-full p-2 border rounded-md"
                                            value={currentItem.travel_date}
                                            onChange={e => setCurrentItem({ ...currentItem, travel_date: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Arrangement</label>
                                        <select
                                            className="w-full p-2 border rounded-md"
                                            value={currentItem.event_id}
                                            onChange={e => setCurrentItem({ ...currentItem, event_id: e.target.value })}
                                        >
                                            <option value="">-- Ingen valgt --</option>
                                            {events.map(ev => (
                                                <option key={ev.id} value={ev.id}>{ev.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Beskrivelse *</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="F.eks. Tog til..."
                                        className="w-full p-2 border rounded-md"
                                        value={currentItem.description}
                                        onChange={e => setCurrentItem({ ...currentItem, description: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Transporttype</label>
                                    <div className="flex gap-2">
                                        {[
                                            { id: 'car', label: 'Egen bil', icon: Car },
                                            { id: 'public', label: 'Kollektiv', icon: Bus },
                                            { id: 'flight', label: 'Fly', icon: Plane },
                                            { id: 'other', label: 'Annet', icon: CreditCard },
                                        ].map(type => (
                                            <button
                                                key={type.id}
                                                type="button"
                                                onClick={() => setCurrentItem({ ...currentItem, transport_type: type.id as any })}
                                                className={`flex-1 flex flex-col items-center justify-center p-3 rounded-md border text-xs font-medium transition-colors ${currentItem.transport_type === type.id
                                                        ? 'bg-blue-600 text-white border-blue-600'
                                                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <type.icon className="h-5 w-5 mb-1" />
                                                {type.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {currentItem.transport_type === 'car' && (
                                    <div className="bg-gray-50 p-3 rounded-md border border-gray-200 space-y-3">
                                        <div className="flex gap-2">
                                            <input
                                                placeholder="Fra"
                                                className="flex-1 p-2 border rounded-md text-sm"
                                                value={currentItem.start_location}
                                                onChange={e => setCurrentItem({ ...currentItem, start_location: e.target.value })}
                                            />
                                            <input
                                                placeholder="Til"
                                                className="flex-1 p-2 border rounded-md text-sm"
                                                value={currentItem.end_location}
                                                onChange={e => setCurrentItem({ ...currentItem, end_location: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1">
                                                <label className="text-xs font-medium text-gray-500">Antall km</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="w-full p-2 border rounded-md"
                                                    value={currentItem.distance_km}
                                                    onChange={e => setCurrentItem({ ...currentItem, distance_km: Number(e.target.value) })}
                                                />
                                            </div>
                                            <div className="text-sm text-gray-500 pt-4">
                                                x {KM_RATE} kr = <span className="font-semibold text-gray-900">{(currentItem.distance_km * KM_RATE).toFixed(0)} kr</span>
                                            </div>
                                        </div>

                                        <div className="pt-2 border-t border-gray-200 mt-2">
                                            <label className="text-sm font-medium">Bompenger/Parkering</label>
                                            <div className="relative mt-1">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="w-full p-2 border rounded-md pl-8"
                                                    value={currentItem.toll_parking_cost}
                                                    onChange={e => setCurrentItem({ ...currentItem, toll_parking_cost: Number(e.target.value) })}
                                                />
                                                <span className="absolute left-3 top-2 text-gray-500">kr</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="text-sm font-medium">
                                        {currentItem.transport_type === 'car'
                                            ? 'Andre utlegg (ferge o.l.)'
                                            : 'Billettkostnad / Utlegg'}
                                    </label>
                                    <div className="relative mt-1">
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-full p-2 border rounded-md pl-8"
                                            value={currentItem.ticket_cost}
                                            onChange={e => setCurrentItem({ ...currentItem, ticket_cost: Number(e.target.value) })}
                                        />
                                        <span className="absolute left-3 top-2 text-gray-500">kr</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-1 block">Kvittering (Bilde/PDF)</label>
                                    <div className="flex items-center gap-2">
                                        <label className="flex-1 cursor-pointer border border-gray-300 rounded-md p-2 hover:bg-gray-50 flex items-center gap-2 justify-center text-sm text-gray-600">
                                            <Upload className="h-4 w-4" />
                                            {uploading ? 'Laster opp...' : 'Last opp fil'}
                                            <input
                                                type="file"
                                                accept="image/*,application/pdf"
                                                className="hidden"
                                                onChange={handleFileUpload}
                                                disabled={uploading}
                                            />
                                        </label>
                                        {currentItem.receipt_url && (
                                            <div className="text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded">
                                                Vedlagt ✅
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    Legg til i listen (Gjør klar neste)
                                </button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: List of items + Submit */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Oversikt over utlegg</CardTitle>
                            <CardDescription>
                                {items.length} utlegg lagt til
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {items.length === 0 ? (
                                <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-lg">
                                    Legg til utlegg i skjemaet
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {items.map((item, idx) => (
                                        <div key={item.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-md group">
                                            <div className="flex items-start gap-3">
                                                <div className="mt-1 text-gray-500">
                                                    {renderTransportIcon(item.transport_type)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{item.description}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {item.travel_date}
                                                        {item.distance_km > 0 && ` • ${item.distance_km} km`}
                                                    </p>
                                                    {item.receipt_url && (
                                                        <a href={item.receipt_url} target="_blank" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1">
                                                            📄 Kvittering
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold">{calculateItemTotal(item).toFixed(0)} kr</p>
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {items.length > 0 && (
                                <div className="pt-4 border-t">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="font-semibold">Totalt å utbetale</span>
                                        <span className="text-xl font-bold text-blue-600">{calculateGrandTotal().toFixed(2)} kr</span>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <label className="text-sm font-medium">Kontonummer</label>
                                        <input
                                            type="text"
                                            placeholder="1234.56.78910"
                                            className="w-full p-2 border rounded-md"
                                            value={bankAccount}
                                            onChange={e => setBankAccount(e.target.value)}
                                        />
                                    </div>

                                    <button
                                        onClick={handleSubmitAll}
                                        disabled={loading}
                                        className="w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 font-bold shadow-sm disabled:opacity-50"
                                    >
                                        {loading ? 'Sender inn...' : `Send inn ${items.length} utlegg`}
                                    </button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Alert className="bg-blue-50 border-blue-100 text-blue-800">
                        <Info className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                            Ved å sende inn bekrefter du at utleggene er reelle og i henhold til foreningens retningslinjer.
                        </AlertDescription>
                    </Alert>
                </div>
            </div>
        </div>
    )
}

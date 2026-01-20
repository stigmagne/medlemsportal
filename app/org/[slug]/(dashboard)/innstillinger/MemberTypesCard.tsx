'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react'
import { createMemberType, deleteMemberType, updateMemberType, MemberType } from '@/app/actions/member-types'
import { useToast } from '@/components/ui/use-toast'

interface MemberTypesCardProps {
    orgId: string
    slug: string
    initialTypes: MemberType[]
}

export default function MemberTypesCard({ orgId, slug, initialTypes }: MemberTypesCardProps) {
    const [types, setTypes] = useState<MemberType[]>(initialTypes)
    const [isAdding, setIsAdding] = useState(false)

    // Add State
    const [newName, setNewName] = useState('')
    const [newFee, setNewFee] = useState('')

    // Edit State
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editName, setEditName] = useState('')
    const [editFee, setEditFee] = useState('')

    const { toast } = useToast()

    async function handleAdd() {
        if (!newName || !newFee) return

        const fee = parseFloat(newFee)
        if (isNaN(fee)) {
            toast({
                title: 'Ugyldig beløp',
                description: 'Vennligst skriv inn et gyldig tall.',
                variant: 'destructive',
            })
            return
        }

        const result = await createMemberType(orgId, newName, fee, '', slug)

        if (result.error) {
            toast({
                title: 'Feil',
                description: result.error,
                variant: 'destructive',
            })
        } else {
            toast({
                title: 'Opprettet',
                description: `Medlemstype "${newName}" lagt til.`,
            })
            setIsAdding(false)
            setNewName('')
            setNewFee('')
            window.location.reload()
        }
    }

    async function handleUpdate(id: string) {
        if (!editName || !editFee) return

        const fee = parseFloat(editFee)
        if (isNaN(fee)) {
            toast({
                title: 'Ugyldig beløp',
                description: 'Vennligst skriv inn et gyldig tall.',
                variant: 'destructive',
            })
            return
        }

        const result = await updateMemberType(id, editName, fee, slug)

        if (result.error) {
            toast({
                title: 'Feil',
                description: result.error,
                variant: 'destructive',
            })
        } else {
            toast({
                title: 'Oppdatert',
                description: 'Medlemstype oppdatert.',
            })
            setEditingId(null)
            // Update local state by mapping over types
            setTypes(types.map(t => t.id === id ? { ...t, name: editName, fee } : t))
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Er du sikker på at du vil slette denne typen?')) return

        const result = await deleteMemberType(id, slug)
        if (result.error) {
            toast({
                title: 'Feil',
                description: result.error,
                variant: 'destructive',
            })
        } else {
            toast({
                title: 'Slettet',
                description: 'Medlemstype slettet.',
            })
            setTypes(types.filter(t => t.id !== id))
        }
    }

    function startEditing(type: MemberType) {
        setEditingId(type.id)
        setEditName(type.name)
        setEditFee(type.fee.toString())
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Medlemstyper & Kontingent</CardTitle>
                    <CardDescription>
                        Administrer ulike medlemskap og priser.
                    </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setIsAdding(!isAdding)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Legg til
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Add Form */}
                    {isAdding && (
                        <div className="flex gap-2 items-end bg-gray-50 p-3 rounded-md animate-in fade-in slide-in-from-top-2">
                            <div className="flex-1">
                                <label className="text-xs font-medium text-gray-500">Navn (f.eks. Senior)</label>
                                <Input
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    placeholder="Type navn"
                                    autoFocus
                                />
                            </div>
                            <div className="w-32">
                                <label className="text-xs font-medium text-gray-500">Pris/år</label>
                                <Input
                                    type="number"
                                    value={newFee}
                                    onChange={e => setNewFee(e.target.value)}
                                    placeholder="Kr"
                                />
                            </div>
                            <Button onClick={handleAdd}>Lagre</Button>
                        </div>
                    )}

                    {/* List */}
                    {types.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            <p className="text-sm text-gray-500 mb-2">Ingen medlemstyper er definert ennå.</p>
                            <p className="text-xs text-gray-400">Legg til "Ordinært medlem" for å komme i gang.</p>
                            <Button variant="link" onClick={() => setIsAdding(true)} className="mt-2 text-blue-600">
                                + Opprett første type
                            </Button>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {types.map(type => (
                                <div key={type.id} className="py-3">
                                    {editingId === type.id ? (
                                        <div className="flex gap-2 items-center animate-in fade-in">
                                            <Input
                                                value={editName}
                                                onChange={e => setEditName(e.target.value)}
                                                className="flex-1 h-8"
                                            />
                                            <div className="flex items-center gap-1 w-32">
                                                <Input
                                                    type="number"
                                                    value={editFee}
                                                    onChange={e => setEditFee(e.target.value)}
                                                    className="h-8"
                                                />
                                                <span className="text-sm text-gray-500">kr</span>
                                            </div>
                                            <Button size="icon" variant="ghost" onClick={() => handleUpdate(type.id)} className="h-8 w-8 text-green-600">
                                                <Save className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" onClick={() => setEditingId(null)} className="h-8 w-8 text-gray-500">
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">{type.name}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm font-medium bg-green-50 text-green-700 px-2 py-1 rounded">
                                                    {Number(type.fee).toFixed(0)} kr
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => startEditing(type)}
                                                        className="h-8 w-8 text-gray-400 hover:text-blue-600"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => handleDelete(type.id)}
                                                        className="h-8 w-8 text-gray-400 hover:text-red-600"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

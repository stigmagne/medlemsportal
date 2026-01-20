"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { signupForRole, cancelAssignment } from "../actions"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Check, X } from "lucide-react"

interface SignupButtonProps {
    roleId: string
    assignmentId?: string
    isFull: boolean
    isSignedUp: boolean
    orgSlug: string
}

export default function SignupButton({
    roleId,
    assignmentId,
    isFull,
    isSignedUp,
    orgSlug
}: SignupButtonProps) {
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()

    async function handleSignup() {
        setIsLoading(true)
        try {
            const result = await signupForRole(roleId, orgSlug)
            if (result.error) {
                toast({
                    title: "Feil ved påmelding",
                    description: result.error,
                    variant: "destructive"
                })
            } else {
                toast({
                    title: "Påmeldt!",
                    description: "Du er nå meldt på vakten.",
                })
            }
        } catch (error) {
            toast({
                title: "Ukjent feil",
                description: "Noe gikk galt.",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    async function handleCancel() {
        if (!assignmentId) return

        if (!confirm("Er du sikker på at du vil melde deg av?")) return

        setIsLoading(true)
        try {
            const result = await cancelAssignment(assignmentId, orgSlug)
            if (result.error) {
                toast({
                    title: "Feil ved avmelding",
                    description: result.error,
                    variant: "destructive"
                })
            } else {
                toast({
                    title: "Avmeldt",
                    description: "Du er nå meldt av vakten.",
                })
            }
        } catch (error) {
            toast({
                title: "Ukjent feil",
                description: "Noe gikk galt.",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    if (isSignedUp) {
        return (
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-green-600 flex items-center">
                    <Check className="mr-1 h-4 w-4" />
                    Påmeldt
                </span>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Meld av"}
                </Button>
            </div>
        )
    }

    if (isFull) {
        return (
            <Button disabled variant="outline" size="sm">
                Fulltegnet
            </Button>
        )
    }

    return (
        <Button
            onClick={handleSignup}
            disabled={isLoading}
            size="sm"
        >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Meld på
        </Button>
    )
}

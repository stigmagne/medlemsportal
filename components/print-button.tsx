'use client'

import React from 'react'
import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PrintButton() {
    return (
        <div className="text-center text-gray-500 text-sm print:hidden mt-8">
            <Button
                onClick={() => window.print()}
                className="gap-2"
            >
                <Printer className="h-4 w-4" />
                Skriv ut / Lagre som PDF
            </Button>
        </div>
    )
}

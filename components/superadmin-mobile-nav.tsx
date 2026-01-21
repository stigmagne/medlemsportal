'use client'

import React, { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { SuperadminSidebarNav } from '@/components/superadmin-nav'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function SuperadminMobileNav() {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="md:hidden">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(true)}
                aria-label="Åpne meny"
            >
                <Menu className="h-6 w-6" />
            </Button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Drawer */}
                    <div className="relative flex w-3/4 max-w-xs flex-col bg-background p-6 shadow-xl transition-transform duration-300 ease-in-out animate-in slide-in-from-left">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-lg font-semibold text-foreground">Meny</h2>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsOpen(false)}
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        <div onClick={() => setIsOpen(false)}>
                            <SuperadminSidebarNav />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

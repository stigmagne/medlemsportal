'use client'

import * as React from "react"
import { Moon, Sun, Palette, Accessibility } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from "@/components/ui/dropdown-menu"

export function ThemeSwitcher() {
    const { setTheme, theme } = useTheme()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="bg-background">
                    <Palette className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
                    <span className="sr-only">Velg tema</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Velg design</DropdownMenuLabel>

                <DropdownMenuItem onClick={() => setTheme("light")} className={theme === 'light' ? 'bg-accent' : ''}>
                    <Sun className="mr-2 h-4 w-4" />
                    Standard (Lys)
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => setTheme("dark")} className={theme === 'dark' ? 'bg-accent' : ''}>
                    <Moon className="mr-2 h-4 w-4" />
                    Mørk Modus
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => setTheme("ocean")} className={theme === 'ocean' ? 'bg-accent' : ''}>
                    <div className="mr-2 h-4 w-4 rounded-full bg-blue-500" />
                    Ocean
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => setTheme("sunset")} className={theme === 'sunset' ? 'bg-accent' : ''}>
                    <div className="mr-2 h-4 w-4 rounded-full bg-orange-500" />
                    Sunset
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => setTheme("forest")} className={theme === 'forest' ? 'bg-accent' : ''}>
                    <div className="mr-2 h-4 w-4 rounded-full bg-green-700" />
                    Forest
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => setTheme("accessibility")} className={theme === 'accessibility' ? 'bg-accent' : ''}>
                    <Accessibility className="mr-2 h-4 w-4" />
                    Tilgjengelighet
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

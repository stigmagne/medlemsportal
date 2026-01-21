"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"
import { Fragment } from "react"
import { cn } from "@/lib/utils"

interface BreadcrumbsProps {
    className?: string
}

const pathMapping: Record<string, string> = {
    "org": "Organisasjon",
    "dashboard": "Oversikt",
    "medlemmer": "Medlemmer",
    "betalinger": "Betalinger",
    "arrangmenter": "Arrangementer",
    "faktura": "Faktura",
    "saker": "Saker",
    "dokumenter": "Dokumenter",
    "innstillinger": "Innstillinger",
    "kommunikasjon": "Kommunikasjon",
    "moter": "Møter",
    "vedtak": "Vedtak",
    "utlegg": "Mine utlegg"
}

export function Breadcrumbs({ className }: BreadcrumbsProps) {
    const pathname = usePathname()

    // Split path and filter empty strings
    const paths = pathname.split('/').filter(Boolean)

    // We usually want to skip the first parts if they are /org/[slug]/(dashboard)
    // The path is usually /org/slug/dashboard/... or /org/slug/...
    // Let's find where the meaningful part starts.
    // If it starts with 'org', the next is slug.

    const startIndex = paths[0] === 'org' ? 2 : 0
    const meaningfulPaths = paths.slice(startIndex)

    if (meaningfulPaths.length === 0) return null

    return (
        <nav aria-label="Breadcrumb" className={cn("flex items-center text-sm text-muted-foreground mb-4", className)}>
            <Link
                href={paths.slice(0, startIndex + 1).join('/') ? `/${paths.slice(0, startIndex + 1).join('/')}` : '/'}
                className="hover:text-foreground transition-colors"
            >
                <Home className="w-4 h-4" />
            </Link>

            {meaningfulPaths.map((segment, index) => {
                const label = pathMapping[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
                const isLast = index === meaningfulPaths.length - 1
                const href = `/${paths.slice(0, startIndex + index + 1).join('/')}`

                // Skip (dashboard) layout segment from visual breadcrumbs if it leaks into URL (it shouldn't usually, but safe to check)
                if (segment.startsWith('(')) return null

                return (
                    <Fragment key={href}>
                        <ChevronRight className="w-4 h-4 mx-2 text-muted-foreground/50" />
                        {isLast ? (
                            <span className="font-medium text-foreground">{label}</span>
                        ) : (
                            <Link href={href} className="hover:text-foreground transition-colors">
                                {label}
                            </Link>
                        )}
                    </Fragment>
                )
            })}
        </nav>
    )
}

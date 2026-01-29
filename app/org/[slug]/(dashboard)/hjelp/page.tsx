'use client'

import { useState } from 'react'
import {
    ChevronDown,
    ChevronRight,
    Users,
    CreditCard,
    Mail,
    Calendar,
    Settings,
    FileText,
    Building2,
    HelpCircle,
    BookOpen,
    ClipboardList,
    MessageSquare,
    Receipt,
    FolderOpen,
    Vote
} from 'lucide-react'

type Section = {
    id: string
    title: string
    icon: React.ReactNode
    description: string
    items: {
        question: string
        answer: string
    }[]
}

const helpSections: Section[] = [
    {
        id: 'getting-started',
        title: 'Kom i gang',
        icon: <BookOpen className="w-5 h-5" />,
        description: 'Grunnleggende oppsett og første steg',
        items: [
            {
                question: 'Hvordan setter jeg opp organisasjonen min?',
                answer: 'Gå til Innstillinger > Generelt for å fylle ut organisasjonsinformasjon som navn, adresse, kontaktinfo og organisasjonsnummer. Dette er viktig for fakturaer og offisiell kommunikasjon.'
            },
            {
                question: 'Hvordan inviterer jeg andre administratorer?',
                answer: 'Under Innstillinger > Styre kan du legge til styremedlemmer. Disse får automatisk tilgang til admin-panelet basert på rollen de får tildelt.'
            },
            {
                question: 'Hva er forskjellen på admin og medlem?',
                answer: 'Administratorer har tilgang til dashboardet og kan administrere medlemmer, sende e-post, håndtere betalinger osv. Medlemmer har kun tilgang til "Min side" hvor de kan se sin egen profil, betale kontingent og melde seg på arrangementer.'
            }
        ]
    },
    {
        id: 'members',
        title: 'Medlemshåndtering',
        icon: <Users className="w-5 h-5" />,
        description: 'Legg til, importer og administrer medlemmer',
        items: [
            {
                question: 'Hvordan legger jeg til et nytt medlem?',
                answer: 'Gå til Medlemmer og klikk "Legg til". Fyll ut nødvendig informasjon som navn, e-post, telefon og medlemskategori. Medlemmet får automatisk tildelt et medlemsnummer.'
            },
            {
                question: 'Kan jeg importere medlemmer fra Excel/CSV?',
                answer: 'Ja! Gå til Medlemmer > Importer. Last opp en CSV-fil og map kolonnene til riktige felter. Systemet vil vise en forhåndsvisning før import.'
            },
            {
                question: 'Hvordan eksporterer jeg medlemslisten?',
                answer: 'På medlemssiden finner du en "Eksporter" knapp som laster ned alle medlemmer som CSV-fil. Du kan også filtrere listen først for å kun eksportere bestemte medlemmer.'
            },
            {
                question: 'Hva betyr de ulike medlemsstatusene?',
                answer: 'Aktiv = Betalende medlem med gyldige rettigheter. Inaktiv = Tidligere medlem eller ikke betalt kontingent. Ventende = Nyregistrert som ikke har fullført registrering/betaling.'
            },
            {
                question: 'Hvordan bruker jeg utvidet visning?',
                answer: 'Klikk på "Utvidet" knappen over medlemslisten for å vise flere kolonner som telefon, adresse og fødselsdato. Denne visningen fungerer best på PC eller med mobilen i liggende modus.'
            }
        ]
    },
    {
        id: 'payments',
        title: 'Betalinger og kontingent',
        icon: <CreditCard className="w-5 h-5" />,
        description: 'Sett opp kontingent og håndter betalinger',
        items: [
            {
                question: 'Hvordan setter jeg opp medlemskontingent?',
                answer: 'Gå til Innstillinger > Betaling for å koble til Stripe. Deretter kan du under Kontingent > Innstillinger definere ulike medlemskategorier med forskjellige priser (f.eks. Voksen, Barn, Familie).'
            },
            {
                question: 'Hvordan fungerer Stripe-integrasjonen?',
                answer: 'Vi bruker Stripe Connect som betyr at betalinger går direkte til din organisasjons bankkonto. Du må verifisere organisasjonen i Stripe første gang. Gebyrer trekkes automatisk.'
            },
            {
                question: 'Kan medlemmer betale med faktura?',
                answer: 'Ja! Når du oppretter et medlem eller sender betalingskrav, kan du velge faktura som betalingsmetode. Fakturaen får automatisk et KID-nummer for enkel identifisering.'
            },
            {
                question: 'Hva er KID-nummer?',
                answer: 'KID (Kundeidentifikasjon) er en unik referanse på fakturaer som gjør det enkelt å matche innbetalinger med riktig medlem. Dette genereres automatisk for alle fakturaer.'
            },
            {
                question: 'Hvor ser jeg oversikt over betalinger?',
                answer: 'Under Betalinger ser du alle transaksjoner med status, beløp og hvem som har betalt. Du kan filtrere på kontingent vs arrangementer og se totaloversikt.'
            }
        ]
    },
    {
        id: 'communication',
        title: 'Kommunikasjon',
        icon: <Mail className="w-5 h-5" />,
        description: 'Send e-post og SMS til medlemmer',
        items: [
            {
                question: 'Hvordan sender jeg e-post til medlemmene?',
                answer: 'Gå til Kommunikasjon og klikk på "Ny e-post". Velg mottakere (alle, aktive, spesifikke grupper), skriv emne og innhold, og send. E-posten sendes fra systemet med din organisasjons navn.'
            },
            {
                question: 'Kan jeg sende SMS?',
                answer: 'Ja, under Kommunikasjon > SMS kan du sende tekstmeldinger til medlemmer. Merk at SMS koster per melding og krever at medlemmene har registrert mobilnummer.'
            },
            {
                question: 'Hvordan ser jeg om e-posten ble lest?',
                answer: 'I e-postoversikten ser du statistikk for hver kampanje: antall sendt, åpnet og klikket. Dette hjelper deg forstå engasjementet.'
            },
            {
                question: 'Kan medlemmer svare på e-postene?',
                answer: 'Svar-adressen settes til organisasjonens kontakt-e-post (fra Innstillinger). Så ja, medlemmer kan svare og det kommer til din innboks.'
            }
        ]
    },
    {
        id: 'events',
        title: 'Arrangementer',
        icon: <Calendar className="w-5 h-5" />,
        description: 'Opprett og administrer arrangementer',
        items: [
            {
                question: 'Hvordan oppretter jeg et arrangement?',
                answer: 'Gå til Arrangementer > Nytt arrangement. Fyll ut tittel, beskrivelse, dato/tid, sted og eventuell pris. Du kan også sette maks antall deltakere.'
            },
            {
                question: 'Kan jeg kreve betaling for arrangementer?',
                answer: 'Ja! Sett en pris på arrangementet så må deltakere betale ved påmelding. Betalingen håndteres via Stripe og pengene går til din organisasjon.'
            },
            {
                question: 'Hvordan ser jeg hvem som har meldt seg på?',
                answer: 'Klikk på et arrangement for å se deltakerlisten. Du kan også eksportere listen og se betalingsstatus for hvert medlem.'
            },
            {
                question: 'Hva er dugnad?',
                answer: 'Dugnad er en spesiell arrangementstype hvor medlemmer kan melde seg på arbeidsøkter. Perfekt for dugnader, vakter eller frivillig arbeid hvor du trenger å fordele oppgaver.'
            }
        ]
    },
    {
        id: 'board',
        title: 'Styre og møter',
        icon: <ClipboardList className="w-5 h-5" />,
        description: 'Administrer styret og hold møter',
        items: [
            {
                question: 'Hvordan registrerer jeg styremedlemmer?',
                answer: 'Under Innstillinger > Styre kan du legge til styremedlemmer med rolle (leder, nestleder, kasserer osv.), valgdato og valgperiode. Du kan også laste opp valgprotokoll.'
            },
            {
                question: 'Hvordan oppretter jeg et styremøte?',
                answer: 'Gå til Møter > Nytt møte. Sett dato, tid og agenda. Du kan knytte saker til møtet og føre referat direkte i systemet.'
            },
            {
                question: 'Hva er saker og vedtak?',
                answer: 'Saker er formelle punkter som styret må behandle. Når en sak er behandlet, kan du registrere vedtaket. Alt lagres i historikken for dokumentasjon.'
            },
            {
                question: 'Hvordan fungerer digital avstemning?',
                answer: 'For saker som krever avstemning kan du aktivere digital avstemning. Styremedlemmene kan da stemme For, Mot eller Avstå direkte i systemet. Resultatet vises i sanntid.'
            }
        ]
    },
    {
        id: 'documents',
        title: 'Dokumentarkiv',
        icon: <FolderOpen className="w-5 h-5" />,
        description: 'Last opp og del dokumenter',
        items: [
            {
                question: 'Hvordan laster jeg opp dokumenter?',
                answer: 'Gå til Dokumentarkiv og klikk "Last opp". Du kan laste opp PDF, Word, bilder og andre filer. Organiser i mapper for bedre oversikt.'
            },
            {
                question: 'Hvem kan se dokumentene?',
                answer: 'Du kan velge om dokumenter skal være synlige for alle medlemmer eller kun administratorer. Årsberetninger og vedtekter bør typisk være tilgjengelig for alle.'
            },
            {
                question: 'Hvor mye plass har jeg?',
                answer: 'Standard lagringsplass er tilstrekkelig for de fleste foreninger. Kontakt support hvis du trenger mer plass.'
            }
        ]
    },
    {
        id: 'expenses',
        title: 'Utlegg og refusjon',
        icon: <Receipt className="w-5 h-5" />,
        description: 'Håndter reiseregninger og utlegg',
        items: [
            {
                question: 'Hvordan registrerer medlemmer utlegg?',
                answer: 'Medlemmer kan under Min side > Utlegg registrere utlegg med beskrivelse, beløp og kvittering. Utlegget sendes til godkjenning.'
            },
            {
                question: 'Hvordan godkjenner jeg utlegg?',
                answer: 'Under Utlegg (admin) ser du alle innsendte utlegg. Du kan godkjenne, avvise eller be om mer informasjon. Godkjente utlegg markeres for utbetaling.'
            },
            {
                question: 'Hvordan håndteres kjøregodtgjørelse?',
                answer: 'Ved reiseregninger kan medlemmer oppgi antall kilometer. Systemet beregner godtgjørelse basert på statens satser.'
            }
        ]
    },
    {
        id: 'settings',
        title: 'Innstillinger',
        icon: <Settings className="w-5 h-5" />,
        description: 'Konfigurer organisasjonen',
        items: [
            {
                question: 'Hvilke innstillinger bør jeg konfigurere først?',
                answer: '1) Generelt: Organisasjonsinfo og kontaktdetaljer. 2) Betaling: Koble til Stripe. 3) Kontingent: Definer medlemskategorier og priser. 4) Styre: Legg til styremedlemmer.'
            },
            {
                question: 'Hvordan endrer jeg logo og farger?',
                answer: 'Under Innstillinger > Generelt kan du laste opp organisasjonens logo som vises i e-poster og på medlemsportalen.'
            },
            {
                question: 'Hvordan håndterer vi GDPR?',
                answer: 'Systemet har innebygd GDPR-støtte. Under medlemsdetaljer finner du mulighet for å eksportere eller slette et medlems data på forespørsel.'
            }
        ]
    }
]

function FAQItem({ question, answer }: { question: string; answer: string }) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="border-b border-gray-200 dark:border-gray-700 last:border-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 px-4 -mx-4 transition-colors"
            >
                <span className="font-medium text-gray-900 dark:text-white pr-4">{question}</span>
                {isOpen ? (
                    <ChevronDown className="w-5 h-5 text-gray-500 shrink-0" />
                ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500 shrink-0" />
                )}
            </button>
            {isOpen && (
                <div className="pb-4 text-gray-600 dark:text-gray-400 leading-relaxed">
                    {answer}
                </div>
            )}
        </div>
    )
}

function SectionCard({ section }: { section: Section }) {
    const [isExpanded, setIsExpanded] = useState(false)

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-6 flex items-start gap-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                    {section.icon}
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {section.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {section.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                        {section.items.length} spørsmål
                    </p>
                </div>
                {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-400 mt-1" />
                ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400 mt-1" />
                )}
            </button>

            {isExpanded && (
                <div className="px-6 pb-6 border-t border-gray-100 dark:border-gray-700">
                    <div className="mt-4">
                        {section.items.map((item, idx) => (
                            <FAQItem key={idx} question={item.question} answer={item.answer} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default function HelpPage() {
    const [searchQuery, setSearchQuery] = useState('')

    // Filter sections based on search
    const filteredSections = searchQuery
        ? helpSections.map(section => ({
            ...section,
            items: section.items.filter(
                item =>
                    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
            )
        })).filter(section => section.items.length > 0)
        : helpSections

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Hjelp & Dokumentasjon
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Finn svar på vanlige spørsmål og lær hvordan du bruker medlemsportalen.
                </p>
            </div>

            {/* Search */}
            <div className="mb-8">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Søk i dokumentasjonen..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-3 pl-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                    />
                    <HelpCircle className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                </div>
            </div>

            {/* Quick links */}
            {!searchQuery && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Medlemmer', icon: Users, href: '#members' },
                        { label: 'Betalinger', icon: CreditCard, href: '#payments' },
                        { label: 'E-post', icon: Mail, href: '#communication' },
                        { label: 'Arrangementer', icon: Calendar, href: '#events' },
                    ].map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <link.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{link.label}</span>
                        </a>
                    ))}
                </div>
            )}

            {/* Sections */}
            <div className="space-y-4">
                {filteredSections.length > 0 ? (
                    filteredSections.map((section) => (
                        <div key={section.id} id={section.id}>
                            <SectionCard section={section} />
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
                        <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">
                            Ingen resultater for "{searchQuery}"
                        </p>
                        <button
                            onClick={() => setSearchQuery('')}
                            className="mt-4 text-blue-600 hover:text-blue-700"
                        >
                            Nullstill søk
                        </button>
                    </div>
                )}
            </div>

            {/* Contact support */}
            <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-4">
                    <MessageSquare className="w-8 h-8 text-blue-600 dark:text-blue-400 shrink-0" />
                    <div>
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                            Fant du ikke svar?
                        </h3>
                        <p className="text-blue-800 dark:text-blue-200 mt-1">
                            Ta kontakt med support på{' '}
                            <a href="mailto:support@medlemsportalen.no" className="underline hover:no-underline">
                                support@medlemsportalen.no
                            </a>
                            {' '}så hjelper vi deg.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

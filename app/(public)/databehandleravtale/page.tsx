import Link from 'next/link'

export default function DBAPage() {
    return (
        <div className="min-h-screen bg-white text-gray-900 pb-20">
            {/* Header / Nav */}
            <header className="border-b border-gray-200 sticky top-0 bg-white/80 backdrop-blur-md z-10">
                <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
                    <Link href="/" className="font-bold text-xl hover:text-blue-600 transition-colors">Din Forening</Link>
                    <Link href="/" className="text-sm text-gray-600 hover:text-black font-medium group flex items-center gap-1">
                        <span className="group-hover:-translate-x-1 transition-transform">←</span> Tilbake til forsiden
                    </Link>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 py-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 mb-2">
                            Databehandleravtale
                        </h1>
                        <p className="text-gray-500">Mellom din forening og SMEB AS</p>
                    </div>
                    <button
                        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition-colors flex items-center gap-2 whitespace-nowrap opacity-50 cursor-not-allowed"
                        title="PDF-generering kommer snart"
                        disabled
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Last ned som PDF
                    </button>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 space-y-12">

                    {/* Header Info */}
                    <div className="border-b-2 border-gray-200 pb-8">
                        <p className="text-lg font-medium text-gray-900 mb-4">Mellom:</p>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">Behandlingsansvarlig</h3>
                                <p className="text-gray-900 font-semibold">[Foreningens navn]</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">Databehandler</h3>
                                <p className="text-gray-900 font-semibold">SMEB AS</p>
                            </div>
                        </div>
                        <p className="mt-6 text-sm text-gray-500"><strong>Dato:</strong> [Signeringsdato]</p>
                    </div>

                    {/* 1. Innledning */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">1. Innledning</h2>
                        <div className="space-y-3 text-gray-700 leading-relaxed text-sm">
                            <p>1.1 Denne databehandleravtalen ("Avtalen") regulerer Databehandlers behandling av personopplysninger på vegne av Behandlingsansvarlig.</p>
                            <p>1.2 Behandlingsansvarlig er ansvarlig for behandlingen av personopplysninger i henhold til personvernforordningen (GDPR) og personopplysningsloven.</p>
                            <p>1.3 Databehandler skal kun behandle personopplysninger i henhold til Behandlingsansvarligs dokumenterte instrukser.</p>
                        </div>
                    </section>

                    {/* 2. Behandlingens art og formål */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">2. Behandlingens art og formål</h2>
                        <div className="space-y-6 text-gray-700 text-sm">
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">2.1 Formål</h3>
                                <p className="mb-2">Databehandler skal behandle personopplysninger for følgende formål:</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>Administrasjon av medlemsregister</li>
                                    <li>Kommunikasjon med medlemmer (e-post)</li>
                                    <li>Håndtering av kontingentbetalinger</li>
                                    <li>Statistikk og rapportering</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">2.2 Type personopplysninger</h3>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>Navn, e-postadresse, telefonnummer</li>
                                    <li>Fødselsdato, adresse</li>
                                    <li>Medlemsnummer, medlemskategori, medlemsstatus</li>
                                    <li>Betalingsinformasjon (ikke kortdetaljer)</li>
                                    <li>E-poststatistikk (åpninger, klikk, IP-adresse)</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">2.3 Kategorier av registrerte</h3>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>Medlemmer i Behandlingsansvarligs forening</li>
                                    <li>Kontaktpersoner i foreningen</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">2.4 Behandlingens varighet</h3>
                                <p>Fra signeringsdato til avtaleforholdet avsluttes.</p>
                            </div>
                        </div>
                    </section>

                    {/* 3. Databehandlers plikter */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">3. Databehandlers plikter</h2>
                        <div className="space-y-6 text-gray-700 text-sm">
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">3.1 Instrukser</h3>
                                <p>Databehandler skal kun behandle personopplysninger i henhold til Behandlingsansvarligs dokumenterte instrukser, med mindre annet følger av EU-rett eller norsk rett.</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">3.2 Konfidensialitet</h3>
                                <p>Databehandler skal sikre at personer som er autorisert til å behandle personopplysningene har forpliktet seg til konfidensialitet eller er underlagt lovbestemt taushetsplikt.</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">3.3 Sikkerhetstiltak</h3>
                                <p className="mb-2">Databehandler skal iverksette egnede tekniske og organisatoriske tiltak for å sikre et sikkerhetsnivå som er egnet med hensyn til risikoen, herunder:</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>Kryptering av personopplysninger (HTTPS/TLS, bcrypt)</li>
                                    <li>Tilgangskontroll (Row Level Security)</li>
                                    <li>Regelmessige sikkerhetsoppdateringer</li>
                                    <li>Backup av data</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">3.4 Underleverandører</h3>
                                <p className="mb-2">Databehandler benytter følgende underleverandører:</p>
                                <ul className="list-disc pl-5 space-y-1 mb-2">
                                    <li><strong>Supabase Inc.</strong> - Database-leverandør (AWS Frankfurt, EU)</li>
                                    <li><strong>Resend</strong> - E-postleverandør</li>
                                    <li><strong>Vipps AS</strong> - Betalingsformidler</li>
                                </ul>
                                <p>Alle underleverandører er bundet av tilsvarende databehandleravtaler.</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">3.5 Bistand til Behandlingsansvarlig</h3>
                                <p>Databehandler skal, i den utstrekning det er mulig, bistå Behandlingsansvarlig med å oppfylle plikten til å svare på anmodninger om utøvelse av de registrertes rettigheter (innsyn, retting, sletting, etc.).</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">3.6 Bistand ved sikkerhetshendelser</h3>
                                <p>Databehandler skal bistå Behandlingsansvarlig med å sikre overholdelse av GDPR artikkel 32-36 (sikkerhet, varsling av brudd, DPIA).</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">3.7 Sletting eller retur av data</h3>
                                <p>Databehandler skal, etter at tjenestene er avsluttet, slette eller returnere alle personopplysninger til Behandlingsansvarlig, med mindre lagring av personopplysningene er pålagt ved EU-rett eller norsk rett.</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">3.8 Dokumentasjon</h3>
                                <p>Databehandler skal stille all informasjon som er nødvendig for å påvise overholdelse av forpliktelsene i denne Avtalen til rådighet for Behandlingsansvarlig.</p>
                            </div>
                        </div>
                    </section>

                    {/* 4. Behandlingsansvarligs plikter */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">4. Behandlingsansvarligs plikter</h2>
                        <div className="space-y-3 text-gray-700 leading-relaxed text-sm">
                            <p><strong>4.1 Instrukser:</strong> Behandlingsansvarlig er ansvarlig for å gi tydelige, lovlige og dokumenterte instrukser til Databehandler.</p>
                            <p><strong>4.2 Lovlig behandling:</strong> Behandlingsansvarlig er ansvarlig for at behandlingen har rettslig grunnlag og er i samsvar med GDPR.</p>
                            <p><strong>4.3 Informasjon til registrerte:</strong> Behandlingsansvarlig er ansvarlig for å informere de registrerte om behandlingen (personvernerklæring).</p>
                        </div>
                    </section>

                    {/* 5. Varighet og oppsigelse */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">5. Varighet og oppsigelse</h2>
                        <div className="space-y-3 text-gray-700 leading-relaxed text-sm">
                            <p><strong>5.1 Varighet:</strong> Avtalen gjelder fra signeringsdato og så lenge Behandlingsansvarlig bruker Medlemsportalen.</p>
                            <p><strong>5.2 Oppsigelse:</strong> Begge parter kan si opp avtalen med 30 dagers varsel.</p>
                            <p><strong>5.3 Ved oppsigelse:</strong> Databehandler skal slette eller returnere alle personopplysninger innen 30 dager etter oppsigelse, med mindre lagring er lovpålagt.</p>
                        </div>
                    </section>

                    {/* 6. Ansvar og erstatning */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">6. Ansvar og erstatning</h2>
                        <div className="space-y-3 text-gray-700 leading-relaxed text-sm">
                            <p>6.1 Databehandler er ansvarlig for skade forårsaket av behandling som ikke er i samsvar med GDPR eller denne Avtalen.</p>
                            <p>6.2 Behandlingsansvarlig er ansvarlig for å sikre at instruksene er lovlige og i samsvar med GDPR.</p>
                        </div>
                    </section>

                    {/* 7. Tvister */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">7. Tvister</h2>
                        <div className="space-y-3 text-gray-700 leading-relaxed text-sm">
                            <p>7.1 Tvister knyttet til denne Avtalen skal søkes løst i minnelighet.</p>
                            <p>7.2 Dersom enighet ikke oppnås, skal tvisten avgjøres av norske domstoler med Oslo tingrett som verneting.</p>
                        </div>
                    </section>

                    {/* 8. Signaturer - BALANSERT VERSJON */}
                    <section className="border-t-2 border-gray-200 pt-8 mt-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-8">8. Signaturer</h2>

                        <div className="grid md:grid-cols-2 gap-12">
                            {/* Venstre: Behandlingsansvarlig */}
                            <div className="flex flex-col space-y-6">
                                <h3 className="font-bold text-lg border-b border-gray-200 pb-2">Behandlingsansvarlig</h3>
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase">Foreningens navn</label>
                                        <div className="h-8 border-b border-gray-300 mt-2"></div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase">Organisasjonsnummer</label>
                                        <div className="h-8 border-b border-gray-300 mt-2"></div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase">Kontaktperson</label>
                                        <div className="h-8 border-b border-gray-300 mt-2"></div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase">E-post</label>
                                        <div className="h-8 border-b border-gray-300 mt-2"></div>
                                    </div>
                                </div>
                                <div className="mt-auto">
                                    <label className="block text-xs font-bold text-gray-500 uppercase">Dato og signatur</label>
                                    <div className="h-16 border-b border-gray-300 mt-2"></div>
                                </div>
                            </div>

                            {/* Høyre: Databehandler - BALANSERT */}
                            <div className="flex flex-col space-y-6">
                                <h3 className="font-bold text-lg border-b border-gray-200 pb-2">Databehandler</h3>
                                <div className="flex-1">
                                    <div className="bg-gray-50 p-4 rounded border border-gray-100 text-sm text-gray-700">
                                        <p className="font-semibold text-gray-900">SMEB AS</p>
                                        <p className="text-xs mt-2">
                                            Storgata 26<br />
                                            3181 Horten<br />
                                            Orgnr: 930073954
                                        </p>
                                        <p className="mt-3 text-xs">
                                            <strong>Kontaktperson:</strong> Stig Magne Evju Brekken<br />
                                            <strong>E-post:</strong> stig@smeb.no
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-auto">
                                    <label className="block text-xs font-bold text-gray-500 uppercase">Dato og signatur</label>
                                    <div className="h-16 border-b border-gray-300 mt-2"></div>
                                </div>
                            </div>
                        </div>
                    </section>

                </div>
            </main>
        </div>
    )
}
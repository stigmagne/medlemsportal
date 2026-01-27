import Link from 'next/link'

export default function PrivacyPage() {
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
                <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight text-gray-900">
                    Personvernerklæring
                    <span className="block text-xl md:text-2xl font-normal text-gray-500 mt-2">for Medlemsportalen</span>
                </h1>

                <p className="text-sm text-gray-500 mb-16 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <strong>Sist oppdatert:</strong> {new Date().toLocaleDateString()}
                </p>

                <div className="space-y-12">
                    {/* 1. Behandlingsansvarlig */}
                    <section className="border-t border-gray-100 pt-8">
                        <h2 className="text-2xl font-bold mb-6 text-gray-900">1. Behandlingsansvarlig</h2>
                        <div className="space-y-4 text-gray-700 leading-relaxed">
                            <p>Medlemsportalen er en plattform for administrasjon av medlemskap.</p>

                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 grid md:grid-cols-2 gap-8 my-6">
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Plattformleverandør:</h4>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <p>SMEB AS</p>
                                        <p>Storgata 26</p>
                                        <p>3181 Horten</p>
                                        <p>E-post: hei@smeb.no</p>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Behandlingsansvarlig:</h4>
                                    <p className="text-sm text-gray-600">
                                        Din forening/organisasjon er behandlingsansvarlig for personopplysninger som lagres om deg som medlem.
                                    </p>
                                </div>
                            </div>

                            <p className="text-sm text-gray-500 italic">
                                Medlemsportalen er databehandler på vegne av din forening.
                            </p>
                        </div>
                    </section>

                    {/* 2. Hvilke opplysninger */}
                    <section className="border-t border-gray-100 pt-8">
                        <h2 className="text-2xl font-bold mb-6 text-gray-900">2. Hvilke opplysninger samler vi inn?</h2>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-lg font-semibold mb-3 text-gray-800">A. Medlemsopplysninger</h3>
                                <p className="text-sm text-gray-500 mb-3">(Lagres av din forening)</p>
                                <ul className="list-disc pl-5 space-y-2 text-gray-700 text-sm">
                                    <li>Navn (for- og etternavn)</li>
                                    <li>E-postadresse</li>
                                    <li>Telefonnummer</li>
                                    <li>Fødselsdato</li>
                                    <li>Adresse (gate, postnummer, poststed)</li>
                                    <li>Medlemsnummer</li>
                                    <li>Medlemskategori</li>
                                    <li>Medlemsstatus</li>
                                    <li>Innmeldingsdato</li>
                                    <li>Notater (fra foreningens administrators)</li>
                                </ul>
                            </div>

                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-lg font-semibold mb-3 text-gray-800">B. Betalingsinformasjon</h3>
                                    <ul className="list-disc pl-5 space-y-2 text-gray-700 text-sm">
                                        <li>Kontingentbetalinger (beløp, dato, status)</li>
                                        <li>Stripe-transaksjoner (ikke kortinformasjon - dette håndteres av Stripe)</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold mb-3 text-gray-800">C. Kommunikasjonsdata</h3>
                                    <ul className="list-disc pl-5 space-y-2 text-gray-700 text-sm">
                                        <li>E-postkampanjer sendt til deg</li>
                                        <li>Åpning av e-post (via tracking pixel)</li>
                                        <li>Klikk på lenker i e-post</li>
                                        <li>IP-adresse og nettleserinfo ved åpning/klikk</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold mb-3 text-gray-800">D. Teknisk informasjon</h3>
                                    <ul className="list-disc pl-5 space-y-2 text-gray-700 text-sm">
                                        <li>Innloggingsinformasjon (kryptert)</li>
                                        <li>Session-tokens</li>
                                        <li>IP-adresse ved innlogging</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 3. Formål */}
                    <section className="border-t border-gray-100 pt-8">
                        <h2 className="text-2xl font-bold mb-6 text-gray-900">3. Formål med behandlingen</h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="bg-gray-50 p-5 rounded-lg">
                                <h3 className="font-semibold text-gray-900 mb-3">A. Medlemsadministrasjon</h3>
                                <ul className="list-disc pl-4 space-y-1 text-sm text-gray-700">
                                    <li>Administrere medlemskap</li>
                                    <li>Kommunikasjon</li>
                                    <li>Betalingsoppfølging</li>
                                </ul>
                            </div>
                            <div className="bg-gray-50 p-5 rounded-lg">
                                <h3 className="font-semibold text-gray-900 mb-3">B. Statistikk og analyse</h3>
                                <ul className="list-disc pl-4 space-y-1 text-sm text-gray-700">
                                    <li>Forstå vekst</li>
                                    <li>Forbedre tjenesten</li>
                                </ul>
                            </div>
                            <div className="bg-gray-50 p-5 rounded-lg">
                                <h3 className="font-semibold text-gray-900 mb-3">C. Jus</h3>
                                <ul className="list-disc pl-4 space-y-1 text-sm text-gray-700">
                                    <li>Bokføring</li>
                                    <li>Rapportering</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* 4. Rettslig grunnlag */}
                    <section className="border-t border-gray-100 pt-8">
                        <h2 className="text-2xl font-bold mb-6 text-gray-900">4. Rettslig grunnlag</h2>
                        <ul className="grid md:grid-cols-3 gap-4">
                            <li className="border border-green-100 bg-green-50 p-4 rounded-lg">
                                <strong className="text-green-800 block mb-1">Samtykke</strong>
                                <span className="text-sm text-green-700">Du har gitt samtykke til behandling (f.eks. markedsføring)</span>
                            </li>
                            <li className="border border-blue-100 bg-blue-50 p-4 rounded-lg">
                                <strong className="text-blue-800 block mb-1">Avtale</strong>
                                <span className="text-sm text-blue-700">Nødvendig for å oppfylle medlemskapsavtalen</span>
                            </li>
                            <li className="border border-purple-100 bg-purple-50 p-4 rounded-lg">
                                <strong className="text-purple-800 block mb-1">Berettiget interesse</strong>
                                <span className="text-sm text-purple-700">Administrere medlemskap effektivt</span>
                            </li>
                        </ul>
                    </section>

                    {/* 5. Deling */}
                    <section className="border-t border-gray-100 pt-8">
                        <h2 className="text-2xl font-bold mb-4 text-gray-900">5. Deling av opplysninger</h2>
                        <p className="mb-4 text-gray-700">Vi deler IKKE personopplysninger med tredjeparter, bortsett fra:</p>
                        <ul className="space-y-3 mb-6">
                            <li className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                                <span className="bg-purple-100 text-purple-600 p-1.5 rounded text-xs font-bold">Stripe</span>
                                <span className="text-gray-700">For betalingshåndtering (kun betalingsdata)</span>
                            </li>
                            <li className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                                <span className="bg-gray-100 text-gray-600 p-1.5 rounded text-xs font-bold">Resend</span>
                                <span className="text-gray-700">E-postleverandør for utsending av e-post</span>
                            </li>
                            <li className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                                <span className="bg-green-100 text-green-600 p-1.5 rounded text-xs font-bold">Supabase</span>
                                <span className="text-gray-700">Database-leverandør (AWS Frankfurt, EU)</span>
                            </li>
                        </ul>
                        <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded border border-gray-100 inline-block">
                            🔒 Alle underleverandører har databehandleravtale med oss.
                        </p>
                    </section>

                    {/* 6. Lagringstid */}
                    <section className="border-t border-gray-100 pt-8">
                        <h2 className="text-2xl font-bold mb-6 text-gray-900">6. Lagringstid</h2>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white border border-gray-200 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold text-gray-900 mb-1">2 år</div>
                                <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Medlemsdata</div>
                                <div className="text-xs text-gray-400">Etter utmelding</div>
                            </div>
                            <div className="bg-white border border-gray-200 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold text-gray-900 mb-1">5 år</div>
                                <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Betalingsdata</div>
                                <div className="text-xs text-gray-400">Regnskapsloven</div>
                            </div>
                            <div className="bg-white border border-gray-200 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold text-gray-900 mb-1">2 år</div>
                                <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">E-poststatistikk</div>
                                <div className="text-xs text-gray-400">Analyse</div>
                            </div>
                            <div className="bg-white border border-gray-200 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold text-gray-900 mb-1">1 år</div>
                                <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Logger</div>
                                <div className="text-xs text-gray-400">Sikkerhet</div>
                            </div>
                        </div>
                    </section>

                    {/* 7. Dine rettigheter */}
                    <section className="border-t border-gray-100 pt-8">
                        <h2 className="text-2xl font-bold mb-6 text-gray-900">7. Dine rettigheter (GDPR)</h2>
                        <div className="grid md:grid-cols-2 gap-x-12 gap-y-4 mb-8">
                            <ul className="space-y-3">
                                <li className="flex items-center gap-3 text-gray-700">
                                    <span className="text-green-500">✅</span> <strong>Innsyn:</strong> Se dine data
                                </li>
                                <li className="flex items-center gap-3 text-gray-700">
                                    <span className="text-green-500">✅</span> <strong>Retting:</strong> Endre feil
                                </li>
                                <li className="flex items-center gap-3 text-gray-700">
                                    <span className="text-green-500">✅</span> <strong>Sletting:</strong> "Bli glemt"
                                </li>
                                <li className="flex items-center gap-3 text-gray-700">
                                    <span className="text-green-500">✅</span> <strong>Begrensning:</strong> Stans bruk
                                </li>
                            </ul>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-3 text-gray-700">
                                    <span className="text-green-500">✅</span> <strong>Dataportabilitet:</strong> Få dine data
                                </li>
                                <li className="flex items-center gap-3 text-gray-700">
                                    <span className="text-green-500">✅</span> <strong>Protest:</strong> Nekt behandling
                                </li>
                                <li className="flex items-center gap-3 text-gray-700">
                                    <span className="text-green-500">✅</span> <strong>Tilbaketrekke samtykke</strong>
                                </li>
                            </ul>
                        </div>
                        <div className="bg-blue-50 border border-blue-100 p-6 rounded-lg text-center md:text-left md:flex md:items-center md:justify-between gap-6">
                            <div>
                                <h4 className="font-bold text-blue-900 mb-1">Utøv dine rettigheter</h4>
                                <p className="text-sm text-blue-700">Logg inn på "Min Side" og gå til "Personvern", eller kontakt foreningen.</p>
                            </div>
                            <Link href="/login" className="mt-4 md:mt-0 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors inline-block whitespace-nowrap shadow-sm">
                                Logg Inn
                            </Link>
                        </div>
                    </section>

                    {/* 8. Sikkerhet & 9. Cookies */}
                    <div className="grid md:grid-cols-2 gap-12 border-t border-gray-100 pt-8">
                        <section>
                            <h2 className="text-2xl font-bold mb-4 text-gray-900">8. Sikkerhet</h2>
                            <ul className="space-y-2 text-gray-700">
                                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span> Krypterte forbindelser (HTTPS)</li>
                                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span> Sikre passord hash (bcrypt)</li>
                                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span> Streng tilgangskontroll</li>
                                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span> Daglig backup</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4 text-gray-900">9. Cookies</h2>
                            <div className="space-y-4">
                                <div>
                                    <span className="text-xs font-bold uppercase text-gray-500">Vi bruker</span>
                                    <p className="text-sm text-gray-700">Session cookies (login) & E-post tracking.</p>
                                </div>
                                <div>
                                    <span className="text-xs font-bold uppercase text-gray-500">Vi bruker IKKE</span>
                                    <p className="text-sm text-gray-700">Tredjeparts tracking eller annonsecookies.</p>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* 10, 11, 12. Oppsummering */}
                    <section className="border-t border-gray-100 pt-8">
                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <h2 className="text-xl font-bold mb-4 text-gray-900">10. Klagerett</h2>
                                <p className="text-gray-700 mb-2 text-sm">Mener du vi bryter loven?</p>
                                <address className="not-italic text-sm text-gray-600 bg-gray-50 p-4 rounded border border-gray-100">
                                    <strong>Datatilsynet</strong><br />
                                    Postboks 458 Sentrum, 0105 Oslo<br />
                                    postkasse@datatilsynet.no
                                </address>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold mb-4 text-gray-900">12. Kontakt Oss</h2>
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-xs font-bold text-gray-500">Plattform Support</div>
                                        <a href="mailto:[support@smeb.no]" className="text-blue-600 hover:underline">Send oss en epost!</a>
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-gray-500">Din Forening</div>
                                        <span className="text-gray-700 text-sm">Kontakt styret direkte.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p className="text-center text-xs text-gray-400 mt-12">
                            Endringer i personvernerklæringen kan forekomme. Vesentlige endringer varsles.
                        </p>
                    </section>
                </div>
            </main>
        </div>
    )
}

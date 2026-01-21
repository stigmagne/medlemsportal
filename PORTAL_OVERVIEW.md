# Portal Oversikt & Funksjonalitet

Dette dokumentet gir en komplett oversikt over funksjonaliteten i **Din Forening**-portalen, samt forslag til forbedringer og "tweaks" for å heve kvaliteten ytterligere.

## 🧱 Systemarkitektur
*   **Rammeverk:** Next.js (App Router)
*   **Database & Autentisering:** Supabase (PostgreSQL, Auth)
*   **Betaling:** Stripe Connect (Plattformmodell) + Faktura m/KID
*   **Kommunikasjon:** Resend (E-post), Mock/SMS-tjeneste
*   **Design:** Tailwind CSS / Shadcn UI

---

## 🛠️ Funksjonalitet: Admin (Styret)
Dashbordet er hovedverktøyet for styret/administratorer. Tilgang styres via `org/[slug]/*`.

### 1. 👥 Medlemsregister (`/medlemmer`, `/familier`)
*   **Oversikt:** Liste over alle medlemmer med status (aktiv, utmeldt), medlemsnummer, e-post.
*   **Detaljer:** Redigering av personalia, medlemskapstype, og notater.
*   **Familier:** Kobling av medlemmer i familiegrupper for samlet fakturering (potensielt).
*   **Filter/Søk:** Søk på navn/e-post.

### 2. 📅 Arrangementer & Dugnad (`/arrangementer`)
*   **Opprettelse:** Lage arrangementer med tittel, tidspunkt, beskrivelse.
*   **Dugnad:** Tildele dugnadsoppgaver til arrangementer.
*   **Påmelding:** (Foreløpig enkel visning, logikk for invitasjon ligger delvis i kommunikasjon).

### 3. 💳 Økonomi (`/betalinger`, `/utlegg`)
*   **Betalingsoversikt:** Se innbetalinger av kontingent og arrangementer.
*   **Stripe Connect:** Onboarding-flyt for å sette opp utbetaling til foreningens konto.
*   **Utlegg (Admin):** Godkjenning av utleggsrefusjoner innsendt av medlemmer.
*   **Medlemskontingent:** Innstilling av årlig avgift og utsending av krav.

### 4. 📨 Kommunikasjon (`/kommunikasjon`)
*   **E-post (Kampanjer):**
    *   Sende e-post til alle medlemmer eller spesifikke grupper.
    *   Støtte for rik tekst (HTML).
    *   **NYTT:** Avsender vises som "Foreningens Navn" med svar-til adresse.
*   **SMS:**
    *   Sende SMS til mottakere (bruker mock-tjeneste foreløpig).
    *   Prisestimering før sending.
*   **Logg:** Oversikt over sendte meldinger og status (levert/feilet).

### 5. 📂 Dokumentarkiv (`/arkiv`)
*   **Filopplasting:** Laste opp referater, vedtekter, årsmøtepapirer.
*   **Kategorisering:** Sortere dokumenter i mapper/kategorier (f.eks. "Årsmøte", "Styret").
*   **Tilgang:** Dokumenter er synlige for medlemmer via Min Side.

### 6. ⚖️ Møter & Saker (`/moter`)
*   **Møteinnkalling:** Opprette styremøter med tid og sted.
*   **Saksliste:** Legge til saker til behandling.
*   **Vedtak:** Protokollføre vedtak direkte i systemet.
*   **Digital Behandling:** Mulighet for å sende saker på høring/votering (work-in-progress).

### 7. ⚙️ Innstillinger (`/innstillinger`)
*   **Generelt:** Endre foreningens navn, logo (hvis impl.), kontingent-sats, og kontonummer.
*   **Kontakt:** Sette opp kontakt-epost for utgående kommunikasjon.
*   **Rapportering:** Enkle grafer over medlemsvekst og økonomi.

---

## 👤 Funksjonalitet: Medlem (Min Side)
Medlemsportalen er separert fra admin-delen for enklere brukeropplevelse. Tilgang via `/org/[slug]/min-side`.

### 1. 🏠 Oversikt
*   Velkomstside med status på medlemskap.
*   Snarveier til viktige funksjoner.

### 2. 👤 Min Profil (`/profil`)
*   Se og oppdatere egne kontaktopplysninger.
*   Se familietilknytning.

### 3. 🧹 Dugnad (`/dugnad`)
*   Se tildelte dugnadsoppgaver.
*   Melde seg på ledige vakter (hvis aktivert).
*   Status på gjennomført arbeid.

### 4. 💸 Mine Utlegg (`/utlegg`)
*   **Nytt Utlegg:** Fylle ut skjema for refusjon (kvittering, beløp, formål).
*   **Historikk:** Se status på innsendte krav (Under behandling, Godkjent, Utbetalt).

### 5. 📖 Booking (`/booking`)
*   Reservere fellesressurser (f.eks. klubbhus, utstyr, tilhenger).
*   Kalenderoversikt over ledighet.

### 6. 📂 Arkiv (`/arkiv`)
*   Tilgang til foreningens delte dokumenter (årsmøtepapirer, styrereferater).

---

## 🚀 Forslag til Forbedringer & Tweaks

Her er en liste over anbefalte justeringer for å gjøre løsningen mer robust og brukervennlig.

### UX / Brukeropplevelse
1.  **Loading Skeletons:** I stedet for at siden er hvit eller "hopper" mens data lastes, bør vi legge inn "skjelett-visning" (grå bokser) på lister som Medlemmer og Betalinger.
2.  **Tomme Tilstander (Empty States):** Mange lister viser bare ingenting hvis de er tomme. Legg til en fin illustrasjon og en "Opprett ny"-knapp når listen er tom (f.eks. "Ingen møter ennå. Planlegg det første styremøtet nå!").
3.  **Brødsmulesti (Breadcrumbs):** På dype sider (f.eks. inne på en spesifikk sak eller et dokument), bør det være tydelig vei tilbake (F.eks. `Saker > Sak #24 > Endre`).
4.  **Aktiv Meny-indikator:** Sjekk at menyen alltid lyser opp korrekt også på undersider (f.eks. at "Kommunikasjon" lyser når man er inne på "SMS").

### Funksjonelle Utvidelser
5.  **Fakturering:**
    *   Legge til mulighet for å generere PDF av faktura direkte fra Min Side.
    *   Automatisk purring ( sende e-post på nytt) ved forfall.
6.  **Medlemskort:**
    *   Digitalt medlemskort på Min Side (f.eks. med QR-kode) for adgangskontroll eller rabatter.
7.  **Dashboard-widgets:**
    *   Admin-dashbordet viser "Siste hendelser" (Logg) – f.eks. "Ola Nordmann betalte kontingent", "Ny sak opprettet". Dette gir styret puls på hva som skjer.

### Teknisk Gjeld & Opprydding
8.  **Konsistent `replyTo`:** Sjekke at alle e-post funksjoner (glemt passord, invitasjon, notifikasjoner) bruker den nye `contact_email` logikken, ikke bare Kampanjer.
9.  **Feilhåndtering:**
    *   Global "Error Boundary" som fanger opp krasj og viser "Noe gikk galt" i stedet for hvit skjerm, spesielt i komponenter som henter data.
10. **Type-Sikkerhet:**
    *   Gå gjennom alle `any` i koden (spesielt i tabeller og API-kall) og erstatte med strenge typer/interfaces.

### Kode Struktur
11. **Rydde i `(dashboard)` rot:** Sørge for at alle sider som *skal* ha admin-meny ligger i `(dashboard)` layoutgruppen, og at Min Side er helt isolert. (Dette er i stor grad gjort nå, men verdt en siste sjekk).

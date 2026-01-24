# Portal Oversikt & Funksjonalitet

> **Sist oppdatert:** 24. januar 2026


Dette dokumentet gir en komplett oversikt over funksjonaliteten i **Din Forening**-portalen, samt forslag til forbedringer og "tweaks" for å heve kvaliteten ytterligere.

## 🧱 Systemarkitektur
*   **Rammeverk:** Next.js (App Router)
*   **Database & Autentisering:** Supabase (PostgreSQL, Auth)
*   **Betaling:** Stripe Connect (Plattformmodell) + Faktura m/KID
*   **Kommunikasjon:** Resend (E-post), Mock/SMS-tjeneste
*   **Sikkerhet:** RLS (Row Level Security) + Audit Logging
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
    *   **Rik Tekst:** Full editor med støtte for fet/kursiv, lister og **bilder**.
    *   **Svar-til:** Avsender vises som "Foreningens Navn" med korrekt svar-adresse.
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
*   **Saksliste:** Integrert saksliste med "Godkjenning"-punkter og henting av saker fra arkiv.
*   **Vedtak:** Protokollføre vedtak direkte i systemet.
*   **Case Management:** Full behandling av saker (Draft -> Ready -> Decided).

### 7. ⚙️ Innstillinger (`/innstillinger`)
*   **Generelt:** Endre foreningens navn, logo (hvis impl.), kontingent-sats, og kontonummer.
*   **Kontakt:** Sette opp kontakt-epost for utgående kommunikasjon.
*   **Rapportering:** Enkle grafer over medlemsvekst og økonomi.

### 8. 🛡️ Sikkerhet (`Sikkerhetslogg`)
*   **Audit Logging:** Full sporbarhet på hvem som gjør hva (sletting, endringer).
*   **RLS (Row Level Security):** Streng databasetilgang sikrer at data ikke lekker mellom organisasjoner.
*   **Service Role:** Betalinger håndteres via sikker bakkanal for å garantere drift.

### 9. 🦸 Superadmin (`/superadmin`)
*   **Feilhåndtering:** Eget dashbord for å se feilrapporter fra brukere.
*   **Løsning:** Mulighet til å markere feil som løst eller slette dem.
*   **Systemoversikt:** Tilgang til globale innstillinger og feillogger.

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
*   **Betaling:** Støtte for betaling (Stripe) ved booking (Time/Dag/Fastpris).
*   Kalenderoversikt over ledighet.

### 6. 📂 Arkiv (`/arkiv`)
*   Tilgang til foreningens delte dokumenter (årsmøtepapirer, styrereferater).

---

## 🚀 Forslag til Forbedringer & Tweaks

Her er en liste over anbefalte justeringer for å gjøre løsningen mer robust og brukervennlig.

### UX / Brukeropplevelse
1.  **Loading Skeletons:** ✅ **UTFØRT:** Hele dashbordet bruker nå "skjelett-visning" med **morsomme tekster** 🐹 mens data lastes.
2.  **Tomme Tilstander (Empty States):** Mange lister viser bare ingenting hvis de er tomme. Legg til en fin illustrasjon og en "Opprett ny"-knapp når listen er tom (f.eks. "Ingen møter ennå. Planlegg det første styremøtet nå!").
3.  **Brødsmulesti (Breadcrumbs):** På dype sider (f.eks. inne på en spesifikk sak eller et dokument), bør det være tydelig vei tilbake (F.eks. `Saker > Sak #24 > Endre`).
4.  **Aktiv Meny-indikator:** Sjekk at menyen alltid lyser opp korrekt også på undersider (f.eks. at "Kommunikasjon" lyser når man er inne på "SMS").
5.  **404 & Feilsider:** ✅ **UTFØRT:** Morsomme 404-sider og en global feilhåndterer som lar brukere rapportere feil direkte til Superadmin.

### Funksjonelle Utvidelser
6.  **Fakturering:**
    *   Legge til mulighet for å generere PDF av faktura direkte fra Min Side.
    *   Automatisk purring ( sende e-post på nytt) ved forfall.
7.  **Medlemskort:**
    *   ✅ **UTFØRT:** Digitalt medlemskort på Min Side er implementert.
8.  **Dashboard-widgets:**
    *   ✅ **UTFØRT:** Admin-dashbordet viser nå "Siste hendelser" (Audit Log + Medlemmer + Betalinger). Dette gir styret full puls på hva som skjer.

### Teknisk Gjeld & Opprydding
8.  **Konsistent `replyTo`:** ✅ **UTFØRT:** E-post bruker nå korrekt `contact_email` logikk.
9.  **Feilhåndtering:**
    *   ✅ **UTFØRT:** Global "Error Boundary" fanger krasj, viser humoristiske meldinger, og lar brukeren sende rapport til database.
    *   Systemet lagrer stack trace, brukerinfo og kommentar.
10. **Type-Sikkerhet:**
    *   ✅ **DELVIS UTFØRT:** Kritiske moduler som Dugnad og Møteprotokoller er typet opp strengt (fjernet 20+ `any`).
    *   Fortsatt gjenstår en generell gjennomgang av `components` og eldre filer.

### Kode Struktur
11. **Rydde i `(dashboard)` rot:** ✅ **VERIFISERT:** Sjekket at Min Side er isolert fra Admin-dashbordet, og at `DashboardShell` (admin-shell) kun brukes der den skal. Routing-strukturen er godkjent.

# Din Forening - Medlemsregister

Et moderne medlemsregister- og foreningssystem for norske frivillige organisasjoner.

## Kom i gang

### 1. Installer avhengigheter

```bash
npm install
```

### 2. Konfigurer miljøvariabler

Opprett en `.env.local` fil i rotmappen og legg til dine Supabase-credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=din-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=din-anon-key
SUPABASE_SERVICE_ROLE_KEY=din-service-role-key
```

Du finner disse i ditt Supabase-prosjekt under **Project Settings > API**.

### 3. Kjør utviklingsserveren

```bash
npm run dev
```

Åpne [http://localhost:3000](http://localhost:3000) i nettleseren din.

## Teknologi

- **Frontend**: Next.js 15 (App Router) + React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Row Level Security)
- **Betaling**: Vipps ePayment API (kommer)
- **E-post**: Resend (kommer)

## Prosjektstruktur

```
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Autentiseringssider (login, register)
│   ├── (dashboard)/       # Dashboard-sider (beskyttet)
│   ├── (public)/          # Offentlige sider (join, payment)
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Hjemmeside
├── components/            # Gjenbrukbare komponenter
├── lib/                   # Utilities og hjelpefunksjoner
│   ├── supabase/         # Supabase-klienter
│   └── ...
├── middleware.ts          # Next.js middleware (auth)
└── ...
```

## Neste steg

1. ✅ Opprett Next.js-prosjekt
2. ✅ Konfigurer Supabase-tilkobling
3. Opprett databaseskjema
4. Implementer autentisering
5. Bygg medlemsregister
6. Integrer Vipps-betaling
7. Legg til e-postkommunikasjon

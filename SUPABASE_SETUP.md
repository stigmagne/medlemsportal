# Koble til Supabase

Prosjektet er klart til å kobles til din Supabase-instans! Følg disse stegene:

## Steg 1: Finn dine Supabase-credentials

1. Gå til [supabase.com](https://supabase.com) og logg inn
2. Velg ditt prosjekt
3. Gå til **Project Settings** (tannhjul-ikonet i venstremenyen)
4. Klikk på **API** i sidemenyen
5. Du vil se:
   - **Project URL** (under "Project URL")
   - **anon public** key (under "Project API keys")
   - **service_role** key (under "Project API keys" - klikk "Reveal" for å se den)

## Steg 2: Opprett .env.local-filen

1. Kopier `.env.local.example` til `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Åpne `.env.local` og erstatt `your-project-url` og `your-anon-key` med verdiene fra Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6Ikp...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6Ikp...
```

## Steg 3: Test tilkoblingen

1. Start utviklingsserveren:
   ```bash
   npm run dev
   ```

2. Åpne [http://localhost:3000](http://localhost:3000) i nettleseren

3. Du skal nå se hjemmesiden med teksten "Supabase tilkobling klar" ✅

## Neste steg

Når Supabase er koblet til, er neste steg å:
1. Opprette databasetabeller (migrasjoner)
2. Sette opp Row Level Security (RLS)
3. Implementere autentisering (innlogging/registrering)

---

**Trenger du hjelp?**
- Sjekk at du har kopiert hele API-nøklene (de er veldig lange!)
- Sjekk at URL-en slutter med `.supabase.co`
- Sørg for at det ikke er mellomrom før eller etter verdiene i `.env.local`

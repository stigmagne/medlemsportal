# Sikkerhetsforbedriner for Medlemsportalen

**Dato:** 2026-01-23
**Branch:** `claude/discuss-association-websites-fTsmO`

## Bakgrunn

Dette dokumentet beskriver kritiske sikkerhetshull som ble identifisert i medlemsportalen, og hvordan de er blitt fikset. Endringene er basert på en gjennomgang av databasens Row Level Security (RLS) policies og databehandlingsrutiner.

---

## 🚨 Kritiske sikkerhetshull funnet

### 1. Case Management - Full åpen tilgang (KRITISK)

**Problem:**
```sql
CREATE POLICY "Enable all access for authenticated users" ON case_items
FOR ALL USING (auth.role() = 'authenticated');
```

**Konsekvens:**
- **ENHVER innlogget bruker** kunne se **ALLE styresaker** fra **ALLE foreninger**
- Dette inkluderer konfidensielle vedtak, personalsaker, økonomiske beslutninger
- Samme problem gjaldt `case_comments` og `case_votes`

**Alvorlighetsgrad:** 🔴 KRITISK

---

### 2. Møter - Ingen RLS policies (KRITISK)

**Problem:**
RLS policies var kommentert ut med notis:
```sql
-- Security is currently handled by application-level logic
```

**Konsekvens:**
- Møtenotater, agendaer, referat og beslutninger var tilgjengelige via direkte database-tilgang
- Ingen beskyttelse mot feilkonfigurerte API-endepunkter
- Applikasjonslogikk kan omgås

**Alvorlighetsgrad:** 🔴 KRITISK

---

### 3. Arrangementer - Ingen RLS policies (HØY)

**Problem:**
RLS policies var kommentert ut.

**Konsekvens:**
- Arrangementsinformasjon, påmeldinger og betalinger var ikke beskyttet på databasenivå
- Selv om noen arrangementer skal være offentlige, må påmeldinger og betalinger beskyttes

**Alvorlighetsgrad:** 🟠 HØY

---

### 4. Betalinger - Ingen RLS policies (KRITISK)

**Problem:**
RLS policies var kommentert ut.

**Konsekvens:**
- Betalingstransaksjoner, medlemsavgifter og økonomisk informasjon var ikke beskyttet
- Kunne avsløre medlemmers betalingshistorikk på tvers av organisasjoner

**Alvorlighetsgrad:** 🔴 KRITISK

---

### 5. Ingen audit logging (HØY)

**Problem:**
Det fantes ingen logging av:
- Hvem som har sett hvilke data
- Hva superadmin har gjort
- Hvem som har eksportert medlemslister
- Sensitive operasjoner

**Konsekvens:**
- Ingen sporbarhet ved sikkerhetshendelser
- Ingen compliance-dokumentasjon
- Ingen måte å oppdage misbruk på

**Alvorlighetsgrad:** 🟠 HØY

---

## ✅ Løsninger implementert

Alle SQL-scriptene ligger i mappen `database/security-fixes/`.

### 1. Case Management RLS Fix

**Fil:** `database/security-fixes/case-management-rls-fix.sql`

**Endringer:**
- ✅ Erstattet "all authenticated users" med org-spesifikke policies
- ✅ Kun medlemmer av en organisasjon kan se organisasjonens saker
- ✅ Kun org_admin/org_owner kan opprette, redigere og slette saker
- ✅ Brukere kan redigere sine egne kommentarer og stemmer

**Nye policies:**
- `Users can view cases for their org`
- `Org admins can create/update/delete cases`
- `Users can add comments to org cases`
- `Users can update own comments`
- `Users can add votes to org cases`
- `Users can update own votes`

---

### 2. Meetings RLS Fix

**Fil:** `database/security-fixes/meetings-rls-fix.sql`

**Endringer:**
- ✅ Implementert full RLS beskyttelse for møter
- ✅ Kun medlemmer kan se organisasjonens møter
- ✅ Kun org_admin/org_owner kan administrere møter
- ✅ Medlemmer kan oppdatere sin egen RSVP-status
- ✅ Møtereferater beskyttet på samme måte

**Nye policies:**
- `Users can view meetings for their org`
- `Org admins can create/update/delete meetings`
- `Users can view attendees for their org meetings`
- `Members can update own RSVP`
- `Users can view minutes for their org meetings`

---

### 3. Events RLS Fix

**Fil:** `database/security-fixes/events-rls-fix.sql`

**Endringer:**
- ✅ Offentlige arrangementer kan ses av alle (som ønsket)
- ✅ Medlemsarrangementer kun synlige for medlemmer
- ✅ Påmeldinger kun synlige for admin og den som meldte seg på
- ✅ Produkter og tilleggskjøp beskyttet

**Nye policies:**
- `Public can view public events`
- `Members can view org events`
- `Org admins can manage events`
- `Anyone can register for public events`
- `Members can register for member events`
- `Members can view own registrations`
- `Org admins can view all registrations`

---

### 4. Payments RLS Fix

**Fil:** `database/security-fixes/payments-rls-fix.sql`

**Endringer:**
- ✅ Medlemmer kan kun se sine egne betalinger
- ✅ Org admins kan se alle betalinger for sin organisasjon
- ✅ Kun org admins kan opprette, redigere og slette betalinger

**Nye policies:**
- `Members can view own payments`
- `Org admins can view all payments`
- `Org admins can create/update/delete payments`

---

### 5. Audit Logging System

**Fil:** `database/security-fixes/audit-logging.sql`

**Nye tabeller:**

#### `audit_log`
Logger alle sensitive operasjoner:
- Hvem (user_id, email, role)
- Hva (action, resource_type, resource_id)
- Når (created_at)
- Hvor (organization_id)
- Kontekst (metadata JSON)

#### `security_alerts`
Logger sikkerhetsrelaterte hendelser:
- Cross-org tilgang
- Superadmin tilgang til organisasjonsdata
- Bulk eksport av data
- Tilgang til sensitive dokumenter

**Hjelpefunksjon:**
```sql
SELECT log_audit_event(
  'view',                    -- action
  'member',                  -- resource_type
  member_id,                 -- resource_id
  org_id,                    -- organization_id
  'Viewed member profile',   -- description
  '{"ip": "192.168.1.1"}'::jsonb  -- metadata
);
```

**RLS policies:**
- Superadmins kan se alle logger
- Org admins kan se logger for sin organisasjon
- Brukere kan se sine egne logger
- Audit logger er **immutable** (kan ikke endres eller slettes)

---

## 📋 Implementeringsplan

### Fase 1: Kjør SQL-scriptene (Kritisk - gjør ASAP)

**Rekkefølge:**

1. **Først:** Case Management
   ```bash
   psql -h [supabase-host] -U postgres -d postgres -f database/security-fixes/case-management-rls-fix.sql
   ```

2. **Deretter:** Meetings
   ```bash
   psql -h [supabase-host] -U postgres -d postgres -f database/security-fixes/meetings-rls-fix.sql
   ```

3. **Deretter:** Events
   ```bash
   psql -h [supabase-host] -U postgres -d postgres -f database/security-fixes/events-rls-fix.sql
   ```

4. **Deretter:** Payments
   ```bash
   psql -h [supabase-host] -U postgres -d postgres -f database/security-fixes/payments-rls-fix.sql
   ```

5. **Sist:** Audit Logging
   ```bash
   psql -h [supabase-host] -U postgres -d postgres -f database/security-fixes/audit-logging.sql
   ```

**Alternativ (via Supabase Dashboard):**
- Gå til SQL Editor i Supabase
- Kopier innholdet fra hver fil
- Kjør scriptene i samme rekkefølge

**VIKTIG:**
- Test at applikasjonen fungerer etter hver fil
- Sjekk at RLS policies ikke blokkerer legitim tilgang
- Verifiser at cross-org tilgang er blokkert

---

### Fase 2: Implementer audit logging i applikasjonskode (1-2 uker)

**Områder å logge:**

1. **Medlemsadministrasjon**
   - Se medlemsliste
   - Eksportere medlemmer til CSV
   - Se individuelle medlemmer
   - Oppdatere medlemsinformasjon

2. **Dokumenter**
   - Åpne dokumenter
   - Laste ned dokumenter
   - Slette dokumenter

3. **Møter og saker**
   - Åpne møtereferater
   - Se styresaker
   - Opprette/redigere vedtak

4. **Økonomi**
   - Se betalingsoversikt
   - Eksportere økonomiske rapporter
   - Opprette fakturaer

5. **Superadmin-operasjoner**
   - Tilgang til andre organisasjoners dashboards
   - Endringer i abonnementer
   - Støtte-tilgang til kundedata

**Eksempel implementasjon:**

```typescript
// app/actions/members.ts
import { createClient } from '@/lib/supabase/server';

export async function getMembersList(orgId: string) {
  const supabase = createClient();

  // Hent medlemmer
  const { data: members, error } = await supabase
    .from('members')
    .select('*')
    .eq('organization_id', orgId);

  if (!error && members) {
    // Log tilgang
    await supabase.rpc('log_audit_event', {
      p_action: 'view',
      p_resource_type: 'member_list',
      p_resource_id: null,
      p_organization_id: orgId,
      p_description: `Viewed member list (${members.length} members)`,
      p_metadata: { count: members.length }
    });
  }

  return { data: members, error };
}
```

**Opprett hjelpefunksjoner:**

```typescript
// lib/audit-log.ts
import { createClient } from '@/lib/supabase/server';

export async function logAuditEvent({
  action,
  resourceType,
  resourceId,
  organizationId,
  description,
  metadata = {}
}: {
  action: 'view' | 'create' | 'update' | 'delete' | 'export';
  resourceType: string;
  resourceId?: string;
  organizationId: string;
  description: string;
  metadata?: Record<string, any>;
}) {
  const supabase = createClient();

  // Legg til IP-adresse og user agent hvis tilgjengelig
  const enhancedMetadata = {
    ...metadata,
    // Hent fra headers hvis tilgjengelig
  };

  await supabase.rpc('log_audit_event', {
    p_action: action,
    p_resource_type: resourceType,
    p_resource_id: resourceId || null,
    p_organization_id: organizationId,
    p_description: description,
    p_metadata: enhancedMetadata
  });
}
```

---

### Fase 3: Legg til audit log viewer i admin dashboard (1 uke)

**Ny side:** `/org/[slug]/settings/security/audit-log`

**Funksjoner:**
- Vis audit logger for organisasjonen
- Filtrer etter:
  - Action type (view, create, update, delete, export)
  - Resource type (member, document, case, meeting, payment)
  - Bruker
  - Dato-range
- Eksporter til CSV for compliance
- Varsling ved uvanlige mønstre

**For superadmin:** `/superadmin/security/audit-log`
- Se alle logger på tvers av organisasjoner
- Varsling ved cross-org tilgang
- Security alerts dashboard

---

### Fase 4: Personvern og compliance (1 uke)

**Opprett personvernpolicy-side:**

**Fil:** `/app/(marketing)/personvern/page.tsx`

**Innhold som må dekkes:**

1. **Hva slags data samler vi inn?**
   - Medlemsdata (navn, e-post, telefon, adresse, fødselsdato)
   - Betalingsinformasjon
   - Arrangementsdeltagelse
   - Dokumenter lastet opp av organisasjoner
   - Møtereferater og styresaker

2. **Hvem har tilgang til dataene?**
   - Organisasjonens administratorer har full tilgang til sin organisasjons data
   - Medlemmer har tilgang til sine egne data
   - Plattformoperatør (superadmin) har teknisk tilgang til databasen for drift og support

3. **Hvordan brukes dataene?**
   - Kun for formålet organisasjonen har registrert dem for
   - Aldri delt med tredjeparter uten samtykke
   - Aldri brukt til markedsføring uten samtykke

4. **Sikkerhet:**
   - Row Level Security (RLS) på alle tabeller
   - Kryptering i transit (HTTPS) og at rest
   - Audit logging av sensitiv tilgang
   - Regelmessige sikkerhetsgjennomganger

5. **Dine rettigheter (GDPR):**
   - Rett til innsyn
   - Rett til retting
   - Rett til sletting
   - Rett til dataportabilitet
   - Rett til å trekke tilbake samtykke

6. **Datalagring:**
   - Data lagres på Supabase (EU/Norge servere hvis mulig)
   - Backup og disaster recovery
   - Sletting av data når organisasjon avslutter abonnement

**GDPR Compliance Checklist:**
- [ ] Behandlingsgrunnlag dokumentert
- [ ] Databehandleravtale med Supabase
- [ ] Personvernserklæring publisert
- [ ] Samtykke-mekanisme for ikke-obligatoriske data
- [ ] Prosedyre for innsyn, retting, sletting
- [ ] Varslingsrutine ved databrudd

---

## 🔒 Tillitsimplikasjoner og transparens

### Nåværende situasjon

**Hva kan plattformoperatør (superadmin) se?**

#### Via applikasjonen (innlogget som superadmin):
- ✅ Alle medlemmer (navn, e-post, telefon, adresse) - _intendert for statistikk/support_
- ✅ Alle organisasjoner (navn, org.nummer, abonnement)
- ❌ **IKKE** dokumenter fra andre organisasjoner (blokkert av RLS)
- ❌ **IKKE** e-post/SMS-logger fra andre organisasjoner (blokkert av RLS)

#### Via direkte database-tilgang (service role/DB admin):
- ✅ **ALT** - fullstendig tilgang til alle data
- Dette er **normalt for SaaS-plattformer** men krever:
  - Strenge rutiner for når tilgang er tillatt
  - Logging av all tilgang
  - Varsling til kunde ved tilgang til deres data

---

### Anbefalinger for å bygge tillit

#### 1. **Vurder superadmin-tilgang til medlemmer**

**Nåværende policy:**
```sql
CREATE POLICY "Superadmins can see all members"
  ON members FOR ALL
  USING (...);
```

**Problem:**
Dette gir superadmin tilgang til sensitive personopplysninger på tvers av alle organisasjoner.

**Alternativer:**

**Alternativ A: Fjern superadmin-tilgang (strengest)**
```sql
-- Fjern policy helt
DROP POLICY "Superadmins can see all members" ON members;
```
- Superadmin kan bare se aggregert statistikk
- For support: Be kunden om å legge til support-bruker som org_admin midlertidig

**Alternativ B: Audit-logget tilgang (balansert)**
- Behold policy, men log HVER gang superadmin ser medlemsdata
- Generer security alert til organisasjonen
- Krev årsak/support-ticket nummer

**Alternativ C: Break-glass tilgang (best practice)**
```sql
-- Kun tillat når spesiell flag er satt
CREATE POLICY "Superadmins can see members with justification"
  ON members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_org_access
      WHERE organization_id IS NULL
      AND user_id = auth.uid()
      AND role = 'superadmin'
    )
    AND EXISTS (
      SELECT 1 FROM support_access_grants
      WHERE user_id = auth.uid()
      AND organization_id = members.organization_id
      AND expires_at > NOW()
      AND approved_by IS NOT NULL
    )
  );
```

**Anbefaling:** Implementer Alternativ B (audit logging) på kort sikt, vurder Alternativ C (break-glass) på lang sikt.

---

#### 2. **Opprett transparente rutiner**

**Dokument:** `SUPPORT_ACCESS_POLICY.md` (for internt bruk)

**Innhold:**
- Når har support lov til å se kundedata?
  - Aktiv support-sak med ticket-nummer
  - Kritisk systemfeil som må debugges
  - Sikkerhetshendelse
  - ALDRI: Nysgjerrighet, markedsanalyse, benchmarking

- Hvordan dokumenteres tilgang?
  - Logg årsak i audit log
  - Varsle kunde (e-post) innen 24 timer
  - Inkluder ticket-nummer og hva som ble sett

- Hvem har database-tilgang?
  - Kun 1-2 personer (teknisk ansvarlig)
  - 2FA påkrevd
  - IP-begrensning hvis mulig
  - Logg all tilgang

---

#### 3. **Varsle organisasjoner ved tilgang**

**Implementer e-postvarsling:**

```typescript
// Når superadmin får tilgang til organisasjonsdata
async function notifyOrganizationOfAccess(
  orgId: string,
  adminEmail: string,
  reason: string,
  ticketNumber?: string
) {
  const org = await getOrganization(orgId);

  await sendEmail({
    to: org.contact_email,
    subject: 'Medlemsportal Support har fått tilgang til deres data',
    body: `
      Hei ${org.name},

      Dette er en automatisk varsling om at Medlemsportal support har fått
      tilgang til deler av deres organisasjonsdata.

      Årsak: ${reason}
      ${ticketNumber ? `Support-sak: ${ticketNumber}` : ''}
      Tidspunkt: ${new Date().toISOString()}
      Support-bruker: ${adminEmail}

      Dette er gjort i forbindelse med support eller feilsøking.

      Hvis du ikke har kontaktet support eller har spørsmål,
      vennligst kontakt oss umiddelbart på support@medlemsportal.no.

      Med vennlig hilsen,
      Medlemsportal
    `
  });
}
```

---

#### 4. **Publiser sikkerhetspraksis**

**Ny side:** `/sikkerhet` (offentlig)

**Innhold:**
- Hvordan vi beskytter data
- Row Level Security forklart (for tekniske kunder)
- Audit logging
- Hvem har tilgang til hva
- Sertifiseringer (SOC2, ISO27001 når dere får det)
- Bug bounty program (fremtidig)
- Sikkerhetskontakt: security@medlemsportal.no

---

## 📊 Testing og verifisering

### 1. Test RLS policies

**Opprett testbrukere:**

```sql
-- Testbruker 1: Admin i Org A
INSERT INTO user_org_access (user_id, organization_id, role)
VALUES ('user-a-uuid', 'org-a-uuid', 'org_admin');

-- Testbruker 2: Admin i Org B
INSERT INTO user_org_access (user_id, organization_id, role)
VALUES ('user-b-uuid', 'org-b-uuid', 'org_admin');

-- Testbruker 3: Superadmin
INSERT INTO user_org_access (user_id, organization_id, role)
VALUES ('superadmin-uuid', NULL, 'superadmin');
```

**Test case 1: Cross-org tilgang skal IKKE fungere**

```sql
-- Logg inn som Org A admin
SET request.jwt.claims.sub = 'user-a-uuid';

-- Prøv å hente saker fra Org B
SELECT * FROM case_items WHERE org_id = 'org-b-uuid';
-- Forventet resultat: 0 rader (blokkert av RLS)

-- Prøv å opprette sak i Org B
INSERT INTO case_items (org_id, title) VALUES ('org-b-uuid', 'Hack attempt');
-- Forventet resultat: ERROR (blokkert av RLS)
```

**Test case 2: Legitim tilgang skal fungere**

```sql
-- Logg inn som Org A admin
SET request.jwt.claims.sub = 'user-a-uuid';

-- Hent saker fra egen org
SELECT * FROM case_items WHERE org_id = 'org-a-uuid';
-- Forventet resultat: Alle saker fra Org A
```

**Test case 3: Medlemmer kan kun se egne betalinger**

```sql
-- Logg inn som medlem
SET request.jwt.claims.sub = 'member-1-uuid';

-- Hent egne betalinger
SELECT * FROM payment_transactions;
-- Forventet resultat: Kun egne betalinger

-- Prøv å hente andre medlemmers betalinger (via app logic)
-- Skal blokkeres av RLS
```

---

### 2. Test audit logging

```sql
-- Test logging-funksjon
SELECT log_audit_event(
  'view',
  'member',
  'test-member-uuid',
  'test-org-uuid',
  'Test audit log',
  '{"test": true}'::jsonb
);

-- Verifiser at log ble opprettet
SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 1;

-- Test at vanlige brukere ikke kan endre audit logs
UPDATE audit_log SET action = 'delete' WHERE id = '...';
-- Forventet: ERROR (no policy)
```

---

## 🚀 Neste steg

### Umiddelbart (denne uken)
- [ ] Kjør alle SQL-scripts i produksjon
- [ ] Test at applikasjonen fungerer
- [ ] Verifiser at RLS blokkerer cross-org tilgang
- [ ] Informer teamet om endringene

### Kort sikt (1-2 uker)
- [ ] Implementer audit logging i applikasjonskode
- [ ] Legg til audit log viewer for org admins
- [ ] Opprett personvernpolicy-side
- [ ] Test grundig med reelle brukere

### Mellomlang sikt (1-2 måneder)
- [ ] Implementer break-glass access for superadmin
- [ ] Legg til e-postvarsling ved support-tilgang
- [ ] Opprett sikkerhetspraksis-side
- [ ] Gjennomfør ekstern sikkerhetsrevisjon

### Lang sikt (3-6 måneder)
- [ ] SOC2 eller ISO27001 sertifisering
- [ ] Bug bounty program
- [ ] Penetrasjonstesting
- [ ] Vurder end-to-end kryptering for sensitive dokumenter

---

## 📞 Kontakt og spørsmål

Hvis det er spørsmål om disse endringene:

- **Tekniske spørsmål:** Diskuter på Antigravity eller GitHub
- **Sikkerhetsproblemer:** Rapporter umiddelbart via sikker kanal
- **Compliance spørsmål:** Vurder juridisk rådgivning (GDPR)

---

## 📝 Versjonhistorikk

### Versjon 1.0 (2026-01-23)
- Initial sikkerhetshårdening
- Fikset kritiske RLS-hull i case management, møter, events, payments
- Implementert audit logging system
- Dokumentert tillitsimplikasjoner og anbefalinger

---

**Opprettet av:** Claude (Anthropic AI)
**Gjennomgått av:** _[Venter på gjennomgang]_
**Godkjent av:** _[Venter på godkjenning]_
**Implementert dato:** _[Venter på implementering]_

# Stripe Oppsett: Steg-for-steg 💳

Her er oppskriften for å koble Stripe ferdig mot din applikasjon.

## Steg 1: Finn API-nøkler (Allerede gjort?)
1. Logg inn på [Stripe Dashboard](https://dashboard.stripe.com/).
2. Sørg for at du er i **Test Mode** (Oransje bryter oppe til høyre).
3. Gå til **Developers** -> **API keys**.
4. Kopier **Publishable key** (`pk_test_...`) og **Secret key** (`sk_test_...`).
5. Disse skal inn i Vercel under Environment Variables som `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` og `STRIPE_SECRET_KEY`.

## Steg 2: Opprett Webhook (Viktig for automatisk bekreftelse)
For at systemet skal vite at kunden faktisk har betalt, må Stripe sende en beskjed tilbake til oss.

1. Gå til **Developers** -> **Webhooks**.
2. Klikk på knappen **+ Add endpoint**.
3. I feltet **Endpoint URL**, skriv inn:
   ```
   https://medlemsportalen.smeb.no/api/webhooks/stripe
   ```
   *(Sjekk at det ikke er mellomrom før eller etter)*
4. Under **Select events to listen to**, klikk **+ Select events**.
5. Søk opp og velg: `checkout.session.completed`.
6. Klikk **Add events**.
7. Klikk **Add endpoint** nederst for å lagre.

## Steg 3: Hent Webhook Secret (Signing Secret)
1. Når du har opprettet webhook-en (fra Steg 2), vil du se en side med detaljer for denne webhook-en.
2. Se etter seksjonen **Signing secret** (oppe til høyre).
3. Klikk **Reveal** for å se nøkkelen. Den starter på `whsec_...`.
4. Kopier hele denne nøkkelen.

## Steg 4: Legg inn i Vercel
1. Gå til ditt prosjekt på [Vercel Dashboard](https://vercel.com/dashboard).
2. Gå til **Settings** -> **Environment Variables**.
3. Legg til en ny variabel:
   - **Key:** `STRIPE_WEBHOOK_SECRET`
   - **Value:** (Lim inn `whsec_...` nøkkelen fra Steg 3)
4. **Viktig:** For at endringen skal tre i kraft, må du enten redeploye appen (gå til Deployments -> Redeploy) eller den trer i kraft ved neste 'push'. Det enkleste er å gå til siste Deployment -> "Redeploy".

## Steg 5: Aktiver Betalingsmetoder
1. Gå til **Settings** (tannhjulet) -> **Payment methods** i Stripe.
2. Sørg for at **Cards** (Visa/Mastercard) er slått på.
3. (Valgfritt) Du kan også slå på **Vipps** hvis du vil teste det, men det krever ofte litt mer oppsett. Start med kort.

## Ferdig! 🚀
Nå kan du prøve å booke en ressurs som koster penger.
1. Gå til portalen.
2. Velg en ressurs med pris.
3. Book tidspunkt.
4. Du skal bli sendt til Stripe for betaling.
5. Bruk kortnummer `4242 4242 4242 4242` (Test-kort), utløpsdato frem i tid, og valgfri CVC (f.eks 123).
6. Når betalingen er godkjent, skal du bli sendt tilbake til "Mine bookinger" med status "Bekreftet/Betalt".

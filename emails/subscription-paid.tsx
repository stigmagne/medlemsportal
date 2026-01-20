import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Section,
    Text
} from '@react-email/components'

interface SubscriptionPaidEmailProps {
    orgName: string;
    year: number;
}

export default function SubscriptionPaidEmail({
    orgName,
    year
}: SubscriptionPaidEmailProps) {
    return (
        <Html>
            <Head />
            <Preview>Årsabonnement dekket!</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading style={h1}>🎉 Gratulerer!</Heading>

                    <Text style={text}>
                        Hei {orgName},
                    </Text>

                    <Text style={text}>
                        Årsabonnementet for {year} på 990 kr er nå fullt dekket
                        gjennom medlemsinnbetalinger!
                    </Text>

                    <Section style={infoBox}>
                        <Text style={infoText}>
                            <strong>Fra nå av gjelder normalt gebyr:</strong><br />
                            5 kr + 2,5% per betaling
                        </Text>
                    </Section>

                    <Text style={text}>
                        Se full betalingsoversikt i dashboardet.
                    </Text>

                    <Text style={footer}>
                        Mvh,<br />
                        Din Forening
                    </Text>
                </Container>
            </Body>
        </Html>
    )
}

const main = {
    backgroundColor: '#f6f9fc',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '20px 0 48px',
    marginBottom: '64px',
}

const h1 = {
    color: '#333',
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '40px 0',
    padding: '0',
    textAlign: 'center' as const,
}

const text = {
    color: '#333',
    fontSize: '16px',
    lineHeight: '26px',
    margin: '16px 0',
}

const infoBox = {
    backgroundColor: '#f0f9ff',
    border: '1px solid #bae6fd',
    borderRadius: '8px',
    padding: '16px',
    margin: '24px 0',
}

const infoText = {
    color: '#0c4a6e',
    fontSize: '14px',
    lineHeight: '24px',
    margin: 0,
}

const footer = {
    color: '#8898aa',
    fontSize: '14px',
    lineHeight: '24px',
    marginTop: '32px',
}

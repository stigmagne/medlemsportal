import { redirect } from 'next/navigation'

export default async function BookingPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    redirect(`/org/${slug}/booking/kalender`)
}

import { getCase, getCaseVotes, getCaseComments } from '../actions'
import { notFound } from 'next/navigation'
import VotingClient from './VotingClient'

export default async function VotingPage({
    params
}: {
    params: Promise<{ slug: string; id: string }>
}) {
    const { slug, id } = await params
    const caseItem = await getCase(id, slug)

    if (!caseItem) notFound()

    // Fetch initial data
    const votes = await getCaseVotes(id, slug)
    const comments = await getCaseComments(id, slug)

    return (
        <VotingClient
            caseItem={caseItem}
            initialVotes={votes}
            initialComments={comments}
            slug={slug}
            id={id}
        />
    )
}

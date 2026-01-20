'use client'

import { useState, useTransition } from 'react'
import { castVote, addComment } from '../actions'
import { useRouter } from 'next/navigation'

export default function VotingClient({
    caseItem,
    initialVotes,
    initialComments,
    slug,
    id
}: {
    caseItem: any,
    initialVotes: any[],
    initialComments: any[],
    slug: string,
    id: string
}) {
    const [votes, setVotes] = useState(initialVotes)
    const [comments, setComments] = useState(initialComments)
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    // Calculate results
    const support = votes.filter(v => v.vote === 'support').length
    const oppose = votes.filter(v => v.vote === 'oppose').length
    const abstain = votes.filter(v => v.vote === 'abstain').length
    const total = votes.length
    const required = caseItem.required_votes || 0

    const handleVote = (vote: 'support' | 'oppose' | 'abstain') => {
        if (!confirm(`Er du sikker på at du vil stemme ${vote === 'support' ? 'FOR' : vote === 'oppose' ? 'MOT' : 'AVSTÅR'}?`)) return

        startTransition(async () => {
            const res = await castVote(id, vote)
            if (res.error) {
                alert(res.error)
            } else {
                // Optimistic update or refetch
                // For MVP rely on revalidatePath in action + router.refresh
                router.refresh()
                // Also locally simulate for instant feedback?
                // setVotes(...) would require knowing current user ID, skipping for simplicity of revalidation
                sessionStorage.setItem('mock_notification', 'Stemme registrert!')
            }
        })
    }

    const [comment, setComment] = useState('')
    const handleComment = (e: React.FormEvent) => {
        e.preventDefault()
        if (!comment.trim()) return

        startTransition(async () => {
            const res = await addComment(id, comment)
            if (res.error) {
                alert(res.error)
            } else {
                setComment('')
                router.refresh()
            }
        })
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
            {/* Header */}
            <div>
                <Link href={`/org/${slug}/saker/${id}`} className="text-sm text-gray-500 hover:text-gray-900 mb-4 inline-block">
                    ← Tilbake til sak
                </Link>
                <div className="flex items-center gap-3 mb-2">
                    <span className="bg-purple-100 text-purple-800 text-xs font-mono font-semibold px-2.5 py-0.5 rounded">
                        RETT: {required} stemmer
                    </span>
                    <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded text-xs font-medium">
                        Digital Avstemning
                    </span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900">{caseItem.title}</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Voting Section */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="font-semibold text-gray-900 mb-6">Avgi din stemme</h3>

                        <div className="grid grid-cols-3 gap-4">
                            <button
                                onClick={() => handleVote('support')}
                                disabled={isPending}
                                className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-green-100 bg-green-50 hover:bg-green-100 hover:border-green-300 transition-all text-green-800"
                            >
                                <span className="text-2xl">👍</span>
                                <span className="font-bold text-sm">FOR</span>
                            </button>

                            <button
                                onClick={() => handleVote('oppose')}
                                disabled={isPending}
                                className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-red-100 bg-red-50 hover:bg-red-100 hover:border-red-300 transition-all text-red-800"
                            >
                                <span className="text-2xl">👎</span>
                                <span className="font-bold text-sm">MOT</span>
                            </button>

                            <button
                                onClick={() => handleVote('abstain')}
                                disabled={isPending}
                                className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 transition-all text-gray-600"
                            >
                                <span className="text-2xl">😐</span>
                                <span className="font-bold text-sm">AVSTÅR</span>
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-4 text-center">
                            Din stemme blir registrert med fullt navn i protokollen.
                        </p>
                    </div>

                    {/* Results Live */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="font-semibold text-gray-900 mb-6">Foreløpig resultat</h3>

                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-700">For</span>
                                    <span className="font-medium text-gray-900">{support}</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500" style={{ width: `${total ? (support / total) * 100 : 0}%` }} />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-700">Mot</span>
                                    <span className="font-medium text-gray-900">{oppose}</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-red-500" style={{ width: `${total ? (oppose / total) * 100 : 0}%` }} />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-700">Avstår</span>
                                    <span className="font-medium text-gray-900">{abstain}</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-gray-500" style={{ width: `${total ? (abstain / total) * 100 : 0}%` }} />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                                <span className="text-sm text-gray-600">Totalt avgitt</span>
                                <span className="font-bold text-gray-900">{total} / {required * 2 - 1 /* Approx */}</span>
                                {/* Required is majority, so total board size is roughly derived or just show total */}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Discussion */}
                <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <h3 className="font-semibold text-gray-900">Diskusjon</h3>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {comments.length === 0 && (
                            <div className="text-center text-gray-500 py-10 italic text-sm">
                                Ingen kommentarer enda. Start diskusjonen!
                            </div>
                        )}
                        {comments.map((c: any) => (
                            <div key={c.id} className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                                    {c.member?.first_name?.[0]}{c.member?.last_name?.[0]}
                                </div>
                                <div className="flex-1">
                                    <div className="bg-gray-50 p-3 rounded-lg rounded-tl-none">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-semibold text-sm text-gray-900">
                                                {c.member?.first_name} {c.member?.last_name}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-700">{c.content}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
                        <form onSubmit={handleComment} className="relative">
                            <input
                                type="text"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Skriv en kommentar..."
                                className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                            />
                            <button
                                type="submit"
                                disabled={!comment.trim() || isPending}
                                className="absolute right-2 top-2 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

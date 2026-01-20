'use client'

import { useState } from 'react'
import { Campaign, sendCampaign } from './actions'

export default function CampaignList({ campaigns, org_id }: { campaigns: Campaign[], org_id: string }) {
    const [sendingId, setSendingId] = useState<string | null>(null)
    const [confirmData, setConfirmData] = useState<{ id: string, subject: string } | null>(null)

    const handleSendClick = (id: string, subject: string) => {
        setConfirmData({ id, subject })
    }

    const handleConfirmSend = async () => {
        if (!confirmData) return
        const { id } = confirmData
        setConfirmData(null) // Close modal

        setSendingId(id)
        try {
            const res = await sendCampaign(org_id, id)
            if (res.error) alert('Feil: ' + res.error)
            else alert(`Sendt til ${res.count} medlemmer!`)
        } catch (e) {
            console.error(e)
            alert('En feil oppstod.')
        }
        setSendingId(null)
    }

    return (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
            {confirmData && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Er du sikker?</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            Vil du sende kampanjen "{confirmData.subject}" til alle mottakere nå?
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setConfirmData(null)}
                                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                            >
                                Avbryt
                            </button>
                            <button
                                onClick={handleConfirmSend}
                                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded"
                            >
                                Send Nå
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {campaigns.length === 0 ? (
                    <li className="px-6 py-8 text-center text-gray-500">Ingen kampanjer ennå.</li>
                ) : (
                    campaigns.map((camp) => (
                        <li key={camp.id} className="px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {camp.subject}
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Opprettet: {new Date(camp.created_at).toLocaleDateString()}
                                    </p>
                                    {camp.sent_at && (
                                        <p className="text-xs text-gray-400">
                                            Sendt: {new Date(camp.sent_at).toLocaleString()} ({camp.recipient_count} mottakere)
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`px-2 py-1 text-xs rounded-full capitalize ${camp.status === 'sent' ? 'bg-green-100 text-green-800' :
                                        camp.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                                            'bg-blue-100 text-blue-800'
                                        }`}>
                                        {camp.status}
                                    </span>

                                    {camp.status === 'draft' && (
                                        <button
                                            onClick={() => handleSendClick(camp.id, camp.subject)}
                                            disabled={!!sendingId}
                                            className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded disabled:opacity-50"
                                        >
                                            {sendingId === camp.id ? 'Sender...' : 'Send Nå'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </li>
                    ))
                )}
            </ul>
        </div>
    )
}

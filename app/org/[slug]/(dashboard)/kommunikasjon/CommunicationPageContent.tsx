'use client'

import { useState } from 'react'
import CampaignList from './CampaignList'
import NewCampaignForm from './NewCampaignForm'
import { Campaign } from './actions'

// NOTE: This is a client component wrapper that receives data from the server page component
// But wait, it's easier to make the page server component pass data to client components.
// We'll rename this file to ClientPage.tsx or something similar if we want to keep state?
// Let's stick to simple "Page" structure.

export default function CommunicationPageContent({
    campaigns,
    orgSlug
}: {
    campaigns: Campaign[]
    orgSlug: string
}) {
    const [isCreating, setIsCreating] = useState(false)

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-5">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Kommunikasjon
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Send nyhetsbrev og beskjeder til dine medlemmer.
                    </p>
                </div>
                {!isCreating && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                    >
                        + Ny E-post
                    </button>
                )}
            </div>

            {isCreating ? (
                <NewCampaignForm orgSlug={orgSlug} onSuccess={() => setIsCreating(false)} />
            ) : (
                <CampaignList campaigns={campaigns} orgSlug={orgSlug} />
            )}
        </div>
    )
}

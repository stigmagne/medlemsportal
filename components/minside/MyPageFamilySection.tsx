'use client'

export default function MyPageFamilySection({ family, currentMemberId }: any) {
    if (!family) return null

    const isPayer = family.payer_member_id === currentMemberId
    const totalFee = family.family_members.reduce((sum: number, m: any) => sum + (m.fee || 0), 0)

    return (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6 border-l-4 border-blue-500">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Familiemedlemskap: {family.family_name}
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Medlemmer:</p>
                    <ul className="space-y-2">
                        {family.family_members.map((m: any) => (
                            <li key={m.id} className="flex justify-between text-sm">
                                <span className={m.id === currentMemberId ? "font-bold" : ""}>
                                    {m.first_name} {m.last_name} {m.id === currentMemberId ? '(deg)' : ''}
                                </span>
                                <span className="text-gray-600 dark:text-gray-300">
                                    {m.fee} kr
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                    <div className="mb-4">
                        <span className="block text-sm text-gray-500">Total årskontingent</span>
                        <span className="text-2xl font-bold">{totalFee} kr</span>
                    </div>

                    {isPayer ? (
                        <div>
                            <div className="flex items-center text-green-600 mb-2">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                <span className="font-medium">Du er betalingsansvarlig</span>
                            </div>
                            <p className="text-sm text-gray-600 mb-4">
                                Du vil motta én samlet faktura for hele familien.
                            </p>
                            {/* Payment button could go here if integrated with payment system */}
                        </div>
                    ) : (
                        <div>
                            <p className="text-sm text-gray-600">
                                Betales av: <span className="font-medium">{family.payer.first_name} {family.payer.last_name}</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                                Kontakt betalingsansvarlig hvis du har spørsmål om medlemskapet.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

import Link from 'next/link'

export default function SuperadminSettings() {
    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                Instillinger
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link
                    href="/superadmin/settings/plans"
                    className="group block bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-transparent hover:border-blue-500"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                            Abonnementstyper
                        </h2>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                        Administrer typer av abonnement, priser og funksjoner som er tilgjengelig for foreninger.
                    </p>
                </Link>

                {/* Future settings can go here */}
            </div>
        </div>
    )
}

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Medlemsportalen
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        For frivillige organisasjoner
                    </p>
                </div>
                {children}
                <div className="mt-8 text-center space-x-4">
                    <a href="/personvern" className="text-xs text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
                        Personvernerklæring
                    </a>
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                    <a href="/databehandleravtale" className="text-xs text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
                        Databehandleravtale
                    </a>
                </div>
            </div>
        </div>
    )
}

export default function OnboardingLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                {/* Potentially Logo here */}
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-3xl">
                {children}
            </div>
        </div>
    )
}

'use client'

export default function ProgressBar({ currentStep, totalSteps = 6 }: { currentStep: number, totalSteps?: number }) {
    const percent = Math.min(100, Math.max(0, ((currentStep - 1) / totalSteps) * 100))

    return (
        <div className="w-full max-w-3xl mx-auto mb-8">
            <div className="flex justify-between text-sm font-medium text-gray-500 mb-2">
                <span>Steg {currentStep} av {totalSteps}</span>
                <span>{Math.round(percent)}% ferdig</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-in-out"
                    style={{ width: `${percent}%` }}
                ></div>
            </div>
        </div>
    )
}

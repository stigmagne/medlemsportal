'use client'

import { useState } from 'react'
import UploadStep from './steps/UploadStep'
import MappingStep from './steps/MappingStep'
import PreviewStep from './steps/PreviewStep'
import ImportStep from './steps/ImportStep'
import Link from 'next/link'

export type ImportState = {
    file: File | null
    data: any[]
    headers: string[]
    mapping: Record<string, string> // Database Field -> CSV Header
}

const STEPS = [
    { title: 'Last opp', component: UploadStep },
    { title: 'Koble kolonner', component: MappingStep },
    { title: 'Se over', component: PreviewStep },
    { title: 'Importer', component: ImportStep },
]

export default function ImportWizard({ org_id, slug }: { org_id: string, slug: string }) {
    const [currentStep, setCurrentStep] = useState(0)
    const [importState, setImportState] = useState<ImportState>({
        file: null,
        data: [],
        headers: [],
        mapping: {},
    })

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1)
        }
    }

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1)
        }
    }

    const StepComponent = STEPS[currentStep].component

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            {/* Steps Indicator */}
            <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex space-x-8">
                        {STEPS.map((step, index) => (
                            <div key={index} className="flex items-center">
                                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${index <= currentStep
                                        ? 'border-blue-600 bg-blue-600 text-white'
                                        : 'border-gray-300 text-gray-400'
                                    }`}>
                                    {index + 1}
                                </div>
                                <span className={`ml-3 text-sm font-medium ${index <= currentStep
                                        ? 'text-blue-600 dark:text-blue-400'
                                        : 'text-gray-500'
                                    }`}>
                                    {step.title}
                                </span>
                                {index < STEPS.length - 1 && (
                                    <div className="ml-8 w-16 h-0.5 bg-gray-200 dark:bg-gray-700 hidden sm:block" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Step Content */}
            <div className="p-6">
                <StepComponent
                    state={importState}
                    setState={setImportState}
                    onNext={handleNext}
                    onBack={handleBack}
                    org_id={org_id}
                    slug={slug}
                />
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between">
                <Link
                    href={`/org/${slug}/medlemmer`}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                    Avbryt og gå tilbake
                </Link>
            </div>
        </div>
    )
}

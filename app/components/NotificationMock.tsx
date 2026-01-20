'use client'

import { useState, useEffect } from 'react'

export default function NotificationMock() {
    const [show, setShow] = useState(false)
    const [message, setMessage] = useState('')

    useEffect(() => {
        // Mock checking for notifications
        const check = () => {
            const msg = sessionStorage.getItem('mock_notification')
            if (msg) {
                setMessage(msg)
                setShow(true)
                sessionStorage.removeItem('mock_notification')
                setTimeout(() => setShow(false), 5000)
            }
        }

        check()
        const interval = setInterval(check, 1000)
        return () => clearInterval(interval)
    }, [])

    if (!show) return null

    return (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-bottom-5">
            <div className="flex items-center gap-3">
                <div className="bg-green-500 rounded-full p-1">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                    <p className="font-medium text-sm">Varsling sendt</p>
                    <p className="text-xs text-gray-300">{message}</p>
                </div>
                <button onClick={() => setShow(false)} className="ml-2 text-gray-400 hover:text-white">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
        </div>
    )
}

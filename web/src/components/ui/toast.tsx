'use client'

import * as React from 'react'
import { createContext, useCallback, useContext, useState } from 'react'

interface Toast {
    id: string
    title: string
    description?: string
    variant?: 'default' | 'destructive' | 'success'
}

interface ToastContextType {
    toasts: Toast[]
    addToast: (toast: Omit<Toast, 'id'>) => void
    removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substr(2, 9)
        const newToast = { ...toast, id }

        setToasts((prev) => [...prev, newToast])

        // Auto remove after 5 seconds
        setTimeout(() => {
            removeToast(id)
        }, 5000)
    }, [])

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, [])

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
            <ToastContainer />
        </ToastContext.Provider>
    )
}

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within ToastProvider')
    }

    return {
        toast: context.addToast
    }
}

function ToastContainer() {
    const { toasts, removeToast } = useContext(ToastContext)!

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2">
            {toasts.map((toast) => (
                <ToastItem
                    key={toast.id}
                    toast={toast}
                    onRemove={() => removeToast(toast.id)}
                />
            ))}
        </div>
    )
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
    const [isVisible, setIsVisible] = useState(false)

    React.useEffect(() => {
        setIsVisible(true)
    }, [])

    const handleClose = () => {
        setIsVisible(false)
        setTimeout(onRemove, 300) // Wait for animation
    }

    const getToastStyles = () => {
        switch (toast.variant) {
            case 'destructive':
                return 'bg-red-50 border-red-200 text-red-800'
            case 'success':
                return 'bg-green-50 border-green-200 text-green-800'
            default:
                return 'bg-white border-gray-200 text-gray-900'
        }
    }

    const getIconColor = () => {
        switch (toast.variant) {
            case 'destructive':
                return 'text-red-500'
            case 'success':
                return 'text-green-500'
            default:
                return 'text-blue-500'
        }
    }

    return (
        <div
            className={`
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${getToastStyles()}
        min-w-80 max-w-sm p-4 border rounded-lg shadow-lg
      `}
        >
            <div className="flex items-start">
                <div className="flex-shrink-0">
                    {toast.variant === 'destructive' ? (
                        <svg className={`h-5 w-5 ${getIconColor()}`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    ) : toast.variant === 'success' ? (
                        <svg className={`h-5 w-5 ${getIconColor()}`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <svg className={`h-5 w-5 ${getIconColor()}`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    )}
                </div>
                <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium">{toast.title}</h3>
                    {toast.description && (
                        <p className="mt-1 text-sm opacity-90">{toast.description}</p>
                    )}
                </div>
                <div className="ml-4 flex-shrink-0">
                    <button
                        onClick={handleClose}
                        className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    )
}
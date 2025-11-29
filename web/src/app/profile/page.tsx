'use client'

import { useToast } from '@/components/ui/toast'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

// Declare Razorpay type for TypeScript
declare global {
    interface Window {
        Razorpay: any;
    }
}

interface User {
    name: string;
    email: string;
    picture: string;
    isPremium?: boolean;
    premiumExpiresAt?: string;
}

interface SubscriptionPlan {
    id: string;
    name: string;
    months: number;
    price: number;
    originalPrice?: number;
    features: string[];
    popular?: boolean;
}

const subscriptionPlans: SubscriptionPlan[] = [
    {
        id: 'monthly',
        name: 'Monthly',
        months: 1,
        price: 100,
        features: [
            'Standard AI Analysis',
            'Advanced AI Analysis',
            'Unlimited Test Cases',
            'Priority Support'
        ]
    },
    {
        id: 'semi-annual',
        name: '6 Months',
        months: 6,
        price: 500,
        originalPrice: 600,
        features: [
            'Standard AI Analysis',
            'Advanced AI Analysis',
            'Unlimited Test Cases',
            'Priority Support',
            '2 Months Free'
        ],
        popular: true
    },
    {
        id: 'annual',
        name: 'Annual',
        months: 12,
        price: 900,
        originalPrice: 1200,
        features: [
            'Standard AI Analysis',
            'Advanced AI Analysis',
            'Unlimited Test Cases',
            'Priority Support',
            '3 Months Free'
        ]
    }
]

export default function Profile() {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isUpdating, setIsUpdating] = useState(false)
    const [isCheckingAuth, setIsCheckingAuth] = useState(true)
    const [name, setName] = useState('')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [isProcessingPayment, setIsProcessingPayment] = useState(false)
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
    const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false)
    const { toast } = useToast()
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Fetch current user data
    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const response = await axios.get(
                    `api/user/getCurrentUser`,
                    {
                        withCredentials: true,
                        headers: {
                            'ngrok-skip-browser-warning': 'true',

                        }
                    }
                )

                if (response.status === 200 && response.data && response.data.data) {
                    const userData = response.data.data
                    setUser(userData)
                    setName(userData.name || '')
                } else {
                    router.push('/signin')
                }
            } catch (error: any) {
                if (error.response?.status === 401) {
                    toast({
                        title: 'Session Expired',
                        description: 'Please sign in again',
                        variant: 'destructive'
                    })
                }

                router.push('/signin')
            } finally {
                setIsLoading(false)
                setIsCheckingAuth(false)
            }
        }

        fetchCurrentUser()
    }, [router, toast])

    // Check if Razorpay script is loaded
    useEffect(() => {
        const checkRazorpay = () => {
            if (window.Razorpay) {
                setIsRazorpayLoaded(true)
            } else {
                // Check again after a short delay
                setTimeout(checkRazorpay, 500)
            }
        }

        checkRazorpay()
    }, [])

    // Handle file selection
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast({
                    title: 'Invalid File Type',
                    description: 'Please select an image file',
                    variant: 'destructive'
                })
                return
            }

            // Validate file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                toast({
                    title: 'File Too Large',
                    description: 'Please select an image smaller than 5MB',
                    variant: 'destructive'
                })
                return
            }

            setSelectedFile(file)

            // Create preview URL
            const url = URL.createObjectURL(file)
            setPreviewUrl(url)
        }
    }

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsUpdating(true)
        setUploadProgress(0)

        try {
            // Check if there are changes to make
            if (!selectedFile && name === user?.name) {
                toast({
                    title: 'No Changes',
                    description: 'No changes detected to update',
                    variant: 'default'
                })
                setIsUpdating(false)
                return
            }

            // Create FormData for multipart/form-data request
            const formData = new FormData()

            // Add name if changed
            if (name !== user?.name) {
                formData.append('name', name)
            }

            // Add file if selected (send actual file, not base64)
            if (selectedFile) {
                formData.append('picture', selectedFile)
            }

            const response = await axios.put(
                `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/user/updateUserDetails`,
                formData,
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    onUploadProgress: (progressEvent) => {
                        if (selectedFile && progressEvent.total) {
                            const progress = Math.round(
                                (progressEvent.loaded * 100) / progressEvent.total
                            )
                            setUploadProgress(progress)
                        }
                    }
                }
            )

            if (response.status === 200) {
                const updatedUser = response.data.data
                setUser(updatedUser)
                setSelectedFile(null)
                setPreviewUrl(null)

                // Reset form
                if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                }

                toast({
                    title: 'Success',
                    description: 'Profile updated successfully!',
                    variant: 'default'
                })
            }
        } catch (error: any) {
            if (error.response?.status === 401) {
                toast({
                    title: 'Session Expired',
                    description: 'Please sign in again',
                    variant: 'destructive'
                })
                router.push('/signin')
            } else if (error.response?.status === 413) {
                toast({
                    title: 'File Too Large',
                    description: 'Please select a smaller image file',
                    variant: 'destructive'
                })
            } else {
                toast({
                    title: 'Error',
                    description: error.response?.data?.message || 'Failed to update profile',
                    variant: 'destructive'
                })
            }
        } finally {
            setIsUpdating(false)
            setUploadProgress(0)
        }
    }

    // Remove selected image
    const removeSelectedImage = () => {
        setSelectedFile(null)
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl)
            setPreviewUrl(null)
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    // Handle subscription purchase
    const handleSubscriptionPurchase = async (plan: SubscriptionPlan) => {
        // Check if Razorpay is loaded first
        if (!isRazorpayLoaded || !window.Razorpay) {
            toast({
                title: 'Payment Error',
                description: 'Payment gateway is still loading. Please wait a moment and try again.',
                variant: 'destructive'
            })
            return
        }

        setIsProcessingPayment(true)
        setSelectedPlan(plan.id)

        try {
            // Create order on backend
            const orderResponse = await axios.post(
                `/api/subscription/createOrder`,
                {
                    month: plan.months,
                    currency: 'INR'
                },
                {
                    withCredentials: true
                }
            )

            const { orderId, amount, currency } = orderResponse.data.data

            // Initialize Razorpay
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_your_key_id',
                amount: amount,
                currency: currency,
                name: 'Test Case Generator',
                description: `${plan.name} Subscription`,
                order_id: orderId,
                handler: async function (response: any) {
                    try {
                        window.location.reload()
                    } catch (error: any) {
                      
                    }
                },
                prefill: {
                    name: user?.name,
                    email: user?.email
                },
                theme: {
                    color: '#059669'
                },
                modal: {
                    ondismiss: function () {
                        setIsProcessingPayment(false)
                        setSelectedPlan(null)
                    }
                }
            }

            // @ts-ignore
            const rzp = new window.Razorpay(options)
            rzp.open()

        } catch (error: any) {
            toast({
                title: 'Payment Failed',
                description: error.response?.data?.message || 'Failed to initiate payment.',
                variant: 'destructive'
            })
        } finally {
            setIsProcessingPayment(false)
            setSelectedPlan(null)
        }
    }

    // Format date for subscription expiry
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    // Loading state
    if (isCheckingAuth || isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                    <p className="text-emerald-700 font-medium">Loading profile...</p>
                </div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-emerald-800 mb-2">
                        Profile Settings
                    </h1>
                    <p className="text-emerald-600">
                        Update your profile information
                    </p>
                </div>

                {/* Profile Form */}
                <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 border border-emerald-200">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Profile Picture Section */}
                        <div className="text-center">
                            <label className="block text-sm font-semibold text-emerald-800 mb-4">
                                Profile Picture
                            </label>

                            {/* Current/Preview Image */}
                            <div className="relative inline-block mb-4">
                                <img
                                    src={previewUrl || user.picture || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'}
                                    alt="Profile"
                                    className="w-32 h-32 rounded-full object-cover border-4 border-emerald-200 shadow-lg"
                                />
                                {previewUrl && (
                                    <button
                                        type="button"
                                        onClick={removeSelectedImage}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>

                            {/* Upload Progress */}
                            {uploadProgress > 0 && uploadProgress < 100 && (
                                <div className="mb-4">
                                    <div className="bg-emerald-100 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-emerald-600 h-full transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-sm text-emerald-600 mt-1">{uploadProgress}% uploaded</p>
                                </div>
                            )}

                            {/* File Input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                                id="picture-upload"
                            />

                            {/* Upload Button */}
                            <label
                                htmlFor="picture-upload"
                                className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer transition-colors"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                {selectedFile ? 'Change Picture' : 'Upload Picture'}
                            </label>

                            <p className="text-xs text-gray-500 mt-2">
                                PNG, JPG, GIF up to 5MB
                            </p>
                        </div>

                        {/* Name Field */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-semibold text-emerald-800 mb-2">
                                Display Name
                            </label>
                            <input
                                type="text"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-700"
                                placeholder="Enter your display name"
                                disabled={isUpdating}
                            />
                        </div>

                        {/* Email Field (Read-only) */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-emerald-800 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={user.email}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                                disabled
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Email cannot be changed
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 pt-4">
                            <button
                                type="submit"
                                disabled={isUpdating}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:cursor-not-allowed"
                            >
                                {isUpdating ? (
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        Updating...
                                    </div>
                                ) : (
                                    'Update Profile'
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => router.push('/')}
                                className="px-6 py-3 border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white font-semibold rounded-lg transition-colors"
                            >
                                Back to Home
                            </button>
                        </div>
                    </form>
                </div>

                {/* Subscription Section */}
                <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 border border-emerald-200 mt-8">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-emerald-800 mb-2">
                            Subscription Management
                        </h2>
                        <p className="text-emerald-600">
                            Manage your premium subscription
                        </p>
                    </div>

                    {/* Current Status */}
                    <div className="mb-8 p-4 rounded-lg border-2 border-emerald-200 bg-emerald-50">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-emerald-800">
                                    Current Status
                                </h3>
                                <p className="text-emerald-600">
                                    {user.isPremium ? (
                                        <>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 mr-2">
                                                Premium Active
                                            </span>
                                            {user.premiumExpiresAt && (
                                                <span className="text-sm">
                                                    Expires on {formatDate(user.premiumExpiresAt)}
                                                </span>
                                            )}
                                        </>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            Free Plan
                                        </span>
                                    )}
                                </p>
                            </div>
                            {user.isPremium && (
                                <div className="text-emerald-600">
                                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Subscription Plans */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {subscriptionPlans.map((plan) => (
                            <div
                                key={plan.id}
                                className={`relative rounded-lg border-2 p-6 ${plan.popular
                                    ? 'border-emerald-500 bg-emerald-50'
                                    : 'border-gray-200 bg-white'
                                    } hover:shadow-lg transition-shadow`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-500 text-white">
                                            Most Popular
                                        </span>
                                    </div>
                                )}

                                <div className="text-center">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        {plan.name}
                                    </h3>

                                    <div className="mb-4">
                                        <span className="text-3xl font-bold text-gray-900">
                                            ₹{plan.price}
                                        </span>
                                        {plan.originalPrice && (
                                            <span className="text-lg text-gray-500 line-through ml-2">
                                                ₹{plan.originalPrice}
                                            </span>
                                        )}
                                        <p className="text-sm text-gray-600">
                                            for {plan.months} month{plan.months > 1 ? 's' : ''}
                                        </p>
                                    </div>

                                    <ul className="text-sm text-gray-600 mb-6 space-y-2">
                                        {plan.features.map((feature, index) => (
                                            <li key={index} className="flex items-center">
                                                <svg className="w-4 h-4 text-emerald-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        onClick={() => handleSubscriptionPurchase(plan)}
                                        disabled={isProcessingPayment || user.isPremium || !isRazorpayLoaded}
                                        className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors ${user.isPremium || !isRazorpayLoaded
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : plan.popular
                                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                            } ${isProcessingPayment && selectedPlan === plan.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {!isRazorpayLoaded ? (
                                            <div className="flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                                                Loading Payment...
                                            </div>
                                        ) : isProcessingPayment && selectedPlan === plan.id ? (
                                            <div className="flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Processing...
                                            </div>
                                        ) : user.isPremium ? (
                                            'Already Subscribed'
                                        ) : (
                                            `Choose ${plan.name}`
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Features Info */}
                    <div className="mt-8 p-4 rounded-lg bg-gray-50 border border-gray-200">
                        <h4 className="text-lg font-semibold text-gray-800 mb-3">
                            Premium Features Include:
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="flex items-start">
                                <svg className="w-5 h-5 text-emerald-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <strong>Standard AI Analysis:</strong> Get detailed analysis of your code with standard AI models.
                                </div>
                            </div>
                            <div className="flex items-start">
                                <svg className="w-5 h-5 text-emerald-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <strong>Advanced AI Analysis:</strong> Access to advanced AI models for deeper code insights.
                                </div>
                            </div>
                            <div className="flex items-start">
                                <svg className="w-5 h-5 text-emerald-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <strong>Unlimited Test Cases:</strong> Generate unlimited test cases for all your projects.
                                </div>
                            </div>
                            <div className="flex items-start">
                                <svg className="w-5 h-5 text-emerald-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <strong>Priority Support:</strong> Get faster response times for support requests.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
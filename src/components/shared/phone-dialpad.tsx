'use client'

import { useState, useCallback } from 'react'
import { Delete, Phone, Check, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PhoneDialpadProps {
    onSubmit: (phoneNumber: string) => void
    onBack?: () => void
    title?: string
    subtitle?: string
}

const dialpadButtons = [
    { value: '1', letters: '' },
    { value: '2', letters: 'ABC' },
    { value: '3', letters: 'DEF' },
    { value: '4', letters: 'GHI' },
    { value: '5', letters: 'JKL' },
    { value: '6', letters: 'MNO' },
    { value: '7', letters: 'PQRS' },
    { value: '8', letters: 'TUV' },
    { value: '9', letters: 'WXYZ' },
    { value: '', letters: '' }, // Empty spacer
    { value: '0', letters: '+' },
    { value: 'delete', letters: '' },
]

export function PhoneDialpad({ onSubmit, onBack, title, subtitle }: PhoneDialpadProps) {
    const [phoneNumber, setPhoneNumber] = useState('')

    const handlePress = useCallback((value: string) => {
        if (value === 'delete') {
            setPhoneNumber(prev => prev.slice(0, -1))
        } else if (value && phoneNumber.length < 11) {
            setPhoneNumber(prev => prev + value)
        }
    }, [phoneNumber])

    const formatPhoneNumber = (num: string) => {
        if (num.length <= 3) return num
        if (num.length <= 7) return `${num.slice(0, 3)} ${num.slice(3)}`
        return `${num.slice(0, 3)} ${num.slice(3, 7)} ${num.slice(7)}`
    }

    const isValidNigerianNumber = phoneNumber.length === 11 && phoneNumber.startsWith('0')

    return (
        <div className="min-h-[calc(100vh-100px)] flex items-center justify-center py-8 px-4">
            <div className="w-full max-w-md">
                {/* Card Container */}
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
                    {/* Header Section - Emerald */}
                    <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 px-6 pt-8 pb-10 text-center relative">
                        {/* Back Button */}
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="absolute top-4 left-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                            >
                                <ArrowLeft className="h-5 w-5 text-white" />
                            </button>
                        )}

                        {/* Phone Icon */}
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-white/10">
                            <Phone className="h-10 w-10 text-white" />
                        </div>

                        <h1 className="text-2xl font-bold text-white mb-2">
                            {title || 'Enter Your Phone Number'}
                        </h1>
                        <p className="text-emerald-100 text-sm">
                            {subtitle || 'We\'ll use this for order updates and verification'}
                        </p>
                    </div>

                    {/* Phone Number Display */}
                    <div className="px-6 -mt-6 relative z-10">
                        <div className="bg-gray-50 rounded-2xl px-6 py-5 text-center shadow-sm border border-gray-100">
                            <p className="text-3xl md:text-4xl font-bold text-gray-900 tracking-wider font-mono min-h-[40px]">
                                {phoneNumber ? formatPhoneNumber(phoneNumber) : '080 XXXX XXXX'}
                            </p>
                            <p className="text-gray-400 text-xs mt-1">
                                Nigerian mobile number
                            </p>
                        </div>
                    </div>

                    {/* Dialpad */}
                    <div className="px-6 py-6">
                        <div className="grid grid-cols-3 gap-3">
                            {dialpadButtons.map((btn, index) => (
                                <div key={index} className="aspect-square">
                                    {btn.value === '' ? (
                                        <div /> // Empty spacer
                                    ) : btn.value === 'delete' ? (
                                        <button
                                            onClick={() => handlePress('delete')}
                                            className="w-full h-full rounded-2xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-all flex items-center justify-center text-gray-600 active:scale-95"
                                        >
                                            <Delete className="h-6 w-6" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handlePress(btn.value)}
                                            className="w-full h-full rounded-2xl bg-gray-50 hover:bg-gray-100 active:bg-emerald-50 border border-gray-200 hover:border-gray-300 transition-all flex flex-col items-center justify-center active:scale-95 group"
                                        >
                                            <span className="text-2xl font-bold text-gray-900 group-active:text-emerald-600">
                                                {btn.value}
                                            </span>
                                            {btn.letters && (
                                                <span className="text-[10px] text-gray-400 tracking-widest mt-0.5">
                                                    {btn.letters}
                                                </span>
                                            )}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Submit Section */}
                    <div className="px-6 pb-6">
                        <Button
                            onClick={() => onSubmit(phoneNumber)}
                            disabled={!isValidNigerianNumber}
                            className={cn(
                                "w-full h-14 text-lg font-bold rounded-2xl transition-all",
                                isValidNigerianNumber
                                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200"
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            )}
                        >
                            {isValidNigerianNumber ? (
                                <>
                                    <Check className="mr-2 h-5 w-5" />
                                    Confirm Number
                                </>
                            ) : (
                                phoneNumber.length > 0
                                    ? `${11 - phoneNumber.length} more digit${11 - phoneNumber.length !== 1 ? 's' : ''} needed`
                                    : 'Enter 11 digits'
                            )}
                        </Button>

                        {phoneNumber.length > 0 && !phoneNumber.startsWith('0') && (
                            <p className="mt-3 text-center text-red-500 text-sm">
                                Number should start with 0
                            </p>
                        )}
                    </div>
                </div>

                {/* Help Text */}
                <p className="text-center text-gray-400 text-xs mt-6">
                    By continuing, you agree to receive SMS notifications for your orders
                </p>
            </div>
        </div>
    )
}

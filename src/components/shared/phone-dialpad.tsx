'use client'

import { useState, useCallback } from 'react'
import { Delete, Phone, Check } from 'lucide-react'
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
        if (num.length <= 6) return `${num.slice(0, 3)} ${num.slice(3)}`
        return `${num.slice(0, 3)} ${num.slice(3, 7)} ${num.slice(7)}`
    }

    const isValidNigerianNumber = phoneNumber.length === 11 && phoneNumber.startsWith('0')

    return (
        <div className="fixed inset-0 z-50 bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 flex flex-col items-center justify-center p-4">
            {/* Header */}
            <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Phone className="h-10 w-10 text-white" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    {title || 'Enter Your Phone Number'}
                </h1>
                <p className="text-emerald-100">
                    {subtitle || 'We\'ll use this for order updates and verification'}
                </p>
            </div>

            {/* Phone Number Display */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-8 py-6 mb-8 min-w-[300px] text-center animate-in fade-in duration-500">
                <p className="text-4xl md:text-5xl font-bold text-white tracking-wider font-mono">
                    {phoneNumber ? formatPhoneNumber(phoneNumber) : '---'}
                </p>
                <p className="text-emerald-200 text-sm mt-2">
                    Nigerian mobile number (e.g., 080X XXX XXXX)
                </p>
            </div>

            {/* Dialpad */}
            <div className="grid grid-cols-3 gap-4 max-w-xs animate-in fade-in slide-in-from-bottom-4 duration-500">
                {dialpadButtons.map((btn, index) => (
                    <div key={index} className="h-20">
                        {btn.value === '' ? (
                            <div /> // Empty spacer
                        ) : btn.value === 'delete' ? (
                            <button
                                onClick={() => handlePress('delete')}
                                className="w-full h-full rounded-2xl bg-white/10 hover:bg-white/20 active:bg-white/30 transition-all flex items-center justify-center text-white"
                            >
                                <Delete className="h-8 w-8" />
                            </button>
                        ) : (
                            <button
                                onClick={() => handlePress(btn.value)}
                                className="w-full h-full rounded-2xl bg-white/10 hover:bg-white/20 active:bg-white/30 transition-all flex flex-col items-center justify-center text-white group"
                            >
                                <span className="text-3xl font-bold group-active:scale-110 transition-transform">
                                    {btn.value}
                                </span>
                                {btn.letters && (
                                    <span className="text-xs text-emerald-200 tracking-widest">
                                        {btn.letters}
                                    </span>
                                )}
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Confirm Button */}
            <div className="mt-8 flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {onBack && (
                    <Button
                        variant="outline"
                        onClick={onBack}
                        className="border-white/30 text-white hover:bg-white/10 hover:text-white"
                    >
                        Back
                    </Button>
                )}
                <Button
                    onClick={() => onSubmit(phoneNumber)}
                    disabled={!isValidNigerianNumber}
                    className={cn(
                        "min-w-[200px] h-14 text-lg font-bold transition-all",
                        isValidNigerianNumber 
                            ? "bg-white text-emerald-700 hover:bg-emerald-50 shadow-xl" 
                            : "bg-white/20 text-white/50 cursor-not-allowed"
                    )}
                >
                    {isValidNigerianNumber ? (
                        <>
                            <Check className="mr-2 h-5 w-5" />
                            Confirm Number
                        </>
                    ) : (
                        'Enter 11 digits'
                    )}
                </Button>
            </div>

            {/* Validation Hint */}
            {phoneNumber.length > 0 && !isValidNigerianNumber && (
                <p className="mt-4 text-emerald-200 text-sm animate-in fade-in">
                    {phoneNumber.length < 11 
                        ? `${11 - phoneNumber.length} more digits needed`
                        : !phoneNumber.startsWith('0') 
                            ? 'Number should start with 0'
                            : 'Invalid number format'
                    }
                </p>
            )}
        </div>
    )
}

'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Camera, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

interface ProfilePictureUploadProps {
    value?: string
    onChange: (url: string | null) => void
    disabled?: boolean
}

export function ProfilePictureUpload({ value, onChange, disabled }: ProfilePictureUploadProps) {
    const [uploading, setUploading] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(value || null)
    const inputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file')
            return
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert('Image must be less than 2MB')
            return
        }

        // Show preview immediately
        const objectUrl = URL.createObjectURL(file)
        setPreviewUrl(objectUrl)

        setUploading(true)

        try {
            const supabase = createClient()

            // Generate unique filename
            const fileExt = file.name.split('.').pop()
            const fileName = `profile_${Date.now()}.${fileExt}`
            const filePath = `profile-pictures/${fileName}`

            // Upload to Supabase Storage
            const { data, error } = await supabase.storage
                .from('uploads')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                })

            if (error) throw error

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('uploads')
                .getPublicUrl(filePath)

            onChange(publicUrl)
        } catch (err) {
            console.error('Upload error:', err)
            alert('Failed to upload image. Please try again.')
            setPreviewUrl(null)
            onChange(null)
        } finally {
            setUploading(false)
        }
    }

    const handleRemove = () => {
        setPreviewUrl(null)
        onChange(null)
        if (inputRef.current) {
            inputRef.current.value = ''
        }
    }

    return (
        <div className="flex flex-col items-center gap-3">
            <div className="relative">
                <div className="h-28 w-28 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
                    {previewUrl ? (
                        <Image
                            src={previewUrl}
                            alt="Profile"
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-emerald-100 to-gray-100">
                            <Camera className="h-8 w-8 text-gray-400" />
                        </div>
                    )}

                    {uploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                            <Loader2 className="h-6 w-6 animate-spin text-white" />
                        </div>
                    )}
                </div>

                {/* Remove Button */}
                {previewUrl && !uploading && (
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={disabled || uploading}
                className="hidden"
                id="profile-upload"
            />

            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => inputRef.current?.click()}
                disabled={disabled || uploading}
                className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
            >
                {uploading ? (
                    <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                    </>
                ) : previewUrl ? (
                    'Change Photo'
                ) : (
                    <>
                        <Camera className="h-4 w-4 mr-2" />
                        Add Profile Photo
                    </>
                )}
            </Button>

            <p className="text-xs text-gray-500">Max 2MB, JPG or PNG</p>
        </div>
    )
}

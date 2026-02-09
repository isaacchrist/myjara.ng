'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { X, Upload, Loader2, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'

interface ImageUploadProps {
    value: string[];
    onChange: (value: string[]) => void;
    disabled?: boolean;
    maxFiles?: number;
    bucket?: string;
}

export function ImageUpload({ value, onChange, disabled, maxFiles = 5, bucket = 'product-images' }: ImageUploadProps) {
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (value.length >= maxFiles) {
            alert(`Maximum ${maxFiles} images allowed`)
            return
        }

        setUploading(true)
        const supabase = createClient()

        // 1. Upload
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${fileName}`

        try {
            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, file)

            if (uploadError) {
                throw uploadError
            }

            // 2. Get Url
            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath)

            onChange([...value, publicUrl])

        } catch (error) {
            console.error('Upload Error:', error)
            alert('Failed to upload image')
        } finally {
            setUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const onRemove = (url: string) => {
        onChange(value.filter((current) => current !== url))
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
                {value.map((url) => (
                    <div key={url} className="relative w-[200px] h-[200px] rounded-md overflow-hidden border">
                        <div className="z-10 absolute top-2 right-2">
                            <Button type="button" onClick={() => onRemove(url)} variant="destructive" size="icon" className="h-6 w-6">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <Image fill className="object-cover" alt="Image" src={url} />
                    </div>
                ))}
            </div>
            {value.length < maxFiles && (
                <div className="flex items-center gap-2">
                    <Button type="button" disabled={disabled || uploading} variant="secondary" onClick={() => fileInputRef.current?.click()}>
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                        Upload Image
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={onUpload}
                        disabled={disabled || uploading}
                    />
                </div>
            )}
        </div>
    )
}

'use client'

import { useState, ChangeEvent } from 'react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const BUCKET_NAME = 'product-images'

type Props = {
  value?: string
  onChange: (url: string) => void
}

export function ProductImageUploader({ value, onChange }: Props) {
  const [uploading, setUploading] = useState(false)

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const supabase = createClient()
    setUploading(true)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      const filePath = `products/${fileName}.${fileExt}`

      const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

      if (error) {
        // Илүү тодорхой debugging-д
        // eslint-disable-next-line no-console
        console.error('Supabase storage upload error', error)
        throw error
      }

      const { data: publicData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path)
      if (!publicData?.publicUrl) {
        throw new Error('Public URL олдсонгүй')
      }

      onChange(publicData.publicUrl)
      toast.success('Зураг амжилттай upload хийгдлээ')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Зураг upload хийхэд алдаа гарлаа'
      toast.error(message)
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="flex items-center gap-3">
          <img src={value} alt="Product" className="h-16 w-16 rounded object-cover border" />
          <span className="truncate text-xs text-gray-600">{value}</span>
        </div>
      ) : (
        <p className="text-xs text-gray-500">Одоогоор зураг сонгогдоогүй байна.</p>
      )}
      <div className="flex items-center gap-2">
        <Input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="flex-1 cursor-pointer border border-gray-300 file:mr-2 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1 file:text-xs file:font-medium"
        />
        <Button type="button" variant="outline" size="sm" disabled={uploading}>
          {uploading ? 'Upload хийж байна...' : 'Upload'}
        </Button>
      </div>
      <p className="text-[11px] text-gray-500">Зураг upload хийснээр доорх URL талбар автоматаар бөглөгдөнө.</p>
    </div>
  )
}


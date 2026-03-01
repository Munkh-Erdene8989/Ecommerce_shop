'use client'

import * as React from 'react'
import Image from 'next/image'
import { useQuery, useMutation } from '@apollo/client'
import toast from 'react-hot-toast'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { POPUP_SETTINGS, UPDATE_POPUP_SETTINGS } from '@/lib/admin/graphql'
import { ProductImageUploader } from '@/components/admin/ProductImageUploader'

export default function AdminPopupPage() {
  const { data, loading } = useQuery(POPUP_SETTINGS)
  const [updatePopup, { loading: saving }] = useMutation(UPDATE_POPUP_SETTINGS, {
    refetchQueries: [{ query: POPUP_SETTINGS }],
  })

  const p = data?.popupSettings
  const [enabled, setEnabled] = React.useState(p?.enabled ?? false)
  const [title, setTitle] = React.useState(p?.title ?? '')
  const [message, setMessage] = React.useState(p?.message ?? '')
  const [imageUrl, setImageUrl] = React.useState(p?.image_url ?? '')
  const [ctaText, setCtaText] = React.useState(p?.cta_text ?? '')
  const [ctaUrl, setCtaUrl] = React.useState(p?.cta_url ?? '')

  React.useEffect(() => {
    if (p) {
      setEnabled(p.enabled ?? false)
      setTitle(p.title ?? '')
      setMessage(p.message ?? '')
      setImageUrl(p.image_url ?? '')
      setCtaText(p.cta_text ?? '')
      setCtaUrl(p.cta_url ?? '')
    }
  }, [p])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updatePopup({
        variables: {
          input: {
            enabled,
            title: title.trim() || undefined,
            message: message.trim() || undefined,
            image_url: imageUrl.trim() || undefined,
            cta_text: ctaText.trim() || undefined,
            cta_url: ctaUrl.trim() || undefined,
          },
        },
      })
      toast.success('Popup тохиргоо хадгалагдлаа')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Алдаа гарлаа')
    }
  }

  return (
    <div className="w-full max-w-3xl space-y-6">
      <h1 className="text-xl font-bold sm:text-2xl">Popup цонх – удирдлага</h1>
      <p className="text-sm text-gray-600">
        Нүүр болон бусад хуудсан дээр хэрэглэгчидэд харагдах мэдээллийн popup цонхны тохиргоо. Дүр, гарчиг, мессеж, Call to Action товчны холбоос оруулна.
      </p>
      <Card>
        <CardHeader>
          <CardTitle>Popup тохиргоо</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && !p ? (
            <p className="text-sm text-gray-500">Ачааллаж байна...</p>
          ) : (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="enabled">Popup идэвхтэй (харуулах)</Label>
              </div>
              <div className="space-y-2">
                <Label>Гарчиг</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Жишээ: Онцлох санал"
                />
              </div>
              <div className="space-y-2">
                <Label>Мессеж / Тайлбар</Label>
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Мэдээллийн текст"
                />
              </div>
              <div className="space-y-2">
                <Label>Дүр (зураг) URL</Label>
                <ProductImageUploader value={imageUrl} onChange={setImageUrl} />
              </div>
              <div className="space-y-2">
                <Label>Зураг URL (шулуунаар)</Label>
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>CTA товчны текст</Label>
                <Input
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  placeholder="Жишээ: Дэлгэрэнгүй"
                />
              </div>
              <div className="space-y-2">
                <Label>CTA холбоос (URL)</Label>
                <Input
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                  placeholder="https://... эсвэл /products/..."
                />
              </div>
              <div className="space-y-2">
                <Label>Урьдчилан харах</Label>
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white p-4">
                  {imageUrl ? (
                    <div className="relative aspect-video w-full max-w-md">
                      <Image
                        src={imageUrl}
                        alt="Popup preview"
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-video max-w-md items-center justify-center rounded bg-gray-50 text-sm text-gray-400">
                      Зураг оруулаагүй
                    </div>
                  )}
                  {(title || message) && (
                    <div className="mt-3 space-y-1">
                      {title && <p className="font-medium">{title}</p>}
                      {message && <p className="text-sm text-gray-600">{message}</p>}
                      {ctaText && (
                        <Button type="button" size="sm" variant="secondary" className="mt-2" asChild>
                          <a href={ctaUrl || '#'}>{ctaText}</a>
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                {saving ? 'Хадгалж байна...' : 'Хадгалах'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

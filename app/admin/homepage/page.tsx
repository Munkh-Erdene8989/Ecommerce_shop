'use client'

import * as React from 'react'
import Image from 'next/image'
import { useQuery, useMutation } from '@apollo/client'
import toast from 'react-hot-toast'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { STORE_SETTINGS, UPDATE_STORE_SETTINGS } from '@/lib/admin/graphql'
import { ProductImageUploader } from '@/components/admin/ProductImageUploader'

export default function AdminHomepageHeroPage() {
  const { data, loading } = useQuery(STORE_SETTINGS)
  const [updateSettings, { loading: saving }] = useMutation(UPDATE_STORE_SETTINGS, {
    refetchQueries: [{ query: STORE_SETTINGS }],
  })

  const s = data?.storeSettings
  const [heroImageUrl, setHeroImageUrl] = React.useState(s?.hero_image_url ?? '')

  React.useEffect(() => {
    if (s) {
      setHeroImageUrl(s.hero_image_url ?? '')
    }
  }, [s])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateSettings({
        variables: {
          input: {
            hero_image_url: heroImageUrl,
          },
        },
      })
      toast.success('Hero зураг хадгалагдлаа')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Алдаа гарлаа')
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Нүүр хуудас – Hero зураг</h1>
      <p className="text-sm text-gray-600">
        Нүүр хуудасны дээр байрлах гол hero баннерын зургийг эндээс сонгож эсвэл солих боломжтой.
      </p>
      <Card>
        <CardHeader>
          <CardTitle>Hero зураг тохиргоо</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && !s ? (
            <p className="text-sm text-gray-500">Ачааллаж байна...</p>
          ) : (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <Label>Зураг upload хийх</Label>
                <ProductImageUploader value={heroImageUrl} onChange={setHeroImageUrl} />
              </div>
              <div className="space-y-2">
                <Label>Зураг URL (шулуунаар оруулах)</Label>
                <Input
                  value={heroImageUrl}
                  onChange={(e) => setHeroImageUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br from-pink-50 via-white to-purple-50">
                  {heroImageUrl ? (
                    <div className="relative aspect-[4/5] w-full max-w-md">
                      <Image
                        src={heroImageUrl}
                        alt="Homepage hero"
                        fill
                        sizes="(min-width: 1024px) 420px, 70vw"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-[4/5] max-w-md items-center justify-center text-sm text-gray-400">
                      Одоогоор hero зураг сонгогдоогүй байна.
                    </div>
                  )}
                </div>
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? 'Хадгалж байна...' : 'Хадгалах'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


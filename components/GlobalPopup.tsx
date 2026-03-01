'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const POPUP_CLOSED_KEY = 'popup_closed'

interface PopupSettings {
  enabled: boolean
  title?: string | null
  message?: string | null
  image_url?: string | null
  cta_text?: string | null
  cta_url?: string | null
}

export function GlobalPopup() {
  const [settings, setSettings] = useState<PopupSettings | null>(null)
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query { popupSettings { enabled title message image_url cta_text cta_url } }`,
      }),
    })
      .then((r) => r.json())
      .then((res) => {
        if (cancelled) return
        const data = res?.data?.popupSettings
        if (data?.enabled) {
          const closed = typeof window !== 'undefined' && sessionStorage.getItem(POPUP_CLOSED_KEY)
          setSettings(data)
          setOpen(!closed)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleClose = () => {
    setOpen(false)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(POPUP_CLOSED_KEY, '1')
    }
  }

  if (!loaded || !settings?.enabled) return null

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-md gap-0 overflow-hidden rounded-xl border-gray-200 bg-white p-0 shadow-xl sm:max-w-lg">
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          aria-label="Хаах"
        >
          <span className="sr-only">Хаах</span>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {settings.image_url && (
          <div className="relative aspect-[16/10] w-full bg-gray-50">
            <Image
              src={settings.image_url}
              alt={settings.title || 'Popup'}
              fill
              className="object-cover"
              sizes="(max-width: 512px) 100vw, 512px"
              unoptimized
            />
          </div>
        )}
        <DialogHeader className="space-y-1.5 px-6 pt-4">
          {settings.title && (
            <DialogTitle className="text-left text-lg font-semibold text-gray-900">
              {settings.title}
            </DialogTitle>
          )}
          {settings.message && (
            <DialogDescription className="text-left text-gray-600">
              {settings.message}
            </DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter className="flex flex-row justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <DialogClose asChild>
            <Button type="button" variant="outline" size="sm" onClick={handleClose}>
              Хаах
            </Button>
          </DialogClose>
          {settings.cta_text && (
            <Button size="sm" asChild>
              <Link href={settings.cta_url || '#'} onClick={handleClose}>
                {settings.cta_text}
              </Link>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

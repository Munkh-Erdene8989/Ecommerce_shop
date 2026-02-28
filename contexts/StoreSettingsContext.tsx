'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type StoreSettings = {
  storeName: string
  logoUrl: string
}

const defaultSettings: StoreSettings = {
  storeName: 'AZ Beauty',
  logoUrl: '',
}

const StoreSettingsContext = createContext<StoreSettings>(defaultSettings)

export function StoreSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings)

  const fetchSettings = React.useCallback(() => {
    const supabase = createClient()
    supabase
      .from('store_settings')
      .select('value')
      .eq('key', 'general')
      .single()
      .then(({ data }) => {
        const v = (data?.value as { store_name?: string; logo_url?: string } | null) ?? {}
        setSettings({
          storeName: typeof v.store_name === 'string' && v.store_name.trim() ? v.store_name : defaultSettings.storeName,
          logoUrl: typeof v.logo_url === 'string' ? v.logo_url : defaultSettings.logoUrl,
        })
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchSettings()
    const onFocus = () => fetchSettings()
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', onFocus)
      return () => window.removeEventListener('focus', onFocus)
    }
  }, [fetchSettings])

  return (
    <StoreSettingsContext.Provider value={settings}>
      {children}
    </StoreSettingsContext.Provider>
  )
}

export function useStoreSettings() {
  return useContext(StoreSettingsContext)
}

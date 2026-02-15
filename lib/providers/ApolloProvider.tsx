'use client'

import { ApolloProvider as ApolloProviderBase } from '@apollo/client'
import { createApolloClient } from '@/lib/apollo/client'
import { useAuth } from '@/lib/providers/AuthProvider'
import { useMemo } from 'react'

export function ApolloProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth()
  const client = useMemo(
    () => createApolloClient(session?.access_token ?? null),
    [session?.access_token]
  )
  return <ApolloProviderBase client={client}>{children}</ApolloProviderBase>
}

'use client'

import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'

const graphqlUri = typeof window !== 'undefined' ? '/api/graphql' : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/graphql`

const httpLink = createHttpLink({ uri: graphqlUri })

export function createApolloClient(accessToken?: string | null) {
  const authLink = setContext((_, { headers }) => ({
    headers: {
      ...headers,
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
    },
  }))
  return new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
    defaultOptions: {
      query: { fetchPolicy: 'cache-first' },
    },
  })
}

import { startServerAndCreateNextHandler } from '@as-integrations/next'
import { ApolloServer } from '@apollo/server'
import { typeDefs } from '@/lib/backend/graphql/schema'
import { resolvers } from '@/lib/backend/graphql/resolvers'
import { createContext } from '@/lib/backend/graphql/context'
import type { NextRequest } from 'next/server'

const server = new ApolloServer({ typeDefs, resolvers })

const handler = startServerAndCreateNextHandler(server, {
  context: async (req: NextRequest) => createContext(req),
})

export { handler as GET, handler as POST }

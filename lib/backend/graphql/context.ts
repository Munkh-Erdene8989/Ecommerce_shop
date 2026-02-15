import type { NextRequest } from 'next/server'

export interface GraphQLContext {
  req: NextRequest
  authHeader: string | undefined
}

export function createContext(req: NextRequest): GraphQLContext {
  return {
    req,
    authHeader: req.headers.get('authorization') ?? undefined,
  }
}

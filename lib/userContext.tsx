'use client'

import { createContext, useContext } from 'react'

export interface CurrentUser {
  userId: string
  name: string
  role: string
}

const UserContext = createContext<CurrentUser | null>(null)

export function UserProvider({ user, children }: { user: CurrentUser; children: React.ReactNode }) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>
}

export function useCurrentUser(): CurrentUser {
  const ctx = useContext(UserContext)
  return ctx ?? { userId: '', name: '', role: '' }
}

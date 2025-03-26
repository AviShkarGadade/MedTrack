"use client"

import type { ReactNode } from "react"
import { AuthProvider } from "@/contexts/auth-context"

export function ClientProviders({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}


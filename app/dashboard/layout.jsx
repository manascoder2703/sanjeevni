"use client"

import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import React, { useEffect, useState } from "react"
import CommandPalette from "@/components/CommandPalette"
import { NotificationProvider } from "@/context/NotificationContext"
import NotificationBell from "@/components/NotificationBell"


export default function DashboardLayout({ children }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login")
      } else {
        setIsReady(true)
      }
    }
  }, [user, loading, router])

  if (loading || !isReady) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#000000]">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-white/60 animate-pulse font-medium">Securing session...</p>
        </div>
      </div>
    )
  }

  // Refined breadcrumb logic
  const pathSegments = pathname.split('/').filter(Boolean)
  // Skip the 'dashboard' segment if it's at the start to avoid redundancy
  const filteredSegments = pathSegments[0] === 'dashboard' ? pathSegments.slice(1) : pathSegments

  const breadcrumbs = filteredSegments.map((segment, index) => {
    // Reconstruct the full path
    const actualIndex = pathSegments.indexOf(segment)
    const href = `/${pathSegments.slice(0, actualIndex + 1).join('/')}`
    const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
    const isLast = index === filteredSegments.length - 1

    return { label, href, isLast }
  })

  return (
    <NotificationProvider>
      <SidebarProvider>
        <CommandPalette />
        <AppSidebar />
        <SidebarInset className="bg-[#050608] text-white relative overflow-hidden flex flex-col min-h-screen">
          {/* Unified Background Decor (Shared across all pages) */}
          <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0"
            style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
          <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-blue-500/5 blur-[120px] pointer-events-none z-0"></div>

          <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/5 px-6 md:px-8 sticky top-0 bg-[#050608]/80 backdrop-blur-md z-50">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-2 opacity-100 transition-opacity text-white" />
              <Separator
                orientation="vertical"
                className="mx-2 h-4 bg-white/10"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbPage className="text-white font-medium">
                      Sanjeevani
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                  {breadcrumbs.slice(1).map((bc, i) => (
                    <React.Fragment key={bc.href}>
                      <BreadcrumbSeparator className="hidden md:block text-white/10" />
                      <BreadcrumbItem>
                        {bc.isLast ? (
                          <BreadcrumbPage className="text-white font-semibold tracking-tight">{bc.label}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink href={bc.href} className="text-white/40 hover:text-white transition-colors capitalize font-medium">
                            {bc.label}
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </React.Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            <div className="flex items-center gap-4">
              <NotificationBell />
            </div>
          </header>

          <div 
            className="flex-1 overflow-y-auto relative z-10 custom-scrollbar py-8 flex flex-col items-center"
            style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
          >
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </NotificationProvider>
  )
}

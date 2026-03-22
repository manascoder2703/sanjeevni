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
import React, { useEffect, useRef, useState } from "react"
import CommandPalette from "@/components/CommandPalette"
import { NotificationProvider } from "@/context/NotificationContext"
import NotificationBell from "@/components/NotificationBell"

export default function DashboardLayout({ children }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isReady, setIsReady] = useState(false)

  const isChatPage =
    pathname === "/dashboard/doctor/chat" ||
    pathname === "/dashboard/patient/chat" ||
    pathname === "/dashboard/patient/ai-assistant"

  useEffect(() => {
    // Only proceed once loading from context is finished
    if (!loading) {
      if (user) {
        setIsReady(true);
      } else {
        // Double check: if no user is found after loading, go to login
        const timeout = setTimeout(() => {
          if (!user) router.push("/login");
        }, 500);
        return () => clearTimeout(timeout);
      }
    }
  }, [user, loading, router]);


  // Only show loading if we are truly loading and don't have a user yet
  if ((loading || !isReady) && !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#000000]">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-white/60 animate-pulse font-medium">Securing session...</p>
        </div>
      </div>
    )
  }

  const pathSegments = pathname.split('/').filter(Boolean)
  const filteredSegments = pathSegments[0] === 'dashboard' ? pathSegments.slice(1) : pathSegments

  const breadcrumbs = filteredSegments.map((segment, index) => {
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
        <SidebarInset className="bg-[#000000] text-white relative overflow-hidden flex flex-col min-h-screen">
          <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0"
            style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
          <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-blue-500/5 blur-[120px] pointer-events-none z-0"></div>

          <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/5 px-6 md:px-8 sticky top-0 bg-[#000000]/80 backdrop-blur-md z-50">
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
                      Sanjeevni
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
            className={`flex-1 relative z-10 custom-scrollbar flex flex-col min-h-0 ${isChatPage ? "items-stretch overflow-hidden" : "items-center overflow-y-auto"}`}
            style={{
              paddingLeft: isChatPage ? '0' : '2.5rem',
              paddingRight: isChatPage ? '0' : '2.5rem',
              paddingTop: isChatPage ? '0' : '2rem',
              paddingBottom: isChatPage ? '0' : '2rem',
            }}
          >
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </NotificationProvider>
  )
}
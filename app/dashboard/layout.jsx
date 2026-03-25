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
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import React, { useEffect, useState } from "react"
import CommandPalette from "@/components/CommandPalette"
import { NotificationProvider } from "@/context/NotificationContext"
import { CallProvider } from "@/context/CallContext"
import AudioCallOverlay from "@/components/AudioCallOverlay"
import AIAgentWidget from "@/components/ai/AIAgentWidget"
import IntegratedHeader from "@/components/IntegratedHeader"
import Particles from "@/components/Particles"
import { AgentProvider } from "@/context/AgentContext"

export default function DashboardLayout({ children }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isReady, setIsReady] = useState(false)

  const isChatPage =
    pathname === "/dashboard/doctor/chat" ||
    pathname === "/dashboard/patient/chat" ||
    pathname === "/dashboard/patient/ai-assistant"
  const isCallLogsPage =
    pathname === "/dashboard/doctor/calls" ||
    pathname === "/dashboard/patient/calls"
  const isFullWidthPage = isChatPage

  useEffect(() => {
    if (!loading) {
      if (user) {
        setIsReady(true);
      } else {
        const timeout = setTimeout(() => {
          if (!user) router.push("/login");
        }, 500);
        return () => clearTimeout(timeout);
      }
    }
  }, [user, loading, router]);


  if ((loading || !isReady) && !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#020617]">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-white/60 animate-pulse font-medium">Securing session...</p>
        </div>
      </div>
    )
  }

  const pathSegments = pathname.split('/').filter(Boolean)
  const filteredSegments = pathSegments[0] === 'dashboard' 
    ? pathSegments.slice(2) 
    : pathSegments

  const breadcrumbs = filteredSegments.map((segment, index) => {
    const actualIndex = pathSegments.indexOf(segment)
    const href = `/${pathSegments.slice(0, actualIndex + 1).join('/')}`
    const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
    const isLast = index === filteredSegments.length - 1
    return { label, href, isLast }
  })

  return (
    <NotificationProvider>
      <CallProvider>
        <AgentProvider>
          <SidebarProvider>
          <div className="flex flex-col h-screen w-full text-white relative overflow-hidden">
            {/* GLOBAL BACKGROUNDS */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0"
              style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
            
            {/* CINEMATIC PARTICLES LAYER (Whole Portal Atmosphere) */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
              <Particles
                particleColors={["#ffffff"]}
                particleCount={250}
                particleSpread={12}
                speed={0.1}
                particleBaseSize={100}
                moveParticlesOnHover
                alphaParticles={false}
                disableRotation={false}
                pixelRatio={1}
              />
            </div>
            {/* SOFT ATMOSPHERIC GLOWS (Neutral depth) */}
            <div className="fixed inset-0 pointer-events-none z-0"></div>

            <CommandPalette />
            
            {/* FIXED TOP HEADER */}
            <div className="fixed top-0 left-0 w-full h-16 z-[100] bg-[#030303]/40 backdrop-blur-md border-b border-white/10">
              <IntegratedHeader />
            </div>

            <div className="flex flex-1 overflow-hidden relative z-10 w-full h-screen">
              <AppSidebar />
              
              <main className={`flex-1 ${isFullWidthPage ? "overflow-hidden p-0!" : "overflow-y-auto p-8! md:px-20! md:py-12!"} custom-scrollbar flex flex-col relative pt-16!`}>
                {/* EXPANSIVE CONTENT CONTAINER */}
                <div className="w-full flex-1 min-h-0 flex flex-col relative">
                  {/* PAGE CONTENT INNER (NO OUTER CARD) */}
                  <div 
                    className={`flex-1 min-h-0 flex flex-col ${isFullWidthPage ? "p-0!" : "p-8! md:px-20! md:py-12!"}`}
                  >
                    {/* BREADCRUMBS MODULAR PILL */}
                    {!isFullWidthPage && breadcrumbs.length > 0 && (
                      <div className="mb-8 flex items-center gap-3 px-4 py-2 bg-white/[0.03] border border-white/5 rounded-full w-fit backdrop-blur-md">
                        <Breadcrumb>
                          <BreadcrumbList>
                            {breadcrumbs.map((bc, i) => (
                              <React.Fragment key={bc.href}>
                                <BreadcrumbItem>
                                  {bc.isLast ? (
                                    <BreadcrumbPage className="text-white font-bold tracking-tight text-sm">{bc.label}</BreadcrumbPage>
                                  ) : (
                                    <BreadcrumbLink href={bc.href} className="text-white/30 hover:text-white transition-colors font-semibold tracking-wide text-xs">
                                      {bc.label}
                                    </BreadcrumbLink>
                                  )}
                                </BreadcrumbItem>
                                {!bc.isLast && <BreadcrumbSeparator className="text-white/5 size-3" />}
                              </React.Fragment>
                            ))}
                          </BreadcrumbList>
                        </Breadcrumb>
                      </div>
                    )}

                    {/* MAIN CHILDREN CONTENT */}
                    <div className="flex-1 min-h-0">
                      {children}
                    </div>
                  </div>
                </div>
              </main>
            </div>

            <AudioCallOverlay />
            <AIAgentWidget />
          </div>
        </SidebarProvider>
      </AgentProvider>
    </CallProvider>
  </NotificationProvider>
  )
}
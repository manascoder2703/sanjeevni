"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { 
  LayoutDashboard, 
  MessageSquare,
  Stethoscope,
  Bot,
  ShieldCheck,
  LogOut,
  UserCircle,
  FileText,
  ClipboardList,
  HeartPulse,
  PhoneCall,
} from "lucide-react"

import Link from "next/link"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { motion } from "framer-motion"
import Particles from "@/components/Particles"

const data = {
  nav: {
    patient: [
      {
        title: "Track Your Outcomes",
        items: [
          { title: "Dashboard",          url: "/dashboard/patient",                  icon: LayoutDashboard },
          { title: "Find Doctors",        url: "/dashboard/patient/doctors",          icon: Stethoscope },
          { title: "Sanjeevni AI",        url: "/dashboard/patient/ai-assistant",     icon: Bot },
          { title: "Chat with Doctor",    url: "/dashboard/patient/chat",             icon: MessageSquare },
          { title: "Call Logs",           url: "/dashboard/patient/calls",            icon: PhoneCall },
          { title: "My Prescriptions",   url: "/dashboard/patient/prescriptions",    icon: FileText },
          { title: "Health Info", url: "/dashboard/patient/health-info", icon: HeartPulse },
        ],
      },
      {
        title: "Account",
        items: [
          { title: "My Profile", url: "/dashboard/patient/profile", icon: UserCircle },
        ],
      },
    ],
    doctor: [
      {
        title: "",
        items: [
          { title: "Dashboard",         url: "/dashboard/doctor",                 icon: LayoutDashboard },
          { title: "Chat with Patient", url: "/dashboard/doctor/chat",            icon: MessageSquare },
          { title: "Call Logs",         url: "/dashboard/doctor/calls",           icon: PhoneCall },
          { title: "Prescriptions",     url: "/dashboard/doctor/prescriptions",   icon: ClipboardList },
        ],
      },
      {
        title: "Account",
        items: [
          { title: "My Profile", url: "/dashboard/doctor/profile", icon: UserCircle },
        ],
      },
    ],
    admin: [
      {
        title: "",
        items: [
          { title: "Systems Info", url: "/dashboard/admin", icon: ShieldCheck },
        ],
      },
      {
        title: "Account",
        items: [
          { title: "My Profile", url: "/dashboard/admin/profile", icon: UserCircle },
        ],
      },
    ]
  },
}

export function AppSidebar({ ...props }) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const { setOpen } = useSidebar()

  const userRole = user?.role || "patient"
  const currentNav = data.nav[userRole] || data.nav.patient

  const handleSignOut = async () => {
    await logout()
    router.push('/')
  }

  return (
    <Sidebar 
      {...props} 
      variant="sidebar"
      collapsible="icon" 
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      className="border-r border-white/15 bg-transparent text-white transition-all duration-300 relative overflow-visible!"
      style={{ top: '64px', height: 'calc(100vh - 64px)' }}
    >
      <SidebarHeader 
        className="bg-transparent pt-6 pb-2 transition-all duration-300 h-8"
      >
        {/* Header space now integrated into Cinematic Header */}
      </SidebarHeader>

      <SidebarContent className="bg-transparent mt-16 px-3 group-data-[collapsible=icon]:mt-8 group-data-[collapsible=icon]:px-0 overflow-visible!">
        {currentNav.map((group) => (
          <SidebarGroup 
            key={group.title} 
            style={{ marginBottom: '32px' }}
            className="mb-8! group-data-[collapsible=icon]:mb-8! group-data-[collapsible=icon]:p-0"
          >
            {group.title && (
              <SidebarGroupLabel className="text-[11px] font-bold text-white/40 tracking-[0.2em] pl-10! mb-4 group-data-[collapsible=icon]:hidden uppercase">
                {group.title}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="gap-4! px-0! group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0">
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={pathname === item.url}
                      className="group/btn h-14 w-full bg-transparent hover:bg-transparent group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:rounded-xl"
                      tooltip={item.title}
                    >
                      <Link href={item.url} className="w-full h-full block">
                        <motion.div
                          whileHover="hover"
                          whileTap={{ scale: 0.98 }}
                          initial="initial"
                          style={{ paddingLeft: '40px', gap: '20px' }}
                          className={`
                            relative flex items-center gap-5! pl-10! pr-6 py-3 rounded-2xl w-full h-full transition-all duration-300 border
                            group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0! group-data-[collapsible=icon]:py-0! group-data-[collapsible=icon]:rounded-xl
                            group-data-[collapsible=icon]:bg-transparent! group-data-[collapsible=icon]:border-none!
                            ${pathname === item.url 
                               ? 'bg-white/5 border-white/20 backdrop-blur-2xl text-white shadow-[0_0_30px_rgba(255,255,255,0.05)]' 
                               : 'border-transparent text-white/40 hover:text-white hover:bg-white/5 hover:border-white/10 hover:backdrop-blur-lg'}
                          `}
                        >
                          {/* Icon container */}
                          <div className={`
                            relative z-10 size-10 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0
                            group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:rounded-lg
                            bg-white/5 border border-white/60 backdrop-blur-md
                            group-data-[collapsible=icon]:bg-transparent! group-data-[collapsible=icon]:border-none! group-data-[collapsible=icon]:backdrop-blur-none!
                            ${pathname === item.url 
                               ? 'bg-white/20 border-white text-white shadow-[0_0_20px_rgba(255,255,255,0.4)]' 
                               : 'text-white/40 group-hover/btn:text-white group-hover/btn:bg-white/10 group-hover/btn:border-white/40'}
                          `}>
                            {item.icon && <item.icon className="size-5 shrink-0 group-data-[collapsible=icon]:size-5 stroke-[2]" />}
                          </div>
                          {/* Text */}
                          <span className="relative z-10 text-sm font-bold tracking-wide group-data-[collapsible=icon]:hidden opacity-0 group-data-[state=expanded]:opacity-100 transition-opacity duration-300">
                            {item.title}
                          </span>
                        </motion.div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-10 bg-transparent border-t border-white/15 group-data-[collapsible=icon]:p-2">
        <SidebarMenu>
          <SidebarMenuItem className="mb-4">
            <SidebarMenuButton 
              onClick={handleSignOut}
              className="h-16 p-0 bg-transparent hover:bg-transparent overflow-hidden group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:rounded-xl"
              tooltip="Sign Out"
            >
              <motion.div 
                whileHover={{ scale: 1.02, backgroundColor: "rgba(239, 68, 68, 0.1)" }}
                whileTap={{ scale: 0.98 }}
                style={{ paddingLeft: '40px', gap: '16px' }}
                className="flex items-center gap-4! pl-10! pr-10! py-4 rounded-2xl w-full h-full border border-red-500/10 text-red-400 border-red-500/30 transition-all group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0! group-data-[collapsible=icon]:py-0! group-data-[collapsible=icon]:rounded-xl"
              >
                <LogOut className="size-5 shrink-0 group-data-[collapsible=icon]:size-5 stroke-[2.2]" />
                <span className="text-sm font-bold tracking-widest group-data-[collapsible=icon]:hidden">Sign Out</span>
              </motion.div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
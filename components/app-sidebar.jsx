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
} from "@/components/ui/sidebar"
import { motion } from "framer-motion"

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
      className="border-r border-white/10 bg-[#000000] text-white transition-all duration-300"
    >
      <SidebarHeader className="bg-transparent border-b border-white/5 pt-40 pb-10 transition-all duration-300 group-data-[collapsible=icon]:pt-8 group-data-[collapsible=icon]:pb-4">
        <div className="flex flex-col items-center gap-4 px-2 overflow-hidden">
          <motion.div 
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className="relative size-14 bg-white/15 backdrop-blur-2xl border border-white/40 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.15)] overflow-hidden group/logo transition-all duration-300 group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:rounded-xl"
          >
            <motion.div
              animate={{ x: ["-100%", "250%"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-20 z-0"
            />
            <Stethoscope className="relative z-10 size-8 group-data-[collapsible=icon]:size-5 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-300" />
          </motion.div>
          <div className="flex flex-col items-center group-data-[collapsible=icon]:hidden">
            <h1 className="text-2xl font-black tracking-tighter text-white">Sanjeevni</h1>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-transparent mt-16 group-data-[collapsible=icon]:mt-6">
        {currentNav.map((group) => (
          <SidebarGroup key={group.title} className="mb-6 group-data-[collapsible=icon]:p-0">
            {group.title && (
              <SidebarGroupLabel className="text-[11px] font-bold text-white tracking-widest px-6 mb-4 group-data-[collapsible=icon]:hidden">
                {group.title}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="px-3 gap-2 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-1">
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={pathname === item.url}
                      className="group/btn h-14 p-0 bg-transparent hover:bg-transparent group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:rounded-xl"
                      tooltip={item.title}
                    >
                      <Link href={item.url} className="w-full h-full">
                        <motion.div
                          whileHover="hover"
                          whileTap={{ scale: 0.98 }}
                          initial="initial"
                          className={`
                            relative flex items-center gap-4 px-4 py-3 rounded-2xl w-full h-full transition-all duration-300 border overflow-hidden
                            group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-0 group-data-[collapsible=icon]:rounded-xl
                            ${pathname === item.url 
                              ? 'bg-white/20 border-white/40 text-white shadow-[0_4px_24px_rgba(255,255,255,0.1)] backdrop-blur-xl' 
                              : 'border-transparent text-white/40 hover:text-white hover:bg-white/[0.08] hover:border-white/20 hover:backdrop-blur-md'}
                          `}
                        >
                          <motion.div
                            variants={{
                              initial: { x: "-100%", opacity: 0 },
                              hover: { x: "200%", opacity: 1 }
                            }}
                            transition={{ duration: 0.8, ease: "easeInOut" }}
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-20 pointer-events-none z-0"
                          />
                          <div className={`
                            relative z-10 size-10 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0
                            group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:rounded-lg
                            ${pathname === item.url 
                              ? 'bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.6)]' 
                              : 'bg-white/20 text-white group-hover/btn:bg-white/30 group-hover/btn:text-white'}
                          `}>
                            {item.icon && <item.icon className="size-5 shrink-0 group-data-[collapsible=icon]:size-5 stroke-[2.2]" />}
                          </div>
                          <span className="relative z-10 text-sm font-bold tracking-wide group-data-[collapsible=icon]:hidden opacity-0 group-data-[state=expanded]:opacity-100 transition-opacity duration-300">{item.title}</span>
                          {pathname === item.url && (
                            <motion.div 
                              layoutId="active-pill" 
                              className="relative z-10 ml-auto size-1.5 bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,1)] group-data-[collapsible=icon]:hidden"
                            />
                          )}
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

      <SidebarFooter className="p-6 bg-transparent border-t border-white/5 group-data-[collapsible=icon]:p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleSignOut}
              className="h-16 p-0 bg-transparent hover:bg-transparent overflow-hidden group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:rounded-xl"
              tooltip="Sign Out"
            >
              <motion.div 
                whileHover={{ scale: 1.02, backgroundColor: "rgba(239, 68, 68, 0.1)" }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-4 px-6 py-4 rounded-2xl w-full h-full border border-red-500/10 text-red-400 border-red-500/30 transition-all group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-0 group-data-[collapsible=icon]:rounded-xl"
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
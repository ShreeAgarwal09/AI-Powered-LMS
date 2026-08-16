import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import type { LucideIcon } from "lucide-react";
import { BookOpen, LogOut, PanelLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

export type DashboardMenuItem = { icon: LucideIcon; label: string; path: string };
const DEFAULT_WIDTH = 270;
const MIN_WIDTH = 205;
const MAX_WIDTH = 380;

export default function DashboardLayout({ children, menuItems, title = "EduSphere" }: { children: React.ReactNode; menuItems: DashboardMenuItem[]; title?: string }) {
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH);
  const { loading, user } = useAuth();
  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) return <div className="grid min-h-screen place-items-center bg-[#fdfbf5] p-5"><div className="max-w-sm text-center"><BookOpen className="mx-auto mb-5 h-10 w-10 text-[#be8732]" /><h1 className="font-display text-3xl font-bold">Continue your learning</h1><p className="mt-3 text-sm leading-6 text-slate-600">Sign in to access your personalized EduSphere workspace.</p><Button className="mt-6 w-full bg-[#173352]" onClick={() => startLogin()}>Sign in</Button></div></div>;
  return <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as React.CSSProperties}><DashboardContent menuItems={menuItems} title={title} setSidebarWidth={setSidebarWidth}>{children}</DashboardContent></SidebarProvider>;
}

function DashboardContent({ children, menuItems, title, setSidebarWidth }: { children: React.ReactNode; menuItems: DashboardMenuItem[]; title: string; setSidebarWidth: (width: number) => void }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [resizing, setResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const active = menuItems.find((item) => item.path === location);
  useEffect(() => { const move = (event: MouseEvent) => { if (!resizing) return; const left = sidebarRef.current?.getBoundingClientRect().left ?? 0; const width = event.clientX - left; if (width >= MIN_WIDTH && width <= MAX_WIDTH) setSidebarWidth(width); }; const up = () => setResizing(false); if (resizing) { document.addEventListener("mousemove", move); document.addEventListener("mouseup", up); } return () => { document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up); }; }, [resizing, setSidebarWidth]);
  return <><div className="relative" ref={sidebarRef}><Sidebar collapsible="icon" className="border-r border-slate-200 bg-[#132d49] text-slate-100" disableTransition={resizing}><SidebarHeader className="h-[74px] justify-center"><div className="flex items-center gap-3 px-3"><button onClick={toggleSidebar} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-300 transition hover:bg-white/10" aria-label="Toggle navigation"><PanelLeft size={18} /></button>{!isCollapsed && <div className="min-w-0"><p className="font-display text-lg font-bold text-white">{title}</p><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#d6b26c]">Learning platform</p></div>}</div></SidebarHeader><SidebarContent className="gap-0"><SidebarMenu className="px-2 py-3">{menuItems.map((item) => <SidebarMenuItem key={item.path}><SidebarMenuButton isActive={location === item.path} onClick={() => setLocation(item.path)} tooltip={item.label} className="h-11 text-slate-300 hover:bg-white/10 hover:text-white data-[active=true]:bg-[#d6b26c] data-[active=true]:text-[#142d49]"><item.icon className="h-4 w-4" /><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarContent><SidebarFooter className="p-3"><DropdownMenu><DropdownMenuTrigger asChild><button className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-white/10"><Avatar className="h-9 w-9 border border-white/15"><AvatarFallback className="bg-[#d6b26c] text-xs font-bold text-[#173352]">{user?.name?.slice(0, 1).toUpperCase() || "E"}</AvatarFallback></Avatar>{!isCollapsed && <div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{user?.name || "Learner"}</p><p className="truncate text-xs capitalize text-slate-400">{user?.role}</p></div>}</button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive"><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem></DropdownMenuContent></DropdownMenu></SidebarFooter></Sidebar>{!isCollapsed && <div className="absolute right-0 top-0 h-full w-1 cursor-col-resize" onMouseDown={() => setResizing(true)} />}</div><SidebarInset className="bg-[#f8f6f1]">{isMobile && <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-[#f8f6f1]/95 px-3 backdrop-blur"><SidebarTrigger className="h-9 w-9" /><p className="text-sm font-semibold">{active?.label || title}</p></div>}<main className="min-h-screen p-4 md:p-7">{children}</main></SidebarInset></>;
}

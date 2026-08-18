import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { Bell, BookOpen, BrainCircuit, ChevronDown, LayoutDashboard, Menu, Search, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

export function AppHeader() {
  const { user, loading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const links = [{ label: "Home", path: "/" }, { label: "Courses", path: "/courses" }, { label: "Categories", path: "/courses" }, { label: "AI Tutor", path: "/ai-tutor", icon: BrainCircuit }, { label: "About", path: "/about" }];
  const workspaceLabel = user?.role === "instructor" ? "Instructor studio" : user?.role === "admin" ? "Admin console" : "My learning";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-900/8 bg-[rgba(255,255,255,.88)] backdrop-blur-xl">
      <div className="container flex h-[76px] items-center justify-between gap-5">
        <Link href="/" className="flex items-center gap-2.5 text-slate-900" onClick={() => setOpen(false)}>
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#143a61] text-[#dceeff] shadow-[0_8px_18px_rgba(20,58,97,.22)]"><BookOpen size={18} /></span>
          <span className="font-display text-[1.45rem] font-bold tracking-tight">EduSphere</span>
        </Link>
        <nav className="hidden items-center gap-6 lg:flex">
          {links.map((link) => <Link key={link.label} href={link.path} className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 transition-colors hover:text-[#143a61]">{link.icon && <link.icon className="h-4 w-4" />}{link.label}</Link>)}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="icon" className="rounded-xl text-slate-500 hover:bg-slate-100" onClick={() => setLocation("/courses")} aria-label="Search courses"><Search className="h-4 w-4" /></Button>
          {loading ? null : user ? <><Button variant="ghost" size="icon" className="rounded-xl text-slate-500 hover:bg-slate-100" aria-label="Notifications"><Bell className="h-4 w-4" /></Button><Button variant="outline" className="rounded-xl border-slate-200 bg-white font-semibold text-slate-700" onClick={() => setLocation("/portal")}><span className="mr-2 grid h-5 w-5 place-items-center rounded-full bg-[#dceeff] text-[10px] font-bold text-[#143a61]">{user.name?.slice(0,1) || "E"}</span>{workspaceLabel}<ChevronDown className="ml-2 h-3.5 w-3.5" /></Button><Button variant="ghost" className="text-slate-500" onClick={logout}>Sign out</Button></> : <><Button variant="ghost" className="font-semibold" onClick={() => startLogin()}>Sign in</Button><Button className="rounded-xl bg-[#143a61] px-5 text-white shadow-[0_8px_16px_rgba(20,58,97,.16)] hover:bg-[#0f2f52]" onClick={() => startLogin()}><Sparkles className="mr-2 h-4 w-4" />Get started</Button></>}
        </div>
        <button className="grid h-10 w-10 place-items-center rounded-lg md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle navigation">{open ? <X size={20} /> : <Menu size={21} />}</button>
      </div>
      {open && <div className="border-t border-slate-900/8 bg-white px-5 py-4 shadow-xl lg:hidden"><nav className="flex flex-col gap-1">{links.map((link) => <Link key={link.label} href={link.path} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-[#edf5fb]">{link.icon && <link.icon className="h-4 w-4 text-[#143a61]" />}{link.label}</Link>)}{user ? <Button className="mt-3 rounded-xl bg-[#143a61]" onClick={() => { setOpen(false); setLocation("/portal"); }}><LayoutDashboard className="mr-2 h-4 w-4" />{workspaceLabel}</Button> : <Button className="mt-3 rounded-xl bg-[#143a61]" onClick={() => startLogin()}>Sign in to begin</Button>}</nav></div>}
    </header>
  );
}

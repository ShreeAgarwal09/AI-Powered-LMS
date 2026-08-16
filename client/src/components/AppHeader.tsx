import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { BookOpen, LayoutDashboard, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

export function AppHeader() {
  const { user, loading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const links = [{ label: "Courses", path: "/courses" }, { label: "About", path: "/about" }, { label: "Contact", path: "/contact" }];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-900/8 bg-[rgba(255,253,248,.91)] backdrop-blur-xl">
      <div className="container flex h-[72px] items-center justify-between gap-5">
        <Link href="/" className="flex items-center gap-2.5 text-slate-900" onClick={() => setOpen(false)}>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#173352] text-[#f7e6b5] shadow-sm"><BookOpen size={18} /></span>
          <span className="font-display text-[1.4rem] font-bold tracking-tight">EduSphere</span>
        </Link>
        <nav className="hidden items-center gap-7 md:flex">
          {links.map((link) => <Link key={link.path} href={link.path} className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-950">{link.label}</Link>)}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {loading ? null : user ? <><Button variant="ghost" className="text-slate-700" onClick={() => setLocation("/portal")}><LayoutDashboard className="mr-2 h-4 w-4" />Workspace</Button><Button variant="outline" className="border-slate-900/15 bg-white" onClick={logout}>Sign out</Button></> : <><Button variant="ghost" onClick={() => startLogin()}>Sign in</Button><Button className="bg-[#173352] text-white hover:bg-[#24476d]" onClick={() => startLogin()}>Get started</Button></>}
        </div>
        <button className="grid h-10 w-10 place-items-center rounded-lg md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle navigation">{open ? <X size={20} /> : <Menu size={21} />}</button>
      </div>
      {open && <div className="border-t border-slate-900/8 bg-[#fffdf8] px-5 py-4 md:hidden"><nav className="flex flex-col gap-3">{links.map((link) => <Link key={link.path} href={link.path} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">{link.label}</Link>)}{user ? <Button className="mt-1 bg-[#173352]" onClick={() => { setOpen(false); setLocation("/portal"); }}>Open workspace</Button> : <Button className="mt-1 bg-[#173352]" onClick={() => startLogin()}>Sign in to begin</Button>}</nav></div>}
    </header>
  );
}

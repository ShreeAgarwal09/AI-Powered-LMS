import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import { Link } from "wouter";

export default function Unauthorized() {
  return <div className="min-h-screen bg-[#fdfbf5]"><AppHeader /><main className="container grid min-h-[70vh] place-items-center py-14 text-center"><div><span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#f1eee5] text-[#9b6416]"><ShieldAlert className="h-8 w-8" /></span><p className="eyebrow mt-6">Access restricted</p><h1 className="mt-2 font-display text-4xl font-bold text-[#173352]">This space is not for your account role.</h1><p className="mx-auto mt-4 max-w-md leading-7 text-slate-600">Choose another workspace or update your learning role in your profile.</p><Link href="/portal"><Button className="mt-7 bg-[#173352]">Go to my workspace</Button></Link></div></main></div>;
}

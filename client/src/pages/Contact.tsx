import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail } from "lucide-react";
import { FormEvent } from "react";
import { toast } from "sonner";

export default function Contact() { const submit = (event: FormEvent) => { event.preventDefault(); toast.success("Thanks for getting in touch. We’ll respond as soon as we can."); (event.target as HTMLFormElement).reset(); }; return <div className="min-h-screen bg-[#fdfbf5]"><AppHeader /><main className="container grid gap-12 py-16 lg:grid-cols-[.85fr_1.15fr]"><div><p className="eyebrow">Contact</p><h1 className="mt-3 font-display text-5xl font-bold leading-tight text-[#173352]">Let’s talk about learning.</h1><p className="mt-5 max-w-md leading-7 text-slate-600">Questions about EduSphere, teaching on the platform, or building your learning program? Send a note and tell us what you have in mind.</p><div className="mt-8 flex items-center gap-3 text-sm text-slate-600"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e9e2d1] text-[#173352]"><Mail className="h-4 w-4" /></span><span>hello@edusphere.example</span></div></div><form onSubmit={submit} className="rounded-[1.5rem] border border-slate-900/8 bg-white p-6 shadow-lift md:p-8"><div className="grid gap-5 sm:grid-cols-2"><div><Label htmlFor="name">Name</Label><Input id="name" required className="mt-2" /></div><div><Label htmlFor="email">Email</Label><Input id="email" type="email" required className="mt-2" /></div></div><div className="mt-5"><Label htmlFor="subject">Subject</Label><Input id="subject" required className="mt-2" /></div><div className="mt-5"><Label htmlFor="message">Message</Label><Textarea id="message" required className="mt-2 min-h-36" /></div><Button className="mt-6 bg-[#173352]" type="submit">Send message</Button></form></main></div>; }


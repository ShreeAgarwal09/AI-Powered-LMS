import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Mail } from "lucide-react";
import { FormEvent } from "react";
import { toast } from "sonner";

export default function Contact() {
  const submitMessage = trpc.contact.submit.useMutation({
    onSuccess: () => toast.success("Thanks for getting in touch. Your message has been received."),
    onError: () => toast.error("We could not send your message. Please try again."),
  });
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    submitMessage.mutate({ name: String(data.get("name") ?? ""), email: String(data.get("email") ?? ""), subject: String(data.get("subject") ?? ""), message: String(data.get("message") ?? "") }, { onSuccess: () => form.reset() });
  };
  return <div className="min-h-screen bg-[#fdfbf5]"><AppHeader /><main className="container grid gap-12 py-16 lg:grid-cols-[.85fr_1.15fr]"><div><p className="eyebrow">Contact</p><h1 className="mt-3 font-display text-5xl font-bold leading-tight text-[#173352]">Let’s talk about learning.</h1><p className="mt-5 max-w-md leading-7 text-slate-600">Questions about EduSphere, teaching on the platform, or building your learning program? Send a note and tell us what you have in mind.</p><div className="mt-8 flex items-center gap-3 text-sm text-slate-600"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e9e2d1] text-[#173352]"><Mail className="h-4 w-4" /></span><span>Messages are stored securely for platform follow-up.</span></div></div><form onSubmit={submit} className="rounded-[1.5rem] border border-slate-900/8 bg-white p-6 shadow-lift md:p-8"><div className="grid gap-5 sm:grid-cols-2"><div><Label htmlFor="name">Name</Label><Input id="name" name="name" required className="mt-2" /></div><div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required className="mt-2" /></div></div><div className="mt-5"><Label htmlFor="subject">Subject</Label><Input id="subject" name="subject" required className="mt-2" /></div><div className="mt-5"><Label htmlFor="message">Message</Label><Textarea id="message" name="message" required className="mt-2 min-h-36" /></div><Button className="mt-6 bg-[#173352]" type="submit" disabled={submitMessage.isPending}>{submitMessage.isPending ? "Sending..." : "Send message"}</Button></form></main></div>;
}

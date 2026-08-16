import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Download, ShieldCheck } from "lucide-react";
import { Link, useRoute } from "wouter";

export default function Certificate() {
  const [, params] = useRoute("/certificate/:id");
  const certificateId = Number(params?.id);
  const certificates = trpc.learning.certificates.useQuery();
  const item: any = certificates.data?.find((record: any) => record.certificate.id === certificateId);
  if (certificates.isLoading) return <div className="grid min-h-screen place-items-center bg-[#f8f6f1]">Preparing certificate…</div>;
  if (!item) return <div className="grid min-h-screen place-items-center bg-[#f8f6f1] p-6 text-center"><div><h1 className="font-display text-3xl font-bold text-[#173352]">Certificate not found</h1><Link href="/portal/certificates"><Button className="mt-5 bg-[#173352]">Return to certificates</Button></Link></div></div>;
  return <main className="min-h-screen bg-[#f8f6f1] px-5 py-10 print:bg-white print:p-0"><div className="mx-auto max-w-4xl"><div className="mb-6 flex justify-between print:hidden"><Link href="/portal/certificates" className="text-sm font-semibold text-[#173352]">← All certificates</Link><Button onClick={() => window.print()} className="bg-[#173352]"><Download className="mr-2 h-4 w-4" />Download / print</Button></div><section className="relative overflow-hidden border-[10px] border-[#d6b26c] bg-[#fffdf6] px-8 py-16 text-center shadow-[0_20px_70px_rgba(35,46,60,.14)] md:px-20"><div className="absolute inset-3 border border-[#173352]/25" /><div className="relative"><ShieldCheck className="mx-auto h-10 w-10 text-[#b6812b]" /><p className="mt-8 text-xs font-bold uppercase tracking-[.22em] text-[#9b6416]">EduSphere certificate of completion</p><h1 className="mt-5 font-display text-5xl font-bold text-[#173352]">This certifies that</h1><p className="mt-9 font-display text-4xl font-bold italic text-[#a3691a]">{item.certificate.userId ? "An EduSphere learner" : ""}</p><p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-slate-600">has successfully completed the learning experience</p><h2 className="mt-5 font-display text-4xl font-bold text-[#173352]">{item.course.title}</h2><p className="mt-7 text-sm text-slate-500">Issued {new Date(item.certificate.issuedAt).toLocaleDateString()} · Certificate ID {item.certificate.certificateCode}</p><div className="mx-auto mt-10 h-px max-w-sm bg-[#d6b26c]" /><p className="mt-4 text-sm font-semibold text-[#173352]">EduSphere · Learn with purpose</p></div></section></div></main>;
}

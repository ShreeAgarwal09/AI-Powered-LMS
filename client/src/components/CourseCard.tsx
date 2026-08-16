import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock3, GraduationCap } from "lucide-react";
import { Link } from "wouter";

export function money(cents: number, currency = "USD") {
  return cents === 0 ? "Free" : new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(cents / 100);
}

export function CourseCard({ item, priority = false }: { item: any; priority?: boolean }) {
  const course = item.course ?? item;
  const category = item.categoryName ?? "Learning";
  return <Link href={`/courses/${course.slug}`} className="group block overflow-hidden rounded-[1.25rem] border border-slate-900/8 bg-white shadow-[0_12px_35px_rgba(28,42,59,.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(28,42,59,.13)]">
    <div className={`relative aspect-[16/9] overflow-hidden ${course.thumbnailUrl ? "bg-slate-100" : "course-cover"}`}>{course.thumbnailUrl ? <img src={course.thumbnailUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading={priority ? "eager" : "lazy"} /> : <><div className="absolute -right-8 -top-6 h-32 w-32 rounded-full border-[16px] border-white/15" /><div className="absolute bottom-5 left-5"><BookOpen className="mb-3 h-7 w-7 text-[#f4d789]" /><p className="max-w-[15rem] font-display text-2xl leading-tight text-white">{course.title}</p></div></>}</div>
    <div className="p-5"><div className="mb-3 flex items-center justify-between gap-2"><Badge className="bg-[#edf2f0] text-[#2e665a] hover:bg-[#edf2f0]">{category}</Badge><span className="text-sm font-bold text-[#9b6416]">{money(course.priceCents, course.currency)}</span></div><h3 className="line-clamp-2 text-lg font-bold tracking-tight text-slate-900">{course.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{course.shortDescription}</p><div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500"><span className="flex items-center gap-1.5"><GraduationCap className="h-4 w-4 text-[#b6812b]" />{item.instructorName || "EduSphere instructor"}</span><span className="flex items-center gap-1.5 capitalize"><Clock3 className="h-4 w-4" />{course.level}</span></div></div>
  </Link>;
}

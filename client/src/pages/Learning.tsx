import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, ChevronLeft, ChevronRight, FileText, Lock, PlayCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Link, useRoute } from "wouter";

export default function Learning() {
  const [, params] = useRoute("/learn/:courseId");
  const courseId = Number(params?.courseId);
  const state = trpc.learning.courseState.useQuery({ courseId }, { enabled: Boolean(courseId) });
  const utils = trpc.useUtils();
  const [currentLessonId, setCurrentLessonId] = useState<number | null>(null);

  useEffect(() => {
    if (!currentLessonId && state.data?.lessons[0]) setCurrentLessonId(state.data.lessons[0].id);
  }, [currentLessonId, state.data]);

  const markLesson = trpc.learning.markLesson.useMutation({
    onSuccess: () => {
      utils.learning.courseState.invalidate({ courseId });
      utils.learning.myCourses.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const data: any = state.data;
  const current = useMemo(() => data?.lessons.find((lesson: any) => lesson.id === currentLessonId) ?? data?.lessons[0], [data, currentLessonId]);
  if (state.isLoading) return <div className="grid min-h-screen place-items-center bg-[#f8f6f1]"><Skeleton className="h-[600px] w-[90%] rounded-3xl" /></div>;
  if (!data || !current) return <div className="grid min-h-screen place-items-center bg-[#f8f6f1] p-6 text-center"><div><Lock className="mx-auto h-8 w-8 text-[#b6812b]" /><h1 className="mt-4 font-display text-3xl font-bold text-[#173352]">Your learning space is unavailable</h1><Link href="/portal"><Button className="mt-5 bg-[#173352]">Back to workspace</Button></Link></div></div>;

  const lessonIndex = data.lessons.findIndex((lesson: any) => lesson.id === current.id);
  const progressByLesson = new Map<number, any>(data.progress.map((item: any) => [item.lessonId, item]));
  const currentProgress: any = progressByLesson.get(current.id);
  const next = data.lessons[lessonIndex + 1];
  const previous = data.lessons[lessonIndex - 1];
  const savePosition = (position: number, completed = Boolean(currentProgress?.completed)) => {
    markLesson.mutate({ courseId, lessonId: current.id, completed, lastPositionSeconds: Math.floor(position) });
  };

  return <div className="min-h-screen bg-[#111f32] text-slate-900">
    <header className="flex h-16 items-center justify-between border-b border-white/10 bg-[#132d49] px-4 text-white md:px-6">
      <Link href="/portal" className="flex items-center gap-2 text-sm font-semibold text-slate-200 hover:text-white"><ChevronLeft className="h-4 w-4" />My learning</Link>
      <div className="hidden max-w-md flex-1 px-10 md:block"><Progress value={data.overallProgress} className="h-2 bg-white/15" /></div>
      <span className="text-sm font-semibold text-[#f4d789]">{data.overallProgress}% complete</span>
    </header>
    <div className="grid min-h-[calc(100vh-64px)] lg:grid-cols-[310px_1fr]">
      <aside className="order-2 border-r border-white/10 bg-[#132d49] p-4 text-slate-200 lg:order-1">
        <p className="px-2 text-xs font-bold uppercase tracking-[.15em] text-[#d6b26c]">Course content</p><h2 className="px-2 pt-2 font-display text-xl font-bold text-white">{data.course.title}</h2>
        <div className="mt-5 space-y-4">{data.sections.map((section: any, index: number) => <div key={section.id}><p className="px-2 text-xs font-semibold text-slate-400">{index + 1}. {section.title}</p><div className="mt-2 space-y-1">{data.lessons.filter((lesson: any) => lesson.sectionId === section.id).map((lesson: any) => { const progress = progressByLesson.get(lesson.id); const active = current.id === lesson.id; return <button key={lesson.id} onClick={() => setCurrentLessonId(lesson.id)} className={`flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-sm transition ${active ? "bg-white/12 text-white" : "text-slate-300 hover:bg-white/7"}`}>{progress?.completed ? <CheckCircle2 className="h-4 w-4 shrink-0 text-[#9fd4b5]" /> : <PlayCircle className="h-4 w-4 shrink-0 text-[#d6b26c]" />}<span className="line-clamp-2">{lesson.title}</span></button>; })}</div></div>)}</div>
      </aside>
      <main className="order-1 bg-[#f8f6f1] px-5 py-7 lg:order-2 lg:px-10"><div className="mx-auto max-w-5xl">
        <div className="overflow-hidden rounded-2xl bg-[#0f1d30] shadow-2xl"><div className="aspect-video">{current.videoUrl ? <video src={current.videoUrl} controls className="h-full w-full" onLoadedMetadata={(event) => { if (currentProgress?.lastPositionSeconds) event.currentTarget.currentTime = currentProgress.lastPositionSeconds; }} onPause={(event) => savePosition(event.currentTarget.currentTime)} onEnded={(event) => savePosition(event.currentTarget.duration || 0, true)} /> : <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_50%_30%,#2a5f76,#132d49_58%,#0c1d32)] text-center text-white"><div><PlayCircle className="mx-auto h-14 w-14 text-[#f4d789]" /><p className="mt-4 font-display text-2xl font-bold">{current.title}</p><p className="mt-2 text-sm text-slate-300">Video will appear here when your instructor adds a lesson URL.</p></div></div>}</div></div>
        <div className="mt-8 flex flex-wrap items-start justify-between gap-5"><div><p className="eyebrow">Lesson {lessonIndex + 1} of {data.lessons.length}</p><h1 className="mt-2 font-display text-4xl font-bold text-[#173352]">{current.title}</h1></div><Button onClick={() => savePosition(currentProgress?.lastPositionSeconds || 0, !currentProgress?.completed)} disabled={markLesson.isPending} className={currentProgress?.completed ? "bg-[#e3efe7] text-[#246151] hover:bg-[#d3e7d9]" : "bg-[#173352] text-white hover:bg-[#24476d]"}>{currentProgress?.completed ? <><CheckCircle2 className="mr-2 h-4 w-4" />Completed</> : "Mark as complete"}</Button></div>
        <p className="mt-5 max-w-3xl whitespace-pre-line leading-7 text-slate-600">{current.description || "Your instructor has not added lesson notes yet."}</p>
        {current.resources?.length ? <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-semibold text-[#173352]">Lesson resources</h2><div className="mt-3 flex flex-wrap gap-2">{current.resources.map((resource: any) => <a href={resource.url} target="_blank" rel="noreferrer" key={resource.url} className="inline-flex items-center gap-2 rounded-lg bg-[#f1eee5] px-3 py-2 text-sm font-semibold text-[#173352] hover:bg-[#e7dfca]"><FileText className="h-4 w-4" />{resource.label}</a>)}</div></div> : null}
        <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-6"><Button variant="outline" disabled={!previous} onClick={() => previous && setCurrentLessonId(previous.id)}><ChevronLeft className="mr-2 h-4 w-4" />Previous</Button>{next ? <Button className="bg-[#173352]" onClick={() => setCurrentLessonId(next.id)}>Next lesson <ChevronRight className="ml-2 h-4 w-4" /></Button> : data.quizzes[0] ? <Link href={`/quiz/${data.quizzes[0].id}`}><Button className="bg-[#173352]">Take assessment <ChevronRight className="ml-2 h-4 w-4" /></Button></Link> : <span className="text-sm font-semibold text-[#2f7362]">Course lessons complete</span>}</div>
      </div></main>
    </div>
  </div>;
}

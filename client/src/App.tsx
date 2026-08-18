import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import About from "@/pages/About";
import AiTutor from "@/pages/AiTutor";
import Contact from "@/pages/Contact";
import Certificate from "@/pages/Certificate";
import CourseDetail from "@/pages/CourseDetail";
import Courses from "@/pages/Courses";
import Home from "@/pages/Home";
import Learning from "@/pages/Learning";
import NotFound from "@/pages/NotFound";
import Portal from "@/pages/Portal";
import Profile from "@/pages/Profile";
import Quiz from "@/pages/Quiz";
import InstructorStudio from "@/pages/InstructorStudio";
import Unauthorized from "@/pages/Unauthorized";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Route, Switch } from "wouter";

function Router() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/courses" component={Courses} />
    <Route path="/courses/:slug" component={CourseDetail} />
    <Route path="/certificate/:id" component={Certificate} />
    <Route path="/learn/:courseId" component={Learning} />
    <Route path="/quiz/:quizId" component={Quiz} />
    <Route path="/portal" component={Portal} />
    <Route path="/portal/:section" component={Portal} />
    <Route path="/instructor/courses" component={InstructorStudio} />
    <Route path="/instructor/new" component={InstructorStudio} />
    <Route path="/profile" component={Profile} />
    <Route path="/unauthorized" component={Unauthorized} />
    <Route path="/about" component={About} />
    <Route path="/ai-tutor" component={AiTutor} />
    <Route path="/contact" component={Contact} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster richColors position="top-right" /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}

import { Navbar } from "@/components/portfolio/navbar";
import { Hero } from "@/components/portfolio/hero";
import { Ticker } from "@/components/portfolio/ticker";
import { About } from "@/components/portfolio/about";
import { Skills } from "@/components/portfolio/skills";
// import { Projects } from "@/components/portfolio/projects";
import { Contact } from "@/components/portfolio/contact";
import { Footer } from "@/components/portfolio/footer";
import { LoadingScreen } from "@/components/portfolio/loading-screen";
import { ScrollProgress } from "@/components/portfolio/scroll-progress";
import { BackToTop } from "@/components/portfolio/back-to-top";

export default function Home() {
  return (
    <>
      <LoadingScreen />
      <ScrollProgress />
      <Navbar />
      <main className="relative flex min-h-screen flex-col">
        <Hero />
        <Ticker />
        <About />
        <Skills />
        {/* <Projects /> */}
        <Contact />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}

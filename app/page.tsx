import Navbar from "@/components/layout/Navbar";
import Preloader from "@/components/layout/Preloader";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import Values from "@/components/sections/Values";
import Services from "@/components/sections/Services";
import Process from "@/components/sections/Process";
import Projects from "@/components/sections/Projects";
import Integrations from "@/components/sections/Integrations";
import Testimonials from "@/components/sections/Testimonials";
import Pricing from "@/components/sections/Pricing";
import Team from "@/components/sections/Team";
import Faqs from "@/components/sections/Faqs";
import Footer from "@/components/layout/Footer";

export default function Home() {
  return (
    <>
      <Preloader />
      <Navbar />
      <main>
        <Hero />
        <About />
        <Values />
        <Services />
        <Process />
        <Projects />
        <Integrations />
        <Testimonials />
        <Pricing />
        <Team />
        <Faqs />
      </main>
      <Footer />
    </>
  );
}

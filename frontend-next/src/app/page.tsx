import LoadingScreen from "@/components/LoadingScreen";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import Stats from "@/components/Stats";
import HowItWorks from "@/components/HowItWorks";
import RedFlags from "@/components/RedFlags";
import ParticleField from "@/components/ParticleField";
import Footer from "@/components/Footer";
import TopNav from "@/components/TopNav";

export default function Home() {
  return (
    <main className="w-full flex flex-col min-h-screen bg-white overflow-x-hidden">
      <TopNav />
      <LoadingScreen />
      
      <div className="z-10 relative">
        <Hero />
      </div>

      <Marquee />


      <Stats />

      <HowItWorks />

      <ParticleField />

      <RedFlags />

      <Footer />
    </main>
  );
}

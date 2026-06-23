import Navbar from "@/components/Navbar";
import Hero from "@/sections/Hero";
import About from "@/sections/About";
import Notes from "@/sections/Notes";
import Gallery from "@/sections/Gallery";
import Footer from "@/sections/Footer";

export default function Home() {
  return (
    <div>
      <Navbar />
      <main>
        <Hero />
        <About />
        <Notes />
        <Gallery />
      </main>
      <Footer />
    </div>
  );
}

import Header from "./components/landingpage/Header";
import Hero from "./components/landingpage/Hero";
import Features from "./components/landingpage/Features";
import Footer from "./components/landingpage/Footer";

export default function Home() {
  return (
    <div className="bg-white text-black">
      <Header />
        <Hero />
        <Features />
      <Footer />
    </div>
  );
}
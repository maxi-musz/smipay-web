import Header from "../components/Header-new";
import Hero from "../components/Hero";
import TrustMarquee from "../components/TrustMarquee";
import StackCard from "../components/home/StackCard";
import WhyOurApp from "../components/home/WhyOurApp";
import Testimonial from "../components/home/Testimonial";
import Faq from "../components/home/Faq";
import DownloadApp from "../components/home/DownloadApp";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      <TrustMarquee />
      <StackCard />
      <WhyOurApp />
      <Testimonial />
      <Faq />
      <DownloadApp />
      <Footer /> 
    </div>
  );
}

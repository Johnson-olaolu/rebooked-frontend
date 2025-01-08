import Hero from "./components/Hero";
import Stats from "./components/Stats";
import WeeklyHighlights from "./components/WeeklyHighlights";
import TopCategories from "./components/TopCategories";
import CurrentBestsellers from "./components/CurrentBestsellers";
import FeaturedBook from "./components/FeaturedBook";
import TopPicks from "./components/TopPicks";
import FeaturedAuthors from "./components/FeaturedAuthors";
import Testimonials from "./components/Testimonials";
import ServiceHighlights from "./components/ServiceHighlights";
import BlogSection from "./components/BlogSection";
import Newsletter from "./components/Newsletter";

const Home = () => {
  return (
    <main>
      <Hero />
      <Stats />
      <WeeklyHighlights />
      <TopCategories />
      <CurrentBestsellers />
      <FeaturedBook />
      <TopPicks />
      <FeaturedAuthors />
      <Testimonials />
      <ServiceHighlights />
      <BlogSection />
      <Newsletter />
    </main>
  );
};

export default Home;

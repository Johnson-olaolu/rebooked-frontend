import React from "react";
import AnnouncementBar from "./components/AnnouncementBar";
import Header from "./components/Header";
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
import Footer from "./components/Footer";

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBar />
      <Header />
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
      <Footer />
    </div>
  );
};

export default Home;

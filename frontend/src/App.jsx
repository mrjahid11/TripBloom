import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import PopularDestinations from './components/PopularDestinations';
import TourCategories from './components/TourCategories';
import WhyChooseUs from './components/WhyChooseUs';
import Reviews from './components/Reviews';
import Contact from './components/Contact';
import Footer from './components/Footer';

function App() {
  return (
    <div className="App bg-white dark:bg-gray-900 transition-colors duration-300">
      <Navbar />
      <Hero />
      <HowItWorks />
      <PopularDestinations />
      <TourCategories />
      <WhyChooseUs />
      <Reviews />
      <Contact />
      <Footer />
    </div>
  );
}

export default App;

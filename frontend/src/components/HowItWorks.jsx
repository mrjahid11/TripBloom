import React from 'react';
import { FaSearch, FaPalette, FaLock, FaPlane } from 'react-icons/fa';

const HowItWorks = () => {
  const steps = [
    {
      icon: <FaSearch className="text-5xl text-primary" />,
      title: 'Search & Explore',
      description: 'Choose your dream destination or browse package types.'
    },
    {
      icon: <FaPalette className="text-5xl text-secondary" />,
      title: 'Customize Your Tour',
      description: 'Select category: Silver, Gold, Platinum, or Diamond Elite.'
    },
    {
      icon: <FaLock className="text-5xl text-accent" />,
      title: 'Book Securely',
      description: 'Pay safely online and get instant confirmation.'
    },
    {
      icon: <FaPlane className="text-5xl text-primary" />,
      title: 'Enjoy the Journey',
      description: 'Travel with comfort, safety, and peace of mind.'
    }
  ];

  return (
    <div className="w-full bg-transparent backdrop-blur-sm dark:bg-gray-900/60 relative">
      <div className="absolute inset-0 pointer-events-none z-0 bg-gradient-to-r from-purple-50/18 via-transparent to-blue-50/12"></div>
      <section className="section-container bg-transparent relative overflow-hidden py-12 lg:py-16 relative z-10">
      {/* Background Decoration */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <div className="absolute top-10 left-10 w-40 h-40 bg-primary rounded-full filter blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-10 right-10 w-60 h-60 bg-secondary rounded-full filter blur-3xl animate-pulse-slow" style={{animationDelay: '2s'}}></div>
      </div>

      <h2 className="section-title dark:text-white relative z-10 animate-fade-in-up">How It Works</h2>
      <p className="section-subtitle dark:text-gray-300 relative z-10 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
        Plan your perfect trip in just 4 simple steps
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
        {steps.map((step, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-700 p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-4 hover:scale-105 text-center group animate-fade-in-up"
            style={{animationDelay: `${index * 0.15}s`}}
          >
            <div className="flex justify-center mb-4 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
              {step.icon}
            </div>
            <div className="text-4xl font-bold text-gray-300 dark:text-gray-600 mb-2 group-hover:text-primary dark:group-hover:text-primary transition-colors duration-300">0{index + 1}</div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3 group-hover:text-primary dark:group-hover:text-primary transition-colors duration-300">{step.title}</h3>
            <p className="text-gray-600 dark:text-gray-300">{step.description}</p>
            
            {/* Connecting Arrow (except for last item) */}
            {index < steps.length - 1 && (
              <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-gray-300 dark:text-gray-600 text-3xl animate-pulse">
                →
              </div>
            )}
          </div>
        ))}
      </div>
      </section>
    </div>
  );
};

export default HowItWorks;

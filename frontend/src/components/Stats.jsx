import React, { useState, useEffect } from 'react';
import { FaGlobeAmericas, FaUsers, FaStar, FaMapMarkedAlt } from 'react-icons/fa';
import axios from 'axios';

const Stats = () => {
  const [stats, setStats] = useState({
    packages: 0,
    customers: 0,
    reviews: 0,
    destinations: 0
  });
  const [animatedStats, setAnimatedStats] = useState({
    packages: 0,
    customers: 0,
    reviews: 0,
    destinations: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/stats');
      if (response.data.success) {
        const fetchedStats = response.data.stats;
        setStats(fetchedStats);
        // Animate counters
        animateCounters(fetchedStats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Fallback stats
      const fallbackStats = {
        packages: 150,
        customers: 5000,
        reviews: 1200,
        destinations: 50
      };
      setStats(fallbackStats);
      animateCounters(fallbackStats);
    }
  };

  const animateCounters = (targetStats) => {
    const duration = 2000; // 2 seconds
    const steps = 60;
    const stepDuration = duration / steps;

    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      setAnimatedStats({
        packages: Math.floor(targetStats.packages * progress),
        customers: Math.floor(targetStats.customers * progress),
        reviews: Math.floor(targetStats.reviews * progress),
        destinations: Math.floor(targetStats.destinations * progress)
      });

      if (currentStep >= steps) {
        clearInterval(interval);
        setAnimatedStats(targetStats);
      }
    }, stepDuration);
  };

  const statsData = [
    {
      icon: <FaGlobeAmericas className="text-5xl" />,
      value: animatedStats.packages,
      label: 'Tour Packages',
      suffix: '+',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: <FaUsers className="text-5xl" />,
      value: animatedStats.customers,
      label: 'Happy Travelers',
      suffix: '+',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: <FaStar className="text-5xl" />,
      value: animatedStats.reviews,
      label: '5-Star Reviews',
      suffix: '+',
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      icon: <FaMapMarkedAlt className="text-5xl" />,
      value: animatedStats.destinations,
      label: 'Destinations',
      suffix: '+',
      color: 'from-purple-500 to-purple-600'
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-r from-primary to-green-600 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full filter blur-3xl animate-float"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full filter blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {statsData.map((stat, index) => (
            <div
              key={index}
              className="text-center text-white transform hover:scale-110 transition-all duration-300 animate-fade-in-up"
              style={{animationDelay: `${index * 0.1}s`}}
            >
              <div className="flex justify-center mb-4 transform hover:rotate-12 transition-transform duration-300">
                {stat.icon}
              </div>
              <div className="text-5xl font-bold mb-2">
                {stat.value.toLocaleString()}{stat.suffix}
              </div>
              <div className="text-lg font-semibold opacity-90">{stat.label}</div>
              
              {/* Decorative line */}
              <div className="mt-4 h-1 w-20 bg-white/30 mx-auto rounded-full"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Wave separator */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z" fill="white" className="dark:fill-gray-900"/>
        </svg>
      </div>
    </section>
  );
};

export default Stats;

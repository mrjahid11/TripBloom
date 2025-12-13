import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaUsers, FaHotel, FaBus, FaUtensils, FaMapSigns } from 'react-icons/fa';

const TourCategories = () => {
  const navigate = useNavigate();
  
  const personalFeatures = [
    { icon: <FaUser />, text: 'Custom itineraries tailored to you' },
    { icon: <FaMapSigns />, text: 'Flexible dates and destinations' },
    { icon: <FaHotel />, text: 'Choose your accommodation tier' },
    { icon: <FaBus />, text: 'Private or shared transport options' },
  ];

  const groupFeatures = [
    { icon: <FaUsers />, text: 'Fixed schedule, all-inclusive' },
    { icon: <FaHotel />, text: 'Pre-booked hotels and resorts' },
    { icon: <FaBus />, text: 'Group transport included' },
    { icon: <FaUtensils />, text: 'All meals and activities covered' },
  ];

  return (
    <div className="w-full bg-transparent backdrop-blur-sm dark:bg-gray-900/60 relative">
      <div className="absolute inset-0 pointer-events-none z-0 bg-gradient-to-r from-orange-50/15 via-yellow-50/6 to-amber-50/12"></div>
      <section id="packages" className="section-container bg-transparent py-12 lg:py-16 relative z-10">
      <h2 className="section-title dark:text-white animate-fade-in-up">Tour Categories</h2>
      <p className="section-subtitle dark:text-gray-300 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
        Choose between personalized tours or all-inclusive group packages
      </p>

      {/* Personal vs Group */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
        {/* Personal Tours */}
        <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-8 rounded-2xl shadow-xl border-2 border-primary hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 animate-fade-in-left">
          <div className="text-center mb-6">
            <FaUser className="text-6xl text-primary mx-auto mb-4 animate-float" />
            <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Personal Tours</h3>
            <p className="text-gray-600 dark:text-gray-300">Designed just for you</p>
          </div>
          <ul className="space-y-4">
            {personalFeatures.map((feature, index) => (
              <li key={index} className="flex items-start gap-3 text-gray-700 dark:text-gray-300 transform hover:translate-x-2 transition-transform duration-300">
                <span className="text-primary text-xl mt-1">{feature.icon}</span>
                <span className="text-lg">{feature.text}</span>
              </li>
            ))}
          </ul>
          <button 
            onClick={() => navigate('/packages?type=PERSONAL')}
            className="w-full btn-primary mt-6 transform hover:scale-105 transition-all duration-300"
          >
            Customize Your Tour
          </button>
        </div>

        {/* Group Tours */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-8 rounded-2xl shadow-xl border-2 border-secondary hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 animate-fade-in-right">
          <div className="text-center mb-6">
            <FaUsers className="text-6xl text-secondary mx-auto mb-4 animate-float" style={{animationDelay: '1s'}} />
            <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Group Tours</h3>
            <p className="text-gray-600 dark:text-gray-300">Join fellow travelers</p>
          </div>
          <ul className="space-y-4">
            {groupFeatures.map((feature, index) => (
              <li key={index} className="flex items-start gap-3 text-gray-700 dark:text-gray-300 transform hover:translate-x-2 transition-transform duration-300">
                <span className="text-secondary text-xl mt-1">{feature.icon}</span>
                <span className="text-lg">{feature.text}</span>
              </li>
            ))}
          </ul>
          <button 
            onClick={() => navigate('/packages?type=GROUP')}
            className="w-full bg-secondary text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-all duration-300 shadow-lg mt-6 transform hover:scale-105"
          >
            Browse Group Packages
          </button>
        </div>
      </div>
      </section>
    </div>
  );
};

export default TourCategories;

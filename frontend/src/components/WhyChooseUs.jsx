import React from 'react';
import { FaBrain, FaShieldAlt, FaCreditCard, FaTrophy, FaCalendarCheck, FaLeaf } from 'react-icons/fa';

const WhyChooseUs = () => {
  const features = [
    {
      icon: <FaBrain className="text-5xl" />,
      title: 'AI-Powered Recommendations',
      description: 'Smart suggestions based on your preferences and travel history',
      color: 'text-purple-600'
    },
    {
      icon: <FaShieldAlt className="text-5xl" />,
      title: 'Safe Travel & Verified Partners',
      description: 'All operators are background-checked and certified',
      color: 'text-blue-600'
    },
    {
      icon: <FaCreditCard className="text-5xl" />,
      title: 'Secure Payments & Easy Refunds',
      description: 'PCI-compliant payment gateway with flexible cancellation',
      color: 'text-green-600'
    },
    {
      icon: <FaTrophy className="text-5xl" />,
      title: 'Reward Points & Discounts',
      description: 'Earn points on every booking and unlock exclusive deals',
      color: 'text-amber-600'
    },
    {
      icon: <FaCalendarCheck className="text-5xl" />,
      title: 'Flexible Duration Packages',
      description: 'From day trips to month-long adventures',
      color: 'text-indigo-600'
    },
    {
      icon: <FaLeaf className="text-5xl" />,
      title: 'Eco-Friendly Travel Options',
      description: 'Support sustainable tourism with green-certified tours',
      color: 'text-teal-600'
    }
  ];

  return (
    <section id="about" className="section-container bg-gray-50 dark:bg-gradient-to-b dark:from-white dark:to-gray-50 dark:dark:from-gray-900 dark:dark:to-gray-800 relative overflow-hidden border-y border-gray-200 dark:border-gray-700">
      {/* Animated Background Shapes */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-400 rounded-full filter blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-400 rounded-full filter blur-3xl animate-float" style={{animationDelay: '3s'}}></div>
      </div>

      <h2 className="section-title dark:text-white relative z-10 animate-fade-in-up">Why Choose TripBloom?</h2>
      <p className="section-subtitle dark:text-gray-300 relative z-10 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
        We bring together convenience, adventure, and reliability under one platform
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
        {features.map((feature, index) => (
          <div
            key={index}
            className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-4 hover:scale-105 text-center group animate-fade-in-up border border-transparent hover:border-primary/30"
            style={{animationDelay: `${index * 0.1}s`}}
          >
            <div className={`${feature.color} flex justify-center mb-4 transform group-hover:scale-125 group-hover:rotate-12 transition-all duration-500`}>
              {feature.icon}
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3 group-hover:text-primary dark:group-hover:text-primary transition-colors duration-300">{feature.title}</h3>
            <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
            
            {/* Hover Accent Line */}
            <div className="mt-4 h-1 w-0 group-hover:w-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 mx-auto rounded-full"></div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WhyChooseUs;

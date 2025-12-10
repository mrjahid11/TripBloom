import React, { useState, useEffect } from 'react';
import { FaClock, FaDollarSign, FaMapMarkerAlt } from 'react-icons/fa';
import axios from 'axios';

const PopularDestinations = () => {
  const [destinations, setDestinations] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchDestinations();
  }, []);

  const fetchDestinations = async () => {
    // Using local data for now (backend not ready)
    setDestinations([
      { id: 1, name: 'Bali Paradise', duration: '7 Days', price: 1299, image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=500&h=300&fit=crop', type: 'International' },
      { id: 2, name: 'Cox\'s Bazar Beach', duration: '3 Days', price: 299, image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=300&fit=crop', type: 'Domestic' },
      { id: 3, name: 'Maldives Retreat', duration: '5 Days', price: 1899, image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=500&h=300&fit=crop', type: 'International' },
      { id: 4, name: 'Sundarbans Mangrove', duration: '2 Days', price: 199, image: 'https://images.unsplash.com/photo-1511497584788-876760111969?w=500&h=300&fit=crop', type: 'Domestic' },
      { id: 5, name: 'Potenga Beach', duration: '1 Day', price: 299, image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=300&fit=crop', type: 'Domestic' },
      { id: 6, name: 'Paris Romance', duration: '8 Days', price: 2199, image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=500&h=300&fit=crop', type: 'International' },
    ]);
    
    // Uncomment when backend is ready:
    // try {
    //   const response = await axios.get('/api/destinations');
    //   setDestinations(response.data);
    // } catch (error) {
    //   console.error('Error fetching destinations:', error);
    // }
  };

  const filters = ['All', 'Domestic', 'International', 'Day Tours', 'Multi-day'];

  // Filter destinations based on selected filter
  const filteredDestinations = destinations.filter((destination) => {
    if (filter === 'all') return true;
    if (filter === 'domestic') return destination.type === 'Domestic';
    if (filter === 'international') return destination.type === 'International';
    if (filter === 'day tours') return parseInt(destination.duration) === 1;
    if (filter === 'multi-day') return parseInt(destination.duration) > 1;
    return true;
  });

  return (
    <section id="destinations" className="section-container bg-white dark:bg-gradient-to-b dark:from-white dark:to-gray-50 dark:dark:from-gray-900 dark:dark:to-gray-800 border-y border-gray-100 dark:border-gray-800">
      <h2 className="section-title dark:text-white animate-fade-in-up">Popular Destinations</h2>
      <p className="section-subtitle dark:text-gray-300 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
        Discover trending tours and breathtaking destinations
      </p>

      {/* Filters */}
      <div className="flex flex-wrap justify-center gap-4 mb-12 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
        {filters.map((f, index) => (
          <button
            key={f}
            onClick={() => setFilter(f.toLowerCase())}
            className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 ${
              filter === f.toLowerCase()
                ? 'bg-primary text-white shadow-lg scale-105'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
            style={{animationDelay: `${0.3 + index * 0.1}s`}}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Destinations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredDestinations.map((destination, index) => (
          <div
            key={destination.id}
            className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 hover:scale-105 group animate-fade-in-up"
            style={{animationDelay: `${0.1 * index}s`}}
          >
            <div className="relative h-64 overflow-hidden">
              <img
                src={destination.image}
                alt={destination.name}
                className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute top-4 right-4 bg-primary text-white px-4 py-2 rounded-full font-bold">
                ${destination.price}
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">{destination.name}</h3>
              <div className="flex items-center gap-4 text-gray-600 dark:text-gray-300 mb-4">
                <span className="flex items-center gap-2">
                  <FaClock className="text-primary" />
                  {destination.duration}
                </span>
                <span className="flex items-center gap-2">
                  <FaMapMarkerAlt className="text-secondary" />
                  {destination.type}
                </span>
              </div>
              <button className="w-full btn-primary">View Details</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PopularDestinations;

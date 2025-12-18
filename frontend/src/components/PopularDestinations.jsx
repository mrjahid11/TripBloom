import React, { useState, useEffect } from 'react';
import { FaClock, FaDollarSign, FaMapMarkerAlt } from 'react-icons/fa';
import axios from 'axios';
import TourDetailModal from './TourDetailModal';

const PopularDestinations = () => {
  const [destinations, setDestinations] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchDestinations();
  }, []);

  const fetchDestinations = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/admin/packages');
      if (response.data.success && response.data.packages) {
        // Transform the tour packages data to match the component's expected format
        const transformedPackages = response.data.packages
          .filter(pkg => pkg.isActive) // Only show active packages
          .map(pkg => ({
            id: pkg._id,
            name: pkg.title,
            duration: `${pkg.defaultDays} Days`,
            price: pkg.basePrice,
            // Use first destination or fallback
            image: getDestinationImage(pkg.destinations?.[0]?.country || pkg.destinations?.[0]?.city),
            type: determinePackageType(pkg),
            description: pkg.description,
            destinations: pkg.destinations
          }));
        
        // Select only 3 random packages for popular destinations
        const shuffled = [...transformedPackages].sort(() => 0.5 - Math.random());
        const selectedPackages = shuffled.slice(0, 3);
        
        setDestinations(selectedPackages);
      }
    } catch (error) {
      console.error('Error fetching destinations:', error);
      // Fallback to empty array on error
      setDestinations([]);
    }
  };

  // Helper function to determine package type based on destinations
  const determinePackageType = (pkg) => {
    if (!pkg.destinations || pkg.destinations.length === 0) return 'Unknown';
    
    // Check if any destination is international (non-Bangladesh)
    const hasInternational = pkg.destinations.some(dest => 
      dest.country && dest.country.toLowerCase() !== 'bangladesh'
    );
    
    return hasInternational ? 'International' : 'Domestic';
  };

  // Helper function to get appropriate image based on destination
  const getDestinationImage = (location) => {
    if (!location) return 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=500&h=300&fit=crop';
    
    const locationLower = location.toLowerCase();
    
    // Map common destinations to relevant images
    const imageMap = {
      'bali': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=500&h=300&fit=crop',
      'maldives': 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=500&h=300&fit=crop',
      'paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=500&h=300&fit=crop',
      'dubai': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=500&h=300&fit=crop',
      'thailand': 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=500&h=300&fit=crop',
      'singapore': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=500&h=300&fit=crop',
      'bangladesh': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=300&fit=crop',
      'sundarbans': 'https://images.unsplash.com/photo-1511497584788-876760111969?w=500&h=300&fit=crop',
      'cox': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=300&fit=crop',
    };
    
    // Find matching image or use default
    for (const [key, image] of Object.entries(imageMap)) {
      if (locationLower.includes(key)) return image;
    }
    
    // Default travel image
    return 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=500&h=300&fit=crop';
  };

  const filters = ['All', 'Domestic', 'International', 'Day Tours', 'Multi-day'];

  // Since we're showing only 3 random packages, disable filtering
  // Users can find more packages in Tour Categories section
  const filteredDestinations = destinations;

  const handleViewDetails = async (destination) => {
    try {
      // Fetch full package details from the backend
      const response = await axios.get(`http://localhost:3000/api/admin/packages/${destination.id}`);
      if (response.data.success && response.data.package) {
        setSelectedPackage(response.data.package);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching package details:', error);
      // Fallback: use the destination data we already have
      setSelectedPackage({
        _id: destination.id,
        title: destination.name,
        description: destination.description,
        basePrice: destination.price,
        defaultDays: parseInt(destination.duration),
        defaultNights: parseInt(destination.duration) - 1,
        destinations: destination.destinations,
        type: destination.type === 'International' ? 'PERSONAL' : 'GROUP',
        isActive: true,
        inclusions: {}
      });
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPackage(null);
  };

  return (
    <div className="w-full bg-transparent backdrop-blur-sm dark:bg-gray-900/60 relative">
      <div className="absolute inset-0 pointer-events-none z-0 bg-gradient-to-r from-emerald-50/20 via-transparent to-cyan-50/20"></div>
      <section id="destinations" className="section-container bg-transparent py-12 lg:py-16 relative z-10">
      <h2 className="section-title dark:text-white animate-fade-in-up">Popular Destinations</h2>
      <p className="section-subtitle dark:text-gray-300 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
        Discover our handpicked top destinations - explore more in Tour Categories
      </p>

      {/* Destinations Grid - Show only 3 packages */}
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
              <button 
                className="w-full btn-primary"
                onClick={() => handleViewDetails(destination)}
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Tour Detail Modal */}
      <TourDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        packageData={selectedPackage}
        userRole="CUSTOMER"
      />
      </section>
    </div>
  );
};

export default PopularDestinations;

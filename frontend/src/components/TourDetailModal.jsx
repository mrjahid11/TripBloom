import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { 
  FaTimes, FaMapMarkerAlt, FaStar, FaCalendarAlt, 
  FaUsers, FaBed, FaUtensils, FaCar, FaUserTie, FaClock, 
  FaCheck, FaPlane, FaShieldAlt, FaCamera, FaHeart,
  FaChevronLeft, FaChevronRight, FaEdit
} from 'react-icons/fa';

const TourDetailModal = ({ isOpen, onClose, packageData, userRole = 'CUSTOMER' }) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingData, setBookingData] = useState({
    numTravelers: 1,
    startDate: '',
    customizations: ''
  });

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restore scroll position without jump
        const scrollY = document.body.style.top;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      };
    }
  }, [isOpen]);

  if (!isOpen || !packageData) return null;

  // Get images based on destinations
  const getPackageImages = () => {
    const images = [];
    
    // First, use uploaded photos if available
    if (packageData.photos && packageData.photos.length > 0) {
      packageData.photos.forEach(photoUrl => {
        if (photoUrl && photoUrl.trim()) {
          images.push(photoUrl);
        }
      });
      // If we have photos, return them
      if (images.length > 0) return images;
    }
    
    // Otherwise, fallback to destination-based images
    packageData.destinations?.forEach(dest => {
      const location = (dest.country || dest.city || '').toLowerCase();
      if (location.includes('bali')) images.push('https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=500&fit=crop');
      else if (location.includes('maldives')) images.push('https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&h=500&fit=crop');
      else if (location.includes('paris')) images.push('https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=500&fit=crop');
      else if (location.includes('dubai')) images.push('https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=500&fit=crop');
      else if (location.includes('thailand')) images.push('https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&h=500&fit=crop');
      else if (location.includes('cox')) images.push('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=500&fit=crop');
      else if (location.includes('sundarban')) images.push('https://images.unsplash.com/photo-1511497584788-876760111969?w=800&h=500&fit=crop');
      else images.push('https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=500&fit=crop');
    });
    
    // Default images if none found
    if (images.length === 0) {
      images.push(
        'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=500&fit=crop',
        'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&h=500&fit=crop',
        'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=800&h=500&fit=crop'
      );
    }
    
    return images;
  };

  const images = getPackageImages();

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleBooking = async () => {
    try {
      const response = await axios.post('http://localhost:3000/api/bookings', {
        packageId: packageData._id,
        ...bookingData
      });
      
      if (response.data.success) {
        alert('Booking request submitted successfully!');
        setShowBookingForm(false);
        onClose();
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('Failed to submit booking. Please try again.');
    }
  };

  const handleCustomize = () => {
    // For personal tours, allow customization
    alert('Customization feature coming soon! You will be able to modify destinations, duration, and preferences.');
  };

  const isGroupTour = packageData.type === 'GROUP';
  const canCustomize = !isGroupTour && userRole === 'CUSTOMER';

  const modalContent = (
    <div className="fixed inset-0 overflow-y-auto" style={{ zIndex: 99999 }}>
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
          onClick={onClose}
        ></div>
        
        {/* Modal Content */}
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl overflow-hidden animate-scale-in" style={{ zIndex: 99999 }}>
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 p-2 rounded-full shadow-lg transition-all"
          >
            <FaTimes size={20} />
          </button>

          {/* Image Gallery */}
          <div className="relative h-96 overflow-hidden group">
            <img
              src={images[activeImageIndex]}
              alt={packageData.title}
              className="w-full h-full object-cover"
            />
            
            {/* Image overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
            
            {/* Navigation buttons */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <FaChevronLeft className="text-gray-800 dark:text-white" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <FaChevronRight className="text-gray-800 dark:text-white" />
                </button>
              </>
            )}

            {/* Image indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === activeImageIndex ? 'bg-white w-8' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>

            {/* Title overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-4xl font-bold mb-2">{packageData.title}</h2>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full flex items-center gap-2">
                      <FaClock />
                      {packageData.defaultDays}D/{packageData.defaultNights}N
                    </span>
                    <span className="px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full">
                      {isGroupTour ? '🚌 Group Tour' : '✨ Personal Tour'}
                    </span>
                    {packageData.category && (
                      <span className="px-4 py-1.5 bg-yellow-500/80 backdrop-blur-sm rounded-full font-semibold">
                        {packageData.category}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right bg-white/10 backdrop-blur-sm px-6 py-3 rounded-xl">
                  <div className="text-sm opacity-90">Starting from</div>
                  <div className="text-5xl font-bold">${packageData.basePrice?.toLocaleString()}</div>
                  <div className="text-xs opacity-75">per person</div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 max-h-[50vh] overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Description */}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <FaPlane className="text-primary" />
                    About This Tour
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                    {packageData.description || 'Embark on an unforgettable journey filled with amazing experiences, cultural discoveries, and breathtaking scenery. This carefully curated tour package offers the perfect blend of adventure and relaxation.'}
                  </p>
                </div>

                {/* Destinations Timeline */}
                {packageData.destinations && packageData.destinations.length > 0 && (
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                      <FaMapMarkerAlt className="text-primary" />
                      Your Journey
                    </h3>
                    <div className="relative">
                      <div className="absolute left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-blue-400 to-green-400"></div>
                      
                      <div className="space-y-6">
                        {packageData.destinations
                          .sort((a, b) => (a.order || 0) - (b.order || 0))
                          .map((dest, index) => (
                            <div key={index} className="relative pl-16">
                              <div className="absolute left-3 top-4 w-6 h-6 bg-gradient-to-br from-primary to-green-500 rounded-full border-4 border-white dark:border-gray-800 shadow-lg flex items-center justify-center text-white text-xs font-bold">
                                {dest.order || index + 1}
                              </div>
                              
                              <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                      {dest.name}
                                    </h4>
                                    <p className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                                      <FaMapMarkerAlt className="text-primary" />
                                      {dest.city && `${dest.city}, `}{dest.country}
                                    </p>
                                  </div>
                                  <span className="px-4 py-2 bg-primary text-white rounded-full text-sm font-bold shadow-md">
                                    Day {dest.order || index + 1}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* What's Included */}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <FaCheck className="text-green-500" />
                    What's Included
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {packageData.inclusions?.transport && (
                      <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="bg-blue-500 text-white p-3 rounded-lg">
                          <FaCar className="text-2xl" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white mb-1">Transportation</div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">{packageData.inclusions.transport}</div>
                        </div>
                      </div>
                    )}
                    {packageData.inclusions?.hotel && (
                      <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="bg-purple-500 text-white p-3 rounded-lg">
                          <FaBed className="text-2xl" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white mb-1">Accommodation</div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">{packageData.inclusions.hotel}</div>
                        </div>
                      </div>
                    )}
                    {packageData.inclusions?.meals && (
                      <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="bg-orange-500 text-white p-3 rounded-lg">
                          <FaUtensils className="text-2xl" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white mb-1">Meals</div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">{packageData.inclusions.meals}</div>
                        </div>
                      </div>
                    )}
                    {packageData.inclusions?.guide && (
                      <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="bg-green-500 text-white p-3 rounded-lg">
                          <FaUserTie className="text-2xl" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white mb-1">Tour Guide</div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">Expert local guide included</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Extras/Activities */}
                {packageData.extras && packageData.extras.length > 0 && (
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <FaStar className="text-yellow-500" />
                      Special Features
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {packageData.extras.map((extra, index) => (
                        <span 
                          key={index}
                          className="px-5 py-2.5 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 text-gray-800 dark:text-gray-200 rounded-full text-sm font-semibold shadow-sm hover:shadow-md transition-shadow"
                        >
                          ✨ {extra}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar - Booking Card */}
              <div className="lg:col-span-1">
                <div className="sticky top-4 bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-600">
                  <div className="mb-6 text-center">
                    <div className="text-gray-600 dark:text-gray-400 text-sm mb-2">Price per person</div>
                    <div className="text-5xl font-bold text-primary mb-1">
                      ${packageData.basePrice?.toLocaleString()}
                    </div>
                    <div className="flex items-center justify-center gap-2 text-yellow-500">
                      <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                      <span className="text-gray-600 dark:text-gray-400 text-sm ml-2">(4.8/5)</span>
                    </div>
                  </div>

                  {!showBookingForm ? (
                    <div className="space-y-3">
                      {isGroupTour ? (
                        <>
                          <button 
                            onClick={() => setShowBookingForm(true)}
                            className="w-full py-4 bg-gradient-to-r from-primary to-green-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-primary transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            Book This Tour
                          </button>
                          <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                            🚌 Group tours have fixed schedules and cannot be customized
                          </p>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => setShowBookingForm(true)}
                            className="w-full py-4 bg-gradient-to-r from-primary to-green-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-primary transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            Book As-Is
                          </button>
                          {canCustomize && (
                            <button 
                              onClick={handleCustomize}
                              className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold rounded-xl hover:from-pink-600 hover:to-purple-500 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
                            >
                              <FaEdit />
                              Customize Your Tour
                            </button>
                          )}
                          <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                            ✨ Personal tours can be customized to your preferences
                          </p>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-4">Book Your Adventure</h4>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Number of Travelers
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={bookingData.numTravelers}
                          onChange={(e) => setBookingData({...bookingData, numTravelers: parseInt(e.target.value)})}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Preferred Start Date
                        </label>
                        <input
                          type="date"
                          value={bookingData.startDate}
                          onChange={(e) => setBookingData({...bookingData, startDate: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Special Requests (Optional)
                        </label>
                        <textarea
                          value={bookingData.customizations}
                          onChange={(e) => setBookingData({...bookingData, customizations: e.target.value})}
                          rows="3"
                          placeholder="Any special requirements or preferences..."
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white resize-none"
                        />
                      </div>

                      <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-600 dark:text-gray-400">Price per person:</span>
                          <span className="font-bold text-gray-900 dark:text-white">${packageData.basePrice}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-600 dark:text-gray-400">Travelers:</span>
                          <span className="font-bold text-gray-900 dark:text-white">×{bookingData.numTravelers}</span>
                        </div>
                        <div className="border-t border-gray-300 dark:border-gray-700 mt-2 pt-2 flex justify-between">
                          <span className="font-bold text-gray-900 dark:text-white">Total:</span>
                          <span className="font-bold text-2xl text-primary">${(packageData.basePrice * bookingData.numTravelers).toLocaleString()}</span>
                        </div>
                      </div>

                      <button 
                        onClick={handleBooking}
                        className="w-full py-4 bg-gradient-to-r from-primary to-green-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-primary transition-all shadow-lg"
                      >
                        Confirm Booking
                      </button>
                      <button 
                        onClick={() => setShowBookingForm(false)}
                        className="w-full py-3 bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* Trust Badges */}
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600 space-y-3">
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <FaShieldAlt className="text-green-500" />
                      <span>Secure payment & booking</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <FaCamera className="text-blue-500" />
                      <span>Photo memories included</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <FaHeart className="text-red-500" />
                      <span>Best price guarantee</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default TourDetailModal;

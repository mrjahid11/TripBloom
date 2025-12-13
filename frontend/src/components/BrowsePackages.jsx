import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { FaSearch, FaFilter, FaStar, FaClock, FaDollarSign, FaMapMarkerAlt, FaUsers, FaUser } from 'react-icons/fa';
import TourDetailModal from './TourDetailModal';

const BrowsePackages = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || '');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  useEffect(() => {
    fetchPackages();
  }, [typeFilter, categoryFilter, minPrice, maxPrice]);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const params = {};
      if (typeFilter) params.type = typeFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      if (searchTerm) params.search = searchTerm;

      const response = await axios.get('http://localhost:5000/api/packages/search', { params });
      
      if (response.data.success) {
        setPackages(response.data.packages);
      }
    } catch (error) {
      console.error('Failed to fetch packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPackages();
  };

  const handleViewDetails = (pkg) => {
    setSelectedPackage(pkg);
    setShowModal(true);
  };

  const clearFilters = () => {
    setTypeFilter('');
    setCategoryFilter('');
    setMinPrice('');
    setMaxPrice('');
    setSearchTerm('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary via-green-500 to-emerald-500 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate('/')}
            className="mb-4 px-4 py-2 bg-white/20 backdrop-blur-md rounded-lg hover:bg-white/30 transition-colors"
          >
            ← Back to Home
          </button>
          <h1 className="text-4xl font-bold mb-4">Browse Tour Packages</h1>
          <p className="text-xl text-green-100">Discover your next adventure</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by destination, title, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg"
              />
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Types</option>
                <option value="PERSONAL">Personal Tours</option>
                <option value="GROUP">Group Tours</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={typeFilter === 'GROUP'}
              >
                <option value="">All Categories</option>
                <option value="SILVER">Silver</option>
                <option value="GOLD">Gold</option>
                <option value="PLATINUM">Platinum</option>
                <option value="DIAMOND">Diamond Elite</option>
              </select>

              <input
                type="number"
                placeholder="Min Price"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />

              <input
                type="number"
                placeholder="Max Price"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <FaSearch />
                Search Packages
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </form>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-lg text-gray-700 dark:text-gray-300">
            Found <span className="font-bold text-primary">{packages.length}</span> packages
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading packages...</p>
          </div>
        )}

        {/* Packages Grid */}
        {!loading && packages.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg._id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden border border-gray-200 dark:border-gray-700 cursor-pointer"
                onClick={() => handleViewDetails(pkg)}
              >
                {/* Package Type Badge */}
                <div className="relative">
                  <div className="absolute top-4 right-4 z-10">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      pkg.type === 'GROUP' 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' 
                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    }`}>
                      {pkg.type === 'GROUP' ? <><FaUsers className="mr-1" /> Group</> : <><FaUser className="mr-1" /> Personal</>}
                    </span>
                  </div>
                  {pkg.category && (
                    <div className="absolute top-4 left-4 z-10">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                        {pkg.category}
                      </span>
                    </div>
                  )}
                  {/* Placeholder Image */}
                  <div className="h-48 bg-gradient-to-br from-primary to-green-600 flex items-center justify-center">
                    <FaMapMarkerAlt className="text-white text-6xl opacity-30" />
                  </div>
                </div>

                {/* Package Info */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {pkg.title}
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {pkg.description}
                  </p>

                  {/* Destinations */}
                  {pkg.destinations && pkg.destinations.length > 0 && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <FaMapMarkerAlt className="mr-2 text-primary" />
                      <span className="line-clamp-1">{pkg.destinations.join(', ')}</span>
                    </div>
                  )}

                  {/* Duration */}
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <FaClock className="mr-2 text-primary" />
                    <span>{pkg.defaultDays} Days / {pkg.defaultNights} Nights</span>
                  </div>

                  {/* Price */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center">
                      <FaDollarSign className="text-primary mr-1" />
                      <span className="text-2xl font-bold text-primary">
                        {pkg.basePrice?.toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">
                        {pkg.type === 'GROUP' ? '/person' : 'starting'}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(pkg);
                      }}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && packages.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
            <FaMapMarkerAlt className="mx-auto text-6xl text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Packages Found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Try adjusting your filters or search terms
            </p>
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Tour Detail Modal */}
      {showModal && selectedPackage && (
        <TourDetailModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          tour={selectedPackage}
        />
      )}
    </div>
  );
};

export default BrowsePackages;

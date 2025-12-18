import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { FaSearch, FaFilter, FaStar, FaClock, FaDollarSign, FaMapMarkerAlt, FaUsers, FaUser, FaHeart, FaRegHeart } from 'react-icons/fa';
import TourDetailModal from './TourDetailModal';

const BrowsePackages = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestedPackages, setSuggestedPackages] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [savedPackageIds, setSavedPackageIds] = useState(new Set());

  console.log('[BrowsePackages] Component rendered, searchParams:', Object.fromEntries(searchParams.entries()));

  // Filters
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || '');
  const [scopeFilter, setScopeFilter] = useState(searchParams.get('scope') || '');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  console.log('[BrowsePackages] Initial filters - searchTerm:', searchTerm, 'typeFilter:', typeFilter);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch packages when filters change or on initial load
  useEffect(() => {
    fetchPackages();
  }, [typeFilter, categoryFilter, searchTerm, scopeFilter]);

  // Load saved packages for logged-in customer
  useEffect(() => {
    const loadSaved = async () => {
      try {
        const userRole = localStorage.getItem('userRole');
        const userId = localStorage.getItem('userId');
        if (userRole === 'customer' && userId) {
          const res = await axios.get(`/api/users/${userId}/saved`);
          if (res.data && res.data.packages) {
            setSavedPackageIds(new Set(res.data.packages.map(p => p._id)));
          }
        }
      } catch (err) {
        console.debug('Failed to load saved packages', err?.message || err);
      }
    };
    loadSaved();
  }, []);

  // When no packages are found, fetch popular destinations as alternatives
  useEffect(() => {
    const fetchAlternatives = async () => {
      if (loading) return;
      if (packages.length > 0) return;
      try {
        setLoadingSuggestions(true);
        // Fetch active packages from backend as suggestions
        const res = await axios.get('http://localhost:5000/api/packages/search');
        if (res && res.data && Array.isArray(res.data.packages)) {
          setSuggestedPackages(res.data.packages.slice(0, 6));
        }
      } catch (err) {
        console.error('Failed to load suggested packages', err);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    fetchAlternatives();
  }, [loading, packages.length]);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const params = {};
      if (typeFilter) params.type = typeFilter;
      if (scopeFilter) params.scope = scopeFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      if (searchTerm) params.search = searchTerm;

      console.log('[BrowsePackages] Fetching with params:', params);
      const response = await axios.get('http://localhost:5000/api/packages/search', { params });
      
      console.log('[BrowsePackages] Response:', response.data);
      if (response.data.success) {
        setPackages(response.data.packages);
        console.log('[BrowsePackages] Loaded packages:', response.data.packages.length);
      }
    } catch (error) {
      console.error('[BrowsePackages] Failed to fetch packages:', error);
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
    setScopeFilter('');
    setCategoryFilter('');
    setMinPrice('');
    setMaxPrice('');
    setSearchTerm('');
  };

  // Helper function to get image for package based on destination
  const getPackageImage = (pkg) => {
    if (pkg.photos && pkg.photos.length > 0) {
      return pkg.photos[0];
    }
    
    // Get first destination for image selection
    const firstDest = pkg.destinations?.[0];
    if (!firstDest) {
      return 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=400&fit=crop';
    }
    
    const location = (firstDest.country || firstDest.city || firstDest.name || '').toLowerCase();
    
    // Map destinations to images
    const imageMap = {
      'bangladesh': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop',
      'cox': 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=400&fit=crop',
      'sundarbans': 'https://images.unsplash.com/photo-1511497584788-876760111969?w=800&h=400&fit=crop',
      'sylhet': 'https://images.unsplash.com/photo-1563622797-cc703a4b2921?w=800&h=400&fit=crop',
      'bandarban': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop',
      'rangamati': 'https://images.unsplash.com/photo-1540202404-a2f29016b523?w=800&h=400&fit=crop',
      'saint martin': 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=400&fit=crop',
      'dubai': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=400&fit=crop',
      'thailand': 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&h=400&fit=crop',
      'malaysia': 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800&h=400&fit=crop',
      'maldives': 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&h=400&fit=crop',
      'nepal': 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&h=400&fit=crop',
      'singapore': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&h=400&fit=crop',
      'turkey': 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&h=400&fit=crop',
      'bhutan': 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=800&h=400&fit=crop',
    };
    
    for (const [key, image] of Object.entries(imageMap)) {
      if (location.includes(key)) return image;
    }
    
    return 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=400&fit=crop';
  };

  // Format destinations for display
  const formatDestinations = (destinations) => {
    if (!destinations || destinations.length === 0) return 'Various locations';
    return destinations
      .map(d => d.name || d.city || d.country)
      .filter(Boolean)
      .slice(0, 3)
      .join(', ') + (destinations.length > 3 ? '...' : '');
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                  value={scopeFilter}
                  onChange={(e) => setScopeFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Regions</option>
                  <option value="DOMESTIC">Domestic</option>
                  <option value="INTERNATIONAL">International</option>
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

              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold text-lg pointer-events-none z-10">
                  $
                </div>
                <input
                  type="number"
                  placeholder="Min Price"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 group-hover:border-primary/50"
                />
              </div>

              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold text-lg pointer-events-none z-10">
                  $
                </div>
                <input
                  type="number"
                  placeholder="Max Price"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 group-hover:border-primary/50"
                />
              </div>
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
                  {/* Package Image */}
                  <div className="h-48 overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600">
                    <img
                      src={getPackageImage(pkg)}
                      alt={pkg.title}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=400&fit=crop';
                      }}
                    />
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
                      <span className="line-clamp-1">{formatDestinations(pkg.destinations)}</span>
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
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(pkg);
                        }}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                      >
                        View Details
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const userId = localStorage.getItem('userId');
                          if (!userId) {
                            // prompt login
                            localStorage.setItem('afterLoginGoto', window.location.pathname);
                            window.dispatchEvent(new CustomEvent('openAuthModal'));
                            return;
                          }
                          const pkgId = pkg._id;
                          const isSaved = savedPackageIds.has(pkgId);
                          // Optimistic UI update
                          const next = new Set(savedPackageIds);
                          if (isSaved) next.delete(pkgId); else next.add(pkgId);
                          setSavedPackageIds(next);
                          try {
                            if (isSaved) {
                              await axios.delete(`/api/users/${userId}/save/${pkgId}`);
                            } else {
                              await axios.post(`/api/users/${userId}/save/${pkgId}`);
                            }
                          } catch (err) {
                            // rollback on error
                            const rollback = new Set(savedPackageIds);
                            setSavedPackageIds(rollback);
                            console.error('Failed to toggle saved package', err);
                          }
                        }}
                        className="p-2 rounded-full text-primary hover:text-red-600 transition-colors"
                        aria-label="Save package"
                      >
                        {savedPackageIds.has(pkg._id) ? <FaHeart className="text-red-600" /> : <FaRegHeart />}
                      </button>
                    </div>
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
            <div className="flex items-center justify-center gap-4 mb-6">
              <button
                onClick={clearFilters}
                className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Clear All Filters
              </button>
              <button
                onClick={() => { setSearchTerm(''); setTypeFilter(''); setScopeFilter(''); setCategoryFilter(''); setMinPrice(''); setMaxPrice(''); fetchPackages(); }}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Browse Popular
              </button>
            </div>

            {/* Suggestions */}
            <div className="mt-6">
              <h4 className="text-lg font-semibold mb-4">Try visiting these places</h4>
              {loadingSuggestions && (
                <p className="text-sm text-gray-500">Loading suggestions...</p>
              )}
              {!loadingSuggestions && suggestedPackages.length === 0 && (
                <p className="text-sm text-gray-500">No suggestions available right now.</p>
              )}
              {!loadingSuggestions && suggestedPackages.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-3">
                  {suggestedPackages.map((pkg) => (
                    <div key={pkg._id} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-left shadow-sm cursor-pointer" onClick={() => handleViewDetails(pkg)}>
                      <img src={getPackageImage(pkg)} alt={pkg.title} className="w-full h-40 object-cover rounded-md mb-3" />
                      <div className="font-semibold text-gray-900 dark:text-white mb-1">{pkg.title}</div>
                      <div className="text-sm text-gray-500 mb-2">{pkg.defaultDays} Days • ${pkg.basePrice}</div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">{pkg.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600 dark:text-gray-400">{formatDestinations(pkg.destinations)}</div>
                        <div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleViewDetails(pkg); }}
                            className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tour Detail Modal */}
      {showModal && selectedPackage && (
        <TourDetailModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          packageData={selectedPackage}
          userRole="CUSTOMER"
        />
      )}
    </div>
  );
};

export default BrowsePackages;

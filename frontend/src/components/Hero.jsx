import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { FaSearch, FaCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa';

const Hero = () => {
  const [searchData, setSearchData] = useState({
    destination: '',
    type: 'personal',
    dates: ''
  });

  // Autocomplete / suggestion state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [searchHistory, setSearchHistory] = useState([]);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const suggRef = useRef(null);
  const inputRef = useRef(null);

  // Debounce and cancel control for API calls
  const debounceRef = useRef(null);
  const abortRef = useRef(null);
  // Prefer Mapbox if token available in Vite env, otherwise fallback to Nominatim
  const MAPBOX_TOKEN = typeof import.meta !== 'undefined' ? import.meta.env.VITE_MAPBOX_TOKEN : undefined;

  const handleSearch = (e) => {
    e.preventDefault();
    console.log('Searching for:', searchData);
    const dest = (searchData.destination || '').trim();
    if (dest) {
      // Save to history (unique, most-recent-first, keep max 10)
      const normalized = dest;
      const updated = [normalized, ...searchHistory.filter(d => d.toLowerCase() !== normalized.toLowerCase())].slice(0, 10);
      setSearchHistory(updated);
      try {
        localStorage.setItem('tripbloom_search_history', JSON.stringify(updated));
      } catch (err) {
        // ignore storage errors
      }
      setShowSuggestions(false);
    }
  };

  // Load search history from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('tripbloom_search_history');
      if (raw) setSearchHistory(JSON.parse(raw));
    } catch (err) {
      // ignore
    }
  }, []);

  // Click outside to close suggestions
  useEffect(() => {
    const onDocClick = (ev) => {
      if (suggRef.current && !suggRef.current.contains(ev.target)) {
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const updateSuggestions = (value) => {
    const q = value.trim();
    // Update dropdown position based on input element
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
    // show history when input empty
    if (!q) {
      setFilteredSuggestions(searchHistory.slice(0, 6));
      setShowSuggestions(true);
      setActiveSuggestionIndex(-1);
      // cancel any pending requests
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
      return;
    }

    // debounce API calls
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      // cancel previous request
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        let suggestions = [];
        const encoded = encodeURIComponent(q);

        if (MAPBOX_TOKEN) {
          // Mapbox Places API
          const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&limit=8`;
          const res = await fetch(url, { signal: controller.signal });
          if (!res.ok) throw new Error('Mapbox error');
          const data = await res.json();
          suggestions = (data.features || []).map(f => ({ id: f.id, text: f.place_name }));
        } else {
          // OpenStreetMap Nominatim (no API key required)
          const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&addressdetails=1&limit=8`;
          const res = await fetch(url, { signal: controller.signal, headers: { 'Accept-Language': 'en' } });
          if (!res.ok) throw new Error('Nominatim error');
          const data = await res.json();
          suggestions = (data || []).map(d => ({ id: d.place_id || d.osm_id || d.lat + d.lon, text: d.display_name }));
        }

        // Merge history results that start with query to show first
        const historyMatches = searchHistory.filter(h => h.toLowerCase().startsWith(q.toLowerCase()));
        const mergedTexts = [...new Set([...historyMatches, ...suggestions.map(s => s.text)])].slice(0, 8);
        setFilteredSuggestions(mergedTexts);
        setShowSuggestions(true);
        setActiveSuggestionIndex(-1);
      } catch (err) {
        if (err.name === 'AbortError') return; // ignore aborted
        console.error('Places lookup failed', err);
        // fallback: show history
        setFilteredSuggestions(searchHistory.slice(0, 6));
        setShowSuggestions(true);
      } finally {
        abortRef.current = null;
      }
    }, 300);
  };

  const handleDestinationChange = (e) => {
    const value = e.target.value;
    setSearchData({...searchData, destination: value});
    updateSuggestions(value);
  };

  const handleSuggestionClick = (val) => {
    setSearchData({...searchData, destination: val});
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
  };

  const handleDestinationKeyDown = (e) => {
    if (!showSuggestions) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex(i => Math.min(i + 1, filteredSuggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (activeSuggestionIndex >= 0 && filteredSuggestions[activeSuggestionIndex]) {
        e.preventDefault();
        handleSuggestionClick(filteredSuggestions[activeSuggestionIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
    }
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-visible pt-16">
      {/* Enhanced Background with Overlay */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1920&q=80')",
          }}
        />
        {/* Light mode overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/50 via-green-600/40 to-emerald-600/70 dark:from-blue-600/50 dark:via-green-600/40 dark:to-emerald-600/50"></div>
      </div>

      {/* Animated Floating Circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-white/10 rounded-full filter blur-3xl animate-float"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-emerald-300/10 rounded-full filter blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-blue-300/10 rounded-full filter blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white -mt-16 sm:-mt-20">
        <div className="flex justify-center mb-2 animate-scale-in">
          <img src="/tripbloom_logo.svg" alt="TripBloom" className="w-44 h-44 sm:w-52 sm:h-52 lg:w-60 lg:h-60 animate-float hover:scale-110 transition-transform duration-300" />
        </div>
        <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold mb-3 animate-fade-in-up" style={{textShadow: '0 4px 12px rgba(0, 0, 0, 0.8), 0 2px 4px rgba(0, 0, 0, 0.6)'}}>
          Where Every Journey Blossoms
        </h1>
        <p className="text-xl sm:text-2xl mb-5 max-w-3xl mx-auto animate-fade-in-up" style={{animationDelay: '0.2s', textShadow: '0 3px 8px rgba(0, 0, 0, 0.8), 0 1px 3px rgba(0, 0, 0, 0.6)'}}>
          Plan your dream personal or group tour with ease and safety.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
          <button className="bg-white text-primary px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-all duration-300 shadow-2xl hover:shadow-xl transform hover:-translate-y-2 hover:scale-105">
            Book a Trip
          </button>
          <a 
            href="#packages"
            className="group relative bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300 shadow-2xl transform hover:-translate-y-2 hover:scale-105 overflow-hidden"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('packages')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              Explore Packages
              <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500 via-green-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </a>
        </div>

        {/* Enhanced Search Bar with Glass Effect */}
        <div className="max-w-4xl mx-auto bg-white/95 dark:bg-gray-800/95 backdrop-filter backdrop-blur-lg rounded-2xl shadow-2xl p-6 animate-fade-in-up hover-glow border border-white/20" style={{animationDelay: '0.6s'}}>
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Destination */}
            <div className="relative" ref={suggRef}>
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2 text-left">
                <FaMapMarkerAlt className="inline mr-2" />
                Destination
              </label>
              <input
                ref={inputRef}
                type="text"
                placeholder="Where to?"
                value={searchData.destination}
                onChange={handleDestinationChange}
                onKeyDown={handleDestinationKeyDown}
                onFocus={() => updateSuggestions(searchData.destination || '')}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-gray-800"
                aria-autocomplete="list"
                aria-controls="destination-suggestions"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2 text-left">
                Tour Type
              </label>
              <select
                value={searchData.type}
                onChange={(e) => setSearchData({...searchData, type: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-gray-800"
              >
                <option value="personal">Personal Tour</option>
                <option value="group">Group Tour</option>
              </select>
            </div>

            {/* Dates */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2 text-left">
                <FaCalendarAlt className="inline mr-2" />
                Dates
              </label>
              <input
                type="date"
                value={searchData.dates}
                onChange={(e) => setSearchData({...searchData, dates: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-gray-800"
              />
            </div>

            {/* Search Button */}
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <FaSearch />
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Suggestions Portal - renders at document.body level */}
      {showSuggestions && filteredSuggestions.length > 0 && ReactDOM.createPortal(
        <ul 
          id="destination-suggestions" 
          ref={suggRef}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto z-[10000]"
          style={{
            position: 'absolute',
            top: `${dropdownPosition.top + 8}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}
        >
          {filteredSuggestions.map((s, idx) => (
            <li
              key={s}
              onClick={() => handleSuggestionClick(s)}
              onMouseEnter={() => setActiveSuggestionIndex(idx)}
              className={`px-4 py-3 cursor-pointer text-gray-800 dark:text-gray-200 ${idx === activeSuggestionIndex ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              {s}
            </li>
          ))}
        </ul>,
        document.body
      )}
    </section>
  );
};

export default Hero;

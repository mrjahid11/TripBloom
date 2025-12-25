import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

// Lightweight Leaflet loader + modal. Uses CDN so no npm install required.
const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

function loadLeaflet() {
  return new Promise((resolve, reject) => {
    if (window.L) return resolve(window.L);
    // load css
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }
    // load script
    if (!document.querySelector(`script[src="${LEAFLET_JS}"]`)) {
      const script = document.createElement('script');
      script.src = LEAFLET_JS;
      script.async = true;
      script.onload = () => resolve(window.L);
      script.onerror = reject;
      document.body.appendChild(script);
    } else {
      // script present but maybe not loaded yet
      const check = () => {
        if (window.L) resolve(window.L);
        else setTimeout(check, 50);
      };
      check();
    }
  });
}

const MapModal = ({ isOpen, onClose, coords, title }) => {
  const el = useRef(null);
  const mapRef = useRef(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (!coords || !coords.lat || !coords.lng) return;
    let mounted = true;
    setLoading(true);
    loadLeaflet().then((L) => {
      if (!mounted) return;
      // create map
      if (mapRef.current) mapRef.current.remove();
      const map = L.map(el.current).setView([coords.lat, coords.lng], coords.zoom || 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
      L.marker([coords.lat, coords.lng]).addTo(map).bindPopup(title || '').openPopup();
      mapRef.current = map;
      setLoading(false);
    }).catch((err) => {
      console.error('Failed to load Leaflet', err);
      setLoading(false);
    });

    return () => { mounted = false; if (mapRef.current) { try { mapRef.current.remove(); } catch(e){} } };
  }, [isOpen, coords, title]);

  if (!isOpen) return null;

  const content = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-3xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-lg">Map: {title || ''}</h3>
          <button onClick={onClose} className="text-gray-600">Close</button>
        </div>
        {!coords || !coords.lat || !coords.lng ? (
          <div className="p-8 text-center text-gray-600">No coordinates available for this package.</div>
        ) : (
          <div style={{ height: 400 }} ref={el} />
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
};

export default MapModal;

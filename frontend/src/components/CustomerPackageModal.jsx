import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { FaTimes, FaMapMarkerAlt, FaClock, FaStar } from 'react-icons/fa';

const CustomerPackageModal = ({ isOpen, onClose, packageData, initialTab = 'overview' }) => {
  if (!isOpen || !packageData) return null;

  const formatDate = (date) => {
    try {
      return new Date(date).toLocaleDateString();
    } catch (e) {
      return 'TBD';
    }
  };

  // packageData may be a booking or a populated package object; prefer packageData.packageId when present
  const [resolvedPkg, setResolvedPkg] = useState(null);
  const [loadingResolved, setLoadingResolved] = useState(false);

  const pkg = resolvedPkg || packageData.packageId || packageData;
  console.debug('[CustomerPackageModal] packageData:', packageData, 'using pkg:', pkg, 'resolvedPkg:', resolvedPkg);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  useEffect(() => {
    let mounted = true;
    const tryFetch = async () => {
      // if packageData.packageId is a string id, try to fetch the full package
      const pid = packageData?.packageId;
      if (!pid || typeof pid !== 'string') return;
      setLoadingResolved(true);
      try {
      // Try admin package endpoint which returns the full package object
      const res = await fetch(`/api/admin/packages/${pid}`);
        if (!mounted) return;
        if (!res.ok) {
          console.debug('[CustomerPackageModal] fetch package failed', res.status);
          setLoadingResolved(false);
          return;
        }
        const data = await res.json();
        if (mounted) setResolvedPkg(data.package || data);
      } catch (err) {
        console.debug('[CustomerPackageModal] fetch error', err);
      } finally {
        if (mounted) setLoadingResolved(false);
      }
    };
    tryFetch();
    return () => { mounted = false; };
  }, [packageData]);

  const title = pkg.title || pkg.name || packageData.title || 'Package';
  const image = pkg.photos?.[0] || pkg.image || packageData.photos?.[0] || packageData.image || `https://source.unsplash.com/featured/?${encodeURIComponent(title || pkg.destination || packageData.destination || 'travel')}`;

  const destinations = pkg.destinations || packageData.destinations || [];

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-3">
              <span className="flex items-center"><FaClock className="mr-1" />{(pkg.defaultDays || packageData.defaultDays) ? `${pkg.defaultDays || packageData.defaultDays}D/${pkg.defaultNights || packageData.defaultNights}N` : 'TBD'}</span>
              <span className="flex items-center"><FaStar className="mr-1 text-yellow-400" />{pkg.avgRating || packageData.avgRating || '—'}</span>
              {(pkg.isInternational || packageData.isInternational) && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                  ✈️ International
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900"><FaTimes /></button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <img src={image} alt={title} className="w-full h-56 object-cover rounded-md" />
            <div className="mt-4 text-gray-700 dark:text-gray-300">
              <h3 className="font-semibold">Description</h3>
              <p className="mt-2">{pkg.description || packageData.description || 'No description available.'}</p>
            </div>

            <div className="mt-6 bg-gray-50 dark:bg-gray-900 p-4 rounded-md">

              <h3 className="font-semibold mt-4">Destinations</h3>
              {destinations.length === 0 ? (
                <p className="text-gray-500 mt-2">No destinations configured.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {destinations.sort((a,b) => (a.order||0)-(b.order||0)).map((d, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center">{d.order || i+1}</div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">{d.name || `${d.city || ''}${d.country ? ', ' + d.country : ''}`}</div>
                        <div className="text-sm text-gray-500">{d.city || ''}{d.country ? ', ' + d.country : ''}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <aside className="p-4 bg-gray-50 dark:bg-gray-900 rounded-md">
            <div className="text-sm text-gray-500">Price</div>
            <div className="text-2xl font-bold text-primary">{(pkg.basePrice || packageData.basePrice) ? `$${pkg.basePrice || packageData.basePrice}` : '—'}</div>

            <div className="mt-4">
              <h4 className="font-semibold">Includes</h4>
              <ul className="mt-2 text-sm text-gray-600">
                {packageData.inclusions?.transport && <li>Transport: {packageData.inclusions.transport}</li>}
                {packageData.inclusions?.hotel && <li>Hotel: {packageData.inclusions.hotel}</li>}
                {packageData.inclusions?.meals && <li>Meals: {packageData.inclusions.meals}</li>}
              </ul>
            </div>

            <div className="mt-6">
              <button onClick={onClose} className="w-full bg-primary text-white py-2 rounded">Close</button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
};

export default CustomerPackageModal;

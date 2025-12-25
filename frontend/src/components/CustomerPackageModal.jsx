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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-3xl p-6 overflow-auto">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-3">
              <span className="flex items-center"><FaClock className="mr-1" />{(pkg.defaultDays || packageData.defaultDays) ? `${pkg.defaultDays || packageData.defaultDays}D/${pkg.defaultNights || packageData.defaultNights}N` : 'TBD'}</span>
              <span className="flex items-center"><FaStar className="mr-1 text-yellow-400" />{pkg.avgRating || packageData.avgRating || '—'}</span>
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
              <h3 className="font-semibold text-lg">What We Offer</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">The package includes the following services and features:</p>
              <ul className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700 dark:text-gray-300">
                {((pkg.inclusions || packageData.inclusions)?.transport) ? <li className="flex items-start gap-2">🚍 <span>Transport: {(pkg.inclusions || packageData.inclusions).transport}</span></li> : null}
                {((pkg.inclusions || packageData.inclusions)?.hotel) ? <li className="flex items-start gap-2">🏨 <span>Hotel: {(pkg.inclusions || packageData.inclusions).hotel}</span></li> : null}
                {((pkg.inclusions || packageData.inclusions)?.meals) ? <li className="flex items-start gap-2">🍽️ <span>Meals: {(pkg.inclusions || packageData.inclusions).meals}</span></li> : null}
                {((pkg.inclusions || packageData.inclusions)?.guide) ? <li className="flex items-start gap-2">🧭 <span>Tour Guide: Professional local guide included</span></li> : null}
                {((pkg.extras || packageData.extras) && (pkg.extras || packageData.extras).length > 0) ? (
                  <li className="flex items-start gap-2 col-span-1 md:col-span-2">✨ <span>Extras: {(pkg.extras || packageData.extras).join(', ')}</span></li>
                ) : null}
                {(!(pkg.inclusions || packageData.inclusions) && (!pkg.extras || (pkg.extras||[]).length === 0) && (!packageData.extras || packageData.extras.length === 0)) && (
                  <li className="col-span-2 text-gray-500">No inclusions or extras listed for this package.</li>
                )}
              </ul>

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

import React, { useState, useEffect } from 'react';
import { FaStar } from 'react-icons/fa';
import axios from 'axios';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [allReviews, setAllReviews] = useState(null);
  const [allReviewsOpen, setAllReviewsOpen] = useState(false);
  const demoReviews = [
    { 
      id: 1, 
      name: 'Asif Mahmood', 
      rating: 5, 
      comment: 'TripBloom made our family trip stress-free and amazing!', 
      avatar: 'https://randomuser.me/api/portraits/men/1.jpg'
    },
    { 
      id: 2, 
      name: 'Mike Chen', 
      rating: 5, 
      comment: 'Best tour booking experience ever. Highly recommended!', 
      avatar: 'https://randomuser.me/api/portraits/men/2.jpg'
    },
    { 
      id: 3, 
      name: 'Emily Rodriguez', 
      rating: 4, 
      comment: 'Great service and wonderful destinations. Will book again!', 
      avatar: 'https://randomuser.me/api/portraits/women/3.jpg'
    },
    { 
      id: 4, 
      name: 'Sujit Kumar', 
      rating: 5, 
      comment: 'The Diamond Elite package exceeded all expectations!', 
      avatar: 'https://randomuser.me/api/portraits/men/4.jpg'
    },
    { 
      id: 5, 
      name: 'Lisa Thompson', 
      rating: 5, 
      comment: 'Customer support was exceptional throughout our journey.', 
      avatar: 'https://randomuser.me/api/portraits/women/5.jpg'
    },
    { 
      id: 6, 
      name: 'Ahmed Hassan', 
      rating: 4, 
      comment: 'Smooth booking process and great tour guides!', 
      avatar: 'https://randomuser.me/api/portraits/men/6.jpg'
    },
  ];

  // Prevent background scrolling when the All Reviews modal is open
  useEffect(() => {
    if (allReviewsOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
    return undefined;
  }, [allReviewsOpen]);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await axios.get('/api/reviews');
      const payload = response.data;
      // controller returns { success: true, reviews: [...] }
      const list = Array.isArray(payload) ? payload : (Array.isArray(payload?.reviews) ? payload.reviews : []);
      if (list.length > 0) {
        setReviews(demoReviews);
        setRefreshKey(prev => prev + 1);
        setReviews(displayReviews);
        setRefreshKey(prev => prev + 1);
        return;
      }
      // If no reviews from API, use fallback
      throw new Error('No reviews available');
    } catch (error) {
      console.error('Error fetching reviews:', error);
      // Fallback data with working images
      const fallbackReviews = [
        { 
          id: 1, 
          name: 'Asif Mahmood', 
          rating: 5, 
          comment: 'TripBloom made our family trip stress-free and amazing!', 
          avatar: 'https://randomuser.me/api/portraits/men/1.jpg'
        },
        { 
          id: 2, 
          name: 'Mike Chen', 
          rating: 5, 
          comment: 'Best tour booking experience ever. Highly recommended!', 
          avatar: 'https://randomuser.me/api/portraits/men/2.jpg'
        },
        { 
          id: 3, 
          name: 'Emily Rodriguez', 
          rating: 4, 
          comment: 'Great service and wonderful destinations. Will book again!', 
          avatar: 'https://randomuser.me/api/portraits/women/3.jpg'
        },
        { 
          id: 4, 
          name: 'Sujit Kumar', 
          rating: 5, 
          comment: 'The Diamond Elite package exceeded all expectations!', 
          avatar: 'https://randomuser.me/api/portraits/men/4.jpg'
        },
        { 
          id: 5, 
          name: 'Lisa Thompson', 
          rating: 5, 
          comment: 'Customer support was exceptional throughout our journey.', 
          avatar: 'https://randomuser.me/api/portraits/women/5.jpg'
        },
        { 
          id: 6, 
          name: 'Ahmed Hassan', 
          rating: 4, 
          comment: 'Smooth booking process and great tour guides!', 
          avatar: 'https://randomuser.me/api/portraits/men/6.jpg'
        },
      ];
      setReviews(fallbackReviews);
      setRefreshKey(prev => prev + 1);
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <FaStar
        key={index}
        className={index < rating ? 'text-yellow-400' : 'text-gray-300'}
      />
    ));
  };

  return (
    <div className="w-full bg-transparent backdrop-blur-sm dark:bg-gray-900/60 relative">
      <div className="absolute inset-0 pointer-events-none z-0 bg-gradient-to-r from-sky-50/12 via-blue-50/6 to-indigo-50/14"></div>
      <section className="section-container bg-transparent relative overflow-hidden py-12 lg:py-16 relative z-10">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400 rounded-full filter blur-3xl animate-pulse-slow"></div>
      </div>

      <h2 className="section-title dark:text-white relative z-10 animate-fade-in-up">What Our Travelers Say</h2>
      <p className="section-subtitle dark:text-gray-300 relative z-10 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
        Join thousands of happy travelers who chose TripBloom
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10" key={refreshKey}>
        {reviews.map((review, index) => (
          <div
            key={`${review.id}-${refreshKey}`}
            className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 hover:scale-105 group animate-fade-in-up"
            style={{animationDelay: `${index * 0.1}s`}}
          >
            <div className="flex items-center gap-4 mb-4">
              <img
                src={review.avatar}
                alt={review.name}
                key={`avatar-${review.id}-${refreshKey}`}
                className="w-16 h-16 rounded-full object-cover ring-4 ring-transparent group-hover:ring-primary transition-all duration-300 transform group-hover:scale-110"
              />
              <div>
                <h4 className="font-bold text-gray-800 dark:text-white group-hover:text-primary dark:group-hover:text-primary transition-colors duration-300">{review.name}</h4>
                <div className="flex gap-1 transform group-hover:scale-110 transition-transform duration-300">
                  {renderStars(review.rating)}
                </div>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-300 italic relative pl-4 pr-4">
              <span className="absolute -left-2 -top-2 text-4xl text-primary opacity-30">&ldquo;</span>
              {review.comment}
              <span className="text-4xl text-primary opacity-30">&rdquo;</span>
            </p>
          </div>
        ))}
      </div>

      <div className="text-center mt-12 animate-fade-in-up" style={{animationDelay: '0.6s'}}>
        <button
          onClick={async () => {
            try {
              // fetch full review list (no slice)
              const res = await axios.get('/api/reviews');
              const data = res.data;
              if (Array.isArray(data) && data.length > 0) setAllReviews(data);
              else if (data && Array.isArray(data.reviews)) setAllReviews(data.reviews);
              else setAllReviews([]);
            } catch (err) {
              console.error('Failed to fetch all reviews', err);
              setAllReviews([]);
            }
            setAllReviewsOpen(true);
          }}
          className="btn-secondary transform hover:scale-110 transition-all duration-300 hover:shadow-xl"
        >
          View All Reviews
        </button>
      </div>

      {allReviewsOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAllReviewsOpen(false)}></div>
          <div className="relative z-10 w-full max-w-6xl max-h-[85vh] overflow-hidden bg-transparent">
            <div className="mx-4 md:mx-0 bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden max-h-[85vh]">
              <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">All Reviews</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Read what customers are saying about our tours</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setAllReviewsOpen(false)} className="px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700">Close</button>
                </div>
              </div>

              <div className="p-6 overflow-auto max-h-[72vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {(allReviews && allReviews.length > 0 ? allReviews : demoReviews).map((review) => {
                    const customer = review.customerId || review.user || null;
                    const name = customer?.fullName || customer?.name || review.name || 'Customer';
                    const avatar = customer?.avatar || review.avatar || review.photo || `https://source.unsplash.com/80x80/?person`;
                    const rating = Number(review.rating) || 0;
                    const comment = review.comment || review.text || review.body || '';
                    const date = review.createdAt ? new Date(review.createdAt).toLocaleDateString() : null;
                    return (
                      <article key={review._id || review.id || JSON.stringify(review)} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4">
                          <img src={avatar} alt={name} className="w-16 h-16 rounded-full object-cover flex-shrink-0 ring-2 ring-white dark:ring-gray-900" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white">{name}</h4>
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                  <div className="flex gap-1">{renderStars(rating)}</div>
                                  {date && <span className="ml-2">• {date}</span>}
                                </div>
                              </div>
                            </div>
                            <blockquote className="mt-3 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{comment}</blockquote>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </section>
    </div>
  );
};

export default Reviews;

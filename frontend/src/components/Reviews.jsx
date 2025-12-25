import React, { useState, useEffect } from 'react';
import { FaStar } from 'react-icons/fa';
import axios from 'axios';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await axios.get('/api/reviews');
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        // Filter out reviews to show maximum 6 for landing page
        const displayReviews = response.data.slice(0, 6);
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
        <button className="btn-secondary transform hover:scale-110 transition-all duration-300 hover:shadow-xl">View All Reviews</button>
      </div>
      </section>
    </div>
  );
};

export default Reviews;

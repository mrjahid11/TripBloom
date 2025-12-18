import React, { useState } from 'react';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaFacebook, FaInstagram, FaTwitter, FaYoutube } from 'react-icons/fa';
import axios from 'axios';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/contact', formData);
      setSubmitted(true);
      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Message sent successfully!');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <section id="contact" className="section-container bg-gray-50 dark:bg-gradient-to-b dark:from-gray-50 dark:to-white dark:dark:from-gray-800 dark:dark:to-gray-900 relative overflow-hidden border-y border-gray-200 dark:border-gray-700">
      {/* Background Decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-green-400 rounded-full filter blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400 rounded-full filter blur-3xl animate-pulse-slow" style={{animationDelay: '2s'}}></div>
      </div>

      <h2 className="section-title dark:text-white relative z-10 animate-fade-in-up">Get In Touch</h2>
      <p className="section-subtitle dark:text-gray-300 relative z-10 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
        Have questions? We're here to help you plan your perfect trip
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
        {/* Contact Info */}
        <div className="animate-fade-in-left">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Contact Information</h3>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4 transform hover:translate-x-2 transition-transform duration-300">
              <FaPhone className="text-3xl text-primary mt-1 animate-pulse" />
              <div>
                <h4 className="font-bold text-gray-800 dark:text-white">Phone</h4>
                <p className="text-gray-600 dark:text-gray-300">+880 123-456789</p>
                <p className="text-gray-600 dark:text-gray-300">Available 24/7</p>
              </div>
            </div>

            <div className="flex items-start gap-4 transform hover:translate-x-2 transition-transform duration-300">
              <FaEnvelope className="text-3xl text-primary mt-1 animate-pulse" style={{animationDelay: '0.5s'}} />
              <div>
                <h4 className="font-bold text-gray-800 dark:text-white">Email</h4>
                <p className="text-gray-600 dark:text-gray-300">support@tripbloom.com</p>
                <p className="text-gray-600 dark:text-gray-300">info@tripbloom.com</p>
              </div>
            </div>

            <div className="flex items-start gap-4 transform hover:translate-x-2 transition-transform duration-300">
              <FaMapMarkerAlt className="text-3xl text-primary mt-1 animate-pulse" style={{animationDelay: '1s'}} />
              <div>
                <h4 className="font-bold text-gray-800 dark:text-white">Office</h4>
                <p className="text-gray-600 dark:text-gray-300">CSE Department,</p>
                <p className="text-gray-600 dark:text-gray-300">BRAC University</p>
                <p className="text-gray-600 dark:text-gray-300">Kha 224 Pragati Sarani, Merul Badda , Dhaka 1212</p>
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="mt-8">
            <h4 className="font-bold text-gray-800 dark:text-white mb-4">Follow Us</h4>
            <div className="flex gap-4">
              <a href="#" className="text-3xl text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-all duration-300 transform hover:scale-125 hover:rotate-12">
                <FaFacebook />
              </a>
              <a href="#" className="text-3xl text-gray-600 dark:text-gray-400 hover:text-pink-600 transition-all duration-300 transform hover:scale-125 hover:rotate-12">
                <FaInstagram />
              </a>
              <a href="#" className="text-3xl text-gray-600 dark:text-gray-400 hover:text-blue-400 transition-all duration-300 transform hover:scale-125 hover:rotate-12">
                <FaTwitter />
              </a>
              <a href="#" className="text-3xl text-gray-600 dark:text-gray-400 hover:text-red-600 transition-all duration-300 transform hover:scale-125 hover:rotate-12">
                <FaYoutube />
              </a>
            </div>
          </div>

          {/* Chatbot */}
          <div className="mt-8 bg-gradient-to-br from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20 p-6 rounded-lg border-2 border-primary hover:shadow-lg transition-all duration-300">
            <h4 className="font-bold text-gray-800 dark:text-white mb-2">Need Instant Help?</h4>
            <p className="text-gray-600 dark:text-gray-300 mb-4">Chat with our AI assistant for quick answers</p>
            <button className="btn-primary transform hover:scale-105 transition-all duration-300">Start Chat</button>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white dark:bg-gray-700 p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500 animate-fade-in-right">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Send Us a Message</h3>
          
          {submitted && (
            <div className="bg-green-100 dark:bg-green-900/50 border border-green-400 text-green-700 dark:text-green-300 px-4 py-3 rounded mb-4 animate-fade-in-up">
              Thank you! We'll get back to you soon.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300 hover:border-primary"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300 hover:border-primary"
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Message</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows="5"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300 hover:border-primary"
                placeholder="How can we help you?"
              />
            </div>

            <button type="submit" className="w-full btn-primary transform hover:scale-105 transition-all duration-300">
              Send Message
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Contact;

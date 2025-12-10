import React from 'react';
import { FaFacebook, FaInstagram, FaTwitter, FaYoutube, FaLinkedin } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { name: 'Home', href: '#home' },
    { name: 'About Us', href: '#about' },
    { name: 'Packages', href: '#packages' },
    { name: 'Destinations', href: '#destinations' },
    { name: 'Contact', href: '#contact' }
  ];

  const supportLinks = [
    { name: 'FAQs', href: '#' },
    { name: 'Help Center', href: '#' },
    { name: 'Terms & Conditions', href: '#' },
    { name: 'Privacy Policy', href: '#' },
    { name: 'Refund Policy', href: '#' }
  ];

  const partnerLinks = [
    { name: 'Become a Partner', href: '#' },
    { name: 'Tour Operators', href: '#' },
    { name: 'Travel Agents', href: '#' },
    { name: 'Affiliates', href: '#' }
  ];

  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <img src="/tripbloom_logo.svg" alt="TripBloom Logo" className="w-14 h-14" />
              <h3 className="font-display text-3xl font-bold text-primary">
                TripBloom
              </h3>
            </div>
            <p className="text-gray-400 mb-4">
              Where Every Journey Blossoms
            </p>
            <p className="text-gray-400 text-sm">
              Making travel accessible, safe, and memorable for everyone.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-primary transition-colors duration-300"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold text-lg mb-4">Support</h4>
            <ul className="space-y-2">
              {supportLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-primary transition-colors duration-300"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Partners */}
          <div>
            <h4 className="font-bold text-lg mb-4">For Partners</h4>
            <ul className="space-y-2">
              {partnerLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-primary transition-colors duration-300"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Social Media & Copyright */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Social Icons */}
            <div className="flex gap-6">
              <a href="#" className="text-gray-400 hover:text-blue-500 transition-colors text-2xl">
                <FaFacebook />
              </a>
              <a href="#" className="text-gray-400 hover:text-pink-500 transition-colors text-2xl">
                <FaInstagram />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors text-2xl">
                <FaTwitter />
              </a>
              <a href="#" className="text-gray-400 hover:text-red-500 transition-colors text-2xl">
                <FaYoutube />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors text-2xl">
                <FaLinkedin />
              </a>
            </div>

            {/* Copyright */}
            <div className="text-gray-400 text-sm text-center">
              <p>© {currentYear} TripBloom. All rights reserved.</p>
              <p className="mt-1">Powered by Best CSE University's student</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

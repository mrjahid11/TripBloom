import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import TourPackagesManager from './components/TourPackagesManager';
import UsersManager from './components/UsersManager';
import Hero from './components/Hero';
import Stats from './components/Stats';
import HowItWorks from './components/HowItWorks';
import PopularDestinations from './components/PopularDestinations';
import TourCategories from './components/TourCategories';
import WhyChooseUs from './components/WhyChooseUs';
import RefundsManager from './components/RefundsManager';
import ReviewsManager from './components/ReviewsManager';
import SettingsManager from './components/SettingsManager';
import Reviews from './components/Reviews';
import Contact from './components/Contact';
import Footer from './components/Footer';
import AdminDashboard from './components/AdminDashboard';
import AdminLayout from './components/AdminLayout';
import CustomerDashboard from './components/CustomerDashboard';
import OperatorDashboard from './components/OperatorDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import GroupDeparturesManager from './components/GroupDeparturesManager';
import OperatorsManager from './components/OperatorsManager';
import MyReviews from './components/MyReviews';
import BrowsePackages from './components/BrowsePackages';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <div className="App bg-white dark:bg-gray-900 transition-colors duration-300">
            <Navbar />
            <Hero />
            <Stats />
            <HowItWorks />
            <PopularDestinations />
            <TourCategories />
            <WhyChooseUs />
            <Reviews />
            <Contact />
            <Footer />
          </div>
        } />
        <Route path="/admin" element={
          <ProtectedRoute role="admin">
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="departures" element={<GroupDeparturesManager />} />
          <Route path="operators" element={<OperatorsManager />} />
          <Route path="packages" element={<TourPackagesManager />} />
          <Route path="users" element={<UsersManager />} />
          <Route path="refunds" element={<RefundsManager />} />
          <Route path="reviews" element={<ReviewsManager />} />
          <Route path="settings" element={<SettingsManager />} />
        </Route>
        <Route path="/customer" element={
          <ProtectedRoute role="customer">
            <CustomerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/customer/reviews" element={
          <ProtectedRoute role="customer">
            <MyReviews />
          </ProtectedRoute>
        } />
        <Route path="/operator" element={
          <ProtectedRoute role="operator">
            <OperatorDashboard />
          </ProtectedRoute>
        } />
        <Route path="/packages" element={<BrowsePackages />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

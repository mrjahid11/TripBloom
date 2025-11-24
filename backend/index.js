
import mongoose from 'mongoose';
// MongoDB connection

const mongoUri = 'mongodb+srv://mdjahidulhasan1_db_user:Tripbloom1234@cluster0.ouemec1.mongodb.net/?appName=Cluster0';
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ROLES, User } from './model/user.model.js';

// Remove username index if it exists (for migration from old schema)
User.collection.dropIndex('username_1').catch(() => {});
import { signupController, loginController, requireRole, getAllUsersController, listUsersController, createUserController, updateUserController, deactivateUserController } from './controller/user.controller.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// User signup endpoint
app.post('/api/signup', signupController);

// User login endpoint
app.post('/api/login', loginController);

// Example protected route (admin only)
app.post('/api/admin-only', requireRole(ROLES.ADMIN), (req, res) => {
  res.json({ success: true, message: 'Welcome, admin!' });
});

// Routes
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'TripBloom API is running' });
});

// Admin user management endpoints
app.get('/api/admin/users', listUsersController); // List users with filters
app.post('/api/admin/users', createUserController); // Create user
app.put('/api/admin/users/:userId', updateUserController); // Update user info
app.delete('/api/admin/users/:userId', deactivateUserController); // Deactivate user

import { createTourPackageController, updateTourPackageController, setTourPackageActiveController, getTourPackageController, listTourPackagesController, deleteTourPackageController } from './controller/tourPackage.controller.js';
// ...existing code...

// Tour package management endpoints
app.post('/api/admin/packages', createTourPackageController); // Create package
app.put('/api/admin/packages/:packageId', updateTourPackageController); // Update package
app.patch('/api/admin/packages/:packageId/active', setTourPackageActiveController); // Activate/deactivate package
app.get('/api/admin/packages/:packageId', getTourPackageController); // Get package by ID
app.get('/api/admin/packages', listTourPackagesController); // List packages
app.delete('/api/admin/packages/:packageId', deleteTourPackageController); // Delete package


import { createGroupDepartureController, updateGroupDepartureController, listGroupDeparturesController, setGroupDepartureStatusController } from './controller/groupDeparture.controller.js';
import {
  assignOperatorsToDepartureController,
  listOperatorsForDepartureController,
  reassignOperatorForDepartureController,
  findFutureDeparturesForOperatorController,
  removeOperatorFromFutureDeparturesController
} from './controller/groupDeparture.controller.js';
// Group departure management endpoints
app.post('/api/admin/group-departures', createGroupDepartureController); // Create group departure
app.put('/api/admin/group-departures/:departureId', updateGroupDepartureController); // Update group departure
app.get('/api/admin/group-departures', listGroupDeparturesController); // List group departures
app.patch('/api/admin/group-departures/:departureId/status', setGroupDepartureStatusController); // Set group departure status

// Operator assignment endpoints for group departures
app.post('/api/group-departure/:departureId/assign-operators', assignOperatorsToDepartureController);
app.get('/api/group-departure/:departureId/operators', listOperatorsForDepartureController);
app.post('/api/group-departure/:departureId/reassign-operator', reassignOperatorForDepartureController);
app.get('/api/group-departure/operator/:operatorId/future', findFutureDeparturesForOperatorController);
app.post('/api/group-departure/operator/:operatorId/remove-future', removeOperatorFromFutureDeparturesController);

// Contact form endpoint
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  console.log('Contact form submission:', { name, email, message });
  res.json({ success: true, message: 'Message received. We will contact you soon!' });
});

// Newsletter subscription
app.post('/api/newsletter', (req, res) => {
  const { email } = req.body;
  console.log('Newsletter subscription:', email);
  res.json({ success: true, message: 'Successfully subscribed to TripBloom newsletter!' });
});

// Get all users (for testing/demo only)
app.get('/api/users', getAllUsersController);

app.listen(PORT, () => {
  console.log(`🌸 TripBloom server running on port ${PORT}`);
});





// Popular destinations (mock data)
app.get('/api/destinations', (req, res) => {
  const destinations = [
    { id: 1, name: 'Bali Paradise', duration: '7 Days', price: 1299, image: 'bali.jpg', type: 'International' },
    { id: 2, name: 'Swiss Alps Adventure', duration: '10 Days', price: 2499, image: 'swiss.jpg', type: 'International' },
    { id: 3, name: 'Maldives Retreat', duration: '5 Days', price: 1899, image: 'maldives.jpg', type: 'International' },
    { id: 4, name: 'Santorini Sunset Tour', duration: '6 Days', price: 1599, image: 'santorini.jpg', type: 'International' },
  ];
  res.json(destinations);
});

// Tour packages
app.get('/api/packages', (req, res) => {
  const packages = [
    { id: 1, tier: 'Silver', price: 499, features: ['Standard Hotels', 'Basic Transport', 'Breakfast Included'] },
    { id: 2, tier: 'Gold', price: 899, features: ['3-Star Hotels', 'AC Transport', 'All Meals', 'Local Guide'] },
    { id: 3, tier: 'Platinum', price: 1499, features: ['4-Star Hotels', 'Premium Transport', 'All Meals', 'Expert Guide', 'Activities'] },
    { id: 4, tier: 'Diamond Elite', price: 2999, features: ['5-Star Resorts', 'Luxury Transport', 'Fine Dining', 'Personal Concierge', 'VIP Experiences'] },
  ];
  res.json(packages);
});


// Reviews (mock data)
app.get('/api/reviews', (req, res) => {
    const reviews = [
      { id: 1, name: 'Sarah Johnson', rating: 5, comment: 'TripBloom made our family trip stress-free and amazing!', avatar: 'avatar1.jpg' },
      { id: 2, name: 'Mike Chen', rating: 5, comment: 'Best tour booking experience ever. Highly recommended!', avatar: 'avatar2.jpg' },
      { id: 3, name: 'Emily Rodriguez', rating: 4, comment: 'Great service and wonderful destinations. Will book again!', avatar: 'avatar3.jpg' },
    ];
    res.json(reviews);
  });
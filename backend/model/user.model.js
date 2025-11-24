// user.model.js
import mongoose from 'mongoose';

export const ROLES = {
  ADMIN: 'admin',
  CUSTOMER: 'customer',
  TOUR_OPERATOR: 'tour_operator',
};


const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  passwordHash: { type: String, required: true },
  roles: {
    type: [String],
    enum: ['ADMIN', 'admin', 'CUSTOMER', 'customer', 'TOUR_OPERATOR', 'tour_operator'],
    required: true
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});


export const User = mongoose.model('User', userSchema);

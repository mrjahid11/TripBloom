import mongoose from "mongoose";

const kycSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },

  documentType: {
    type: String,
    enum: ["passport", "national_id", "driving_license"],
    required: true
  },

  documentNumber: {
    type: String,
    required: true
  },

  documentImage: {
    type: String, // Cloudinary / local path
    required: true
  },

  // Denormalized user info for quick reads (kept in sync on submit)
  userFullName: String,
  userEmail: String,

  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },

  verifiedAt: Date,

  remarks: String
}, { timestamps: true });

export default mongoose.model("KYC", kycSchema);

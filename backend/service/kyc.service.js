import KYC from "../model/kyc.model.js";
import { User } from "../model/user.model.js";

export const submitKYC = async (data) => {
  // Use findOneAndUpdate with upsert to either update existing or create new
  // Return populated user fields (fullName, name, email)
  // fetch user snapshot to denormalize name/email into kyc doc
  const user = await User.findById(data.user).select("fullName name email");

  return await KYC.findOneAndUpdate(
    { user: data.user },
    {
      documentType: data.documentType,
      documentNumber: data.documentNumber,
      documentImage: data.documentImage,
      status: "pending", // Reset to pending on resubmission
      remarks: null, // Clear previous remarks
      verifiedAt: null, // Clear verification date
      userFullName: (user && (user.fullName || user.name)) || null,
      userEmail: (user && user.email) || null
    },
    { 
      new: true, // Return the updated document
      upsert: true, // Create if doesn't exist
      runValidators: true // Run schema validators
    }
  ).populate("user", "fullName name email");
};

export const getUserKYC = async (userId) => {
  return await KYC.findOne({ user: userId }).populate("user", "fullName name email");
};

export const updateKYCStatus = async (kycId, status, remarks) => {
  return await KYC.findByIdAndUpdate(
    kycId,
    {
      status,
      remarks,
      verifiedAt: status === "approved" ? new Date() : null
    },
    { new: true }
  ).populate("user", "fullName name email");
};

export const getAllKYC = async (filters = {}) => {
  const query = {};
  
  if (filters.status) {
    query.status = filters.status;
  }
  
  return await KYC.find(query)
    .populate("user", "fullName name email")
    .sort({ createdAt: -1 });
};

// Check if user has approved KYC
export const isUserKYCApproved = async (userId) => {
  const kyc = await KYC.findOne({ user: userId });
  return kyc && kyc.status === "approved";
};

// Get user's KYC status (returns status string or null if not submitted)
export const getUserKYCStatus = async (userId) => {
  const kyc = await KYC.findOne({ user: userId });
  return kyc ? kyc.status : null;
};

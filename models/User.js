const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      index: true
    },
    name: {
      type: String,
      trim: true,
      default: ""
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      required: true,
      index: true
    },
    photoURL: {
      type: String,
      trim: true,
      default: ""
    },
    provider: {
      type: String,
      enum: ["email", "google", "firebase", "local"],
      default: "email"
    },
    emailVerified: {
      type: Boolean,
      default: false
    },
    lastLoginAt: Date,
    onboardingCompleted: {
      type: Boolean,
      default: false
    },
    onboardingCompletedAt: Date
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);

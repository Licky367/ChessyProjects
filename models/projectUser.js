const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const projectUserSchema = new mongoose.Schema(
{
  profileImage: {
    type: String,
    default: "", // fallback handled on frontend
  },

  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
  },

  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
  },

  phone: {
    type: String,
    default: null,
  },

  password: {
    type: String,
    minlength: 6,
    select: false,
    required: true,
  },

  role: {
    type: String,
    enum: ["dairyWorker", "poultryWorker", "admin"],
    default: "dairyWorker",
  },

},
{
  timestamps: true,
  collection: "project-Users",
}
);

// 🔐 Hash password
projectUserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 🔐 Compare password
projectUserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("ProjectUser", projectUserSchema);
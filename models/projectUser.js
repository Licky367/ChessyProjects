const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const projectUserSchema = new mongoose.Schema(
  {
    profileImage: {
      type: String,
      default: "",
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
      unique: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ["dairyWorker", "poultryWorker", "admin"],
      default: "dairyWorker",
    },
  },
  {
    timestamps: true,
    collection: "project-Users", // exact collection name
  }
);

// Hash password before saving
projectUserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
projectUserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("ProjectUser", projectUserSchema);
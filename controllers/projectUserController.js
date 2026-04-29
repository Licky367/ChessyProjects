const ProjectUser = require("../models/projectUser");

// =============================
// 1. ADMIN CREATES USER (PRE-SIGNUP)
// =============================
exports.adminCreateUser = async (req, res) => {
  try {
    const { name, email, role } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({
        message: "Name, email, and role are required",
      });
    }

    // Check if email already exists
    const existingUser = await ProjectUser.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already in use",
      });
    }

    // Create incomplete user (no phone/password yet)
    const user = await ProjectUser.create({
      name,
      email,
      role,
      phone: null,
      password: null,
    });

    res.status(201).json({
      message: "User created by admin. Awaiting signup completion.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// =============================
// 2. USER COMPLETES SIGNUP
// =============================
exports.completeSignup = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // Find pre-created user
    const user = await ProjectUser.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "No account found. Contact admin.",
      });
    }

    // Ensure name matches
    if (user.name !== name) {
      return res.status(400).json({
        message: "Name does not match admin record",
      });
    }

    // Prevent re-signup
    if (user.phone && user.password) {
      return res.status(400).json({
        message: "Account already completed",
      });
    }

    // Update user with full details
    user.phone = phone;
    user.password = password; // will be hashed by schema

    await user.save();

    res.status(200).json({
      message: "Signup completed successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};
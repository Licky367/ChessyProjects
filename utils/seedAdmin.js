const User = require("../models/projectUser");

const seedAdmin = async () => {
  try {
    // Check if ANY admin exists
    const existingAdmin = await User.findOne({ role: "admin" });

    if (existingAdmin) {
      console.log("🟡 Admin already exists:", existingAdmin.email);
      return;
    }

    // Create default admin
    const adminUser = await User.create({
      profileImage: "",
      name: "Project Admin",
      phone: "0700000000",
      email: "admin@chessyprojects.com",
      password: "Admin@123",
      role: "admin",
    });

    console.log("🟢 Admin seeded successfully:", adminUser.email);

  } catch (err) {
    console.error("🔴 Error seeding admin:", err.message);
  }
};

module.exports = seedAdmin;
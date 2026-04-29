const mongoose = require("mongoose");
const ProjectUser = require("./projectUser");

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/project_db";

const projectSeedAdmin = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected...");

    const adminEmail = "chessy415@gmail.com";

    // Check if admin already exists
    const existingAdmin = await ProjectUser.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log("Admin already exists");
      process.exit();
    }

    // Create admin (password will be hashed automatically)
    const adminUser = await ProjectUser.create({
      profileImage: "",
      name: "Project Admin",
      phone: "0700000000",
      email: adminEmail,
      password: "Admin@123",
      role: "admin",
    });

    console.log("Admin seeded successfully:", adminUser.email);
    process.exit();
  } catch (error) {
    console.error("Error seeding admin:", error);
    process.exit(1);
  }
};

projectSeedAdmin();
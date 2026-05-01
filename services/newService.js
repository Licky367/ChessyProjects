const Dairy = require("../models/dairy");

// =========================
// CREATE NEW RECORD
// =========================
exports.createDairyRecord = async (data) => {
  const dairy = new Dairy({
    name: data.name,
    profileImage: data.profileImage || "",
    dob: data.dob || null,
    code: Number(data.code),
    mass: Number(data.mass)
  });

  return await dairy.save();
};
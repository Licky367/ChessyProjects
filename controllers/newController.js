const newService = require("../services/newService");

// =========================
// SHOW FORM
// =========================
exports.showForm = (req, res) => {
  res.render("new"); // views/new.ejs
};

// =========================
// CREATE NEW DAIRY RECORD
// =========================
exports.createRecord = async (req, res) => {
  try {
    const { name, profileImage, dob, code, mass } = req.body;

    await newService.createDairyRecord({
      name,
      profileImage,
      dob,
      code,
      mass
    });

    res.redirect("/dairy/new"); // reload form after saving
  } catch (error) {
    console.error("Create Dairy Record Error:", error.message);

    res.status(400).send(`
      <h2>Error Creating Dairy Record</h2>
      <p>${error.message}</p>
      <a href="/dairy/new">Go Back</a>
    `);
  }
};
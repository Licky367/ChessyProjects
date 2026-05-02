const accountsService = require("../services/accountsService");

// ================= USERS LIST =================
exports.getAccountsPage = async (req, res) => {
  try {
    const users = await accountsService.getAllUsers();

    res.render("accounts", {
      title: "All Users",
      users,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

// ================= USER PROFILE =================
exports.getAccountProfile = async (req, res) => {
  try {
    const user = await accountsService.getUserById(req.params.id);

    if (!user) return res.status(404).send("User not found");

    res.render("accountsProfile", {
      title: user.name,
      user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

// ================= UPDATE ROLE =================
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    await accountsService.updateUserRole(req.params.id, role);

    res.redirect(`/accounts/${req.params.id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to update role");
  }
};
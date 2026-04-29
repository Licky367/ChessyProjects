const authService = require("../services/authService");

// ===== RENDER PAGES =====
exports.renderSignup = (req, res) => {
  res.render("signup", { error: null });
};

exports.renderLogin = (req, res) => {
  res.render("login", { error: null });
};

// ===== SIGNUP =====
exports.signup = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    const profileImage = req.file ? req.file.filename : "";

    await authService.signup({
      name,
      email,
      password,
      phone,
      profileImage,
    });

    res.redirect("/login");

  } catch (err) {
    res.render("signup", { error: err.message });
  }
};

// ===== LOGIN =====
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await authService.login({ email, password });

    req.session.user = {
      id: user._id,
      name: user.name,
      role: user.role,
      profileImage: user.profileImage,
    };

    res.redirect("/");

  } catch (err) {
    res.render("login", { error: err.message });
  }
};

// ===== LOGOUT =====
exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
};
const authService = require("../services/authService");

// ================= RENDER PAGES =================
exports.renderSignup = (req, res) => {
  res.render("signup", { error: null });
};

exports.renderLogin = (req, res) => {
  res.render("login", { error: null });
};

exports.renderForgot = (req, res) => {
  res.render("forgot-password", { error: null, success: null });
};

exports.renderReset = (req, res) => {
  res.render("reset-password", {
    token: req.params.token,
    error: null,
  });
};

// ================= SIGNUP =================
exports.signup = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const profileImage = req.file ? req.file.filename : "";

    if (!name || !email || !password) {
      return res.render("signup", {
        error: "All required fields must be filled",
      });
    }

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

// ================= LOGIN =================
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

// ================= LOGOUT =================
exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
};

// ================= FORGOT PASSWORD =================
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    await authService.forgotPassword(email);

    res.render("forgot-password", {
      success: "Reset link sent (check console for now)",
      error: null,
    });

  } catch (err) {
    res.render("forgot-password", {
      error: err.message,
      success: null,
    });
  }
};

// ================= RESET PASSWORD =================
exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const token = req.params.token;

    await authService.resetPassword(token, password);

    res.redirect("/login");

  } catch (err) {
    res.render("reset-password", {
      token: req.params.token,
      error: err.message,
    });
  }
};
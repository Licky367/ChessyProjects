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
    let { name, email, password, phone } = req.body;

    // Normalize email (important)
    email = email.toLowerCase().trim();

    const profileImage = req.file ? req.file.filename : "";

    // Basic validation
    if (!name || !email || !password) {
      return res.render("signup", {
        error: "All required fields must be filled",
      });
    }

    if (password.length < 6) {
      return res.render("signup", {
        error: "Password must be at least 6 characters",
      });
    }

    // Service handles:
    // - invitation check
    // - role assignment
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
    let { email, password } = req.body;

    // Normalize email
    email = email.toLowerCase().trim();

    const user = await authService.login({ email, password });

    // Store minimal safe session data
    req.session.user = {
      id: user._id,
      name: user.name,
      role: user.role,
      profileImage: user.profileImage || "",
    };

    res.redirect("/");

  } catch (err) {
    res.render("login", { error: err.message });
  }
};

// ================= LOGOUT =================
exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid"); // cleaner logout
    res.redirect("/login");
  });
};

// ================= FORGOT PASSWORD =================
exports.forgotPassword = async (req, res) => {
  try {
    let { email } = req.body;

    email = email.toLowerCase().trim();

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

    if (!password || password.length < 6) {
      return res.render("reset-password", {
        token,
        error: "Password must be at least 6 characters",
      });
    }

    await authService.resetPassword(token, password);

    res.redirect("/login");

  } catch (err) {
    res.render("reset-password", {
      token: req.params.token,
      error: err.message,
    });
  }
};
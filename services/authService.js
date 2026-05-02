const crypto = require("crypto");
const ProjectUser = require("../models/projectUser");
const ProjectUserInvitation = require("../models/projectUserInvitation");

// ================= SIGNUP =================
exports.signup = async ({ name, email, password, phone, profileImage }) => {

  const existingUser = await ProjectUser.findOne({ email });
  if (existingUser) throw new Error("Account already exists");

  const invitation = await ProjectUserInvitation.findOne({ email });

  if (!invitation) throw new Error("You are not invited to register");
  if (invitation.used) throw new Error("Invitation already used");

  const user = await ProjectUser.create({
    name,
    email,
    password,
    phone,
    profileImage: profileImage || "",
    role: invitation.role,
  });

  invitation.used = true;
  await invitation.save();

  return user;
};

// ================= LOGIN =================
exports.login = async ({ email, password }) => {

  const user = await ProjectUser.findOne({ email }).select("+password");

  if (!user) throw new Error("Invalid email or password");

  const isMatch = await user.comparePassword(password);

  if (!isMatch) throw new Error("Invalid email or password");

  return user;
};

// ================= FORGOT PASSWORD =================
exports.forgotPassword = async (email) => {

  const user = await ProjectUser.findOne({ email });

  if (!user) throw new Error("No account with that email");

  const token = crypto.randomBytes(32).toString("hex");

  user.resetToken = token;
  user.resetTokenExpiry = Date.now() + 1000 * 60 * 15; // 15 minutes

  await user.save();

  const resetLink = `http://localhost:3000/reset-password/${token}`;
  console.log("RESET LINK:", resetLink);

  return resetLink;
};

// ================= RESET PASSWORD =================
exports.resetPassword = async (token, newPassword) => {

  const user = await ProjectUser.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: Date.now() },
  });

  if (!user) throw new Error("Invalid or expired token");

  user.password = newPassword;
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;

  await user.save();

  return true;
};
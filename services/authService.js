const ProjectUser = require("../models/projectUser");
const ProjectUserInvitation = require("../models/projectUserInvitation");

// ===== SIGNUP =====
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

// ===== LOGIN =====
exports.login = async ({ email, password }) => {

  const user = await ProjectUser.findOne({ email }).select("+password");

  if (!user) throw new Error("Invalid email or password");

  const isMatch = await user.comparePassword(password);

  if (!isMatch) throw new Error("Invalid email or password");

  return user;
};
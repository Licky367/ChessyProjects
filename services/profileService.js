const User = require("../models/projectUser");
const bcrypt = require("bcrypt");

/**
 * Get user profile
 */
exports.getUser = async (id) => {
    return await User.findById(id);
};


/**
 * Update user profile
 * - name/email/phone
 * - optional profile image
 * - optional password change
 */
exports.updateUser = async (id, data, file = null) => {

    const updateData = {
        name: data.name,
        email: data.email,
        phone: data.phone
    };

    // 📸 PROFILE IMAGE (from multer)
    if (file) {
        updateData.profileImage = file.filename;
    }

    // 🔐 PASSWORD CHANGE LOGIC
    if (data.newPassword || data.confirmNewPassword || data.password) {

        const user = await User.findById(id);

        const match = await bcrypt.compare(data.password, user.password);

        if (!match) {
            throw new Error("Current password is incorrect");
        }

        if (data.newPassword !== data.confirmNewPassword) {
            throw new Error("New passwords do not match");
        }

        if (data.newPassword.length < 6) {
            throw new Error("Password must be at least 6 characters");
        }

        updateData.password = await bcrypt.hash(data.newPassword, 10);
    }

    return await User.findByIdAndUpdate(id, updateData, { new: true });
};
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },

    name: {
        type: String,
        required: true
    },

    number: {
        type: String,
        required: true,
        unique: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    }
});

// Generate a random 3-digit User ID
userSchema.pre("validate", async function () {
    if (!this.isNew || this.userId) {
        return;
    }

    let userId;
    let exists = true;

    while (exists) {
        userId = Math.floor(1000 + Math.random() * 9000).toString();

        exists = await mongoose.models.User.exists({ userId });
    }

    this.userId = userId;
});

module.exports = mongoose.model("User", userSchema);
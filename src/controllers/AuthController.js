const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// =========================
// SIGNUP
// =========================

const signup = async (req, res) => {
    try {
        const {
            name,
            number,
            email,
            password
        } = req.body;

        // Check required fields
        if (!name || !number || !email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        // Validate Indian phone number
        const phoneRegex = /^[6-9]\d{9}$/;

        if (!phoneRegex.test(number)) {
            return res.status(400).json({
                message: "Invalid Indian phone number"
            });
        }

        // Password validation
        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters"
            });
        }

        // Normalize email
        const normalizedEmail = email.toLowerCase().trim();

        // Check email
        const existingEmail = await User.findOne({
            email: normalizedEmail
        });

        if (existingEmail) {
            return res.status(400).json({
                message: "Email already registered"
            });
        }

        // Check phone number
        const existingNumber = await User.findOne({
            number
        });

        if (existingNumber) {
            return res.status(400).json({
                message: "Phone number already registered"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(
            password,
            10
        );

        // Create user
        // userId is generated automatically by User schema
        const user = await User.create({
            name: name.trim(),
            number,
            email: normalizedEmail,
            password: hashedPassword
        });

        // =========================
        // CREATE JWT AFTER SIGNUP
        // =========================

        const token = jwt.sign(
            {
                id: user._id.toString(),
                userId: user.userId,
                email: user.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        return res.status(201).json({
            message: "User created successfully",

            token,

            user: {
                id: user._id,
                userId: user.userId,
                name: user.name,
                number: user.number,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Signup error:", error);

        // MongoDB duplicate key
        if (error.code === 11000) {
            return res.status(400).json({
                message: "Email, phone number or user ID already exists"
            });
        }

        return res.status(500).json({
            message: "Server error"
        });
    }
};


// =========================
// LOGIN
// =========================

const login = async (req, res) => {
    try {
        const {
            identifier,
            password
        } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({
                message:
                    "Email/User ID and password are required"
            });
        }

        const normalizedIdentifier =
            identifier.trim();

        let user;

        // =========================
        // LOGIN USING EMAIL
        // =========================

        if (normalizedIdentifier.includes("@")) {

            user = await User.findOne({
                email: normalizedIdentifier.toLowerCase()
            });

        }

        // =========================
        // LOGIN USING 3-DIGIT USER ID
        // =========================

        else {

            user = await User.findOne({
                userId: normalizedIdentifier
            });

        }

        // User not found
        if (!user) {
            return res.status(401).json({
                message:
                    "Invalid email/User ID or password"
            });
        }

        // =========================
        // CHECK PASSWORD
        // =========================

        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(401).json({
                message:
                    "Invalid email/User ID or password"
            });
        }

        // =========================
        // CREATE JWT
        // =========================

        const token = jwt.sign(
            {
                id: user._id.toString(),
                userId: user.userId,
                email: user.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        return res.status(200).json({
            message: "Login successful",

            token,

            user: {
                id: user._id,
                userId: user.userId,
                name: user.name,
                number: user.number,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};


// =========================
// GET CURRENT USER
// =========================

const getMe = async (req, res) => {
    try {

        // authMiddleware already verified the JWT
        // and added req.user

        if (!req.user || !req.user.id) {
            return res.status(401).json({
                message: "Authentication required"
            });
        }

        const user = await User.findById(
            req.user.id
        ).select(
            "-password"
        );

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.status(200).json({
            user: {
                id: user._id,
                userId: user.userId,
                name: user.name,
                number: user.number,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Get current user error:", error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};

const findUserByUserId = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                message: "User ID is required"
            });
        }

        const user = await User.findOne({
            userId: userId.trim()
        }).select("userId name email");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.status(200).json({
            user
        });

    } catch (error) {
        console.error(
            "Find user error:",
            error
        );

        return res.status(500).json({
            message: "Failed to find user"
        });
    }
};
module.exports = {
    findUserByUserId,
    signup,
    login,
    getMe
};
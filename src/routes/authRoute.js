const express = require("express");

const {
    signup,
    login,
    getMe,
    findUserByUserId
} = require("../controllers/AuthController");



const { auth } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/user/:userId", auth, findUserByUserId);


// Public routes
router.post("/signup", signup);
router.post("/login", login);


// Protected route
router.get("/me", auth, getMe);


module.exports = router;

const express = require("express");

const {
    RegisterForEvent,
    GetMyRegistrations
} = require("../controllers/RegistrationController");

const { auth } = require("../middleware/authMiddleware");

const router = express.Router();

// Register for an event
router.post("/", auth, RegisterForEvent);

// Get events where current user is participating
router.get("/my-registrations", auth, GetMyRegistrations);

module.exports = router;
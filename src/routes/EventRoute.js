const express = require("express");
const { getEvents, getMyEvents} = require("../controllers/EventController");
const {auth} = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/", getEvents);

router.get("/myEvents", auth, getMyEvents);

module.exports = router;
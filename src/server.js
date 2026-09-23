const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const authRoute = require("./routes/authRoute");
const eventRoute = require("./routes/EventRoute");
const registrationRoute = require("./routes/RegistrationRoute");

const app = express();

// =========================
// MIDDLEWARE
// =========================

app.use(cors());
app.use(express.json());

// =========================
// ROUTES
// =========================

app.use("/api/auth", authRoute);

app.use("/api/events", eventRoute);

app.use("/api/registerEvent", registrationRoute);

// =========================
// ROOT
// =========================

app.get("/", (req, res) => {
    res.json({
        message: "Backend is running"
    });
});

// =========================
// DATABASE
// =========================

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Atlas connected");

        const PORT = process.env.PORT || 5000;

        app.listen(PORT, () => {
            console.log(
                `Server running on http://localhost:${PORT}`
            );
        });
    })
    .catch((error) => {
        console.error(
            "MongoDB connection failed:",
            error
        );
    });
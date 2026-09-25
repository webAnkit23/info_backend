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
// CORS CONFIGURATION
// =========================

const allowedOrigins = [
    "https://www.infotrek26.tech",
    "https://infotrek26.tech",

    // Local development
    "http://localhost:5173",
    "http://localhost:3000"
];

app.use(
    cors({
        origin: function (origin, callback) {
            // Allow requests such as Postman/server-to-server
            if (!origin) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            console.log("Blocked CORS origin:", origin);

            return callback(
                new Error("Not allowed by CORS")
            );
        },

        methods: [
            "GET",
            "POST",
            "PUT",
            "DELETE",
            "PATCH",
            "OPTIONS"
        ],

        allowedHeaders: [
            "Content-Type",
            "Authorization"
        ],

        credentials: true
    })
);

// =========================
// MIDDLEWARE
// =========================

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
                `Server running on port ${PORT}`
            );
        });
    })
    .catch((error) => {
        console.error(
            "MongoDB connection failed:",
            error
        );
    });
const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    description: {
        type: String,
        required: true
    },

    minPlayer: {
        type: Number,
        required: true,
        min: 1
    },

    maxPlayer: {
        type: Number,
        required: true,
        min: 1
    },

    registrationOpen: {
        type: Boolean,
        default: true
    },

    // Technical / Non-Technical
    type: {
        type: String,
        enum: ["Technical", "Non-Technical"],
        required: true
    },

    // Venue
    venue: {
        type: String,
        required: true
    },

    // Timeline
    date: {
        type: Date,
        required: true
    },

    startTime: {
        type: String,
        required: true
    },

    endTime: {
        type: String,
        required: true
    }

});

module.exports = mongoose.model("Event", EventSchema);
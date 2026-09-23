const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema(
    {
        // Event for which the team is registering
        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            required: true
        },

        // User who created the team
        leader: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // Other users participating in the team
        players: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            }
        ],

        status: {
            type: String,
            enum: ["registered", "cancelled"],
            default: "registered"
        }
    },
    {
        timestamps: true
    }
);


// A leader cannot create two registrations for
// the same event.
registrationSchema.index(
    { event: 1, leader: 1 },
    { unique: true }
);


module.exports = mongoose.model(
    "Registration",
    registrationSchema
);
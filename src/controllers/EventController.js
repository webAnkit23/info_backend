const Event = require("../models/Event");
const Registration = require("../models/Registration");

// ==========================================
// GET ALL EVENTS
// ==========================================

const getEvents = async (req, res) => {
    try {
        const events = await Event.find();

        return res.status(200).json(events);
       

    } catch (err) {
        console.error("Get events error:", err);

        return res.status(500).json({
            message: "Failed to fetch events"
        });
    }
};


// ==========================================
// GET EVENT BY ID
// ==========================================

const getEventById = async (req, res) => {
    try {
        const { eventId } = req.params;

        if (!eventId) {
            return res.status(400).json({
                message: "Event ID is required"
            });
        }

        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({
                message: "No such event exists"
            });
        }

        return res.status(200).json(event);

    } catch (err) {
        console.error("Get event error:", err);

        return res.status(500).json({
            message: "Failed to fetch event"
        });
    }
};


// ==========================================
// GET MY EVENTS
// ==========================================

const getMyEvents = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                message: "Authentication required"
            });
        }

        const registrations = await Registration.find({
            $or: [
                {
                    leader: req.user.id
                },
                {
                    players: req.user.id
                }
            ],
            status: "registered"
        }).populate("event");

        return res.status(200).json({
            events: registrations
        });

    } catch (err) {
        console.error("Get my events error:", err);

        return res.status(500).json({
            message: "Failed to fetch your events"
        });
    }
};


module.exports = {
    getEvents,
    getEventById,
    getMyEvents
};
const mongoose = require("mongoose");

const Event = require("../models/Event");
const Registration = require("../models/Registration");
const User = require("../models/User");


// =====================================================
// REGISTER FOR EVENT
// =====================================================

const RegisterForEvent = async (req, res) => {
    try {

        // =====================================================
        // 1. CHECK AUTHENTICATION
        // =====================================================

        if (!req.user || !req.user.id) {
            return res.status(401).json({
                message: "Authentication required"
            });
        }

        const leaderId = req.user.id;


        // =====================================================
        // 2. GET DATA FROM REQUEST
        // =====================================================

        const { eventId, players } = req.body;


        // =====================================================
        // 3. VALIDATE EVENT ID
        // =====================================================

        if (!eventId) {
            return res.status(400).json({
                message: "Event ID is required"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({
                message: "Invalid event ID"
            });
        }


        // =====================================================
        // 4. VALIDATE PLAYERS
        // =====================================================

        if (!players) {
            return res.status(400).json({
                message: "Players are required"
            });
        }

        if (!Array.isArray(players)) {
            return res.status(400).json({
                message: "Players must be an array"
            });
        }


        // =====================================================
        // 5. FIND EVENT
        // =====================================================

        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({
                message: "Event not found"
            });
        }


        // =====================================================
        // 6. CHECK REGISTRATION STATUS
        // =====================================================

        if (!event.registrationOpen) {
            return res.status(400).json({
                message: "Registration for this event is closed"
            });
        }


        // =====================================================
        // 7. VALIDATE MIN/MAX TEAM SIZE
        // =====================================================

        /*
            minPlayer and maxPlayer INCLUDE THE LEADER.

            Example:

            minPlayer = 2
            maxPlayer = 4

            Leader + 1 player = 2  -> VALID
            Leader + 2 players = 3 -> VALID
            Leader + 3 players = 4 -> VALID

            Leader alone = 1       -> INVALID
            Leader + 4 players = 5 -> INVALID
        */

        const totalPlayers = players.length + 1;

        if (
            totalPlayers < event.minPlayer ||
            totalPlayers > event.maxPlayer
        ) {
            return res.status(400).json({
                message:
                    `Team must contain between ${event.minPlayer} ` +
                    `and ${event.maxPlayer} members including the leader`
            });
        }


        // =====================================================
        // 8. VALIDATE PUBLIC USER IDs
        // =====================================================

        /*
            Frontend sends:

            players: ["247", "531", "724"]

            These are PUBLIC USER IDs.

            They are NOT MongoDB ObjectIds.
        */

        for (let i = 0; i < players.length; i++) {

            const publicUserId = String(players[i]).trim();

            if (!publicUserId) {
                return res.status(400).json({
                    message: `Player ${i + 1} is required`
                });
            }

            // User IDs must be exactly 3 digits
            if (!/^\d{3}$/.test(publicUserId)) {
                return res.status(400).json({
                    message:
                        `Invalid User ID at position ${i + 1}. ` +
                        `User ID must contain exactly 3 digits.`
                });
            }
        }


        // =====================================================
        // 9. CHECK DUPLICATE USER IDs
        // =====================================================

        const uniquePublicUserIds = new Set(
            players.map(playerId =>
                String(playerId).trim()
            )
        );

        if (
            uniquePublicUserIds.size !== players.length
        ) {
            return res.status(400).json({
                message:
                    "Same player cannot be added multiple times"
            });
        }


        // =====================================================
        // 10. CHECK LEADER EXISTS
        // =====================================================

        const leader = await User.findById(leaderId);

        if (!leader) {
            return res.status(404).json({
                message: "Leader user not found"
            });
        }


        // =====================================================
        // 11. LEADER CANNOT ALSO BE A PLAYER
        // =====================================================

        const leaderPublicUserId =
            String(leader.userId);

        const leaderIsPlayer =
            players.some(
                playerId =>
                    String(playerId).trim() ===
                    leaderPublicUserId
            );

        if (leaderIsPlayer) {
            return res.status(400).json({
                message:
                    "Team leader cannot also be a player"
            });
        }


        // =====================================================
        // 12. FIND PLAYERS USING PUBLIC USER IDs
        // =====================================================

        /*
            Convert:

            247
            531
            724

            into User documents.
        */

        const publicUserIds = players.map(
            playerId =>
                String(playerId).trim()
        );

        const existingUsers = await User.find({
            userId: {
                $in: publicUserIds
            }
        }).select("_id userId name email");


        // =====================================================
        // 13. CHECK ALL PLAYERS EXIST
        // =====================================================

        if (
            existingUsers.length !==
            publicUserIds.length
        ) {
            const foundUserIds = new Set(
                existingUsers.map(
                    user => String(user.userId)
                )
            );

            const missingUserIds =
                publicUserIds.filter(
                    userId =>
                        !foundUserIds.has(userId)
                );

            return res.status(404).json({
                message:
                    `User ID ${missingUserIds.join(", ")} ` +
                    `does not exist`
            });
        }


        // =====================================================
        // 14. CONVERT PUBLIC USER IDs → MONGODB IDs
        // =====================================================

        /*
            Database stores MongoDB ObjectIds.

            Example:

            "247"
                ↓
            User
                ↓
            ObjectId("68abc...")

        */

        const playerMongoIds =
            existingUsers.map(
                user => user._id
            );


        // =====================================================
        // 15. CHECK WHETHER LEADER ALREADY PARTICIPATES
        // =====================================================

        /*
            This checks both possibilities:

            1. Leader has already registered as a leader.

            2. Leader has already joined another team
               as a player.
        */

        const leaderExistingRegistration =
            await Registration.findOne({
                event: eventId,

                $or: [
                    {
                        leader: leaderId
                    },
                    {
                        players: leaderId
                    }
                ]
            });

        if (leaderExistingRegistration) {
            return res.status(409).json({
                message:
                    "You are already participating in this event"
            });
        }


        // =====================================================
        // 16. CHECK WHETHER ANY PLAYER ALREADY PARTICIPATES
        // =====================================================

        /*
            Check whether any player is already:

            - Leader of another team
            OR
            - Player of another team
        */

        const playerExistingRegistration =
            await Registration.findOne({
                event: eventId,

                $or: [
                    {
                        leader: {
                            $in: playerMongoIds
                        }
                    },
                    {
                        players: {
                            $in: playerMongoIds
                        }
                    }
                ]
            });

        if (playerExistingRegistration) {
            return res.status(409).json({
                message:
                    "One or more players are already participating in this event"
            });
        }


        // =====================================================
        // 17. CREATE REGISTRATION
        // =====================================================

        const registration =
            await Registration.create({
                event: eventId,

                // Logged-in user's MongoDB ID
                leader: leaderId,

                // Teammates' MongoDB IDs
                players: playerMongoIds
            });


        // =====================================================
        // 18. SUCCESS RESPONSE
        // =====================================================

        return res.status(201).json({
            message:
                "Successfully registered for the event",

            registration
        });

    } catch (err) {

        // =====================================================
        // 19. LOG ERROR
        // =====================================================

        console.error(
            "Event registration error:",
            err
        );


        // =====================================================
        // 20. DUPLICATE KEY ERROR
        // =====================================================

        if (err.code === 11000) {
            return res.status(409).json({
                message:
                    "You have already registered for this event"
            });
        }


        // =====================================================
        // 21. MONGOOSE VALIDATION ERROR
        // =====================================================

        if (err.name === "ValidationError") {
            return res.status(400).json({
                message:
                    "Invalid registration data",

                errors:
                    Object.values(err.errors).map(
                        error => error.message
                    )
            });
        }


        // =====================================================
        // 22. INVALID OBJECT ID / CAST ERROR
        // =====================================================

        if (err.name === "CastError") {
            return res.status(400).json({
                message:
                    "Invalid data provided"
            });
        }


        // =====================================================
        // 23. GENERAL SERVER ERROR
        // =====================================================

        return res.status(500).json({
            message:
                "Registration failed due to server error"
        });
    }
};


// =====================================================
// GET MY REGISTRATIONS
// =====================================================

const GetMyRegistrations = async (req, res) => {
    try {

        // =====================================================
        // 1. CHECK AUTHENTICATION
        // =====================================================

        if (!req.user || !req.user.id) {
            return res.status(401).json({
                message: "Authentication required"
            });
        }

        const userId = req.user.id;


        // =====================================================
        // 2. FIND ALL REGISTRATIONS
        // =====================================================

        const registrations =
            await Registration.find({
                status: "registered",

                $or: [
                    {
                        leader: userId
                    },
                    {
                        players: userId
                    }
                ]
            })
                .populate(
                    "event",
                    "name description minPlayer maxPlayer registrationOpen"
                )
                .populate(
                    "leader",
                    "userId name"
                )
                .populate(
                    "players",
                    "userId name"
                )
                .sort({
                    createdAt: -1
                });


        // =====================================================
        // 3. FORMAT RESPONSE
        // =====================================================

        const result =
            registrations.map(
                registration => {

                    const isLeader =
                        registration.leader._id
                            .toString() ===
                        userId.toString();

                    return {
                        registrationId:
                            registration._id,

                        eventId:
                            registration.event._id,

                        eventName:
                            registration.event.name,

                        role:
                            isLeader
                                ? "leader"
                                : "player",

                        event:
                            registration.event,

                        leader:
                            registration.leader,

                        players:
                            registration.players,

                        registeredAt:
                            registration.createdAt
                    };
                }
            );


        // =====================================================
        // 4. SEND RESPONSE
        // =====================================================

        return res.status(200).json({
            registrations: result
        });

    } catch (error) {

        console.error(
            "Get my registrations error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to fetch registrations"
        });
    }
};


// =====================================================
// EXPORT
// =====================================================

module.exports = {
    RegisterForEvent,
    GetMyRegistrations
};


// NUK RentServe Real-Time Socket.IO Service
// Powers real-time ride dispatch, driver GPS tracking, and instant customer-provider messaging

const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const ProviderApplication = require("../models/ProviderApplication");
const TransportBooking = require("../models/TransportBooking");
const User = require("../models/User");

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
      credentials: true,
    },
    pingTimeout: 30000,
    pingInterval: 10000,
  });

  // Authentication Middleware
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, "") ||
        socket.handshake.query?.token;

      if (!token) {
        // Allow anonymous connection for public tracking if booking ID provided
        socket.user = null;
        return next();
      }

      const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
      jwt.verify(token, secret, (err, decoded) => {
        if (err) {
          // Token expired or invalid, still connect as guest
          socket.user = null;
          return next();
        }
        socket.user = {
          ...decoded,
          id: decoded.sub || decoded.id,
        };
        next();
      });
    } catch {
      socket.user = null;
      next();
    }
  });

  io.on("connection", (socket) => {
    const user = socket.user;

    if (user?.id) {
      // User joins their personal room for private notifications
      socket.join(`user:${user.id}`);

      // Drivers & providers join the driver dispatch pool
      if (["driver", "provider"].includes(user.role)) {
        socket.join("drivers");
        socket.join(`driver:${user.id}`);
      }
    }

    // Join active trip tracking room
    socket.on("trip:join", ({ bookingId }) => {
      if (bookingId) {
        socket.join(`trip:${bookingId}`);
      }
    });

    socket.on("trip:leave", ({ bookingId }) => {
      if (bookingId) {
        socket.leave(`trip:${bookingId}`);
      }
    });

    // Join chat room
    socket.on("chat:join", ({ conversationId, bookingId }) => {
      const room = conversationId || bookingId;
      if (room) {
        socket.join(`chat:${room}`);
      }
    });

    socket.on("chat:leave", ({ conversationId, bookingId }) => {
      const room = conversationId || bookingId;
      if (room) {
        socket.leave(`chat:${room}`);
      }
    });

    // Driver broadcasts live GPS location
    socket.on("driver:location_update", async (data) => {
      if (!user?.id || !["driver", "provider"].includes(user?.role)) {
        return;
      }

      const { latitude, longitude, accuracy, heading, speed, bookingId } = data || {};
      const lat = Number(latitude);
      const lon = Number(longitude);

      if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
        return;
      }

      const point = { latitude: lat, longitude: lon };
      const geoPoint = { type: "Point", coordinates: [lon, lat] };

      try {
        // Update driver's dispatch location in ProviderApplication
        await ProviderApplication.updateMany(
          { userId: user.id },
          {
            $set: {
              locationCoordinates: point,
              location: geoPoint,
              ...(accuracy != null ? { accuracy: Number(accuracy) } : {}),
              ...(heading != null ? { heading: Number(heading) } : {}),
              ...(speed != null ? { speed: Number(speed) } : {}),
              lastLocationUpdatedAt: new Date(),
            },
          }
        );

        // If currently on an active trip, update booking live location & broadcast
        if (bookingId && mongoose.isValidObjectId(bookingId)) {
          const liveLoc = {
            ...point,
            accuracy: accuracy != null ? Number(accuracy) : undefined,
            heading: heading != null ? Number(heading) : undefined,
            speed: speed != null ? Number(speed) : undefined,
            updatedAt: new Date(),
          };

          const updatedBooking = await TransportBooking.findOneAndUpdate(
            {
              _id: bookingId,
              providerId: user.id,
              status: { $in: ["accepted", "in_progress"] },
            },
            {
              $set: {
                liveLocation: liveLoc,
                liveLocationGeo: geoPoint,
              },
            },
            { new: true }
          ).select("customerId liveLocation status");

          if (updatedBooking) {
            // Broadcast moving marker to trip room and customer directly
            io.to(`trip:${bookingId}`).emit("trip:location_update", {
              bookingId,
              liveLocation: liveLoc,
            });

            if (updatedBooking.customerId) {
              io.to(`user:${updatedBooking.customerId}`).emit("trip:location_update", {
                bookingId,
                liveLocation: liveLoc,
              });
            }
          }
        }
      } catch (err) {
        console.warn("Socket driver location update error:", err.message);
      }
    });

    // Driver toggles online / offline status
    socket.on("driver:toggle_online", async ({ isOnline }) => {
      if (!user?.id) return;
      try {
        await User.findByIdAndUpdate(user.id, { isOnline: Boolean(isOnline) });
        await ProviderApplication.updateMany({ userId: user.id }, { isOnline: Boolean(isOnline) });

        if (isOnline) {
          socket.join("drivers");
        } else {
          socket.leave("drivers");
        }

        io.to("drivers").emit("driver:status_changed", {
          driverId: user.id,
          isOnline: Boolean(isOnline),
        });
      } catch (err) {
        console.warn("Socket driver toggle online error:", err.message);
      }
    });

    socket.on("disconnect", () => {
      // Disconnection handled cleanly
    });
  });

  return io;
}

function getIO() {
  return io;
}

function emitToUser(userId, event, data) {
  if (io && userId) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

function emitToDrivers(event, data) {
  if (io) {
    io.to("drivers").emit(event, data);
  }
}

function emitToTrip(bookingId, event, data) {
  if (io && bookingId) {
    io.to(`trip:${bookingId}`).emit(event, data);
  }
}

function emitToChat(roomId, event, data) {
  if (io && roomId) {
    io.to(`chat:${roomId}`).emit(event, data);
  }
}

module.exports = {
  initSocket,
  getIO,
  emitToUser,
  emitToDrivers,
  emitToTrip,
  emitToChat,
};

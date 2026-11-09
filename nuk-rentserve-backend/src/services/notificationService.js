const Notification = require("../models/Notification");
const { sendEmail } = require("./emailService");
const { getIO } = require("./socketService");

async function notifyUser(user, subject, text) {
  if (!user?.email) return;
  try {
    await sendEmail({ to: user.email, subject, text });
  } catch (error) {
    console.error("Notification delivery failed:", error.message);
  }
}

async function createAndSendNotification({
  userId,
  role = "customer",
  category = "system",
  title,
  description,
  data = {}
}) {
  if (!userId || !title || !description) return null;

  try {
    const notification = await Notification.create({
      userId,
      role,
      category,
      title,
      description,
      data,
      isRead: false
    });

    // Real-time foreground delivery via Socket.IO
    const io = getIO();
    if (io) {
      io.to(`user:${userId}`).emit("notification:new", {
        _id: notification._id,
        title,
        description,
        category,
        data,
        createdAt: notification.createdAt
      });
    }

    return notification;
  } catch (err) {
    console.error("createAndSendNotification error:", err.message);
    return null;
  }
}

module.exports = {
  notifyUser,
  createAndSendNotification
};

import Notification from "../models/notification.model.js";
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const notifications = await Notification.find({
      receiver: userId,
    }).populate({
      path: "sender",
      select: "username profileImg",
    });
    await Notification.updateMany({ receiver: userId }, { read: true });
    return res.status(200).json(notifications);
  } catch (error) {
    console.log(" Error in getNotifications controller: ", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    await Notification.deleteMany({ receiver: userId });
    return res
      .status(200)
      .json({ message: "Notifications deleted successfully" });
  } catch (error) {
    console.log(" Error in deleteNotifications controller: ", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user._id;
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    if (notification.receiver.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ error: "You are not authorized to delete this notification" });
    }

    await Notification.findByIdAndDelete(notificationId);
    return res
      .status(200)
      .json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.log(" Error in deleteNotification controller: ", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};
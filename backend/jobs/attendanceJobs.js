const cron = require("node-cron");
const Attendance = require("../models/Attendance");
const User = require("../models/User");

cron.schedule("5 0 * * *", async () => {
  try {
    console.log("Running auto-absent job...");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const users = await User.find({ isActive: true });

    for (const user of users) {
      const existing = await Attendance.findOne({
        employee: user._id,
        date: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      });

      if (!existing) {
        await Attendance.create({
          employee: user._id,
          date: today,
          status: "absent"
        });
      }
    }

    console.log("Auto absent completed");

  } catch (error) {
    console.error("Auto absent error:", error);
  }
});
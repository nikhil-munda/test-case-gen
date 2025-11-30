import cron from "node-cron";
import { prisma } from "../utilities/prisma.js";

// Schedule job to run daily at midnight
const job = cron.schedule(
  "0 0 * * *",
  async () => {
    try {
      const fiveMinutesAgo = new Date();
      fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

      // Delete OTPs older than 5 minutes
      const deletedOTPs = await prisma.otp.deleteMany({
        where: {
          createdAt: {
            lt: fiveMinutesAgo,
          },
        },
      });

      console.log(`Deleted ${deletedOTPs.count} expired OTPs`);
    } catch (error) {
      console.log("Error in cron job:", error);
    }
  },
  {
    scheduled: true,
    timezone: "Asia/Kolkata",
  }
);

export { job };

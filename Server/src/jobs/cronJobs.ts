import { CronJob } from "cron";
import { prisma } from "../utilities/prisma.js";

const job = new CronJob(
  "0 0 * * *", 
  async function () {
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
   } catch (error) {
    console.log('error in the cronejob ', error)
   }
  }, // onTick
  null, // onComplete
  true, // start
 "Asia/Kolkata"
);

export {job}

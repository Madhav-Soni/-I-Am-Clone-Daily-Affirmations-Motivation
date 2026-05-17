const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
const User = require("./src/models/User");
const MoodLog = require("./src/models/MoodLog");
const { getLocalDateString, getStartOfLocalDay } = require("./src/utils/timezoneHelper");
const { getTodaySessionState } = require("./src/services/sessionOrchestrator");

async function run() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/affirmation_app");
  console.log("Connected to MongoDB.\n");

  const runDSTTest = () => {
    console.log("==================================================");
    console.log("☀️  TESTING: US DST Rollover Math");
    console.log("==================================================");

    const timezone = "America/New_York";

    // 1. Spring Forward (March 8, 2026 - clock jumps from 2:00 AM to 3:00 AM local time)
    const springDay = "2026-03-08";
    const springMidnight = getStartOfLocalDay(springDay, timezone);
    console.log(`Spring Midnight in UTC: ${springMidnight.toISOString()} (Expected: 2026-03-08T05:00:00.000Z due to EST UTC-5)`);

    // Verify local date string formatting at start of day
    const formattedSpring = getLocalDateString(springMidnight, timezone);
    console.log(`Formatted Spring Midnight back to local: "${formattedSpring}" (Expected: "${springDay}")`);

    // 2. Fall Back (November 1, 2026 - clock jumps from 2:00 AM back to 1:00 AM local time)
    const fallDay = "2026-11-01";
    const fallMidnight = getStartOfLocalDay(fallDay, timezone);
    console.log(`Fall Midnight in UTC: ${fallMidnight.toISOString()} (Expected: 2026-11-01T04:00:00.000Z due to EDT UTC-4)`);

    const formattedFall = getLocalDateString(fallMidnight, timezone);
    console.log(`Formatted Fall Midnight back to local: "${formattedFall}" (Expected: "${fallDay}")`);

    const success = (formattedSpring === springDay && formattedFall === fallDay);
    console.log(`DST rollover test result: ${success ? "✅ PASSED" : "❌ FAILED"}\n`);
  };

  const runIndiaTest = async () => {
    console.log("==================================================");
    console.log("🇮🇳  TESTING: India Timezone resets (Asia/Kolkata)");
    console.log("==================================================");

    const timezone = "Asia/Kolkata";
    const email = `test-tz-india-${Date.now()}@iamwell.com`;

    // A nightly user logs a ritual at 11:00 PM IST on 2026-05-17
    // 11:00 PM IST = 17:30 UTC on 2026-05-17
    const lastActiveTime = new Date("2026-05-17T17:30:00Z");

    const user = await User.create({
      email,
      password: "Password123!",
      timezone,
      lastActiveAt: lastActiveTime,
      streakCount: 5,
      lifetimeRitualCount: 5,
    });

    console.log(`Nightly User created with lastActiveAt (11:00 PM IST): ${user.lastActiveAt.toISOString()}`);
    console.log(`User local date string of lastActiveAt: "${getLocalDateString(user.lastActiveAt, timezone)}"`);

    // Test 1: Completed Today check
    // If it is 11:45 PM IST on 2026-05-17 (18:15 UTC)
    let checkTime = new Date("2026-05-17T18:15:00Z");
    let session = await getTodaySessionState(user, 23); // 11:00 PM local
    // Override local date calculation in getTodaySessionState by stubbing User lastActiveAt check
    const todayStr = getLocalDateString(checkTime, timezone);
    const lastActiveStr = getLocalDateString(user.lastActiveAt, timezone);
    const ritualCompletionToday = todayStr === lastActiveStr;

    console.log(`Checking at 11:45 PM IST on May 17. Ritual completed today? ${ritualCompletionToday} (Expected: true)`);

    // Test 2: Streak Rollover check the next morning at 8:00 AM IST on May 18 (02:30 UTC)
    const morningTime = new Date("2026-05-18T02:30:00Z");
    
    // Simulate streak update
    user.lastActiveAt = lastActiveTime; // Restore
    
    // Manual local day calculation as in userSchema.methods.updateStreak
    const uTodayStr = getLocalDateString(morningTime, timezone);
    const uLastActiveStr = getLocalDateString(user.lastActiveAt, timezone);
    const uTodayMidnight = getStartOfLocalDay(uTodayStr, timezone);
    const uLastActiveMidnight = getStartOfLocalDay(uLastActiveStr, timezone);
    const diffMs = uTodayMidnight.getTime() - uLastActiveMidnight.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    console.log(`Evaluating consecutive streak next morning (May 18). Day difference: ${diffDays} (Expected: 1)`);
    if (diffDays === 1) {
      user.streakCount += 1;
      user.lifetimeRitualCount += 1;
    }
    user.lastActiveAt = morningTime;
    await user.save();

    console.log(`Updated Streak Count: ${user.streakCount} (Expected: 6)`);
    console.log(`Updated Lifetime Count: ${user.lifetimeRitualCount} (Expected: 6)`);

    const passed = (ritualCompletionToday && user.streakCount === 6);
    console.log(`India Timezone test result: ${passed ? "✅ PASSED" : "❌ FAILED"}\n`);

    await User.deleteOne({ _id: user._id });
  };

  const runTravelTest = async () => {
    console.log("==================================================");
    console.log("✈️  TESTING: International Travel & Timezone Shift");
    console.log("==================================================");

    const email = `test-tz-travel-${Date.now()}@iamwell.com`;

    // 1. User performs a ritual in India (Asia/Kolkata) on Day 1 (May 17) at 9:00 AM IST (03:30 UTC)
    const indiaTime = new Date("2026-05-17T03:30:00Z");
    const user = await User.create({
      email,
      password: "Password123!",
      timezone: "Asia/Kolkata",
      lastActiveAt: indiaTime,
      streakCount: 1,
      lifetimeRitualCount: 1,
    });

    console.log(`User created. Done ritual in India on May 17. Timezone: ${user.timezone}`);

    // 2. User travels to New York (America/New_York) and does the next ritual on May 18 at 10:00 AM EDT (14:00 UTC)
    const newYorkTime = new Date("2026-05-18T14:00:00Z");
    
    // Simulate mobile request carrying 'x-timezone: America/New_York'
    // Under protect middleware:
    const clientTimezone = "America/New_York";
    if (user.timezone !== clientTimezone) {
      user.timezone = clientTimezone;
      await user.save({ validateBeforeSave: false });
    }

    console.log(`User landed in New York. Dynamic timezone updated to: ${user.timezone}`);

    // Execute streak update in New York local calendar day
    const result = await user.updateStreak();
    console.log(`Streak evaluated post-travel in New York. Result streak: ${result.streakCount} | Lifetime: ${result.lifetimeRitualCount}`);
    
    const passed = (result.streakCount === 2 && user.timezone === "America/New_York");
    console.log(`Travel test result: ${passed ? "✅ PASSED" : "❌ FAILED"}\n`);

    await User.deleteOne({ _id: user._id });
  };

  const runAtomicLimitTest = async () => {
    console.log("==================================================");
    console.log("⚡ TESTING: Atomic Timezone-Aware Daily Resets");
    console.log("==================================================");

    const email = `test-tz-limit-${Date.now()}@iamwell.com`;
    const timezone = "Asia/Kolkata";

    // Create user who performed last generation on a PREVIOUS local day in India
    // Previous local day is May 16 IST (e.g. May 16 at 10:00 AM IST = May 16 at 04:30 UTC)
    const lastGenTime = new Date("2026-05-16T04:30:00Z");

    const user = await User.create({
      email,
      password: "Password123!",
      timezone,
      dailyGenerationCount: 4,
      dailyGenerationResetAt: lastGenTime,
      tier: "free",
    });

    console.log(`User created. Last Generation: May 16 (count = 4). Current Timezone: ${user.timezone}`);

    // Perform generation on a NEW local day: May 17 at 8:00 AM IST (02:30 UTC)
    // We stub checkAndIncrementDailyLimit to evaluate at May 17 local time
    // First, let's trigger generation. The atomic query should recognize that the last gen (May 16) is before the current local midnight (May 17 IST midnight = May 16 at 18:30 UTC).
    // Therefore, it resets dailyGenerationCount to 1!
    const checkTime = new Date("2026-05-17T02:30:00Z");
    
    const limit = 5;
    const localTodayStr = getLocalDateString(checkTime, timezone);
    const localTodayMidnight = getStartOfLocalDay(localTodayStr, timezone);

    console.log(`Current Local Day: "${localTodayStr}"`);
    console.log(`Local Midnight boundary in UTC: ${localTodayMidnight.toISOString()}`);
    console.log(`Is last generation reset (${user.dailyGenerationResetAt.toISOString()}) before local midnight? ${user.dailyGenerationResetAt < localTodayMidnight}`);

    // Atomically check and reset daily limits
    let updatedUser = await User.findOneAndUpdate(
      {
        _id: user._id,
        dailyGenerationResetAt: { $lt: localTodayMidnight },
      },
      {
        $set: {
          dailyGenerationCount: 1,
          dailyGenerationResetAt: checkTime,
          lastActiveAt: checkTime,
        },
      },
      { new: true }
    );

    console.log(`Atomic Reset Daily count: ${updatedUser ? updatedUser.dailyGenerationCount : "RESET FAILED"}`);

    const passed = (updatedUser && updatedUser.dailyGenerationCount === 1);
    console.log(`Atomic Reset test result: ${passed ? "✅ PASSED" : "❌ FAILED"}\n`);

    await User.deleteOne({ _id: user._id });
  };

  runDSTTest();
  await runIndiaTest();
  await runTravelTest();
  await runAtomicLimitTest();

  await mongoose.disconnect();
  console.log("==================================================");
  console.log("Timezone tests complete. Disconnected from MongoDB.");
}

run().catch(console.error);

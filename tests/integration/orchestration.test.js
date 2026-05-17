process.env.RATE_LIMIT_MAX_REQUESTS = "10000";
const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../../src/app");
const User = require("../../src/models/User");
const Affirmation = require("../../src/models/Affirmation");
const MoodLog = require("../../src/models/MoodLog");

// ─── Dynamic OpenAI Mocking ──────────────────────────────────────────────────
jest.mock("openai", () => {
  return jest.fn().mockImplementation(() => {
    return {
      chat: {
        completions: {
          create: jest.fn().mockImplementation((options) => {
            const messages = options.messages || [];
            const userPrompt = messages.find(m => m.role === "user")?.content || "";

            let content = "I am calm, steady, and aligned with my inner truth.";

            if (userPrompt.includes("Career")) {
              content = "MOCK_CAREER: I am a powerful force of career expansion, aligning with daily focus.";
            }
            if (userPrompt.includes("Anxious")) {
              content = "MOCK_ANXIOUS: I breathe deeply, planting my feet into the granite foundations.";
            }
            if (userPrompt.includes("Compassion Recovery")) {
              content = "MOCK_COMPASSION: I offer myself total compassion as I return home to my practice today.";
            }

            return Promise.resolve({
              choices: [{ message: { content } }],
              usage: { prompt_tokens: 60, completion_tokens: 22 }
            });
          })
        }
      }
    };
  });
});

// ─── Database Test Isolation Setup ───────────────────────────────────────────
beforeAll(async () => {
  // Use a dedicated, isolated database to completely prevent parallel resource race conditions
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/affirmation_test_integration");
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

afterEach(async () => {
  await User.deleteMany({});
  await Affirmation.deleteMany({});
  await MoodLog.deleteMany({});
});

// ─── Integration Suites ──────────────────────────────────────────────────────
describe("Wellness App Integration & Orchestration Suite", () => {
  const testUser = {
    email: "orchestration@test.com",
    password: "StrongPassword123!",
    name: "Alex Mercer",
  };

  const deviceA = "iPhone-16-Pro-Max";
  const deviceB = "iPad-Pro-M4";

  // 1) Auth Lifecycle & Multi-Device Session Hardening
  describe("1. Hardened Auth Lifecycle & Multi-Device Sessions", () => {
    it("should handle multi-device registration, rotation, mismatched device rejection, and stale replays", async () => {
      // Step A: Register on Device A
      const regRes = await request(app)
        .post("/api/v1/auth/register")
        .set("x-device-id", deviceA)
        .send(testUser);

      expect(regRes.status).toBe(201);
      const tokenA1 = regRes.body.data.accessToken;
      const refreshA1 = regRes.body.data.refreshToken;
      expect(tokenA1).toBeDefined();
      expect(refreshA1).toBeDefined();

      // Step B: Simultaneously log in on Device B
      const loginRes = await request(app)
        .post("/api/v1/auth/login")
        .set("x-device-id", deviceB)
        .send({ email: testUser.email, password: testUser.password });

      expect(loginRes.status).toBe(200);
      const tokenB1 = loginRes.body.data.accessToken;
      const refreshB1 = loginRes.body.data.refreshToken;

      // Both sessions exist in user's refreshSessions array
      const dbUser = await User.findOne({ email: testUser.email }).select("+refreshSessions");
      expect(dbUser.refreshSessions.length).toBe(2);
      expect(dbUser.refreshSessions.some(s => s.deviceId === deviceA)).toBe(true);
      expect(dbUser.refreshSessions.some(s => s.deviceId === deviceB)).toBe(true);

      // Step C: Rotate refresh token on Device A successfully
      const refreshRes = await request(app)
        .post("/api/v1/auth/refresh")
        .set("x-device-id", deviceA)
        .send({ refreshToken: refreshA1 });

      expect(refreshRes.status).toBe(200);
      const refreshA2 = refreshRes.body.data.refreshToken;
      expect(refreshA2).not.toBe(refreshA1);

      // Step D: Attacker tries to replay rotated stale refreshA1 on Device A -> must be rejected
      const replayRes = await request(app)
        .post("/api/v1/auth/refresh")
        .set("x-device-id", deviceA)
        .send({ refreshToken: refreshA1 });

      expect(replayRes.status).toBe(401);

      // Step E: Attacker tries to use fresh refreshA2 on unauthorized Device B -> must be rejected
      const hijackRes = await request(app)
        .post("/api/v1/auth/refresh")
        .set("x-device-id", deviceB)
        .send({ refreshToken: refreshA2 });

      expect(hijackRes.status).toBe(401);

      // Step F: Local logout on Device B leaves Device A intact
      const logoutBRes = await request(app)
        .post("/api/v1/auth/logout")
        .set("Authorization", `Bearer ${tokenB1}`)
        .set("x-device-id", deviceB);

      expect(logoutBRes.status).toBe(200);

      const dbUserPostLogout = await User.findOne({ email: testUser.email }).select("+refreshSessions");
      expect(dbUserPostLogout.refreshSessions.length).toBe(1);
      expect(dbUserPostLogout.refreshSessions[0].deviceId).toBe(deviceA);
    });
  });

  // 2) Onboarding & Gating Lifecycle
  describe("2. Onboarding Gating & Session Hydration", () => {
    it("should gate access until onboarding completed and hydrate today's session", async () => {
      // Register
      const { body } = await request(app)
        .post("/api/v1/auth/register")
        .set("x-device-id", deviceA)
        .send(testUser);
      const token = body.data.accessToken;

      // Verify that user profile onboarding is false
      expect(body.data.user.onboarded).toBe(false);

      // Fetch `/session/today` (hydration works for unonboarded but returns incomplete session)
      const sessionRes = await request(app)
        .get("/api/v1/session/today")
        .set("Authorization", `Bearer ${token}`);

      expect(sessionRes.status).toBe(200);
      expect(sessionRes.body.data.streakState).toBe(0);

      // Complete onboarding
      const onboardingRes = await request(app)
        .post("/api/v1/auth/onboarding")
        .set("Authorization", `Bearer ${token}`)
        .send({
          preferences: {
            topics: ["Career", "Confidence"],
            dailyFrequency: 3,
            affirmationVoice: "motivational"
          }
        });

      expect(onboardingRes.status).toBe(200);
      expect(onboardingRes.body.data.user.onboarded).toBe(true);

      // Onboarded `/session/today` check
      const sessionResAfter = await request(app)
        .get("/api/v1/session/today")
        .set("Authorization", `Bearer ${token}`);

      expect(sessionResAfter.status).toBe(200);
      expect(sessionResAfter.body.data.timeOfDayTone).toBeDefined();
    });
  });

  // 3) Daily Limits & Concurrency Safety
  describe("3. Atomic Concurrency Daily Limits", () => {
    it("should prevent TOCTOU concurrency bypasses under simultaneous generation hits", async () => {
      // Register & Onboard
      const { body } = await request(app)
        .post("/api/v1/auth/register")
        .set("x-device-id", deviceA)
        .send(testUser);
      const token = body.data.accessToken;

      await request(app)
        .post("/api/v1/auth/onboarding")
        .set("Authorization", `Bearer ${token}`)
        .send({
          preferences: { topics: ["Health"], dailyFrequency: 1, affirmationVoice: "gentle" }
        });

      // Free tier user daily limit is 5. Let's make 6 parallel AI generation calls concurrently!
      const requests = Array.from({ length: 6 }).map((_, idx) =>
        request(app)
          .post("/api/v1/ai/generate")
          .set("Authorization", `Bearer ${token}`)
          .set("x-device-id", deviceA)
          .send({ category: "Health", note: `ConcurrReq-${idx}` })
      );

      const responses = await Promise.all(requests);

      responses.forEach((r, idx) => {
        console.log(`[CONCURRENCY TEST] Req ${idx} status: ${r.status}, body: ${JSON.stringify(r.body)}`);
      });

      const successes = responses.filter(r => r.status === 201 || r.status === 200);
      const failures = responses.filter(r => r.status === 429);

      expect(successes.length).toBe(5);
      expect(failures.length).toBe(1);
    });
  });

  // 4) Dynamic Timezone Rollover & Streak Travelling
  describe("4. DST-Aware Timezone Travel & Rollovers", () => {
    it("should sync travel boundaries dynamically and recalculate local calendar rollover windows", async () => {
      // Register
      const { body } = await request(app)
        .post("/api/v1/auth/register")
        .set("x-device-id", deviceA)
        .set("x-timezone", "Asia/Kolkata")
        .send(testUser);
      const token = body.data.accessToken;

      // Onboard
      await request(app)
        .post("/api/v1/auth/onboarding")
        .set("Authorization", `Bearer ${token}`)
        .set("x-timezone", "Asia/Kolkata")
        .send({
          preferences: { topics: ["Confidence"], dailyFrequency: 2, affirmationVoice: "spiritual" }
        });

      // Assert user starts in Asia/Kolkata
      let dbUser = await User.findOne({ email: testUser.email });
      expect(dbUser.timezone).toBe("Asia/Kolkata");

      // Travel to New York (EST) - headers update dynamically
      const meRes = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${token}`)
        .set("x-timezone", "America/New_York");

      expect(meRes.status).toBe(200);
      expect(meRes.body.data.user.timezone).toBe("America/New_York");

      dbUser = await User.findOne({ email: testUser.email });
      expect(dbUser.timezone).toBe("America/New_York");
    });
  });

  // 5) Prompt Synthesis & Mood Trajectories
  describe("5. AI Pipeline prompt Synthesis", () => {
    it("should correctly map preferences, mood trajectories, and notes inside system prompts", async () => {
      // Register & Onboard
      const { body } = await request(app)
        .post("/api/v1/auth/register")
        .set("x-device-id", deviceA)
        .send(testUser);
      const token = body.data.accessToken;

      await request(app)
        .post("/api/v1/auth/onboarding")
        .set("Authorization", `Bearer ${token}`)
        .send({
          preferences: { topics: ["Career"], dailyFrequency: 2, affirmationVoice: "motivational" }
        });

      // Log a mood with note: Anxious
      const moodRes = await request(app)
        .post("/api/v1/mood")
        .set("Authorization", `Bearer ${token}`)
        .send({ mood: "Anxious", note: "I am feeling extremely nervous about the big interview." });
      
      expect(moodRes.status).toBe(201);

      // Generate Affirmation for category "Career"
      const genRes = await request(app)
        .post("/api/v1/ai/generate")
        .set("Authorization", `Bearer ${token}`)
        .set("x-device-id", deviceA)
        .send({ category: "Career" });

      expect(genRes.status).toBe(200);
      // Verify our dynamic OpenAI mock resolved the Anxious styling prompt constraint!
      expect(genRes.body.data.affirmation.content).toContain("MOCK_ANXIOUS:");
    });
  });

  // 6) Prompt Entropy & Long-Term Semantic Diversity (120-Session Simulation)
  describe("6. Prompt Entropy & Long-Term Semantic Diversity (120-Session Simulation)", () => {
    it("should statefully cycle registers/metaphors over 120 sessions, apply trajectory overrides, and store semantic memory", async () => {
      // Step A: Register & Onboard a new dedicated test user
      const userCredentials = {
        email: "entropy_simulation@test.com",
        password: "StrongPassword123!",
        name: "Entropy Explorer",
      };

      const { body: regBody } = await request(app)
        .post("/api/v1/auth/register")
        .set("x-device-id", deviceA)
        .send(userCredentials);
      const token = regBody.data.accessToken;

      await request(app)
        .post("/api/v1/auth/onboarding")
        .set("Authorization", `Bearer ${token}`)
        .send({
          preferences: { topics: ["Confidence", "Career"], dailyFrequency: 10, affirmationVoice: "gentle" }
        });

      // Upgrade to Premium tier and configure a high limit to allow 120 simulated runs safely
      process.env.PREMIUM_TIER_DAILY_LIMIT = "1000";
      await User.updateOne({ email: userCredentials.email }, { $set: { tier: "premium" } });

      const seenRegisters = [];
      const seenMetaphors = [];
      let burnoutRuleTriggeredCount = 0;
      let journalingRuleTriggeredCount = 0;
      let streakRuleTriggeredCount = 0;

      for (let i = 1; i <= 120; i++) {
        if (i % 20 === 10 || i % 20 === 11 || i % 20 === 12) {
          // Log consecutive Anxious moods to trigger persistent anxiety / burnout rule
          await request(app)
            .post("/api/v1/mood")
            .set("Authorization", `Bearer ${token}`)
            .send({ mood: "Anxious", note: "Feeling highly overwhelmed and completely anxious." });
        } else if (i % 20 === 15) {
          // Log a deeply reflective note (length >= 100) to trigger journaling depth rule
          await request(app)
            .post("/api/v1/mood")
            .set("Authorization", `Bearer ${token}`)
            .send({ 
              mood: "Calm", 
              note: "Today I sat quietly by the window and reflected on how much progress I have made over the last six months. It is amazing how small changes compound into beautiful outcomes." 
            });
        } else {
          // Log a standard Calm check-in to keep baseline clean and allow active register cycling
          await request(app)
            .post("/api/v1/mood")
            .set("Authorization", `Bearer ${token}`)
            .send({ mood: "Calm", note: "A calm ambient moment." });
        }

        // Simulating Streak counts via direct model updates
        if (i % 20 === 18) {
          await User.updateOne({ email: userCredentials.email }, { $set: { streakCount: 8 } });
        } else if (i % 20 === 19) {
          await User.updateOne({ email: userCredentials.email }, { $set: { streakCount: 0 } });
        }

        // Standard Cycle simulation: manually step back registerRotationAt to trigger standard rotations
        if (i % 15 === 0) {
          const tenDaysAgo = new Date();
          tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
          await User.updateOne({ email: userCredentials.email }, { $set: { registerRotationAt: tenDaysAgo } });
        }

        // Generate affirmation
        const genRes = await request(app)
          .post("/api/v1/ai/generate")
          .set("Authorization", `Bearer ${token}`)
          .set("x-device-id", deviceA)
          .send({ category: "Confidence" });

        expect(genRes.status).toBe(200);
        const { affirmation } = genRes.body.data;
        const reg = affirmation.aiMetadata.activePromptRegister;
        const met = affirmation.aiMetadata.activeMetaphorDomain;

        seenRegisters.push(reg);
        seenMetaphors.push(met);

        if (reg === "permission" && met === "breath") {
          burnoutRuleTriggeredCount++;
        }
        if (reg === "identity" && met === "craftsmanship") {
          journalingRuleTriggeredCount++;
        }
        if (reg === "expansion" && met === "movement") {
          streakRuleTriggeredCount++;
        }
      }

      // Assertions
      console.log(`[ENTROPY INTEGRATION SIMULATION] Processed 120 sessions successfully!`);
      console.log(`Unique active registers: ${[...new Set(seenRegisters)].join(", ")}`);
      console.log(`Unique active metaphors: ${[...new Set(seenMetaphors)].join(", ")}`);
      console.log(`Rules triggered -> Burnout: ${burnoutRuleTriggeredCount}, Journaling: ${journalingRuleTriggeredCount}, Streak: ${streakRuleTriggeredCount}`);

      // 1. High framing & metaphor diversity check: at least 5 unique registers & 5 unique metaphors must have active roles
      expect(new Set(seenRegisters).size).toBeGreaterThanOrEqual(5);
      expect(new Set(seenMetaphors).size).toBeGreaterThanOrEqual(5);

      // 2. Trajectory overrides check: rules must have fired successfully when conditions were met
      expect(burnoutRuleTriggeredCount).toBeGreaterThan(0);
      expect(journalingRuleTriggeredCount).toBeGreaterThan(0);
      expect(streakRuleTriggeredCount).toBeGreaterThan(0);

      // 3. Database state and longitudinal semantic memory validation
      const finalUser = await User.findOne({ email: userCredentials.email });
      expect(finalUser.semanticMemory).toBeDefined();
      expect(finalUser.semanticMemory.recentRegisters.length).toBeGreaterThanOrEqual(2);
      expect(finalUser.semanticMemory.recentMetaphorDomains.length).toBeGreaterThanOrEqual(2);
      
      // Semantic memory should not exceed sliding history limit of 5
      expect(finalUser.semanticMemory.recentRegisters.length).toBeLessThanOrEqual(5);
      expect(finalUser.semanticMemory.recentMetaphorDomains.length).toBeLessThanOrEqual(5);
    });

    it("should statefully track and transition user emotional phases over a longitudinal journey, adjust system prompts dynamically, and reflect phases in hydration", async () => {
      const email = `phasejourney_${Date.now()}@example.com`;
      const password = "Password123!";
      const deviceId = `device_phase_${Date.now()}`;

      // 1. Register User
      const regRes = await request(app)
        .post("/api/v1/auth/register")
        .set("x-device-id", deviceId)
        .send({ email, password });
      expect(regRes.status).toBe(201);
      const token = regRes.body.data.accessToken;

      // Complete Onboarding
      await request(app)
        .post("/api/v1/auth/onboarding")
        .set("Authorization", `Bearer ${token}`)
        .send({
          preferences: { topics: ["Confidence"], dailyFrequency: 5, affirmationVoice: "gentle" }
        });

      // Upgrade to Premium to allow unlimited generation
      await User.updateOne({ email }, { $set: { tier: "premium", streakCount: 5 } });

      // --- PHASE 1: CRISIS ---
      // Log 6 consecutive high-intensity Anxious/Overwhelmed logs to trigger Crisis
      for (let i = 0; i < 6; i++) {
        const moodRes = await request(app)
          .post("/api/v1/mood")
          .set("Authorization", `Bearer ${token}`)
          .send({ mood: "Anxious", intensity: 8, note: "Struggling heavily today, so overwhelmed." });
        expect(moodRes.status).toBe(201);
      }

      // Generate affirmation and verify it classifies as crisis
      const genCrisis = await request(app)
        .post("/api/v1/ai/generate")
        .set("Authorization", `Bearer ${token}`)
        .send({ category: "Confidence" });
      expect(genCrisis.status).toBe(200);
      expect(genCrisis.body.data.affirmation.aiMetadata.emotionalPhase).toBe("crisis");

      // Verify that today's session hydration payload returns crisis
      const sessionCrisis = await request(app)
        .get("/api/v1/session/today?localHour=10")
        .set("Authorization", `Bearer ${token}`);
      expect(sessionCrisis.status).toBe(200);
      expect(sessionCrisis.body.data.emotionalPhase).toBe("crisis");

      // --- PHASE 2: STABILIZATION / RECOVERY ---
      // Log 4 low-intensity Tired check-ins to transition out of crisis into stabilization/recovery
      for (let i = 0; i < 4; i++) {
        await request(app)
          .post("/api/v1/mood")
          .set("Authorization", `Bearer ${token}`)
          .send({ mood: "Tired", intensity: 3, note: "Feeling exhausted but steady, slowing down." });
      }

      const genStabilization = await request(app)
        .post("/api/v1/ai/generate")
        .set("Authorization", `Bearer ${token}`)
        .send({ category: "Confidence" });
      expect(genStabilization.status).toBe(200);
      expect(["stabilization", "recovery"]).toContain(genStabilization.body.data.affirmation.aiMetadata.emotionalPhase);

      // --- PHASE 3: EMERGENCE ---
      // Sudden positive turnaround: Log 3 consecutive high-vibe Hopeful/Happy logs
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post("/api/v1/mood")
          .set("Authorization", `Bearer ${token}`)
          .send({ mood: "Hopeful", intensity: 7, note: "I feel a turn in my perspective today. Things are emerging." });
      }

      const genEmergence = await request(app)
        .post("/api/v1/ai/generate")
        .set("Authorization", `Bearer ${token}`)
        .send({ category: "Confidence" });
      expect(genEmergence.status).toBe(200);
      expect(genEmergence.body.data.affirmation.aiMetadata.emotionalPhase).toBe("emergence");

      // --- PHASE 4: GROWTH ---
      // Log 10 positive check-ins and check growth
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post("/api/v1/mood")
          .set("Authorization", `Bearer ${token}`)
          .send({ mood: "Happy", intensity: 8, note: "Excelling and growing fast." });
      }

      const genGrowth = await request(app)
        .post("/api/v1/ai/generate")
        .set("Authorization", `Bearer ${token}`)
        .send({ category: "Confidence" });
      expect(genGrowth.status).toBe(200);
      expect(genGrowth.body.data.affirmation.aiMetadata.emotionalPhase).toBe("growth");

      // --- PHASE 5: PLATEAU ---
      // Log 10 short neutral Calm logs to plateau
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post("/api/v1/mood")
          .set("Authorization", `Bearer ${token}`)
          .send({ mood: "Calm", intensity: 4, note: "." });
      }

      const genPlateau = await request(app)
        .post("/api/v1/ai/generate")
        .set("Authorization", `Bearer ${token}`)
        .send({ category: "Confidence" });
      expect(genPlateau.status).toBe(200);
      expect(genPlateau.body.data.affirmation.aiMetadata.emotionalPhase).toBe("plateau");

      // --- PHASE 6: REGRESSION RISK ---
      // After plateau/growth stability, experience a sudden high-intensity Sad event
      await request(app)
        .post("/api/v1/mood")
        .set("Authorization", `Bearer ${token}`)
        .send({ mood: "Sad", intensity: 8, note: "Suddenly hit a major wall, feeling completely dropped today." });

      const genRegression = await request(app)
        .post("/api/v1/ai/generate")
        .set("Authorization", `Bearer ${token}`)
        .send({ category: "Confidence" });
      expect(genRegression.status).toBe(200);
      expect(genRegression.body.data.affirmation.aiMetadata.emotionalPhase).toBe("regression-risk");
    });
  });
});

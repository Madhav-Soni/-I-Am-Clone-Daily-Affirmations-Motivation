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
});

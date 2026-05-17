const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../../src/app");
const User = require("../../src/models/User");

// Use an in-memory or test DB URI
beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/affirmation_test");
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

afterEach(async () => {
  await User.deleteMany({});
});

describe("Auth API", () => {
  const validUser = {
    email: "test@example.com",
    password: "Password1",
    name: "Test User",
  };

  // ─── Register ───────────────────────────────────────────────────────────────

  describe("POST /api/v1/auth/register", () => {
    it("should register a new user and return tokens", async () => {
      const res = await request(app).post("/api/v1/auth/register").send(validUser);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.email).toBe(validUser.email);
      expect(res.body.data.user.onboarded).toBe(false);
    });

    it("should reject duplicate email registration", async () => {
      await request(app).post("/api/v1/auth/register").send(validUser);
      const res = await request(app).post("/api/v1/auth/register").send(validUser);

      expect(res.status).toBe(409);
    });

    it("should reject weak passwords", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({ ...validUser, password: "weak" });

      expect(res.status).toBe(422);
    });
  });

  // ─── Login ──────────────────────────────────────────────────────────────────

  describe("POST /api/v1/auth/login", () => {
    beforeEach(async () => {
      await request(app).post("/api/v1/auth/register").send(validUser);
    });

    it("should login with valid credentials", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: validUser.email, password: validUser.password });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it("should reject invalid password", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: validUser.email, password: "WrongPass1" });

      expect(res.status).toBe(401);
    });
  });

  // ─── Protected Routes ────────────────────────────────────────────────────────

  describe("GET /api/v1/auth/me", () => {
    it("should return user profile with valid token", async () => {
      const { body } = await request(app).post("/api/v1/auth/register").send(validUser);
      const token = body.data.accessToken;

      const res = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe(validUser.email);
    });

    it("should reject requests without a token", async () => {
      const res = await request(app).get("/api/v1/auth/me");
      expect(res.status).toBe(401);
    });
  });
});

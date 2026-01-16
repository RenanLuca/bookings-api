import { describe, it, expect, afterEach } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import { User, Room, AuthToken } from "../../src/models/index.js";

describe("Rooms Validation", () => {
  const testPassword = "TestPassword123!";
  const createdUserIds: number[] = [];
  const createdRoomIds: number[] = [];

  const createAdmin = async (email: string) => {
    const passwordHash = bcrypt.hashSync(testPassword, 10);
    const user = await User.create({
      name: "Admin User",
      email,
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE"
    });
    createdUserIds.push(user.id);

    const loginResponse = await request(app)
      .post("/auth/login")
      .send({ email, password: testPassword });

    return { user, token: loginResponse.body.token as string };
  };

  afterEach(async () => {
    await Room.destroy({ where: { id: createdRoomIds }, force: true });

    for (const userId of createdUserIds) {
      await AuthToken.destroy({ where: { userId }, force: true });
    }

    await User.destroy({ where: { id: createdUserIds }, force: true });

    createdUserIds.length = 0;
    createdRoomIds.length = 0;
  });

  describe("POST /rooms - Time validation", () => {
    it("should return 400 when startTime equals endTime", async () => {
      const admin = await createAdmin("admin-time-equal@test.com");

      const response = await request(app)
        .post("/rooms")
        .set("Authorization", `Bearer ${admin.token}`)
        .send({
          name: "Sala Teste",
          startTime: "08:00",
          endTime: "08:00",
          slotDurationMinutes: 30
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("code", "VALIDATION_ERROR");
    });

    it("should return 400 when startTime is greater than endTime", async () => {
      const admin = await createAdmin("admin-time-greater@test.com");

      const response = await request(app)
        .post("/rooms")
        .set("Authorization", `Bearer ${admin.token}`)
        .send({
          name: "Sala Teste",
          startTime: "18:00",
          endTime: "08:00",
          slotDurationMinutes: 30
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("code", "VALIDATION_ERROR");
    });
  });

  describe("POST /rooms - Slot duration validation", () => {
    it("should return 400 when slotDurationMinutes is 0", async () => {
      const admin = await createAdmin("admin-slot-zero@test.com");

      const response = await request(app)
        .post("/rooms")
        .set("Authorization", `Bearer ${admin.token}`)
        .send({
          name: "Sala Teste",
          startTime: "08:00",
          endTime: "18:00",
          slotDurationMinutes: 0
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("code", "VALIDATION_ERROR");
    });

    it("should return 400 when slotDurationMinutes is negative", async () => {
      const admin = await createAdmin("admin-slot-negative@test.com");

      const response = await request(app)
        .post("/rooms")
        .set("Authorization", `Bearer ${admin.token}`)
        .send({
          name: "Sala Teste",
          startTime: "08:00",
          endTime: "18:00",
          slotDurationMinutes: -15
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("code", "VALIDATION_ERROR");
    });
  });

  describe("POST /rooms - Time format validation", () => {
    it("should return 400 when startTime has invalid format", async () => {
      const admin = await createAdmin("admin-start-invalid@test.com");

      const response = await request(app)
        .post("/rooms")
        .set("Authorization", `Bearer ${admin.token}`)
        .send({
          name: "Sala Teste",
          startTime: "invalid",
          endTime: "18:00",
          slotDurationMinutes: 30
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("code", "VALIDATION_ERROR");
    });

    it("should return 400 when endTime has invalid format", async () => {
      const admin = await createAdmin("admin-end-invalid@test.com");

      const response = await request(app)
        .post("/rooms")
        .set("Authorization", `Bearer ${admin.token}`)
        .send({
          name: "Sala Teste",
          startTime: "08:00",
          endTime: "25:00",
          slotDurationMinutes: 30
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("code", "VALIDATION_ERROR");
    });

    it("should return 400 when startTime has out-of-range hours", async () => {
      const admin = await createAdmin("admin-start-range@test.com");

      const response = await request(app)
        .post("/rooms")
        .set("Authorization", `Bearer ${admin.token}`)
        .send({
          name: "Sala Teste",
          startTime: "24:00",
          endTime: "18:00",
          slotDurationMinutes: 30
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("code", "VALIDATION_ERROR");
    });

    it("should return 400 when endTime has out-of-range minutes", async () => {
      const admin = await createAdmin("admin-end-minutes@test.com");

      const response = await request(app)
        .post("/rooms")
        .set("Authorization", `Bearer ${admin.token}`)
        .send({
          name: "Sala Teste",
          startTime: "08:00",
          endTime: "18:60",
          slotDurationMinutes: 30
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("code", "VALIDATION_ERROR");
    });
  });

  describe("PATCH /rooms/:id - Update time validation", () => {
    it("should return 400 when updating to startTime >= endTime", async () => {
      const admin = await createAdmin("admin-update-time@test.com");

      const createResponse = await request(app)
        .post("/rooms")
        .set("Authorization", `Bearer ${admin.token}`)
        .send({
          name: "Sala Para Update",
          startTime: "08:00",
          endTime: "18:00",
          slotDurationMinutes: 30
        });

      expect(createResponse.status).toBe(201);
      createdRoomIds.push(createResponse.body.id);

      const updateResponse = await request(app)
        .patch(`/rooms/${createResponse.body.id}`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({
          startTime: "20:00"
        });

      expect(updateResponse.status).toBe(400);
      expect(updateResponse.body).toHaveProperty("code", "VALIDATION_ERROR");
    });

    it("should return 400 when updating endTime to be before startTime", async () => {
      const admin = await createAdmin("admin-update-end@test.com");

      const createResponse = await request(app)
        .post("/rooms")
        .set("Authorization", `Bearer ${admin.token}`)
        .send({
          name: "Sala Para Update End",
          startTime: "08:00",
          endTime: "18:00",
          slotDurationMinutes: 30
        });

      expect(createResponse.status).toBe(201);
      createdRoomIds.push(createResponse.body.id);

      const updateResponse = await request(app)
        .patch(`/rooms/${createResponse.body.id}`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({
          endTime: "07:00"
        });

      expect(updateResponse.status).toBe(400);
      expect(updateResponse.body).toHaveProperty("code", "VALIDATION_ERROR");
    });
  });
});

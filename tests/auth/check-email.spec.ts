import { describe, it, expect, afterEach } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import { User, AuthToken } from "../../src/models/index.js";

describe("POST /auth/check-email", () => {
  const testPassword = "TestPassword123!";
  const createdUserIds: number[] = [];

  const createUser = async (email: string, status: "ACTIVE" | "INACTIVE") => {
    const passwordHash = bcrypt.hashSync(testPassword, 10);
    const user = await User.create({
      name: "Check Email User",
      email,
      passwordHash,
      role: "CUSTOMER",
      status
    });
    createdUserIds.push(user.id);
    return user;
  };

  afterEach(async () => {
    for (const userId of createdUserIds) {
      await AuthToken.destroy({ where: { userId }, force: true });
    }
    await User.destroy({ where: { id: createdUserIds }, force: true });
    createdUserIds.length = 0;
  });

  describe("Email existence check", () => {
    it("should return exists=false and canLogin=false for non-existent email", async () => {
      const response = await request(app)
        .post("/auth/check-email")
        .send({ email: "nonexistent@test.com" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        exists: false,
        canLogin: false
      });
    });

    it("should return exists=true and canLogin=true for active user", async () => {
      await createUser("active-user@test.com", "ACTIVE");

      const response = await request(app)
        .post("/auth/check-email")
        .send({ email: "active-user@test.com" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        exists: true,
        canLogin: true
      });
    });

    it("should return exists=true and canLogin=false for inactive user", async () => {
      await createUser("inactive-user@test.com", "INACTIVE");

      const response = await request(app)
        .post("/auth/check-email")
        .send({ email: "inactive-user@test.com" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        exists: true,
        canLogin: false
      });
    });
  });

  describe("Validation errors", () => {
    it("should return 400 when email is empty", async () => {
      const response = await request(app)
        .post("/auth/check-email")
        .send({ email: "" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("code", "VALIDATION_ERROR");
    });

    it("should return 400 when email is missing", async () => {
      const response = await request(app)
        .post("/auth/check-email")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("code", "VALIDATION_ERROR");
    });

    it("should return 400 when email format is invalid", async () => {
      const response = await request(app)
        .post("/auth/check-email")
        .send({ email: "invalid-email" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("code", "VALIDATION_ERROR");
    });

    it("should return 400 when email format is incomplete", async () => {
      const response = await request(app)
        .post("/auth/check-email")
        .send({ email: "test@" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("code", "VALIDATION_ERROR");
    });
  });
});

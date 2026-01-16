import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import { User, AuthToken } from "../../src/models/index.js";

describe("POST /auth/login", () => {
  const testEmail = "test-login@example.com";
  const testPassword = "TestPassword123!";
  let createdUserId: number | null = null;

  beforeEach(async () => {
    const passwordHash = bcrypt.hashSync(testPassword, 10);
    const user = await User.create({
      name: "Test User",
      email: testEmail,
      passwordHash,
      role: "CUSTOMER",
      status: "ACTIVE"
    });
    createdUserId = user.id;
  });

  afterEach(async () => {
    if (createdUserId) {
      await AuthToken.destroy({ where: { userId: createdUserId }, force: true });
      await User.destroy({ where: { id: createdUserId }, force: true });
      createdUserId = null;
    }
  });

  it("should return 200 and token when credentials are valid", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({ email: testEmail, password: testPassword });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token");
    expect(typeof response.body.token).toBe("string");
    expect(response.body).toHaveProperty("user");
    expect(response.body.user).toHaveProperty("id");
    expect(response.body.user).toHaveProperty("email", testEmail);
    expect(response.body.user).toHaveProperty("role");
  });

  it("should return 401 when password is invalid", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({ email: testEmail, password: "WrongPassword123!" });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("code", "AUTH_INVALID_CREDENTIALS");
  });

  it("should return 403 when user is inactive", async () => {
    const inactiveEmail = "inactive-user@example.com";
    const passwordHash = bcrypt.hashSync(testPassword, 10);
    const inactiveUser = await User.create({
      name: "Inactive User",
      email: inactiveEmail,
      passwordHash,
      role: "CUSTOMER",
      status: "INACTIVE"
    });

    const response = await request(app)
      .post("/auth/login")
      .send({ email: inactiveEmail, password: testPassword });

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty("code", "AUTH_USER_INACTIVE");

    await User.destroy({ where: { id: inactiveUser.id }, force: true });
  });
});

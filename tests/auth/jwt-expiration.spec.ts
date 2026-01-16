import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { app } from "../../src/app.js";
import { User, AuthToken, Customer, CustomerModulePermission } from "../../src/models/index.js";

describe("JWT Expiration", () => {
  const testEmail = "jwt-expiration@test.com";
  const testPassword = "TestPassword123!";
  let createdUserId: number | null = null;
  let createdCustomerId: number | null = null;

  beforeEach(async () => {
    const passwordHash = bcrypt.hashSync(testPassword, 10);
    const user = await User.create({
      name: "JWT Test User",
      email: testEmail,
      passwordHash,
      role: "CUSTOMER",
      status: "ACTIVE"
    });
    createdUserId = user.id;

    const customer = await Customer.create({
      userId: user.id,
      zipCode: "12345-678",
      street: "Test Street",
      number: "100",
      complement: null,
      neighborhood: "Test Neighborhood",
      city: "Test City",
      state: "Test State"
    });
    createdCustomerId = customer.id;

    await CustomerModulePermission.create({
      customerId: customer.id,
      module: "LOGS",
      canView: true
    });
  });

  afterEach(async () => {
    if (createdCustomerId) {
      await CustomerModulePermission.destroy({
        where: { customerId: createdCustomerId },
        force: true
      });
    }
    if (createdUserId) {
      await AuthToken.destroy({ where: { userId: createdUserId }, force: true });
      await Customer.destroy({ where: { userId: createdUserId }, force: true });
      await User.destroy({ where: { id: createdUserId }, force: true });
      createdUserId = null;
      createdCustomerId = null;
    }
  });

  it("should return 401 when token is expired", async () => {
    const loginResponse = await request(app)
      .post("/auth/login")
      .send({ email: testEmail, password: testPassword });

    expect(loginResponse.status).toBe(200);
    const validToken = loginResponse.body.token;

    const expiredPayload = {
      userId: createdUserId,
      role: "CUSTOMER",
      email: testEmail
    };
    const expiredToken = jwt.sign(expiredPayload, process.env.JWT_SECRET as string, {
      expiresIn: "-1s"
    });

    const response = await request(app)
      .get("/logs/me")
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("code", "AUTH_TOKEN_INVALID");
  });

  it("should return 200 when token is still valid", async () => {
    const loginResponse = await request(app)
      .post("/auth/login")
      .send({ email: testEmail, password: testPassword });

    expect(loginResponse.status).toBe(200);
    const validToken = loginResponse.body.token;

    const response = await request(app)
      .get("/logs/me")
      .set("Authorization", `Bearer ${validToken}`);

    expect(response.status).toBe(200);
  });
});

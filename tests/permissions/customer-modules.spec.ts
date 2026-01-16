import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import {
  User,
  Customer,
  AuthToken,
  CustomerModulePermission
} from "../../src/models/index.js";

describe("Customer Module Permissions", () => {
  const testEmail = "test-permissions@example.com";
  const testPassword = "TestPassword123!";
  let createdUserId: number | null = null;
  let createdCustomerId: number | null = null;
  let authToken: string | null = null;

  const createCustomerWithPermission = async (
    module: "LOGS" | "APPOINTMENTS",
    canView: boolean
  ) => {
    const passwordHash = bcrypt.hashSync(testPassword, 10);
    const user = await User.create({
      name: "Test Permission User",
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
      module,
      canView
    });

    const loginResponse = await request(app)
      .post("/auth/login")
      .send({ email: testEmail, password: testPassword });

    authToken = loginResponse.body.token;
  };

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
    }
    createdUserId = null;
    createdCustomerId = null;
    authToken = null;
  });

  describe("LOGS module", () => {
    it("should return 403 when customer is blocked for LOGS", async () => {
      await createCustomerWithPermission("LOGS", false);

      const response = await request(app)
        .get("/logs/me")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("code", "MODULE_ACCESS_FORBIDDEN");
    });

    it("should return 200 when customer is allowed for LOGS", async () => {
      await createCustomerWithPermission("LOGS", true);

      const response = await request(app)
        .get("/logs/me")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe("APPOINTMENTS module", () => {
    it("should return 403 when customer is blocked for APPOINTMENTS", async () => {
      await createCustomerWithPermission("APPOINTMENTS", false);

      const response = await request(app)
        .get("/appointments/me")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("code", "MODULE_ACCESS_FORBIDDEN");
    });

    it("should return 200 when customer is allowed for APPOINTMENTS", async () => {
      await createCustomerWithPermission("APPOINTMENTS", true);

      const response = await request(app)
        .get("/appointments/me")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });
  });
});

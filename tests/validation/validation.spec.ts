import { describe, it, expect, afterEach } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import {
  User,
  Customer,
  AuthToken,
  CustomerModulePermission
} from "../../src/models/index.js";

describe("Validation Middleware - 400 responses", () => {
  const testPassword = "TestPassword123!";
  const createdUserIds: number[] = [];
  const createdCustomerIds: number[] = [];

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

  const createCustomerWithUser = async (email: string) => {
    const passwordHash = bcrypt.hashSync(testPassword, 10);
    const user = await User.create({
      name: "Test Customer",
      email,
      passwordHash,
      role: "CUSTOMER",
      status: "ACTIVE"
    });
    createdUserIds.push(user.id);

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
    createdCustomerIds.push(customer.id);

    await CustomerModulePermission.create({
      customerId: customer.id,
      module: "APPOINTMENTS",
      canView: true
    });

    const loginResponse = await request(app)
      .post("/auth/login")
      .send({ email, password: testPassword });

    return { user, customer, token: loginResponse.body.token as string };
  };

  afterEach(async () => {
    for (const customerId of createdCustomerIds) {
      await CustomerModulePermission.destroy({
        where: { customerId },
        force: true
      });
    }

    for (const userId of createdUserIds) {
      await AuthToken.destroy({ where: { userId }, force: true });
      await Customer.destroy({ where: { userId }, force: true });
    }

    await User.destroy({ where: { id: createdUserIds }, force: true });

    createdUserIds.length = 0;
    createdCustomerIds.length = 0;
  });

  describe("POST /auth/login - Invalid email validation", () => {
    it("should return 400 with validation code when email is invalid", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({ email: "abc", password: "123" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("code", "VALIDATION_ERROR");
    });

    it("should return 400 when email is empty", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({ email: "", password: "123" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("code", "VALIDATION_ERROR");
    });

    it("should return 400 when password is missing", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({ email: "valid@email.com" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("code", "VALIDATION_ERROR");
    });
  });

  describe("POST /auth/check-email - Empty email validation", () => {
    it("should return 400 with validation code when email is empty", async () => {
      const response = await request(app)
        .post("/auth/check-email")
        .send({ email: "" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("code", "VALIDATION_ERROR");
    });

    it("should return 400 when email format is invalid", async () => {
      const response = await request(app)
        .post("/auth/check-email")
        .send({ email: "not-an-email" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("code", "VALIDATION_ERROR");
    });
  });

  describe("GET /customers - Invalid query params validation", () => {
    it("should return 400 when page is not a valid integer", async () => {
      const admin = await createAdmin("admin-validation-page@test.com");

      const response = await request(app)
        .get("/customers")
        .query({ page: "abc" })
        .set("Authorization", `Bearer ${admin.token}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("code", "VALIDATION_ERROR");
    });

    it("should return 400 when pageSize is not a valid integer", async () => {
      const admin = await createAdmin("admin-validation-pagesize@test.com");

      const response = await request(app)
        .get("/customers")
        .query({ pageSize: "invalid" })
        .set("Authorization", `Bearer ${admin.token}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("code", "VALIDATION_ERROR");
    });

    it("should return 400 when sort is not asc or desc", async () => {
      const admin = await createAdmin("admin-validation-sort@test.com");

      const response = await request(app)
        .get("/customers")
        .query({ sort: "invalid" })
        .set("Authorization", `Bearer ${admin.token}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("code", "VALIDATION_ERROR");
    });

    it("should return 400 when page is zero", async () => {
      const admin = await createAdmin("admin-validation-page-zero@test.com");

      const response = await request(app)
        .get("/customers")
        .query({ page: 0 })
        .set("Authorization", `Bearer ${admin.token}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("code", "VALIDATION_ERROR");
    });
  });

  describe("PATCH /customers/:id/permissions - Invalid payload validation", () => {
    it("should return 400 when modules is empty array", async () => {
      const admin = await createAdmin("admin-perm-empty@test.com");
      const customer = await createCustomerWithUser("customer-perm-empty@test.com");

      const response = await request(app)
        .patch(`/customers/${customer.customer.id}/permissions`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ modules: [] });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("code", "VALIDATION_ERROR");
    });

    it("should return 400 when module name is invalid", async () => {
      const admin = await createAdmin("admin-perm-invalid@test.com");
      const customer = await createCustomerWithUser("customer-perm-invalid@test.com");

      const response = await request(app)
        .patch(`/customers/${customer.customer.id}/permissions`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({
          modules: [{ module: "INVALID_MODULE", canView: true }]
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("code", "VALIDATION_ERROR");
    });

    it("should return 400 when canView is not boolean", async () => {
      const admin = await createAdmin("admin-perm-canview@test.com");
      const customer = await createCustomerWithUser("customer-perm-canview@test.com");

      const response = await request(app)
        .patch(`/customers/${customer.customer.id}/permissions`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({
          modules: [{ module: "APPOINTMENTS", canView: "yes" }]
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("code", "VALIDATION_ERROR");
    });

    it("should return 400 when module is missing in array item", async () => {
      const admin = await createAdmin("admin-perm-missing@test.com");
      const customer = await createCustomerWithUser("customer-perm-missing@test.com");

      const response = await request(app)
        .patch(`/customers/${customer.customer.id}/permissions`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({
          modules: [{ canView: true }]
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("code", "VALIDATION_ERROR");
    });

    it("should return 400 when id param is invalid", async () => {
      const admin = await createAdmin("admin-perm-id@test.com");

      const response = await request(app)
        .patch("/customers/invalid/permissions")
        .set("Authorization", `Bearer ${admin.token}`)
        .send({
          modules: [{ module: "APPOINTMENTS", canView: true }]
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("code", "VALIDATION_ERROR");
    });
  });
});

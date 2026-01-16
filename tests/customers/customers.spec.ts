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

describe("Customers Endpoints", () => {
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

  const createCustomerWithUser = async (
    email: string,
    name: string = "Test Customer"
  ) => {
    const passwordHash = bcrypt.hashSync(testPassword, 10);
    const user = await User.create({
      name,
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

    await CustomerModulePermission.create({
      customerId: customer.id,
      module: "LOGS",
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

  describe("GET /customers - Admin lists customers with pagination and filter", () => {
    it("should return customers filtered by name with pagination and sort asc", async () => {
      const admin = await createAdmin("admin-list@test.com");

      await createCustomerWithUser("ana@test.com", "Ana Silva");
      await createCustomerWithUser("bruno@test.com", "Bruno Costa");
      await createCustomerWithUser("carlos@test.com", "Carlos Souza");

      const response = await request(app)
        .get("/customers")
        .query({ name: "br", page: 1, pageSize: 10, sort: "asc" })
        .set("Authorization", `Bearer ${admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(response.body).toHaveProperty("meta");
      expect(response.body.meta.sort).toBe("asc");

      const names = response.body.data.map(
        (item: { user: { name: string } }) => item.user.name.toLowerCase()
      );
      const filteredNames = names.filter((n: string) => n.includes("br"));
      expect(filteredNames.length).toBe(names.length);
      expect(names.length).toBeGreaterThan(0);
    });

    it("should return customers sorted by createdAt desc", async () => {
      const admin = await createAdmin("admin-sort@test.com");

      await createCustomerWithUser("first@test.com", "First User");
      await createCustomerWithUser("second@test.com", "Second User");

      const response = await request(app)
        .get("/customers")
        .query({ page: 1, pageSize: 10, sort: "desc" })
        .set("Authorization", `Bearer ${admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body.meta.sort).toBe("desc");

      const data = response.body.data;
      if (data.length >= 2) {
        const firstCreatedAt = new Date(data[0].user.createdAt || 0).getTime();
        const secondCreatedAt = new Date(data[1].user.createdAt || 0).getTime();
        expect(firstCreatedAt).toBeGreaterThanOrEqual(secondCreatedAt);
      }
    });
  });

  describe("PATCH /customers/me - Customer updates profile", () => {
    it("should update user and customer fields successfully", async () => {
      const customer = await createCustomerWithUser(
        "update-profile@test.com",
        "Original Name"
      );

      const response = await request(app)
        .patch("/customers/me")
        .set("Authorization", `Bearer ${customer.token}`)
        .send({
          user: {
            name: "Updated Name"
          },
          customer: {
            city: "New City",
            state: "New State",
            zipCode: "99999-999"
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.user.name).toBe("Updated Name");
      expect(response.body.customer.city).toBe("New City");
      expect(response.body.customer.state).toBe("New State");
      expect(response.body.customer.zipCode).toBe("99999-999");
    });

    it("should update email successfully when unique", async () => {
      const customer = await createCustomerWithUser("old-email@test.com");

      const response = await request(app)
        .patch("/customers/me")
        .set("Authorization", `Bearer ${customer.token}`)
        .send({
          user: {
            email: "new-unique-email@test.com"
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe("new-unique-email@test.com");
    });
  });

  describe("PATCH /customers/me - Email conflict", () => {
    it("should return 409 when updating to an existing email", async () => {
      await createCustomerWithUser("existing-email@test.com");
      const customer = await createCustomerWithUser("my-email@test.com");

      const response = await request(app)
        .patch("/customers/me")
        .set("Authorization", `Bearer ${customer.token}`)
        .send({
          user: {
            email: "existing-email@test.com"
          }
        });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty("code", "USER_EMAIL_ALREADY_EXISTS");
    });
  });

  describe("PATCH /customers/me - Validation errors", () => {
    it("should return 400 when email format is invalid", async () => {
      const customer = await createCustomerWithUser("valid-email@test.com");

      const response = await request(app)
        .patch("/customers/me")
        .set("Authorization", `Bearer ${customer.token}`)
        .send({
          user: {
            email: "invalid-email-format"
          }
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("code", "VALIDATION_ERROR");
    });
  });

  describe("Customer cannot access admin routes", () => {
    it("should return 403 when customer tries to list all customers", async () => {
      const customer = await createCustomerWithUser("customer-no-admin@test.com");

      const response = await request(app)
        .get("/customers")
        .set("Authorization", `Bearer ${customer.token}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("code", "FORBIDDEN");
    });

    it("should return 403 when customer tries to get customer by id", async () => {
      const customer = await createCustomerWithUser("customer-no-get@test.com");

      const response = await request(app)
        .get("/customers/1")
        .set("Authorization", `Bearer ${customer.token}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("code", "FORBIDDEN");
    });

    it("should return 403 when customer tries to delete a customer", async () => {
      const customer = await createCustomerWithUser("customer-no-delete@test.com");

      const response = await request(app)
        .delete("/customers/1")
        .set("Authorization", `Bearer ${customer.token}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("code", "FORBIDDEN");
    });
  });
});

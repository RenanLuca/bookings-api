import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import {
  User,
  Customer,
  AuthToken,
  ActivityLog,
  CustomerModulePermission
} from "../../src/models/index.js";
import type { ActivityLogModule } from "../../src/models/activity-log.model.js";

describe("Logs List Endpoints", () => {
  const testPassword = "TestPassword123!";
  const createdUserIds: number[] = [];
  const createdCustomerIds: number[] = [];
  const createdLogIds: number[] = [];

  const createCustomerWithPermission = async (email: string) => {
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
      module: "LOGS",
      canView: true
    });

    const loginResponse = await request(app)
      .post("/auth/login")
      .send({ email, password: testPassword });

    return { user, customer, token: loginResponse.body.token as string };
  };

  const createAdmin = async (email: string) => {
    const passwordHash = bcrypt.hashSync(testPassword, 10);
    const user = await User.create({
      name: "Test Admin",
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

  const createLogForUser = async (
    userId: number,
    module: ActivityLogModule,
    description: string
  ) => {
    const log = await ActivityLog.create({
      userId,
      module,
      activityType: "TEST",
      description
    });
    createdLogIds.push(log.id);
    return log;
  };

  afterEach(async () => {
    await ActivityLog.destroy({
      where: { id: createdLogIds },
      force: true
    });

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
    createdLogIds.length = 0;
  });

  describe("GET /logs/me - Customer lists own logs", () => {
    it("should return only logs belonging to the authenticated customer", async () => {
      const customerA = await createCustomerWithPermission("customer-a@test.com");
      const customerB = await createCustomerWithPermission("customer-b@test.com");

      const logA1 = await createLogForUser(customerA.user.id, "ACCOUNT", "Log A1");
      const logA2 = await createLogForUser(customerA.user.id, "ACCOUNT", "Log A2");
      await createLogForUser(customerB.user.id, "ACCOUNT", "Log B1");

      const response = await request(app)
        .get("/logs/me")
        .set("Authorization", `Bearer ${customerA.token}`);

      expect(response.status).toBe(200);

      const testLogIds = [logA1.id, logA2.id];
      const returnedTestLogs = response.body.data.filter(
        (log: { id: number }) => testLogIds.includes(log.id)
      );
      expect(returnedTestLogs).toHaveLength(2);

      const hasCustomerBLog = response.body.data.some(
        (log: { description: string }) => log.description === "Log B1"
      );
      expect(hasCustomerBLog).toBe(false);
    });
  });

  describe("GET /logs - Customer access restriction", () => {
    it("should return 403 when customer tries to access global logs", async () => {
      const customer = await createCustomerWithPermission("customer@test.com");

      const response = await request(app)
        .get("/logs")
        .set("Authorization", `Bearer ${customer.token}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("code", "FORBIDDEN");
    });
  });

  describe("GET /logs - Admin lists all logs", () => {
    it("should return logs from all users", async () => {
      const admin = await createAdmin("admin@test.com");
      const customerA = await createCustomerWithPermission("customer-a@test.com");
      const customerB = await createCustomerWithPermission("customer-b@test.com");

      await createLogForUser(customerA.user.id, "ACCOUNT", "Log A");
      await createLogForUser(customerB.user.id, "ACCOUNT", "Log B");

      const response = await request(app)
        .get("/logs")
        .set("Authorization", `Bearer ${admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);

      const descriptions = response.body.data.map((log: { description: string }) => log.description);
      expect(descriptions).toContain("Log A");
      expect(descriptions).toContain("Log B");
    });
  });

  describe("GET /logs?module - Admin filter by module", () => {
    it("should return only logs matching the specified module", async () => {
      const admin = await createAdmin("admin@test.com");
      const customer = await createCustomerWithPermission("customer@test.com");

      await createLogForUser(customer.user.id, "ACCOUNT", "Account Log 1");
      await createLogForUser(customer.user.id, "ACCOUNT", "Account Log 2");
      await createLogForUser(customer.user.id, "APPOINTMENT", "Appointment Log");

      const response = await request(app)
        .get("/logs?module=ACCOUNT")
        .set("Authorization", `Bearer ${admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every((log: { module: string }) =>
        log.module === "ACCOUNT"
      )).toBe(true);
    });
  });

  describe("GET /logs?sort - Admin sort by createdAt", () => {
    it("should return logs in reversed order between asc and desc", async () => {
      const admin = await createAdmin("admin@test.com");
      const customer = await createCustomerWithPermission("customer@test.com");

      const log1 = await createLogForUser(customer.user.id, "ACCOUNT", "First Log");
      await new Promise((resolve) => setTimeout(resolve, 50));
      const log2 = await createLogForUser(customer.user.id, "ACCOUNT", "Second Log");
      await new Promise((resolve) => setTimeout(resolve, 50));
      const log3 = await createLogForUser(customer.user.id, "ACCOUNT", "Third Log");

      const testLogIds = [log1.id, log2.id, log3.id];

      const ascResponse = await request(app)
        .get(`/logs?sort=asc&userId=${customer.user.id}`)
        .set("Authorization", `Bearer ${admin.token}`);

      const descResponse = await request(app)
        .get(`/logs?sort=desc&userId=${customer.user.id}`)
        .set("Authorization", `Bearer ${admin.token}`);

      expect(ascResponse.status).toBe(200);
      expect(descResponse.status).toBe(200);

      const ascIds = ascResponse.body.data
        .filter((log: { id: number }) => testLogIds.includes(log.id))
        .map((log: { id: number }) => log.id);
      const descIds = descResponse.body.data
        .filter((log: { id: number }) => testLogIds.includes(log.id))
        .map((log: { id: number }) => log.id);

      expect(ascIds.length).toBe(3);
      expect(descIds.length).toBe(3);
      expect(ascIds).toEqual([log1.id, log2.id, log3.id]);
      expect(descIds).toEqual([log3.id, log2.id, log1.id]);
    });
  });
});

import { describe, it, expect, afterEach } from "vitest";
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

describe("Logs Pagination and Sorting", () => {
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

  const createLogForUser = async (userId: number, description: string) => {
    const log = await ActivityLog.create({
      userId,
      module: "ACCOUNT",
      activityType: "TEST",
      description
    });
    createdLogIds.push(log.id);
    return log;
  };

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

  describe("GET /logs/me - Pagination", () => {
    it("should return only pageSize items on first page", async () => {
      const customer = await createCustomerWithPermission("pagination-page1@test.com");

      await createLogForUser(customer.user.id, "Log 1");
      await createLogForUser(customer.user.id, "Log 2");
      await createLogForUser(customer.user.id, "Log 3");
      await createLogForUser(customer.user.id, "Log 4");
      await createLogForUser(customer.user.id, "Log 5");

      const response = await request(app)
        .get("/logs/me")
        .query({ page: 1, pageSize: 2 })
        .set("Authorization", `Bearer ${customer.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data.length).toBeLessThanOrEqual(2);
    });

    it("should return remaining items on second page", async () => {
      const customer = await createCustomerWithPermission("pagination-page2@test.com");

      await createLogForUser(customer.user.id, "Log A");
      await createLogForUser(customer.user.id, "Log B");
      await createLogForUser(customer.user.id, "Log C");
      await createLogForUser(customer.user.id, "Log D");
      await createLogForUser(customer.user.id, "Log E");

      const page1Response = await request(app)
        .get("/logs/me")
        .query({ page: 1, pageSize: 2 })
        .set("Authorization", `Bearer ${customer.token}`);

      const page2Response = await request(app)
        .get("/logs/me")
        .query({ page: 2, pageSize: 2 })
        .set("Authorization", `Bearer ${customer.token}`);

      expect(page1Response.status).toBe(200);
      expect(page2Response.status).toBe(200);

      const page1Ids = page1Response.body.data.map((log: { id: number }) => log.id);
      const page2Ids = page2Response.body.data.map((log: { id: number }) => log.id);

      const hasOverlap = page1Ids.some((id: number) => page2Ids.includes(id));
      expect(hasOverlap).toBe(false);
    });

    it("should return consistent total across pages when meta.total exists", async () => {
      const customer = await createCustomerWithPermission("pagination-total@test.com");

      await createLogForUser(customer.user.id, "Total Log 1");
      await createLogForUser(customer.user.id, "Total Log 2");
      await createLogForUser(customer.user.id, "Total Log 3");

      const page1Response = await request(app)
        .get("/logs/me")
        .query({ page: 1, pageSize: 2 })
        .set("Authorization", `Bearer ${customer.token}`);

      const page2Response = await request(app)
        .get("/logs/me")
        .query({ page: 2, pageSize: 2 })
        .set("Authorization", `Bearer ${customer.token}`);

      expect(page1Response.status).toBe(200);
      expect(page2Response.status).toBe(200);

      if (page1Response.body.meta?.total !== undefined && page2Response.body.meta?.total !== undefined) {
        expect(page1Response.body.meta.total).toBe(page2Response.body.meta.total);
      }
    });
  });

  describe("GET /logs/me - Sorting", () => {
    it("should return logs in ascending order when sort=asc", async () => {
      const customer = await createCustomerWithPermission("sort-asc@test.com");

      const log1 = await createLogForUser(customer.user.id, "First Log");
      await delay(50);
      const log2 = await createLogForUser(customer.user.id, "Second Log");
      await delay(50);
      const log3 = await createLogForUser(customer.user.id, "Third Log");

      const response = await request(app)
        .get("/logs/me")
        .query({ sort: "asc" })
        .set("Authorization", `Bearer ${customer.token}`);

      expect(response.status).toBe(200);

      const testLogIds = [log1.id, log2.id, log3.id];
      const returnedLogs = response.body.data.filter(
        (log: { id: number }) => testLogIds.includes(log.id)
      );

      expect(returnedLogs.length).toBe(3);

      const returnedIds = returnedLogs.map((log: { id: number }) => log.id);
      expect(returnedIds).toEqual([log1.id, log2.id, log3.id]);
    });

    it("should return logs in descending order when sort=desc", async () => {
      const customer = await createCustomerWithPermission("sort-desc@test.com");

      const log1 = await createLogForUser(customer.user.id, "First Log Desc");
      await delay(50);
      const log2 = await createLogForUser(customer.user.id, "Second Log Desc");
      await delay(50);
      const log3 = await createLogForUser(customer.user.id, "Third Log Desc");

      const response = await request(app)
        .get("/logs/me")
        .query({ sort: "desc" })
        .set("Authorization", `Bearer ${customer.token}`);

      expect(response.status).toBe(200);

      const testLogIds = [log1.id, log2.id, log3.id];
      const returnedLogs = response.body.data.filter(
        (log: { id: number }) => testLogIds.includes(log.id)
      );

      expect(returnedLogs.length).toBe(3);

      const returnedIds = returnedLogs.map((log: { id: number }) => log.id);
      expect(returnedIds).toEqual([log3.id, log2.id, log1.id]);
    });

    it("should return logs in reversed order between asc and desc", async () => {
      const customer = await createCustomerWithPermission("sort-compare@test.com");

      const log1 = await createLogForUser(customer.user.id, "Compare Log 1");
      await delay(50);
      const log2 = await createLogForUser(customer.user.id, "Compare Log 2");
      await delay(50);
      const log3 = await createLogForUser(customer.user.id, "Compare Log 3");

      const testLogIds = [log1.id, log2.id, log3.id];

      const ascResponse = await request(app)
        .get("/logs/me")
        .query({ sort: "asc" })
        .set("Authorization", `Bearer ${customer.token}`);

      const descResponse = await request(app)
        .get("/logs/me")
        .query({ sort: "desc" })
        .set("Authorization", `Bearer ${customer.token}`);

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
      expect(ascIds).toEqual(descIds.reverse());
    });
  });
});

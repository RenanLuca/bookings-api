import { describe, it, expect, afterEach, beforeEach } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../../src/app.js";
import {
  User,
  Customer,
  Room,
  Appointment,
  AuthToken,
  CustomerModulePermission,
  ActivityLog
} from "../../src/models/index.js";

describe("Appointments Timezone Handling", () => {
  const testPassword = "TestPassword123!";
  const createdUserIds: number[] = [];
  const createdCustomerIds: number[] = [];
  const createdRoomIds: number[] = [];
  const createdAppointmentIds: number[] = [];

  let room: any;
  let customer: { user: any; customer: any; token: string };
  let adminToken: string;

  const createRoom = async (name: string) => {
    const created = await Room.create({
      name,
      startTime: "00:00",
      endTime: "23:59",
      slotDurationMinutes: 60
    });
    createdRoomIds.push(created.id);
    return created;
  };

  const createCustomerWithPermission = async (email: string) => {
    const passwordHash = bcrypt.hashSync(testPassword, 10);
    const user = await User.create({
      name: `Customer ${email.split("@")[0]}`,
      email,
      passwordHash,
      role: "CUSTOMER",
      status: "ACTIVE"
    });
    createdUserIds.push(user.id);

    const customerRecord = await Customer.create({
      userId: user.id,
      zipCode: "12345-678",
      street: "Test Street",
      number: "100",
      complement: null,
      neighborhood: "Test Neighborhood",
      city: "Test City",
      state: "Test State"
    });
    createdCustomerIds.push(customerRecord.id);

    await CustomerModulePermission.create({
      customerId: customerRecord.id,
      module: "APPOINTMENTS",
      canView: true
    });

    const loginResponse = await request(app)
      .post("/auth/login")
      .send({ email, password: testPassword, isAdmin: false });

    return { user, customer: customerRecord, token: loginResponse.body.data.token as string };
  };

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
      .send({ email, password: testPassword, isAdmin: true });

    return loginResponse.body.data.token as string;
  };

  const createAppointmentViaApi = async (
    token: string,
    roomId: number,
    scheduledAt: string
  ) => {
    const response = await request(app)
      .post("/appointments")
      .set("Authorization", `Bearer ${token}`)
      .send({ roomId, scheduledAt });

    if (response.status === 201) {
      createdAppointmentIds.push(response.body.data.id);
    }
    return response;
  };

  beforeEach(async () => {
    const timestamp = Date.now();
    room = await createRoom(`Room Timezone Test ${timestamp}`);
    customer = await createCustomerWithPermission(`customer-tz-${timestamp}@test.com`);
    adminToken = await createAdmin(`admin-tz-${timestamp}@test.com`);
  });

  afterEach(async () => {
    await Appointment.destroy({
      where: { id: createdAppointmentIds },
      force: true
    });

    for (const customerId of createdCustomerIds) {
      await CustomerModulePermission.destroy({
        where: { customerId },
        force: true
      });
    }

    for (const userId of createdUserIds) {
      await ActivityLog.destroy({ where: { userId }, force: true });
      await AuthToken.destroy({ where: { userId }, force: true });
      await Customer.destroy({ where: { userId }, force: true });
    }

    await User.destroy({ where: { id: createdUserIds }, force: true });
    await Room.destroy({ where: { id: createdRoomIds }, force: true });

    createdUserIds.length = 0;
    createdCustomerIds.length = 0;
    createdRoomIds.length = 0;
    createdAppointmentIds.length = 0;
  });

  describe("POST /appointments - Timezone on Creation", () => {
    it("should save scheduledAt in UTC when input has explicit timezone offset", async () => {
      const inputDateTime = "2026-01-24T14:00:00-03:00";

      const response = await createAppointmentViaApi(customer.token, room.id, inputDateTime);

      expect(response.status).toBe(201);

      const dbRecord = await Appointment.findByPk(response.body.data.id);
      expect(dbRecord).not.toBeNull();

      const dbDate = new Date(dbRecord!.scheduledAt);
      const expectedUtc = new Date("2026-01-24T17:00:00.000Z");
      expect(dbDate.getTime()).toBe(expectedUtc.getTime());
    });

    it("should return scheduledAt in UTC format with Z suffix", async () => {
      const inputDateTime = "2026-01-24T14:00:00-03:00";

      const response = await createAppointmentViaApi(customer.token, room.id, inputDateTime);

      expect(response.status).toBe(201);
      expect(response.body.data.scheduledAt).toBe("2026-01-24T17:00:00.000Z");
    });

    it("should correctly convert different timezone offsets to UTC", async () => {
      const inputDateTime = "2026-01-24T10:00:00-03:00";

      const response = await createAppointmentViaApi(customer.token, room.id, inputDateTime);

      expect(response.status).toBe(201);
      expect(response.body.data.scheduledAt).toBe("2026-01-24T13:00:00.000Z");

      const dbRecord = await Appointment.findByPk(response.body.data.id);
      const dbDate = new Date(dbRecord!.scheduledAt);
      expect(dbDate.toISOString()).toBe("2026-01-24T13:00:00.000Z");
    });
  });

  describe("GET /appointments - Timezone on Listing", () => {
    it("should return scheduledAt in UTC format with Z suffix on list", async () => {
      const inputDateTime = "2026-01-25T09:00:00-03:00";
      await createAppointmentViaApi(customer.token, room.id, inputDateTime);

      const response = await request(app)
        .get("/appointments/me")
        .set("Authorization", `Bearer ${customer.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].scheduledAt).toBe("2026-01-25T12:00:00.000Z");
    });

    it("should maintain consistency between creation and listing responses", async () => {
      const inputDateTime = "2026-01-26T16:30:00-03:00";

      const createResponse = await createAppointmentViaApi(customer.token, room.id, inputDateTime);
      expect(createResponse.status).toBe(201);

      const listResponse = await request(app)
        .get("/appointments/me")
        .set("Authorization", `Bearer ${customer.token}`);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body.data[0].scheduledAt).toBe(createResponse.body.data.scheduledAt);
    });
  });

  describe("GET /appointments - Date Filters with Timezone", () => {
    const filterTestAppointmentIds: number[] = [];

    beforeEach(async () => {
      const a1 = await Appointment.create({
        roomId: room.id,
        customerId: customer.customer.id,
        scheduledAt: new Date("2026-01-24T02:59:59.000Z"),
        status: "PENDING"
      });
      filterTestAppointmentIds.push(a1.id);

      const a2 = await Appointment.create({
        roomId: room.id,
        customerId: customer.customer.id,
        scheduledAt: new Date("2026-01-24T03:00:00.000Z"),
        status: "PENDING"
      });
      filterTestAppointmentIds.push(a2.id);

      const a3 = await Appointment.create({
        roomId: room.id,
        customerId: customer.customer.id,
        scheduledAt: new Date("2026-01-24T15:00:00.000Z"),
        status: "PENDING"
      });
      filterTestAppointmentIds.push(a3.id);

      const a4 = await Appointment.create({
        roomId: room.id,
        customerId: customer.customer.id,
        scheduledAt: new Date("2026-01-25T02:59:59.000Z"),
        status: "PENDING"
      });
      filterTestAppointmentIds.push(a4.id);

      const a5 = await Appointment.create({
        roomId: room.id,
        customerId: customer.customer.id,
        scheduledAt: new Date("2026-01-25T03:00:00.000Z"),
        status: "PENDING"
      });
      filterTestAppointmentIds.push(a5.id);
    });

    afterEach(async () => {
      await Appointment.destroy({
        where: { id: filterTestAppointmentIds },
        force: true
      });
      filterTestAppointmentIds.length = 0;
    });

    it("should filter from start of day in Sao Paulo timezone (03:00 UTC)", async () => {
      const response = await request(app)
        .get("/appointments")
        .query({ from: "2026-01-24" })
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      const scheduledDates = response.body.data.map((a: any) => a.scheduledAt);

      expect(scheduledDates).not.toContain("2026-01-24T02:59:59.000Z");
      expect(scheduledDates).toContain("2026-01-24T03:00:00.000Z");
      expect(scheduledDates).toContain("2026-01-24T15:00:00.000Z");
      expect(scheduledDates).toContain("2026-01-25T02:59:59.000Z");
      expect(scheduledDates).toContain("2026-01-25T03:00:00.000Z");
    });

    it("should filter to end of day in Sao Paulo timezone (02:59:59 UTC next day)", async () => {
      const response = await request(app)
        .get("/appointments")
        .query({ to: "2026-01-24" })
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      const scheduledDates = response.body.data.map((a: any) => a.scheduledAt);

      expect(scheduledDates).toContain("2026-01-24T02:59:59.000Z");
      expect(scheduledDates).toContain("2026-01-24T03:00:00.000Z");
      expect(scheduledDates).toContain("2026-01-24T15:00:00.000Z");
      expect(scheduledDates).toContain("2026-01-25T02:59:59.000Z");
      expect(scheduledDates).not.toContain("2026-01-25T03:00:00.000Z");
    });

    it("should filter exact day in Sao Paulo timezone with from and to", async () => {
      const response = await request(app)
        .get("/appointments")
        .query({ from: "2026-01-24", to: "2026-01-24" })
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      const testAppointments = response.body.data.filter((a: any) =>
        filterTestAppointmentIds.includes(a.id)
      );

      expect(testAppointments).toHaveLength(3);

      const scheduledDates = testAppointments.map((a: any) => a.scheduledAt);

      expect(scheduledDates).toContain("2026-01-24T03:00:00.000Z");
      expect(scheduledDates).toContain("2026-01-24T15:00:00.000Z");
      expect(scheduledDates).toContain("2026-01-25T02:59:59.000Z");
    });

    it("should include appointment at 23:59 SP time (02:59 UTC next day) in filter", async () => {
      const response = await request(app)
        .get("/appointments")
        .query({ from: "2026-01-24", to: "2026-01-24" })
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      const scheduledDates = response.body.data.map((a: any) => a.scheduledAt);
      expect(scheduledDates).toContain("2026-01-25T02:59:59.000Z");
    });

    it("should exclude appointment at 00:00 SP time of next day (03:00 UTC) from filter", async () => {
      const response = await request(app)
        .get("/appointments")
        .query({ from: "2026-01-24", to: "2026-01-24" })
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      const scheduledDates = response.body.data.map((a: any) => a.scheduledAt);
      expect(scheduledDates).not.toContain("2026-01-25T03:00:00.000Z");
    });
  });

  describe("Activity Logs - Timezone in Description", () => {
    it("should log appointment creation with UTC datetime in description", async () => {
      const inputDateTime = "2026-01-27T14:00:00-03:00";

      const response = await createAppointmentViaApi(customer.token, room.id, inputDateTime);
      expect(response.status).toBe(201);

      const logs = await ActivityLog.findAll({
        where: {
          module: "APPOINTMENT",
          activityType: "Criação de agendamento"
        },
        order: [["createdAt", "DESC"]]
      });

      expect(logs.length).toBeGreaterThan(0);

      const latestLog = logs[0];
      expect(latestLog.description).toContain("2026-01-27T17:00:00.000Z");
    });
  });

  describe("Edge Cases - Timezone Boundaries", () => {
    it("should handle appointment at midnight SP time correctly", async () => {
      const inputDateTime = "2026-01-28T00:00:00-03:00";

      const response = await createAppointmentViaApi(customer.token, room.id, inputDateTime);

      expect(response.status).toBe(201);
      expect(response.body.data.scheduledAt).toBe("2026-01-28T03:00:00.000Z");
    });

    it("should handle appointment at 23:59 SP time correctly", async () => {
      const inputDateTime = "2026-01-28T23:59:00-03:00";

      const response = await createAppointmentViaApi(customer.token, room.id, inputDateTime);

      expect(response.status).toBe(201);
      expect(response.body.data.scheduledAt).toBe("2026-01-29T02:59:00.000Z");
    });

    it("should handle daylight saving time transition dates", async () => {
      const inputDateTime = "2026-02-15T12:00:00-03:00";

      const response = await createAppointmentViaApi(customer.token, room.id, inputDateTime);

      expect(response.status).toBe(201);
      expect(response.body.data.scheduledAt).toBe("2026-02-15T15:00:00.000Z");
    });
  });
});


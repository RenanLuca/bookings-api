import { describe, it, expect, afterEach } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import {
  User,
  Customer,
  Room,
  Appointment,
  AuthToken,
  CustomerModulePermission
} from "../../src/models/index.js";

describe("Appointments Endpoints", () => {
  const testPassword = "TestPassword123!";
  const createdUserIds: number[] = [];
  const createdCustomerIds: number[] = [];
  const createdRoomIds: number[] = [];
  const createdAppointmentIds: number[] = [];

  const createRoom = async (name: string) => {
    const room = await Room.create({
      name,
      startTime: "08:00",
      endTime: "18:00",
      slotDurationMinutes: 60
    });
    createdRoomIds.push(room.id);
    return room;
  };

  const createCustomerWithPermission = async (
    email: string,
    canViewAppointments = true
  ) => {
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
      canView: canViewAppointments
    });

    const loginResponse = await request(app)
      .post("/auth/login")
      .send({ email, password: testPassword });

    return { user, customer, token: loginResponse.body.token as string };
  };

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

  describe("POST /appointments - Timezone conversion", () => {
    it("should save scheduledAt in UTC and return in GMT-3", async () => {
      const room = await createRoom("Room Timezone Test");
      const customer = await createCustomerWithPermission("customer-tz@test.com");

      const inputDateTime = "2026-01-20T10:00:00";

      const response = await request(app)
        .post("/appointments")
        .set("Authorization", `Bearer ${customer.token}`)
        .send({
          roomId: room.id,
          scheduledAt: inputDateTime
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("scheduledAt");

      createdAppointmentIds.push(response.body.id);

      const returnedDate = response.body.scheduledAt;
      expect(returnedDate).toMatch(/2026-01-20T10:00:00-03:00/);

      const dbRecord = await Appointment.findByPk(response.body.id);
      expect(dbRecord).not.toBeNull();

      const dbDate = new Date(dbRecord!.scheduledAt);
      const expectedUtc = new Date("2026-01-20T13:00:00Z");
      expect(dbDate.getTime()).toBe(expectedUtc.getTime());
    });
  });

  describe("POST /appointments - Conflict detection", () => {
    it("should return 409 when creating duplicate appointment for same room and time", async () => {
      const room = await createRoom("Room Conflict Test");
      const customerA = await createCustomerWithPermission("customer-a@test.com");
      const customerB = await createCustomerWithPermission("customer-b@test.com");

      const scheduledAt = "2026-01-21T14:00:00";

      const firstResponse = await request(app)
        .post("/appointments")
        .set("Authorization", `Bearer ${customerA.token}`)
        .send({
          roomId: room.id,
          scheduledAt
        });

      expect(firstResponse.status).toBe(201);
      createdAppointmentIds.push(firstResponse.body.id);

      const secondResponse = await request(app)
        .post("/appointments")
        .set("Authorization", `Bearer ${customerB.token}`)
        .send({
          roomId: room.id,
          scheduledAt
        });

      expect(secondResponse.status).toBe(409);
      expect(secondResponse.body).toHaveProperty("code", "APPOINTMENT_CONFLICT");
    });
  });

  describe("POST /appointments - Different rooms same time", () => {
    it("should allow same scheduledAt in different rooms", async () => {
      const roomA = await createRoom("Room A");
      const roomB = await createRoom("Room B");
      const customerA = await createCustomerWithPermission("customer-room-a@test.com");
      const customerB = await createCustomerWithPermission("customer-room-b@test.com");

      const scheduledAt = "2026-01-22T09:00:00";

      const responseA = await request(app)
        .post("/appointments")
        .set("Authorization", `Bearer ${customerA.token}`)
        .send({
          roomId: roomA.id,
          scheduledAt
        });

      expect(responseA.status).toBe(201);
      createdAppointmentIds.push(responseA.body.id);

      const responseB = await request(app)
        .post("/appointments")
        .set("Authorization", `Bearer ${customerB.token}`)
        .send({
          roomId: roomB.id,
          scheduledAt
        });

      expect(responseB.status).toBe(201);
      createdAppointmentIds.push(responseB.body.id);

      expect(responseA.body.roomId).toBe(roomA.id);
      expect(responseB.body.roomId).toBe(roomB.id);
    });
  });

  describe("Appointments - Permission blocking", () => {
    it("should return 403 when customer has canView=false for APPOINTMENTS", async () => {
      const room = await createRoom("Room Permission Test");
      const blockedCustomer = await createCustomerWithPermission(
        "blocked-customer@test.com",
        false
      );

      const createResponse = await request(app)
        .post("/appointments")
        .set("Authorization", `Bearer ${blockedCustomer.token}`)
        .send({
          roomId: room.id,
          scheduledAt: "2026-01-23T11:00:00"
        });

      expect(createResponse.status).toBe(403);
      expect(createResponse.body).toHaveProperty("code", "MODULE_ACCESS_FORBIDDEN");

      const listResponse = await request(app)
        .get("/appointments/me")
        .set("Authorization", `Bearer ${blockedCustomer.token}`);

      expect(listResponse.status).toBe(403);
      expect(listResponse.body).toHaveProperty("code", "MODULE_ACCESS_FORBIDDEN");
    });
  });
});

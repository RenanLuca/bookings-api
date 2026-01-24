import { describe, it, expect, afterEach } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../../src/app.js";
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
      .send({ email, password: testPassword, isAdmin: false });

    return { user, customer, token: loginResponse.body.data.token as string };
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
    it("should save scheduledAt in UTC and return in UTC", async () => {
      const room = await createRoom("Room Timezone Test");
      const customer = await createCustomerWithPermission("customer-tz@test.com");

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const inputDateTime = `${tomorrow.toISOString().split('T')[0]}T10:00:00`;
      const expectedUtc = `${tomorrow.toISOString().split('T')[0]}T13:00:00.000Z`;

      const response = await request(app)
        .post("/appointments")
        .set("Authorization", `Bearer ${customer.token}`)
        .send({
          roomId: room.id,
          scheduledAt: inputDateTime
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty("scheduledAt");

      createdAppointmentIds.push(response.body.data.id);

      const returnedDate = response.body.data.scheduledAt;
      expect(returnedDate).toBe(expectedUtc);

      const dbRecord = await Appointment.findByPk(response.body.data.id);
      expect(dbRecord).not.toBeNull();

      const dbDate = new Date(dbRecord!.scheduledAt);
      const expectedUtcDate = new Date(expectedUtc);
      expect(dbDate.getTime()).toBe(expectedUtcDate.getTime());
    });
  });

  describe("POST /appointments - Conflict detection", () => {
    it("should return 409 when creating duplicate appointment for same room and time", async () => {
      const room = await createRoom("Room Conflict Test");
      const customerA = await createCustomerWithPermission("customer-a@test.com");
      const customerB = await createCustomerWithPermission("customer-b@test.com");

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const scheduledAt = `${tomorrow.toISOString().split('T')[0]}T14:00:00`;

      const firstResponse = await request(app)
        .post("/appointments")
        .set("Authorization", `Bearer ${customerA.token}`)
        .send({
          roomId: room.id,
          scheduledAt
        });

      expect(firstResponse.status).toBe(201);
      createdAppointmentIds.push(firstResponse.body.data.id);

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

    it("should return 409 when creating appointment within slot duration of existing appointment", async () => {
      const room = await createRoom("Room Slot Duration Test");
      const customerA = await createCustomerWithPermission("customer-slot-a@test.com");
      const customerB = await createCustomerWithPermission("customer-slot-b@test.com");

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const firstScheduledAt = `${tomorrow.toISOString().split('T')[0]}T10:00:00`;
      const conflictScheduledAt = `${tomorrow.toISOString().split('T')[0]}T10:30:00`;

      const firstResponse = await request(app)
        .post("/appointments")
        .set("Authorization", `Bearer ${customerA.token}`)
        .send({
          roomId: room.id,
          scheduledAt: firstScheduledAt
        });

      expect(firstResponse.status).toBe(201);
      createdAppointmentIds.push(firstResponse.body.data.id);

      const secondResponse = await request(app)
        .post("/appointments")
        .set("Authorization", `Bearer ${customerB.token}`)
        .send({
          roomId: room.id,
          scheduledAt: conflictScheduledAt
        });

      expect(secondResponse.status).toBe(409);
      expect(secondResponse.body).toHaveProperty("code", "APPOINTMENT_CONFLICT");
    });
  });

  describe("POST /appointments - Room hours validation", () => {
    it("should return 400 when scheduledAt is before room startTime", async () => {
      const room = await createRoom("Room Hours Start Test");
      const customer = await createCustomerWithPermission("customer-hours-start@test.com");

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const scheduledAt = `${tomorrow.toISOString().split('T')[0]}T07:00:00`;

      const response = await request(app)
        .post("/appointments")
        .set("Authorization", `Bearer ${customer.token}`)
        .send({
          roomId: room.id,
          scheduledAt
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("code", "APPOINTMENT_OUTSIDE_ROOM_HOURS");
    });

    it("should return 400 when scheduledAt is after room endTime", async () => {
      const room = await createRoom("Room Hours End Test");
      const customer = await createCustomerWithPermission("customer-hours-end@test.com");

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const scheduledAt = `${tomorrow.toISOString().split('T')[0]}T18:30:00`;

      const response = await request(app)
        .post("/appointments")
        .set("Authorization", `Bearer ${customer.token}`)
        .send({
          roomId: room.id,
          scheduledAt
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("code", "APPOINTMENT_OUTSIDE_ROOM_HOURS");
    });
  });

  describe("POST /appointments - Date validation", () => {
    it("should return 400 when scheduledAt is before today", async () => {
      const room = await createRoom("Room Date Validation Test");
      const customer = await createCustomerWithPermission("customer-date-validation@test.com");
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const response = await request(app)
        .post("/appointments")
        .set("Authorization", `Bearer ${customer.token}`)
        .send({
          roomId: room.id,
          scheduledAt: yesterday.toISOString()
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("code", "APPOINTMENT_DATE_IN_PAST");
    });
  });

  describe("POST /appointments - Different rooms same time", () => {
    it("should allow same scheduledAt in different rooms", async () => {
      const roomA = await createRoom("Room A");
      const roomB = await createRoom("Room B");
      const customerA = await createCustomerWithPermission("customer-room-a@test.com");
      const customerB = await createCustomerWithPermission("customer-room-b@test.com");

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const scheduledAt = `${tomorrow.toISOString().split('T')[0]}T09:00:00`;

      const responseA = await request(app)
        .post("/appointments")
        .set("Authorization", `Bearer ${customerA.token}`)
        .send({
          roomId: roomA.id,
          scheduledAt
        });

      expect(responseA.status).toBe(201);
      createdAppointmentIds.push(responseA.body.data.id);

      const responseB = await request(app)
        .post("/appointments")
        .set("Authorization", `Bearer ${customerB.token}`)
        .send({
          roomId: roomB.id,
          scheduledAt
        });

      expect(responseB.status).toBe(201);
      createdAppointmentIds.push(responseB.body.data.id);

      expect(responseA.body.data.roomId).toBe(roomA.id);
      expect(responseB.body.data.roomId).toBe(roomB.id);
    });
  });

  describe("Appointments - Permission blocking", () => {
    it("should return 403 when customer has canView=false for APPOINTMENTS", async () => {
      const room = await createRoom("Room Permission Test");
      const blockedCustomer = await createCustomerWithPermission(
        "blocked-customer@test.com",
        false
      );

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const scheduledAt = `${tomorrow.toISOString().split('T')[0]}T11:00:00`;

      const createResponse = await request(app)
        .post("/appointments")
        .set("Authorization", `Bearer ${blockedCustomer.token}`)
        .send({
          roomId: room.id,
          scheduledAt
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

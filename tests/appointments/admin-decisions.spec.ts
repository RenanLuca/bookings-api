import { describe, it, expect, afterEach, beforeEach } from "vitest";
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

describe("Admin Appointment Decisions", () => {
  const testPassword = "TestPassword123!";
  const createdUserIds: number[] = [];
  const createdCustomerIds: number[] = [];
  const createdRoomIds: number[] = [];
  const createdAppointmentIds: number[] = [];

  let room: Room;
  let customerToken: string;
  let adminToken: string;
  let customerId: number;

  const createRoom = async (name: string) => {
    const created = await Room.create({
      name,
      startTime: "08:00",
      endTime: "18:00",
      slotDurationMinutes: 60
    });
    createdRoomIds.push(created.id);
    return created;
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
      .send({ email, password: testPassword });

    return { user, token: loginResponse.body.token as string };
  };

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
      module: "APPOINTMENTS",
      canView: true
    });

    const loginResponse = await request(app)
      .post("/auth/login")
      .send({ email, password: testPassword });

    return { user, customer, token: loginResponse.body.token as string };
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

    if (response.body.id) {
      createdAppointmentIds.push(response.body.id);
    }
    return response;
  };

  beforeEach(async () => {
    room = await createRoom("Admin Decisions Test Room");

    const customerData = await createCustomerWithPermission("customer-decisions@test.com");
    customerToken = customerData.token;
    customerId = customerData.customer.id;

    const adminData = await createAdmin("admin-decisions@test.com");
    adminToken = adminData.token;
  });

  afterEach(async () => {
    await Appointment.destroy({
      where: { id: createdAppointmentIds },
      force: true
    });

    for (const cId of createdCustomerIds) {
      await CustomerModulePermission.destroy({
        where: { customerId: cId },
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

  describe("Initial status is PENDING", () => {
    it("should create appointment with PENDING status", async () => {
      const scheduledAt = "2026-02-15T10:00:00";

      const response = await createAppointmentViaApi(customerToken, room.id, scheduledAt);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body.status).toBe("PENDING");

      const dbRecord = await Appointment.findByPk(response.body.id);
      expect(dbRecord).not.toBeNull();
      expect(dbRecord!.status).toBe("PENDING");
    });
  });

  describe("Admin accepts appointment", () => {
    it("should change status from PENDING to SCHEDULED", async () => {
      const scheduledAt = "2026-02-16T10:00:00";
      const createResponse = await createAppointmentViaApi(customerToken, room.id, scheduledAt);
      const appointmentId = createResponse.body.id;

      const acceptResponse = await request(app)
        .patch(`/appointments/${appointmentId}/accept`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(acceptResponse.status).toBe(200);
      expect(acceptResponse.body.status).toBe("SCHEDULED");

      const dbRecord = await Appointment.findByPk(appointmentId);
      expect(dbRecord!.status).toBe("SCHEDULED");
    });
  });

  describe("Admin cancels appointment in PENDING status", () => {
    it("should cancel appointment when status is PENDING", async () => {
      const scheduledAt = "2026-02-17T10:00:00";
      const createResponse = await createAppointmentViaApi(customerToken, room.id, scheduledAt);
      const appointmentId = createResponse.body.id;

      const cancelResponse = await request(app)
        .patch(`/appointments/${appointmentId}/cancel`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(cancelResponse.status).toBe(200);
      expect(cancelResponse.body.status).toBe("CANCELED");

      const dbRecord = await Appointment.findByPk(appointmentId);
      expect(dbRecord!.status).toBe("CANCELED");
    });
  });

  describe("Admin cancels approved appointment", () => {
    it("should allow canceling appointment with SCHEDULED status", async () => {
      const scheduledAt = "2026-02-18T10:00:00";
      const createResponse = await createAppointmentViaApi(customerToken, room.id, scheduledAt);
      const appointmentId = createResponse.body.id;

      await request(app)
        .patch(`/appointments/${appointmentId}/accept`)
        .set("Authorization", `Bearer ${adminToken}`);

      const cancelResponse = await request(app)
        .patch(`/appointments/${appointmentId}/cancel`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(cancelResponse.status).toBe(200);
      expect(cancelResponse.body.status).toBe("CANCELED");

      const dbRecord = await Appointment.findByPk(appointmentId);
      expect(dbRecord!.status).toBe("CANCELED");
    });
  });

  describe("Customer cannot execute admin decisions", () => {
    it("should return 403 when customer tries to accept appointment", async () => {
      const scheduledAt = "2026-02-19T10:00:00";
      const createResponse = await createAppointmentViaApi(customerToken, room.id, scheduledAt);
      const appointmentId = createResponse.body.id;

      const acceptResponse = await request(app)
        .patch(`/appointments/${appointmentId}/accept`)
        .set("Authorization", `Bearer ${customerToken}`);

      expect(acceptResponse.status).toBe(403);
      expect(acceptResponse.body).toHaveProperty("code", "FORBIDDEN");
    });

    it("should allow customer to cancel own appointment", async () => {
      const scheduledAt = "2026-02-20T10:00:00";
      const createResponse = await createAppointmentViaApi(customerToken, room.id, scheduledAt);
      const appointmentId = createResponse.body.id;

      const cancelResponse = await request(app)
        .patch(`/appointments/${appointmentId}/cancel`)
        .set("Authorization", `Bearer ${customerToken}`);

      expect(cancelResponse.status).toBe(200);
      expect(cancelResponse.body.status).toBe("CANCELED");
    });

    it("should return 403 when customer tries to cancel another customer appointment", async () => {
      const scheduledAt = "2026-02-20T11:00:00";
      const createResponse = await createAppointmentViaApi(customerToken, room.id, scheduledAt);
      const appointmentId = createResponse.body.id;

      const otherCustomer = await createCustomerWithPermission("other-customer@test.com");

      const cancelResponse = await request(app)
        .patch(`/appointments/${appointmentId}/cancel`)
        .set("Authorization", `Bearer ${otherCustomer.token}`);

      expect(cancelResponse.status).toBe(403);
      expect(cancelResponse.body).toHaveProperty("code", "APPOINTMENT_FORBIDDEN");
    });
  });

  describe("Invalid status transitions", () => {
    it("should return 400 when trying to accept already scheduled appointment", async () => {
      const scheduledAt = "2026-02-21T10:00:00";
      const createResponse = await createAppointmentViaApi(customerToken, room.id, scheduledAt);
      const appointmentId = createResponse.body.id;

      await request(app)
        .patch(`/appointments/${appointmentId}/accept`)
        .set("Authorization", `Bearer ${adminToken}`);

      const secondAcceptResponse = await request(app)
        .patch(`/appointments/${appointmentId}/accept`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(secondAcceptResponse.status).toBe(400);
      expect(secondAcceptResponse.body).toHaveProperty("code", "APPOINTMENT_INVALID_STATUS");
    });

    it("should return 400 when trying to accept canceled appointment", async () => {
      const scheduledAt = "2026-02-22T10:00:00";
      const createResponse = await createAppointmentViaApi(customerToken, room.id, scheduledAt);
      const appointmentId = createResponse.body.id;

      await request(app)
        .patch(`/appointments/${appointmentId}/cancel`)
        .set("Authorization", `Bearer ${adminToken}`);

      const acceptResponse = await request(app)
        .patch(`/appointments/${appointmentId}/accept`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(acceptResponse.status).toBe(400);
      expect(acceptResponse.body).toHaveProperty("code", "APPOINTMENT_INVALID_STATUS");
    });

    it("should return 400 when trying to cancel already canceled appointment", async () => {
      const scheduledAt = "2026-02-23T10:00:00";
      const createResponse = await createAppointmentViaApi(customerToken, room.id, scheduledAt);
      const appointmentId = createResponse.body.id;

      await request(app)
        .patch(`/appointments/${appointmentId}/cancel`)
        .set("Authorization", `Bearer ${adminToken}`);

      const secondCancelResponse = await request(app)
        .patch(`/appointments/${appointmentId}/cancel`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(secondCancelResponse.status).toBe(400);
      expect(secondCancelResponse.body).toHaveProperty("code", "APPOINTMENT_INVALID_STATUS");
    });
  });

  describe("Appointment not found", () => {
    it("should return 404 when trying to accept non-existent appointment", async () => {
      const response = await request(app)
        .patch("/appointments/999999/accept")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("code", "APPOINTMENT_NOT_FOUND");
    });

    it("should return 404 when trying to cancel non-existent appointment", async () => {
      const response = await request(app)
        .patch("/appointments/999999/cancel")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("code", "APPOINTMENT_NOT_FOUND");
    });
  });
});

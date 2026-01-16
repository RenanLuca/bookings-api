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

describe("Appointments Ownership", () => {
  const testPassword = "TestPassword123!";
  const createdUserIds: number[] = [];
  const createdCustomerIds: number[] = [];
  const createdRoomIds: number[] = [];
  const createdAppointmentIds: number[] = [];

  let room: Room;
  let customerA: { user: User; customer: Customer; token: string };
  let customerB: { user: User; customer: Customer; token: string };
  let admin: { user: User; token: string };
  let appointmentIdA: number;

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

  const createCustomerWithPermission = async (email: string, name: string) => {
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

    if (response.status === 201) {
      createdAppointmentIds.push(response.body.id);
    }
    return response;
  };

  beforeEach(async () => {
    room = await createRoom("Ownership Test Room");
    customerA = await createCustomerWithPermission(
      "owner-customer-a@test.com",
      "Customer A"
    );
    customerB = await createCustomerWithPermission(
      "owner-customer-b@test.com",
      "Customer B"
    );
    admin = await createAdmin("owner-admin@test.com");

    const appointmentResponse = await createAppointmentViaApi(
      customerA.token,
      room.id,
      "2026-03-15T10:00:00"
    );
    appointmentIdA = appointmentResponse.body.id;
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

  describe("Customer B cannot access Customer A appointments", () => {
    it("should not return Customer A appointment in Customer B /appointments/me list", async () => {
      const response = await request(app)
        .get("/appointments/me")
        .set("Authorization", `Bearer ${customerB.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);

      const containsAppointmentA = response.body.data.some(
        (a: { id: number }) => a.id === appointmentIdA
      );
      expect(containsAppointmentA).toBe(false);
    });

    it("should return Customer A appointment only in Customer A /appointments/me list", async () => {
      const response = await request(app)
        .get("/appointments/me")
        .set("Authorization", `Bearer ${customerA.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);

      const containsAppointmentA = response.body.data.some(
        (a: { id: number }) => a.id === appointmentIdA
      );
      expect(containsAppointmentA).toBe(true);

      const allBelongToA = response.body.data.every(
        (a: { customerId: number }) => a.customerId === customerA.customer.id
      );
      expect(allBelongToA).toBe(true);
    });
  });

  describe("Customer B cannot cancel Customer A appointment", () => {
    it("should return 403 when Customer B tries to cancel Customer A appointment", async () => {
      const response = await request(app)
        .patch(`/appointments/${appointmentIdA}/cancel`)
        .set("Authorization", `Bearer ${customerB.token}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("code", "APPOINTMENT_FORBIDDEN");
    });
  });

  describe("Customer A can cancel own appointment", () => {
    it("should allow Customer A to cancel own appointment", async () => {
      const response = await request(app)
        .patch(`/appointments/${appointmentIdA}/cancel`)
        .set("Authorization", `Bearer ${customerA.token}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("CANCELED");
      expect(response.body.id).toBe(appointmentIdA);

      const dbRecord = await Appointment.findByPk(appointmentIdA);
      expect(dbRecord!.status).toBe("CANCELED");
    });

    it("should allow Customer A to cancel own scheduled appointment", async () => {
      await request(app)
        .patch(`/appointments/${appointmentIdA}/accept`)
        .set("Authorization", `Bearer ${admin.token}`);

      const response = await request(app)
        .patch(`/appointments/${appointmentIdA}/cancel`)
        .set("Authorization", `Bearer ${customerA.token}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("CANCELED");

      const dbRecord = await Appointment.findByPk(appointmentIdA);
      expect(dbRecord!.status).toBe("CANCELED");
    });
  });

  describe("Customer B cannot accept Customer A appointment", () => {
    it("should return 403 when Customer B tries to accept Customer A appointment", async () => {
      const response = await request(app)
        .patch(`/appointments/${appointmentIdA}/accept`)
        .set("Authorization", `Bearer ${customerB.token}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("code", "FORBIDDEN");
    });
  });

  describe("Customer A can access own appointments", () => {
    it("should list own appointment in /appointments/me", async () => {
      const response = await request(app)
        .get("/appointments/me")
        .set("Authorization", `Bearer ${customerA.token}`);

      expect(response.status).toBe(200);

      const appointmentA = response.body.data.find(
        (a: { id: number }) => a.id === appointmentIdA
      );
      expect(appointmentA).toBeDefined();
      expect(appointmentA.customerId).toBe(customerA.customer.id);
      expect(appointmentA.roomId).toBe(room.id);
      expect(appointmentA.status).toBe("PENDING");
    });

    it("should be able to create additional appointments", async () => {
      const response = await createAppointmentViaApi(
        customerA.token,
        room.id,
        "2026-03-15T11:00:00"
      );

      expect(response.status).toBe(201);
      expect(response.body.customerId).toBe(customerA.customer.id);
    });
  });

  describe("Admin can manage any customer appointment", () => {
    it("should accept Customer A appointment as admin", async () => {
      const response = await request(app)
        .patch(`/appointments/${appointmentIdA}/accept`)
        .set("Authorization", `Bearer ${admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("SCHEDULED");
      expect(response.body.id).toBe(appointmentIdA);

      const dbRecord = await Appointment.findByPk(appointmentIdA);
      expect(dbRecord!.status).toBe("SCHEDULED");
    });

    it("should cancel Customer A appointment as admin", async () => {
      const response = await request(app)
        .patch(`/appointments/${appointmentIdA}/cancel`)
        .set("Authorization", `Bearer ${admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("CANCELED");
      expect(response.body.id).toBe(appointmentIdA);

      const dbRecord = await Appointment.findByPk(appointmentIdA);
      expect(dbRecord!.status).toBe("CANCELED");
    });

    it("should cancel approved Customer A appointment as admin", async () => {
      await request(app)
        .patch(`/appointments/${appointmentIdA}/accept`)
        .set("Authorization", `Bearer ${admin.token}`);

      const cancelResponse = await request(app)
        .patch(`/appointments/${appointmentIdA}/cancel`)
        .set("Authorization", `Bearer ${admin.token}`);

      expect(cancelResponse.status).toBe(200);
      expect(cancelResponse.body.status).toBe("CANCELED");

      const dbRecord = await Appointment.findByPk(appointmentIdA);
      expect(dbRecord!.status).toBe("CANCELED");
    });

    it("should list all appointments including Customer A in admin list", async () => {
      const customerBAppointment = await createAppointmentViaApi(
        customerB.token,
        room.id,
        "2026-03-15T12:00:00"
      );

      const response = await request(app)
        .get("/appointments")
        .set("Authorization", `Bearer ${admin.token}`);

      expect(response.status).toBe(200);

      const appointmentIds = response.body.data.map((a: { id: number }) => a.id);
      expect(appointmentIds).toContain(appointmentIdA);
      expect(appointmentIds).toContain(customerBAppointment.body.id);
    });
  });

  describe("Customer cannot access admin-only routes", () => {
    it("should return 403 when customer tries to list all appointments", async () => {
      const response = await request(app)
        .get("/appointments")
        .set("Authorization", `Bearer ${customerA.token}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("code", "FORBIDDEN");
    });
  });

  describe("Ownership isolation with multiple appointments", () => {
    it("should isolate appointments between multiple customers", async () => {
      await createAppointmentViaApi(customerA.token, room.id, "2026-03-16T09:00:00");
      await createAppointmentViaApi(customerA.token, room.id, "2026-03-16T10:00:00");
      await createAppointmentViaApi(customerB.token, room.id, "2026-03-16T11:00:00");
      await createAppointmentViaApi(customerB.token, room.id, "2026-03-16T12:00:00");

      const responseA = await request(app)
        .get("/appointments/me")
        .set("Authorization", `Bearer ${customerA.token}`);

      const responseB = await request(app)
        .get("/appointments/me")
        .set("Authorization", `Bearer ${customerB.token}`);

      expect(responseA.status).toBe(200);
      expect(responseB.status).toBe(200);

      expect(responseA.body.data.length).toBe(3);
      expect(responseB.body.data.length).toBe(2);

      const customerAIds = responseA.body.data.map(
        (a: { customerId: number }) => a.customerId
      );
      const customerBIds = responseB.body.data.map(
        (a: { customerId: number }) => a.customerId
      );

      expect(customerAIds.every((id: number) => id === customerA.customer.id)).toBe(
        true
      );
      expect(customerBIds.every((id: number) => id === customerB.customer.id)).toBe(
        true
      );

      const crossContamination =
        responseA.body.data.some(
          (a: { customerId: number }) => a.customerId === customerB.customer.id
        ) ||
        responseB.body.data.some(
          (a: { customerId: number }) => a.customerId === customerA.customer.id
        );
      expect(crossContamination).toBe(false);
    });
  });
});

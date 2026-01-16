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

describe("Customer Appointments List", () => {
  const testPassword = "TestPassword123!";
  const createdUserIds: number[] = [];
  const createdCustomerIds: number[] = [];
  const createdRoomIds: number[] = [];
  const createdAppointmentIds: number[] = [];

  let room: any;
  let customerA: { user: any; customer: any; token: string };
  let customerB: { user: any; customer: any; token: string };

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

  const createCustomerWithPermission = async (
    email: string,
    canViewAppointments = true
  ) => {
    const passwordHash = bcrypt.hashSync(testPassword, 10);
    const user = await User.create({
      name: `Customer ${email.split("@")[0]}`,
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
    room = await createRoom("Room List Test");
    customerA = await createCustomerWithPermission("customer-list-a@test.com");
    customerB = await createCustomerWithPermission("customer-list-b@test.com");
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

  describe("GET /appointments/me - Customer sees only own appointments", () => {
    it("should return only appointments belonging to the authenticated customer", async () => {
      await createAppointmentViaApi(customerA.token, room.id, "2026-02-10T09:00:00");
      await createAppointmentViaApi(customerA.token, room.id, "2026-02-10T10:00:00");
      await createAppointmentViaApi(customerA.token, room.id, "2026-02-10T11:00:00");
      await createAppointmentViaApi(customerB.token, room.id, "2026-02-10T12:00:00");

      const responseA = await request(app)
        .get("/appointments/me")
        .set("Authorization", `Bearer ${customerA.token}`);

      expect(responseA.status).toBe(200);
      expect(responseA.body.data).toHaveLength(3);

      const customerAIds = responseA.body.data.map((a: any) => a.customerId);
      const allBelongToA = customerAIds.every(
        (id: number) => id === customerA.customer.id
      );
      expect(allBelongToA).toBe(true);

      const containsB = responseA.body.data.some(
        (a: any) => a.customerId === customerB.customer.id
      );
      expect(containsB).toBe(false);
    });

    it("should return empty list when customer has no appointments", async () => {
      await createAppointmentViaApi(customerB.token, room.id, "2026-02-11T09:00:00");

      const responseA = await request(app)
        .get("/appointments/me")
        .set("Authorization", `Bearer ${customerA.token}`);

      expect(responseA.status).toBe(200);
      expect(responseA.body.data).toHaveLength(0);
      expect(responseA.body.meta.total).toBe(0);
    });
  });

  describe("GET /appointments/me - Pagination", () => {
    beforeEach(async () => {
      await createAppointmentViaApi(customerA.token, room.id, "2026-02-15T09:00:00");
      await createAppointmentViaApi(customerA.token, room.id, "2026-02-15T10:00:00");
      await createAppointmentViaApi(customerA.token, room.id, "2026-02-15T11:00:00");
    });

    it("should return limited items on first page", async () => {
      const response = await request(app)
        .get("/appointments/me")
        .query({ page: 1, pageSize: 2 })
        .set("Authorization", `Bearer ${customerA.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.pageSize).toBe(2);
      expect(response.body.meta.total).toBe(3);
    });

    it("should return remaining items on second page", async () => {
      const response = await request(app)
        .get("/appointments/me")
        .query({ page: 2, pageSize: 2 })
        .set("Authorization", `Bearer ${customerA.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.meta.page).toBe(2);
      expect(response.body.meta.total).toBe(3);
    });

    it("should return empty data when page exceeds total", async () => {
      const response = await request(app)
        .get("/appointments/me")
        .query({ page: 10, pageSize: 2 })
        .set("Authorization", `Bearer ${customerA.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.meta.total).toBe(3);
    });
  });

  describe("GET /appointments/me - Sorting", () => {
    beforeEach(async () => {
      await createAppointmentViaApi(customerA.token, room.id, "2026-02-20T09:00:00");
      await createAppointmentViaApi(customerA.token, room.id, "2026-02-20T14:00:00");
      await createAppointmentViaApi(customerA.token, room.id, "2026-02-20T11:00:00");
    });

    it("should return appointments sorted ascending by scheduledAt", async () => {
      const response = await request(app)
        .get("/appointments/me")
        .query({ sort: "asc" })
        .set("Authorization", `Bearer ${customerA.token}`);

      expect(response.status).toBe(200);
      expect(response.body.meta.sort).toBe("asc");

      const appointments = response.body.data;
      const scheduledDates = appointments.map((a: any) =>
        new Date(a.scheduledAt).getTime()
      );

      for (let i = 1; i < scheduledDates.length; i++) {
        expect(scheduledDates[i]).toBeGreaterThanOrEqual(scheduledDates[i - 1]);
      }
    });

    it("should return appointments sorted descending by scheduledAt", async () => {
      const response = await request(app)
        .get("/appointments/me")
        .query({ sort: "desc" })
        .set("Authorization", `Bearer ${customerA.token}`);

      expect(response.status).toBe(200);
      expect(response.body.meta.sort).toBe("desc");

      const appointments = response.body.data;
      const scheduledDates = appointments.map((a: any) =>
        new Date(a.scheduledAt).getTime()
      );

      for (let i = 1; i < scheduledDates.length; i++) {
        expect(scheduledDates[i]).toBeLessThanOrEqual(scheduledDates[i - 1]);
      }
    });

    it("should return opposite order when switching between asc and desc", async () => {
      const ascResponse = await request(app)
        .get("/appointments/me")
        .query({ sort: "asc" })
        .set("Authorization", `Bearer ${customerA.token}`);

      const descResponse = await request(app)
        .get("/appointments/me")
        .query({ sort: "desc" })
        .set("Authorization", `Bearer ${customerA.token}`);

      expect(ascResponse.status).toBe(200);
      expect(descResponse.status).toBe(200);

      const ascIds = ascResponse.body.data.map((a: any) => a.id);
      const descIds = descResponse.body.data.map((a: any) => a.id);

      expect(ascIds).toEqual([...descIds].reverse());
    });
  });

  describe("GET /appointments/me - Filter by status", () => {
    it.todo(
      "should filter appointments by status when status filter is implemented"
    );
  });
});

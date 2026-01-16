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

describe("Soft Delete Behavior", () => {
  const testPassword = "TestPassword123!";
  const createdUserIds: number[] = [];
  const createdCustomerIds: number[] = [];
  const createdRoomIds: number[] = [];
  const createdAppointmentIds: number[] = [];

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

  describe("Room soft delete", () => {
    it("should not show deleted room in listings", async () => {
      const admin = await createAdmin("admin-softdelete-room@test.com");

      const createResponse = await request(app)
        .post("/rooms")
        .set("Authorization", `Bearer ${admin.token}`)
        .send({
          name: "Sala Soft Delete Test",
          startTime: "08:00",
          endTime: "18:00",
          slotDurationMinutes: 60
        });

      expect(createResponse.status).toBe(201);
      const roomId = createResponse.body.id;
      createdRoomIds.push(roomId);

      const listBeforeDelete = await request(app)
        .get("/rooms")
        .query({ page: 1, pageSize: 100 })
        .set("Authorization", `Bearer ${admin.token}`);

      expect(listBeforeDelete.status).toBe(200);
      const roomIdsBeforeDelete = listBeforeDelete.body.data.map(
        (r: { id: number }) => r.id
      );
      expect(roomIdsBeforeDelete).toContain(roomId);

      const deleteResponse = await request(app)
        .delete(`/rooms/${roomId}`)
        .set("Authorization", `Bearer ${admin.token}`);

      expect(deleteResponse.status).toBe(204);

      const listAfterDelete = await request(app)
        .get("/rooms")
        .query({ page: 1, pageSize: 100 })
        .set("Authorization", `Bearer ${admin.token}`);

      expect(listAfterDelete.status).toBe(200);
      const roomIdsAfterDelete = listAfterDelete.body.data.map(
        (r: { id: number }) => r.id
      );
      expect(roomIdsAfterDelete).not.toContain(roomId);
    });
  });

  describe("Appointment canceled slot behavior", () => {
    it("should allow new appointment in slot of canceled appointment", async () => {
      const admin = await createAdmin("admin-slot-test@test.com");
      const customerA = await createCustomerWithPermission("customer-slot-a@test.com");
      const customerB = await createCustomerWithPermission("customer-slot-b@test.com");

      const createRoomResponse = await request(app)
        .post("/rooms")
        .set("Authorization", `Bearer ${admin.token}`)
        .send({
          name: "Sala Slot Test",
          startTime: "08:00",
          endTime: "18:00",
          slotDurationMinutes: 60
        });

      const roomId = createRoomResponse.body.id;
      createdRoomIds.push(roomId);

      const scheduledAt = "2026-03-15T10:00:00";

      const firstAppointment = await request(app)
        .post("/appointments")
        .set("Authorization", `Bearer ${customerA.token}`)
        .send({ roomId, scheduledAt });

      expect(firstAppointment.status).toBe(201);
      createdAppointmentIds.push(firstAppointment.body.id);

      const cancelResponse = await request(app)
        .patch(`/appointments/${firstAppointment.body.id}/cancel`)
        .set("Authorization", `Bearer ${admin.token}`);

      expect(cancelResponse.status).toBe(200);
      expect(cancelResponse.body.status).toBe("CANCELED");

      const secondAppointment = await request(app)
        .post("/appointments")
        .set("Authorization", `Bearer ${customerB.token}`)
        .send({ roomId, scheduledAt });

      if (secondAppointment.status !== 201) {
        
      }
      expect(secondAppointment.status).toBe(201);
      createdAppointmentIds.push(secondAppointment.body.id);
    });
  });
});

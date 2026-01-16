import { describe, it, expect, afterEach } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import { User, Room, AuthToken } from "../../src/models/index.js";

describe("Rooms Endpoints", () => {
  const testPassword = "TestPassword123!";
  const createdUserIds: number[] = [];
  const createdRoomIds: number[] = [];

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

  const createCustomer = async (email: string) => {
    const passwordHash = bcrypt.hashSync(testPassword, 10);
    const user = await User.create({
      name: "Customer User",
      email,
      passwordHash,
      role: "CUSTOMER",
      status: "ACTIVE"
    });
    createdUserIds.push(user.id);

    const loginResponse = await request(app)
      .post("/auth/login")
      .send({ email, password: testPassword });

    return { user, token: loginResponse.body.token as string };
  };

  const createRoom = async (data: {
    name: string;
    startTime: string;
    endTime: string;
    slotDurationMinutes: number;
  }) => {
    const room = await Room.create(data);
    createdRoomIds.push(room.id);
    return room;
  };

  afterEach(async () => {
    await Room.destroy({ where: { id: createdRoomIds }, force: true });

    for (const userId of createdUserIds) {
      await AuthToken.destroy({ where: { userId }, force: true });
    }

    await User.destroy({ where: { id: createdUserIds }, force: true });

    createdUserIds.length = 0;
    createdRoomIds.length = 0;
  });

  describe("POST /rooms - Admin creates room", () => {
    it("should create room successfully", async () => {
      const admin = await createAdmin("admin-create@test.com");

      const response = await request(app)
        .post("/rooms")
        .set("Authorization", `Bearer ${admin.token}`)
        .send({
          name: "Sala de Reunião A",
          startTime: "08:00",
          endTime: "18:00",
          slotDurationMinutes: 30
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body.name).toBe("Sala de Reunião A");
      expect(response.body.startTime).toBe("08:00:00");
      expect(response.body.endTime).toBe("18:00:00");
      expect(response.body.slotDurationMinutes).toBe(30);

      createdRoomIds.push(response.body.id);
    });
  });

  describe("POST /rooms - Validation errors", () => {
    it("should return 400 when name is empty", async () => {
      const admin = await createAdmin("admin-validation-name@test.com");

      const response = await request(app)
        .post("/rooms")
        .set("Authorization", `Bearer ${admin.token}`)
        .send({
          name: "",
          startTime: "08:00",
          endTime: "18:00",
          slotDurationMinutes: 30
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("code", "VALIDATION_ERROR");
    });

    it("should return 400 when slotDurationMinutes is 0", async () => {
      const admin = await createAdmin("admin-validation-slot-zero@test.com");

      const response = await request(app)
        .post("/rooms")
        .set("Authorization", `Bearer ${admin.token}`)
        .send({
          name: "Sala Teste",
          startTime: "08:00",
          endTime: "18:00",
          slotDurationMinutes: 0
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("code", "VALIDATION_ERROR");
    });

    it("should return 400 when slotDurationMinutes is negative", async () => {
      const admin = await createAdmin("admin-validation-slot-neg@test.com");

      const response = await request(app)
        .post("/rooms")
        .set("Authorization", `Bearer ${admin.token}`)
        .send({
          name: "Sala Teste",
          startTime: "08:00",
          endTime: "18:00",
          slotDurationMinutes: -10
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("code", "VALIDATION_ERROR");
    });
  });

  describe("GET /rooms - List rooms", () => {
    it("should list rooms with pagination as admin", async () => {
      const admin = await createAdmin("admin-list@test.com");

      await createRoom({
        name: "Sala A",
        startTime: "08:00",
        endTime: "12:00",
        slotDurationMinutes: 30
      });
      await createRoom({
        name: "Sala B",
        startTime: "13:00",
        endTime: "18:00",
        slotDurationMinutes: 60
      });

      const response = await request(app)
        .get("/rooms")
        .query({ page: 1, pageSize: 10 })
        .set("Authorization", `Bearer ${admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(response.body).toHaveProperty("meta");
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);

      const names = response.body.data.map((r: { name: string }) => r.name);
      expect(names).toContain("Sala A");
      expect(names).toContain("Sala B");
    });

    it("should list rooms with pagination as customer", async () => {
      const customer = await createCustomer("customer-list@test.com");

      await createRoom({
        name: "Sala C",
        startTime: "08:00",
        endTime: "12:00",
        slotDurationMinutes: 30
      });
      await createRoom({
        name: "Sala D",
        startTime: "13:00",
        endTime: "18:00",
        slotDurationMinutes: 60
      });

      const response = await request(app)
        .get("/rooms")
        .query({ page: 1, pageSize: 10 })
        .set("Authorization", `Bearer ${customer.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(response.body).toHaveProperty("meta");
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);

      const names = response.body.data.map((r: { name: string }) => r.name);
      expect(names).toContain("Sala C");
      expect(names).toContain("Sala D");
    });
  });

  describe("PATCH /rooms/:id - Admin updates room", () => {
    it("should update room name successfully", async () => {
      const admin = await createAdmin("admin-update@test.com");

      const room = await createRoom({
        name: "Sala Original",
        startTime: "08:00",
        endTime: "18:00",
        slotDurationMinutes: 30
      });

      const response = await request(app)
        .patch(`/rooms/${room.id}`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({
          name: "Sala Atualizada"
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe("Sala Atualizada");
    });

    it("should update room times successfully", async () => {
      const admin = await createAdmin("admin-update-times@test.com");

      const room = await createRoom({
        name: "Sala Horários",
        startTime: "08:00",
        endTime: "18:00",
        slotDurationMinutes: 30
      });

      const response = await request(app)
        .patch(`/rooms/${room.id}`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({
          startTime: "09:00",
          endTime: "17:00",
          slotDurationMinutes: 45
        });

      expect(response.status).toBe(200);
      expect(response.body.startTime).toBe("09:00:00");
      expect(response.body.endTime).toBe("17:00:00");
      expect(response.body.slotDurationMinutes).toBe(45);
    });
  });

  describe("DELETE /rooms/:id - Admin removes room (soft delete)", () => {
    it("should soft delete room successfully", async () => {
      const admin = await createAdmin("admin-delete@test.com");

      const room = await createRoom({
        name: "Sala Para Deletar",
        startTime: "08:00",
        endTime: "18:00",
        slotDurationMinutes: 30
      });

      const deleteResponse = await request(app)
        .delete(`/rooms/${room.id}`)
        .set("Authorization", `Bearer ${admin.token}`);

      expect(deleteResponse.status).toBe(204);

      const listResponse = await request(app)
        .get("/rooms")
        .query({ page: 1, pageSize: 100 })
        .set("Authorization", `Bearer ${admin.token}`);

      const roomIds = listResponse.body.data.map((r: { id: number }) => r.id);
      expect(roomIds).not.toContain(room.id);
    });
  });

  describe("Customer cannot access admin routes", () => {
    it("should return 403 when customer tries to create room", async () => {
      const customer = await createCustomer("customer-no-create@test.com");

      const response = await request(app)
        .post("/rooms")
        .set("Authorization", `Bearer ${customer.token}`)
        .send({
          name: "Sala Teste",
          startTime: "08:00",
          endTime: "18:00",
          slotDurationMinutes: 30
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("code", "FORBIDDEN");
    });

    it("should return 403 when customer tries to update room", async () => {
      const customer = await createCustomer("customer-no-update@test.com");

      const response = await request(app)
        .patch("/rooms/1")
        .set("Authorization", `Bearer ${customer.token}`)
        .send({
          name: "Sala Atualizada"
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("code", "FORBIDDEN");
    });

    it("should return 403 when customer tries to delete room", async () => {
      const customer = await createCustomer("customer-no-delete@test.com");

      const response = await request(app)
        .delete("/rooms/1")
        .set("Authorization", `Bearer ${customer.token}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("code", "FORBIDDEN");
    });
  });
});

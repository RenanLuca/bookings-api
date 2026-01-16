import { describe, it, expect, afterEach } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import { User, AuthToken, Customer, CustomerModulePermission } from "../../src/models/index.js";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("Multiple Tokens and Selective Logout", () => {
  const testPassword = "TestPassword123!";
  const createdUserIds: number[] = [];
  const createdCustomerIds: number[] = [];

  const createCustomerWithPermission = async (email: string) => {
    const passwordHash = bcrypt.hashSync(testPassword, 10);
    const user = await User.create({
      name: "Multi Token User",
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

    return { user, customer };
  };

  afterEach(async () => {
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
  });

  it("should allow multiple active sessions for the same user", async () => {
    const { user } = await createCustomerWithPermission("multi-session@test.com");

    const loginA = await request(app)
      .post("/auth/login")
      .send({ email: user.email, password: testPassword });
    expect(loginA.status).toBe(200);
    const tokenA = loginA.body.token;

    await delay(1100);

    const loginB = await request(app)
      .post("/auth/login")
      .send({ email: user.email, password: testPassword });
    expect(loginB.status).toBe(200);
    const tokenB = loginB.body.token;

    expect(tokenA).not.toBe(tokenB);

    const responseA = await request(app)
      .get("/logs/me")
      .set("Authorization", `Bearer ${tokenA}`);
    expect(responseA.status).toBe(200);

    const responseB = await request(app)
      .get("/logs/me")
      .set("Authorization", `Bearer ${tokenB}`);
    expect(responseB.status).toBe(200);
  });

  it("should revoke only the token used for logout (selective logout)", async () => {
    const { user } = await createCustomerWithPermission("selective-logout@test.com");

    const loginA = await request(app)
      .post("/auth/login")
      .send({ email: user.email, password: testPassword });
    expect(loginA.status).toBe(200);
    const tokenA = loginA.body.token;

    await delay(1100);

    const loginB = await request(app)
      .post("/auth/login")
      .send({ email: user.email, password: testPassword });
    expect(loginB.status).toBe(200);
    const tokenB = loginB.body.token;

    const logoutResponse = await request(app)
      .post("/auth/logout")
      .set("Authorization", `Bearer ${tokenA}`);
    expect(logoutResponse.status).toBe(204);

    const responseWithRevokedToken = await request(app)
      .get("/logs/me")
      .set("Authorization", `Bearer ${tokenA}`);
    expect(responseWithRevokedToken.status).toBe(401);
    expect(responseWithRevokedToken.body).toHaveProperty("code", "AUTH_TOKEN_INVALID");

    const responseWithActiveToken = await request(app)
      .get("/logs/me")
      .set("Authorization", `Bearer ${tokenB}`);
    expect(responseWithActiveToken.status).toBe(200);
  });

  it("should not allow logout with an already revoked token", async () => {
    const { user } = await createCustomerWithPermission("double-logout@test.com");

    const loginResponse = await request(app)
      .post("/auth/login")
      .send({ email: user.email, password: testPassword });
    expect(loginResponse.status).toBe(200);
    const token = loginResponse.body.token;

    const firstLogout = await request(app)
      .post("/auth/logout")
      .set("Authorization", `Bearer ${token}`);
    expect(firstLogout.status).toBe(204);

    const secondLogout = await request(app)
      .post("/auth/logout")
      .set("Authorization", `Bearer ${token}`);
    expect(secondLogout.status).toBe(401);
    expect(secondLogout.body).toHaveProperty("code", "AUTH_TOKEN_INVALID");
  });
});

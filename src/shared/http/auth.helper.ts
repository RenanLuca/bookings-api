
import type { Request } from "express";
import { AuthTokenInvalidError } from "../errors/index.js";

export function getAuthUser(req: Request): Express.AuthUser {
    if (!req.user) {
        throw new AuthTokenInvalidError();
    }
    return req.user;
}
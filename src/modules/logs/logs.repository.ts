import { Op, type FindAndCountOptions, type OrderItem } from "sequelize";
import { ActivityLog, User } from "../../models/index.js";
import type { CreateLogInput, ListByUserIdParams, FindAllWithFiltersParams } from "./dto/index.js";
import type { ILogsRepository } from "./logs.repository.interface.js";
import { LogsModules } from "./dto/logs-modules.dto.js";

class LogsRepository implements ILogsRepository {
  private resolveModulesFromSearch(
    search: string
  ): Array<LogsModules> {
    const normalized = search.trim().toLowerCase();
    const modules: Array<LogsModules> = [];
    if (!normalized) {
      return modules;
    }

    const appointmentAliases = ["agendamento", "agendamentos"];
    const accountAliases = ["minha conta", "conta"];

    const matchesAppointment = appointmentAliases.some((alias) =>
      normalized.includes(alias)
    );
    const matchesAccount = accountAliases.some((alias) =>
      normalized.includes(alias)
    );

    if (matchesAppointment) {
      modules.push(LogsModules.APPOINTMENT);
    }

    if (matchesAccount) {
      modules.push(LogsModules.ACCOUNT);
    }

    return modules;
  }

  private buildSearchWhere(search?: string): Record<string, unknown> {
    const trimmed = search?.trim();
    if (!trimmed) {
      return {};
    }
    const modules = this.resolveModulesFromSearch(trimmed);
    const orConditions: Record<string, unknown>[] = [
      { activityType: { [Op.like]: `%${trimmed}%` } },
      { module: { [Op.like]: `%${trimmed}%` } },
      { description: { [Op.like]: `%${trimmed}%` } },
      { "$User.name$": { [Op.like]: `%${trimmed}%` } }
    ];
    if (modules.length > 0) {
      orConditions.push({ module: { [Op.in]: modules } });
    }
    return {
      [Op.or]: orConditions
    };
  }

  private buildDateRangeWhere(from?: Date, to?: Date): Record<string, unknown> {
    if (!from && !to) {
      return {};
    }
    const range: { [key: symbol]: Date } = {};
    if (from) {
      range[Op.gte] = from;
    }
    if (to) {
      range[Op.lte] = to;
    }
    return { createdAt: range };
  }

  async create(data: CreateLogInput) {
    return ActivityLog.create(data);
  }

  async listByUserId(params: ListByUserIdParams) {
    const offset = (params.page - 1) * params.pageSize;
    const direction = params.sort === "asc" ? "ASC" : "DESC";
    const order: OrderItem[] = [["createdAt", direction], ["id", direction]];
    const where: Record<string, unknown> = {
      userId: params.userId,
      ...this.buildDateRangeWhere(params.from, params.to),
      ...this.buildSearchWhere(params.search)
    };
    const options: FindAndCountOptions = {
      where,
      limit: params.pageSize,
      offset,
      order,
      include: [{ model: User, attributes: ["id", "name", "role"] }],
      distinct: true
    };
    return ActivityLog.findAndCountAll(options);
  }

  async findAllWithFilters(params: FindAllWithFiltersParams) {
    const offset = (params.page - 1) * params.pageSize;
    const direction = params.sort === "asc" ? "ASC" : "DESC";
    const order: OrderItem[] = [["createdAt", direction], ["id", direction]];
    const where: Record<string, unknown> = {
      ...this.buildDateRangeWhere(params.from, params.to),
      ...this.buildSearchWhere(params.search)
    };

    if (params.module) {
      where.module = params.module;
    }

    if (params.userId) {
      where.userId = params.userId;
    }

    const options: FindAndCountOptions = {
      where,
      limit: params.pageSize,
      offset,
      order,
      include: [{ model: User, attributes: ["id", "name", "role"] }],
      distinct: true
    };

    return ActivityLog.findAndCountAll(options);
  }
}

export { LogsRepository };

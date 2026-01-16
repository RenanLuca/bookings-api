import { ValidationError } from "../../shared/errors/index.js";
import { RoomNotFoundError } from "./errors/index.js";
import type { ILogsService } from "../logs/logs.service.interface.js";
import type { IRoomsRepository } from "./rooms.repository.interface.js";
import type {
  CreateRoomInput,
  ListRoomsMeta,
  ListRoomsResult,
  UpdateRoomInput,
  FindPaginatedParams,
  NormalizedTime,
  UpdateRoomParams
} from "./dto/index.js";

class RoomsService {
  constructor(
    private readonly repository: IRoomsRepository,
    private readonly activityLogs: ILogsService
  ) {}

  private async logActivity(userId: number, activityType: string, description: string) {
    await this.activityLogs.createLog({
      userId,
      module: "APPOINTMENT",
      activityType,
      description
    });
  }

  private parseTime(value: string): NormalizedTime {
    const trimmed = value.trim();
    const segments = trimmed.split(":");
    const hasValidSegmentCount = segments.length === 2 || segments.length === 3;
    if (!hasValidSegmentCount) {
      throw new ValidationError();
    }
    const hoursStr = segments[0] ?? "";
    const minutesStr = segments[1] ?? "";
    const secondsStr = segments[2] ?? "0";
    const hours = Number.parseInt(hoursStr, 10);
    const minutes = Number.parseInt(minutesStr, 10);
    const seconds = Number.parseInt(secondsStr, 10);
    const areNumbers =
      Number.isInteger(hours) && Number.isInteger(minutes) && Number.isInteger(seconds);
    const inRange =
      hours >= 0 &&
      hours <= 23 &&
      minutes >= 0 &&
      minutes <= 59 &&
      seconds >= 0 &&
      seconds <= 59;
    if (!areNumbers || !inRange) {
      throw new ValidationError();
    }
    const normalizedHours = hours.toString().padStart(2, "0");
    const normalizedMinutes = minutes.toString().padStart(2, "0");
    const normalizedSeconds = seconds.toString().padStart(2, "0");
    const normalized = `${normalizedHours}:${normalizedMinutes}:${normalizedSeconds}`;
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    return { normalized, totalSeconds };
  }

  private validateTimeRange(start: NormalizedTime, end: NormalizedTime) {
    const isValidRange = start.totalSeconds < end.totalSeconds;
    if (!isValidRange) {
      throw new ValidationError();
    }
  }

  private formatTime(value: string) {
    const [hours, minutes] = value.split(":");
    const normalizedHours = hours?.padStart(2, "0") ?? "00";
    const normalizedMinutes = minutes?.padStart(2, "0") ?? "00";
    return `${normalizedHours}:${normalizedMinutes}`;
  }

  async listRooms(params: FindPaginatedParams): Promise<ListRoomsResult> {
    const { rows, count } = await this.repository.findPaginated(params);
    const meta: ListRoomsMeta = {
      page: params.page,
      pageSize: params.pageSize,
      total: count,
      sort: params.sort
    };
    return { data: rows, meta };
  }

  async getRoomById(id: number) {
    const room = await this.repository.findById(id);
    if (!room) {
      throw new RoomNotFoundError();
    }
    return room;
  }

  async createRoom(input: CreateRoomInput, actorId: number) {
    const name = input.name.trim();
    const startTime = this.parseTime(input.startTime);
    const endTime = this.parseTime(input.endTime);
    this.validateTimeRange(startTime, endTime);
    const room = await this.repository.create({
      name,
      startTime: startTime.normalized,
      endTime: endTime.normalized,
      slotDurationMinutes: input.slotDurationMinutes
    });
    const logDescription = `Criou sala '${room.name}' (${this.formatTime(
      room.startTime
    )}-${this.formatTime(room.endTime)}, slot ${room.slotDurationMinutes}m)`;
    await this.logActivity(actorId, "Criação de sala", logDescription);
    return room;
  }

  private buildRoomUpdates(
    current: { name: string; startTime: string; endTime: string; slotDurationMinutes: number },
    input: UpdateRoomInput
  ): { updates: UpdateRoomParams; changes: string[]; finalStart: NormalizedTime; finalEnd: NormalizedTime } {
    const updates: UpdateRoomParams = {};
    const changes: string[] = [];

    if (input.name !== undefined) {
      const name = input.name.trim();
      if (name !== current.name) {
        updates.name = name;
        changes.push(`Nome de '${current.name}' para '${name}'`);
      }
    }

    const currentStart = this.parseTime(current.startTime);
    const currentEnd = this.parseTime(current.endTime);
    let finalStart = currentStart;
    let finalEnd = currentEnd;

    if (input.startTime !== undefined) {
      const startTime = this.parseTime(input.startTime);
      finalStart = startTime;
      if (startTime.normalized !== current.startTime) {
        updates.startTime = startTime.normalized;
        changes.push(
          `Horário inicial de ${this.formatTime(current.startTime)} para ${this.formatTime(startTime.normalized)}`
        );
      }
    }

    if (input.endTime !== undefined) {
      const endTime = this.parseTime(input.endTime);
      finalEnd = endTime;
      if (endTime.normalized !== current.endTime) {
        updates.endTime = endTime.normalized;
        changes.push(
          `Horário final de ${this.formatTime(current.endTime)} para ${this.formatTime(endTime.normalized)}`
        );
      }
    }

    if (input.slotDurationMinutes !== undefined && input.slotDurationMinutes !== current.slotDurationMinutes) {
      updates.slotDurationMinutes = input.slotDurationMinutes;
      changes.push(
        `slotDurationMinutes de ${current.slotDurationMinutes} para ${input.slotDurationMinutes}`
      );
    }

    return { updates, changes, finalStart, finalEnd };
  }

  async updateRoom(id: number, input: UpdateRoomInput, actorId: number) {
    const current = await this.repository.findById(id);
    if (!current) {
      throw new RoomNotFoundError();
    }

    const { updates, changes, finalStart, finalEnd } = this.buildRoomUpdates(current, input);

    const shouldValidateRange = input.startTime !== undefined || input.endTime !== undefined;
    if (shouldValidateRange) {
      this.validateTimeRange(finalStart, finalEnd);
    }

    const hasUpdates = Object.keys(updates).length > 0;
    if (!hasUpdates) {
      return current;
    }

    const updated = await this.repository.updateById(id, updates);
    if (!updated) {
      throw new RoomNotFoundError();
    }

    if (changes.length > 0) {
      const logDescription = `Atualizou sala '${updated.name}': ${changes.join("; ")}`;
      await this.logActivity(actorId, "Atualização de sala", logDescription);
    }

    return updated;
  }

  async deleteRoom(id: number, actorId: number) {
    const room = await this.repository.findById(id);
    if (!room) {
      throw new RoomNotFoundError();
    }
    const deleted = await this.repository.softDeleteById(id);
    if (!deleted) {
      throw new RoomNotFoundError();
    }
    const logDescription = `Removeu sala '${room.name}'`;
    await this.logActivity(actorId, "Remoção de sala", logDescription);
  }
}

export { RoomsService };

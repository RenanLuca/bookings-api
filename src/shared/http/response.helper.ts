export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message?: string;
  data?: T;
  meta?: ResponseMeta;
}
export interface SuccessResponse<T = unknown> {
  success: true;
  message: string;
  data?: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: ValidationError[];
  code?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ResponseMeta {
  timestamp?: string;
  requestId?: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ServicePaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  sort: "asc" | "desc";
}

export class ResponseHelper {
  static success<T>(data: T, message?: string, meta?: ResponseMeta): ApiSuccessResponse<T> {
    const response: ApiSuccessResponse<T> = {
      success: true,
      data
    };

    if (message) {
      response.message = message;
    }

    if (meta) {
      response.meta = meta;
    }

    return response;
  }

  static successMessage(message: string): ApiSuccessResponse {
    return {
      success: true,
      message
    };
  }

  static successWithPagination<T>(
    data: T[],
    pagination: PaginationMeta,
    message?: string
  ): ApiSuccessResponse<T[]> {
    const response: ApiSuccessResponse<T[]> = {
      success: true,
      data,
      meta: { pagination }
    };

    if (message) {
      response.message = message;
    }

    return response;
  }

  static error(message: string, code?: string): ApiErrorResponse {
    const response: ApiErrorResponse = {
      success: false,
      message
    };

    if (code) {
      response.code = code;
    }

    return response;
  }

  static validationError(errors: ValidationError[]): ApiErrorResponse {
    return {
      success: false,
      message: "Falha na validação",
      errors,
      code: "VALIDATION_ERROR"
    };
  }

  static buildPaginatedResponse<T>(
    data: T[],
    meta: ServicePaginationMeta,
    message?: string
  ): ApiSuccessResponse<T[]> {
    const paginationMeta: PaginationMeta = {
      page: meta.page,
      limit: meta.pageSize,
      total: meta.total,
      totalPages: Math.ceil(meta.total / meta.pageSize)
    };

    return this.successWithPagination(data, paginationMeta, message);
  }

  static buildMeta(
    page: number,
    pageSize: number,
    total: number,
    sort: "asc" | "desc"
  ): ServicePaginationMeta {
    return { page, pageSize, total, sort };
  }
}

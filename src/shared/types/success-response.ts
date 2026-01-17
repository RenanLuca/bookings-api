export interface SuccessResponse<T = unknown> {
  success: true;
  message: string;
  data?: T;
}

export const createSuccessResponse = <T = unknown>(
  message: string,
  data?: T
): SuccessResponse<T> => {
  const response: SuccessResponse<T> = {
    success: true,
    message,
  };

  if (data !== undefined) {
    response.data = data;
  }

  return response;
};

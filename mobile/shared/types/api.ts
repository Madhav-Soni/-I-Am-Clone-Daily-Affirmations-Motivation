export type ApiSuccessResponse<T> = {
  status: "success";
  data: T;
  message?: string;
};

export type ApiErrorResponse = {
  status: "fail" | "error";
  message: string;
};

export type Role = "PLATFORM_ADMIN" | "OWNER" | "BARBER" | "CLIENT";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  barbershopId?: string;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

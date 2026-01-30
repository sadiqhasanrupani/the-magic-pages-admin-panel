export interface SignInDto {
  email: string;
  password?: string;
}

export interface AuthResponse {
  accessToken: string;
  userId: number;
  email: string;
  role: string;
}

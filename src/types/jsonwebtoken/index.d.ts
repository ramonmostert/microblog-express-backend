export {};

declare global {
  export interface JwtPayload {
    id: string;
    email: string;
  }
}

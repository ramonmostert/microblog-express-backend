export {};

declare global {
  namespace Express {
    export interface Request {
      userData: {
        id: string;
        email: string;
      };
    }
  }
}

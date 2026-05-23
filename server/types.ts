export type Role = "owner" | "admin" | "developer" | "viewer";

export type AuthUser = {
  uid: string;
  email?: string;
  name?: string;
  photoURL?: string;
  provider?: "firebase" | "jwt" | "local";
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};

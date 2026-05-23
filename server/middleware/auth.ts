import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { verifyFirebaseToken } from "../firebase";
import type { AuthUser } from "../types";

type JwtPayload = {
  uid: string;
  email?: string;
  name?: string;
};

const localUser: AuthUser = {
  uid: "demo-user",
  email: "demo@devwatch.ai",
  name: "Demo User",
  provider: "local"
};

function getBearerToken(request: Request) {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length);
}

export function signSessionToken(user: AuthUser) {
  return jwt.sign(
    {
      uid: user.uid,
      email: user.email,
      name: user.name
    },
    process.env.JWT_SECRET ?? "devwatch-local-secret",
    { expiresIn: "7d" }
  );
}

export async function resolveUserFromRequest(
  request: Request
): Promise<AuthUser | null> {
  const token = getBearerToken(request);
  if (!token) {
    return null;
  }

  const firebaseUser = await verifyFirebaseToken(token).catch(() => null);
  if (firebaseUser) {
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      name: firebaseUser.name,
      photoURL: firebaseUser.picture,
      provider: "firebase"
    };
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET ?? "devwatch-local-secret"
    ) as JwtPayload;

    return {
      uid: payload.uid,
      email: payload.email,
      name: payload.name,
      provider: "jwt"
    };
  } catch {
    return null;
  }
}

export async function optionalAuth(
  request: Request,
  _response: Response,
  next: NextFunction
) {
  request.user = (await resolveUserFromRequest(request)) ?? localUser;
  next();
}

export async function requireAuth(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const user = await resolveUserFromRequest(request);

  if (!user) {
    response.status(401).json({
      error: "Authentication required"
    });
    return;
  }

  request.user = user;
  next();
}

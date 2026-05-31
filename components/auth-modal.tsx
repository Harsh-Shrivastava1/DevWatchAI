"use client";

import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  type User as FirebaseUser
} from "firebase/auth";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Lock,
  Mail,
  UserRound,
  X
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { auth, firebaseConfigError } from "@/lib/firebase";
import type { ApiResponse, UserSession } from "@/lib/types";

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: "signin" | "signup";
  onClose: () => void;
  onSuccess: (userSession: UserSession) => void;
}

export function AuthModal({
  isOpen,
  initialMode = "signin",
  onClose,
  onSuccess
}: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      setNotice(null);
    }
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  async function createBackendSession(
    endpoint: "/api/auth/login" | "/api/auth/signup",
    firebaseUser: FirebaseUser
  ) {
    const idToken = await firebaseUser.getIdToken();
    const response = await apiFetch<ApiResponse<never>>(endpoint, {
      method: "POST",
      body: {
        idToken,
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || name || firebaseUser.email || "DevWatch User",
        photoURL: firebaseUser.photoURL || "",
        emailVerified: firebaseUser.emailVerified
      }
    });

    if (!response.success || !response.token || !response.user?.email) {
      throw new Error(response.error || "Backend session was not created.");
    }

    onSuccess({
      id: response.user.id || response.user._id || firebaseUser.uid,
      uid: response.user.firebaseUid || firebaseUser.uid,
      email: response.user.email,
      name: response.user.name || firebaseUser.displayName || "DevWatch User",
      photoURL: response.user.photoURL || firebaseUser.photoURL || undefined,
      token: response.token,
      onboardingRequired: response.onboardingRequired,
      onboardingCompleted: response.user.onboardingCompleted
    });
  }

  function ensureFirebase() {
    if (!auth) {
      throw new Error(firebaseConfigError || "Firebase Authentication is not configured.");
    }

    return auth;
  }

  async function prepareAuth() {
    const firebaseAuth = ensureFirebase();
    await setPersistence(firebaseAuth, browserLocalPersistence);
    return firebaseAuth;
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const firebaseAuth = await prepareAuth();
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(firebaseAuth, provider);
      await createBackendSession("/api/auth/login", credential.user);
    } catch (authError) {
      setError(toFriendlyAuthError(authError));
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const firebaseAuth = await prepareAuth();

      if (mode === "signup") {
        if (!name.trim()) {
          throw new Error("Enter your full name to create the account.");
        }

        const credential = await createUserWithEmailAndPassword(
          firebaseAuth,
          email,
          password
        );
        await updateProfile(credential.user, { displayName: name.trim() });
        await sendEmailVerification(credential.user);
        await createBackendSession("/api/auth/signup", credential.user);
        return;
      }

      const credential = await signInWithEmailAndPassword(
        firebaseAuth,
        email,
        password
      );
      await createBackendSession("/api/auth/login", credential.user);
    } catch (authError) {
      setError(toFriendlyAuthError(authError));
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordReset() {
    setError(null);
    setNotice(null);

    try {
      const firebaseAuth = ensureFirebase();
      if (!email.trim()) {
        throw new Error("Enter your email address first.");
      }

      await sendPasswordResetEmail(firebaseAuth, email.trim());
      setNotice("Password reset email sent.");
    } catch (authError) {
      setError(toFriendlyAuthError(authError));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/60 p-4">
      <div className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-indigo-700">DevWatch AI</p>
            <h2 className="mt-2 text-2xl font-semibold text-neutral-950">
              {mode === "signin" ? "Sign in" : "Create account"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">
              {mode === "signin"
                ? "Use your Firebase account to access your workspace."
                : "Create a Firebase account and connect it to DevWatchAI."}
            </p>
          </div>
          <button
            aria-label="Close"
            className="rounded-md p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mb-5 grid grid-cols-2 rounded-lg border border-neutral-200 bg-neutral-50 p-1">
          <button
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              mode === "signin"
                ? "bg-white text-neutral-950"
                : "text-neutral-600 hover:text-neutral-950"
            }`}
            onClick={() => setMode("signin")}
            type="button"
          >
            Sign In
          </button>
          <button
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              mode === "signup"
                ? "bg-white text-neutral-950"
                : "text-neutral-600 hover:text-neutral-950"
            }`}
            onClick={() => setMode("signup")}
            type="button"
          >
            Sign Up
          </button>
        </div>

        {firebaseConfigError ? (
          <StatusMessage tone="error" message={firebaseConfigError} />
        ) : null}
        {notice ? <StatusMessage tone="success" message={notice} /> : null}
        {error ? <StatusMessage tone="error" message={error} /> : null}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === "signup" ? (
            <Field label="Full name" icon={<UserRound size={16} />}>
              <input
                className="w-full bg-transparent text-sm outline-none"
                onChange={(event) => setName(event.target.value)}
                placeholder="Harsh Shrivastava"
                required
                value={name}
              />
            </Field>
          ) : null}

          <Field label="Email address" icon={<Mail size={16} />}>
            <input
              className="w-full bg-transparent text-sm outline-none"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@company.com"
              required
              type="email"
              value={email}
            />
          </Field>

          <Field label="Password" icon={<Lock size={16} />}>
            <input
              className="w-full bg-transparent text-sm outline-none"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              required
              type="password"
              value={password}
            />
          </Field>

          {mode === "signin" ? (
            <button
              className="text-sm font-medium text-indigo-700 hover:text-indigo-800"
              onClick={handlePasswordReset}
              type="button"
            >
              Forgot password?
            </button>
          ) : null}

          <button
            className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-indigo-700 px-4 text-sm font-semibold text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
            disabled={loading || Boolean(firebaseConfigError)}
            type="submit"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : null}
            {mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-neutral-200" />
          <span className="text-xs font-medium text-neutral-500">or</span>
          <span className="h-px flex-1 bg-neutral-200" />
        </div>

        <button
          className="flex h-11 w-full items-center justify-center gap-3 rounded-md border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading || Boolean(firebaseConfigError)}
          onClick={handleGoogleSignIn}
          type="button"
        >
          <GoogleIcon />
          Continue with Google
        </button>
      </div>
    </div>
  );
}

function Field({
  children,
  icon,
  label
}: {
  children: ReactNode;
  icon: ReactNode;
  label: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-neutral-700">{label}</span>
      <span className="flex h-11 items-center gap-3 rounded-md border border-neutral-200 bg-white px-3 text-neutral-500 focus-within:border-indigo-500">
        {icon}
        {children}
      </span>
    </label>
  );
}

function StatusMessage({
  message,
  tone
}: {
  message: string;
  tone: "success" | "error";
}) {
  const success = tone === "success";

  return (
    <div
      className={`mb-4 flex gap-2 rounded-md border p-3 text-sm ${
        success
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-rose-200 bg-rose-50 text-rose-800"
      }`}
    >
      {success ? (
        <CheckCircle2 className="mt-0.5 shrink-0" size={16} />
      ) : (
        <AlertCircle className="mt-0.5 shrink-0" size={16} />
      )}
      <span>{message}</span>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function toFriendlyAuthError(error: unknown) {
  const authError = error as { code?: string; message?: string };

  switch (authError.code) {
    case "auth/email-already-in-use":
      return "This email is already in use.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Invalid email or password.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/popup-closed-by-user":
      return "Google sign-in was closed before it finished.";
    case "auth/unauthorized-domain":
      return "This domain is not authorized in Firebase Authentication settings.";
    case "auth/network-request-failed":
      return "Firebase could not be reached from this browser.";
    default:
      return authError.message || "Authentication failed.";
  }
}

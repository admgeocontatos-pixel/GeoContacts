import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const.js";
import type { Express, Request, Response } from "express";
import { createEmailUser, findUsersByContactIdentifiers, getNearbyUsers, getUserByEmail, getUserByOpenId, updateUserLastSignedIn, upsertUser, upsertUserLocation } from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

async function syncUser(userInfo: {
  openId?: string | null;
  name?: string | null;
  email?: string | null;
  loginMethod?: string | null;
  platform?: string | null;
}) {
  if (!userInfo.openId) {
    throw new Error("openId missing from user info");
  }

  const lastSignedIn = new Date();
  await upsertUser({
    openId: userInfo.openId,
    name: userInfo.name || null,
    email: userInfo.email ?? null,
    loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
    lastSignedIn,
  });
  const saved = await getUserByOpenId(userInfo.openId);
  return (
    saved ?? {
      openId: userInfo.openId,
      name: userInfo.name,
      email: userInfo.email,
      loginMethod: userInfo.loginMethod ?? null,
      lastSignedIn,
    }
  );
}

function buildUserResponse(
  user:
    | Awaited<ReturnType<typeof getUserByOpenId>>
    | {
        openId: string;
        name?: string | null;
        email?: string | null;
        loginMethod?: string | null;
        lastSignedIn?: Date | null;
      },
) {
  return {
    id: (user as any)?.id ?? null,
    openId: user?.openId ?? null,
    name: user?.name ?? null,
    email: user?.email ?? null,
    phone: (user as any)?.phone ?? null,
    loginMethod: user?.loginMethod ?? null,
    lastSignedIn: (user?.lastSignedIn ?? new Date()).toISOString(),
  };
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function registerOAuthRoutes(app: Express) {
  const googleCallbackUri = "https://geocontacts-dn1j.onrender.com/api/auth/google/callback";

  app.put("/api/user/location", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      const latitude = Number(req.body?.latitude);
      const longitude = Number(req.body?.longitude);
      const accuracy = req.body?.accuracy === undefined ? undefined : Number(req.body.accuracy);
      if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        res.status(400).json({ error: "latitude e longitude devem ser coordenadas válidas" });
        return;
      }
      if (accuracy !== undefined && (!Number.isFinite(accuracy) || accuracy < 0)) {
        res.status(400).json({ error: "accuracy deve ser um número não negativo" });
        return;
      }
      await upsertUserLocation({ userId: user.id, latitude, longitude, accuracy });
      res.json({ success: true, latitude, longitude, updatedAt: new Date().toISOString() });
    } catch (error) {
      console.error("[Location] Update failed", error);
      res.status(401).json({ error: "Não foi possível atualizar a localização" });
    }
  });

  app.get("/api/contacts/nearby", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      const latitude = Number(getQueryParam(req, "latitude"));
      const longitude = Number(getQueryParam(req, "longitude"));
      const radiusKm = Number(getQueryParam(req, "radiusKm") ?? "10");
      if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180 || !Number.isFinite(radiusKm) || radiusKm <= 0 || radiusKm > 100) {
        res.status(400).json({ error: "latitude, longitude e radiusKm inválidos" });
        return;
      }
      const contacts = await getNearbyUsers(user.id, latitude, longitude, radiusKm);
      res.json({ contacts });
    } catch (error) {
      console.error("[Location] Nearby lookup failed", error);
      res.status(401).json({ error: "Não foi possível consultar contatos próximos" });
    }
  });

  app.post("/api/contacts/match", async (req: Request, res: Response) => {
    try {
      await sdk.authenticateRequest(req);
      const emails = Array.isArray(req.body?.emails)
        ? req.body.emails.filter((value: unknown): value is string => typeof value === "string").map((value: string) => value.trim().toLowerCase()).filter(Boolean).slice(0, 1000)
        : [];
      const phones = Array.isArray(req.body?.phones)
        ? req.body.phones.filter((value: unknown): value is string => typeof value === "string").map((value: string) => value.replace(/[^0-9+]/g, "")).filter(Boolean).slice(0, 1000)
        : [];
      const users = await findUsersByContactIdentifiers(emails, phones);
      res.json({ users });
    } catch (error) {
      console.error("[Contacts] Match failed", error);
      res.status(401).json({ error: "Não foi possível cruzar os contatos" });
    }
  });

  app.get("/app-auth", (req: Request, res: Response) => {
    const redirectUri = getQueryParam(req, "redirectUri");
    const state = getQueryParam(req, "state");
    const clientId = process.env.GOOGLE_CLIENT_ID;

    if (!redirectUri || !state) {
      res.status(400).json({ error: "redirectUri and state are required" });
      return;
    }
    if (!clientId) {
      res.status(503).json({ error: "Google OAuth is not configured on the server" });
      return;
    }

    const googleUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    googleUrl.searchParams.set("client_id", clientId);
    googleUrl.searchParams.set("redirect_uri", googleCallbackUri);
    googleUrl.searchParams.set("response_type", "code");
    googleUrl.searchParams.set("scope", "openid email profile");
    googleUrl.searchParams.set("state", state);
    googleUrl.searchParams.set("access_type", "offline");
    res.redirect(302, googleUrl.toString());
  });

  app.get(["/api/auth/google/callback", "/api/oauth/google/callback"], async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    if (!clientId || !clientSecret) {
      res.status(503).json({ error: "Google OAuth server credentials are not configured" });
      return;
    }

    try {
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: googleCallbackUri, grant_type: "authorization_code" }),
      });
      if (!tokenResponse.ok) throw new Error(`Google token exchange failed: ${tokenResponse.status}`);
      const tokens = (await tokenResponse.json()) as { access_token?: string };
      if (!tokens.access_token) throw new Error("Google did not return an access token");

      const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${tokens.access_token}` } });
      if (!profileResponse.ok) throw new Error(`Google profile request failed: ${profileResponse.status}`);
      const profile = (await profileResponse.json()) as { sub?: string; name?: string; email?: string };
      if (!profile.sub) throw new Error("Google profile did not contain a subject");

      const user = await syncUser({ openId: `google:${profile.sub}`, name: profile.name, email: profile.email, loginMethod: "google" });
      const sessionToken = await sdk.createSessionToken(`google:${profile.sub}`, { name: user.name || profile.name || "", expiresInMs: ONE_YEAR_MS });
      const mobileRedirect = Buffer.from(state, "base64").toString("utf8");
      const callbackUrl = new URL(mobileRedirect);
      callbackUrl.searchParams.set("sessionToken", sessionToken);
      callbackUrl.searchParams.set("user", Buffer.from(JSON.stringify(buildUserResponse(user))).toString("base64"));
      res.redirect(302, callbackUrl.toString());
    } catch (error) {
      console.error("[Google OAuth] Callback failed", error);
      res.status(500).json({ error: "Google OAuth callback failed" });
    }
  });

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      await syncUser(userInfo);
      const sessionToken = await sdk.createSessionToken(userInfo.openId!, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Redirect to the frontend URL (Expo web on port 8081)
      // Cookie is set with parent domain so it works across both 3000 and 8081 subdomains
      const frontendUrl =
        process.env.EXPO_WEB_PREVIEW_URL ||
        process.env.EXPO_PACKAGER_PROXY_URL ||
        "http://localhost:8081";
      res.redirect(302, frontendUrl);
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });

  app.get("/api/oauth/mobile", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      const user = await syncUser(userInfo);

      const sessionToken = await sdk.createSessionToken(userInfo.openId!, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({
        app_session_id: sessionToken,
        user: buildUserResponse(user),
      });
    } catch (error) {
      console.error("[OAuth] Mobile exchange failed", error);
      res.status(500).json({ error: "OAuth mobile exchange failed" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.json({ success: true });
  });

  app.post("/api/auth/email/register", async (req: Request, res: Response) => {
    try {
      const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
      const password = typeof req.body?.password === "string" ? req.body.password : "";
      const name = typeof req.body?.name === "string" ? req.body.name.trim() : undefined;
      const phone = typeof req.body?.phone === "string" ? req.body.phone.replace(/[^0-9+]/g, "") : undefined;
      if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
        res.status(400).json({ error: "INVALID_INPUT", message: "Informe um e-mail válido e uma senha com pelo menos 8 caracteres" });
        return;
      }
      if (await getUserByEmail(email)) {
        res.status(409).json({ error: "EMAIL_EXISTS", message: "Este e-mail já está cadastrado" });
        return;
      }
      const user = await createEmailUser({ email, name, phone, passwordHash: hashPassword(password) });
      if (!user) throw new Error("User was not created");
      const sessionToken = await sdk.createSessionToken(user.openId, { name: user.name || "", expiresInMs: ONE_YEAR_MS });
      res.json({ sessionToken, user: buildUserResponse(user) });
    } catch (error) {
      console.error("[Auth] Email registration failed", error);
      const code = (error as { code?: string })?.code === "23505" ? "EMAIL_EXISTS" : "DATABASE_UNAVAILABLE";
      res.status(code === "EMAIL_EXISTS" ? 409 : 503).json({ error: code, message: code === "EMAIL_EXISTS" ? "Este e-mail já está cadastrado" : "Servidor indisponível. Tente novamente em alguns segundos." });
    }
  });

  app.post("/api/auth/email/login", async (req: Request, res: Response) => {
    try {
      const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
      const password = typeof req.body?.password === "string" ? req.body.password : "";
      const user = await getUserByEmail(email);
      if (!user?.passwordHash || !verifyPassword(password, user.passwordHash)) {
        res.status(401).json({ error: "INVALID_CREDENTIALS", message: "E-mail ou senha inválidos" });
        return;
      }
      await updateUserLastSignedIn(user.id, new Date());
      const sessionToken = await sdk.createSessionToken(user.openId, { name: user.name || "", expiresInMs: ONE_YEAR_MS });
      res.json({ sessionToken, user: buildUserResponse(user) });
    } catch (error) {
      console.error("[Auth] Email login failed", error);
      res.status(503).json({ error: "DATABASE_UNAVAILABLE", message: "Servidor indisponível. Tente novamente em alguns segundos." });
    }
  });

  app.post("/api/auth/password/forgot", async (req: Request, res: Response) => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      res.status(400).json({ error: "INVALID_INPUT", message: "Informe um e-mail válido" });
      return;
    }
    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
      res.status(503).json({
        error: "EMAIL_SERVICE_NOT_CONFIGURED",
        message: "A recuperação por e-mail ainda não está configurada neste servidor. Solicite ao administrador a configuração do provedor de e-mail.",
      });
      return;
    }

    // The provider hook is deliberately explicit: without a reset-token store
    // and a configured sender, never claim that an e-mail was dispatched.
    console.info("[Auth] Password reset requested", { emailDomain: email.split("@")[1] });
    res.status(501).json({ error: "PASSWORD_RESET_PROVIDER_PENDING", message: "O provedor está configurado, mas o fluxo de redefinição ainda precisa ser ativado." });
  });

  // Get current authenticated user - works with both cookie (web) and Bearer token (mobile)
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      res.json({ user: buildUserResponse(user) });
    } catch (error) {
      console.error("[Auth] /api/auth/me failed:", error);
      res.status(401).json({ error: "Not authenticated", user: null });
    }
  });

  // Establish session cookie from Bearer token
  // Used by iframe preview: frontend receives token via postMessage, then calls this endpoint
  // to get a proper Set-Cookie response from the backend (3000-xxx domain)
  app.post("/api/auth/session", async (req: Request, res: Response) => {
    try {
      // Authenticate using Bearer token from Authorization header
      const user = await sdk.authenticateRequest(req);

      // Get the token from the Authorization header to set as cookie
      const authHeader = req.headers.authorization || req.headers.Authorization;
      if (typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
        res.status(400).json({ error: "Bearer token required" });
        return;
      }
      const token = authHeader.slice("Bearer ".length).trim();

      // Set cookie for this domain (3000-xxx)
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({ success: true, user: buildUserResponse(user) });
    } catch (error) {
      console.error("[Auth] /api/auth/session failed:", error);
      res.status(401).json({ error: "Invalid token" });
    }
  });
}

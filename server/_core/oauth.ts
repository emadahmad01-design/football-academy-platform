import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  // Dev login endpoint for development without OAuth server
  app.post("/api/dev-login", async (req: Request, res: Response) => {
    const isDev = process.env.NODE_ENV !== "production";
    
    console.log("[Dev Login] Request received, isDev:", isDev);
    
    if (!isDev) {
      return res.status(403).json({ error: "Dev login only available in development" });
    }

    try {
      // Ensure dev user exists
      let devUser = await db.getUserByOpenId("dev-user-id");
      
      if (!devUser) {
        console.log("[Dev Login] Creating dev user...");
        // Create dev user if it doesn't exist
        await db.upsertUser({
          openId: "dev-user-id",
          name: "Dev User",
          email: "dev@example.com",
          loginMethod: "dev",
          lastSignedIn: new Date(),
        });
        devUser = await db.getUserByOpenId("dev-user-id");
      } else {
        // Update last signed in
        await db.upsertUser({
          openId: "dev-user-id",
          name: devUser.name || "Dev User",
          email: devUser.email || "dev@example.com",
          loginMethod: "dev",
          lastSignedIn: new Date(),
        });
      }

      console.log("[Dev Login] Dev user:", devUser);

      // Create session token
      const sessionToken = await sdk.createSessionToken("dev-user-id", {
        name: devUser?.name || "Dev User",
        expiresInMs: ONE_YEAR_MS,
      });

      console.log("[Dev Login] Session token created");

      // Set cookie
      const cookieOptions = getSessionCookieOptions(req);
      console.log("[Dev Login] Cookie options:", cookieOptions);
      
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      console.log("[Dev Login] Cookie set, sending response");
      res.json({ success: true, user: { name: devUser?.name || "Dev User", email: devUser?.email || "dev@example.com" } });
    } catch (error) {
      console.error("[Dev Login] Failed", error);
      res.status(500).json({ error: "Dev login failed", details: error instanceof Error ? error.message : String(error) });
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

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getNearbyUsers, upsertUserLocation } from "./db";
import { z } from "zod";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  location: router({
    update: protectedProcedure
      .input(z.object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180), accuracy: z.number().nonnegative().optional() }))
      .mutation(async ({ ctx, input }) => {
        await upsertUserLocation({ userId: ctx.user.id, ...input });
        return { success: true } as const;
      }),
    nearby: protectedProcedure
      .input(z.object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180), radiusKm: z.number().positive().max(100).default(10) }))
      .query(({ ctx, input }) => getNearbyUsers(ctx.user.id, input.latitude, input.longitude, input.radiusKm)),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;

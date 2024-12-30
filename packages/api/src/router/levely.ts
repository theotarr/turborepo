import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

import { publicProcedure } from "../trpc";

export const levelyRouter = {} satisfies TRPCRouterRecord;

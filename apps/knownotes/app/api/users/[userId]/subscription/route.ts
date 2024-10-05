import z from "zod"

import { getUserSubscriptionPlan } from "@/lib/subscription"

const routeContextSchema = z.object({
  params: z.object({
    userId: z.string(),
  }),
})

export async function GET(req: Request) {
  const context = routeContextSchema.parse(req)
  const { params } = context
  const { userId } = params
  const subscription = await getUserSubscriptionPlan(userId)
}

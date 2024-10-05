import * as z from "zod"

export const userSchema = z.object({
  name: z.string().min(3).max(32),
  email: z.string().email(),
})

export const deleteUserSchema = z.object({
  id: z.string(),
})

import { Resend } from "resend"

import { env } from "@/env"

export const resend = new Resend(env.RESEND_API_KEY)

export const USER_AUDIENCE_ID = "49272543-de62-46d9-bf8e-ad8d91d8582e"
export const PAID_USER_AUDIENCE_ID = "590acdaa-7221-46fb-9045-772a55d0f1c0"

export async function getResendContactIdFromEmail(
  email: string,
  audienceId: string = USER_AUDIENCE_ID
) {
  const { data } = await resend.contacts.list({ audienceId })
  if (!data) return null
  const allContacts = data.data
  const contact = allContacts.find((contact) => contact.email === email)
  return contact?.id || null
}

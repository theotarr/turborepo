"use client"

import { useEffect } from "react"
import { toast } from "sonner"

export function PaymentResultRedirect({ result }: { result: "success" | "error" }) {
  useEffect(() => {
    if (result === "error") {
      toast.error("Payment failed. Please try again.")
      setTimeout(() => {
        window.location.href = "/welcome"
      }, 1500)
    } else {
      toast.success("Payment succeeded! Redirecting to dashboard...")
      setTimeout(() => {
        window.location.href = "/onboarding"
      }, 1500)
    }
  }, [result])

  return null
}

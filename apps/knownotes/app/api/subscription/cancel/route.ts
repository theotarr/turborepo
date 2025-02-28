import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getUserSubscriptionPlan } from "@/lib/subscription";
import { db } from "@/lib/db";
import { auth } from "@acme/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user || !session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const { reason, details } = await req.json();
    
    // Store cancellation feedback
    await db.cancellationFeedback.create({
      data: {
        userId: session.user.id,
        reason,
        details,
      },
    });
    
    const subscriptionPlan = await getUserSubscriptionPlan(session.user.id);
    
    if (!subscriptionPlan.isPro || !subscriptionPlan.stripeSubscriptionId) {
      return new NextResponse("No subscription found", { status: 400 });
    }
    
    // Cancel at period end to allow user to use service until the end of billing period
    await stripe.subscriptions.update(subscriptionPlan.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    return new NextResponse("Error cancelling subscription", { status: 500 });
  }
} 
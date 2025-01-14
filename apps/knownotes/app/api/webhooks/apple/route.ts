import { db } from "@/lib/db";

const SUPERWALL_WEBHOOK_URL =
  "https://superwall.com/api/integrations/app-store-connect/webhook?pk=pk_944813c8354eb5f1ef827fb9d3f04a23fae6834cbeff114c";

export async function POST(req: Request) {
  const body = await req.json();
  console.log("Body", body);

  // Forward the event to Superwall.
  const superwallResponse = await fetch(SUPERWALL_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!superwallResponse.ok) {
    console.error(
      "Failed to send notification to Superwall:",
      await superwallResponse.text(),
    );
  }

  // Decode the signedPayload from App Store
  const signedPayload = body.signedPayload;
  if (!signedPayload)
    throw new Error("Missing signedPayload in the request body.");

  const signedPayloadBody = signedPayload
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .split(".")[1]; // Get the body part of the JWT
  const messageBody = JSON.parse(
    Buffer.from(signedPayloadBody, "base64").toString(),
  );
  console.log("Message Body:", messageBody);

  const { notificationType, data } = messageBody;
  const { signedTransactionInfo } = data;

  const signedTransactionInfoBody = signedTransactionInfo
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .split(".")[1];
  const transactionInfo = JSON.parse(
    Buffer.from(signedTransactionInfoBody, "base64").toString(),
  );
  console.log("Transaction Info:", transactionInfo);

  // See https://superwall.com/docs/identity-management
  // On iOS, Superwall will set the value from identify(userId:options:) as the applicationUsername on SKPayment, which later comes back as the appAccountToken in the notification to your server. Note that your application ID must be in a UUID format.
  const userId = transactionInfo.appAccountToken;
  const transactionId = transactionInfo.originalTransactionId;
  console.log("User ID:", userId);
  console.log("Transaction ID:", transactionId);

  try {
    // Process the notificationType and update the subscription
    switch (notificationType) {
      case "DID_RENEW":
      case "SUBSCRIBED":
        await db.user.update({
          where: {
            id: userId,
          },
          data: {
            appStoreSubscriptionId: transactionId,
            appStoreProductId: transactionInfo.productId,
            appStoreCurrentPeriodEnd: new Date(transactionInfo.expiresDate),
          },
        });
        console.log(
          `Subscription renewed: ${transactionInfo.productId} for user ${userId}`,
        );
        break;

      case "EXPIRED":
      case "GRACE_PERIOD_EXPIRED":
      case "REVOKE":
        // No need to update anything in the database.
        // The subscription has expired and our subscription logic won't allow the user to access the premium features.
        console.log(
          `Subscription expired: ${transactionInfo.productId} for user ${userId}`,
        );
        break;

      default:
        console.log(`Unhandled notification type: ${notificationType}`);
        break;
    }

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("Error handling App Store Connect webhook:", error);
    return new Response(`Webhook Error: ${error.message}`, { status: 400 });
  }
}

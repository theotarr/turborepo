import type {
  PaywallInfo,
  SubscriptionStatus,
  SuperwallEventInfo,
} from "@superwall/react-native-superwall";
import appsFlyer from "react-native-appsflyer";
import {
  EventType,
  SuperwallDelegate,
} from "@superwall/react-native-superwall";

export class MySuperwallDelegate extends SuperwallDelegate {
  subscriptionStatusDidChange(value: SubscriptionStatus): void {
    console.log("[Superwall] Subscription status changed to", value);
  }

  handleSuperwallEvent(eventInfo: SuperwallEventInfo) {
    // console.log("[Superwall] Handling Superwall event:", eventInfo);

    switch (eventInfo.event.type) {
      case EventType.appOpen:
        console.log("[Superwall] appOpen event");
        break;

      case EventType.deviceAttributes:
        console.log(
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          `[Superwall] deviceAttributes event: ${eventInfo.event.deviceAttributes}`,
        );
        break;

      case EventType.transactionComplete:
        // Report to AppsFlyer.
        console.log("[Superwall] transactionComplete event");
        console.log("[Superwall] Reporting conversion to AppsFlyer");
        void appsFlyer.logEvent("af_subscribe", {
          af_projected_revenue: eventInfo.event.product?.price,
          af_currency: eventInfo.event.product?.currencyCode,
          price_id: eventInfo.event.product?.productIdentifier,
        });
        break;

      default:
        break;
    }
  }

  // Implement these required methods.
  handleCustomPaywallAction(name: string): void {
    // console.log("[Superwall] Handling custom paywall action:", name);
  }

  willDismissPaywall(paywallInfo: PaywallInfo): void {
    // console.log("[Superwall] Paywall will dismiss:", paywallInfo);
  }

  willPresentPaywall(paywallInfo: PaywallInfo): void {
    // console.log("[Superwall] Paywall will present:", paywallInfo);
  }

  didDismissPaywall(paywallInfo: PaywallInfo): void {
    // console.log("[Superwall] Paywall did dismiss:", paywallInfo);
  }

  didPresentPaywall(paywallInfo: PaywallInfo): void {
    // console.log("[Superwall] Paywall did present:", paywallInfo);
  }

  paywallWillOpenURL(url: URL): void {
    // console.log("[Superwall] Paywall will open URL:", url);
  }

  paywallWillOpenDeepLink(url: URL): void {
    // console.log("[Superwall] Paywall will open Deep Link:", url);
  }

  handleLog(
    level: string,
    scope: string,
    message?: string,
    info?: Map<string, unknown>,
    error?: string,
  ): void {
    console.log(`[Superwall] [${level}] ${scope}: ${message}`, info, error);
  }
}

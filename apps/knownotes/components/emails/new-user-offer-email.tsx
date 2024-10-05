import {
  Body,
  Head,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

import { tailwindEmailConfig } from "./tailwind-email-theme";

export default function NewUserOfferEmail() {
  return (
    <Html lang="en">
      <Head />
      <Preview>Try out KnowNotes for free!</Preview>
      <Tailwind config={tailwindEmailConfig}>
        <Body className="m-auto font-sans">
          <Section>
            <Text className="text-sm text-muted-foreground">Hey,</Text>
            <Text className="text-sm text-muted-foreground">
              We lost you when you hit the checkout page! If you still want to
              try out{" "}
              <a href="https://knownotes.ai/login?ref=free-trial-email">
                KnowNotes
              </a>
              , you can get a week free on us!
            </Text>
            <Text className="mt-4 text-sm text-muted-foreground">
              Theo (Founder @ KnowNotes)
            </Text>
          </Section>
        </Body>
      </Tailwind>
    </Html>
  );
}

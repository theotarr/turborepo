import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

import { tailwindEmailConfig } from "./tailwind-email-theme";

export default function LoginEmail({ url }: { url: string }) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Sign in to KnowNotes</Preview>
      <Tailwind config={tailwindEmailConfig}>
        <Body className="m-auto font-sans">
          <Container className="mx-auto my-12 w-96 rounded-lg border border-border p-5">
            <Section className="mt-[32px]">
              <Img
                src={`https://knownotes.ai/android-chrome-512x512.png`}
                width="40"
                height="37"
                alt="KnowNotes"
                className="mx-auto my-0"
              />
            </Section>
            <Section className="mt-8">
              <Heading className="text-center text-2xl font-bold text-primary">
                Sign in to KnowNotes
              </Heading>
              <Text className="text-sm text-muted-foreground">Hey there!</Text>
              <Text className="text-sm text-muted-foreground">
                Click the button below to sign in to your account.
              </Text>
              <div className="my-4 flex justify-center">
                <Button
                  className="h-11 rounded-md bg-primary px-8 text-primary-foreground hover:bg-primary/90"
                  href={url}
                >
                  Sign In
                </Button>
              </div>
            </Section>
            <Hr className="my-4" />
            <Text className="text-xs text-muted">
              If you did not request this email, you can safely ignore it.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

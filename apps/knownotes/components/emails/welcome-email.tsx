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

export default function WelcomeEmail() {
  return (
    <Html lang="en">
      <Head />
      <Preview>Welcome to the future of note taking!</Preview>
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
                Welcome to the future of note taking!
              </Heading>
              <Text className="text-sm text-muted-foreground">Hey!</Text>
              <Text className="text-sm text-muted-foreground">
                Just reaching out to welcome you to KnowNotes!
              </Text>
              <Text className="text-sm text-muted-foreground">
                Think of KnowNotes as your personal assistant for all your
                classes, helping you take notes, answer questions, and complete
                your work. It&apos;s like ChatGPT but personalized for your
                classes.
              </Text>
              <Text className="text-sm text-muted-foreground">
                Ready to get started? Just click the button and add your
                classes!
              </Text>
              <div className="my-4 flex justify-center">
                <Button
                  className="h-11 rounded-md bg-primary px-8 text-primary-foreground hover:bg-primary/90"
                  href={"https://knownotes.ai/dashboard"}
                >
                  Get Started
                </Button>
              </div>
              <Text className="mt-2 text-sm text-muted-foreground">
                Feel free to reach out if you need anything, our team is happy
                to help!
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

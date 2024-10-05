import NextAuth from "next-auth";

import { authConfig } from "./config";

export type { Session } from "next-auth";

const { handlers, auth, signIn, signOut } = NextAuth({
  events: {
    //     createUser: async (createUser: { user }) => {
    //       const { name, email } = createUser.user;
    //       if (!email) return;
    //       try {
    //         await resend.emails.send({
    //           from: "Theo from KnowNotes <theo@knownotes.ai>",
    //           to: email,
    //           subject: "Save hours studying",
    //           text: `\
    // Welcome to KnowNotes!
    // To make the most of KnowNotes, here's a short tutorial on how to use all its features (2min on 2x):
    // https://www.loom.com/share/5f1fbb33b9a44d5ab2d61928d30af528?sid=94a40531-7cf3-48e4-826b-655bd32ee8be
    // Reply if you have any quetions.
    // Best,
    // Theo`,
    //           html: `Welcome to KnowNotes!<br><br>To make the most of KnowNotes, here's a short tutorial on how to use all its features (2min on 2x):<br><a href="https://www.loom.com/share/5f1fbb33b9a44d5ab2d61928d30af528?sid=94a40531-7cf3-48e4-826b-655bd32ee8be">Watch the tutorial</a><br><br>Reply if you have any quetions.<br><br>Best,<br>Theo`,
    //         });
    //         // await resend.emails.send({
    //         //   from: "Theo from knownotes.ai <theo@knownotes.ai>",
    //         //   to: email,
    //         //   subject: "Want to earn money in your sleep?",
    //         //   text: `Hey,\n\nWhen you refer a friend to KnowNotes, we’ll give you $6.50 per month, PER PERSON!\n\nThat means every time you refer a friend, you’ll earn $6.50 every month.\n\nhttps://knownotes.ai/affiliate`,
    //         //   html: `Hey,<br><br>When you refer a friend to KnowNotes, we’ll give you $6.50 per month, PER PERSON!<br><br>That means every time you refer a friend, you’ll earn $6.50 every month.<br><br><a href="https://knownotes.ai/affiliate">Click here to refer a friend</a>`,
    //         // })
    //         // add the user to the resend audience in production
    //         await resend.contacts.create({
    //           email,
    //           firstName: name || undefined,
    //           unsubscribed: false,
    //           audienceId: USER_AUDIENCE_ID,
    //         });
    //       } catch (error) {
    //         console.log({ error });
    //       }
    //     },
  },
  ...authConfig,
});

export { handlers, auth, signIn, signOut };

export {
  authConfig,
  invalidateSessionToken,
  validateToken,
  isSecureContext,
} from "./config";

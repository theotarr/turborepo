export const defaultEditorContent = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: {
        level: 3,
      },
      content: [
        {
          text: "Notes here...",
          type: "text",
        },
      ],
    },
    {
      type: "bulletList",
      attrs: {
        tight: true,
      },
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  text: "Don't forget to pay attention to your teacher, and we'll ",
                  type: "text",
                },
                {
                  text: "automatically write down the most important ideas and takeaways ",
                  type: "text",
                  marks: [
                    {
                      type: "bold",
                    },
                  ],
                },
                {
                  text: "in your notes for you",
                  type: "text",
                },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  text: "If you have a question, click on the ",
                  type: "text",
                },
                {
                  text: "Chat",
                  type: "text",
                  marks: [
                    {
                      type: "code",
                    },
                  ],
                },
                {
                  text: " tab for a",
                  type: "text",
                },
                {
                  text: " personalized tutor for this lecture",
                  type: "text",
                  marks: [
                    {
                      type: "bold",
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  text: "Delete this text when you begin transcribing :)",
                  type: "text",
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

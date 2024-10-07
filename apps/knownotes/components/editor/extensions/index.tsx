import Mathematics from "@tiptap-pro/extension-mathematics";
import { InputRule } from "@tiptap/core";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import TiptapLink from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import TextStyle from "@tiptap/extension-text-style";
import TiptapUnderline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";

import CustomKeymap from "./custom-keymap";
import DragAndDrop from "./drag-and-drop";
import SlashCommand from "./slash-command";
import UpdatedImage from "./updated-image";

// const mathRegex = /\\\((.*?)\\\)/gi;
const mathRegex = /\\([a-zA-Z]+)(\{[^}]*\})? /gi;

export const defaultExtensions = [
  StarterKit.configure({
    heading: {
      HTMLAttributes: {
        class: "font-semibold leading-tight tracking-tighter",
      },
      levels: [1, 2, 3, 4],
    },
    bulletList: {
      HTMLAttributes: {
        class: "list-disc list-outside leading-3 -mt-2",
      },
    },
    orderedList: {
      HTMLAttributes: {
        class: "list-decimal list-outside leading-3 -mt-2",
      },
    },
    listItem: {
      HTMLAttributes: {
        class: "leading-normal -mb-2",
      },
    },
    blockquote: {
      HTMLAttributes: {
        class: "border-l-4 border-secondary-foreground",
      },
    },
    codeBlock: {
      HTMLAttributes: {
        class:
          "rounded-sm bg-secondary/75 p-5 font-mono font-medium text-secondary-foreground",
      },
    },
    code: {
      HTMLAttributes: {
        class:
          "rounded-md bg-secondary px-1.5 py-1 font-mono font-medium text-secondary-foreground",
        spellcheck: "false",
      },
    },
    horizontalRule: false,
    dropcursor: {
      color: "#DBEAFE",
      width: 4,
    },
    gapcursor: false,
  }),
  // patch to fix horizontal rule bug: https://github.com/ueberdosis/tiptap/pull/3859#issuecomment-1536799740
  HorizontalRule.extend({
    addInputRules() {
      return [
        new InputRule({
          find: /^(?:---|—-|___\s|\*\*\*\s)$/,
          handler: ({ state, range }) => {
            const attributes = {};

            const { tr } = state;
            const start = range.from;
            let end = range.to;

            tr.insert(start - 1, this.type.create(attributes)).delete(
              tr.mapping.map(start),
              tr.mapping.map(end),
            );
          },
        }),
      ];
    },
  }).configure({
    HTMLAttributes: {
      class: "mt-4 mb-6 border-t border-border",
    },
  }),
  TiptapLink.configure({
    HTMLAttributes: {
      class:
        "text-secondary-foreground underline underline-offset-[3px] hover:text-secondary-foreground transition-colors cursor-pointer",
    },
  }),
  UpdatedImage.configure({
    HTMLAttributes: {
      class: "rounded-lg border border-border",
    },
  }),
  Placeholder.configure({
    placeholder: ({ node }) => {
      if (node.type.name === "heading") {
        return `Heading ${node.attrs.level}`;
      }
      return "Press '/' to format text...";
    },
    includeChildren: true,
  }),
  SlashCommand,
  TiptapUnderline,
  TextStyle,
  Color,
  Highlight.configure({
    multicolor: true,
  }),
  TaskList.configure({
    HTMLAttributes: {
      class: "not-prose pl-2",
    },
  }),
  TaskItem.configure({
    HTMLAttributes: {
      class: "flex items-start my-4",
    },
    nested: true,
  }),
  Markdown.configure({
    html: false,
    transformCopiedText: true,
    transformPastedText: true,
  }),
  CustomKeymap,
  DragAndDrop,
  Mathematics.configure({
    regex: mathRegex,
  }),
];

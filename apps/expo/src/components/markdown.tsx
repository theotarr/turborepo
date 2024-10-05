import { Platform, StyleSheet } from "react-native";

import { NAV_THEME } from "~/lib/constants";

const baseSize = 16; // Assuming a base size of 16px

export const markdownStyles = StyleSheet.create({
  body: {
    fontSize: baseSize,
    lineHeight: baseSize * 10.75,
  },
  heading1: {
    fontWeight: "800",
    fontSize: 36, // 2.25rem
    lineHeight: 40, // 2.5rem
    marginTop: 0, // 0rem
    marginBottom: 32, // 2rem
  },
  heading2: {
    fontWeight: "700",
    fontSize: 24, // 1.5rem
    lineHeight: 32, // 2rem
    marginTop: 32, // 2rem
    marginBottom: 16, // 1rem
  },
  heading3: {
    fontWeight: "600",
    fontSize: 20, // 1.25rem
    lineHeight: 28, // 1.75rem
    marginTop: 25.6, // 1.6rem
    marginBottom: 9.6, // 0.6rem
  },
  heading4: {
    fontWeight: "600",
    fontSize: 16, // 1rem
    lineHeight: 24, // 1.5rem
    marginTop: 24, // 1.5rem
    marginBottom: 8, // 0.5rem
  },
  heading5: {
    fontWeight: "600",
    fontSize: 14, // 0.875rem
    lineHeight: 20, // 1.25rem
  },
  heading6: {
    fontWeight: "600",
    fontSize: 14, // 0.875rem
    lineHeight: 20, // 1.25rem
  },
  hr: {
    backgroundColor: NAV_THEME.light.border,
    height: 5,
    borderBottomWidth: 1,
    marginTop: 48, // 3rem
    marginBottom: 48, // 3rem
  },
  strong: {
    fontWeight: "600",
  },
  em: {
    fontStyle: "italic",
  },
  s: {
    textDecorationLine: "line-through",
  },
  blockquote: {
    fontWeight: "500",
    fontStyle: "italic",
    borderLeftWidth: 4,
    paddingLeft: 16, // 1rem
    marginTop: 25.6, // 1.6rem
    marginBottom: 25.6, // 1.6rem
  },
  bullet_list: {
    marginTop: 16, // 1rem
    marginBottom: 16, // 1rem
  },
  ordered_list: {
    marginTop: 16, // 1rem
    marginBottom: 16, // 1rem
  },
  list_item: {
    flexDirection: "row",
    marginTop: 4, // 0.25rem
    marginBottom: 4, // 0.25rem
  },
  bullet_list_icon: {
    marginRight: 8, // 0.5rem
  },
  bullet_list_content: {
    flex: 1,
  },
  ordered_list_icon: {
    marginRight: 8, // 0.5rem
  },
  ordered_list_content: {
    flex: 1,
  },
  code_inline: {
    fontWeight: "600",
    fontSize: 14, // 0.875rem
    ...Platform.select({
      ios: { fontFamily: "Courier" },
      android: { fontFamily: "monospace" },
    }),
  },
  code_block: {
    padding: 16, // 1rem
    borderRadius: 4,
    ...Platform.select({
      ios: { fontFamily: "Courier" },
      android: { fontFamily: "monospace" },
    }),
  },
  fence: {
    padding: 16, // 1rem
    borderRadius: 4,
    ...Platform.select({
      ios: { fontFamily: "Courier" },
      android: { fontFamily: "monospace" },
    }),
  },
  table: {
    marginTop: 32, // 2rem
    marginBottom: 32, // 2rem
  },
  thead: {
    borderBottomWidth: 1,
  },
  th: {
    fontWeight: "600",
    padding: 8, // 0.5rem
    textAlign: "left",
  },
  tr: {
    borderBottomWidth: 1,
  },
  td: {
    padding: 8, // 0.5rem
    textAlign: "left",
  },
  link: {
    textDecorationLine: "underline",
  },
  image: {
    marginTop: 32, // 2rem
    marginBottom: 32, // 2rem
  },
  text: {
    fontSize: baseSize,
    lineHeight: baseSize * 1.75,
  },
  paragraph: {
    marginTop: 20, // 1.25rem
    marginBottom: 20, // 1.25rem
  },
  hardbreak: {
    height: 24, // 1.5rem
  },
});

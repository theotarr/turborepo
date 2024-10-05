"use client";

import { useEffect, useState } from "react";
import { Editor as EditorClass, Extensions } from "@tiptap/core";
import { EditorProps } from "@tiptap/pm/view";
import { EditorContent, JSONContent, useEditor } from "@tiptap/react";
import { useDebouncedCallback } from "use-debounce";

import { EditorBubbleMenu } from "./bubble-menu";
import { defaultExtensions } from "./extensions";
import { ImageResizer } from "./extensions/image-resizer";
import { defaultEditorProps } from "./props";

import "@/styles/prosemirror.css";
import "katex/dist/katex.min.css";

import { useNotesStore } from "../notes-page";

export default function Editor({
  className = "relative min-h-[500px] w-full max-w-screen-lg border-border bg-background sm:mb-[calc(20vh)]",
  defaultValue,
  extensions = [],
  editorProps = {},
  onUpdate = () => {},
  onDebouncedUpdate = () => {},
  debounceDuration = 750,
  editable = true,
  autoFocus = false,
  id,
  immediatelyRender = true,
}: {
  /**
   * Additional classes to add to the editor container.
   * Defaults to "relative min-h-[500px] w-full max-w-screen-lg border-border bg-foreground sm:mb-[calc(20vh)] sm:rounded-lg sm:border sm:shadow-lg".
   */
  className?: string;
  /**
   * The default value to use for the editor.
   * Defaults to defaultEditorContent.
   */
  defaultValue?: JSONContent | string;
  /**
   * A list of extensions to use for the editor, in addition to the default Novel extensions.
   * Defaults to [].
   */
  extensions?: Extensions;
  /**
   * Props to pass to the underlying Tiptap editor, in addition to the default Novel editor props.
   * Defaults to {}.
   */
  editorProps?: EditorProps;
  /**
   * A callback function that is called whenever the editor is updated.
   * Defaults to () => {}.
   */
  // eslint-disable-next-line no-unused-vars
  onUpdate?: (editor?: EditorClass) => void | Promise<void>;
  /**
   * A callback function that is called whenever the editor is updated, but only after the defined debounce duration.
   * Defaults to () => {}.
   */
  // eslint-disable-next-line no-unused-vars
  onDebouncedUpdate?: (editor?: EditorClass) => void | Promise<void>;
  /**
   * The duration (in milliseconds) to debounce the onDebouncedUpdate callback.
   * Defaults to 750.
   */
  debounceDuration?: number;
  /**
   * The ID of the lecture to use for the completion API.
   * Defaults to undefined.
   */
  lectureId?: string;
  /**
   * Whether or not the editor is editable.
   * Defaults to true.
   */
  editable?: boolean;
  /**
   * Whether or not the editor should be focused on mount.
   * Defaults to true.
   */
  autoFocus?: boolean;
  /**
   * The status of the last save.
   */
  saveStatus?: string;
  /**
   * id to pass to the editor
   */
  id?: string;
  /**
   * Whether to render the editor immediately or not
   */
  immediatelyRender?: boolean;
}) {
  const { setEditor } = useNotesStore();
  const [hydrated, setHydrated] = useState(false);

  const debouncedUpdates = useDebouncedCallback(async ({ editor }) => {
    onDebouncedUpdate(editor);
  }, debounceDuration);

  const editor = useEditor({
    editable,
    immediatelyRender,
    extensions: [...defaultExtensions, ...extensions],
    editorProps: {
      ...defaultEditorProps,
      ...editorProps,
    },
    onUpdate: (e) => {
      onUpdate(e.editor);
      debouncedUpdates(e);
    },
    autofocus: autoFocus ? "end" : false,
  });

  useEffect(() => {
    if (!editor || hydrated) return;
    if (defaultValue) editor.commands.setContent(defaultValue);
    setEditor(editor); // initialize the editor in the zustand store so we can use it in other components
    setHydrated(true);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, defaultValue, hydrated]);

  return (
    <div
      id={id}
      onClick={() => {
        editor?.chain().focus().run();
      }}
      className={className}
    >
      {editor && editable && <EditorBubbleMenu editor={editor} />}
      {editor?.isActive("image") && editable && (
        <ImageResizer editor={editor} />
      )}
      <EditorContent
        className="flex grow flex-col break-words"
        editor={editor}
      />
    </div>
  );
}

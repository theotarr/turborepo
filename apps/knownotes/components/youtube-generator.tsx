"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/trpc/react";

import { Icons } from "./icons";

interface YoutubeGeneratorProps {
  videoUrl: string;
}

const loadingStates = [
  "Processing YouTube video...",
  "Downloading video...",
  "Transcribing audio...",
  "Creating lecture...",
  "Redirecting...",
];

export function YoutubeGenerator({ videoUrl }: YoutubeGeneratorProps) {
  const router = useRouter();
  const uploadYoutube = api.lecture.uploadYoutube.useMutation();

  const [loadingState, setLoadingState] = useState(0);

  useEffect(() => {
    (async () => {
      const lecture = await uploadYoutube.mutateAsync({ videoUrl });
      router.push(`/lecture/${lecture.id}`);
      router.refresh();
    })();
  }, []);

  useEffect(() => {
    if (loadingState < loadingStates.length - 1) {
      setTimeout(() => setLoadingState(loadingState + 1), 5000); // 5 seconds
    }
  }, [loadingState]);

  return (
    <div className="flex h-screen flex-col items-center justify-center p-8">
      <Icons.spinner className="mb-4 size-6 animate-spin text-muted-foreground" />
      <p className="text-muted-foreground">{loadingStates[loadingState]}</p>
    </div>
  );
}

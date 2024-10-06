"use client";

import { useCallback, useEffect, useState } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { cn } from "@/lib/utils";
import { Transcript } from "@/types";
import {
  createClient,
  CreateProjectKeyResponse,
  LiveClient,
  LiveTranscriptionEvents,
} from "@deepgram/sdk";
import { useQueue } from "@uidotdev/usehooks";

import { LiveAudioVisualizer } from "./audio-visualizer";
import { Icons } from "./icons";
import { isNotesNull, useNotesStore, useTranscriptStore } from "./notes-page";
import { TranscriptList } from "./transcript";
import { Button, buttonVariants } from "./ui/button";
import { Card } from "./ui/card";

interface DictaphoneProps extends React.HTMLAttributes<HTMLButtonElement> {
  onCaption: (transcript: Transcript) => void;
  onInterimCaption?: (transcript: Transcript) => void;
  onGenerate?: () => void;
}

export const Dictaphone = ({
  onCaption,
  onInterimCaption,
  onGenerate,
}: DictaphoneProps) => {
  const { transcript, interim } = useTranscriptStore();
  const { enhancedNotes } = useNotesStore();
  const [isTranscriptOpen, setTranscriptOpen] = useState(false);
  const { add, remove, first, size, queue } = useQueue<any>([]);
  const [apiKey, setApiKey] = useState<CreateProjectKeyResponse | null>();
  const [connection, setConnection] = useState<LiveClient | null>();
  const [isListening, setListening] = useState(false);
  const [isLoadingKey, setIsLoadingKey] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setProcessing] = useState(false);
  const [micOpen, setMicOpen] = useState(false);
  const [microphone, setMicrophone] = useState<MediaRecorder | null>();
  const [userMedia, setUserMedia] = useState<MediaStream | null>();
  const isRecording = !!userMedia && !!microphone && micOpen;
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 });
  const [isLoadingGeneration, setIsLoadingGeneration] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [dismissedPopup, setDismissedPopup] = useState(false);

  const toggleMicrophone = useCallback(async () => {
    setDismissedPopup(false); // Reset the popup dismissal state when toggling the microphone.

    if (microphone && userMedia) {
      setUserMedia(null);
      setMicrophone(null);

      microphone.stop();
    } else {
      const userMedia = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const microphone = new MediaRecorder(userMedia);
      microphone.start(500);

      microphone.onstart = () => {
        setMicOpen(true);
      };

      microphone.onstop = () => {
        setMicOpen(false);
      };

      microphone.ondataavailable = (e) => {
        add(e.data);
      };

      setUserMedia(userMedia);
      setMicrophone(microphone);
    }
  }, [add, microphone, userMedia]);

  // Detect if someone is speaking.
  const detectSpeech = useCallback(() => {
    if (userMedia && !isRecording) {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(userMedia);
      microphone.connect(analyser);
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      function checkAudio() {
        analyser.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((a, b) => a + b, 0);
        const average = sum / bufferLength;

        if (average > 45) {
          // Adjust this threshold as needed
          setShowPopup(true);
        } else {
          // // Don't disable the popup if the speaking stops.
          // // We only hide the popup when the user starts recording or the popup is dismissed.
          // setShowPopup(false)
        }

        if (!isRecording) {
          requestAnimationFrame(checkAudio);
        }
      }

      checkAudio();
    }
  }, [userMedia, isRecording]);

  // Fetch a Deepgram API key.
  useEffect(() => {
    if (!apiKey) {
      fetch("/api/transcribe", { cache: "no-store" })
        .then((res) => res.json())
        .then((object) => {
          if (!("key" in object))
            throw new Error("No Deepgram api key returned");

          setApiKey(object);
          setIsLoadingKey(false);
        })
        .catch((e) => {
          console.error(`Deepgram error: ${e}`);
        });
    }
  }, [apiKey]);

  // Establish the live connection.
  useEffect(() => {
    if (apiKey && "key" in apiKey) {
      const deepgram = createClient(apiKey?.key ?? "");
      const connection = deepgram.listen.live({
        model: "nova-2-meeting",
        interim_results: true,
        smart_format: true,
      });

      connection.on(LiveTranscriptionEvents.Open, () => {
        setListening(true);
      });

      connection.on(LiveTranscriptionEvents.Close, () => {
        setListening(false);
        setApiKey(null);
        setConnection(null);
      });

      connection.on(LiveTranscriptionEvents.Transcript, (data) => {
        const words = data.channel.alternatives[0].words;
        const start = data.start as number;
        const final =
          (data.speech_final as boolean) || (data.is_final as boolean);
        const interim: string = words
          .map((word: any) => word.punctuated_word ?? word.word)
          .join(" ");
        interim !== "" &&
          onInterimCaption &&
          onInterimCaption({ start, text: interim });

        if (final && interim !== "") onCaption({ start, text: interim });
      });

      connection.on(LiveTranscriptionEvents.Error, (error) => {
        console.error(error);

        // This is a known issue.
        if (error.message === "Unable to parse `data` as JSON.") {
          console.log("Resetting connection...");
          // TODO: Reset the connection.
        }
      });

      setConnection(connection);
      setIsLoading(false);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  // Process the blob queue.
  useEffect(() => {
    const processQueue = async () => {
      // Checking for a size greater than 0 fixes a bug on iOS Safari where a size of 0 packet closes the connection.
      if (size > 0 && !isProcessing) {
        setProcessing(true);

        if (isListening) {
          const blob = first;
          connection?.send(blob);
          remove();
        }

        const waiting = setTimeout(() => {
          clearTimeout(waiting);
          setProcessing(false);
        }, 250);
      }
    };

    processQueue();
  }, [connection, queue, remove, first, size, isProcessing, isListening]);

  // Detect speech when the user media is available and not recording.
  useEffect(() => {
    if (userMedia && !isRecording) {
      detectSpeech();
    }
  }, [userMedia, isRecording, detectSpeech]);

  return (
    <>
      <TooltipProvider delayDuration={100} skipDelayDuration={100}>
        <div className="flex gap-1">
          <Card
            className={cn(
              "absolute -top-28 left-1/2 z-50 hidden w-44 -translate-x-1/2 bg-background p-4 shadow-lg transition-all",
              showPopup && !isRecording && !dismissedPopup && "block",
            )}
          >
            <Icons.close
              onClick={() => {
                setDismissedPopup(true);
                setShowPopup(false);
              }}
              className="absolute right-2 top-2 size-4"
            />

            <p className="text-sm font-medium text-secondary-foreground">
              Is there talking?
              {transcript.length > 0 ? (
                <>Click &quot;Resume&quot; to transcribe it.</>
              ) : (
                <>Click the mic to transcribe it.</>
              )}
            </p>
          </Card>
          <HoverCard open={isTranscriptOpen} onOpenChange={setTranscriptOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <HoverCardTrigger asChild>
                  <button
                    aria-label="Toggle microphone"
                    onClick={() => setTranscriptOpen(true)}
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "h-auto w-auto rounded-full border border-border p-2.5 shadow-lg",
                      isRecording || transcript.length > 0
                        ? "rounded-r pr-1.5"
                        : "hidden",
                    )}
                  >
                    {isRecording ? (
                      <LiveAudioVisualizer
                        mediaRecorder={microphone}
                        width={20}
                        height={24}
                        barWidth={1}
                        gap={1}
                        smoothingTimeConstant={0.95}
                      />
                    ) : (
                      <Icons.audioLines
                        className={cn("size-6 p-1 text-secondary-foreground")}
                      />
                    )}
                  </button>
                </HoverCardTrigger>
              </TooltipTrigger>
              <HoverCardContent
                side="top"
                className="relative z-[100] max-h-72 w-96 overflow-x-hidden overflow-y-scroll"
              >
                <div className="fixed inset-x-0 top-0 z-10 rounded-t-md border border-border bg-background">
                  <div className="h-full w-full py-2 text-sm font-medium tracking-tight text-secondary-foreground">
                    <div className="relative text-center">
                      Transcript
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            onClick={() =>
                              copyToClipboard(
                                transcript
                                  .map((t) => t.text)
                                  .join("\n")
                                  .trim(),
                              )
                            }
                            className="absolute -top-0.5 right-2 h-auto w-auto p-1"
                          >
                            {isCopied ? (
                              <Icons.check className="size-4" />
                            ) : (
                              <Icons.copy className="size-4" />
                            )}
                            <span className="sr-only">Copy message</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {isCopied ? "Copied!" : "Copy transcript"}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
                <TranscriptList
                  className="mx-0 mt-8 w-full overflow-hidden px-0"
                  transcript={transcript}
                  interim={interim}
                />
              </HoverCardContent>
              <TooltipContent>View transcript</TooltipContent>
            </Tooltip>
          </HoverCard>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                aria-label="Toggle microphone"
                onClick={toggleMicrophone}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-auto w-auto rounded-full border border-border p-2.5 shadow-lg",
                  isRecording || transcript.length > 0 ? "hidden" : "",
                )}
              >
                <Icons.mic
                  className={cn("size-8 p-1 text-secondary-foreground")}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent>Start recording</TooltipContent>
          </Tooltip>
          <Tooltip>
            {isRecording || transcript.length > 0 ? (
              <TooltipTrigger asChild>
                <button
                  aria-label="Toggle microphone"
                  onClick={toggleMicrophone}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "h-auto w-auto rounded-r-full border border-border p-2.5 pl-1.5 shadow-lg",
                  )}
                >
                  {isRecording ? (
                    <Icons.square className="size-6 fill-secondary-foreground p-1 text-secondary-foreground" />
                  ) : (
                    <p className="py-0.5 pl-1 text-sm font-medium text-secondary-foreground">
                      Resume
                    </p>
                  )}
                </button>
              </TooltipTrigger>
            ) : (
              <></>
            )}
            {isRecording ? (
              <TooltipContent>Stop recording</TooltipContent>
            ) : (
              <></>
            )}
          </Tooltip>
          {!isRecording && transcript.length > 0 && (
            <>
              {isNotesNull(enhancedNotes) ? (
                <button
                  aria-label="Generate notes"
                  onClick={() => {
                    setIsLoadingGeneration(true);
                    onGenerate && onGenerate();
                    setIsLoadingGeneration(false);
                  }}
                  className={cn(
                    buttonVariants({ variant: "default" }),
                    "h-auto w-auto rounded-full shadow-lg",
                  )}
                  disabled={isLoadingGeneration}
                >
                  <Icons.magic className="size-6 pr-1 text-accent" />
                  Generate notes
                </button>
              ) : (
                <button
                  aria-label="Regenerate notes"
                  onClick={() => {
                    setIsLoadingGeneration(true);
                    onGenerate && onGenerate();
                    setIsLoadingGeneration(false);
                  }}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "h-auto w-auto rounded-full border border-border shadow-lg",
                  )}
                  disabled={isLoadingGeneration}
                >
                  <Icons.magic className="size-6 pr-1" />
                  Regenerate notes
                </button>
              )}
            </>
          )}
        </div>
      </TooltipProvider>
    </>
  );
};

Dictaphone.Skeleton = function DictaphoneSkeleton() {
  return (
    <>
      <div
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-auto w-auto rounded-full border border-border p-2.5 shadow-lg",
        )}
      >
        <Icons.mic className={cn("size-8 p-1 text-secondary-foreground")} />
      </div>
    </>
  );
};

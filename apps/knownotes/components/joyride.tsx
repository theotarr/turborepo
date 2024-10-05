"use client"

import Joyride, {
  ACTIONS,
  CallBackProps,
  EVENTS,
  STATUS,
  Step,
} from "react-joyride"
import { useMount, useSetState } from "react-use"

import { useTabStore } from "./notes-page"

interface State {
  run: boolean
  steps: Step[]
  stepIndex: number
}

export const JoyrideComponent = () => {
  const { setActiveTab } = useTabStore()
  const [{ run, steps, stepIndex }, setState] = useSetState<State>({
    run: false,
    stepIndex: 0,
    steps: [],
  })

  useMount(() => {
    setState({
      run: localStorage.getItem("joyride") === "false" ? false : true,
      steps: [
        {
          disableBeacon: true,
          spotlightClicks: true,
          target: "#first-dictaphone",
          content: (
            <>
              Click here to start transcribing your lecture, and we&apos;ll
              automatically start taking notes for you.{" "}
              <b>
                Important Note: Keep this tab open at all times to keep your
                microphone recording.
              </b>{" "}
              You can make a new window to keep this tab open in the background.
            </>
          ),
        },
        {
          spotlightClicks: true,
          target: "#second-transcript",
          content: "This is where your transcript will appear.",
        },
        {
          spotlightClicks: true,
          target: "#third-notes",
          content:
            "We'll automatically generate notes for your lecture here, and you can edit them yourself.",
        },
        {
          styles: {
            options: {
              zIndex: 10000,
            },
          },
          disableBeacon: true,
          spotlightClicks: true,
          hideCloseButton: true,
          target: "#fourth-chat",
          placement: "bottom",
          content:
            "You can ask any questions you have here, and we'll answer them for you based on what your teacher is saying.",
        },
      ],
    })
  })

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, index, action, type } = data
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED]

    if (finishedStatuses.includes(status)) {
      setState({ run: false, stepIndex: 0 })
      localStorage.setItem("joyride", JSON.stringify(false))
    } else if (
      ([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND] as string[]).includes(type)
    ) {
      const nextStepIndex = index + (action === ACTIONS.PREV ? -1 : 1)

      if (
        (action === "next" && index === 1) ||
        (action === "prev" && index === 2)
      )
        setActiveTab("notes")
      else if (action === "next" && index === 2) setActiveTab("chat")

      setTimeout(() => setState({ run: true, stepIndex: nextStepIndex }), 200)
    }
  }

  return (
    <Joyride
      stepIndex={stepIndex}
      run={run}
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton
      showProgress
      steps={steps}
      styles={{
        options: {
          arrowColor: "hsl(var(--background))",
          backgroundColor: "hsl(var(--background))",
          overlayColor: "rgb(0 0 0 / 0.8)",
          primaryColor: "hsl(var(--primary))",
          textColor: "hsl(var(--secondary-foreground))",
        },
      }}
    />
  )
}

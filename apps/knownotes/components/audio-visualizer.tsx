import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from "react"

interface CustomCanvasRenderingContext2D extends CanvasRenderingContext2D {
  roundRect: (
    x: number,
    y: number,
    w: number,
    h: number,
    radius: number
  ) => void
}

export const calculateBarData = (
  frequencyData: Uint8Array,
  width: number,
  barWidth: number,
  gap: number
): number[] => {
  let units = width / (barWidth + gap)
  let step = Math.floor(frequencyData.length / units)

  if (units > frequencyData.length) {
    units = frequencyData.length
    step = 1
  }

  const data: number[] = []

  for (let i = 0; i < units; i++) {
    let sum = 0

    for (let j = 0; j < step && i * step + j < frequencyData.length; j++) {
      sum += frequencyData[i * step + j]
    }
    data.push(sum / step)
  }

  const max = Math.max(...data)

  const waveArray: number[] = new Array(data.length).fill(0)
  const midIndex = Math.floor(data.length / 2)

  // Helper function to add noise
  const addNoise = (value: number): number => {
    const noiseFactor = Math.random() * 0.3 - 0.15 // ±15%
    return Math.round(value + value * noiseFactor)
  }

  // Place the number in the middle with noise
  waveArray[midIndex] = max

  // Create the wave on the left side with noise
  for (
    let i = midIndex - 1, waveValue = max - 1;
    i >= 0;
    i--, waveValue = waveValue * 0.75
  ) {
    waveArray[i] = waveValue > 0 ? addNoise(waveValue) : 0
  }

  // Create the wave on the right side with noise
  for (
    let i = midIndex + 1, waveValue = max - 1;
    i < data.length;
    i++, waveValue = waveValue * 0.75
  ) {
    waveArray[i] = waveValue > 0 ? addNoise(waveValue) : 0
  }

  return waveArray
}

export const draw = (
  data: number[],
  canvas: HTMLCanvasElement,
  barWidth: number,
  gap: number,
  backgroundColor: string,
  barColor: string
): void => {
  const amp = canvas.height / 2

  const ctx = canvas.getContext("2d") as CustomCanvasRenderingContext2D
  if (!ctx) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  if (backgroundColor !== "transparent") {
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  // Scale the data to fit the canvas height
  const scale = (amp / 255) * 2 // 255 is the max of a Uint8Array but we want to scale it a bit more

  data.forEach((dp, i) => {
    ctx.fillStyle = barColor

    dp = dp + 10

    const x = i * (barWidth + gap)
    const y = amp - dp * scale
    const w = barWidth
    const h = dp * scale * 2

    ctx.beginPath()
    if (ctx.roundRect) {
      // making sure roundRect is supported by the browser
      ctx.roundRect(x, y, w, h, 50)
      ctx.fill()
    } else {
      // fallback for browsers that do not support roundRect
      ctx.fillRect(x, y, w, h)
    }
  })
}

export interface Props {
  /**
   * Media recorder who's stream needs to visualized
   */
  mediaRecorder: MediaRecorder
  /**
   * Width of the visualization. Default" "100%"
   */
  width?: number | string
  /**
   * Height of the visualization. Default" "100%"
   */
  height?: number | string
  /**
   * Width of each individual bar in the visualization. Default: `2`
   */
  barWidth?: number
  /**
   * Gap between each bar in the visualization. Default `1`
   */
  gap?: number
  /**
   * BackgroundColor for the visualization: Default `transparent`
   */
  backgroundColor?: string
  /**
   *  Color of the bars drawn in the visualization. Default: `"rgb(160, 198, 255)"`
   */
  barColor?: string
  /**
   * An unsigned integer, representing the window size of the FFT, given in number of samples.
   * A higher value will result in more details in the frequency domain but fewer details in the amplitude domain.
   * For more details {@link https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/fftSize MDN AnalyserNode: fftSize property}
   * Default: `1024`
   */
  fftSize?:
    | 32
    | 64
    | 128
    | 256
    | 512
    | 1024
    | 2048
    | 4096
    | 8192
    | 16384
    | 32768
  /**
   * A double, representing the maximum decibel value for scaling the FFT analysis data
   * For more details {@link https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/maxDecibels MDN AnalyserNode: maxDecibels property}
   * Default: `-10`
   */
  maxDecibels?: number
  /**
   * A double, representing the minimum decibel value for scaling the FFT analysis data, where 0 dB is the loudest possible sound
   * For more details {@link https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/minDecibels MDN AnalyserNode: minDecibels property}
   * Default: `-90`
   */
  minDecibels?: number
  /**
   * A double within the range 0 to 1 (0 meaning no time averaging). The default value is 0.8.
   * If 0 is set, there is no averaging done, whereas a value of 1 means "overlap the previous and current buffer quite a lot while computing the value",
   * which essentially smooths the changes across
   * For more details {@link https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/smoothingTimeConstant MDN AnalyserNode: smoothingTimeConstant property}
   * Default: `0.4`
   */
  smoothingTimeConstant?: number
}

const LiveAudioVisualizer: (props: Props) => ReactElement = ({
  mediaRecorder,
  width = "100%",
  height = "100%",
  barWidth = 2,
  gap = 1,
  backgroundColor = "transparent",
  barColor = "hsl(221.2 83.2% 53.3%)",
  fftSize = 1024,
  maxDecibels = -10,
  minDecibels = -90,
  smoothingTimeConstant = 0.4,
}: Props) => {
  const [context] = useState(() => new AudioContext())
  const [analyser, setAnalyser] = useState<AnalyserNode>()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!mediaRecorder.stream) return

    const analyserNode = context.createAnalyser()
    setAnalyser(analyserNode)
    analyserNode.fftSize = fftSize
    analyserNode.minDecibels = minDecibels
    analyserNode.maxDecibels = maxDecibels
    analyserNode.smoothingTimeConstant = smoothingTimeConstant
    const source = context.createMediaStreamSource(mediaRecorder.stream)
    source.connect(analyserNode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaRecorder.stream])

  useEffect(() => {
    if (analyser && mediaRecorder.state === "recording") {
      report()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analyser, mediaRecorder.state])

  const report = useCallback(() => {
    if (!analyser) return

    const data = new Uint8Array(analyser?.frequencyBinCount)

    if (mediaRecorder.state === "recording") {
      analyser?.getByteFrequencyData(data)
      processFrequencyData(data)
      requestAnimationFrame(report)
    } else if (mediaRecorder.state === "paused") {
      processFrequencyData(data)
    } else if (
      mediaRecorder.state === "inactive" &&
      context.state !== "closed"
    ) {
      context.close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analyser, context.state])

  const processFrequencyData = (data: Uint8Array): void => {
    if (!canvasRef.current) return

    const dataPoints = calculateBarData(
      data,
      canvasRef.current.width,
      barWidth,
      gap
    )
    draw(
      dataPoints,
      canvasRef.current,
      barWidth,
      gap,
      backgroundColor,
      barColor
    )
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        aspectRatio: "unset",
      }}
    />
  )
}

export { LiveAudioVisualizer }

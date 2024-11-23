import { h } from "preact"
import { useState, useEffect, useRef } from "preact/hooks"

const Popup = () => {
  const [goal, setGoal] = useState("")
  const [duration, setDuration] = useState(25) // Default duration in minutes
  const [tracking, setTracking] = useState(false)
  const [endTime, setEndTime] = useState<number | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(0)

  console.log("timeRemaining: ", timeRemaining, "endTime: ", endTime)

  // Refs to store the timeout ID and next expected tick time
  const timeoutIdRef = useRef<number | null>(null)
  const nextTickRef = useRef<number>(0)

  useEffect(() => {
    // Read from chrome.storage.session when the component mounts
    chrome.storage.session.get(["isTracking", "endTime", "goal"], (result) => {
      setTracking(result.isTracking || false)
      setEndTime(result.endTime || null)
      setGoal(result.goal || "")
    })
  }, [])

  useEffect(() => {
    function tick() {
      if (tracking && endTime) {
        const now = Date.now()
        const remaining = endTime - now

        if (remaining <= 0) {
          setTracking(false)
          setEndTime(null)
          setTimeRemaining(0)

          if (timeoutIdRef.current !== null) {
            clearTimeout(timeoutIdRef.current)
            timeoutIdRef.current = null
          }
        } else {
          setTimeRemaining(remaining)

          nextTickRef.current += 1000
          const delay = nextTickRef.current - Date.now()

          const nextDelay = Math.max(0, delay)
          timeoutIdRef.current = window.setTimeout(tick, nextDelay)
        }
      }
    }

    if (tracking && endTime) {
      const now = Date.now()
      nextTickRef.current = now - (now % 1000) + 1000

      tick()
    }

    return () => {
      if (timeoutIdRef.current !== null) {
        clearTimeout(timeoutIdRef.current)
        timeoutIdRef.current = null
      }
    }
  }, [tracking, endTime])

  const handleStart = () => {
    const durationMs = duration * 60 * 1000
    const newEndTime = Date.now() + durationMs

    setTracking(true)
    setEndTime(newEndTime)
    setTimeRemaining(durationMs)

    // Notify background script to start tracking
    chrome.runtime.sendMessage({ action: "INITIATE_TRACKING", goal })

    // Store in chrome.storage.session
    chrome.storage.session.set({
      isTracking: true,
      endTime: newEndTime,
      goal,
    })

    // Create the alarm
    chrome.alarms.create("trackingTimer", { when: newEndTime })
  }

  const handleStop = () => {
    setTracking(false)
    setEndTime(null)
    setTimeRemaining(0)

    // Clear the alarm
    chrome.alarms.clear("trackingTimer")

    // Update storage
    chrome.storage.session.set({
      isTracking: false,
      endTime: null,
    })

    // Notify background script to stop tracking
    chrome.runtime.sendMessage({ action: "TERMINATE_TRACKING" })
  }

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.max(0, Math.round(milliseconds / 1000))
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0")
    const seconds = (totalSeconds % 60).toString().padStart(2, "0")
    return `${minutes}:${seconds}`
  }

  return (
    <div className="p-4 w-64">
      <h1 className="text-xl font-bold mb-4">Locked In</h1>
      <input
        type="text"
        className="w-full p-2 border border-gray-300 rounded mb-2"
        placeholder="Enter your goal..."
        value={goal}
        onChange={(e) => setGoal((e.target as HTMLInputElement).value)}
        disabled={tracking}
      />
      <input
        type="number"
        className="w-full p-2 border border-gray-300 rounded mb-4"
        placeholder="Duration (minutes)"
        value={duration}
        onChange={(e) =>
          setDuration(parseInt((e.target as HTMLInputElement).value) || 0)
        }
        disabled={tracking}
        min={1}
      />
      {!tracking ? (
        <button
          className="w-full bg-blue-500 text-white py-2 rounded"
          onClick={handleStart}
          disabled={!goal || duration <= 0}
        >
          Start
        </button>
      ) : (
        <div>
          <button
            className="w-full bg-red-500 text-white py-2 rounded mb-2"
            onClick={handleStop}
          >
            Stop
          </button>
          <p className="text-center">
            Time Remaining: {formatTime(timeRemaining)}
          </p>
        </div>
      )}
    </div>
  )
}

export default Popup

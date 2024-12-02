import { h } from "preact"
import { useState, useEffect, useRef } from "preact/hooks"
import {
  PlayIcon,
  StopIcon,
  ClipboardListIcon,
  ClockIcon,
  InformationCircleIcon,
  ChartBarIcon,
} from "@heroicons/react/solid"
import { TRACKING_MODES } from "../constants"

const Popup = () => {
  const [goal, setGoal] = useState("")
  const [duration, setDuration] = useState(25) // Default duration in minutes
  const [tracking, setTracking] = useState(false)
  const [endTime, setEndTime] = useState<number | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [mode, setMode] = useState(TRACKING_MODES.BROAD) // Added mode state

  const timeoutIdRef = useRef<number | null>(null)
  const nextTickRef = useRef<number>(0)

  useEffect(() => {
    chrome.storage.session.get(
      ["isTracking", "endTime", "goal", "mode"],
      (result) => {
        setTracking(result.isTracking || false)
        setEndTime(result.endTime || null)
        setGoal(result.goal || "")
        setMode(result.mode || TRACKING_MODES.BROAD) // Retrieve stored mode
      },
    )
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
    chrome.runtime.sendMessage({ action: "INITIATE_TRACKING", goal, mode })

    // Store in chrome.storage.session
    chrome.storage.session.set({
      isTracking: true,
      endTime: newEndTime,
      goal,
      mode, // Store the selected mode
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

  const handleOpenGuide = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("src/guide/index.html") })
  }

  const handleOpenStats = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("src/stats/index.html") })
  }

  return (
    <div className="p-4 w-72 bg-white text-black rounded-lg shadow-lg font-sans">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-center">Locked In</h1>
        <div className="flex space-x-2">
          <button onClick={handleOpenStats} className="focus:outline-none">
            <ChartBarIcon className="h-6 w-6 text-blue-800" />
          </button>
          <button onClick={handleOpenGuide} className="focus:outline-none">
            <InformationCircleIcon className="h-6 w-6 text-blue-800" />
          </button>
        </div>
      </div>
      {!tracking ? (
        <div>
          <div className="mb-3">
            <label className="block text-base font-medium mb-1">
              What's your goal?
            </label>
            <div className="relative">
              <input
                type="text"
                className="w-full p-2 pl-10 rounded-md border border-gray-300 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Learn web development"
                value={goal}
                onChange={(e) => setGoal((e.target as HTMLInputElement).value)}
                disabled={tracking}
                style={{ fontSize: "16px" }}
              />
              <ClipboardListIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-base font-medium mb-1">
              Duration (minutes)
            </label>
            <div className="relative">
              <input
                type="number"
                className="w-full p-2 pl-10 rounded-md border border-gray-300 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="25"
                value={duration}
                onChange={(e) =>
                  setDuration(
                    parseInt((e.target as HTMLInputElement).value) || 0,
                  )
                }
                disabled={tracking}
                min={1}
                style={{ fontSize: "16px" }}
              />
              <ClockIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-base font-medium mb-1">
              Tracking Mode
            </label>
            <select
              value={mode}
              onChange={(e) => setMode((e.target as HTMLSelectElement).value)}
              className="w-full p-2 rounded-md border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={tracking}
              style={{ fontSize: "16px" }}
            >
              <option value={TRACKING_MODES.BROAD}>Broad</option>
              <option value={TRACKING_MODES.SPECIFIC}>Specific</option>
            </select>
          </div>

          <div className="flex justify-center">
            <button
              className={`px-3 py-2 rounded-md text-base font-semibold flex items-center justify-center transition-all duration-300 ${
                !goal || duration <= 0
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600 transform hover:-translate-y-0.5"
              }`}
              onClick={handleStart}
              disabled={!goal || duration <= 0}
            >
              <PlayIcon className="h-5 w-5 mr-1" />
              Start Tracking
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-base font-medium mb-2 text-center">
            Current Goal:
          </p>
          <p className="text-lg font-semibold mb-2 text-center text-blue-600">
            {goal}
          </p>
          <p className="text-base font-medium mb-2 text-center">
            Tracking Mode:
          </p>
          <p className="text-lg font-semibold mb-4 text-center text-blue-600">
            {mode}
          </p>
          <div className="mb-4">
            <p className="text-base font-medium mb-1 text-center">
              Time Remaining:
            </p>
            <p className="text-4xl font-bold text-center">
              {formatTime(timeRemaining)}
            </p>
          </div>
          <div className="flex justify-center">
            <button
              className="px-3 py-2 rounded-md bg-red-500 text-white text-base font-semibold flex items-center justify-center hover:bg-red-600 transition-all duration-300 transform hover:-translate-y-0.5"
              onClick={handleStop}
            >
              <StopIcon className="h-5 w-5 mr-1" />
              Stop Tracking
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Popup

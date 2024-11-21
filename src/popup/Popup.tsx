import { h } from "preact"
import { useState } from "preact/hooks"
import "../styles/tailwind.css"

const Popup = () => {
  const [goal, setGoal] = useState("")
  const [tracking, setTracking] = useState(false)

  const handleStart = () => {
    setTracking(true)
    chrome.runtime.sendMessage({ action: "INITIATE_TRACKING", goal })
  }

  const handleStop = () => {
    setTracking(false)
    chrome.runtime.sendMessage({ action: "TERMINATE_TRACKING" })
  }

  return (
    <div className="p-4 w-64">
      <h1 className="text-xl font-bold mb-4">Locked In</h1>
      <input
        type="text"
        className="w-full p-2 border border-gray-300 rounded mb-4"
        placeholder="Enter your goal..."
        value={goal}
        onChange={(e) => setGoal((e.target as HTMLInputElement).value)}
        disabled={tracking}
      />
      {!tracking ? (
        <button
          className="w-full bg-blue-500 text-white py-2 rounded"
          onClick={handleStart}
          disabled={!goal}
        >
          Start
        </button>
      ) : (
        <button
          className="w-full bg-red-500 text-white py-2 rounded"
          onClick={handleStop}
        >
          Stop
        </button>
      )}
    </div>
  )
}

export default Popup

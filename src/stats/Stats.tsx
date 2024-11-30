import { h } from "preact"
import { useState, useEffect, useRef } from "preact/hooks"
import Chart from "chart.js/auto"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import { SessionDataType } from "../types"

dayjs.extend(utc)

const Stats = () => {
  const [dataRange, setDataRange] = useState<"week" | "month">("week")
  const [chartData, setChartData] = useState<(number | null)[]>([])
  const [chartLabels, setChartLabels] = useState<string[]>([])
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstanceRef = useRef<Chart | null>(null)

  useEffect(() => {
    chrome.storage.local.get(["sessions"], (result) => {
      const sessions: SessionDataType[] = result.sessions || []
      const processedData = processSessionData(sessions, dataRange)
      setChartData(processedData.data)
      setChartLabels(processedData.labels)
    })
  }, [dataRange])

  useEffect(() => {
    if (chartRef.current) {
      const canvas = chartRef.current
      const ctx = canvas.getContext("2d")
      if (ctx) {
        // Destroy previous chart instance if it exists
        if (chartInstanceRef.current) {
          chartInstanceRef.current.destroy()
        }

        // Reset canvas size to prevent Chart.js from setting unwanted inline styles
        canvas.width = 0
        canvas.height = 0

        chartInstanceRef.current = new Chart(ctx, {
          type: "line",
          data: {
            labels: chartLabels,
            datasets: [
              {
                label: "Distractions per Hour",
                data: chartData,
                fill: false,
                borderColor: "rgb(75, 192, 192)",
                tension: 0.1,
                spanGaps: true,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                title: {
                  display: true,
                  text: "Date",
                },
              },
              y: {
                title: {
                  display: true,
                  text: "Distractions per Hour",
                },
                beginAtZero: true,
              },
            },
            plugins: {
              legend: {
                display: false,
              },
              tooltip: {
                callbacks: {
                  label: function (context) {
                    const value = context.parsed.y
                    return value !== null
                      ? `Distractions per Hour: ${value.toFixed(2)}`
                      : "No data"
                  },
                },
              },
            },
          },
        })
      }
    }

    // Cleanup function to destroy chart when component unmounts
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy()
        chartInstanceRef.current = null
      }
    }
  }, [chartData, chartLabels])

  const handleRangeChange = (range: "week" | "month") => {
    setDataRange(range)
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100 text-gray-800 font-sans">
      <header className="bg-blue-800 py-5">
        <div className="container mx-auto px-6">
          <h1 className="text-2xl font-bold text-white text-center">
            Locked In - Statistics
          </h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <div className="container mx-auto px-6 pt-6">
          <div className="mb-3 flex justify-center">
            <button
              className={`px-4 py-2 mr-2 ${
                dataRange === "week"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-800"
              } rounded text-base font-medium`}
              onClick={() => handleRangeChange("week")}
            >
              Last Week
            </button>
            <button
              className={`px-4 py-2 ${
                dataRange === "month"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-800"
              } rounded text-base font-medium`}
              onClick={() => handleRangeChange("month")}
            >
              Last Month
            </button>
          </div>
        </div>

        <div className="w-[90%] max-h-[85%] mx-auto flex-1">
          <canvas ref={chartRef}></canvas>
        </div>
      </main>
    </div>
  )
}

function processSessionData(
  sessions: SessionDataType[],
  range: "week" | "month",
) {
  const now = dayjs()
  const daysToSubtract = range === "week" ? 6 : 29
  const startDate = now.subtract(daysToSubtract, "day").startOf("day")
  const dateMap: {
    [date: string]: { distractions: number; duration: number }
  } = {}

  for (let i = 0; i <= daysToSubtract; i++) {
    const date = startDate.add(i, "day").format("YYYY-MM-DD")
    dateMap[date] = { distractions: 0, duration: 0 }
  }

  sessions.forEach((session) => {
    // Parse session time in UTC and convert to local time
    const sessionDate = dayjs
      .utc(session.startTime)
      .local()
      .format("YYYY-MM-DD")
    if (sessionDate in dateMap) {
      dateMap[sessionDate].distractions += session.distractions
      dateMap[sessionDate].duration += session.durationMs || 0
    }
  })

  const labels: string[] = []
  const data: (number | null)[] = []

  for (let i = 0; i <= daysToSubtract; i++) {
    // Labels are in local timezone
    const date = startDate.add(i, "day").format("YYYY-MM-DD")
    labels.push(date)

    const durationHours = dateMap[date].duration / (1000 * 60 * 60)
    const distractions = dateMap[date].distractions
    const distractionsPerHour =
      durationHours > 0 ? distractions / durationHours : null
    data.push(distractionsPerHour)
  }

  return { labels, data }
}

export default Stats

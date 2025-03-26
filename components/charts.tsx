"use client"

import { Bar, Line, Pie } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend)

// Line Chart Component
export function LineChart() {
  const data = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Attendance Rate",
        data: [75, 82, 78, 85, 90, 92],
        borderColor: "hsl(var(--primary))",
        backgroundColor: "hsl(var(--primary) / 0.1)",
        tension: 0.3,
        fill: true,
      },
    ],
  }

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  }

  return (
    <div style={{ height: "300px" }}>
      <Line data={data} options={options} />
    </div>
  )
}

// Bar Chart Component
export function BarChart() {
  const data = {
    labels: ["City General", "University Medical", "Children's", "Memorial", "Community"],
    datasets: [
      {
        label: "Attendance Count",
        data: [65, 59, 80, 81, 56],
        backgroundColor: "hsl(var(--primary) / 0.8)",
      },
    ],
  }

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }

  return (
    <div style={{ height: "300px" }}>
      <Bar data={data} options={options} />
    </div>
  )
}

// Pie Chart Component
export function PieChart() {
  const data = {
    labels: ["Cardiology", "Neurology", "Pediatrics", "Orthopedics", "Emergency"],
    datasets: [
      {
        label: "Students",
        data: [30, 25, 20, 15, 10],
        backgroundColor: [
          "hsl(var(--primary) / 0.8)",
          "hsl(var(--primary) / 0.6)",
          "hsl(var(--primary) / 0.4)",
          "hsl(var(--primary) / 0.3)",
          "hsl(var(--primary) / 0.2)",
        ],
        borderColor: [
          "hsl(var(--background))",
          "hsl(var(--background))",
          "hsl(var(--background))",
          "hsl(var(--background))",
          "hsl(var(--background))",
        ],
        borderWidth: 1,
      },
    ],
  }

  const options: ChartOptions<"pie"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right" as const,
      },
    },
  }

  return (
    <div style={{ height: "300px" }}>
      <Pie data={data} options={options} />
    </div>
  )
}


import { useEffect, useState } from "react";
import api from "../../services/api";
import socket from "../../socket";
import { useAuth } from "../../context/AuthContext";
import "./Dashboard.css";
import Widget from "../../components/Dashboard/Widget";
import SkeletonCard from "../../components/Dashboard/SkeletonCard";

import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

import { Bar } from "react-chartjs-2";

import {
  Calendar,
  FileText,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [leaves, setLeaves] = useState([]);
  const [balance, setBalance] = useState(null);
  const [managerOnline, setManagerOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);

  const managerId = user?.manager;

  // ------------------------
  // Fetch Data
  // ------------------------

  const fetchLeaves = async () => {
    try {
      const res = await api.get("/leave/my");
      setLeaves(res.data);
    } catch (err) {
      console.error(err);
    }
  };
  const fetchBalance = async () => {
    const res = await api.get("/auth/me");
    setBalance(res.data.leaveBalance);
  };

  const fetchManagerStatus = async () => {
    if (!managerId) return;
    const res = await api.get(`/status/${managerId}`);
    setManagerOnline(res.data.online);
    setLastSeen(res.data.lastSeen);
  };
  useEffect(() => {
    if (!user) return;

    const load = async () => {
      await Promise.all([fetchLeaves(), fetchBalance(), fetchManagerStatus()]);
      setLoading(false);
    };

    load();
  }, [user]);

  // ------------------------
  // Socket realtime manager status
  // ------------------------

  useEffect(() => {
    if (!managerId) return;

    socket.connect();

    socket.on("status-update", (data) => {
      if (String(data.userId) === String(managerId)) {
        setManagerOnline(data.online);
        setLastSeen(data.lastSeen);
      }
    });

    return () => {
      socket.off("status-update");
      socket.disconnect();
    };
  }, [managerId]);

  // ------------------------
  // Chart
  // ------------------------

  const casualUsed = balance ? balance.casual?.used || 0 : 0;
  const casualTotal = balance ? balance.casual?.total || 0 : 0;

  const sickUsed = balance ? balance.sick?.used || 0 : 0;
  const sickTotal = balance ? balance.sick?.total || 0 : 0;

  const emergencyUsed = balance ? balance.emergency?.used || 0 : 0;
  const emergencyTotal = balance ? balance.emergency?.total || 0 : 0;

  const otherUsed = balance ? balance.other?.used || 0 : 0;
  const otherTotal = balance ? balance.other?.total || 0 : 0;

  const casualRemaining = casualTotal - casualUsed;
  const sickRemaining = sickTotal - sickUsed;
  const emergencyRemaining = emergencyTotal - emergencyUsed;
  const otherRemaining = otherTotal - otherUsed;

  const chartData = {
  labels: ["Casual", "Sick", "Emergency", "Other"],
  datasets: [
    {
      label: "Used",
      data: [casualUsed, sickUsed, emergencyUsed, otherUsed],
      backgroundColor: "#ef4444",
      borderRadius: 6,
      stack: "leave"
    },
    {
      label: "Remaining",
      data: [
        casualRemaining,
        sickRemaining,
        emergencyRemaining,
        otherRemaining
      ],
      backgroundColor: "#10b981",
      borderRadius: 6,
      stack: "leave"
    }
  ]
};

<<<<<<< HEAD
const isDark = document.body.classList.contains("dark");

const chartOptions = {
  responsive:true,
  plugins:{
    legend:{
      labels:{
        color:isDark ? "#e2e8f0" : "#334155"
      }
    }
  },
  scales:{
    x:{
      ticks:{ color:isDark ? "#e2e8f0" : "#334155" },
      grid:{ color:isDark ? "#334155" : "#e2e8f0" }
    },
    y:{
      ticks:{ color:isDark ? "#e2e8f0" : "#334155" },
      grid:{ color:isDark ? "#334155" : "#e2e8f0" }
=======
  const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,

  plugins: {
    legend: {
      position: "top"
    }
  },

  scales: {
    x: {
      stacked: true
    },
    y: {
      stacked: true,
      beginAtZero: true,
      ticks: {
        stepSize: 1
      }
>>>>>>> 4f7ecac (update backend)
    }
  }
};
  // ------------------------
  // Helpers
  // ------------------------

  const formatDate = (d) => new Date(d).toLocaleDateString();

  const formatLastSeen = (t) => {
    if (!t) return "Unknown";
    const date = new Date(t);
    return date.toLocaleString();
  };

  const getStatus = (status) => {
    if (status === "approved")
      return (
        <span className="badge badge-success">
          <CheckCircle size={12} /> Approved
        </span>
      );

    if (status === "rejected")
      return (
        <span className="badge badge-danger">
          <XCircle size={12} /> Rejected
        </span>
      );

    return (
      <span className="badge badge-warning">
        <AlertCircle size={12} /> Pending
      </span>
    );
  };

  const words = [
    "Innovative",
    "Productive",
    "Focused",
    "Consistent",
    "Building",
  ];

  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % words.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const word = words[wordIndex];

  // ------------------------
  // Dashboard UI
  // ------------------------

  return (
    <div className="employee-dashboard">
      {/* Header */}
      <div className="dashboard-header motivation-header">
        <div className="motivation-wrapper">
          <span className="motivation-label">Today you are</span>
          <span className="motivation-text">{word}</span>
        </div>
      </div>
      {/* KPI Cards */}
      <div className="stats-grid">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            {balance && (
              <Widget
                icon={<Calendar size={22} />}
                title="Leave Balance"
                value={
                  (balance.casual?.total || 0) + (balance.sick?.total || 0)
                }
                subtitle="Days remaining"
              />
            )}

            <Widget
              icon={<FileText size={22} />}
              title="Total Leaves"
              value={leaves.length}
              subtitle="Applied this year"
            />

            <Widget
              icon={<Users size={22} />}
              title="Manager Status"
              value={
                managerOnline ? (
                  <span className="status-online">● Online</span>
                ) : (
                  <span className="status-offline">● Offline</span>
                )
              }
              subtitle={lastSeen ? `Last seen ${formatLastSeen(lastSeen)}` : ""}
            />
          </>
        )}
      </div>

      {/* Analytics */}

      <div className="card">
        <div className="card-header">
          <h3>Leave Usage</h3>
        </div>

        <div className="card-body chart-container">
        <Bar key={isDark ? "dark" : "light"} data={chartData} options={chartOptions}/>
        </div>
      </div>

      {/* Recent Leaves */}

      <div className="card">
        <div className="card-header">
          <h3>Recent Leaves</h3>
        </div>

        <div className="card-body">
          {leaves.length === 0 ? (
            <p>No leaves applied yet.</p>
          ) : (
            <table className="recent-table">
              <thead>
                <tr>
                  <th>From</th>
                  <th>To</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {leaves.slice(0, 5).map((leave) => (
                  <tr key={leave._id}>
                    <td>{formatDate(leave.fromDate)}</td>
                    <td>{formatDate(leave.toDate)}</td>
                    <td className="leave-type">{leave.leaveType}</td>
                    <td>{getStatus(leave.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

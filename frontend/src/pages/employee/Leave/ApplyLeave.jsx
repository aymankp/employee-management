import { useState, useEffect } from "react";
import api from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";

import { Calendar, Clock, AlertCircle, CheckCircle, Info } from "lucide-react";
import "./ApplyLeave.css";

export default function ApplyLeave() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    fromDate: "",
    toDate: "",
    leaveType: "",
    reason: "",
    halfDay: false,
    halfDayType: "first",
  });

  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [aiSuggestion, setAiSuggestion] = useState(null);

  // Fetch leave balance
  useEffect(() => {
    fetchBalance();
  }, []);

  // AI suggestion when reason changes
  useEffect(() => {
    if (formData.reason.trim().length > 0) {
      analyzeLeaveReason();
    } else {
      setAiSuggestion(null);
    }
  }, [formData.reason]);

  const fetchBalance = async () => {
    try {
      setLoading(true);
      const res = await api.get("/auth/me");
      setBalance(res.data.leaveBalance);
    } catch (error) {
      console.error("Error fetching balance:", error);
    } finally {
      setLoading(false);
    }
  };
// thats my ai dataset
  const keywords = {
    sick: [
      "sick",
      "fever",
      "cold",
      "flu",
      "cough",
      "infection",
      "ill",
      "illness",
      "hospital",
      "doctor",
      "medicine",
      "medical",
      "treatment",
      "health",
      "checkup",
      "surgery",
      "operation",
      "clinic",
      "injury",
      "pain",
      "headache",
      "migraine",
      "vomiting",
      "food poisoning",
      "covid",
      "dengue",
      "malaria",
      "weakness",
      "body pain",
    ],

    casual: [
      "personal",
      "family",
      "function",
      "wedding",
      "marriage",
      "ceremony",
      "festival",
      "holiday",
      "trip",
      "travel",
      "vacation",
      "outing",
      "family event",
      "birthday",
      "anniversary",
      "party",
      "home work",
      "personal work",
      "shopping",
      "guest",
      "visit relatives",
      "house work",
      "religious event",
      "puja",
      "celebration",
    ],

    emergency: [
      "emergency",
      "urgent",
      "accident",
      "sudden",
      "critical",
      "immediate",
      "hospital emergency",
      "family emergency",
      "medical emergency",
      "death",
      "funeral",
      "serious issue",
      "injury accident",
      "fire",
      "disaster",
      "crisis",
      "unexpected situation",
      "urgent work",
      "family problem",
      "serious condition",
    ],

    other: [
      "exam",
      "interview",
      "training",
      "conference",
      "seminar",
      "workshop",
      "visa",
      "documentation",
      "government work",
      "court",
      "legal work",
      "bank work",
      "official work",
      "college",
      "university",
      "project submission",
      "competition",
      "sports event",
      "hackathon",
      "moving house",
      "relocation",
      "passport work",
      "driving test",
      "license work",
    ],
  };
  //thats my ai baby
  const analyzeLeaveReason = () => {
    const reason = formData.reason.toLowerCase();

    let scores = {
      sick: 0,
      casual: 0,
      emergency: 0,
      other: 0,
    };

    Object.keys(keywords).forEach((type) => {
      keywords[type].forEach((word) => {
        if (reason.includes(word)) {
          scores[type] += 1;
        }
      });
    });

    const maxScore = Math.max(...Object.values(scores));

    if (maxScore === 0) {
      setAiSuggestion("other");
      return;
    }

    const suggestedType = Object.keys(scores).reduce((a, b) =>
      scores[a] > scores[b] ? a : b,
    );

    setAiSuggestion(suggestedType);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const calculateDays = () => {
    if (!formData.fromDate || !formData.toDate) return 0;

    const from = new Date(formData.fromDate);
    const to = new Date(formData.toDate);

    const diffTime = to - from;

    if (diffTime < 0) return 0; // prevent invalid range

    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    return formData.halfDay ? 0.5 : diffDays;
  };

  const getAvailableBalance = () => {
    if (!balance) return 0;
    const type = formData.leaveType;
    if (!type) return 0;
    return (balance[type]?.total || 0) - (balance[type]?.used || 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (new Date(formData.toDate) < new Date(formData.fromDate)) {
      setMessage({
        type: "error",
        text: "To date must be after from date",
      });
      return;
    }
    if (formData.halfDay && formData.fromDate !== formData.toDate) {
      setMessage({
        type: "error",
        text: "Half day leave must be on same date",
      });
      return;
    }
    // Validation
    if (
      !formData.fromDate ||
      !formData.toDate ||
      !formData.leaveType ||
      !formData.reason
    ) {
      setMessage({ type: "error", text: "All fields are required" });
      return;
    }

    const days = calculateDays();
    const available = getAvailableBalance();

    if (days > available) {
      setMessage({
        type: "error",
        text: `Insufficient balance. You have ${available} days available.`,
      });
      return;
    }

    setSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      const leaveData = {
        fromDate: formData.fromDate,
        toDate: formData.toDate,
        leaveType: formData.leaveType.toLowerCase(),
        reason: formData.reason,
        days: days,

        ...(formData.halfDay && {
          halfDay: true,
          halfDayType: formData.halfDayType,
        }),
      };

      await api.post("/leave/apply", leaveData);

      setMessage({
        type: "success",
        text: "Leave application submitted successfully!",
      });

      // Reset form
      setFormData({
        fromDate: "",
        toDate: "",
        leaveType: "",
        reason: "",
        halfDay: false,
        halfDayType: "first",
      });

      // Refresh balance
      fetchBalance();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to apply leave",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const days = calculateDays();
  const available = getAvailableBalance();

  return (
    <div className="leave-page">
      {/* Header */}
      <div className="leave-header">
        <div>
          <h1>Apply for Leave</h1>
          <p>Submit your leave request for manager approval</p>
        </div>
      </div>

      {/* Leave Balance */}
      <div className="leave-balance-grid">
        <div className="leave-balance-card">
          <Calendar size={22} />
          <div>
            <h4>Casual Leave</h4>
            <p>{balance?.casual?.total || 0}</p>
            <span>Used: {balance?.casual?.used || 0}</span>
          </div>
        </div>

        <div className="leave-balance-card">
          <Clock size={22} />
          <div>
            <h4>Sick Leave</h4>
            <p>{balance?.sick?.total || 0}</p>
            <span>Used: {balance?.sick?.used || 0}</span>
          </div>
        </div>

        <div className="leave-balance-card">
          <AlertCircle size={22} />
          <div>
            <h4>Emergency</h4>
            <p>{balance?.emergency?.total || 0}</p>
            <span>Used: {balance?.emergency?.used || 0}</span>
          </div>
        </div>

        <div className="leave-balance-card">
          <Info size={22} />
          <div>
            <h4>Other Leave</h4>
            <p>{balance?.other?.total || 0}</p>
            <span>Used: {balance?.other?.used || 0}</span>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="leave-form-card">
        {message.text && (
          <div className={`leave-message ${message.type}`}>
            {message.type === "success" ? (
              <CheckCircle size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            {message.text}
          </div>
        )}

        {formData.reason.trim() && aiSuggestion && (
          <div className="leave-ai-tip">
            <Info size={16} />
            {aiSuggestion === "other"
              ? "AI couldn't classify this leave. Please select manually."
              : `AI suggests: ${aiSuggestion} leave`}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="leave-form-grid">
            {/* From Date */}
            <div className="input-group">
              <label>From Date</label>
              <input
                type="date"
                name="fromDate"
                value={formData.fromDate}
                min={new Date().toISOString().split("T")[0]}
                max={formData.toDate || ""}
                onChange={handleInputChange}
                className="input"
                required
              />
            </div>

            {/* To Date */}
            <div className="input-group">
              <label>To Date</label>
              <input
                type="date"
                name="toDate"
                value={formData.toDate}
                min={
                  formData.fromDate || new Date().toISOString().split("T")[0]
                }
                onChange={handleInputChange}
                className="input"
                required
              />
            </div>

            {/* Leave Type */}
            <div className="input-group">
              <label>Leave Type</label>
              <select
                name="leaveType"
                value={formData.leaveType}
                onChange={handleInputChange}
                className="input"
                required
              >
                <option value="">Select Type</option>
                <option value="casual">Casual Leave</option>
                <option value="sick">Sick Leave</option>
                <option value="emergency">Emergency Leave</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Half Day */}
            <div className="input-group">
              <label className="checkbox">
                <input
                  type="checkbox"
                  name="halfDay"
                  checked={formData.halfDay}
                  onChange={handleInputChange}
                />
                Half Day Leave
              </label>

              {formData.halfDay && (
                <select
                  name="halfDayType"
                  value={formData.halfDayType}
                  onChange={handleInputChange}
                  className="input"
                >
                  <option value="first">First Half</option>
                  <option value="second">Second Half</option>
                </select>
              )}
            </div>

            {/* Reason */}
            <div className="input-group full">
              <label>Reason</label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                className="input"
                rows="4"
                placeholder="Describe the reason..."
                required
              />
            </div>
          </div>

          {/* Leave Summary */}
          {formData.fromDate && formData.toDate && formData.leaveType && (
            <div className="leave-summary-card">
              <div>
                <span>Duration</span>
                <strong>{days} days</strong>
              </div>

              <div>
                <span>Available</span>
                <strong>{available} days</strong>
              </div>

              <div>
                <span>Remaining</span>
                <strong className={available - days < 0 ? "danger" : "success"}>
                  {available - days}
                </strong>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="leave-submit-btn"
            disabled={submitting || available - days < 0}
          >
            {submitting ? "Processing..." : "Submit Leave Request"}
          </button>
        </form>
      </div>
    </div>
  );
}

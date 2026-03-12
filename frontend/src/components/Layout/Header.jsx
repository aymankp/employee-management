import { useAuth } from "../../context/AuthContext";
import { Bell, LogOut, Menu, User } from "lucide-react";
import "./Header.css";
import React, { useState, useEffect } from "react";
import socket from "../../socket";
const Header = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState(0);
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
      document.body.classList.add("dark");
      setDarkMode(true);
    } else {
      document.body.classList.remove("dark");
      setDarkMode(false);
    }
    socket.on("leave-status-update", () => {
      setNotifications((prev) => prev + 1);
    });

    return () => {
      socket.off("leave-status-update");
    };
  }, []);
  const toggleDark = () => {
    const isDark = document.body.classList.toggle("dark");

    setDarkMode(isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  };
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, [darkMode]);
  return (
    <header className="header">
      <div className="header-left">
        <button className="mobile-menu-btn" onClick={toggleSidebar}>
          <Menu size={20} />
        </button>

        <h2>Welcome back, {user?.name?.split(" ")[0]}!</h2>
      </div>

      <div className="header-right">
        <div className="dropdown-wrapper">
          <button className="icon-btn" onClick={() => setShowNotif(!showNotif)}>
            <Bell size={18} />

            {notifications > 0 && (
              <span className="notif-badge">{notifications}</span>
            )}
          </button>

          {showNotif && (
            <div className="dropdown">
              <h4>Notifications</h4>
              <div className="dropdown-item">Leave approved</div>
              <div className="dropdown-item">New leave request</div>
              <div className="dropdown-item">Policy updated</div>
            </div>
          )}
        </div>

        <div className="dropdown-wrapper">
          <div
            className="user-info"
            onClick={() => setShowProfile(!showProfile)}
          >
            <div className="avatar">{user?.name?.charAt(0).toUpperCase()}</div>
          </div>

          {showProfile && (
            <div className="dropdown">
              <div className="dropdown-item">
                <User size={16} /> Profile
              </div>

              <div className="dropdown-item" onClick={logout}>
                <LogOut size={16} /> Logout
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

import React, { useEffect, useState } from "react";
import NotificationModal from "./Modals/NotificationModal";
import LoadingSlider from "../../shared/components/LoadingSpinner";
import { Bell } from "lucide-react";
import api from "../../lib/axiosConfig";

const NotificationIcon = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/api/notifications/getnotificationcount/admin");
      setNotifications(res.data || []);
      // console.log("Fetched notifications:", res.data.notifications);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <>
      <button onClick={() => setOpen(true)} className="relative">
        <Bell className="w-7 h-7 text-gray-700" />
        {/* Optionally show badge */}
        <span className="absolute -top-2 -right-[6px] bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {notifications.count || 0}
        </span>
      </button>
      <NotificationModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default NotificationIcon;

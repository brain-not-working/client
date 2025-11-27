import React, { useEffect, useMemo, useState } from "react";
import moment from "moment-timezone";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Pencil,
  Trash,
  AlertCircle,
  X,
} from "lucide-react";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import { formatTime } from "../../shared/utils/dateUtils";
import { Button, IconButton } from "../../shared/components/Button";
import Modal from "../../shared/components/Modal/Modal";
import api from "../../lib/axiosConfig";
import { FormInput, FormSelect } from "../../shared/components/Form";
import { toast } from "sonner";

/* ---------- Constants ---------- */
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from(
  { length: 24 },
  (_, i) => `${String(i).padStart(2, "0")}:00`
);

/* Timezone config (same as before) */
const TIMEZONE = "America/Denver"; // Mountain Time (UTC-7)
// const getMoment = (date = null) => moment.tz(date || new Date(), TIMEZONE);
const toMountainTime = (date) => getMoment(date).toDate();

/* ---------- Small helpers ---------- */
const startOfMonth = (d) => getMoment(d).startOf("month").toDate();
const endOfMonth = (d) => getMoment(d).endOf("month").toDate();
const startOfWeek = (d) => getMoment(d).startOf("week").toDate();
const endOfWeek = (d) => getMoment(d).endOf("week").toDate();
const isSameDay = (a, b) => getMoment(a).isSame(getMoment(b), "day");
const toDateKey = (d) => getMoment(d).format("YYYY-MM-DD");

const getMoment = (date = null) => moment.tz(date || new Date(), TIMEZONE);
const todayISO = () => getMoment().format("YYYY-MM-DD");
const clampToTodayISO = (iso) => {
  const today = todayISO();
  return iso && iso >= today ? iso : today;
};
const isPastISO = (iso) => {
  const today = todayISO();
  return iso < today;
};
const isPastDate = (date) =>
  getMoment(date).isBefore(getMoment().startOf("day"), "day");

/* ---------- Component ---------- */
const AdminVendorCalendar = () => {
  /* ---------- State ---------- */
  const [loading, setLoading] = useState(true);
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [error, setError] = useState(null);

  const [vendors, setVendors] = useState([]); // list of all vendors { vendor_id, name, email }
  const [vendorAvailabilities, setVendorAvailabilities] = useState({}); // { [vendor_id]: [availabilities...] }

  const [currentDate, setCurrentDate] = useState(toMountainTime(new Date()));
  const [viewMode, setViewMode] = useState("month"); // month | week | day
  const [selectedDate, setSelectedDate] = useState(null);

  // Create/Edit/Delete modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAvailToEdit, setSelectedAvailToEdit] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteBookedDates, setDeleteBookedDates] = useState([]); // kept in case API returns conflicts
  const [deleteMode, setDeleteMode] = useState("all"); // "all" | "range"
  const [deleteStartDate, setDeleteStartDate] = useState("");
  const [deleteEndDate, setDeleteEndDate] = useState("");

  // create/edit form
  const emptyForm = {
    vendor_id: "", // for create
    startDate: "",
    endDate: "",
    startTime: "09:00",
    endTime: "18:00",
  };
  const [availabilityForm, setAvailabilityForm] = useState(emptyForm);

  /* ---------- Effects: fetch vendors & availabilities ---------- */
  useEffect(() => {
    fetchVendorsAndAvailabilities();
  }, []);

  const fetchVendorsAndAvailabilities = async () => {
    setLoading(true);
    try {
      // 1. fetch vendors
      const vendorsRes = await api.get("/api/vendor/get-vendors?limit=all");
      const vendorList = vendorsRes?.data?.vendors || [];
      setVendors(vendorList);

      // 2. fetch availabilities for all vendors in parallel
      // NOTE: admin-get-availability/:vendor_id returns shape: { vendor_id, availabilities: [...] }
      const fetches = vendorList.map((v) =>
        api
          .get(`/api/vendor/admin-get-availability/${v.vendor_id}`)
          .then((r) => ({ vendor_id: v.vendor_id, data: r.data }))
          .catch((err) => {
            // If a vendor has no availability or fails, treat as empty
            console.error(
              "Failed to fetch availability for",
              v.vendor_id,
              err?.response?.data || err
            );
            return { vendor_id: v.vendor_id, data: { availabilities: [] } };
          })
      );

      const results = await Promise.all(fetches);
      const map = {};
      results.forEach(({ vendor_id, data }) => {
        const avs = data?.availabilities || [];
        // normalize: ensure each availability contains vendor_id + vendor_availability_id
        map[vendor_id] = avs.map((a) => ({
          vendor_availability_id: a.vendor_availability_id ?? a.id ?? null,
          vendor_id: vendor_id,
          name: a.name ?? "",
          email: a.email ?? "",
          startDate: a.startDate,
          endDate: a.endDate,
          startTime: a.startTime,
          endTime: a.endTime,
        }));
      });

      setVendorAvailabilities(map);
    } catch (err) {
      console.error(err);
      setError("Failed to load vendor data");
      toast.error("Failed to load vendors or availabilities");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Derived maps: availabilities grouped by date ---------- */
  // Build a map: dateKey -> array of { vendor_id, vendor_availability_id, vendorName, vendorEmail, startDate, endDate, startTime, endTime }
  const availabilitiesByDate = useMemo(() => {
    const map = {}; // { 'YYYY-MM-DD': [ ... ] }

    Object.entries(vendorAvailabilities).forEach(([vendor_id, avs]) => {
      avs.forEach((av) => {
        if (!av.startDate || !av.endDate) return;
        const s = getMoment(av.startDate).startOf("day");
        const e = getMoment(av.endDate).startOf("day");
        const it = s.clone();
        while (it.isSameOrBefore(e, "day")) {
          const k = it.format("YYYY-MM-DD");
          map[k] = map[k] || [];
          map[k].push({
            vendor_availability_id: av.vendor_availability_id,
            vendor_id: vendor_id,
            name:
              av.name ||
              (vendors.find((v) => v.vendor_id === Number(vendor_id))?.name ??
                ""),
            email:
              av.email ||
              (vendors.find((v) => v.vendor_id === Number(vendor_id))?.email ??
                ""),
            startDate: av.startDate,
            endDate: av.endDate,
            startTime: av.startTime,
            endTime: av.endTime,
          });
          it.add(1, "day");
        }
      });
    });

    return map;
  }, [vendorAvailabilities, vendors]);

  // vendor count per day - unique vendors count (if same vendor has multiple overlapping entries on a date, count once)
  const vendorCountByDate = useMemo(() => {
    const map = {};
    Object.entries(availabilitiesByDate).forEach(([k, arr]) => {
      const uniqueVendors = new Set(arr.map((x) => String(x.vendor_id)));
      map[k] = uniqueVendors.size;
    });
    return map;
  }, [availabilitiesByDate]);

  /* ---------- Calendar matrix & helpers ---------- */
  const monthMatrix = useMemo(() => {
    const ms = startOfMonth(currentDate),
      me = endOfMonth(currentDate);
    const start = getMoment(ms).startOf("week");
    const end = getMoment(me).endOf("week");

    const weeks = [];
    const it = start.clone();

    while (it.isBefore(end) || it.isSame(end, "day")) {
      const w = [];
      for (let i = 0; i < 7; i++) {
        w.push(it.toDate());
        it.add(1, "day");
      }
      weeks.push(w);
    }
    return weeks;
  }, [currentDate]);

  const weekDays = useMemo(() => {
    const s = startOfWeek(currentDate);
    return Array.from({ length: 7 }, (_, i) =>
      getMoment(s).add(i, "days").toDate()
    );
  }, [currentDate]);

  /* ---------- Interactions ---------- */
  const handleDateClick = (date) => {
    setSelectedDate(date);
  };

  const handlePreviousPeriod = () => {
    let newDate;
    if (viewMode === "month") {
      newDate = getMoment(currentDate).subtract(1, "month").toDate();
    } else if (viewMode === "week") {
      newDate = getMoment(currentDate).subtract(1, "week").toDate();
    } else {
      newDate = getMoment(currentDate).subtract(1, "day").toDate();
    }
    setCurrentDate(newDate);
  };

  const handleNextPeriod = () => {
    let newDate;
    if (viewMode === "month") {
      newDate = getMoment(currentDate).add(1, "month").toDate();
    } else if (viewMode === "week") {
      newDate = getMoment(currentDate).add(1, "week").toDate();
    } else {
      newDate = getMoment(currentDate).add(1, "day").toDate();
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => setCurrentDate(toMountainTime(new Date()));

  /* ---------- Header ---------- */
  const renderHeader = () => {
    const currentMoment = getMoment(currentDate);
    const title =
      viewMode === "month"
        ? currentMoment.format("MMMM YYYY")
        : viewMode === "week"
        ? `${getMoment(startOfWeek(currentDate)).format("MMM D")} - ${getMoment(
            endOfWeek(currentDate)
          ).format("MMM D, YYYY")}`
        : currentMoment.format("dddd, MMMM D, YYYY");

    return (
      <div className="flex flex-col items-center justify-between gap-4 pb-6 sm:flex-row">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <IconButton
              onClick={handlePreviousPeriod}
              variant="lightBlack"
              icon={<ArrowLeft size={20} />}
            />
            <h2 className="text-xl text-center font-bold text-gray-800 w-48">
              {title}
            </h2>
            <IconButton
              onClick={handleNextPeriod}
              variant="lightBlack"
              icon={<ArrowRight size={20} />}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <FormSelect
            className="w-32"
            options={[
              { value: "month", label: "Month" },
              { value: "week", label: "Week" },
              { value: "day", label: "Day" },
            ]}
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
          />
          <Button
            onClick={handleToday}
            variant="ghost"
            className="whitespace-nowrap"
          >
            Today
          </Button>

          <Button
            onClick={() => {
              // open create modal: default start/end => selectedDate or today
              const base = selectedDate
                ? getMoment(selectedDate).format("YYYY-MM-DD")
                : getMoment().format("YYYY-MM-DD");
              const safe = clampToTodayISO(base);
              setAvailabilityForm({
                vendor_id: "", // must select vendor
                startDate: safe,
                endDate: safe,
                startTime: "09:00",
                endTime: "18:00",
              });
              setShowCreateModal(true);
            }}
            icon={<Plus size={16} />}
            className="whitespace-nowrap"
          >
            New Availability
          </Button>
        </div>
      </div>
    );
  };

  /* ---------- Render month/week/day main (no bookings) ---------- */
  const renderMonthMain = () => (
    <div className="overflow-hidden bg-white border shadow-md rounded-xl">
      <div className="grid grid-cols-7 border-b bg-gray-50">
        {DAYS.map((d) => (
          <div
            key={d}
            className="py-2 text-sm font-medium text-center text-gray-500"
          >
            {d}
          </div>
        ))}
      </div>
      <div>
        {monthMatrix.map((week, wIdx) => (
          <div key={wIdx} className="grid grid-cols-7">
            {week.map((day) => {
              const dayMoment = getMoment(day);
              const key = dayMoment.format("YYYY-MM-DD");
              const isCurrentMonth =
                dayMoment.month() === getMoment(currentDate).month();
              const isToday = dayMoment.isSame(getMoment(), "day");
              const vendorCount = vendorCountByDate[key] || 0;

              return (
                <div
                  key={key}
                  onClick={() => handleDateClick(day)}
                  className={`border p-2 sm:min-h-[100px] min-h-[64px] transition rounded-md relative
                    ${isCurrentMonth ? "" : "bg-gray-50 text-gray-300"}
                    ${isToday ? "border-2 border-emerald-400 bg-white" : ""}
                    ${
                      selectedDate && isSameDay(selectedDate, day)
                        ? "bg-blue-50 border-blue-300"
                        : ""
                    }
                    ${
                      isPastDate(day)
                        ? "bg-gray-50 text-gray-300 opacity-60"
                        : ""
                    }
                    hover:bg-blue-50
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`text-xs font-semibold ${
                        isToday
                          ? "text-emerald-600"
                          : isCurrentMonth
                          ? "text-gray-700"
                          : "text-gray-300"
                      }`}
                    >
                      {dayMoment.date()}
                    </div>

                    <div className="flex items-center gap-1">
                      {vendorCount > 0 && (
                        <span className="ml-1 text-[11px] bg-emerald-500 text-white px-2 rounded-full">
                          {vendorCount}{" "}
                          {vendorCount === 1 ? "Vendor" : "Vendors"}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-gray-600 truncate">
                    {vendorCount > 0 ? (
                      (() => {
                        const vendorsList = (
                          availabilitiesByDate[key] || []
                        ).map((a) => a.name || `Vendor ${a.vendor_id}`);

                        const uniqueNames = [...new Set(vendorsList)];
                        const firstTwo = uniqueNames.slice(0, 2).join(", ");
                        const extra =
                          uniqueNames.length > 2
                            ? ` +${uniqueNames.length - 2}`
                            : "";

                        return (
                          <span className="bg-green-50 text-gray-600 px-2 rounded-full ">
                            {firstTwo}
                            {extra}
                          </span>
                        );
                      })()
                    ) : (
                      <span className="text-gray-400">No vendors</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );

  const renderWeekMain = () => (
    <div className="overflow-hidden bg-white border shadow-md rounded-xl">
      <div className="grid grid-cols-[60px_1fr]">
        <div />
        <div className="grid grid-cols-7 border-b bg-gray-50">
          {weekDays.map((d) => {
            const dayMoment = getMoment(d);
            const key = dayMoment.format("YYYY-MM-DD");
            const vendorCount = vendorCountByDate[key] || 0;
            const isToday = dayMoment.isSame(getMoment(), "day");
            return (
              <div
                key={key}
                className={`py-2 text-sm font-medium text-center ${
                  isToday ? "border-emerald-300" : ""
                }`}
              >
                <div>{dayMoment.format("ddd")}</div>
                <div
                  className={`text-xs ${
                    isToday ? "font-bold text-emerald-700" : "text-gray-500"
                  }`}
                >
                  {dayMoment.date()}
                </div>
                {vendorCount > 0 && (
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <span className="px-2 text-[12px] rounded-full bg-emerald-500 text-white">
                      {vendorCount} {vendorCount === 1 ? "Vendor" : "Vendors"}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-[60px_1fr] h-[520px] overflow-auto">
        <div className="border-r">
          <div className="flex flex-col">
            {HOURS.map((h) => (
              <div
                key={h}
                className="h-10 py-1 pr-2 text-xs text-right text-gray-400"
              >
                {h}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-7 divide-x">
          {weekDays.map((d) => {
            const dayMoment = getMoment(d);
            const key = dayMoment.format("YYYY-MM-DD");
            const vendorCount = vendorCountByDate[key] || 0;
            const isToday = dayMoment.isSame(getMoment(), "day");
            return (
              <div
                key={key}
                className={`min-h-full p-2 relative ${
                  isToday ? "border-emerald-300" : ""
                }`}
                onClick={() => handleDateClick(d)}
              >
                <div className="h-full flex flex-col items-center justify-center text-sm">
                  {vendorCount > 0 ? (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-700">
                        {vendorCount}
                      </div>
                      <div className="text-xs text-gray-600">
                        {vendorCount === 1 ? "Vendor" : "Vendors"}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-300">No vendors</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderDayMain = () => {
    const dayMoment = getMoment(currentDate);
    const key = dayMoment.format("YYYY-MM-DD");
    const vendorCount = vendorCountByDate[key] || 0;
    const isToday = dayMoment.isSame(getMoment(), "day");
    return (
      <div
        className={`overflow-hidden border shadow-md rounded-xl ${
          isToday ? "border-emerald-300" : "bg-white"
        }`}
      >
        <div
          className={`p-5 border-b bg-gray-50 ${
            isToday ? "bg-emerald-50" : ""
          }`}
        >
          <h3 className="text-lg font-semibold text-gray-800">
            {dayMoment.format("dddd, MMMM D, YYYY")}
          </h3>
          <div className="mt-1 text-sm text-gray-600">
            {vendorCount}{" "}
            {vendorCount === 1 ? "vendor available" : "vendors available"}
          </div>
        </div>

        <div className="p-6">
          {vendorCount > 0 ? (
            <div className="grid gap-3">
              {(availabilitiesByDate[key] || []).map((a) => (
                <div
                  key={`${a.vendor_availability_id}-${a.vendor_id}`}
                  className="p-3 border rounded bg-emerald-50 border-emerald-200 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-emerald-700">
                      {a.name || `Vendor ${a.vendor_id}`}
                    </div>
                    <div className="text-xs text-gray-600">{a.email}</div>
                    <div className="text-sm text-gray-700 mt-1">
                      {a.startTime} - {a.endTime}{" "}
                      <span className="text-xs text-gray-500">
                        ({a.startDate}
                        {a.startDate !== a.endDate ? ` → ${a.endDate}` : ""})
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <IconButton
                      title="Edit"
                      variant="lightBlack"
                      icon={<Pencil size={14} />}
                      onClick={() => openEditModal(a)}
                    />
                    <IconButton
                      title="Delete"
                      variant="lightDanger"
                      icon={<Trash size={14} />}
                      onClick={() => openDeleteModal(a)}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              No vendors available for this day.
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ---------- Aside (selected date) ---------- */
  const renderSelectedDateDetails = () => {
    if (!selectedDate) {
      return (
        <div className="hidden p-8 bg-white border-l shadow-md lg:block rounded-xl">
          <div className="text-center text-gray-400">
            Select a day to view vendors' availability
          </div>
        </div>
      );
    }

    const key = getMoment(selectedDate).format("YYYY-MM-DD");
    const avs = availabilitiesByDate[key] || [];

    return (
      <aside className="w-full lg:w-[340px] p-5 bg-white border-l rounded-xl shadow-md">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-lg font-semibold">
              {getMoment(selectedDate).format("dddd, MMMM D, YYYY")}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {avs.length} availability{avs.length !== 1 ? "ies" : ""}
            </p>
          </div>
          <IconButton
            onClick={() => {
              setSelectedDate(null);
            }}
            variant="lightDanger"
            icon={<X size={20} />}
          />
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold">Vendors</h4>
            <Button
              size="sm"
              variant="lightInherit"
              onClick={() => {
                // open create modal with selectedDate prefilled
                const base = getMoment(selectedDate).format("YYYY-MM-DD");
                const safe = clampToTodayISO(base);
                setAvailabilityForm({
                  vendor_id: "",
                  startDate: safe,
                  endDate: safe,
                  startTime: "09:00",
                  endTime: "18:00",
                });
                setShowCreateModal(true);
              }}
            >
              Add
            </Button>
          </div>

          <div className="space-y-3">
            {avs.length ? (
              avs
                .slice()
                .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
                .map((a) => (
                  <div
                    key={`${a.vendor_availability_id}-${a.vendor_id}`}
                    className="flex items-start justify-between p-3 border rounded bg-emerald-50/50 border-emerald-100"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-emerald-700">
                        {a.name}
                      </div>
                      <div className="text-xs truncate text-emerald-700">
                        {a.email}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {a.startTime} - {a.endTime}{" "}
                        <span className="text-xs text-gray-500">
                          ({a.startDate}
                          {a.startDate !== a.endDate ? ` → ${a.endDate}` : ""})
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-3">
                      <IconButton
                        onClick={() => openEditModal(a)}
                        title="Edit"
                        variant="lightBlack"
                        icon={<Pencil size={14} />}
                      />
                      <IconButton
                        onClick={() => openDeleteModal(a)}
                        title="Delete"
                        variant="lightDanger"
                        icon={<Trash size={14} />}
                      />
                    </div>
                  </div>
                ))
            ) : (
              <div className="py-3 text-sm text-gray-500">No availability</div>
            )}
          </div>
        </div>
      </aside>
    );
  };

  /* ---------- Create Availability ---------- */
  const createAvailability = async (vendor_id, payload) => {
    // POST /api/vendor/admin-set-availability/:vendor_id
    return api.post(`/api/vendor/admin-set-availability/${vendor_id}`, payload);
  };

  const submitCreateAvailability = async () => {
    const { vendor_id, startDate, endDate, startTime, endTime } =
      availabilityForm;
    if (!vendor_id) return toast.error("Please select a vendor");
    if (!startDate || !endDate || !startTime || !endTime)
      return toast.error("All fields are required");
    if (isPastISO(startDate) || isPastISO(endDate))
      return toast.error("Dates cannot be in the past");
    if (endDate < startDate)
      return toast.error("End date must be after or same as start date");

    try {
      setLoadingAvail(true);
      const { data } = await createAvailability(vendor_id, {
        startDate,
        endDate,
        startTime,
        endTime,
      });
      toast.success(
        data?.message || "Availability added successfully by admin"
      );
      setShowCreateModal(false);
      setAvailabilityForm(emptyForm);
      // refresh single vendor availabilities
      await refreshVendorAvailability(vendor_id);
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.message || "Failed to create availability"
      );
    } finally {
      setLoadingAvail(false);
    }
  };

  const refreshVendorAvailability = async (vendor_id) => {
    try {
      const res = await api.get(
        `/api/vendor/admin-get-availability/${vendor_id}`
      );
      const avs = res?.data?.availabilities || [];
      setVendorAvailabilities((s) => ({
        ...s,
        [vendor_id]: avs.map((a) => ({
          vendor_availability_id: a.vendor_availability_id ?? a.id ?? null,
          vendor_id,
          name: a.name ?? "",
          email: a.email ?? "",
          startDate: a.startDate,
          endDate: a.endDate,
          startTime: a.startTime,
          endTime: a.endTime,
        })),
      }));
    } catch (err) {
      console.error("refresh vendor avail failed", err);
    }
  };

  /* ---------- Edit Availability ---------- */
  const updateAvailability = async (availability_id, payload) => {
    // PUT /api/vendor/admin-edit-availability/:vendor_availability_id
    return api.put(
      `/api/vendor/admin-edit-availability/${availability_id}`,
      payload
    );
  };

  const openEditModal = (a) => {
    // a contains vendor_id, vendor_availability_id, startDate, endDate, startTime, endTime
    setSelectedAvailToEdit(a);
    setAvailabilityForm({
      vendor_id: a.vendor_id,
      startDate: a.startDate,
      endDate: a.endDate,
      startTime: a.startTime || "09:00",
      endTime: a.endTime || "18:00",
    });
    setShowEditModal(true);
  };

  const submitEditAvailability = async () => {
    if (!selectedAvailToEdit) return;
    const { startDate, endDate, startTime, endTime } = availabilityForm;
    if (!startDate || !endDate || !startTime || !endTime)
      return toast.error("All fields are required");
    if (isPastISO(startDate) || isPastISO(endDate))
      return toast.error("Dates cannot be in the past");
    if (endDate < startDate)
      return toast.error("End date must be after or same as start date");

    try {
      setLoadingAvail(true);
      // include vendor_id in payload in case API expects it
      const payload = {
        vendor_id: availabilityForm.vendor_id,
        startDate,
        endDate,
        startTime,
        endTime,
      };
      const res = await updateAvailability(
        selectedAvailToEdit.vendor_availability_id,
        payload
      );
      toast.success(
        res?.data?.message || "Availability updated successfully by admin"
      );
      setShowEditModal(false);
      setSelectedAvailToEdit(null);
      setAvailabilityForm(emptyForm);
      // refresh vendor availabilities
      await refreshVendorAvailability(availabilityForm.vendor_id);
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.message || "Failed to update availability"
      );
    } finally {
      setLoadingAvail(false);
    }
  };

  /* ---------- Delete Availability ---------- */
  const openDeleteModal = (a) => {
    setDeleteTarget(a);
    setDeleteBookedDates([]);
    setDeleteMode("all");

    // default range = today → end or startDate
    const minInside = clampToTodayISO(a.startDate);
    const maxInside = a.endDate;

    setDeleteStartDate(minInside);
    setDeleteEndDate(minInside > maxInside ? minInside : maxInside);

    setShowDeleteModal(true);
  };

  const submitDeleteAvailability = async () => {
    if (!deleteTarget) return;

    const id = deleteTarget.vendor_availability_id;
    const vendor_id = deleteTarget.vendor_id;

    // Validations for custom range
    if (deleteMode === "range") {
      if (!deleteStartDate || !deleteEndDate) {
        return toast.error("Please select start and end dates");
      }
      if (deleteEndDate < deleteStartDate) {
        return toast.error("End date must be after start date");
      }
      if (isPastISO(deleteStartDate) || isPastISO(deleteEndDate)) {
        return toast.error("Cannot delete past dates");
      }
    }

    const payload =
      deleteMode === "all"
        ? { vendor_id }
        : {
            vendor_id,
            startDate: deleteStartDate,
            endDate: deleteEndDate,
          };

    try {
      setDeleteBusy(true);
      const res = await api.delete(
        `/api/vendor/admin-delete-availability/${id}`,
        {
          data: payload,
        }
      );

      toast.success(res?.data?.message || "Availability deleted");
      setShowDeleteModal(false);
      setDeleteTarget(null);

      await refreshVendorAvailability(vendor_id);
    } catch (err) {
      console.error(err);
      setDeleteBookedDates(err?.response?.data?.bookedDates || []);
      toast.error(err?.response?.data?.message || "Failed to delete");
    } finally {
      setDeleteBusy(false);
    }
  };

  /* ---------- Guards ---------- */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-4 rounded-md bg-red-50">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  /* ---------- Render ---------- */
  return (
    <div className="mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Admin — Vendor Availability Calendar
      </h2>
      <div className="flex flex-col lg:flex-row gap-7">
        <div className="flex-1 min-w-0">
          {renderHeader()}
          <div className="mt-2">
            {viewMode === "month" && renderMonthMain()}
            {viewMode === "week" && renderWeekMain()}
            {viewMode === "day" && renderDayMain()}
          </div>
        </div>

        <div className="w-full lg:w-[340px] shrink-0">
          {renderSelectedDateDetails()}
        </div>
      </div>

      {/* ---------- Create Modal ---------- */}
      {showCreateModal && (
        <Modal
          onClose={() => setShowCreateModal(false)}
          isOpen={showCreateModal}
          title="New Availability"
        >
          <div className="space-y-3">
            <div>
              <FormSelect
                label="Vendor"
                className="w-full"
                options={[
                  { value: "", label: "Select vendor" },
                  ...vendors.map((v) => ({
                    value: String(v.vendor_id),
                    label: v.name || v.email || `Vendor ${v.vendor_id}`,
                  })),
                ]}
                value={String(availabilityForm.vendor_id || "")}
                onChange={(e) =>
                  setAvailabilityForm((s) => ({
                    ...s,
                    vendor_id: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div>
              <FormInput
                label="Start date"
                value={availabilityForm.startDate}
                onChange={(e) => {
                  const v = clampToTodayISO(e.target.value);
                  setAvailabilityForm((s) => ({
                    ...s,
                    startDate: v,
                    endDate: s.endDate && s.endDate < v ? v : s.endDate || v,
                  }));
                }}
                type="date"
                min={todayISO()}
              />
            </div>

            <div>
              <FormInput
                label="End date"
                value={availabilityForm.endDate}
                onChange={(e) => {
                  const v = e.target.value;
                  const minEnd =
                    availabilityForm.startDate &&
                    availabilityForm.startDate > todayISO()
                      ? availabilityForm.startDate
                      : todayISO();
                  setAvailabilityForm((s) => ({
                    ...s,
                    endDate: v < minEnd ? minEnd : v,
                  }));
                }}
                type="date"
                min={
                  availabilityForm.startDate &&
                  availabilityForm.startDate > todayISO()
                    ? availabilityForm.startDate
                    : todayISO()
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormInput
                label="Start time"
                type="time"
                value={availabilityForm.startTime}
                onChange={(e) =>
                  setAvailabilityForm((s) => ({
                    ...s,
                    startTime: e.target.value,
                  }))
                }
              />
              <FormInput
                label="End time"
                type="time"
                value={availabilityForm.endTime}
                onChange={(e) =>
                  setAvailabilityForm((s) => ({
                    ...s,
                    endTime: e.target.value,
                  }))
                }
              />
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="lightInherit"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={submitCreateAvailability}
                disabled={loadingAvail}
              >
                {loadingAvail ? "Saving..." : "Create"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ---------- Edit Modal ---------- */}
      {showEditModal && selectedAvailToEdit && (
        <Modal
          onClose={() => setShowEditModal(false)}
          isOpen={showEditModal}
          title="Edit Availability"
        >
          <div className="space-y-3">
            <div>
              <FormSelect
                label="Vendor"
                className="w-full"
                options={[
                  {
                    value: String(selectedAvailToEdit.vendor_id),
                    label:
                      selectedAvailToEdit.name ||
                      `Vendor ${selectedAvailToEdit.vendor_id}`,
                  },
                ]}
                value={String(availabilityForm.vendor_id || "")}
                onChange={() => {}}
                disabled
              />
            </div>

            <div>
              <FormInput
                label="Start date"
                value={availabilityForm.startDate}
                onChange={(e) => {
                  const v = clampToTodayISO(e.target.value);
                  setAvailabilityForm((s) => ({
                    ...s,
                    startDate: v,
                    endDate: s.endDate && s.endDate < v ? v : s.endDate || v,
                  }));
                }}
                type="date"
                min={todayISO()}
              />
            </div>

            <div>
              <FormInput
                label="End date"
                value={availabilityForm.endDate}
                onChange={(e) => {
                  const v = e.target.value;
                  const minEnd =
                    availabilityForm.startDate &&
                    availabilityForm.startDate > todayISO()
                      ? availabilityForm.startDate
                      : todayISO();
                  setAvailabilityForm((s) => ({
                    ...s,
                    endDate: v < minEnd ? minEnd : v,
                  }));
                }}
                type="date"
                min={
                  availabilityForm.startDate &&
                  availabilityForm.startDate > todayISO()
                    ? availabilityForm.startDate
                    : todayISO()
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormInput
                label="Start time"
                type="time"
                value={availabilityForm.startTime}
                onChange={(e) =>
                  setAvailabilityForm((s) => ({
                    ...s,
                    startTime: e.target.value,
                  }))
                }
              />
              <FormInput
                label="End time"
                type="time"
                value={availabilityForm.endTime}
                onChange={(e) =>
                  setAvailabilityForm((s) => ({
                    ...s,
                    endTime: e.target.value,
                  }))
                }
              />
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="lightInherit"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </Button>
              <Button onClick={submitEditAvailability} disabled={loadingAvail}>
                {loadingAvail ? "Saving..." : "Update"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ---------- Delete Modal ---------- */}
      {showDeleteModal && deleteTarget && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Availability"
        >
          <>
            <div className="space-y-3">
              {/* OPTION 1 — Delete Entire Availability */}
              <label className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  className="accent-red-600"
                  checked={deleteMode === "all"}
                  onChange={() => setDeleteMode("all")}
                />
                <h3 className="font-medium text-gray-800">
                  Delete entire availability
                </h3>
              </label>

              {/* OPTION 2 — Delete Custom Date Range */}
              <label className="flex items-start gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  className="mt-1 accent-red-600"
                  checked={deleteMode === "range"}
                  onChange={() => setDeleteMode("range")}
                />

                <div className="w-full">
                  <div className="font-medium text-gray-800">
                    Delete a specific date range
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <FormInput
                      label="Start Date"
                      type="date"
                      value={deleteStartDate}
                      min={deleteTarget?.startDate}
                      max={deleteTarget?.endDate}
                      disabled={deleteMode !== "range"}
                      onChange={(e) => {
                        const v = e.target.value;
                        setDeleteStartDate(v);
                        if (v > deleteEndDate) setDeleteEndDate(v);
                      }}
                    />

                    <FormInput
                      label="End Date"
                      type="date"
                      value={deleteEndDate}
                      min={deleteStartDate}
                      max={deleteTarget?.endDate}
                      disabled={deleteMode !== "range"}
                      onChange={(e) => {
                        const v = e.target.value;
                        setDeleteEndDate(
                          v < deleteStartDate ? deleteStartDate : v
                        );
                      }}
                    />
                  </div>
                </div>
              </label>

              {deleteBookedDates.length > 0 && (
                <div className="flex items-start gap-2 p-3 text-sm border border-yellow-200 rounded bg-yellow-50">
                  <AlertCircle className="mt-0.5 text-yellow-600" size={18} />
                  <div className="text-yellow-800">
                    <div className="font-medium">
                      Cannot delete on booked date(s):
                    </div>
                    <div className="mt-1">{deleteBookedDates.join(", ")}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <Button
                variant="lightInherit"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteBusy}
              >
                Cancel
              </Button>

              <Button
                variant="lightError"
                onClick={submitDeleteAvailability}
                disabled={deleteBusy}
              >
                {deleteBusy
                  ? "Deleting..."
                  : deleteMode === "all"
                  ? "Delete Entire"
                  : "Delete Range"}
              </Button>
            </div>
          </>
        </Modal>
      )}
    </div>
  );
};

export default AdminVendorCalendar;

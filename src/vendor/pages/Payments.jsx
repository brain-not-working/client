// pages/vendor/Payments.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import { formatDate } from "../../shared/utils/dateUtils";
import PaymentsTable from "../components/Tables/PaymentsTable";
import { FormInput, FormSelect } from "../../shared/components/Form";
import { Button } from "../../shared/components/Button";
import Pagination from "../../shared/components/Pagination";
import {
  Check,
  CircleDollarSign,
  RefreshCcw,
  TicketCheck,
  WalletCards,
  Filter,
  Calendar,
  X,
} from "lucide-react";
import api from "../../lib/axiosConfig";

const Payments = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // filters & pagination
  const [filter, setFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // stats coming from server / computed
  const [stats, setStats] = useState({
    pendingPayout: 0,
    totalBookings: 0,
    totalPayout: 0,
    paidPayout: 0,
  });

  const [totalPages, setTotalPages] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);

  // modal state for apply payout
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requestAmount, setRequestAmount] = useState("");
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError] = useState(null);
  const [applySuccess, setApplySuccess] = useState(null);

  // Mobile filter drawer state
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        limit,
      };
      if (filter && filter !== "all") params.status = filter;
      if (dateRange.startDate) params.startDate = dateRange.startDate;
      if (dateRange.endDate) params.endDate = dateRange.endDate;

      const response = await api.get("/api/vendor/getpaymenthistory", {
        params,
      });
      const resp = response.data || {};

      // server payload structure fallback
      const payouts = Array.isArray(resp.allPayouts) ? resp.allPayouts : [];

      setBookings(
        payouts.map((p) => ({
          ...p,
          bookingDate: p.bookingDate || p.created_at || null,
          bookingStatus: p.payout_status || p.bookingStatus || null,
        }))
      );

      // Stats: prefer server-provided numbers, else compute
      const computedTotalPayout =
        resp.totalPayout ??
        payouts.reduce((a, b) => a + (Number(b.payout_amount) || 0), 0);

      const computedPendingPayout =
        resp.pendingPayout ??
        payouts.reduce(
          (a, b) =>
            a +
            (String(b.payout_status || "").toLowerCase() === "pending"
              ? Number(b.payout_amount || 0)
              : 0),
          0
        );

      setStats({
        totalPayout: computedTotalPayout,
        totalBookings:
          resp.totalBookings ?? resp.totalBookings ?? payouts.length,
        pendingPayout: computedPendingPayout,
        paidPayout: resp.paidPayout ?? 0,
      });

      // pagination meta (from API if present)
      setTotalPages(
        resp.totalPages ??
          Math.max(1, Math.ceil((resp.totalBookings ?? payouts.length) / limit))
      );
      setTotalBookings(
        resp.totalBookings ?? resp.totalBookings ?? payouts.length
      );

      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch payments:", err);
      setError("Failed to load payment history");
      setLoading(false);
    }
  }, [page, limit, filter, dateRange]);

  // initial load + refetch when page/limit/filter/dateRange change
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // handlers
  const handleFilterChange = (e) => {
    setFilter(e.target.value);
    setPage(1); // reset page when filter changes
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const openApplyModal = () => {
    setRequestAmount(Number(stats.pendingPayout || 0).toFixed(2));
    setApplyError(null);
    setApplySuccess(null);
    setIsModalOpen(true);
  };

  const closeApplyModal = () => {
    setIsModalOpen(false);
  };

  const handleApplySubmit = async () => {
    setApplyError(null);
    setApplySuccess(null);

    const amt = Number(requestAmount);
    if (!amt || amt <= 0) {
      setApplyError("Please enter a valid amount greater than 0.");
      return;
    }

    const pending = Number(stats.pendingPayout || 0);
    if (amt > pending) {
      setApplyError("Requested amount cannot be greater than pending payout.");
      return;
    }

    try {
      setApplyLoading(true);
      const payload = { requested_amount: amt }; // API expects integer
      const res = await api.post("/api/payment/applypayout", payload);

      setApplySuccess(res.data?.message || "Payout requested successfully.");
    } catch (err) {
      console.error("Apply payout error:", err);
      const msg =
        err?.response?.data?.message || "Failed to submit payout request.";
      setApplyError(msg);
    } finally {
      setApplyLoading(false);
      // Refresh the list & stats after submit and keep modal open to show result briefly
      await fetchBookings();
      setTimeout(() => {
        setIsModalOpen(false);
      }, 900);
    }
  };

  // client-side filtering fallback (keeps PaymentsTable's props compatible)
  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      if (filter !== "all") {
        const status = String(
          booking.payout_status ?? booking.bookingStatus ?? ""
        ).toLowerCase();
        if (status !== String(filter).toLowerCase()) return false;
      }

      if (dateRange.startDate && dateRange.endDate && booking.bookingDate) {
        const date = new Date(booking.bookingDate);
        const start = new Date(dateRange.startDate);
        const end = new Date(dateRange.endDate);
        end.setHours(23, 59, 59, 999);
        if (date < start || date > end) return false;
      }
      return true;
    });
  }, [bookings, filter, dateRange]);

  const resetAll = () => {
    setFilter("all");
    setDateRange({ startDate: "", endDate: "" });
    setLimit(10);
    setPage(1);
    setShowMobileFilters(false);
  };

  const applyFilters = () => {
    setPage(1);
    setShowMobileFilters(false);
  };

  if (loading && bookings.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && bookings.length === 0) {
    return (
      <div className="p-4 mx-4 mt-4 text-red-600 bg-red-100 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full px-3 py-4 mx-auto sm:px-4 sm:py-6 lg:px-6 lg:py-8">
        {/* Header Section */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                Payment History
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Track your earnings and payout requests
              </p>
            </div>
            
            {/* Mobile Filter Button */}
            <div className="flex gap-2 sm:hidden">
              <Button
                variant="outline"
                onClick={() => setShowMobileFilters(true)}
                className="flex items-center gap-2"
              >
                <Filter size={16} />
                Filters
              </Button>
              <Button
                onClick={fetchBookings}
                variant="lightInherit"
                icon={<RefreshCcw size={16} />}
              >
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-3 mb-6 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Pending Payout Card */}
          <div className="p-4 bg-white border border-gray-200 shadow-xs rounded-xl sm:p-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg sm:w-12 sm:h-12">
                <WalletCards className="w-5 h-5 text-gray-600 sm:w-6 sm:h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500 sm:text-sm">
                  Pending Payout
                </p>
                <p className="text-lg font-semibold text-gray-900 sm:text-xl">
                  C${Number(stats.pendingPayout || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Total Bookings Card */}
          <div className="p-4 bg-white border border-gray-200 shadow-xs rounded-xl sm:p-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 sm:w-12 sm:h-12">
                <TicketCheck className="w-5 h-5 text-blue-500 sm:w-6 sm:h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500 sm:text-sm">
                  Total Bookings
                </p>
                <p className="text-lg font-semibold text-blue-600 sm:text-xl">
                  {stats.totalBookings}
                </p>
              </div>
            </div>
          </div>

          {/* Total Payout Card */}
          <div className="p-4 bg-white border border-gray-200 shadow-xs rounded-xl sm:p-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-50 sm:w-12 sm:h-12">
                <CircleDollarSign className="w-5 h-5 text-green-600 sm:w-6 sm:h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500 sm:text-sm">
                  Total Payout
                </p>
                <p className="text-lg font-semibold text-green-600 sm:text-xl">
                  C${Number(stats.totalPayout || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Paid Payout Card */}
          <div className="p-4 bg-white border border-gray-200 shadow-xs rounded-xl sm:p-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-50 sm:w-12 sm:h-12">
                <Check className="w-5 h-5 text-indigo-600 sm:w-6 sm:h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500 sm:text-sm">
                  Paid Payout
                </p>
                <p className="text-lg font-semibold text-indigo-600 sm:text-xl">
                  C${Number(stats.paidPayout || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Filters */}
        <div className="hidden mb-6 sm:block">
          <div className="grid items-end grid-cols-1 gap-4 lg:grid-cols-6">
            {/* Filter */}
            <div className="lg:col-span-1">
              <label
                htmlFor="filter"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Status
              </label>
              <FormSelect
                id="filter"
                name="filter"
                value={filter}
                onChange={handleFilterChange}
                options={[
                  { value: "all", label: "All Payouts" },
                  { value: "pending", label: "Pending" },
                  { value: "approved", label: "Approved" },
                ]}
              />
            </div>

            {/* Start Date */}
            <div className="lg:col-span-1">
              <label
                htmlFor="startDate"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Start Date
              </label>
              <FormInput
                id="startDate"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateChange}
                type="date"
                aria-label="Start date"
              />
            </div>

            {/* End Date */}
            <div className="lg:col-span-1">
              <label
                htmlFor="endDate"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                End Date
              </label>
              <FormInput
                id="endDate"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateChange}
                type="date"
                aria-label="End date"
              />
            </div>

            {/* Spacer to push button to right */}
            <div className="flex justify-end col-span-3 gap-3">
              <Button
                variant="outline"
                onClick={resetAll}
                className="hidden lg:flex"
              >
                Reset Filters
              </Button>
              <Button
                onClick={fetchBookings}
                variant="lightInherit"
                icon={<RefreshCcw className="w-4 h-4" />}
                className="hidden lg:flex"
              >
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Filter Drawer */}
        {showMobileFilters && (
          <div className="fixed inset-0 z-50 sm:hidden">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black bg-opacity-50"
              onClick={() => setShowMobileFilters(false)}
            />
            
            {/* Filter Panel */}
            <div className="absolute top-0 bottom-0 right-0 w-4/5 max-w-sm bg-white shadow-xl">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Filter Select */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <FormSelect
                    value={filter}
                    onChange={handleFilterChange}
                    options={[
                      { value: "all", label: "All Payouts" },
                      { value: "pending", label: "Pending" },
                      { value: "approved", label: "Approved" },
                    ]}
                  />
                </div>

                {/* Start Date */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Start Date
                  </label>
                  <FormInput
                    name="startDate"
                    value={dateRange.startDate}
                    onChange={handleDateChange}
                    type="date"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    End Date
                  </label>
                  <FormInput
                    name="endDate"
                    value={dateRange.endDate}
                    onChange={handleDateChange}
                    type="date"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={resetAll}
                    className="flex-1"
                  >
                    Reset
                  </Button>
                  <Button
                    variant="primary"
                    onClick={applyFilters}
                    className="flex-1"
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Table Section */}
        <div className="overflow-hidden bg-white border border-gray-200 shadow-xs rounded-xl">
          <PaymentsTable
            bookings={filteredBookings}
            isLoadixng={loading}
            filteredStatus={filter}
          />

          {/* Pagination */}
          <div className="flex flex-col items-center justify-between gap-3 p-4 border-t border-gray-200 sm:flex-row">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
              disabled={loading}
              keepVisibleOnSinglePage={true}
              totalBookings={totalBookings}
              limit={limit}
              onLimitChange={(n) => {
                setLimit(n);
                setPage(1);
              }}
              renderLimitSelect={({ value, onChange, options }) => (
                <FormSelect
                  id="limit"
                  name="limit"
                  dropdownDirection="up"
                  value={value}
                  onChange={(e) => onChange(Number(e.target.value))}
                  options={options.map((v) => ({ value: v, label: `${v} per page` }))}
                  className="text-sm"
                />
              )}
              pageSizeOptions={[10, 25, 50]}
            />
            
            {/* Mobile Refresh Button */}
            <div className="flex items-center gap-2 sm:hidden">
              <span className="text-sm text-gray-500">
                Showing {Math.min(limit, filteredBookings.length)} of {totalBookings}
              </span>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {!loading && filteredBookings.length === 0 && (
          <div className="py-12 text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full">
              <WalletCards className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              No payments found
            </h3>
            <p className="mb-4 text-gray-500">
              {filter !== "all" || dateRange.startDate || dateRange.endDate
                ? "Try adjusting your filters to see more results."
                : "Your payment history will appear here once you have completed bookings."}
            </p>
            {(filter !== "all" || dateRange.startDate || dateRange.endDate) && (
              <Button
                variant="outline"
                onClick={resetAll}
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Payout Request Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-40"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
            <h3 className="mb-3 text-lg font-semibold text-gray-900">Request Payout</h3>
            <p className="mb-4 text-sm text-gray-600">
              Available for withdrawal:{" "}
              <strong className="text-green-600">
                C${Number(stats.pendingPayout || 0).toFixed(2)}
              </strong>
            </p>

            <label className="block mb-2 text-sm font-medium text-gray-700">
              Amount to request
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max={stats.pendingPayout}
              value={requestAmount}
              onChange={(e) => setRequestAmount(e.target.value)}
              className="w-full px-3 py-2 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="0.00"
            />

            {applyError && (
              <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
                {applyError}
              </div>
            )}
            {applySuccess && (
              <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-lg">
                {applySuccess}
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
              <Button 
                onClick={closeApplyModal} 
                variant="outline" 
                className="sm:order-1"
                disabled={applyLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleApplySubmit}
                disabled={applyLoading}
                variant="primary"
                className="sm:order-2"
              >
                {applyLoading ? "Submitting..." : "Confirm Request"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
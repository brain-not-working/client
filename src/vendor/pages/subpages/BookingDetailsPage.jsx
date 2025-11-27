import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { formatDate, formatTime } from "../../../shared/utils/dateUtils";
import StatusBadge from "../../../shared/components/StatusBadge";
import LoadingSpinner from "../../../shared/components/LoadingSpinner";
import api from "../../../lib/axiosConfig";
import Breadcrumb from "../../../shared/components/Breadcrumb";
import PaymentBadge from "../../../shared/components/PaymentBadge";
import { Button } from "../../../shared/components/Button";
import { toast } from "sonner";
import RatingModal from "../../../employees/components/Modals/RatingModal";
import {
  Calendar,
  Clock,
  Mail,
  MapPin,
  Phone,
  User as UserIcon,
  ArrowLeft,
  Play,
  CheckCircle,
  AlertCircle,
  Info,
  Star,
  Package,
  Settings,
  FileText,
  Image,
  Navigation,
  MessageCircle,
  Shield,
  Sparkles,
  Users,
  CreditCard,
  BadgeInfo,
  ChevronRight,
} from "lucide-react";

const BookingDetailsPage = () => {
  const { bookingId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(location.state?.booking || null);
  const [loading, setLoading] = useState(false);
  const [vendorType, setVendorType] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const vendorData = localStorage.getItem("vendorData");
    if (vendorData) {
      try {
        const parsed = JSON.parse(vendorData);
        setVendorType(parsed.vendor_type);
      } catch (err) {
        console.warn("Failed to parse vendorData from localStorage", err);
      }
    }
  }, []);

  const fetchBooking = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("vendorToken");
      const res = await api.get("/api/booking/vendorassignedservices", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const bookingsArray = res?.data?.bookings || [];
      const found = bookingsArray.find(
        (b) => Number(b.booking_id) === Number(bookingId)
      );
      if (found) setBooking(found);
      else console.warn("Booking not found in vendorassignedservice response");
    } catch (error) {
      console.error("Failed to fetch booking:", error);
      toast.error("Failed to load booking details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!booking) fetchBooking();
    else {
      fetchBooking();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const handleUpdateBookingStatus = async (status) => {
    try {
      const response = await api.put(`/api/vendor/updatebookingstatus`, {
        booking_id: bookingId,
        status,
      });

      if (response.status === 200) {
        toast.success(
          `Booking ${
            status === 3 ? "started" : status === 4 ? "completed" : "updated"
          } successfully`
        );
        setBooking((prev) =>
          prev ? { ...prev, bookingStatus: status } : prev
        );
        await fetchBooking();
      }
      if (status === 4) setShowRatingModal(true);
    } catch (error) {
      console.error("Error updating booking status:", error);
      toast.error(
        error?.response?.data?.message || "Failed to update booking status"
      );
    }
  };

  if (loading || !booking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center">
          <div className="relative">
            <LoadingSpinner className="w-16 h-16 text-green-600" />
            <Sparkles className="absolute text-yellow-500 -top-2 -right-2 animate-pulse" size={24} />
          </div>
          <p className="mt-4 text-lg font-semibold text-gray-700">Loading Booking Details</p>
          <p className="mt-2 text-sm text-gray-500">Preparing your booking information...</p>
        </div>
      </div>
    );
  }

  const subPackages = booking.sub_packages || booking.subPackages || [];
  const customerProfileImg =
    booking.userProfileImage || booking.user_profile_image;

  const TabButton = ({ id, icon: Icon, label, active }) => (
    <button
      onClick={() => {
        setActiveTab(id);
        setIsMobileMenuOpen(false);
      }}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${
        active === id
          ? "bg-green-600 text-white shadow-sm"
          : "text-gray-600 hover:bg-green-50 hover:text-green-700"
      }`}
    >
      <Icon size={18} />
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );

  const InfoCard = ({ icon: Icon, title, children, className = "" }) => (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <div className="flex items-center gap-3 mb-3 sm:mb-4">
        <div className="p-2 bg-green-100 rounded-lg">
          <Icon size={18} className="text-green-600" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900 sm:text-base">{title}</h3>
      </div>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="px-3 py-4 mx-auto max-w-7xl sm:px-4 sm:py-6 lg:px-6 lg:py-8">
        {/* Header Section */}
        <div className="mb-4 sm:mb-6">
          <div className="mb-4">
            <Breadcrumb
              links={[
                { label: "Dashboard", to: "/dashboard" },
                { label: "Bookings", to: "/bookings" },
                { label: `Booking #${booking.booking_id}` },
              ]}
            />
          </div>
          
          {/* Mobile Header */}
          <div className="lg:hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="p-2 transition-colors duration-200 rounded-lg hover:bg-white"
                >
                  <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    #{booking.booking_id}
                  </h1>
                  <p className="text-xs text-gray-600">
                    {formatDate(booking.bookingDate)} • {formatTime(booking.bookingTime)}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <StatusBadge status={booking.bookingStatus} />
                <PaymentBadge status={booking.payment_status} />
              </div>
            </div>

            {/* Mobile Tab Selector */}
            <div className="relative">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="flex items-center justify-between w-full px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm"
              >
                <span className="font-medium text-gray-700">
                  {activeTab === "details" ? "Service Details" : "Customer Info"}
                </span>
                <ChevronRight 
                  size={18} 
                  className={`text-gray-400 transition-transform ${isMobileMenuOpen ? 'rotate-90' : ''}`}
                />
              </button>
              
              {isMobileMenuOpen && (
                <div className="absolute left-0 right-0 z-10 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg top-full">
                  <TabButton 
                    id="details" 
                    icon={FileText} 
                    label="Service Details" 
                    active={activeTab} 
                  />
                  <TabButton 
                    id="customer" 
                    icon={UserIcon} 
                    label="Customer Info" 
                    active={activeTab} 
                  />
                </div>
              )}
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:block">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate(-1)}
                  className="p-2 transition-colors duration-200 rounded-lg hover:bg-white"
                >
                  <ArrowLeft size={24} className="text-gray-600" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Booking #{booking.booking_id}
                  </h1>
                  <p className="mt-1 text-gray-600">
                    {formatDate(booking.bookingDate)} at {formatTime(booking.bookingTime)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={booking.bookingStatus} />
                <PaymentBadge status={booking.payment_status} />
              </div>
            </div>

            {/* Desktop Navigation Tabs */}
            <div className="mt-6">
              <div className="flex gap-2 p-2 bg-white border border-gray-200 shadow-sm rounded-xl w-fit">
                <TabButton 
                  id="details" 
                  icon={FileText} 
                  label="Service Details" 
                  active={activeTab} 
                />
                <TabButton 
                  id="customer" 
                  icon={UserIcon} 
                  label="Customer Info" 
                  active={activeTab} 
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-6 lg:gap-6">
          {/* Main Content */}
          <div className="space-y-4 lg:col-span-4 lg:space-y-6">
            {/* Customer Card */}
            {activeTab === "customer" && (
              <InfoCard icon={UserIcon} title="Customer Information">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-4">
                  <div className="flex-shrink-0 mx-auto sm:mx-0">
                    {customerProfileImg ? (
                      <img
                        src={customerProfileImg}
                        alt={booking.userName || "Customer"}
                        className="object-cover w-16 h-16 border-2 border-green-200 shadow-sm rounded-xl sm:w-20 sm:h-20"
                        loading="lazy"
                        onError={(e) =>
                          (e.currentTarget.src = "/avatar-placeholder.png")
                        }
                      />
                    ) : (
                      <div className="flex items-center justify-center w-16 h-16 border-2 border-green-200 rounded-xl bg-gradient-to-br from-green-100 to-blue-100 sm:w-20 sm:h-20">
                        <UserIcon size={24} className="text-green-400 sm:size-8" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h2 className="mb-3 text-lg font-bold text-center text-gray-900 sm:text-left sm:text-xl">
                      {booking.userName || booking.user_name || "N/A"}
                    </h2>
                    
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                        <MapPin className="flex-shrink-0 mt-0.5 text-green-600" size={18} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 sm:text-base">Address</div>
                          <div className="text-sm text-gray-600">{booking.userAddress || "No address provided"}</div>
                        </div>
                      </div>
                      
                      {booking.userPhone && (
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                          <Phone className="flex-shrink-0 mt-0.5 text-green-600" size={18} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 sm:text-base">Phone</div>
                            <a
                              href={`tel:${booking.userPhone}`}
                              className="text-sm text-gray-600 transition-colors hover:text-green-600"
                            >
                              {booking.userPhone}
                            </a>
                          </div>
                        </div>
                      )}

                      {booking.userEmail && (
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                          <Mail className="flex-shrink-0 mt-0.5 text-blue-600" size={18} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 sm:text-base">Email</div>
                            <a
                              href={`mailto:${booking.userEmail}`}
                              className="text-sm text-gray-600 break-all transition-colors hover:text-green-600"
                            >
                              {booking.userEmail}
                            </a>
                          </div>
                        </div>
                      )}

                      {booking.userParkingInstructions && (
                        <div className="flex items-start gap-3 p-3 border border-yellow-200 rounded-lg bg-yellow-50">
                          <AlertCircle className="flex-shrink-0 mt-0.5 text-yellow-600" size={18} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 sm:text-base">Parking Instructions</div>
                            <div className="text-sm text-gray-600">{booking.userParkingInstructions}</div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 mt-4 sm:flex-row">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          booking.userAddress || ""
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1"
                      >
                        <Button variant="primary" className="w-full text-sm py-2.5">
                          <Navigation size={16} className="mr-2" />
                          Open Maps
                        </Button>
                      </a>
                      {booking.userPhone && (
                        <a href={`tel:${booking.userPhone}`} className="flex-1">
                          <Button variant="outline" className="w-full text-sm py-2.5">
                            <Phone size={16} className="mr-2" />
                            Call
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </InfoCard>
            )}

            {/* Service Details */}
            {(activeTab === "details" || activeTab === "actions") && (
              <div className="space-y-4">
                {subPackages.map((pkg, index) => (
                  <InfoCard 
                    key={pkg.package_id || pkg.sub_package_id} 
                    icon={Package}
                    title={pkg.packageName || `Service Package ${index + 1}`}
                    className="transition-all duration-300 hover:shadow-lg"
                  >
                    <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-start sm:gap-4">
                      <div className="flex-shrink-0 w-full h-40 overflow-hidden border-2 border-green-200 shadow-sm rounded-xl sm:w-24 sm:h-24">
                        {pkg.packageMedia ? (
                          <img
                            src={pkg.packageMedia}
                            alt={pkg.packageName}
                            className="object-cover w-full h-full"
                            loading="lazy"
                            onError={(e) =>
                              (e.currentTarget.src = "/placeholder-rect.png")
                            }
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-green-50 to-blue-50">
                            <Package size={32} className="text-green-300" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-base font-semibold text-gray-900 sm:text-lg line-clamp-2">
                              {pkg.packageName || "Package"}
                            </h4>
                            <p className="mt-1 text-xs text-gray-600 sm:text-sm">
                              {pkg.items?.length || 0} items • {pkg.totalTime || "Time not specified"}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600 sm:text-xl">
                              {/* ${pkg.totalPrice ?? booking.payment_amount ?? "0.00"} */}
                            </div>
                            <div className="text-xs text-gray-500">Total</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {pkg.items?.map((item, itemIndex) => (
                        <div
                          key={item.sub_package_id || item.itemName}
                          className="p-3 border border-green-100 bg-gradient-to-r from-gray-50 to-green-50 rounded-xl sm:p-4"
                        >
                          <div className="flex flex-col gap-3 mb-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex items-start flex-1 gap-3">
                              <div className="flex-shrink-0 w-12 h-12 overflow-hidden border-2 border-white rounded-lg shadow-sm sm:w-16 sm:h-16">
                                {item.itemMedia ? (
                                  <img
                                    src={item.itemMedia}
                                    alt={item.itemName}
                                    className="object-cover w-full h-full"
                                    loading="lazy"
                                    onError={(e) =>
                                      (e.currentTarget.src = "/placeholder-square.png")
                                    }
                                  />
                                ) : (
                                  <div className="flex items-center justify-center w-full h-full bg-white">
                                    <Package size={16} className="text-gray-400 sm:size-5" />
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <h5 className="text-sm font-semibold text-gray-900 sm:text-base line-clamp-2">
                                  {item.itemName || item.item_name}
                                </h5>
                                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-600 sm:text-sm">
                                  <span>⏱️ {item.timeRequired} min</span>
                                  <span>📦 Qty: {item.quantity ?? 1}</span>
                                  {/* {item.price && <span>💰 ${item.price}</span>} */}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Enhanced Details Sections */}
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {item.addons?.length > 0 && (
                              <div className="p-2 bg-white border border-green-200 rounded-lg sm:p-3">
                                <div className="flex items-center gap-2 mb-1 sm:mb-2">
                                  <Sparkles size={14} className="text-green-600 sm:size-4" />
                                  <span className="text-xs font-semibold text-gray-700 sm:text-sm">Addons</span>
                                  <span className="px-1.5 py-0.5 text-xs font-bold text-green-800 bg-green-100 rounded-full sm:px-2">
                                    {item.addons.length}
                                  </span>
                                </div>
                                <ul className="space-y-1">
                                  {item.addons.map((addon) => (
                                    <li key={addon.addon_id || addon.addonName} className="flex justify-between text-xs text-gray-600">
                                      <span className="truncate">{addon.addonName}</span>
                                      {addon.quantity && (
                                        <span className="flex-shrink-0 ml-1 text-gray-500">×{addon.quantity}</span>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {item.preferences?.length > 0 && (
                              <div className="p-2 bg-white border border-blue-200 rounded-lg sm:p-3">
                                <div className="flex items-center gap-2 mb-1 sm:mb-2">
                                  <Settings size={14} className="text-blue-600 sm:size-4" />
                                  <span className="text-xs font-semibold text-gray-700 sm:text-sm">Preferences</span>
                                  <span className="px-1.5 py-0.5 text-xs font-bold text-blue-800 bg-blue-100 rounded-full sm:px-2">
                                    {item.preferences.length}
                                  </span>
                                </div>
                                <ul className="space-y-1">
                                  {item.preferences.map((pref) => (
                                    <li key={pref.preference_id || pref.preferenceValue} className="text-xs text-gray-600 line-clamp-2">
                                      {pref.preferenceValue}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {item.consents?.length > 0 && (
                              <div className="p-2 bg-white border border-orange-200 rounded-lg sm:p-3">
                                <div className="flex items-center gap-2 mb-1 sm:mb-2">
                                  <Shield size={14} className="text-orange-600 sm:size-4" />
                                  <span className="text-xs font-semibold text-gray-700 sm:text-sm">Consents</span>
                                  <span className="px-1.5 py-0.5 text-xs font-bold text-orange-800 bg-orange-100 rounded-full sm:px-2">
                                    {item.consents.length}
                                  </span>
                                </div>
                                <ul className="space-y-1">
                                  {item.consents.map((c) => (
                                    <li key={c.consent_id || c.consentText} className="text-xs text-gray-600 line-clamp-2">
                                      {c.consentText}
                                      <span className={`ml-1 font-semibold ${
                                        c.answer ? 'text-green-600' : 'text-red-600'
                                      }`}>
                                        {c.answer != null ? `— ${c.answer}` : ""}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </InfoCard>
                ))}

                {/* Additional Information */}
                <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
                  {booking.notes && (
                    <InfoCard icon={FileText} title="Special Notes">
                      <p className="p-3 text-sm text-gray-700 border border-yellow-200 rounded-lg bg-yellow-50">
                        {booking.notes}
                      </p>
                    </InfoCard>
                  )}

                  {booking.preferences?.length > 0 && (
                    <InfoCard icon={Settings} title="Booking Preferences">
                      <ul className="space-y-2">
                        {booking.preferences.map((p) => (
                          <li key={p.preference_id || p.preferenceValue} className="flex items-center gap-2 text-sm text-gray-700">
                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full flex-shrink-0"></div>
                            <span className="line-clamp-2">{p.preferenceValue}</span>
                          </li>
                        ))}
                      </ul>
                    </InfoCard>
                  )}

                  {booking.bookingMedia && (
                    <InfoCard icon={Image} title="Attached Media" className="md:col-span-2">
                      <img
                        src={booking.bookingMedia}
                        alt="Attached media"
                        className="w-full max-w-md mx-auto mt-2 border shadow-sm rounded-xl sm:max-w-xs"
                      />
                    </InfoCard>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4 lg:col-span-2 lg:space-y-6">
            {/* Schedule Card */}
            <InfoCard icon={Calendar} title="Schedule & Payment">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between p-2 border border-blue-200 rounded-lg bg-blue-50 sm:p-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="text-blue-600" size={16} />
                    <span className="text-sm font-medium text-gray-900 sm:text-base">Date</span>
                  </div>
                  <span className="text-xs text-gray-700 sm:text-sm">{formatDate(booking.bookingDate)}</span>
                </div>

                <div className="flex items-center justify-between p-2 border border-green-200 rounded-lg bg-green-50 sm:p-3">
                  <div className="flex items-center gap-2">
                    <Clock className="text-green-600" size={16} />
                    <span className="text-sm font-medium text-gray-900 sm:text-base">Time</span>
                  </div>
                  <span className="text-xs text-gray-700 sm:text-sm">{formatTime(booking.bookingTime)}</span>
                </div>

                {booking.start_time && (
                  <div className="flex items-center justify-between p-2 border border-green-200 rounded-lg bg-green-50 sm:p-3">
                    <div className="flex items-center gap-2">
                      <Play className="text-green-600" size={16} />
                      <span className="text-sm font-medium text-gray-900 sm:text-base">Started</span>
                    </div>
                    <span className="text-xs text-gray-700">
                      {new Date(booking.start_time).toLocaleTimeString()}
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t sm:pt-3">
                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <div className="flex items-center gap-2">
                      <CreditCard className="text-gray-600" size={16} />
                      <span className="text-sm font-medium text-gray-900 sm:text-base">Payment</span>
                    </div>
                    <span className="text-base font-bold text-green-600 sm:text-lg">
                      ${booking.payment_amount ?? booking.net_amount ?? "0.00"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-gray-600">Status</span>
                    <PaymentBadge status={booking.payment_status} />
                  </div>
                </div>
              </div>
            </InfoCard>

            {/* Actions Card */}
            <InfoCard icon={Settings} title="Service Actions">
              <div className="space-y-2 sm:space-y-3">
                {vendorType === "individual" ? (
                  <>
                    <Button
                      variant="primary"
                      onClick={() => handleUpdateBookingStatus(3)}
                      disabled={booking.bookingStatus !== 1}
                      className="w-full py-2.5 font-semibold transition-all duration-200 rounded-lg text-sm sm:py-3 sm:text-base hover:shadow-lg"
                    >
                      <Play size={16} className="mr-2" />
                      Start Service
                    </Button>

                    <Button
                      variant="success"
                      onClick={() => handleUpdateBookingStatus(4)}
                      disabled={booking.bookingStatus !== 3}
                      className="w-full py-2.5 font-semibold transition-all duration-200 rounded-lg text-sm sm:py-3 sm:text-base hover:shadow-lg"
                    >
                      <CheckCircle size={16} className="mr-2" />
                      Complete Service
                    </Button>
                  </>
                ) : (
                  <div className="p-3 text-center border rounded-lg bg-gray-50 sm:p-4">
                    <Users size={24} className="mx-auto mb-2 text-gray-400 sm:size-8" />
                    <p className="text-xs text-gray-600 sm:text-sm">
                      No direct actions available for your vendor type.
                    </p>
                  </div>
                )}

                <div className="pt-2 space-y-2 border-t sm:pt-3">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      booking.userAddress || ""
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block"
                  >
                    <Button variant="outline" className="w-full text-sm py-2.5">
                      <Navigation size={16} className="mr-2" />
                      Open Map
                    </Button>
                  </a>
                  
                  <Button
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    className="w-full text-sm py-2.5"
                  >
                    <ArrowLeft size={16} className="mr-2" />
                    Back to Bookings
                  </Button>
                </div>
              </div>
            </InfoCard>

            {/* Assigned Employee */}
            {booking.assignedEmployee && (
              <InfoCard icon={Users} title="Assigned Team">
                <div className="p-3 text-center sm:p-4">
                  <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 text-sm font-bold text-white rounded-full shadow-md bg-gradient-to-br from-green-400 to-blue-500 sm:w-16 sm:h-16 sm:text-base">
                    {booking.assignedEmployee.name?.charAt(0) || "U"}
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900 sm:text-base">
                    {booking.assignedEmployee.name}
                  </h4>
                  <p className="mt-1 text-xs text-gray-600 sm:text-sm">
                    {booking.assignedEmployee.role || "Service Professional"}
                  </p>
                  {booking.assignedEmployee.phone && (
                    <a
                      href={`tel:${booking.assignedEmployee.phone}`}
                      className="inline-flex items-center gap-2 mt-2 text-xs text-green-600 transition-colors hover:text-green-700 sm:text-sm"
                    >
                      <Phone size={14} />
                      {booking.assignedEmployee.phone}
                    </a>
                  )}
                </div>
              </InfoCard>
            )}

            {/* Quick Stats */}
            <InfoCard icon={BadgeInfo} title="Booking Summary">
              <div className="space-y-2 text-xs sm:space-y-3 sm:text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Booking ID</span>
                  <span className="font-mono font-semibold">#{booking.booking_id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Items</span>
                  <span className="font-semibold">
                    {subPackages.reduce((total, pkg) => total + (pkg.items?.length || 0), 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status</span>
                  <StatusBadge status={booking.bookingStatus} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Payment</span>
                  <PaymentBadge status={booking.payment_status} />
                </div>
              </div>
            </InfoCard>
          </div>
        </div>
      </div>

      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        bookingId={booking.booking_id}
      />
    </div>
  );
};

export default BookingDetailsPage;
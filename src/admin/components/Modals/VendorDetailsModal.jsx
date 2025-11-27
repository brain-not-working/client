import React, { useEffect, useState } from "react";
import Modal from "../../../shared/components/Modal/Modal";
import UniversalDeleteModal from "../../../shared/components/Modal/UniversalDeleteModal";
import { Button, IconButton } from "../../../shared/components/Button";
import StatusBadge from "../../../shared/components/StatusBadge";
import api from "../../../lib/axiosConfig";
import { Trash } from "lucide-react";
import { toast } from "sonner";

export default function VendorDetailsModal({
  refresh,
  isOpen,
  onClose,
  vendor,
  onApprove,
  onReject,
}) {
  if (!vendor) return null;

  const getVendorName = () =>
    vendor.vendorType === "individual"
      ? vendor.individual_name
      : vendor.company_companyName;

  const getVendorEmail = () =>
    vendor.vendorType === "individual"
      ? vendor.individual_email
      : vendor.company_companyEmail;

  const getVendorPhone = () =>
    vendor.vendorType === "individual"
      ? vendor.individual_phone
      : vendor.company_companyPhone;

  const initialStatus =
    typeof vendor.status !== "undefined" ? vendor.status : null;

  const [localStatus, setLocalStatus] = useState(initialStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [pendingValue, setPendingValue] = useState(null);
  const [saving, setSaving] = useState(false);
  const [localServices, setLocalServices] = useState(vendor.services ?? []);

  // New states for delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);
  const [deleteDesc, setDeleteDesc] = useState("");
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    setLocalServices(vendor.services ?? []);
  }, [vendor?.services]);

  useEffect(() => {
    const newStatus =
      typeof vendor.status !== "undefined" ? vendor.status : null;
    setLocalStatus(newStatus);
  }, [vendor]);

  const updateVendorStatus = async (status, note = "") => {
    if (!vendor || !vendor.vendor_id) return;
    setIsUpdating(true);
    try {
      const url = `/api/admin/editvendorstatus/${vendor.vendor_id}`;
      const payload = { status, note };
      const { data } = await api.put(url, payload);

      setLocalStatus(status);
      setShowNoteModal(false);
      setNoteText("");
      setPendingValue(null);
      refresh && refresh();
      toast.success(data?.message || "Vendor status updated");
    } catch (err) {
      console.error("Failed to update vendor status", err);
      toast.error("Failed to update vendor status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleClick = () => {
    if (localStatus === 1) {
      setPendingValue(0);
      setShowNoteModal(true);
    } else {
      updateVendorStatus(1);
    }
  };

  const handleApprove = async () => {
    try {
      setSaving(true);
      await onApprove(vendor.vendor_id);
      refresh && refresh();
      toast.success("Vendor approved");
    } catch (err) {
      console.error(err);
      toast.error("Failed to approve vendor");
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    try {
      setSaving(true);
      await onReject(vendor.vendor_id);
      refresh && refresh();
      toast.success("Vendor rejected");
    } catch (err) {
      console.error(err);
      toast.error("Failed to reject vendor");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteService = async (vendor_packages_id) => {
    if (!vendor_packages_id) return;

    const prevServices = JSON.parse(JSON.stringify(localServices));

    const updatedServices = localServices.map((svc) => {
      if (!Array.isArray(svc.packages)) return svc;
      const newPackages = svc.packages
        .map((pkg) => {
          if (!Array.isArray(pkg.items)) return pkg;
          const filteredItems = pkg.items.filter(
            (it) => it.vendor_packages_id !== vendor_packages_id
          );
          return { ...pkg, items: filteredItems };
        })
        .filter((pkg) =>
          Array.isArray(pkg.items) ? pkg.items.length > 0 : true
        );

      return { ...svc, packages: newPackages };
    });

    setLocalServices(updatedServices);

    try {
      const response = await api.delete(
        `/api/admin/removepackage/${vendor_packages_id}`
      );
      toast.success(
        response.data?.message || "Vendor package removed successfully by admin"
      );
      refresh && refresh();
      return { success: true };
    } catch (err) {
      console.error("Failed to delete service", err);
      setLocalServices(prevServices);
      toast.error("Failed to delete service");
      return { success: false, error: err };
    }
  };

  const openDeleteModal = (vendor_packages_id, itemName) => {
    setDeletingItem(vendor_packages_id);
    setDeleteDesc(
      itemName
        ? `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
        : "Are you sure you want to delete this package item? This action cannot be undone."
    );
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingItem) {
      setShowDeleteModal(false);
      return;
    }
    try {
      setDeleting(true);
      await handleDeleteService(deletingItem);
      setShowDeleteModal(false);
      setDeletingItem(null);
    } catch (err) {
      console.error("Confirm delete error:", err);
      toast.error("Error deleting item");
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmitNote = () => {
    updateVendorStatus(pendingValue === null ? 0 : pendingValue, noteText);
  };

  // --- UI ---
  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Vendor Details"
        size="xxl"
      >
        {/* Modal container: fixed height with sticky header and scrollable body */}
        <div className="w-full max-h-[75vh] overflow-hidden rounded-lg">
          {/* Sticky Header */}
          <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-gray-100">
            <div className="px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-2xl font-semibold shadow-sm overflow-hidden">
                  {vendor.profile_image ? (
                    <img
                      src={vendor.profile_image}
                      alt="Vendor"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    String(
                      (getVendorName() || "?").trim().charAt(0)
                    ).toUpperCase()
                  )}
                </div>

                <div className="min-w-0">
                  <div className="text-xs text-gray-500">Vendor</div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {getVendorName() || "N/A"}
                    </h3>
                    <StatusBadge status={vendor.is_authenticated} />
                  </div>
                  <div className="text-sm text-gray-500 mt-1 truncate">
                    {getVendorEmail() || "—"} • {getVendorPhone() || "—"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-gray-500 mr-2">Status</div>
                    <label className="flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={localStatus === 1}
                        onChange={handleToggleClick}
                        disabled={isUpdating}
                      />
                      <div
                        className={`w-14 h-7 rounded-full relative transition-colors ${
                          localStatus === 1 ? "bg-emerald-500" : "bg-gray-200"
                        }`}
                        role="switch"
                        aria-checked={localStatus === 1}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
                            localStatus === 1
                              ? "translate-x-7"
                              : "translate-x-0"
                          }`}
                        />
                      </div>
                    </label>

                    {isUpdating && (
                      <div className="text-xs text-gray-500 ml-2">
                        Updating…
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="lightPrimary"
                      onClick={handleApprove}
                      disabled={saving || vendor.is_authenticated == 1}
                    >
                      {saving ? "Processing..." : "Approve"}
                    </Button>
                    <Button
                      variant="lightError"
                      onClick={handleReject}
                      disabled={
                        saving ||
                        vendor.is_authenticated == 0 ||
                        vendor.is_authenticated == 2
                      }
                    >
                      {saving ? "Processing..." : "Reject"}
                    </Button>
                  </div>
                </div>

                {/* Close button - use provided onClose */}
                {/* <div className="ml-2">
                  <Button variant="ghost" onClick={onClose}>
                    Close
                  </Button>
                </div> */}
              </div>
            </div>

            {/* Tabs - underline style */}
            <div className="border-b border-gray-200 px-6">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-500 flex items-center ${
                    activeTab === "profile"
                      ? "border-green-500 text-green-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Profile Information
                </button>

                <button
                  onClick={() => setActiveTab("services")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-500 flex items-center ${
                    activeTab === "services"
                      ? "border-green-500 text-green-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Services Offered
                </button>

                <button
                  onClick={() => setActiveTab("bank")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-500 flex items-center ${
                    activeTab === "bank"
                      ? "border-green-500 text-green-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Bank Details
                </button>
              </nav>
            </div>
          </div>

          {/* Body - scrollable */}
          <div className="px-6 pb-6 overflow-y-auto max-h-[calc(85vh-140px)]">
            {/* calc subtract header + tabs approximate height so content fits */}
            <div className="p-3 space-y-6">
              {/* PROFILE */}
              {activeTab === "profile" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 ">
                  <div className="col-span-3 lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
                      <h4 className="text-sm font-medium text-gray-700 mb-4">
                        Details
                      </h4>

                      {vendor.vendorType === "individual" ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
                          <div>
                            <div className="text-xs text-gray-500">
                              Full Name
                            </div>
                            <div className="font-medium text-gray-900">
                              {vendor.individual_name || "N/A"}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-gray-500">Email</div>
                            <div className="font-medium text-gray-900 truncate">
                              {vendor.individual_email || "N/A"}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-gray-500">Phone</div>
                            <div className="font-medium text-gray-900">
                              {vendor.individual_phone || "N/A"}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-gray-500">
                              Expertise
                            </div>
                            <div className="font-medium text-gray-900">
                              {vendor.individual_expertise || "N/A"}
                            </div>
                          </div>

                          <div className="md:col-span-2">
                            <div className="text-xs text-gray-500">About</div>
                            <div className="whitespace-pre-line text-sm text-gray-800 mt-1">
                              {vendor.individual_aboutMe || "N/A"}
                            </div>
                          </div>

                          {vendor.individual_resume && (
                            <div>
                              <div className="text-xs text-gray-500">
                                Resume
                              </div>
                              <a
                                href={vendor.individual_resume}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm text-emerald-600 hover:underline mt-1 inline-block"
                              >
                                View Resume
                              </a>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3 text-sm text-gray-700">
                          <div>
                            <div className="text-xs text-gray-500">Company</div>
                            <div className="font-medium text-gray-900">
                              {vendor.company_companyName || "N/A"}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-gray-500">
                              Contact Person
                            </div>
                            <div className="font-medium text-gray-900">
                              {vendor.company_contactPerson || "N/A"}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-gray-500">Email</div>
                            <div className="font-medium text-gray-900">
                              {vendor.company_companyEmail || "N/A"}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-gray-500">Phone</div>
                            <div className="font-medium text-gray-900">
                              {vendor.company_companyPhone || "N/A"}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-gray-500">Address</div>
                            <div className="font-medium text-gray-900">
                              {vendor.company_companyAddress || "N/A"}
                            </div>
                          </div>

                          {vendor.company_googleBusinessProfileLink && (
                            <div>
                              <a
                                href={vendor.company_googleBusinessProfileLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm text-emerald-600 hover:underline"
                              >
                                Open Google Business Profile
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Extra Info Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
                      <h4 className="text-sm font-medium text-gray-700 mb-4">
                        Additional Info
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
                        <div>
                          <div className="text-xs text-gray-500">
                            Vendor Type
                          </div>
                          <div className="font-medium text-gray-900">
                            {vendor.vendorType || "N/A"}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-gray-500">
                            Last Access
                          </div>
                          <div className="font-medium text-gray-900">
                            {vendor.last_access || "N/A"}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-gray-500">Status</div>
                          <div className="font-medium text-gray-900">
                            {localStatus === 1 ? "Active" : "Inactive"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right column: quick stats or actions */}
                  <aside className="col-span-3 lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
                      <div className="text-xs text-gray-500">
                        Bank Connected
                      </div>
                      <div className="mt-2 font-medium text-gray-900">
                        {!!vendor.bank_details ? "Yes" : "No"}
                      </div>
                      {vendor.bank_details && (
                        <div className="mt-3 text-xs text-gray-500">
                          Preferred:{" "}
                          <span className="font-medium text-gray-900">
                            {vendor.bank_details.preferred_transfer_type ||
                              "N/A"}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-gray-500">Services</div>
                          <div className="mt-1 font-medium text-gray-900">
                            {localServices?.length ?? 0}
                          </div>
                        </div>
                        <div>
                          <Button
                            variant="ghost"
                            onClick={() => setActiveTab("services")}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  </aside>
                </div>
              )}

              {/* SERVICES */}
              {activeTab === "services" && (
                <div className="space-y-4">
                  <div className=" p-6  ">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">
                          Services & Packages
                        </h4>
                        <div className="text-xs text-gray-500 mt-1">
                          {localServices?.length ?? 0} services
                        </div>
                      </div>
                    </div>

                    {localServices?.length > 0 ? (
                      <div className="space-y-4">
                        {localServices.map((service, sIndex) => (
                          <div key={service.service_id ?? sIndex} className="">
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex items-center gap-3">
                                {service.serviceImage ? (
                                  <img
                                    src={service.serviceImage}
                                    alt={service.serviceName || "service"}
                                    className="w-12 h-12 rounded object-cover border"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded bg-white flex items-center justify-center text-xs text-gray-400 border">
                                    No image
                                  </div>
                                )}

                                <div>
                                  <div className="text-sm font-semibold text-gray-800">
                                    {service.serviceName}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Category: {service.categoryName}
                                  </div>
                                </div>
                              </div>

                              <div className="text-xs text-gray-500">
                                {service.packages?.length ?? 0} packages
                              </div>
                            </div>

                            {service.packages?.length > 0 ? (
                              <div className="space-y-3">
                                {service.packages.map((pkg, pkgIndex) => (
                                  <div
                                    key={pkg.package_id ?? pkgIndex}
                                    className="rounded-lg border bg-white p-3"
                                  >
                                    <div className="flex items-start justify-between mb-2">
                                      <div>
                                        <div className="text-sm font-semibold text-gray-800">
                                          {pkg.packageName ||
                                            `Package ${
                                              pkg.package_id ?? pkgIndex
                                            }`}
                                        </div>
                                        {pkg.serviceLocation && (
                                          <div className="text-xs text-gray-500 mt-1">
                                            Location: {pkg.serviceLocation}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      {Array.isArray(pkg.items) &&
                                        pkg.items.length === 0 && (
                                          <div className="text-xs text-gray-500 italic">
                                            No items in this package.
                                          </div>
                                        )}

                                      {pkg.items &&
                                        pkg.items.map((item, itemIndex) => (
                                          <div
                                            key={
                                              item.vendor_packages_id ??
                                              item.package_item_id ??
                                              itemIndex
                                            }
                                            className="flex items-start gap-3 p-3 rounded bg-gray-50"
                                          >
                                            {item.itemMedia ? (
                                              <div className="w-28 h-20 bg-white rounded overflow-hidden flex-shrink-0 border">
                                                <img
                                                  src={item.itemMedia}
                                                  alt={item.itemName}
                                                  className="object-cover w-full h-full"
                                                />
                                              </div>
                                            ) : (
                                              <div className="w-28 h-20 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400 border">
                                                No image
                                              </div>
                                            )}

                                            <div className="flex-1">
                                              <div className="font-medium text-gray-900 text-sm">
                                                {item.itemName}
                                              </div>
                                              {item.description && (
                                                <div className="text-xs text-gray-600 mt-1">
                                                  {item.description}
                                                </div>
                                              )}

                                              <div className="mt-3 flex items-center gap-3">
                                                {item.price != null && (
                                                  <div className="text-xs text-gray-500">
                                                    Price:{" "}
                                                    <span className="font-medium text-gray-900">
                                                      {String(item.price)}
                                                    </span>
                                                  </div>
                                                )}
                                                {item.time_required && (
                                                  <div className="text-xs text-gray-500">
                                                    Time:{" "}
                                                    <span className="font-medium text-gray-900">
                                                      {item.time_required}
                                                    </span>
                                                  </div>
                                                )}
                                              </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-2">
                                              {item.vendor_packages_id && (
                                                <IconButton
                                                  onClick={() =>
                                                    openDeleteModal(
                                                      item.vendor_packages_id,
                                                      item.itemName
                                                    )
                                                  }
                                                  variant="lightDanger"
                                                  ariaLabel="Delete package"
                                                  icon={<Trash />}
                                                />
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500 italic">
                                No packages for this service.
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 italic">
                        No services listed for this vendor.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* BANK */}
              {activeTab === "bank" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="col-span-3 lg:col-span-2">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
                      <h4 className="text-sm font-medium text-gray-700 mb-4">
                        Bank Details
                      </h4>

                      {!vendor.bank_details ? (
                        <div className="text-sm text-gray-500 italic">
                          No bank details available.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-xs text-gray-500">
                              Legal Name
                            </div>
                            <div className="font-medium text-gray-900">
                              {vendor.bank_details.legal_name || "N/A"}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-gray-500">
                              Business Name
                            </div>
                            <div className="font-medium text-gray-900">
                              {vendor.bank_details.business_name || "N/A"}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-gray-500">Email</div>
                            <div className="font-medium text-gray-900 truncate">
                              {vendor.bank_details.email || "N/A"}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-gray-500">DOB</div>
                            <div className="font-medium text-gray-900">
                              {vendor.bank_details.dob || "N/A"}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-gray-500">
                              Bank Name
                            </div>
                            <div className="font-medium text-gray-900">
                              {vendor.bank_details.bank_name || "N/A"}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-gray-500">
                              Bank Address
                            </div>
                            <div className="font-medium text-gray-900">
                              {vendor.bank_details.bank_address || "N/A"}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-gray-500">
                              Account Holder
                            </div>
                            <div className="font-medium text-gray-900">
                              {vendor.bank_details.account_holder_name || "N/A"}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-gray-500">
                              Account Number
                            </div>
                            <div className="font-medium text-gray-900">
                              {vendor.bank_details.account_number || "N/A"}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-gray-500">
                              Transit Number
                            </div>
                            <div className="font-medium text-gray-900">
                              {vendor.bank_details.transit_number || "N/A"}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-gray-500">
                              Institution Number
                            </div>
                            <div className="font-medium text-gray-900">
                              {vendor.bank_details.institution_number || "N/A"}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-gray-500">
                              Preferred Transfer
                            </div>
                            <div className="font-medium text-gray-900">
                              {vendor.bank_details.preferred_transfer_type ||
                                "N/A"}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-gray-500">
                              Interac Email
                            </div>
                            <div className="font-medium text-gray-900">
                              {vendor.bank_details.interac_email || "N/A"}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-gray-500">
                              Interac Phone
                            </div>
                            <div className="font-medium text-gray-900">
                              {vendor.bank_details.interac_phone || "N/A"}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <aside className="col-span-3 lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
                      <div className="text-xs text-gray-500">Bank Status</div>
                      <div className="mt-2 font-medium text-gray-900">
                        {vendor.bank_details
                          ? "Details provided"
                          : "Not provided"}
                      </div>
                      {vendor.bank_details && (
                        <div className="mt-3 text-xs text-gray-500">
                          Account holder:{" "}
                          <span className="font-medium text-gray-900">
                            {vendor.bank_details.account_holder_name || "N/A"}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-gray-500">Vendor ID</div>
                          <div className="mt-1 font-medium text-gray-900">
                            {vendor.vendor_id}
                          </div>
                        </div>
                        <div>
                          <Button
                            variant="ghost"
                            onClick={() =>
                              window.open(vendor.individual_resume)
                            }
                          >
                            Open Resume
                          </Button>
                        </div>
                      </div>
                    </div>
                  </aside>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Note Modal */}
      <Modal
        isOpen={showNoteModal}
        onClose={() => {
          setShowNoteModal(false);
          setNoteText("");
          setPendingValue(null);
        }}
        title={"Add note for status change"}
        size="sm"
      >
        <div>
          <p className="text-sm text-gray-600 mb-2">
            Please add a note explaining why this vendor is being turned OFF
            (optional).
          </p>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={4}
            className="w-full p-2 border rounded-md text-sm"
            placeholder="Enter note here..."
          />
          <div className="flex justify-end space-x-2 mt-3">
            <Button
              variant="ghost"
              onClick={() => {
                setShowNoteModal(false);
                setNoteText("");
                setPendingValue(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitNote} disabled={isUpdating}>
              {isUpdating ? "Saving..." : "Save & Turn OFF"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Universal Delete Modal */}
      <UniversalDeleteModal
        open={showDeleteModal}
        onClose={() => {
          if (!deleting) {
            setShowDeleteModal(false);
            setDeletingItem(null);
            setDeleteDesc("");
          }
        }}
        onDelete={confirmDelete}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onError={(err) => {
          console.error("Delete error:", err);
          toast.error("Delete error");
        }}
        title="Delete Package"
        desc={deleteDesc}
      />
    </>
  );
}

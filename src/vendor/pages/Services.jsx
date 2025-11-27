import React, { useEffect, useState, useRef } from "react";
import api from "../../lib/axiosConfig";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import { Button } from "../../shared/components/Button";
import { toast } from "sonner";
import ApplyServiceModal from "../components/Modals/ApplyServiceModal";
import { FormSelect } from "../../shared/components/Form";
import { Loader } from "lucide-react";

const Services = () => {
  const [groupedPackages, setGroupedPackages] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [requestingPackages, setRequestingPackages] = useState({});
  const [modalOpeningPackages, setModalOpeningPackages] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);

  // vendor lookups
  const [vendorPackageIds, setVendorPackageIds] = useState(new Set());
  const [vendorSubPackageIds, setVendorSubPackageIds] = useState(new Set());

  // keep refs to timeouts so we can clear on unmount
  const openTimersRef = useRef([]);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        // fetch admin packages and vendor packages in parallel
        const [adminResp, vendorResp] = await Promise.all([
          api.get("/api/admin/getpackages"),
          api.get("/api/vendor/getvendorservice"),
        ]);

        const rawAdmin = Array.isArray(adminResp.data)
          ? adminResp.data
          : adminResp.data?.result || [];

        const grouped = rawAdmin.reduce((acc, item) => {
          const category = item.service_category_name || "Uncategorized";
          if (!acc[category]) acc[category] = [];
          acc[category].push(item);
          return acc;
        }, {});
        setGroupedPackages(grouped);

        const vendorRaw = Array.isArray(vendorResp.data)
          ? vendorResp.data
          : vendorResp.data?.result || [];

        const pkgIds = new Set();
        const subIds = new Set();

        vendorRaw.forEach((p) => {
          if (p.package_id) pkgIds.add(p.package_id);

          // vendor sub-packages - try multiple field names
          (p.sub_packages || []).forEach((sp) => {
            const id =
              sp.sub_package_id ||
              sp.package_item_id ||
              sp.package_item_id ||
              sp.id;
            if (id) subIds.add(id);
          });
        });

        setVendorPackageIds(pkgIds);
        setVendorSubPackageIds(subIds);
      } catch (error) {
        console.error("Error fetching packages or vendor services:", error);
        toast.error("Failed to load packages");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();

    return () => {
      // clear any running timers on unmount
      openTimersRef.current.forEach((t) => clearTimeout(t));
      openTimersRef.current = [];
    };
  }, []);

  const categoryList = ["All Categories", ...Object.keys(groupedPackages)];

  const handleRequestService = async (packageId) => {
    const token = localStorage.getItem("vendorToken");
    if (!token) {
      toast.error("User not authenticated.");
      return;
    }

    setRequestingPackages((prev) => ({ ...prev, [packageId]: true }));

    try {
      const response = await api.post(
        "/api/vendor/applyservice",
        { packageIds: [packageId] },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Service request submitted successfully!");
    } catch (error) {
      console.error("Request failed:", error);
      toast.error("Failed to request service.");
    } finally {
      setRequestingPackages((prev) => ({ ...prev, [packageId]: false }));
    }
  };

  // new: open modal after showing loader for 2 seconds
  const openModalWithDelay = (pkg, delay = 2000) => {
    const pkgId = pkg.package_id;
    // set modal-opening flag
    setModalOpeningPackages((prev) => ({ ...prev, [pkgId]: true }));

    const timer = setTimeout(() => {
      // clear the loading flag and open modal
      setModalOpeningPackages((prev) => {
        const next = { ...prev };
        delete next[pkgId];
        return next;
      });
      setSelectedPackage({
        ...pkg,
        service_id: pkg.service_id,
        service_category_id: pkg.service_category_id,
      });
      setShowModal(true);
    }, delay);

    // store timer for cleanup
    openTimersRef.current.push(timer);
  };

  // helper: check whether a sub-package id is owned by vendor
  const isSubOwned = (sub) => {
    const subId = sub.sub_package_id || sub.package_item_id || sub.id;
    if (!subId) return false;
    return vendorSubPackageIds.has(subId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-3 py-4 mx-auto max-w-fullsm:px-4 lg:px-6 sm:py-6 lg:py-8">
        {/* Header Section */}
        <div className="flex flex-col gap-4 mb-6 sm:mb-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Apply for Services
            </h1>
            <p className="max-w-2xl text-sm text-gray-600 sm:text-base">
              Browse available service packages and apply for the ones that match your business needs
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="primary"
              onClick={() => {
                setSelectedPackage(null);
                setShowModal(true);
              }}
              className="justify-center w-full sm:w-auto"
              size="md"
            >
              Request New Services
            </Button>
            <div className="w-full sm:w-48">
              <FormSelect
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                options={categoryList}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12 sm:py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          /* Services Grid */
          <div className="space-y-8 sm:space-y-10">
            {Object.entries(groupedPackages)
              .filter(
                ([category]) =>
                  selectedCategory === "All Categories" ||
                  category === selectedCategory
              )
              .map(([categoryName, services]) => (
                <section key={categoryName} className="space-y-4 sm:space-y-6">
                  {/* Category Header */}
                  <div className="pb-2 border-b border-gray-200 sm:pb-3">
                    <h2 className="text-lg font-semibold text-blue-700 sm:text-xl lg:text-2xl">
                      {categoryName}
                    </h2>
                  </div>

                  {/* Services Grid */}
                  <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {services.map((service) => (
                      <div
                        key={service.service_type_id}
                        className="flex flex-col h-full overflow-hidden transition-all duration-300 bg-white border border-gray-200 shadow-sm rounded-xl sm:rounded-2xl hover:shadow-md"
                      >
                        {/* Service Image */}
                        {service.service_type_media && (
                          <div className="w-full aspect-w-16 aspect-h-9">
                            <img
                              src={service.service_type_media}
                              alt={service.service_type_name}
                              loading="lazy"
                              className="object-cover w-full h-40 sm:h-48"
                            />
                          </div>
                        )}

                        {/* Service Content */}
                        <div className="flex flex-col flex-1 p-4 sm:p-6">
                          {/* Service Header */}
                          <div className="mb-4">
                            <h3 className="mb-2 text-lg font-semibold text-gray-900 sm:text-xl line-clamp-2">
                              {service.service_type_name}
                            </h3>
                            <div className="space-y-1 text-sm text-gray-600">
                              <p className="flex flex-wrap items-center gap-1">
                                <span className="font-medium">Service:</span>
                                <span className="text-gray-900">
                                  {service.service_name}
                                </span>
                              </p>
                              {service.service_filter && (
                                <p className="flex flex-wrap items-center gap-1">
                                  <span className="font-medium">Filter:</span>
                                  <span className="text-gray-900">
                                    {service.service_filter}
                                  </span>
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Packages */}
                          <div className="space-y-4">
                            {service.packages.map((pkg) => {
                              // determine if all sub-packages are already added
                              const totalSubs = pkg.sub_packages?.length || 0;
                              const ownedCount = (pkg.sub_packages || []).reduce(
                                (acc, s) => acc + (isSubOwned(s) ? 1 : 0),
                                0
                              );
                              const allSubsAdded =
                                totalSubs > 0 && ownedCount === totalSubs;

                              return (
                                <div
                                  key={pkg.package_id}
                                  className="p-3 border border-gray-200 rounded-lg bg-gray-50 sm:rounded-xl sm:p-4"
                                >
                                  {/* Sub-Packages */}
                                  {pkg.sub_packages?.length > 0 && (
                                    <div className="mb-3 sm:mb-4">
                                      <p className="mb-2 text-sm font-semibold text-gray-700 sm:mb-3">
                                        Included Services:
                                      </p>
                                      <ul className="space-y-2 sm:space-y-3">
                                        {pkg.sub_packages.map((sub) => {
                                          const owned = isSubOwned(sub);
                                          const subId =
                                            sub.sub_package_id ||
                                            sub.package_item_id ||
                                            sub.id;
                                          return (
                                            <li
                                              key={subId || Math.random()}
                                              className={`flex gap-2 sm:gap-3 items-start p-2 sm:p-3 rounded-lg border ${
                                                owned
                                                  ? "border-green-200 bg-green-50 opacity-75"
                                                  : "border-gray-200 bg-white"
                                              }`}
                                            >
                                              {(sub.item_media ||
                                                sub.sub_package_media) && (
                                                <img
                                                  src={
                                                    sub.item_media ||
                                                    sub.sub_package_media
                                                  }
                                                  alt={
                                                    sub.title ||
                                                    sub.sub_package_name ||
                                                    sub.item_name
                                                  }
                                                  className="flex-shrink-0 object-cover w-10 h-10 border rounded-lg sm:w-12 sm:h-12"
                                                />
                                              )}
                                              <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800 line-clamp-2">
                                                  {sub.item_name ||
                                                    sub.sub_package_name ||
                                                    sub.title}
                                                </p>
                                                <div className="flex flex-wrap gap-1 mt-1 sm:gap-2">
                                                  {sub.price && (
                                                    <span className="text-xs font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                                                      ${sub.price}
                                                    </span>
                                                  )}
                                                  {sub.time_required && (
                                                    <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                                      {sub.time_required} min
                                                    </span>
                                                  )}
                                                </div>
                                              </div>

                                              {owned && (
                                                <span className="flex-shrink-0 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 border border-green-200 rounded-lg">
                                                  Added
                                                </span>
                                              )}
                                            </li>
                                          );
                                        })}
                                      </ul>
                                    </div>
                                  )}

                                  {/* Action Button */}
                                  <div className="flex justify-end">
                                    <Button
                                      size="sm"
                                      variant={
                                        allSubsAdded
                                          ? "lightSecondary"
                                          : "lightPrimary"
                                      }
                                      disabled={
                                        requestingPackages[pkg.package_id] ||
                                        modalOpeningPackages[pkg.package_id] ||
                                        allSubsAdded
                                      }
                                      onClick={() => {
                                        if (allSubsAdded) {
                                          toast.info("All services in this package are already added.");
                                          return;
                                        }
                                        openModalWithDelay({
                                          ...pkg,
                                          service_id: service.service_id,
                                          service_category_id:
                                            service.service_category_id,
                                        });
                                      }}
                                      className="min-w-[140px] justify-center"
                                    >
                                      {modalOpeningPackages[pkg.package_id] ? (
                                        <span className="flex items-center gap-2">
                                          <Loader className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                                          <span className="hidden sm:inline">Opening...</span>
                                        </span>
                                      ) : requestingPackages[pkg.package_id] ? (
                                        "Requesting..."
                                      ) : allSubsAdded ? (
                                        "All Added"
                                      ) : (
                                        "Request Service"
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && Object.keys(groupedPackages).length === 0 && (
          <div className="py-12 text-center sm:py-16">
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-medium text-gray-900">No services available</h3>
              <p className="text-sm text-gray-500">
                There are currently no service packages available. Please check back later.
              </p>
            </div>
          </div>
        )}

        {/* No Results State */}
        {!loading && 
          selectedCategory !== "All Categories" && 
          Object.entries(groupedPackages).filter(
            ([category]) => category === selectedCategory
          ).length === 0 && (
          <div className="py-12 text-center sm:py-16">
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-blue-50">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-medium text-gray-900">No services found</h3>
              <p className="mb-4 text-sm text-gray-500">
                No services found in the "{selectedCategory}" category.
              </p>
              <Button
                variant="lightPrimary"
                onClick={() => setSelectedCategory("All Categories")}
                size="sm"
              >
                View All Categories
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <ApplyServiceModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          // refetch vendor data to refresh owned subpackages
          (async () => {
            try {
              const vendorResp = await api.get("/api/vendor/getvendorservice");
              const vendorRaw = Array.isArray(vendorResp.data)
                ? vendorResp.data
                : vendorResp.data?.result || [];
              const subIds = new Set();
              vendorRaw.forEach((p) => {
                (p.sub_packages || []).forEach((sp) => {
                  const id = sp.sub_package_id || sp.package_item_id || sp.id;
                  if (id) subIds.add(id);
                });
              });
              setVendorSubPackageIds(subIds);
            } catch (err) {
              console.error("Failed to refresh vendor data:", err);
            }
          })();
        }}
        initialPackage={selectedPackage}
      />
    </div>
  );
};

export default Services;
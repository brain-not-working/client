import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Button, IconButton } from "../../shared/components/Button";
import AddServiceTypeModal from "../components/Modals/AddServiceTypeModal";
import api from "../../lib/axiosConfig";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import EditPackageModal from "../components/Modals/EditPackageModal";
import FormSelect from "../../shared/components/Form/FormSelect";
import { FormInput } from "../../shared/components/Form";
import { Eye, Pencil, Plus, Search, Trash } from "lucide-react";
import UniversalDeleteModal from "../../shared/components/Modal/UniversalDeleteModal";
import Modal from "../../shared/components/Modal/Modal";

/* ---------- small helpers ---------- */
const fmtTime = (t) => (t || t === 0 ? `${t}` : "—");
const fmtPrice = (n) => (n || n === 0 ? `$${Number(n)}` : "—");

/* ---------- small presentational components ---------- */
function PreferencesChips({ preferences }) {
  if (!preferences || Object.keys(preferences).length === 0) {
    return <div className="text-xs text-gray-400 italic">No selections</div>;
  }

  return (
    <div className="space-y-3">
      {Object.entries(preferences).map(([groupKey, group]) => {
        const isRequired = Number(group?.is_required) === 1;
        const items = Array.isArray(group?.items) ? group.items : [];

        return (
          <div
            key={groupKey}
            className="border rounded-lg p-3 bg-white shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold text-gray-700">
                {groupKey}
              </div>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  isRequired
                    ? "bg-red-100 text-red-800 border border-red-200"
                    : "bg-gray-100 text-gray-700 border border-gray-200"
                }`}
              >
                {isRequired ? "Required" : "Optional"}
              </span>
            </div>

            <ul className="space-y-1">
              {items.length ? (
                items.map((p, idx) => (
                  <li
                    key={p.preference_id ?? idx}
                    className="flex items-center justify-between text-sm text-gray-800"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                      <span className="truncate">{p.preference_value}</span>
                    </span>
                    <div className="flex items-center gap-3 ml-4">
                      <span className="text-gray-500">
                        {fmtPrice(p.preference_price)}
                      </span>
                      <span className="text-gray-500">
                        {fmtTime(p.time_required)} Min.
                      </span>
                    </div>
                  </li>
                ))
              ) : (
                <li className="text-xs text-gray-400 italic">No options</li>
              )}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function AddonsChips({ addons }) {
  if (!Array.isArray(addons) || addons.length === 0) {
    return <div className="text-xs text-gray-400 italic">No add-ons</div>;
  }

  return (
    <ul className="space-y-2">
      {addons.map((a) => (
        <li
          key={a.addon_id ?? a.addon_name}
          className="flex items-start justify-between gap-3 p-3 bg-white border rounded-lg shadow-sm"
        >
          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">
              {a.addon_name}
            </div>
            {a.description && (
              <div className="text-xs text-gray-500 mt-1 truncate">
                {a.description}
              </div>
            )}
          </div>

          <div className="flex-shrink-0 ml-2 justify-end text-right">
            <div className="inline-flex justify-end px-2 py-0.5 rounded-md text-xs font-semibold border bg-white">
              {fmtPrice(a.price)}
            </div>
            {a.time_required != null && (
              <div className="text-xs text-gray-500 mt-1 truncate">
                {fmtTime(a.time_required)} Min.
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function SubPackageItem({ sub }) {
  return (
    <li className="bg-white rounded-lg border p-4 shadow-sm">
      <div className="flex gap-4">
        <div className="w-36 h-24 rounded-md overflow-hidden border bg-gray-100 flex-shrink-0">
          <img
            src={sub.item_media}
            alt={sub.item_name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover rounded-md bg-gray-100"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div className="min-w-0">
              <p className="text-base font-medium text-gray-900 truncate">
                {sub.item_name}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Time: {fmtTime(sub.time_required)} Minutes
              </p>
            </div>

            <div className="text-xs font-semibold ml-4 text-right">
              <p className="text-sky-700 text-sm">{fmtPrice(sub.price)}</p>
              <p className="text-xs text-gray-500 mt-1">
                Service Location:
                <span className="text-xs text-gray-900 mt-1">
                  {sub.serviceLocation.join(", ")}
                </span>
              </p>
            </div>
          </div>

          {sub.description && (
            <p className="text-sm text-gray-600 mt-3 whitespace-pre-line">
              {sub.description}
            </p>
          )}

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-semibold text-gray-700 mb-2">
                Selections
              </div>
              <PreferencesChips preferences={sub.preferences} />
            </div>

            <div>
              <div className="text-xs font-semibold text-gray-700 mb-2">
                Add-ons
              </div>
              <AddonsChips addons={sub.addons} />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-xs font-semibold text-gray-700 mb-2">
              Consent
            </div>
            {Array.isArray(sub.consentForm) && sub.consentForm.length > 0 ? (
              <div className="space-y-2">
                {sub.consentForm.map((c) => (
                  <div
                    key={c.consent_id}
                    className="flex items-center justify-between gap-3 p-2 bg-gray-50 rounded-md border border-gray-100"
                  >
                    <div className="text-sm text-gray-700 truncate">
                      {c.question}
                    </div>
                    <div>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          Number(c.is_required) === 1
                            ? "bg-red-100 text-red-800 border border-red-200"
                            : "bg-gray-100 text-gray-700 border border-gray-200"
                        }`}
                      >
                        {Number(c.is_required) === 1 ? "Required" : "Optional"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-400 italic">
                No consent items
              </div>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

/* Details Modal: now uses the API response directly and passes package.serviceLocation to items */
function PackageDetailsModal({ packageId, isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [pkg, setPkg] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setPkg(null);
      setLoading(false);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const resp = await api.get(`/api/admin/getpackagedetails/${packageId}`);
        const data = resp?.data?.package ?? null; // directly use package from API
        if (!mounted) return;
        setPkg(data);
      } catch (err) {
        console.error("Failed to load package details", err);
        if (mounted) setPkg(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isOpen, packageId]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={pkg?.packageName ?? `Package #${packageId}`}
      size="xl"
    >
      <div className="relative z-10 overflow-auto">
        {loading ? (
          <div className="py-4 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            {Array.isArray(pkg?.sub_packages) && pkg.sub_packages.length > 0 ? (
              <ul className="space-y-4">
                {pkg.sub_packages.map((sub) => (
                  <SubPackageItem
                    key={sub.sub_package_id}
                    sub={sub}
                    packageServiceLocation={pkg.serviceLocation}
                  />
                ))}
              </ul>
            ) : (
              <div className="text-sm text-gray-500 italic">
                No items listed.
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}

/* ---------------- Main component (simplified) ---------------- */
export default function Packages() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackageForEdit, setSelectedPackageForEdit] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [service, setService] = useState("");
  const [serviceNames, setServiceNames] = useState([]);
  const [detailsModalPkgId, setDetailsModalPkgId] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // delete state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);

  const fetchPackages = useCallback(async () => {
    try {
      setLoading(true);
      const resp = await api.get("/api/admin/getpackagelist");
      // assume API returns array of packages; store it raw
      const raw = resp?.data?.packages ?? [];
      const list = raw;
      setServices(list);

      // extract categories (assume each item may have service_category_name)
      const unique = Array.from(
        new Set(list.map((p) => p.service_category_name || "Other"))
      );
      setCategories(unique.map((c) => ({ value: c, label: c })));

      const uniqueServiceName = Array.from(
        new Set(list.map((p) => p.serviceName || "Other"))
      );
      setServiceNames(uniqueServiceName.map((c) => ({ value: c, label: c })));
    } catch (err) {
      console.error("Error fetching packages list", err);
      setServices([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const handleDeleteClick = (pkg) => {
    setDeletingItem(pkg);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;
    try {
      setDeleting(true);
      const id =
        deletingItem.package_id ?? deletingItem.packageId ?? deletingItem.id;
      await api.delete(`/api/admin/deletepackage/${id}`);
      await fetchPackages();
    } catch (err) {
      console.error("Failed to delete:", err);
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setDeletingItem(null);
    }
  };

  const openDetails = (pkgId) => {
    setDetailsModalPkgId(pkgId);
    setIsDetailsOpen(true);
  };
  const closeDetails = () => {
    setDetailsModalPkgId(null);
    setIsDetailsOpen(false);
  };
  const handleEdit = (pkg) => {
    setSelectedPackageForEdit(pkg);
    setShowEditModal(true);
  };

  // filtering: simple — match packageName or service name
  const filtered = useMemo(() => {
    return services.filter((p) => {
      const matchesCategory =
        !category || (p.service_category_name || "Other") === category;

      const matchesService = !service || (p.serviceName || "Other") === service;

      const q = search.trim().toLowerCase();
      if (!q) return matchesCategory && matchesService;

      const nameMatch = (p.packageName || p.package_name || "")
        .toString()
        .toLowerCase()
        .includes(q);

      const serviceMatch = (p.service_name || p.service_type_name || "")
        .toString()
        .toLowerCase()
        .includes(q);

      const serviceNameMatch = (p.serviceName || "")
        .toString()
        .toLowerCase()
        .includes(q);

      return (
        matchesCategory &&
        matchesService &&
        (nameMatch || serviceMatch || serviceNameMatch)
      );
    });
  }, [services, category, search, service]);

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner />
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Service Catalog</h2>
          <p className="mt-1 text-sm text-gray-600">
            Filter by service name, package name, or category.
          </p>
        </div>
      </div>

      <div className="flex flex-col justify-between sm:flex-row gap-4 items-center mb-6 w-full">
        <FormInput
          className="w-full sm:w-1/3"
          type="text"
          icon={<Search />}
          placeholder="Search Service Type Name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="flex gap-3">
          <FormSelect
            id="serviceName"
            name="serviceName"
            value={service}
            onChange={(e) => setService(e.target.value)}
            options={[{ value: "", label: "All Services" }, ...serviceNames]}
            placeholder="Select Service"
            className="min-w-40"
          />
          <FormSelect
            id="category"
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={[{ value: "", label: "All Categories" }, ...categories]}
            placeholder="Select Category"
            className="min-w-40"
          />

          <Button
            onClick={() => setShowAddModal(true)}
            variant="primary"
            className="flex-shrink-0"
            icon={<Plus className="w-4 h-4" />}
          >
            Add Service Type
          </Button>
        </div>
      </div>

      <div className="space-y-6 p-4">
        {filtered.length === 0 ? (
          <div className="text-sm text-gray-500">No packages found.</div>
        ) : (
          filtered.map((pkg) => (
            <div
              key={pkg.package_id}
              className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {pkg.packageName}
                  </div>
                  <div className="text-xs text-gray-500">{pkg.serviceName}</div>
                </div>

                <div className="flex items-center gap-3">
                  <IconButton
                    variant="ghost"
                    icon={<Pencil className="w-4 h-4" />}
                    onClick={() => handleEdit(pkg)}
                  />
                  <IconButton
                    variant="ghost"
                    icon={<Eye className="w-4 h-4" />}
                    onClick={() => openDetails(pkg.package_id)}
                  />
                  <IconButton
                    variant="lightDanger"
                    icon={<Trash className="w-4 h-4" />}
                    onClick={() => handleDeleteClick(pkg)}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <AddServiceTypeModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        refresh={fetchPackages}
      />

      <EditPackageModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedPackageForEdit(null);
        }}
        refresh={fetchPackages}
        packageData={selectedPackageForEdit}
      />

      <PackageDetailsModal
        packageId={detailsModalPkgId}
        isOpen={isDetailsOpen}
        onClose={closeDetails}
      />

      <UniversalDeleteModal
        open={showDeleteModal}
        onClose={() => {
          if (!deleting) {
            setShowDeleteModal(false);
            setDeletingItem(null);
          }
        }}
        onDelete={confirmDelete}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onError={(err) => console.error("Delete error:", err)}
        title="Delete Package"
        desc={`Are you sure you want to delete package #${
          deletingItem?.package_id ?? ""
        }?`}
      />
    </div>
  );
}

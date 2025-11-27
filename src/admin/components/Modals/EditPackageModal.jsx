import React, { useEffect, useState } from "react";
import Modal from "../../../shared/components/Modal/Modal";
import {
  FormInput,
  FormTextarea,
  FormFileInput,
  FormSelect,
} from "../../../shared/components/Form";
import { Button } from "../../../shared/components/Button";
import api from "../../../lib/axiosConfig";
import { toast } from "sonner";
import { CollapsibleSectionCard } from "../../../shared/components/Card/CollapsibleSectionCard";

// --- Small helpers ---
const toNumber = (v) => {
  if (v === "" || v === null || v === undefined) return "";
  const n = Number(v);
  return Number.isNaN(n) ? v : n;
};

const EditPackageModal = ({ isOpen, onClose, packageData, refresh }) => {
  // package-level
  const [packageName, setPackageName] = useState("");
  const [packageMediaExisting, setPackageMediaExisting] = useState(null);
  const [serviceName, setServiceName] = useState("");

  // sub-packages
  const [subPackages, setSubPackages] = useState([]);

  // upload state: simple keys: 'packageMedia' and `itemMedia_{index}`
  const [files, setFiles] = useState({});
  const [previews, setPreviews] = useState({});

  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // cities for select
  const [cities, setCities] = useState([]);
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await api.get("/api/service/getcity");
        setCities(res.data.city || []);
      } catch (err) {
        console.error("fetch cities", err);
      }
    };
    fetchCities();
  }, []);

  // initialize when packageData changes
  useEffect(() => {
    if (!packageData) {
      resetForm();
      return;
    }

    const hasSubs =
      Array.isArray(packageData.sub_packages) &&
      packageData.sub_packages.length > 0;

    setPackageName(packageData.packageName ?? packageData.package_name ?? "");
    setServiceName(packageData.serviceName ?? packageData.service_name ?? "");
    setPackageMediaExisting(
      packageData.packageMedia ?? packageData.package_media ?? null
    );
    setFiles({});
    setPreviews({});

    if (hasSubs) {
      // use server data as-is (minimal mapping)
      setSubPackages(
        (packageData.sub_packages || []).map((s) => ({
          sub_package_id: s.sub_package_id ?? null,
          serviceName: s.serviceName ?? "",
          item_name: s.item_name ?? "",
          description: s.description ?? "",
          price: s.price ?? "",
          time_required: s.time_required ?? "",
          item_media: s.item_media ?? s.itemMedia ?? "",
          preferences: s.preferences ?? {},
          addons: Array.isArray(s.addons) ? s.addons : [],
          consentForm: Array.isArray(s.consentForm) ? s.consentForm : [],
          serviceLocation: Array.isArray(s.serviceLocation)
            ? s.serviceLocation
            : [],
        }))
      );
      setDetailsLoading(false);
      return;
    }

    // fallback: fetch details by id
    const pid =
      packageData.package_id ?? packageData.packageId ?? packageData.id;
    if (!pid) return;

    let cancelled = false;
    (async () => {
      try {
        setDetailsLoading(true);
        const resp = await api.get(`/api/admin/getpackagedetails/${pid}`);
        const pkg = resp?.data?.package ?? resp?.data ?? null;
        if (!pkg || cancelled) return;

        setPackageName(
          pkg.packageName ?? pkg.package_name ?? packageData.packageName ?? ""
        );
        setServiceName(pkg.serviceName ?? pkg.service_name ?? "");
        setPackageMediaExisting(pkg.packageMedia ?? pkg.package_media ?? null);

        setSubPackages(
          (pkg.sub_packages || []).map((s) => ({
            sub_package_id: s.sub_package_id ?? null,
            serviceName: s.serviceName ?? "",
            item_name: s.item_name ?? "",
            description: s.description ?? "",
            price: s.price ?? "",
            time_required: s.time_required ?? "",
            item_media: s.item_media ?? s.itemMedia ?? "",
            preferences: s.preferences ?? {},
            addons: Array.isArray(s.addons) ? s.addons : [],
            consentForm: Array.isArray(s.consentForm) ? s.consentForm : [],
            serviceLocation: Array.isArray(s.serviceLocation)
              ? s.serviceLocation
              : [],
          }))
        );
      } catch (err) {
        console.error("fetch details", err);
        if (!cancelled) toast.error("Failed to load package details.");
        if (!cancelled) setSubPackages([]);
      } finally {
        if (!cancelled) setDetailsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [packageData]);

  const resetForm = () => {
    setPackageName("");
    setServiceName("");
    setPackageMediaExisting(null);
    setSubPackages([]);
    setFiles({});
    setPreviews({});
    setDetailsLoading(false);
  };

  // File handlers (package and sub items)
  const handlePackageMediaChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFiles((p) => ({ ...p, packageMedia: f }));
    const r = new FileReader();
    r.onload = () => setPreviews((p) => ({ ...p, packageMedia: r.result }));
    r.readAsDataURL(f);
  };
  const removePackageMedia = () => {
    setFiles((p) => {
      const c = { ...p };
      delete c.packageMedia;
      return c;
    });
    setPreviews((p) => {
      const c = { ...p };
      delete c.packageMedia;
      return c;
    });
    setPackageMediaExisting(null);
  };

  const handleItemFileChange = (e, idx) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const key = `itemMedia_${idx}`;
    setFiles((p) => ({ ...p, [key]: f }));
    const r = new FileReader();
    r.onload = () => setPreviews((p) => ({ ...p, [key]: r.result }));
    r.readAsDataURL(f);
  };
  const removeItemPreview = (idx) => {
    const key = `itemMedia_${idx}`;
    setFiles((p) => {
      const c = { ...p };
      delete c[key];
      return c;
    });
    setPreviews((p) => {
      const c = { ...p };
      delete c[key];
      return c;
    });
  };

  // Sub-package operations (add / remove / update)
  const addSubPackage = () => {
    setSubPackages((p) => [
      ...p,
      {
        sub_package_id: null,
        item_name: "",
        description: "",
        price: "",
        time_required: "",
        item_media: "",
        preferences: {},
        addons: [],
        consentForm: [],
        serviceLocation: [], // <-- per-sub-package
      },
    ]);
  };
  const removeSubPackage = (idx) => {
    setSubPackages((p) => p.filter((_, i) => i !== idx));
    removeItemPreview(idx);
  };
  const updateSubField = (idx, field, value) => {
    setSubPackages((p) => {
      const cp = [...p];
      cp[idx] = { ...cp[idx], [field]: value };
      return cp;
    });
  };

  // Preferences: simple operations expecting the grouped shape
  const addPreferenceGroup = (idx, title = "Default") => {
    setSubPackages((p) => {
      const cp = [...p];
      const prefs = { ...(cp[idx].preferences || {}) };
      let key = title;
      let i = 1;
      while (prefs[key]) key = `${title} ${i++}`;
      prefs[key] = {
        is_required: 0,
        items: [
          {
            preference_id: null,
            preference_value: "",
            preference_price: "",
            time_required: "",
          },
        ],
      };
      cp[idx] = { ...cp[idx], preferences: prefs };
      return cp;
    });
  };
  const renamePreferenceGroup = (idx, oldKey, newKey) => {
    setSubPackages((p) => {
      const cp = [...p];
      const prefs = { ...(cp[idx].preferences || {}) };
      if (!prefs[oldKey]) return cp;
      const target = newKey && newKey.trim() ? newKey.trim() : oldKey;
      const newPrefs = {};
      Object.keys(prefs).forEach((k) => {
        if (k === oldKey) newPrefs[target] = prefs[oldKey];
        else newPrefs[k] = prefs[k];
      });
      cp[idx] = { ...cp[idx], preferences: newPrefs };
      return cp;
    });
  };
  const removePreferenceGroup = (idx, key) => {
    setSubPackages((p) => {
      const cp = [...p];
      const prefs = { ...(cp[idx].preferences || {}) };
      delete prefs[key];
      cp[idx] = { ...cp[idx], preferences: prefs };
      return cp;
    });
  };
  const addPreferenceItem = (idx, groupKey) => {
    setSubPackages((p) => {
      const cp = [...p];
      const prefs = { ...(cp[idx].preferences || {}) };
      prefs[groupKey] = prefs[groupKey] || { is_required: 0, items: [] };
      prefs[groupKey].items.push({
        preference_id: null,
        preference_value: "",
        preference_price: "",
        time_required: "",
      });
      cp[idx] = { ...cp[idx], preferences: prefs };
      return cp;
    });
  };
  const updatePreferenceItem = (idx, groupKey, itemIdx, field, value) => {
    setSubPackages((p) => {
      const cp = [...p];
      const prefs = { ...(cp[idx].preferences || {}) };
      prefs[groupKey] = prefs[groupKey] || { is_required: 0, items: [] };
      prefs[groupKey].items[itemIdx] = {
        ...prefs[groupKey].items[itemIdx],
        [field]: value,
      };
      cp[idx] = { ...cp[idx], preferences: prefs };
      return cp;
    });
  };
  const removePreferenceItem = (idx, groupKey, itemIdx) => {
    setSubPackages((p) => {
      const cp = [...p];
      const prefs = { ...(cp[idx].preferences || {}) };
      prefs[groupKey] = prefs[groupKey] || { is_required: 0, items: [] };
      prefs[groupKey].items = prefs[groupKey].items.filter(
        (_, i) => i !== itemIdx
      );
      if (prefs[groupKey].items.length === 0) delete prefs[groupKey];
      cp[idx] = { ...cp[idx], preferences: prefs };
      return cp;
    });
  };
  const setPreferenceGroupRequired = (idx, groupKey, value) => {
    setSubPackages((p) => {
      const cp = [...p];
      const prefs = { ...(cp[idx].preferences || {}) };
      prefs[groupKey] = prefs[groupKey] || { is_required: 0, items: [] };
      prefs[groupKey].is_required = Number(value) || 0;
      cp[idx] = { ...cp[idx], preferences: prefs };
      return cp;
    });
  };

  // Add-ons
  const addAddon = (idx) => {
    setSubPackages((p) => {
      const cp = [...p];
      cp[idx].addons = cp[idx].addons || [];
      cp[idx].addons.push({
        addon_id: null,
        addon_name: "",
        description: "",
        price: "",
        time_required: "",
      });
      return cp;
    });
  };
  const updateAddon = (idx, aIdx, field, value) => {
    setSubPackages((p) => {
      const cp = [...p];
      cp[idx].addons = cp[idx].addons || [];
      cp[idx].addons[aIdx] = { ...cp[idx].addons[aIdx], [field]: value };
      return cp;
    });
  };
  const removeAddon = (idx, aIdx) => {
    setSubPackages((p) => {
      const cp = [...p];
      cp[idx].addons = (cp[idx].addons || []).filter((_, i) => i !== aIdx);
      return cp;
    });
  };

  // Consent
  const addConsent = (idx) => {
    setSubPackages((p) => {
      const cp = [...p];
      cp[idx].consentForm = cp[idx].consentForm || [];
      cp[idx].consentForm.push({
        consent_id: null,
        question: "",
        is_required: 0,
      });
      return cp;
    });
  };
  const updateConsent = (idx, cIdx, field, value) => {
    setSubPackages((p) => {
      const cp = [...p];
      cp[idx].consentForm = cp[idx].consentForm || [];
      cp[idx].consentForm[cIdx] = {
        ...cp[idx].consentForm[cIdx],
        [field]: field === "is_required" ? Number(value) : value,
      };
      return cp;
    });
  };
  const removeConsent = (idx, cIdx) => {
    setSubPackages((p) => {
      const cp = [...p];
      cp[idx].consentForm = (cp[idx].consentForm || []).filter(
        (_, i) => i !== cIdx
      );
      return cp;
    });
  };

  // Validation (kept similar semantics but simpler checks)
  const validate = () => {
    if (!Array.isArray(subPackages) || subPackages.length === 0) {
      toast.error("At least one sub-package is required.");
      return false;
    }
    for (let i = 0; i < subPackages.length; i++) {
      const s = subPackages[i];
      if (!s.item_name || !String(s.item_name).trim()) {
        toast.error(`Sub-package ${i + 1}: Item name is required`);
        return false;
      }
      if (
        s.price === "" ||
        s.price === null ||
        s.price === undefined ||
        isNaN(Number(s.price))
      ) {
        toast.error(`Sub-package ${i + 1}: Price must be a number`);
        return false;
      }
      // preference items checks
      const groups = Object.keys(s.preferences || {});
      for (let g = 0; g < groups.length; g++) {
        const key = groups[g];
        const group = s.preferences[key] || { is_required: 0, items: [] };
        if (
          Number(group.is_required) === 1 &&
          (!Array.isArray(group.items) || group.items.length === 0)
        ) {
          toast.error(
            `Sub-package ${i + 1}, group "${key}": at least one item required`
          );
          return false;
        }
        for (let it = 0; it < (group.items || []).length; it++) {
          const item = group.items[it];
          if (!String(item.preference_value || "").trim()) {
            toast.error(
              `Sub-package ${i + 1}, group "${key}", item ${
                it + 1
              }: value required`
            );
            return false;
          }
          if (
            item.preference_price !== "" &&
            item.preference_price != null &&
            isNaN(Number(item.preference_price))
          ) {
            toast.error(
              `Sub-package ${i + 1}, group "${key}", item ${
                it + 1
              }: price must be a number`
            );
            return false;
          }
        }
      }
    }
    return true;
  };

  // Submit: build simple payload that mirrors your API shape
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payloadPackage = {
        package_id: packageData?.package_id ?? null,
        packageName: packageName,
        packageMedia: packageMediaExisting ?? null,
        // package-level serviceLocation removed intentionally
        sub_packages: subPackages.map((s) => ({
          sub_package_id: s.sub_package_id ?? null,
          item_name: s.item_name,
          description: s.description,
          price: Number(s.price) || 0,
          time_required: Number(s.time_required) || 0,
          serviceLocation: s.serviceLocation || [], // <-- per-sub-package
          preferences: s.preferences || {},
          addons: (s.addons || []).map((a) => ({
            addon_id: a.addon_id ?? null,
            addon_name: a.addon_name,
            description: a.description,
            price: a.price === "" ? 0 : Number(a.price) || 0,
            time_required:
              a.time_required === "" ? 0 : Number(a.time_required) || 0,
          })),
          consentForm: (s.consentForm || []).map((c) => ({
            consent_id: c.consent_id ?? null,
            question: c.question,
            is_required: Number(c.is_required) || 0,
          })),
        })),
      };

      const form = new FormData();
      form.append("packages", JSON.stringify([payloadPackage]));

      // append files (packageMedia and per-item files)
      if (files.packageMedia) form.append("packageMedia", files.packageMedia);
      Object.keys(files).forEach((k) => {
        if (k.startsWith("itemMedia_")) {
          form.append(k, files[k]);
        }
      });

      await api.put("/api/admin/editpackage", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Package updated");
      onClose();
      refresh && refresh();
    } catch (err) {
      console.error("update package", err);
      toast.error("Failed to update package");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Service Type"
      size="xl"
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-4 max-h-[80vh] overflow-y-auto pr-4"
      >
        {detailsLoading && (
          <div className="p-4 text-sm text-gray-600">
            Loading package details...
          </div>
        )}
        <h3 className="text-lg font-semibold">{serviceName}</h3>

        <CollapsibleSectionCard title="Service Type Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Service Type Name"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              required
            />

            <div className="space-y-2 sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Service Type Media
              </label>
              <FormFileInput
                name="packageMedia"
                onChange={handlePackageMediaChange}
              />

              <div className="flex items-center mt-2 space-x-3">
                {previews.packageMedia ? (
                  <div className="relative w-24 h-20 rounded overflow-hidden border">
                    <img
                      src={previews.packageMedia}
                      alt="preview"
                      className="object-cover w-full h-full"
                    />
                    <button
                      type="button"
                      onClick={removePackageMedia}
                      className="absolute top-1 right-1 text-white bg-red-600 rounded-full px-2"
                    >
                      ×
                    </button>
                  </div>
                ) : packageMediaExisting ? (
                  <div className="relative w-24 h-20 rounded overflow-hidden border">
                    <img
                      src={packageMediaExisting}
                      alt="existing"
                      className="object-cover w-full h-full"
                    />
                    <button
                      type="button"
                      onClick={removePackageMedia}
                      className="absolute top-1 right-1 text-white bg-red-600 rounded-full px-2"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">
                    No package media
                  </p>
                )}
              </div>
            </div>
          </div>
        </CollapsibleSectionCard>

        <section>
          <div className="flex justify-between items-center mb-4 px-3">
            <h3 className="text-lg font-semibold">Service Items</h3>
            <Button
              type="button"
              size="sm"
              onClick={addSubPackage}
              className="bg-green-50 text-green-700"
            >
              + Add Service Items
            </Button>
          </div>

          {subPackages.length === 0 && (
            <p className="text-sm text-gray-500 italic">
              No Service Items available.
            </p>
          )}

          {subPackages.map((sub, idx) => (
            <CollapsibleSectionCard
              key={idx}
              title={`Service Item ${idx + 1} - ${sub.item_name || "Untitled"}`}
              defaultOpen={false}
              className="mb-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput
                  label="Item Name"
                  value={sub.item_name}
                  onChange={(e) =>
                    updateSubField(idx, "item_name", e.target.value)
                  }
                  required
                />
                <FormInput
                  label="Price"
                  type="number"
                  value={sub.price ?? ""}
                  onChange={(e) => updateSubField(idx, "price", e.target.value)}
                  required
                />

                {/* Service Location select moved inside each sub-package (multiple select) */}
                <FormSelect
                  label="Service Location"
                  multiple
                  value={sub.serviceLocation || []}
                  onChange={(e) =>
                    updateSubField(idx, "serviceLocation", e.target.value)
                  }
                  options={cities.map((c) => ({
                    value: c.serviceCity,
                    label: c.serviceCity,
                  }))}
                />

                <FormTextarea
                  label="Description"
                  value={sub.description}
                  onChange={(e) =>
                    updateSubField(idx, "description", e.target.value)
                  }
                  className="sm:col-span-2"
                />

                <FormFileInput
                  label="Upload Media"
                  name={`itemMedia_${idx}`}
                  onChange={(e) => handleItemFileChange(e, idx)}
                />
                <FormInput
                  label="Time Required (minutes)"
                  type="number"
                  value={sub.time_required ?? ""}
                  onChange={(e) =>
                    updateSubField(idx, "time_required", e.target.value)
                  }
                />

                <div className="flex items-center gap-3 mt-2">
                  {previews[`itemMedia_${idx}`] ? (
                    <div className="relative w-24 h-20 rounded overflow-hidden border">
                      <img
                        src={previews[`itemMedia_${idx}`]}
                        alt="preview"
                        className="object-cover w-full h-full"
                      />
                      <button
                        type="button"
                        onClick={() => removeItemPreview(idx)}
                        className="absolute top-1 right-1 text-white bg-red-600 rounded-full px-2"
                      >
                        ×
                      </button>
                    </div>
                  ) : sub.item_media ? (
                    <div className="w-24 h-20 rounded overflow-hidden border">
                      <img
                        src={sub.item_media}
                        alt="existing"
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ) : null}
                </div>

                {/* Preferences */}
                <div className="sm:col-span-2 mt-4">
                  <CollapsibleSectionCard
                    title="Selections"
                    defaultOpen={false}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => addPreferenceGroup(idx)}
                        >
                          + Add Selections Group
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const first = Object.keys(sub.preferences || {})[0];
                            if (!first) addPreferenceGroup(idx);
                            else addPreferenceItem(idx, first);
                          }}
                        >
                          + Add Selections
                        </Button>
                      </div>
                    </div>

                    {Object.keys(sub.preferences || {}).length === 0 && (
                      <p className="text-sm text-gray-500 italic">
                        No Selections groups
                      </p>
                    )}

                    {Object.entries(sub.preferences || {}).map(
                      ([groupKey, group], gIdx) => (
                        <div key={gIdx} className="mb-3 p-3 border rounded">
                          <div className="flex gap-2 items-end justify-between mb-2">
                            <FormInput
                              label="Group Title"
                              value={groupKey}
                              onChange={(e) =>
                                renamePreferenceGroup(
                                  idx,
                                  groupKey,
                                  e.target.value
                                )
                              }
                            />
                            <div className="flex items-end gap-2">
                              <FormSelect
                                label="Required?"
                                value={String(group.is_required ?? 0)}
                                onChange={(e) =>
                                  setPreferenceGroupRequired(
                                    idx,
                                    groupKey,
                                    e.target.value
                                  )
                                }
                                options={[
                                  { value: "0", label: "Optional (0)" },
                                  { value: "1", label: "Required (1)" },
                                ]}
                              />
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  size="xs"
                                  variant="outline"
                                  onClick={() =>
                                    addPreferenceItem(idx, groupKey)
                                  }
                                >
                                  + Add Selection
                                </Button>
                                <Button
                                  type="button"
                                  size="xs"
                                  variant="error"
                                  onClick={() =>
                                    removePreferenceGroup(idx, groupKey)
                                  }
                                >
                                  Remove Group
                                </Button>
                              </div>
                            </div>
                          </div>

                          {(group.items || []).length === 0 && (
                            <p className="text-xs text-gray-400 italic">
                              No items in this group
                            </p>
                          )}

                          {(group.items || []).map((it, itIdx) => (
                            <div key={itIdx} className="mb-2">
                              <div className="grid md:grid-cols-3 gap-2 items-end">
                                <FormInput
                                  label={`Selections ${itIdx + 1}`}
                                  value={it.preference_value}
                                  onChange={(e) =>
                                    updatePreferenceItem(
                                      idx,
                                      groupKey,
                                      itIdx,
                                      "preference_value",
                                      e.target.value
                                    )
                                  }
                                />
                                <FormInput
                                  label="Price"
                                  type="number"
                                  value={it.preference_price ?? ""}
                                  onChange={(e) =>
                                    updatePreferenceItem(
                                      idx,
                                      groupKey,
                                      itIdx,
                                      "preference_price",
                                      e.target.value
                                    )
                                  }
                                />
                                <FormInput
                                  label="Time (min)"
                                  type="number"
                                  value={it.time_required ?? ""}
                                  onChange={(e) =>
                                    updatePreferenceItem(
                                      idx,
                                      groupKey,
                                      itIdx,
                                      "time_required",
                                      e.target.value
                                    )
                                  }
                                />
                              </div>
                              <div className="flex justify-end mt-1">
                                <Button
                                  type="button"
                                  size="xs"
                                  variant="outline"
                                  onClick={() =>
                                    removePreferenceItem(idx, groupKey, itIdx)
                                  }
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    )}
                  </CollapsibleSectionCard>
                </div>

                {/* Add-ons */}
                <div className="sm:col-span-2 mt-4">
                  <CollapsibleSectionCard title="Add-ons" defaultOpen={false}>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold">Add-ons</h4>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => addAddon(idx)}
                      >
                        + Add Add-on
                      </Button>
                    </div>
                    {(sub.addons || []).length === 0 && (
                      <p className="text-sm text-gray-500 italic">No add-ons</p>
                    )}
                    {(sub.addons || []).map((a, aIdx) => (
                      <div key={aIdx} className="mb-3 p-3 border rounded">
                        <div className="grid md:grid-cols-2 gap-2">
                          <FormInput
                            label="Add-on Name"
                            value={a.addon_name}
                            onChange={(e) =>
                              updateAddon(
                                idx,
                                aIdx,
                                "addon_name",
                                e.target.value
                              )
                            }
                          />
                          <FormInput
                            label="Price"
                            type="number"
                            value={a.price ?? ""}
                            onChange={(e) =>
                              updateAddon(idx, aIdx, "price", e.target.value)
                            }
                          />
                        </div>
                        <div className="grid md:grid-cols-2 gap-2 mt-2">
                          <FormTextarea
                            label="Description"
                            value={a.description ?? ""}
                            onChange={(e) =>
                              updateAddon(
                                idx,
                                aIdx,
                                "description",
                                e.target.value
                              )
                            }
                          />
                          <FormInput
                            label="Time Required (min)"
                            type="number"
                            value={a.time_required ?? ""}
                            onChange={(e) =>
                              updateAddon(
                                idx,
                                aIdx,
                                "time_required",
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div className="flex justify-end mt-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => removeAddon(idx, aIdx)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CollapsibleSectionCard>
                </div>

                {/* Consent */}
                <div className="sm:col-span-2 mt-4">
                  <CollapsibleSectionCard
                    title="Consent Form"
                    defaultOpen={false}
                  >
                    {(sub.consentForm || []).length === 0 && (
                      <p className="text-sm text-gray-500 italic">
                        No consent items
                      </p>
                    )}
                    {(sub.consentForm || []).map((c, cIdx) => (
                      <div key={cIdx} className="mb-2 flex gap-2 items-end">
                        <FormInput
                          label={`Question ${cIdx + 1}`}
                          value={c.question}
                          onChange={(e) =>
                            updateConsent(idx, cIdx, "question", e.target.value)
                          }
                        />
                        <FormSelect
                          label="Required?"
                          value={String(c.is_required ?? 0)}
                          onChange={(e) =>
                            updateConsent(
                              idx,
                              cIdx,
                              "is_required",
                              Number(e.target.value)
                            )
                          }
                          options={[
                            { value: "0", label: "Optional (0)" },
                            { value: "1", label: "Required (1)" },
                          ]}
                        />
                        <Button
                          type="button"
                          size="xs"
                          variant="outline"
                          onClick={() => removeConsent(idx, cIdx)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <div className="mt-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => addConsent(idx)}
                      >
                        + Add Consent Item
                      </Button>
                    </div>
                  </CollapsibleSectionCard>
                </div>

                <div className="sm:col-span-2 flex justify-between mt-4">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => removeSubPackage(idx)}
                  >
                    Remove Service Type
                  </Button>
                </div>
              </div>
            </CollapsibleSectionCard>
          ))}
        </section>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            disabled={loading || detailsLoading}
            isLoading={loading}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditPackageModal;

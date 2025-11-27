// -------------- FULL UPDATED ADD SERVICE TYPE MODAL --------------
// -------------- WITH SUB-PACKAGE LEVEL SERVICE LOCATION ONLY -----

import React, { useState, useEffect } from "react";
import Modal from "../../../shared/components/Modal/Modal";
import { Button, IconButton } from "../../../shared/components/Button";
import {
  FormInput,
  FormSelect,
  FormTextarea,
  FormCheckbox,
} from "../../../shared/components/Form";
import api from "../../../lib/axiosConfig";
import { toast } from "sonner";
import { CustomFileInput } from "../../../shared/components/CustomFileInput";
import ItemCard from "../../../shared/components/Card/ItemCard";
import { CollapsibleSectionCard } from "../../../shared/components/Card/CollapsibleSectionCard";
import { Plus, Trash } from "lucide-react";

// ----------------------------
// Helper templates
// ----------------------------
const makeEmptyPreferenceItem = () => ({
  preference_id: undefined,
  preference_value: "",
  preference_price: "",
  time_required: "",
});

const makeEmptyPreferenceGroup = (title = "") => ({
  title,
  is_required: "",
  items: [],
});

const makeEmptySubPackage = () => ({
  item_name: "",
  description: "",
  item_images: null,
  price: "",
  time_required: "",

  // ✨ NEW — sub-package serviceLocation
  serviceLocation: [],

  preferences: [],
  addons: [],
  consentForm: [],
});

const makeEmptyPackage = () => ({
  sub_packages: [makeEmptySubPackage()],
});

// ----------------------------
// Component Start
// ----------------------------
const AddServiceTypeModal = ({ isOpen, onClose, isSubmitting, refresh }) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);

  const [formData, setFormData] = useState({
    serviceId: "",
    serviceCategoryId: "",
    packageName: "",
    packageMedia_0: null,
    packages: [makeEmptyPackage()],
  });

  const [subPackageImagePreviews, setSubPackageImagePreviews] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [showPackageDetails, setShowPackageDetails] = useState(false);
  const [isPackageLocked, setIsPackageLocked] = useState(false);

  // City list for sub-packages
  const [cities, setCities] = useState([]);

  // ----------------------------
  // Fetch base data
  // ----------------------------
  const fetchCategories = async () => {
    try {
      const res = await api.get("/api/service/getcategorywithservices");
      setCategories(res.data.services || []);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const fetchCity = async () => {
    try {
      const res = await api.get("/api/service/getcity");
      setCities(res.data.city || []);
    } catch (error) {
      console.error("Failed to fetch cities:", error);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchCity();
  }, []);

  // ----------------------------
  // Utility updatePackages
  // ----------------------------
  const updatePackages = (mutateFn, { rebuildPreviews = false } = {}) => {
    setFormData((prev) => {
      const clone =
        typeof structuredClone === "function"
          ? structuredClone(prev.packages)
          : JSON.parse(JSON.stringify(prev.packages));
      mutateFn(clone);
      if (rebuildPreviews) rebuildPreviewsFromPackages(clone);
      return { ...prev, packages: clone };
    });
  };

  const rebuildPreviewsFromPackages = (packages) => {
    const newPreviews = {};
    (packages || []).forEach((pkg, pIdx) => {
      (pkg.sub_packages || []).forEach((sub, sIdx) => {
        if (sub?.item_images) {
          const key = `${pIdx}_${sIdx}`;
          newPreviews[key] =
            typeof sub.item_images === "string"
              ? sub.item_images
              : URL.createObjectURL(sub.item_images);
        }
      });
    });
    setSubPackageImagePreviews(newPreviews);
  };

  // ----------------------------
  // Select change handlers
  // ----------------------------
  const handleCategoryChange = (e) => {
    const selectedId = e.target.value;
    setFormData((prev) => ({
      ...prev,
      serviceCategoryId: selectedId,
      serviceId: "",
    }));
    const selectedCategory = categories.find(
      (cat) => String(cat.serviceCategoryId) === String(selectedId)
    );
    setFilteredServices(selectedCategory?.services || []);
  };

  const handleInputChange = (e) => {
    const { name } = e.target;
    let value;
    if (e.target.multiple) {
      value = Array.from(e.target.selectedOptions).map((o) => o.value);
    } else {
      value = e.target.value;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ----------------------------
  // Sub-package basic fields
  // ----------------------------
  const handleSubPackageChange = (pkgIndex, subIndex, field, value) => {
    updatePackages((pkgs) => {
      pkgs[pkgIndex].sub_packages[subIndex][field] = value;
    });
  };

  const handleSubPackageFileChange = (pkgIndex, subIndex, file) => {
    updatePackages(
      (pkgs) => {
        pkgs[pkgIndex].sub_packages[subIndex].item_images = file;
      },
      { rebuildPreviews: true }
    );
  };

  const removeSubPackageImage = (pkgIndex, subIndex) => {
    updatePackages(
      (pkgs) => {
        pkgs[pkgIndex].sub_packages[subIndex].item_images = null;
      },
      { rebuildPreviews: true }
    );
  };

  const addSubPackage = (pkgIndex) => {
    updatePackages(
      (pkgs) => {
        pkgs[pkgIndex].sub_packages.push(makeEmptySubPackage());
      },
      { rebuildPreviews: true }
    );
  };

  const removeSubPackage = (pkgIndex, subIndex) => {
    updatePackages(
      (pkgs) => {
        const subs = pkgs[pkgIndex].sub_packages;
        subs.splice(subIndex, 1);
        if (subs.length === 0) subs.push(makeEmptySubPackage());
      },
      { rebuildPreviews: true }
    );
  };

  // ----------------------------
  // Preferences / Addons / Consent handlers (same as before)
  // ----------------------------
  const handlePrefGroupTitleChange = (
    pkgIndex,
    subIndex,
    groupIndex,
    value
  ) => {
    updatePackages((pkgs) => {
      pkgs[pkgIndex].sub_packages[subIndex].preferences[groupIndex].title =
        value;
    });
  };

  const handlePrefGroupIsRequiredChange = (
    pkgIndex,
    subIndex,
    groupIndex,
    value
  ) => {
    updatePackages((pkgs) => {
      pkgs[pkgIndex].sub_packages[subIndex].preferences[
        groupIndex
      ].is_required = value;
    });
  };

  const addPreferenceGroup = (pkgIndex, subIndex) => {
    updatePackages((pkgs) => {
      pkgs[pkgIndex].sub_packages[subIndex].preferences.push(
        makeEmptyPreferenceGroup("")
      );
    });
  };

  const removePreferenceGroup = (pkgIndex, subIndex, groupIndex) => {
    updatePackages((pkgs) => {
      pkgs[pkgIndex].sub_packages[subIndex].preferences.splice(groupIndex, 1);
    });
  };

  const handlePreferenceChange = (
    pkgIndex,
    subIndex,
    groupIndex,
    prefIndex,
    field,
    value
  ) => {
    updatePackages((pkgs) => {
      pkgs[pkgIndex].sub_packages[subIndex].preferences[groupIndex].items[
        prefIndex
      ][field] = value;
    });
  };

  const addPreferenceItem = (pkgIndex, subIndex, groupIndex) => {
    updatePackages((pkgs) => {
      pkgs[pkgIndex].sub_packages[subIndex].preferences[groupIndex].items.push(
        makeEmptyPreferenceItem()
      );
    });
  };

  const removePreferenceItem = (pkgIndex, subIndex, groupIndex, prefIndex) => {
    updatePackages((pkgs) => {
      pkgs[pkgIndex].sub_packages[subIndex].preferences[
        groupIndex
      ].items.splice(prefIndex, 1);
    });
  };

  const addAddon = (pkgIndex, subIndex) => {
    updatePackages((pkgs) => {
      pkgs[pkgIndex].sub_packages[subIndex].addons.push({
        addon_name: "",
        description: "",
        price: "",
        time_required: "",
      });
    });
  };

  const removeAddon = (pkgIndex, subIndex, addonIndex) => {
    updatePackages((pkgs) => {
      pkgs[pkgIndex].sub_packages[subIndex].addons.splice(addonIndex, 1);
    });
  };

  const handleAddonChange = (pkgIndex, subIndex, addonIndex, field, value) => {
    updatePackages((pkgs) => {
      pkgs[pkgIndex].sub_packages[subIndex].addons[addonIndex][field] = value;
    });
  };

  const handleSubConsentChange = (
    pkgIndex,
    subIndex,
    consentIndex,
    field,
    value
  ) => {
    updatePackages((pkgs) => {
      pkgs[pkgIndex].sub_packages[subIndex].consentForm[consentIndex][field] =
        value;
    });
  };

  const addSubConsentForm = (pkgIndex, subIndex) => {
    updatePackages((pkgs) => {
      pkgs[pkgIndex].sub_packages[subIndex].consentForm.push({
        question: "",
        is_required: "",
      });
    });
  };

  const removeSubConsentForm = (pkgIndex, subIndex, consentIndex) => {
    updatePackages((pkgs) => {
      pkgs[pkgIndex].sub_packages[subIndex].consentForm.splice(consentIndex, 1);
    });
  };

  // ----------------------------
  // MAIN image handlers
  // ----------------------------
  const handleFileChange = (fileOrEvent) => {
    const file = fileOrEvent.target?.files
      ? fileOrEvent.target.files[0]
      : fileOrEvent;
    setFormData((prev) => ({ ...prev, packageMedia_0: file }));

    if (file) {
      const url = typeof file === "string" ? file : URL.createObjectURL(file);
      setImagePreview(url);
    } else setImagePreview(null);
  };

  const removeMainImage = () => {
    setFormData((prev) => ({ ...prev, packageMedia_0: null }));
    if (imagePreview?.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(imagePreview);
      } catch {}
    }
    setImagePreview(null);
  };

  const resetForm = () => {
    setFormData({
      serviceId: "",
      serviceCategoryId: "",
      packageName: "",
      packageMedia_0: null,
      packages: [makeEmptyPackage()],
    });
    setFilteredServices([]);
    setSubPackageImagePreviews({});
    setImagePreview(null);
    setShowPackageDetails(false);
  };

  // ----------------------------
  // Manual Validation
  // ----------------------------
  const simpleValidate = () => {
    if (!formData.serviceCategoryId) {
      toast.error("Please select a category.");
      return false;
    }

    if (!formData.serviceId) {
      toast.error("Please select a service group.");
      return false;
    }

    if (showPackageDetails && !formData.packageName.trim()) {
      toast.error("Please enter a package name.");
      return false;
    }

    for (let p = 0; p < formData.packages.length; p++) {
      const pkg = formData.packages[p];
      for (let s = 0; s < pkg.sub_packages.length; s++) {
        const sub = pkg.sub_packages[s];

        if (!sub.item_name.trim()) {
          toast.error(`Service Item ${s + 1}: Item Name is required.`);
          return false;
        }

        if (!sub.item_images) {
          toast.error(`Service Item ${s + 1}: Image is required.`);
          return false;
        }

        // ✨ NEW VALIDATION — MUST HAVE LOCATION
        if (
          !Array.isArray(sub.serviceLocation) ||
          sub.serviceLocation.length === 0
        ) {
          toast.error(
            `Service Item ${s + 1}: Please select at least one service location.`
          );
          return false;
        }

        if (!sub.price || isNaN(Number(sub.price))) {
          toast.error(`Service Item ${s + 1}: Price must be a number.`);
          return false;
        }
      }
    }

    return true;
  };

  // ----------------------------
  // Submit
  // ----------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!simpleValidate()) return;

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("serviceId", String(formData.serviceId));
      fd.append("serviceCategoryId", String(formData.serviceCategoryId));

      if (formData.packageMedia_0)
        fd.append("packageMedia_0", formData.packageMedia_0);

      const cleanedPackages = formData.packages.map((pkg, pkgIndex) => {
        const cleanedSubs = pkg.sub_packages.map((sub, subIndex) => {
          if (sub.item_images)
            fd.append(`itemMedia_${pkgIndex}_${subIndex}`, sub.item_images);

          // Convert grouped preferences
          const prefObj = (sub.preferences || []).reduce((acc, group) => {
            const key =
              group.title?.trim() ||
              `group_${Math.random().toString(36).slice(2, 6)}`;
            acc[key] = {
              is_required: Number(group.is_required) || 0,
              items: (group.items || []).map((it) => ({
                preference_value: it.preference_value || "",
                preference_price: it.preference_price || "",
                time_required: it.time_required || "",
              })),
            };
            return acc;
          }, {});

          return {
            item_name: sub.item_name,
            description: sub.description || "",
            price: sub.price,
            time_required: sub.time_required,
            serviceLocation: sub.serviceLocation, // <-- NEW
            preferences: prefObj,
            addons: sub.addons || [],
            consentForm: (sub.consentForm || []).map((c) => ({
              question: c.question || "",
              is_required: Number(c.is_required) || 0,
            })),
          };
        });

        return {
          packageName: formData.packageName || "",
          sub_packages: cleanedSubs,
        };
      });

      fd.append("packages", JSON.stringify(cleanedPackages));

      const response = await api.post("/api/admin/addpackages", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success(response.data.message || "Service type added!");
      resetForm();
      onClose();
      refresh();
    } catch (err) {
      toast.error("Failed to submit service type");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------
  // Render
  // ----------------------------
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title="Add New Service Type"
      size="xl"
      className="!max-w-5xl"
    >
      <div className="flex flex-col h-[80vh]">
        <div className="flex-1 min-h-0 overflow-y-auto pb-8">
          <form onSubmit={handleSubmit}>
            <CollapsibleSectionCard defaultOpen title="Service Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* CATEGORY */}
                <FormSelect
                  label="Category"
                  name="serviceCategoryId"
                  value={formData.serviceCategoryId}
                  onChange={handleCategoryChange}
                  placeholder="Select a category"
                  options={categories.map((cat) => ({
                    label: cat.categoryName,
                    value: String(cat.serviceCategoryId),
                  }))}
                />

                {/* SERVICE */}
                <FormSelect
                  label="Service Group"
                  name="serviceId"
                  value={formData.serviceId}
                  onChange={(e) => {
                    handleInputChange(e);
                    const found = filteredServices.find(
                      (s) => String(s.serviceId) === e.target.value
                    );
                    if (found) {
                      setShowPackageDetails(found.hasValidPackage);
                      setIsPackageLocked(found.hasValidPackage);
                    }
                  }}
                  placeholder="Select a service"
                  options={filteredServices.map((s) => ({
                    label: s.serviceName,
                    value: String(s.serviceId),
                  }))}
                />
              </div>

              <div className="mt-6">
                <FormCheckbox
                  label="Do you want to add Service Type?"
                  checked={showPackageDetails}
                  disabled={isPackageLocked}
                  onChange={(e) => setShowPackageDetails(e.target.checked)}
                />
              </div>

              {showPackageDetails && (
                <>
                  <div className="mt-6">
                    <FormInput
                      label="Service Type Name"
                      name="packageName"
                      value={formData.packageName}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="mt-6">
                    <CustomFileInput
                      label="Service Type Media"
                      onChange={handleFileChange}
                      preview={imagePreview}
                      onRemove={removeMainImage}
                    />
                  </div>
                </>
              )}
            </CollapsibleSectionCard>

            {/* ---------------------------------------------- */}
            {/* ----------- SUB-PACKAGES SECTION ------------- */}
            {/* ---------------------------------------------- */}
            <div className="space-y-8 mt-6">
              {formData.packages.map((pkg, pkgIndex) => (
                <React.Fragment key={pkgIndex}>
                  {pkg.sub_packages.map((sub, subIndex) => (
                    <CollapsibleSectionCard
                      key={subIndex}
                      title={`Service Item ${subIndex + 1}`}
                      className="mb-6"
                    >
                      <div className="flex justify-end mb-4">
                        {pkg.sub_packages.length > 1 && (
                          <IconButton
                            icon={<Trash />}
                            variant="lightDanger"
                            onClick={() => removeSubPackage(pkgIndex, subIndex)}
                          />
                        )}
                      </div>

                      {/* SUBPACKAGE FIELDS */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <FormInput
                          label="Item Name"
                          value={sub.item_name}
                          onChange={(e) =>
                            handleSubPackageChange(
                              pkgIndex,
                              subIndex,
                              "item_name",
                              e.target.value
                            )
                          }
                        />

                        <FormInput
                          label="Price"
                          type="number"
                          value={sub.price}
                          onChange={(e) =>
                            handleSubPackageChange(
                              pkgIndex,
                              subIndex,
                              "price",
                              e.target.value
                            )
                          }
                        />

                        <FormInput
                          label="Time Required (min)"
                          type="number"
                          value={sub.time_required}
                          onChange={(e) =>
                            handleSubPackageChange(
                              pkgIndex,
                              subIndex,
                              "time_required",
                              e.target.value
                            )
                          }
                        />

                        {/* ------------------------------------------- */}
                        {/* NEW: SERVICE LOCATION INSIDE SUB-PACKAGE   */}
                        {/* ------------------------------------------- */}
                        <FormSelect
                          label="Service Location"
                          multiple
                          value={sub.serviceLocation}
                          onChange={(e) => {
                            handleSubPackageChange(
                              pkgIndex,
                              subIndex,
                              "serviceLocation",
                              e.target.value 
                            );
                          }}
                          options={cities.map((c) => ({
                            value: c.serviceCity,
                            label: c.serviceCity,
                          }))}
                        />
                        {/* ------------------------------------------- */}

                        <div className="md:col-span-2">
                          <FormTextarea
                            rows={4}
                            label="Description"
                            value={sub.description}
                            onChange={(e) =>
                              handleSubPackageChange(
                                pkgIndex,
                                subIndex,
                                "description",
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <CustomFileInput
                          label="Image"
                          onChange={(e) =>
                            handleSubPackageFileChange(
                              pkgIndex,
                              subIndex,
                              e.target.files[0]
                            )
                          }
                          preview={
                            subPackageImagePreviews[`${pkgIndex}_${subIndex}`]
                          }
                          onRemove={() =>
                            removeSubPackageImage(pkgIndex, subIndex)
                          }
                        />
                      </div>

                      {/* ------------------------------------------------ */}
                      {/* PREFERENCES / ADDONS / CONSENT — UNCHANGED      */}
                      {/* ------------------------------------------------ */}

                      <CollapsibleSectionCard
                        title="Selections"
                        defaultOpen={false}
                        className="mt-6"
                      >
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <div />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() =>
                                  addPreferenceGroup(pkgIndex, subIndex)
                                }
                              >
                                + Add Group
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const first = sub.preferences?.[0];
                                  if (!first)
                                    addPreferenceGroup(pkgIndex, subIndex);
                                  else addPreferenceItem(pkgIndex, subIndex, 0);
                                }}
                              >
                                + Add Selection
                              </Button>
                            </div>
                          </div>

                          {(sub.preferences || []).length === 0 && (
                            <p className="text-sm text-gray-500 italic">
                              No Selection groups
                            </p>
                          )}

                          {(sub.preferences || []).map((group, groupIndex) => (
                            <div
                              key={groupIndex}
                              className="mb-4 p-4 border rounded-lg bg-white"
                            >
                              <div className="flex justify-between mb-2 items-center gap-4">
                                <div className="flex-1">
                                  <FormInput
                                    label="Group Title"
                                    value={group.title}
                                    onChange={(e) =>
                                      handlePrefGroupTitleChange(
                                        pkgIndex,
                                        subIndex,
                                        groupIndex,
                                        e.target.value
                                      )
                                    }
                                  />
                                </div>

                                <div className="flex gap-2 items-end">
                                  <div className="w-40">
                                    <FormSelect
                                      label="Required?"
                                      value={group.is_required}
                                      onChange={(e) =>
                                        handlePrefGroupIsRequiredChange(
                                          pkgIndex,
                                          subIndex,
                                          groupIndex,
                                          e.target.value
                                        )
                                      }
                                      options={[
                                        {
                                          value: "0",
                                          label: "Optional",
                                        },
                                        {
                                          value: "1",
                                          label: "Required",
                                        },
                                      ]}
                                    />
                                  </div>

                                  <div className="flex gap-2">
                                    <Button
                                      size="xs"
                                      variant="outline"
                                      onClick={() =>
                                        addPreferenceItem(
                                          pkgIndex,
                                          subIndex,
                                          groupIndex
                                        )
                                      }
                                    >
                                      + Add Selection
                                    </Button>
                                    <Button
                                      size="xs"
                                      variant="error"
                                      onClick={() =>
                                        removePreferenceGroup(
                                          pkgIndex,
                                          subIndex,
                                          groupIndex
                                        )
                                      }
                                    >
                                      Remove Group
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              {(group.items || []).length === 0 && (
                                <p className="text-xs text-gray-400 italic mb-2">
                                  No items in this group
                                </p>
                              )}

                              {(group.items || []).map((pref, prefIndex) => (
                                <div key={prefIndex} className="mb-2">
                                  <div className="grid md:grid-cols-2 gap-3 my-2 items-end">
                                    <FormInput
                                      label={`Selection ${prefIndex + 1}`}
                                      value={pref.preference_value}
                                      onChange={(e) =>
                                        handlePreferenceChange(
                                          pkgIndex,
                                          subIndex,
                                          groupIndex,
                                          prefIndex,
                                          "preference_value",
                                          e.target.value
                                        )
                                      }
                                    />

                                    <FormInput
                                      label="Price"
                                      type="number"
                                      value={pref.preference_price}
                                      onChange={(e) =>
                                        handlePreferenceChange(
                                          pkgIndex,
                                          subIndex,
                                          groupIndex,
                                          prefIndex,
                                          "preference_price",
                                          e.target.value
                                        )
                                      }
                                    />

                                    <FormInput
                                      label="Time Required (min)"
                                      type="number"
                                      value={pref.time_required}
                                      onChange={(e) =>
                                        handlePreferenceChange(
                                          pkgIndex,
                                          subIndex,
                                          groupIndex,
                                          prefIndex,
                                          "time_required",
                                          e.target.value
                                        )
                                      }
                                    />
                                  </div>

                                  <div className="flex justify-end">
                                    <Button
                                      size="xs"
                                      variant="outline"
                                      onClick={() =>
                                        removePreferenceItem(
                                          pkgIndex,
                                          subIndex,
                                          groupIndex,
                                          prefIndex
                                        )
                                      }
                                    >
                                      Remove
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </CollapsibleSectionCard>

                      <Button
                        variant="outline"
                        icon={<Plus />}
                        className="w-full border-dashed mt-4"
                        onClick={() => addPreferenceGroup(pkgIndex, subIndex)}
                      >
                        Add New Selection Group
                      </Button>

                      {/* ADDONS */}
                      <CollapsibleSectionCard title="Add-ons" className="mt-4">
                        {sub.addons.map((addon, addonIndex) => (
                          <ItemCard
                            key={addonIndex}
                            title={`Add-on ${addonIndex + 1}`}
                            showRemove
                            onRemove={() =>
                              removeAddon(pkgIndex, subIndex, addonIndex)
                            }
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormInput
                                label="Add-on Name"
                                value={addon.addon_name}
                                onChange={(e) =>
                                  handleAddonChange(
                                    pkgIndex,
                                    subIndex,
                                    addonIndex,
                                    "addon_name",
                                    e.target.value
                                  )
                                }
                              />
                              <FormInput
                                label="Price"
                                type="number"
                                value={addon.price}
                                onChange={(e) =>
                                  handleAddonChange(
                                    pkgIndex,
                                    subIndex,
                                    addonIndex,
                                    "price",
                                    e.target.value
                                  )
                                }
                              />
                              <FormInput
                                label="Description"
                                value={addon.description}
                                onChange={(e) =>
                                  handleAddonChange(
                                    pkgIndex,
                                    subIndex,
                                    addonIndex,
                                    "description",
                                    e.target.value
                                  )
                                }
                              />
                              <FormInput
                                label="Time Required (min)"
                                type="number"
                                value={addon.time_required}
                                onChange={(e) =>
                                  handleAddonChange(
                                    pkgIndex,
                                    subIndex,
                                    addonIndex,
                                    "time_required",
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                          </ItemCard>
                        ))}

                        <Button
                          variant="outline"
                          icon={<Plus />}
                          className="w-full border-dashed mt-2"
                          onClick={() => addAddon(pkgIndex, subIndex)}
                        >
                          Add Add-on
                        </Button>
                      </CollapsibleSectionCard>

                      {/* CONSENT */}
                      <CollapsibleSectionCard
                        title="Consent Form"
                        className="mt-4"
                      >
                        <div className="space-y-4">
                          {sub.consentForm.map((consentItem, index) => (
                            <ItemCard
                              key={index}
                              title={`Consent ${index + 1}`}
                              showRemove
                              onRemove={() =>
                                removeSubConsentForm(pkgIndex, subIndex, index)
                              }
                            >
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormInput
                                  label="Consent Statement"
                                  value={consentItem.question}
                                  onChange={(e) =>
                                    handleSubConsentChange(
                                      pkgIndex,
                                      subIndex,
                                      index,
                                      "question",
                                      e.target.value
                                    )
                                  }
                                />

                                <FormSelect
                                  label="Required?"
                                  value={consentItem.is_required}
                                  onChange={(e) =>
                                    handleSubConsentChange(
                                      pkgIndex,
                                      subIndex,
                                      index,
                                      "is_required",
                                      e.target.value
                                    )
                                  }
                                  options={[
                                    {
                                      label: "Required",
                                      value: "1",
                                    },
                                    {
                                      label: "Optional",
                                      value: "0",
                                    },
                                  ]}
                                />
                              </div>
                            </ItemCard>
                          ))}

                          <Button
                            variant="outline"
                            icon={<Plus />}
                            className="w-full border-dashed"
                            onClick={() =>
                              addSubConsentForm(pkgIndex, subIndex)
                            }
                          >
                            Add Consent Item
                          </Button>
                        </div>
                      </CollapsibleSectionCard>
                    </CollapsibleSectionCard>
                  ))}

                  {/* ADD SUBPACKAGE BUTTON */}
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      icon={<Plus />}
                      className="w-full border-dashed"
                      onClick={() => addSubPackage(pkgIndex)}
                    >
                      Add Service Item
                    </Button>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </form>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
          <Button
            variant="lightInherit"
            onClick={() => {
              resetForm();
              onClose();
            }}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            disabled={loading || isSubmitting}
            isLoading={loading || isSubmitting}
            onClick={handleSubmit}
          >
            {loading ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AddServiceTypeModal;

import { useEffect, useState } from "react";
import api from "../../../lib/axiosConfig";
import { toast } from "sonner";
import { Card } from "../../../shared/components/Card";
import { IconButton } from "../../../shared/components/Button";
import LoadingSpinner from "../../../shared/components/LoadingSpinner";
import { Trash } from "lucide-react";
import UniversalDeleteModal from "../../../shared/components/Modal/UniversalDeleteModal";

const ProfileServicesOffered = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // ⬇️ modal-related state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);
  const [deleteAction, setDeleteAction] = useState(null);
  const [deleteDesc, setDeleteDesc] = useState("");

  useEffect(() => {
    fetchVendorService();
  }, []);

  const fetchVendorService = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/vendor/getvendorservice");
      setServices(response?.data?.result || []);
    } catch (error) {
      console.error("Error fetching vendor services:", error);
      toast.error("Failed to load services");
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteSubPackageApi = async ({
    vendor_packages_id,
    package_id,
    package_item_id,
  }) => {
    return api.delete(`/api/vendor/removepackage/${vendor_packages_id}`, {
      data: { package_id, package_item_id },
    });
  };

  // 🧠 open the modal from the sub-package delete button
  const handleAskDeleteSub = ({
    vendor_packages_id,
    package_id,
    package_item_id,
    sub_package_name,
  }) => {
    const item = {
      vendor_packages_id,
      package_id,
      package_item_id,
      sub_package_name,
    };
    setDeletingItem(item);

    setDeleteDesc(
      `Delete sub-package "${
        sub_package_name || package_item_id
      }"? This action cannot be undone.`
    );

    // provide an action for the modal to call
    setDeleteAction(() => async () => {
      try {
        setDeleting(true);
        const res = await deleteSubPackageApi(item);

        const message =
          res?.data?.message ||
          (res?.status === 200
            ? "Sub-package removed successfully"
            : "Removed sub-package");

        await fetchVendorService();
        toast.success(message);
      } catch (err) {
        console.error("Error deleting sub-package:", err);
        const serverMsg = err?.response?.data?.message;
        toast.error(serverMsg || "Failed to delete sub-package");
        // optional: make sure UI is in sync
        await fetchVendorService();
        throw err; // let UniversalDeleteModal's onError run
      } finally {
        setDeleting(false);
        setShowDeleteModal(false);
        setDeletingItem(null);
        setDeleteAction(null);
      }
    });

    setShowDeleteModal(true);
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <div className="flex items-center justify-center py-8 sm:py-12">
          <LoadingSpinner size="md" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-3 sm:p-3">
      <div className="">
        {services.length === 0 ? (
          <div className="py-8 text-center sm:py-12">
            <div className="text-gray-500">No services found</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-2">
            {services.map((service, idx) => (
              <div
                key={service?.vendor_packages_id ?? idx}
                className="overflow-hidden rounded-xl"
              >
                <div className="p-2 sm:p-4">
                  <h4 className="mb-2 text-lg font-semibold text-gray-900 sm:mb-3 sm:text-xl">
                    {service?.package_name}
                  </h4>

                  {Array.isArray(service?.sub_packages) &&
                    service.sub_packages.length > 0 && (
                      <div className="mt-4 space-y-2 sm:mt-6 sm:space-y-4">
                        {service.sub_packages.map((sub, sIdx) => (
                          <div
                            key={
                              sub?.package_item_id ??
                              `${service.vendor_packages_id}-${sIdx}`
                            }
                            className="flex items-start p-2 rounded-lg bg-gray-50 sm:gap-4 sm:p-4"
                          >
                            <div className="flex-1 min-w-0">
                              <h6 className="text-sm font-medium text-gray-900 sm:text-base">
                                {sub?.sub_package_name}
                              </h6>
                              {sub?.sub_package_description && (
                                <p className="mt-1 text-xs text-gray-600 line-clamp-2 sm:mt-2 sm:text-sm">
                                  {sub.sub_package_description}
                                </p>
                              )}
                            </div>

                            <IconButton
                              disabled={
                                deleting &&
                                deletingItem?.package_item_id ===
                                  sub?.package_item_id
                              }
                              onClick={() =>
                                handleAskDeleteSub({
                                  vendor_packages_id: sub.vendor_packages_id,
                                  package_id: service.package_id,
                                  package_item_id: sub.package_item_id,
                                  sub_package_name: sub.sub_package_name,
                                })
                              }
                              variant="lightDanger"
                              size="sm"
                              icon={<Trash className="w-4 h-4" />}
                              title="Delete this sub-package"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <UniversalDeleteModal
        open={showDeleteModal}
        onClose={() => {
          if (!deleting) {
            setShowDeleteModal(false);
            setDeleteAction(null);
            setDeletingItem(null);
          }
        }}
        onDelete={deleteAction}
        confirmLabel="Remove"
        cancelLabel="Cancel"
        title="Confirm delete"
        desc={deleteDesc}
        autoClose={true}
      />
    </Card>
  );
};

export default ProfileServicesOffered;
import { useState, useEffect } from "react";
import LoadingSlider from "../../shared/components/LoadingSpinner";
import { formatDate } from "../../shared/utils/dateUtils";
import IconButton from "../../shared/components/Button/IconButton";
import { FormInput, FormSelect } from "../../shared/components/Form";
import { Calendar, Star, Trash, User } from "lucide-react";
import api from "../../lib/axiosConfig";
import UniversalDeleteModal from "../../shared/components/Modal/UniversalDeleteModal";

const UserRating = () => {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [showDeleteModal, setDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);
  const [deleteDesc, setDeleteDesc] = useState("");

  useEffect(() => {
    fetchRatings();
  }, []);

  const fetchRatings = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/rating/getpackagebookedrating");
      setRatings(res.data.rating || []);
    } catch (err) {
      console.error("Error fetching ratings:", err);
      setError("Failed to load ratings");
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (ratingId) => {
    setDeletingItem(ratingId);
    setDeleteDesc(
      "Are you sure you want to delete this rating? This action cannot be undone."
    );
    setDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingItem) {
      setDeleteModal(false);
      return;
    }
    try {
      setDeleting(true);
      await handleDelete(deletingItem);
      setDeleteModal(false);
      setDeletingItem(null);
    } catch (err) {
      console.error("Confirm delete error:", err);
      toast.error("Error deleting item");
    } finally {
      setDeleting(false);
    }
  };

  const handleDelete = async (ratingId) => {
    if (!ratingId) return;
    try {
      await api.delete(`/api/notification/deleterating/${ratingId}`);
      fetchRatings();
    } catch (err) {
      alert("Failed to delete rating.");
      console.error(err);
    }
  };

  const handleFilterChange = (e) => setFilter(e.target.value);
  const handleSearchChange = (e) => setSearchTerm(e.target.value.toLowerCase());

  const filteredRatings = ratings.filter((r) => {
    const matchesRating = filter === "all" || r.rating === parseInt(filter);
    const matchesSearch =
      !searchTerm ||
      r.userName.toLowerCase().includes(searchTerm) ||
      r.vendor_name.toLowerCase().includes(searchTerm);
    return matchesRating && matchesSearch;
  });

  const renderStars = (rating) =>
    Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={
          i < rating ? "text-yellow-400 drop-shadow-sm" : "text-gray-300"
        }
      >
        ★
      </span>
    ));

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratings.forEach((r) => distribution[r.rating]++);
    return distribution;
  };

  const distribution = getRatingDistribution();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSlider />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          User Bookings Ratings & Reviews
        </h2>

        {/* Summary Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Average Rating */}
            <div className="flex flex-col items-center justify-center p-4 border-r md:border-gray-200">
              <div className="text-5xl font-bold text-primary-dark mb-2">
                {ratings.length > 0
                  ? (
                      ratings.reduce((sum, r) => sum + r.rating, 0) /
                      ratings.length
                    ).toFixed(1)
                  : "0.0"}
              </div>
              <div className="flex text-4xl text-yellow-400 mb-1 drop-shadow-sm">
                {renderStars(
                  Math.round(
                    ratings.reduce((sum, r) => sum + r.rating, 0) /
                      ratings.length
                  )
                )}
              </div>
              <div className="text-sm text-gray-500">
                Based on {ratings.length}{" "}
                {ratings.length === 1 ? "review" : "reviews"}
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="p-4">
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                Rating Distribution
              </h3>
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = distribution[rating] || 0;
                const percentage =
                  ratings.length > 0
                    ? Math.round((count / ratings.length) * 100)
                    : 0;
                return (
                  <div key={rating} className="flex items-center mb-3">
                    <div className="flex items-center text-yellow-500 font-semibold w-12">
                      {rating} <Star className="ml-1 h-4 w-4" />
                    </div>

                    <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-light rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>

                    <div className="ml-3 text-sm text-gray-600 w-20 text-right">
                      {count} ({percentage}%)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className=" overflow-hidden">
          <div className="p-4 bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Customer Reviews
            </h3>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <FormInput
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search by user/vendor"
                className="w-full"
              />

              <FormSelect
                value={filter}
                onChange={handleFilterChange}
                options={[
                  { value: "all", label: "All Ratings" },
                  { value: "5", label: "5 Stars" },
                  { value: "4", label: "4 Stars" },
                  { value: "3", label: "3 Stars" },
                  { value: "2", label: "2 Stars" },
                  { value: "1", label: "1 Star" },
                ]}
                className="w-full sm:w-48"
              />
            </div>
          </div>

          {/* Rating Cards */}
          {filteredRatings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 p-3">
              {filteredRatings.map((rating) => (
                <div
                  key={rating.rating_id}
                  className="relative bg-white border border-gray-200 rounded-xl p-5 shadow hover:shadow-md transition-all "
                >
                  <IconButton
                    aria-label="Delete Rating"
                    icon={<Trash className="h-5 w-5" />}
                    variant="lightDanger"
                    onClick={() => openDeleteModal(rating.rating_id)}
                    className="absolute bottom-5 right-5"
                  />

                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-100 rounded-full p-2">
                        <User className="h-6 w-6 text-gray-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {rating.userName}
                        </h4>
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(rating.created_at)}
                        </div>
                      </div>
                    </div>

                    <div className="text-yellow-400 text-xl drop-shadow-sm">
                      {renderStars(rating.rating)}
                    </div>
                  </div>

                  <p className="text-gray-700 text-xs leading-relaxed mt-3">
                    Reviews:{" "}
                    <span className="font-bold text-sm">
                      {rating.review || "No written review provided."}
                    </span>
                  </p>

                  <div className="text-xs text-gray-600 font-medium mt-3">
                    Vendor:{" "}
                    <span className="font-bold text-sm">
                      {rating.vendor_name}
                    </span>
                  </div>
                  <div className="text-xs bg-gray-100 mt-3 w-fit p-2 rounded-md">
                    {rating.packageName}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-600">
              No matching reviews found.
            </div>
          )}
        </div>
      </div>

      <UniversalDeleteModal
        open={showDeleteModal}
        onClose={() => {
          if (!deleting) {
            setDeleteModal(false);
            setDeletingItem(null);
            setDeleteDesc("");
          }
        }}
        onDelete={confirmDelete}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        title="Delete User Rating"
        desc={deleteDesc}
      />
    </>
  );
};

export default UserRating;

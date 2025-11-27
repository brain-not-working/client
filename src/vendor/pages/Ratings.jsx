import { useState, useEffect, useMemo } from "react";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import { formatDate } from "../../shared/utils/dateUtils";
import { FormInput, FormSelect } from "../../shared/components/Form";
import { Star, User, Calendar, Search, Filter, X } from "lucide-react";
import api from "../../lib/axiosConfig";

// Avatar fallback component
const Avatar = ({ name, className = "" }) => (
  <div className={`flex items-center justify-center w-8 h-8 text-xs font-semibold text-gray-600 bg-gray-200 rounded-full flex-shrink-0 ${className}`}>
    {name ? name[0].toUpperCase() : <User className="w-4 h-4" />}
  </div>
);

const Ratings = () => {
  const [ratings, setRatings] = useState([]);
  const [stats, setStats] = useState({ average_rating: 0, total_reviews: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    fetchRatings();
  }, []);

  const fetchRatings = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/rating/getrating");
      setRatings(response.data.ratings || []);
      setStats({
        average_rating: Math.floor(response.data.average_rating * 10) / 10 || 0,
        total_reviews: response.data.total_reviews || 0,
      });
      setLoading(false);
    } catch (error) {
      setError("Failed to load ratings");
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => setFilter(e.target.value);

  const filteredRatings = ratings.filter((rating) => {
    const matchesRating =
      filter === "all" ? true : rating.rating === parseInt(filter);

    const q = search.trim().toLowerCase();
    const matchesSearch = q
      ? (rating.user_name || "").toLowerCase().includes(q) ||
        (rating.serviceName || "").toLowerCase().includes(q) ||
        (rating.review || "").toLowerCase().includes(q)
      : true;

    const matchesService =
      serviceFilter === "all"
        ? true
        : (rating.serviceName || "").trim().toLowerCase() === serviceFilter;

    return matchesRating && matchesSearch && matchesService;
  });

  const serviceOptions = useMemo(() => {
    const names = Array.from(
      new Set(
        (ratings || []).map((r) => (r.serviceName || "").trim()).filter(Boolean)
      )
    ).sort();

    return [
      { value: "all", label: "All Services" },
      ...names.map((n) => ({ value: n.toLowerCase(), label: n })),
    ];
  }, [ratings]);

  const renderStars = (rating) => (
    <div className="flex">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 sm:w-5 sm:h-5 ${
            i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
          }`}
          fill={i < rating ? "currentColor" : "none"}
        />
      ))}
    </div>
  );

  const getRatingDistribution = () => {
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratings.forEach((r) => dist[r.rating]++);
    return dist;
  };

  const distribution = getRatingDistribution();

  const applyMobileFilters = () => {
    setShowMobileFilters(false);
  };

  const resetFilters = () => {
    setFilter("all");
    setServiceFilter("all");
    setSearch("");
    setShowMobileFilters(false);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );

  if (error)
    return (
      <div className="p-4 mx-4 mt-4 text-red-700 rounded-lg bg-red-50">
        <p className="text-sm font-medium">{error}</p>
        <button 
          onClick={fetchRatings}
          className="mt-2 text-sm text-red-600 underline hover:text-red-700"
        >
          Try again
        </button>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full px-3 py-4 mx-auto sm:px-4 sm:py-6 lg:px-6 lg:py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Ratings & Reviews</h1>
              <p className="mt-1 text-sm text-gray-600">
                Customer feedback and ratings for your services
              </p>
            </div>
            
            {/* Mobile Filter Button */}
            <button
              onClick={() => setShowMobileFilters(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg sm:hidden hover:bg-gray-50"
            >
              <Filter size={16} />
              Filters
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 gap-4 mb-6 lg:grid-cols-3">
          {/* Average Rating Card */}
          <div className="p-4 bg-white border border-gray-200 shadow-xs rounded-xl sm:p-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-50 rounded-xl sm:w-16 sm:h-16">
                <div className="text-2xl font-bold text-blue-600 sm:text-3xl">
                  {stats.average_rating ? stats.average_rating.toFixed(1) : "0.0"}
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">Average Rating</p>
                <div className="mt-1">
                  {renderStars(Math.round(stats.average_rating))}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Based on {stats.total_reviews} {stats.total_reviews === 1 ? 'review' : 'reviews'}
                </p>
              </div>
            </div>
          </div>

          {/* Rating Distribution Card */}
          <div className="p-4 bg-white border border-gray-200 shadow-xs rounded-xl sm:p-6 lg:col-span-2">
            <h3 className="mb-3 text-sm font-semibold text-gray-900 sm:text-base">Rating Distribution</h3>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = distribution[rating] || 0;
                const percentage = stats.total_reviews
                  ? Math.round((count / stats.total_reviews) * 100)
                  : 0;
                return (
                  <div key={rating} className="flex items-center">
                    <span className="flex items-center w-12 text-sm font-medium text-gray-600 sm:w-14">
                      {rating}
                      <Star className="w-3 h-3 ml-1 sm:w-4 sm:h-4" />
                    </span>
                    <div className="flex-1 h-2 mx-2 overflow-hidden bg-gray-100 rounded-full">
                      <div
                        className="h-full transition-all duration-300 bg-yellow-400 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-12 text-xs text-right text-gray-500 sm:w-16">
                      {count} ({percentage}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Desktop Filters */}
        <div className="hidden p-4 mb-6 bg-white border border-gray-200 shadow-xs rounded-xl sm:block">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {/* Search */}
            <div className="md:col-span-1">
              <label htmlFor="search" className="block mb-2 text-sm font-medium text-gray-700">
                Search Reviews
              </label>
              <div className="relative">
                <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                <FormInput
                  id="search"
                  placeholder="Search reviews..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Service Filter */}
            <div>
              <label htmlFor="serviceFilter" className="block mb-2 text-sm font-medium text-gray-700">
                Service Type
              </label>
              <FormSelect
                id="serviceFilter"
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                options={serviceOptions}
              />
            </div>

            {/* Rating Filter */}
            <div>
              <label htmlFor="ratingFilter" className="block mb-2 text-sm font-medium text-gray-700">
                Rating
              </label>
              <FormSelect
                id="ratingFilter"
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
              />
            </div>

            {/* Reset Button */}
            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
              >
                Reset Filters
              </button>
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
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Search */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Search Reviews
                  </label>
                  <div className="relative">
                    <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                    <FormInput
                      placeholder="Search reviews..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Service Filter */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Service Type
                  </label>
                  <FormSelect
                    value={serviceFilter}
                    onChange={(e) => setServiceFilter(e.target.value)}
                    options={serviceOptions}
                  />
                </div>

                {/* Rating Filter */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Rating
                  </label>
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
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={resetFilters}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
                  >
                    Reset
                  </button>
                  <button
                    onClick={applyMobileFilters}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reviews Grid */}
        <div className="overflow-hidden bg-white border border-gray-200 shadow-xs rounded-xl">
          {/* Results Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Customer Reviews
              {filteredRatings.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({filteredRatings.length} {filteredRatings.length === 1 ? 'review' : 'reviews'})
                </span>
              )}
            </h2>
            
            {/* Mobile Search Button */}
            <button
              onClick={() => setShowMobileFilters(true)}
              className="p-2 text-gray-400 hover:text-gray-600 sm:hidden"
            >
              <Search size={20} />
            </button>
          </div>

          {/* Reviews List */}
          {filteredRatings.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredRatings.map((rating) => (
                <div
                  key={rating.rating_id}
                  className="p-4 transition-all duration-200 bg-white border border-gray-200 rounded-lg hover:shadow-md"
                >
                  <div className="flex gap-3">
                    <Avatar name={rating.user_name} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">
                            {rating.user_name || 'Anonymous'}
                          </h4>
                          <div className="flex items-center mt-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatDate(rating.created_at)}
                          </div>
                        </div>
                        <div className="flex-shrink-0 ml-2">
                          {renderStars(rating.rating)}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-700 line-clamp-3">
                        {rating.review || "No written review provided."}
                      </p>
                      
                      {rating.serviceName && (
                        <div className="mt-3">
                          <span className="inline-block px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded">
                            {rating.serviceName.trim()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="py-12 text-center">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full">
                <Star className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-gray-900">No reviews found</h3>
              <p className="max-w-sm mx-auto text-gray-500">
                {search || filter !== 'all' || serviceFilter !== 'all'
                  ? "Try adjusting your filters to see more results."
                  : "Your reviews will appear here once customers rate your services."}
              </p>
              {(search || filter !== 'all' || serviceFilter !== 'all') && (
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Ratings;
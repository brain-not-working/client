import { useState, useEffect } from "react";
import api from "../../lib/axiosConfig";
import { toast } from "sonner";
import { Card } from "../../shared/components/Card";
import { Button } from "../../shared/components/Button";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ProfileEditModal from "../../vendor/components/Modals/ProfileEditModal";
import {
  User,
  Calendar,
  Package,
  BadgeCheck,
  LinkIcon,
  AlertCircle,
  Pencil,
  Phone,
  Mail,
  MapPin,
  Cake,
  Briefcase,
  FileText,
  Building,
  UserCheck,
  Globe,
  Badge,
  Menu,
  X,
} from "lucide-react";
import ProfileServicesOffered from "./components/ProfileServicesOffered";
import { useVendorAuth } from "../contexts/VendorAuthContext";

const Profile = () => {
  const { currentUser } = useVendorAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchVendorProfile();
  }, [currentUser]);

  const fetchVendorProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/vendor/getprofile");
      if (response.data?.profile) {
        setProfile(response.data.profile);
      }
    } catch (error) {
      toast.error("Failed to load profile data");
      console.error("Error fetching vendor profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = () => {
    setIsEditModalOpen(false);
    fetchVendorProfile();
  };

  // Mobile tab navigation
  const handleMobileTabChange = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-full px-4 mx-auto sm:px-6 lg:px-8">
          {/* Mobile Header */}
          <div className="pt-4 lg:hidden">
            <div className="flex items-center justify-between py-3">
              <div>
                <h1 className="text-lg font-bold text-gray-900">My Profile</h1>
                <p className="text-xs text-gray-600">Manage your professional information</p>
              </div>
              <div className="flex items-center">
                <Button
                  onClick={() => setIsEditModalOpen(true)}
                  variant="primary"
                  size="sm"
                  icon={<Pencil className="w-3 h-3" />}
                  className="hidden xs:flex"
                >
                  Edit
                </Button>
                <Button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  variant="outline"
                  size="sm"
                  icon={mobileMenuOpen ? <X className="w-3 h-3" /> : <Menu className="w-3 h-3" />}
                >
                  {mobileMenuOpen ? "Close" : "Menu"}                  
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Tabs Dropdown */}
          <div className="lg:hidden">
            {mobileMenuOpen && (
              <div className="mb-4 bg-white border border-gray-200 rounded-lg shadow-lg">
                <div className="p-3 border-b border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900">Navigation</h3>
                </div>
                <div className="p-2 space-y-1">
                  <button
                    onClick={() => handleMobileTabChange("profile")}
                    className={`flex items-center w-full px-3 py-3 text-left transition-colors rounded-lg ${
                      activeTab === "profile"
                        ? "bg-green-50 text-green-700 border-l-4 border-green-500"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <User className="w-4 h-4 mr-3" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">Profile Information</div>
                      <div className="text-xs text-gray-500">Personal and professional details</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleMobileTabChange("services")}
                    className={`flex items-center w-full px-3 py-3 text-left transition-colors rounded-lg ${
                      activeTab === "services"
                        ? "bg-green-50 text-green-700 border-l-4 border-green-500"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Package className="w-4 h-4 mr-3" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">Services Offered</div>
                      <div className="text-xs text-gray-500">Manage your services</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleMobileTabChange("certificates")}
                    className={`flex items-center w-full px-3 py-3 text-left transition-colors rounded-lg ${
                      activeTab === "certificates"
                        ? "bg-green-50 text-green-700 border-l-4 border-green-500"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <BadgeCheck className="w-4 h-4 mr-3" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">Certificates</div>
                      <div className="text-xs text-gray-500">Documents and licenses</div>
                    </div>
                  </button>
                </div>
                <div className="p-3 border-t border-gray-200">
                  <Button
                    onClick={() => setIsEditModalOpen(true)}
                    variant="primary"
                    size="sm"
                    icon={<Pencil className="w-3 h-3" />}
                    className="w-full text-sm"
                  >
                    Edit Profile
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden pt-6 lg:block">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
                <p className="mt-2 text-gray-600">Manage your professional information and services</p>
              </div>
              <Button
                onClick={() => setIsEditModalOpen(true)}
                variant="primary"
                size="lg"
                icon={<Pencil className="w-5 h-5" />}
              >
                Edit Profile
              </Button>
            </div>

            {/* Desktop Tabs */}
            <div className="mb-8 border-b border-gray-200">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-500 flex items-center ${
                    activeTab === "profile"
                      ? "border-green-500 text-green-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <User className="inline w-5 h-5 mr-3" />
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
                  <Package className="inline w-5 h-5 mr-3" />
                  Services Offered
                </button>

                <button
                  onClick={() => setActiveTab("certificates")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-500 flex items-center ${
                    activeTab === "certificates"
                      ? "border-green-500 text-green-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <BadgeCheck className="inline w-5 h-5 mr-3" />
                  Certificates
                </button>
              </nav>
            </div>
          </div>

          {/* Mobile Active Tab Indicator */}
          <div className="mb-4 lg:hidden">
            <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center">
                {activeTab === "profile" && <User className="w-5 h-5 mr-3 text-green-600" />}
                {activeTab === "services" && <Package className="w-5 h-5 mr-3 text-green-600" />}
                {activeTab === "certificates" && <BadgeCheck className="w-5 h-5 mr-3 text-green-600" />}
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {activeTab === "profile" && "Profile Information"}
                    {activeTab === "services" && "Services Offered"}
                    {activeTab === "certificates" && "Certificates"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {activeTab === "profile" && "Personal and professional details"}
                    {activeTab === "services" && "Manage your services"}
                    {activeTab === "certificates" && "Documents and licenses"}
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setIsEditModalOpen(true)}
                variant="primary"
                size="sm"
                icon={<Pencil className="w-3 h-3" />}
                className="flex xs:hidden"
              >
                Edit
              </Button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="pb-8">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="transition-all duration-300 ease-in-out">
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 lg:gap-8">
                  {/* Left Sidebar - Profile Overview */}
                  <div className="xl:col-span-1">
                    <Card className="border-0 shadow-lg h-fit">
                      <div className="p-6 text-center sm:p-6">
                        {/* Profile Image */}
                        <div className="relative inline-block">
                          <div className="w-24 h-24 mx-auto overflow-hidden border-4 border-white rounded-2xl sm:w-32 sm:h-32">
                            <img
                              src={profile?.profileImage || "/profile-img.webp"}
                              alt="Profile"
                              className="object-cover w-full h-full"
                              onError={(e) => {
                                e.target.src = "/profile-img.webp";
                              }}
                            />
                          </div>
                          {/* Online Status Indicator */}
                          <div className="absolute w-3 h-3 bg-green-500 border-2 border-white rounded-full bottom-1 right-1 sm:bottom-2 sm:right-2 sm:w-4 sm:h-4"></div>
                        </div>

                        {/* Profile Info */}
                        <div className="mt-6 sm:mt-6">
                          <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
                            {profile?.name || "No Name"}
                          </h2>
                          <div className="inline-flex items-center px-3 py-1 mt-2 text-xs font-semibold text-green-800 capitalize bg-green-100 rounded-full sm:text-sm sm:px-4 sm:py-2">
                            <BadgeCheck className="w-3 h-3 mr-1 sm:w-4 sm:h-4 sm:mr-2" />
                            {profile?.vendorType || "Vendor"} Professional
                          </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-4 mt-6 sm:gap-4 sm:mt-6">
                          <div className="p-3 text-center bg-blue-50 rounded-xl sm:p-4">
                            <Calendar className="w-5 h-5 mx-auto mb-2 text-blue-600 sm:w-6 sm:h-6 sm:mb-2" />
                            <div className="text-xs font-medium text-gray-900 sm:text-sm">Member Since</div>
                            <div className="text-xs text-gray-600 sm:text-sm">
                              {profile?.created_at
                                ? new Date(profile.created_at).getFullYear()
                                : "N/A"}
                            </div>
                          </div>
                          <div className="p-3 text-center bg-purple-50 rounded-xl sm:p-4">
                            <Package className="w-5 h-5 mx-auto mb-2 text-purple-600 sm:w-6 sm:h-6 sm:mb-2" />
                            <div className="text-xs font-medium text-gray-900 sm:text-sm">Services</div>
                            <div className="text-xs text-gray-600 sm:text-sm">{profile?.servicesCount || "0"}</div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Right Content - Profile Details */}
                  <div className="xl:col-span-2">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
                      {/* Personal Information */}
                      <Card className="border-0 shadow-lg md:col-span-2">
                        <div className="p-4 sm:p-4">
                          <div className="flex items-center mb-6 sm:mb-6">
                            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-2xl sm:w-12 sm:h-12">
                              <User className="w-5 h-5 text-blue-600 sm:w-6 sm:h-6" />
                            </div>
                            <div className="ml-4 sm:ml-4">
                              <h3 className="text-lg font-bold text-gray-900 sm:text-xl">Personal Information</h3>
                              <p className="text-sm text-gray-600 sm:text-base">Basic details and contact information</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
                            {[
                              { icon: User, label: "Full Name", value: profile?.name },
                              { icon: Mail, label: "Email Address", value: profile?.email },
                              { icon: Phone, label: "Phone Number", value: profile?.phone },
                              { 
                                icon: Cake, 
                                label: "Date of Birth", 
                                value: profile?.birthDate ? new Date(profile.birthDate).toLocaleDateString() : undefined 
                              },
                            ].map((item, index) => {
                              const Icon = item.icon;
                              return (
                                <div key={index} className="flex items-start p-4 space-x-4 rounded-xl">
                                  <Icon className="w-5 h-5 mt-0.5 text-gray-400 flex-shrink-0 sm:w-5 sm:h-5" />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-500 sm:text-sm">{item.label}</div>
                                    <div className="text-base font-medium text-gray-900 truncate sm:text-base">
                                      {item.value || "Not provided"}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </Card>

                      {/* Professional Information */}
                      <Card className="border-0 shadow-lg">
                        <div className="p-6 sm:p-6">
                          <div className="flex items-center mb-6 sm:mb-6">
                            <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-2xl sm:w-12 sm:h-12">
                              <Briefcase className="w-5 h-5 text-green-600 sm:w-6 sm:h-6" />
                            </div>
                            <div className="ml-4 sm:ml-4">
                              <h3 className="text-lg font-bold text-gray-900 sm:text-xl">Professional Details</h3>
                              <p className="text-sm text-gray-600 sm:text-base">Your expertise and background</p>
                            </div>
                          </div>

                          <div className="space-y-4 sm:space-y-6">
                            {[
                              { icon: FileText, label: "About Me", value: profile?.aboutMe },
                              { icon: Badge, label: "Expertise", value: profile?.expertise },
                            ].map((item, index) => {
                              const Icon = item.icon;
                              return (
                                <div key={index} className="flex items-start p-4 space-x-4 rounded-xl">
                                  <Icon className="w-5 h-5 mt-0.5 text-gray-400 flex-shrink-0 sm:w-5 sm:h-5" />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-500 sm:text-sm">{item.label}</div>
                                    <div className="text-base font-medium text-gray-900 break-words sm:text-base">
                                      {item.value || "Not provided"}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </Card>

                      {/* Address Information */}
                      <Card className="border-0 shadow-lg">
                        <div className="p-6 sm:p-6">
                          <div className="flex items-center mb-6 sm:mb-6">
                            <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-2xl sm:w-12 sm:h-12">
                              <MapPin className="w-5 h-5 text-purple-600 sm:w-6 sm:h-6" />
                            </div>
                            <div className="ml-4 sm:ml-4">
                              <h3 className="text-lg font-bold text-gray-900 sm:text-xl">Address</h3>
                              <p className="text-sm text-gray-600 sm:text-base">Your location information</p>
                            </div>
                          </div>

                          <div className="flex items-start p-4 space-x-4 rounded-xl">
                            <MapPin className="w-5 h-5 mt-0.5 text-gray-400 flex-shrink-0 sm:w-5 sm:h-5" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-500 sm:text-sm">Address</div>
                              <div className="text-base font-medium text-gray-900 break-words sm:text-base">
                                {profile?.address || "Not provided"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>

                      {/* Company Information - Conditionally Rendered */}
                      {profile?.vendorType === "company" && (
                        <Card className="border-0 shadow-lg md:col-span-2">
                          <div className="p-6 sm:p-6">
                            <div className="flex items-center mb-6 sm:mb-6">
                              <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-2xl sm:w-12 sm:h-12">
                                <Building className="w-5 h-5 text-orange-600 sm:w-6 sm:h-6" />
                              </div>
                              <div className="ml-4 sm:ml-4">
                                <h3 className="text-lg font-bold text-gray-900 sm:text-xl">Company Information</h3>
                                <p className="text-sm text-gray-600 sm:text-base">Business details and contact information</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
                              {[
                                { icon: UserCheck, label: "Contact Person", value: profile?.contactPerson },
                                { 
                                  icon: Globe, 
                                  label: "Google Business Profile", 
                                  value: profile?.googleBusinessProfileLink,
                                  isLink: true 
                                },
                                { 
                                  icon: MapPin, 
                                  label: "Company Address", 
                                  value: profile?.companyAddress,
                                  fullWidth: true 
                                },
                              ].map((item, index) => {
                                const Icon = item.icon;
                                return (
                                  <div key={index} className={`flex items-start p-4 space-x-4 bg-orange-50 rounded-xl ${item.fullWidth ? 'sm:col-span-2' : ''}`}>
                                    <Icon className="w-5 h-5 mt-0.5 text-orange-400 flex-shrink-0 sm:w-5 sm:h-5" />
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium text-gray-500 sm:text-sm">{item.label}</div>
                                      {item.isLink && item.value ? (
                                        <a
                                          href={item.value}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="block text-base font-medium text-blue-600 truncate hover:text-blue-700 sm:text-base"
                                        >
                                          View Profile
                                        </a>
                                      ) : (
                                        <div className="text-base font-medium text-gray-900 break-words sm:text-base">
                                          {item.value || "Not provided"}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </Card>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Services Tab */}
            {activeTab === "services" && (
              <div className="transition-all duration-300 ease-in-out">
                <ProfileServicesOffered />
              </div>
            )}

            {/* Certificates Tab */}
            {activeTab === "certificates" && (
              <div className="transition-all duration-300 ease-in-out">
                <Card className="border-0 shadow-lg">
                  <div className="p-6 sm:p-8">
                    <div className="flex items-center mb-8 sm:mb-8">
                      <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-2xl sm:w-12 sm:h-12">
                        <BadgeCheck className="w-6 h-6 text-purple-600 sm:w-6 sm:h-6" />
                      </div>
                      <div className="ml-4 sm:ml-4">
                        <h3 className="text-2xl font-bold text-gray-900 sm:text-2xl">Certificates & Documents</h3>
                        <p className="text-base text-gray-600 sm:text-base">Manage your professional certifications and licenses</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 sm:gap-6">
                      {/* Police Clearance */}
                      <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-xl sm:p-6">
                        <div className="flex items-center mb-4 sm:mb-4">
                          <FileText className="w-6 h-6 mr-3 text-blue-500 sm:w-6 sm:h-6 sm:mr-3" />
                          <h4 className="text-lg font-semibold text-gray-900 sm:text-lg">Police Clearance</h4>
                        </div>
                        
                        {profile?.policeClearance ? (
                          <div className="space-y-4 sm:space-y-4">
                            <a
                              href={profile.policeClearance}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700 sm:text-sm sm:px-4 sm:py-3"
                            >
                              <LinkIcon className="w-4 h-4 mr-2 sm:w-4 sm:h-4 sm:mr-2" />
                              View Document
                            </a>
                          </div>
                        ) : (
                          <div className="py-4 text-center sm:py-4">
                            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400 sm:w-12 sm:h-12 sm:mb-3" />
                            <p className="mb-4 text-base text-gray-600 sm:text-base">Document not uploaded</p>
                            <Button
                              onClick={() => setIsEditModalOpen(true)}
                              variant="primary"
                              className="w-full text-sm sm:text-sm"
                            >
                              Upload Now
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Business License */}
                      <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-xl sm:p-6">
                        <div className="flex items-center mb-4 sm:mb-4">
                          <Briefcase className="w-6 h-6 mr-3 text-green-500 sm:w-6 sm:h-6 sm:mr-3" />
                          <h4 className="text-lg font-semibold text-gray-900 sm:text-lg">Business License</h4>
                        </div>
                        
                        {profile?.businessLicense ? (
                          <div className="space-y-4 sm:space-y-4">
                            <a
                              href={profile.businessLicense}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700 sm:text-sm sm:px-4 sm:py-3"
                            >
                              <LinkIcon className="w-4 h-4 mr-2 sm:w-4 sm:h-4 sm:mr-2" />
                              View License
                            </a>
                            
                            <div className="space-y-2 text-center sm:space-y-2">
                              <div className="text-sm text-gray-500 sm:text-sm">
                                Expires: {profile?.businessLicenseExpireDate 
                                  ? new Date(profile.businessLicenseExpireDate).toLocaleDateString("en-US", {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })
                                  : 'Not set'
                                }
                              </div>
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium sm:px-3 sm:py-1 sm:text-sm ${
                                profile?.businessLicenseExpireDate && new Date(profile.businessLicenseExpireDate) < new Date()
                                  ? "bg-red-100 text-red-700"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}>
                                {profile?.businessLicenseExpireDate && new Date(profile.businessLicenseExpireDate) < new Date()
                                  ? "Expired"
                                  : "Valid"
                                }
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="py-4 text-center sm:py-4">
                            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400 sm:w-12 sm:h-12 sm:mb-3" />
                            <p className="mb-4 text-base text-gray-600 sm:text-base">License not uploaded</p>
                            <Button
                              onClick={() => setIsEditModalOpen(true)}
                              variant="primary"
                              className="w-full text-sm sm:text-sm"
                            >
                              Upload Now
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Certificate of Expertise */}
                      <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-xl sm:p-6">
                        <div className="flex items-center mb-4 sm:mb-4">
                          <BadgeCheck className="w-6 h-6 mr-3 text-purple-500 sm:w-6 sm:h-6 sm:mr-3" />
                          <h4 className="text-lg font-semibold text-gray-900 sm:text-lg">Expertise Certificate</h4>
                        </div>
                        
                        {profile?.certificateOfExpertise ? (
                          <div className="space-y-4 sm:space-y-4">
                            <a
                              href={profile.certificateOfExpertise}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700 sm:text-sm sm:px-4 sm:py-3"
                            >
                              <LinkIcon className="w-4 h-4 mr-2 sm:w-4 sm:h-4 sm:mr-2" />
                              View Certificate
                            </a>
                            
                            <div className="space-y-2 text-center sm:space-y-2">
                              <div className="text-sm text-gray-500 sm:text-sm">
                                Expires: {profile?.certificateOfExpertiseExpireDate 
                                  ? new Date(profile.certificateOfExpertiseExpireDate).toLocaleDateString("en-US", {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })
                                  : 'Not set'
                                }
                              </div>
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium sm:px-3 sm:py-1 sm:text-sm ${
                                profile?.certificateOfExpertiseExpireDate && new Date(profile.certificateOfExpertiseExpireDate) < new Date()
                                  ? "bg-red-100 text-red-700"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}>
                                {profile?.certificateOfExpertiseExpireDate && new Date(profile.certificateOfExpertiseExpireDate) < new Date()
                                  ? "Expired"
                                  : "Valid"
                                }
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="py-4 text-center sm:py-4">
                            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400 sm:w-12 sm:h-12 sm:mb-3" />
                            <p className="mb-4 text-base text-gray-600 sm:text-base">Certificate not uploaded</p>
                            <Button
                              onClick={() => setIsEditModalOpen(true)}
                              variant="primary"
                              className="w-full text-sm sm:text-sm"
                            >
                              Upload Now
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <ProfileEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profile={profile}
        onProfileUpdate={handleProfileUpdate}
      />
    </>
  );
};

export default Profile;
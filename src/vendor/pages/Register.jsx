import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useVendorAuth } from "../contexts/VendorAuthContext";
import { toast } from "sonner";
import Button from "../../shared/components/Button/Button";
import IconButton from "../../shared/components/Button/IconButton";
import { FormInput, FormSelect } from "../../shared/components/Form";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Loader,
  Lock,
  Mail,
  Phone,
  User,
} from "lucide-react";
import api from "../../lib/axiosConfig";
import LoadingSpinner from "../../shared/components/LoadingSpinner";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useVendorAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [serviceLoading, setServiceLoading] = useState(false);
  const [citiesLoading, setCitiesLoading] = useState(false);

  // Set individual as default and comment vendor type selection
  const [vendorType, setVendorType] = useState("individual");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [googleBusinessLink, setGoogleBusinessLink] = useState("");
  const [resume, setResume] = useState(null);
  const [aboutme, setAboutme] = useState("");

  const [showPwd, setShowPwd] = useState(false);

  const [serviceCategories, setServiceCategories] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);

  // City selection (global for this vendor)
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState("");

  const expertiseOptions = [
    "Hairstylist",
    "Nail technician",
    "Makeup artist",
    "Aesthetician/Esthetician",
  ];

  const [expertise, setExpertise] = useState("");

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isValidPhone = (phone) =>
    /^(\+?\d{1,4}[\s-])?(?!0+\s*,?$)\d{10,14}$/.test(phone.trim());

  const isValidPwd = (password) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
      password
    );
  // Load service categories when entering step 2 or 3
  useEffect(() => {
    if (step === 2 || step === 3) {
      loadServices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Load cities when entering step 2
  useEffect(() => {
    if (step === 1) {
      loadCities();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // --- New API loader (vendor services with packages) ---
  const loadServices = async () => {
    try {
      setServiceLoading(true);
      const response = await api.get("/api/vendor/serviceswithpackages", {
        // data: { serviceLocation: selectedCity },
        params: { serviceLocation: selectedCity },
      });
      setServiceCategories(response.data.services || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load services");
    } finally {
      setServiceLoading(false);
    }
  };

  // --- Load cities for selection ---
  const loadCities = async () => {
    try {
      setCitiesLoading(true);
      // adjust endpoint as your backend provides
      const response = await api.get("/api/service/getcity");
      // console.log(response.data.city);
      // Expecting response.data.cities = [{ id, name }] or similar
      setCities(response.data.city || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load cities");
    } finally {
      setCitiesLoading(false);
    }
  };

  const handleNextStep = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep(step + 1);
  };

  const handlePrevStep = () => setStep(step - 1);

  const validateStep1 = () => {
    if (!vendorType) {
      toast.error("Please select vendor type");
      return false;
    }
    if (vendorType === "individual") {
      if (!name || !email || !phone || !password || !aboutme) {
        toast.error("Please fill all required fields");
        return false;
      }
      if (!isValidEmail(email)) {
        toast.error("Please enter a valid email");
        return false;
      }
      if (!isValidPhone(phone)) {
        if (phone.length < 10 || phone.length > 14) {
          toast.error("Phone number must be between 10 and 14 digits long");
        } else {
          toast.error("Please enter a valid phone number");
        }
        return false;
      }
      if (!isValidPwd(password)) {
        if (password.length < 8) {
          toast.error("Password must be at least 8 characters long");
        } else {
          toast.error(
            "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
          );
        }
        return false;
      }
    } else if (vendorType === "company") {
      if (
        !companyName ||
        !contactPerson ||
        !companyEmail ||
        !companyPhone ||
        !companyAddress
      ) {
        toast.error("Please fill all required fields");
        return false;
      }
      if (!isValidEmail(companyEmail)) {
        toast.error("Please enter a valid company email address");
        return false;
      }
      if (!isValidPhone(companyPhone)) {
        if (companyPhone.length < 10 || companyPhone.length > 14) {
          toast.error("Phone number must be between 10 and 14 digits long");
        } else {
          toast.error("Please enter a valid company phone number");
        }
        return false;
      }
    }
    if (!expertise) {
      toast.error("Please select your expertise");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    // Make sure at least one sub-package is selected
    if (!selectedServices || selectedServices.length === 0) {
      toast.error("Please select at least one item from packages");
      return false;
    }

    // Ensure city is selected
    if (!selectedCity || selectedCity.toString().trim() === "") {
      toast.error("Please select your service city");
      return false;
    }

    // Ensure each selected package has at least one sub_package
    for (const pkg of selectedServices) {
      if (!pkg.sub_packages || pkg.sub_packages.length === 0) {
        toast.error(
          "Each selected package must have at least one sub-package selected"
        );
        return false;
      }
    }
    return true;
  };

  // If package entry doesn't exist, create it.
  const toggleSubPackage = (packageId, itemId) => {
    setSelectedServices((prev) => {
      const next = JSON.parse(JSON.stringify(prev || []));
      const pkgIndex = next.findIndex((p) => p.package_id === packageId);

      if (pkgIndex === -1) {
        // add new package with the selected sub_package
        return [
          ...next,
          {
            package_id: packageId,
            sub_packages: [{ item_id: itemId }],
          },
        ];
      } else {
        const pkg = next[pkgIndex];
        const subIndex = pkg.sub_packages.findIndex(
          (s) => s.item_id === itemId
        );
        if (subIndex === -1) {
          // add sub-package
          pkg.sub_packages.push({ item_id: itemId });
        } else {
          pkg.sub_packages.splice(subIndex, 1);
          // if no more sub_packages, remove the package entirely
          if (pkg.sub_packages.length === 0) {
            next.splice(pkgIndex, 1);
          }
        }
        return next;
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;

    const formData = new FormData();
    formData.append("vendorType", vendorType);
    formData.append("confirmation", "true");

    if (vendorType === "individual") {
      formData.append("name", name);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("password", password);
      formData.append("aboutme", aboutme);
      formData.append("expertise", expertise);
      if (resume) formData.append("resume", resume);
    } else {
      formData.append("companyName", companyName);
      formData.append("contactPerson", contactPerson);
      formData.append("companyEmail", companyEmail);
      formData.append("companyPhone", companyPhone);
      formData.append("companyAddress", companyAddress);
      formData.append("googleBusinessProfileLink", googleBusinessLink);
    }

    // include selected city (global)
    formData.append("serviceLocation", selectedCity);

    // append selected packages (no serviceLocation)
    formData.append("packages", JSON.stringify(selectedServices));

    setLoading(true);
    try {
      const result = await register(formData);
      if (result.success) {
        toast.success(
          "Registration successful! Please wait for admin approval."
        );
        navigate("/login");
        localStorage.removeItem(LOCAL_KEY);
      } else {
        toast.error(result.error || "Registration failed");
        localStorage.removeItem(LOCAL_KEY);
      }
    } catch (error) {
      console.error(error);
      localStorage.removeItem(LOCAL_KEY);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const LOCAL_KEY = "vendor_register_form";
  useEffect(() => {
    const savedData = localStorage.getItem(LOCAL_KEY);
    if (savedData) {
      const data = JSON.parse(savedData);
      setStep(data.step);
      setVendorType(data.vendorType);
      setAboutme(data.aboutme);
      setExpertise(data.expertise);
      setResume(data.resume);
      setCompanyAddress(data.companyAddress);
      setCompanyEmail(data.companyEmail);
      setCompanyName(data.companyName);
      setCompanyPhone(data.companyPhone);
      setContactPerson(data.contactPerson);
      setGoogleBusinessLink(data.googleBusinessLink);
      setSelectedCity(data.selectedCity);
      setSelectedServices(data.selectedServices);
      setPhone(data.phone);
      setEmail(data.email);
      setName(data.name);
      setPassword(data.password);
    }
  }, []);

  const saveForm = () => {
    const data = {
      step,
      vendorType,
      aboutme,
      expertise,
      resume,
      companyAddress,
      companyEmail,
      companyName,
      companyPhone,
      contactPerson,
      googleBusinessLink,
      selectedCity,
      selectedServices,
      phone,
      email,
      name,
      password,
    };
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
  };

  useEffect(() => {
    saveForm();
  }, [
    vendorType,
    name,
    email,
    phone,
    password,
    companyName,
    contactPerson,
    companyEmail,
    companyPhone,
    companyAddress,
    googleBusinessLink,
    aboutme,
    expertise,
    selectedCity,
    selectedServices,
  ]);

  useEffect(() => {
    if (!phone) {
      setPhone("+1 ");
    }
  }, []);

  const handlePhoneChange = (e) => {
    let value = e.target.value;
    if (!value.startsWith("+1")) {
      value = "+1 " + value.replace(/^\+?1?\s?/, "");
    }
    setPhone(value);
  };

  return (
    <div className="">
      {/* Top Black Header with Logo */}
      <div className="bg-black">
        <div className="flex px-5 py-2">
          <img
            className="object-contain w-40 h-16"
            src="/homiqly-logo-white.png"
            alt="logo"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl px-4 py-8 mx-auto">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Professional Panel Registration
          </h1>
          <p className="text-lg text-gray-600">
            Join our platform and grow your business
          </p>
        </div>

        <div className="">
          <div className="">
            {/* Stepper */}
            <nav className="flex items-center justify-center mb-8">
              {["Basic Info", "Services", "Confirm"].map((label, idx) => {
                const active = step === idx + 1;
                const complete = step > idx + 1;
                return (
                  <div
                    key={label}
                    className="relative flex flex-col items-center flex-1"
                  >
                    <div
                      className={`w-10 h-10 flex items-center justify-center rounded-full border-2 
                      ${
                        complete
                          ? "bg-black text-white"
                          : active
                          ? "bg-black  text-white"
                          : "border-gray-200 text-gray-400 bg-gray-50"
                      }
                      shadow`}
                    >
                      {complete ? (
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path
                            d="M4 11l5 5 9-9"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                          />
                        </svg>
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <span
                      className={`mt-3 text-base font-medium 
                    ${
                      active
                        ? "text-black"
                        : complete
                        ? "text-black"
                        : "text-gray-400"
                    }`}
                    >
                      {label}
                    </span>
                    {idx < 2 && (
                      <span className="absolute top-5 left-full w-16 h-0.5 bg-gray-200"></span>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Step 1: Basic Info */}
            {step === 1 && (
              <form className="space-y-8 transition-all">
                {/* Vendor Type Selection - Commented out but kept in code */}
                {/* <div className="mb-8">
                  <FormSelect
                    label="Vendor Type"
                    value={vendorType}
                    onChange={(e) => setVendorType(e.target.value)}
                    placeholder="Select Vendor Type"
                    options={[
                      { value: "individual", label: "Individual" },
                      { value: "company", label: "Company" },
                    ]}
                    required
                  />
                </div> */}

                {vendorType === "individual" && (
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <FormInput
                      id="name"
                      icon={<User />}
                      label="Full Name*"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      autoComplete="name"
                      variant="black"
                      required
                    />
                    <FormInput
                      id="email"
                      icon={<Mail />}
                      label="Email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@example.com"
                      autoComplete="email"
                      variant="black"
                      required
                    />
                    <FormInput
                      id="phone"
                      icon={<Phone />}
                      label="Phone"
                      type="tel"
                      value={phone}
                      maxLength={15}
                      onChange={handlePhoneChange}
                      placeholder="+1 9876543210"
                      autoComplete="tel"
                      numbersOnly={true}
                      inputMode="numeric"
                      variant="black"
                      required
                    />
                    <FormInput
                      id="password"
                      icon={<Lock />}
                      label="Password"
                      type={showPwd ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      rightIcon={
                        <IconButton
                          onClick={() => setShowPwd(!showPwd)}
                          variant="transparent"
                          size="xs"
                          icon={showPwd ? <Eye /> : <EyeOff />}
                        />
                      }
                      variant="black"
                      required
                    />
                    <FormSelect
                      id="expertise"
                      label="Expertise"
                      name="expertise"
                      variant="black"
                      value={expertise}
                      onChange={(e) => setExpertise(e.target.value)}
                      options={expertiseOptions.map((opt) => ({
                        label: opt,
                        value: opt,
                      }))}
                      required
                    />

                    {citiesLoading ? (
                      <div className="flex items-center gap-2 py-3 text-black">
                        <LoadingSpinner text="Loading cities..." />
                      </div>
                    ) : (
                      <FormSelect
                        label="Service City"
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        variant="black"
                        placeholder="Select your city"
                        options={cities.map((c) => ({
                          value: c.serviceCity,
                          label: c.serviceCity,
                        }))}
                        required
                      />
                    )}
                    <div className="grid grid-cols-1 gap-6 md:col-span-2 sm:grid-cols-2">
                      <FormInput
                        id="resume"
                        label="Resume (PDF)"
                        type="file"
                        accept=".pdf"
                        variant="black"
                        onChange={(e) => setResume(e.target.files?.[0] || null)}
                      />
                      <FormInput
                        id="aboutme"
                        label="About Me"
                        value={aboutme}
                        onChange={(e) => setAboutme(e.target.value)}
                        placeholder="Tell us about yourself and your experience"
                        maxLength={100}
                        variant="black"
                        required
                        autoComplete="aboutme"
                      />
                    </div>
                  </div>
                )}
                {vendorType === "company" && (
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <FormInput
                      id="companyName"
                      label="Company Name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                      placeholder="ABC Company"
                    />
                    <FormInput
                      id="contactPerson"
                      label="Contact Person"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      required
                      placeholder="John Doe"
                    />
                    <FormInput
                      id="companyEmail"
                      label="Company Email"
                      type="email"
                      value={companyEmail}
                      onChange={(e) => setCompanyEmail(e.target.value)}
                      required
                      placeholder="info@company.com"
                    />
                    <FormInput
                      id="companyPhone"
                      label="Company Phone"
                      type="tel"
                      value={companyPhone}
                      onChange={(e) => setCompanyPhone(e.target.value)}
                      required
                      placeholder="+91 9876543210"
                    />
                    <div className="md:col-span-2">
                      <FormInput
                        label="Company Address"
                        id="companyAddress"
                        value={companyAddress}
                        onChange={(e) => setCompanyAddress(e.target.value)}
                        required
                        placeholder="123 Business Street, City, State, Zip"
                      />
                    </div>
                    <FormInput
                      id="googleBusinessLink"
                      label="Google Business Profile Link"
                      value={googleBusinessLink}
                      onChange={(e) => setGoogleBusinessLink(e.target.value)}
                      placeholder="https://business.google.com/..."
                    />
                  </div>
                )}
                <div className="flex justify-end pt-6">
                  <Button
                    variant="black"
                    size="lg"
                    className="px-8 shadow rounded-xl"
                    onClick={handleNextStep}
                    type="button"
                  >
                    Next <ArrowRight className="ml-2" />
                  </Button>
                </div>
              </form>
            )}

            {/* Step 2: Packages & City */}
            {step === 2 && (
              <div>
                <h2 className="mb-6 text-2xl font-bold text-gray-800">
                  Select Packages
                </h2>

                {serviceLoading ? (
                  <div className="flex justify-center py-12">
                    <LoadingSpinner text="Loading services..." />
                  </div>
                ) : (
                  <div className="grid gap-8 overflow-y-auto max-h-[500px] pr-4">
                    {serviceCategories.map((category) => (
                      <section
                        key={category.serviceCategoryId}
                        className="p-6 border-2 border-gray-200 rounded-xl bg-gray-50"
                      >
                        <h3 className="mb-4 text-xl font-bold text-gray-800">
                          {category.categoryName}
                        </h3>
                        {category.services.map((service) => (
                          <div key={service.serviceId} className="mb-4 ml-2">
                            <h4 className="mb-3 text-lg font-semibold text-gray-700">
                              {service.title}
                            </h4>
                            {Array.isArray(service.packages) &&
                              service.packages.map((pkg) => {
                                const pkgSelected = selectedServices.find(
                                  (p) => p.package_id === pkg.package_id
                                );
                                return (
                                  <div
                                    key={pkg.package_id}
                                    className="pb-4 pl-6 mt-3 ml-4 border-l-2 border-black"
                                  >
                                    <p className="mb-2 text-base font-semibold text-gray-600">
                                      {pkg.packageName}
                                    </p>
                                    <div className="flex flex-wrap gap-4">
                                      {Array.isArray(pkg.sub_packages) &&
                                        pkg.sub_packages.map((sub) => {
                                          const isChecked = !!(
                                            pkgSelected &&
                                            pkgSelected.sub_packages.some(
                                              (s) => s.item_id === sub.item_id
                                            )
                                          );
                                          return (
                                            <label
                                              key={sub.item_id}
                                              className="flex items-center rounded-lg px-4 py-2 bg-white border-2 cursor-pointer text-base shadow transition-colors hover:bg-black/10 min-w-[120px]"
                                            >
                                              <input
                                                type="checkbox"
                                                className="w-4 h-4 mr-3 accent-black"
                                                checked={isChecked}
                                                onChange={() =>
                                                  toggleSubPackage(
                                                    pkg.package_id,
                                                    sub.item_id
                                                  )
                                                }
                                              />
                                              {sub.itemName}
                                            </label>
                                          );
                                        })}
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        ))}
                      </section>
                    ))}
                  </div>
                )}
                <div className="flex justify-between gap-4 pt-12">
                  <Button
                    variant="white"
                    onClick={handlePrevStep}
                    type="button"
                    className="px-6 rounded-lg shadow"
                  >
                    <ArrowLeft className="mr-2" /> Previous
                  </Button>

                  <Button
                    variant="black"
                    className="px-8 shadow rounded-xl"
                    size="lg"
                    onClick={handleNextStep}
                    type="button"
                  >
                    Next <ArrowRight className="ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && (
              <div className="space-y-10">
                <h2 className="mb-6 text-3xl font-bold text-gray-900">
                  Confirm Registration
                </h2>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                  {/* left: Vendor basic info card */}
                  <div className="p-8 bg-white border border-gray-200 shadow lg:col-span-2 rounded-2xl">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">
                          Vendor Information
                        </h3>
                        <p className="mt-2 text-gray-500">
                          Check your details before submitting. You can go back
                          to edit.
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-4 py-2 text-sm font-medium text-black rounded-full bg-black/10">
                          {vendorType === "individual"
                            ? "Individual"
                            : "Company"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 mt-8 md:grid-cols-2">
                      {vendorType === "individual" ? (
                        <>
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-500">
                              Full name
                            </p>
                            <p className="text-lg font-semibold text-gray-800">
                              {name}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-500">
                              Email
                            </p>
                            <p className="text-lg font-semibold text-gray-800">
                              {email}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-500">
                              Phone
                            </p>
                            <p className="text-lg font-semibold text-gray-800">
                              {phone}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-500">
                              Expertise
                            </p>
                            <p className="text-lg font-semibold text-gray-800">
                              {expertise}
                            </p>
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <p className="text-sm font-medium text-gray-500">
                              About Me
                            </p>
                            <p className="p-4 text-base text-gray-700 rounded-lg bg-gray-50">
                              {aboutme}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-500">
                              Resume
                            </p>
                            <div className="flex items-center gap-3">
                              <p className="text-base text-gray-700">
                                {resume ? resume.name : "Not provided"}
                              </p>
                              {resume ? (
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-white border rounded-lg hover:bg-gray-50"
                                  onClick={() => {
                                    toast.info(
                                      "Resume preview/download not implemented"
                                    );
                                  }}
                                >
                                  View
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-500">
                              Company
                            </p>
                            <p className="text-lg font-semibold text-gray-800">
                              {companyName}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-500">
                              Contact Person
                            </p>
                            <p className="text-lg font-semibold text-gray-800">
                              {contactPerson}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-500">
                              Company Email
                            </p>
                            <p className="text-lg font-semibold text-gray-800">
                              {companyEmail}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-500">
                              Company Phone
                            </p>
                            <p className="text-lg font-semibold text-gray-800">
                              {companyPhone}
                            </p>
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <p className="text-sm font-medium text-gray-500">
                              Address
                            </p>
                            <p className="p-4 text-base text-gray-700 rounded-lg bg-gray-50">
                              {companyAddress}
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Selected City */}
                    <div className="p-6 mt-8 bg-gray-50 rounded-xl">
                      <h4 className="mb-3 text-lg font-semibold text-gray-800">
                        Service City
                      </h4>
                      <div className="inline-flex items-center gap-4 px-6 py-4 bg-white border border-gray-200 rounded-lg">
                        <svg
                          className="w-6 h-6 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 11c1.657 0 3-1.343 3-3S13.657 5 12 5s-3 1.343-3 3 1.343 3 3 3z"
                          />
                          <path
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 21s7-4.5 7-10a7 7 0 10-14 0c0 5.5 7 10 7 10z"
                          />
                        </svg>
                        <div>
                          <p className="text-lg font-semibold text-gray-800">
                            {(() => {
                              const cityObj =
                                cities.find(
                                  (c) =>
                                    (c.service_city_id ??
                                      c.serviceCity ??
                                      c.id ??
                                      c.name) === selectedCity ||
                                    c.service_city_id === selectedCity
                                ) || null;
                              return cityObj
                                ? cityObj.serviceCity ??
                                    cityObj.name ??
                                    cityObj.cityName ??
                                    selectedCity
                                : selectedCity || "Not selected";
                            })()}
                          </p>
                          <p className="text-sm text-gray-500">
                            City where you'll provide services
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Packages summary */}
                    <div className="mt-8">
                      <h4 className="mb-4 text-lg font-semibold text-gray-800">
                        Selected Packages
                      </h4>
                      <div className="space-y-4">
                        {selectedServices.length === 0 ? (
                          <p className="p-4 text-base text-gray-500 rounded-lg bg-gray-50">
                            No packages selected
                          </p>
                        ) : (
                          selectedServices.map((pkg) => {
                            const pkgDetails = serviceCategories
                              .flatMap((c) => c.services || [])
                              .flatMap((s) => s.packages || [])
                              .find((p) => p.package_id === pkg.package_id);

                            return (
                              <div
                                key={pkg.package_id}
                                className="p-6 bg-white border border-gray-200 shadow-sm rounded-xl"
                              >
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="text-lg font-bold text-gray-800">
                                      {pkgDetails?.packageName ||
                                        `Package ID: ${pkg.package_id}`}
                                    </p>
                                    <p className="mt-1 text-gray-500">
                                      {pkgDetails?.description ||
                                      pkgDetails?.packageName
                                        ? ""
                                        : "No description available"}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center px-3 py-1 text-sm text-black rounded-md bg-black/10">
                                      {pkg.sub_packages.length} items
                                    </span>
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-3 mt-4">
                                  {pkg.sub_packages.map((sub) => {
                                    const subDetails =
                                      pkgDetails?.sub_packages?.find(
                                        (s) => s.item_id === sub.item_id
                                      );
                                    return (
                                      <span
                                        key={sub.item_id}
                                        className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-full"
                                      >
                                        {subDetails?.itemName ||
                                          `Item ${sub.item_id}`}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>

                  {/* right: Summary & actions card */}
                  <div className="space-y-6">
                    <div className="p-6 border border-gray-200 bg-gray-50 rounded-xl">
                      <h4 className="mb-4 text-lg font-semibold text-gray-800">
                        Registration Summary
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Vendor Type:</span>
                          <span className="font-semibold capitalize">
                            {vendorType}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Services:</span>
                          <span className="font-semibold">
                            {selectedServices.length} packages
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">City:</span>
                          <span className="font-semibold">
                            {cities.find((c) => c.serviceCity === selectedCity)
                              ?.serviceCity || selectedCity}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-center">
                      <p className="mb-6 text-sm text-gray-500">
                        By completing registration, you agree to our terms and
                        conditions. <br />
                        Admin will verify your details before activation.
                      </p>

                      <div className="space-y-4">
                        <Button
                          type="button"
                          variant="black"
                          onClick={handleSubmit}
                          disabled={loading}
                          className="w-full py-3 text-lg"
                        >
                          {loading ? (
                            <>
                              <Loader className="w-5 h-5 animate-spin" />{" "}
                              Registering...
                            </>
                          ) : (
                            "Complete Registration"
                          )}
                        </Button>

                        <Button
                          variant="white"
                          type="button"
                          onClick={handlePrevStep}
                          className="w-full"
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Back to Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Already have account */}
            <p className="mt-12 text-center text-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-lg font-semibold text-black hover:underline"
              >
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

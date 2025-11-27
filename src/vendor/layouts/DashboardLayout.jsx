import React, { useState, useEffect, useMemo } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useVendorAuth } from "../contexts/VendorAuthContext";
import { HeaderMenu } from "../../shared/components/Header";
import NotificationIcon from "../components/NotificationIcon";
import api from "../../lib/axiosConfig"; // ✅ your axios instance
import {
  Calendar,
  CreditCard,
  HelpCircle,
  Home,
  Menu as MenuIcon,
  ShoppingBag,
  Star,
  User,
  X,
  LogOut,
} from "lucide-react";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import { IconButton } from "../../shared/components/Button";
import Loader from "../../components/Loader";

/* small clsx helper */
const clsx = (...parts) => parts.filter(Boolean).join(" ");

/* Sidebar item component (keeps markup concise) */
const SidebarItem = ({ item, collapsed, pathname, onNavigate }) => {
  const active = pathname === item.path;

  return (
    <li>
      <Link
        to={item.path}
        onClick={onNavigate}
        title={collapsed ? item.name : ""}
        className={clsx(
          "flex items-center py-3 text-sm font-medium rounded-md transition-colors duration-200",
          collapsed ? "justify-center px-2" : "px-4",
          active
            ? "bg-primary-light/15 text-primary border-r-2 border-primary"
            : "text-text-muted hover:bg-backgroundTertiary/50 hover:text-text-primary"
        )}
      >
        <span className={clsx(
          "flex-shrink-0",
          collapsed ? "" : "mr-3"
        )}>
          {item.icon}
        </span>
        {!collapsed && (
          <span className="text-sm truncate">{item.name}</span>
        )}
      </Link>
    </li>
  );
};

const DashboardLayout = () => {
  const { currentUser, logout } = useVendorAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // desktop collapse
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [vendorType, setVendorType] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // ✅ Fetch vendor profile
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/vendor/getprofile");
      const profile = res?.data?.profile;
      setVendorType(profile?.vendorType ?? null);
    } catch (error) {
      console.error("Failed to fetch profile", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    closeMobileMenu();
  }, [location.pathname]);

  // ✅ Sidebar menu items
  const menuItems = useMemo(
    () => [
      {
        path: "/dashboard",
        name: "Dashboard",
        icon: <Home className="w-5 h-5" />,
      },
      {
        path: "/calendar",
        name: "Calendar",
        icon: <Calendar className="w-5 h-5" />,
      },
      {
        path: "/profile",
        name: "Profile",
        icon: <User className="w-5 h-5" />,
      },
      {
        path: "/services",
        name: "Apply for Services",
        icon: <ShoppingBag className="w-5 h-5" />,
      },
      {
        path: "/bookings",
        name: "Bookings",
        icon: <ShoppingBag className="w-5 h-5" />,
      },
      // { path: "/supply-kits", name: "Supply Kits", icon: <FiBox className="w-5 h-5" /> },

      ...(vendorType !== "individual"
        ? [
            {
              path: "/employees",
              name: "Employees",
              icon: <User className="w-5 h-5" />,
            },
          ]
        : []),

      {
        path: "/payments",
        name: "Payments",
        icon: <CreditCard className="w-5 h-5" />,
      },
      {
        path: "/ratings",
        name: "Ratings",
        icon: <Star className="w-5 h-5" />,
      },
      {
        path: "/support",
        name: "Support",
        icon: <HelpCircle className="w-5 h-5" />,
      },
      {
        path: "/accountdetails",
        name: "Bank account details",
        icon: <CreditCard className="w-5 h-5" />,
      },
    ],
    [vendorType]
  );

  // Toggle sidebar
  const toggleSidebar = () => setSidebarCollapsed((s) => !s);

  // Toggle mobile menu
  const toggleMobileMenu = () => setMobileMenuOpen((s) => !s);

  // Close mobile menu
  const closeMobileMenu = () => setMobileMenuOpen(false);

  // responsive widths
  const sidebarWidth = useMemo(
    () => (sidebarCollapsed ? 64 : 240),
    [sidebarCollapsed]
  );

  if (loading) return <Loader />;

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          "bg-white text-text-primary fixed inset-y-0 left-0 transform transition-all duration-300 ease-in-out z-50 lg:static lg:inset-0 lg:z-auto border-r border-gray-200 shadow-sm lg:shadow-none",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        style={{ width: sidebarWidth, minWidth: sidebarWidth }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div
            className={clsx(
              "px-4 py-4 border-b border-gray-200 flex items-center",
              sidebarCollapsed ? "justify-center" : "justify-between"
            )}
          >
            {!sidebarCollapsed ? (
              <>
                <Link to="/" onClick={closeMobileMenu} className="">
                  <img
                    src="/logo/homiqly-professional.png"
                    alt="Homiqly-Professional"
                    className="w-auto "
                  />
                </Link>
                
                {/* Close button for mobile - only show on mobile and position properly */}
                <button
                  onClick={closeMobileMenu}
                  className="text-gray-500 transition-colors lg:hidden hover:text-gray-700"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </>
            ) : (
              // Show logo in collapsed state
              <Link to="/" onClick={closeMobileMenu} className="">
                <img
                  src="/favicon.ico"
                  alt="Homiqly-Professional"
                  className="w-auto"
                />
              </Link>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 overflow-y-auto">
            <ul className="space-y-1">
              {menuItems.map((item) => (
                <SidebarItem
                  key={item.path}
                  item={item}
                  collapsed={sidebarCollapsed}
                  pathname={location.pathname}
                  onNavigate={closeMobileMenu}
                />
              ))}
            </ul>
          </nav>

          {/* Logout Button */}
          {/* <div className={clsx(
            "p-3 border-t border-gray-200",
            sidebarCollapsed ? "px-2" : "px-3"
          )}>
            <button
              onClick={handleLogout}
              className={clsx(
                "w-full flex items-center py-2 px-3 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 transition-colors duration-200 border border-red-200",
                sidebarCollapsed ? "justify-center" : "justify-start"
              )}
            >
              <span className={clsx(!sidebarCollapsed && "mr-3")}>
                <LogOut className="w-4 h-4" />
              </span>
              {!sidebarCollapsed && "Logout"}
            </button>
          </div> */}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="z-10 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <div className="flex items-center space-x-3">
              {/* Mobile menu toggle */}
              <button
                onClick={toggleMobileMenu}
                className="p-1.5 text-gray-500 transition-colors rounded-md lg:hidden hover:text-gray-700 hover:bg-gray-100"
                aria-label="Toggle menu"
              >
                <MenuIcon className="w-5 h-5" />
              </button>

              {/* Desktop sidebar toggle */}
              <IconButton
                icon={<MenuIcon className="w-5 h-5" />}
                onClick={toggleSidebar}
                aria-label={
                  sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
                }
                className="hidden lg:flex"
              />

            </div>

            <div className="flex items-center space-x-3">
              <div className="hidden sm:block">
                <HeaderMenu
                  userName={currentUser?.name || "Vendor User"}
                  userRole={currentUser?.vendor_type || "vendor"}
                  onLogout={handleLogout}
                  profilePath="/profile"
                  settingsPath="/settings"
                />
              </div>
              <div className="sm:hidden">
                {/* Simplified mobile header menu */}
                <HeaderMenu
                  userName={currentUser?.name?.charAt(0) || "V"}
                  userRole={currentUser?.vendor_type || "vendor"}
                  onLogout={handleLogout}
                  profilePath="/profile"
                  settingsPath="/settings"
                  isMobile={true}
                />
              </div>
              <NotificationIcon />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
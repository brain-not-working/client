import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Routes
import AdminRoutes from "./admin/routes/AdminRoutes";
import VendorRoutes from "./vendor/routes/VendorRoutes";
import EmployeesRoutes from "./employees/routes/EmployeesRoutes";

// Auth Providers
import { AdminAuthProvider } from "./admin/contexts/AdminAuthContext";
import { VendorAuthProvider } from "./vendor/contexts/VendorAuthContext";
import { EmployeesAuthProvider } from "./employees/contexts/EmployeesAuthContext";
import { Toaster } from "sonner";

function App() {
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";
  const port = typeof window !== "undefined" ? window.location.port : "";

  // env-controlled (set VITE_SITE to 'auto', 'professionals' or 'central')
  const SITE = import.meta.env.VITE_SITE || "auto";
  const PROFESSIONALS_HOST =
    import.meta.env.VITE_PROFESSIONALS_HOST || "professionals.homiqly.com";
  const CENTRAL_HOST =
    import.meta.env.VITE_CENTRAL_HOST || "central.homiqly.com";

  // resolvedSite either "professionals" | "central" | null
  let resolvedSite = null;
  if (SITE === "professionals" || SITE === "central") {
    resolvedSite = SITE;
  } else {
    // auto-detect by hostname
    if (hostname.includes(PROFESSIONALS_HOST)) resolvedSite = "professionals";
    else if (hostname.includes(CENTRAL_HOST)) resolvedSite = "central";
    // if hostname is localhost, resolvedSite stays null unless forced via VITE_SITE
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      if (port === "3030") resolvedSite = "central";
      else if (port === "3031") resolvedSite = "professionals";
    }
  }

  return (
    <Router>
      <Routes>
        {resolvedSite === "central" && (
          <Route
            path="/*"
            element={
              <AdminAuthProvider>
                <AdminRoutes />
              </AdminAuthProvider>
            }
          />
        )}

        {resolvedSite === "professionals" && (
          <Route
            path="/*"
            element={
              <VendorAuthProvider>
                <VendorRoutes />
              </VendorAuthProvider>
            }
          />
        )}

        {/* If nothing matched (e.g. localhost + auto), you can either show a selector or mount a default */}
        {/* {resolvedSite === null && (
          <>
            <Route
              path="/"
              element={
                <div>
                  Select site: set REACT_APP_SITE in .env or use /vendor or
                  /admin
                </div>
              }
            />
            <Route
              path="/vendor/*"
              element={
                <VendorAuthProvider>
                  <VendorRoutes />
                </VendorAuthProvider>
              }
            />
            <Route
              path="/admin/*"
              element={
                <AdminAuthProvider>
                  <AdminRoutes />
                </AdminAuthProvider>
              }
            />
          </>
        )} */}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toaster richColors position="top-right" />
    </Router>
  );
}

export default App;

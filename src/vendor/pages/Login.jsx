import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useVendorAuth } from "../contexts/VendorAuthContext";
import { toast } from "sonner";
import { Loader, Lock, Mail, Eye, EyeOff } from "lucide-react";
import { FormInput } from "../../shared/components/Form";
import { Button } from "../../shared/components/Button";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);
  const [showPwd, setShowPwd] = useState(false);

  const { login } = useVendorAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setLoading(true);

    try {
      const result = await login(email, password, remember);

      if (result.success) {
        toast.success("Login successful!");
        navigate("/dashboard");
      } else {
        toast.error(result.error || "Login failed");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">

      {/* Header */}
      <div className="bg-black">
        <div className="flex px-6 py-4">
          <img
            className="w-auto h-8 cursor-pointer"
            src="/homiqly-logo-white.png"
            alt="logo"
            onClick={() => navigate("/")}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center flex-1 px-6 py-8">
        <div className="w-full max-w-[367px]">

          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900">Professional Login</h1>
            <p className="mt-2 text-lg text-gray-600">
              Access your professional panel
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Email Input */}
            <FormInput
              icon={<Mail className="w-4 h-4" />}
              label="Email"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vendor@example.com"
              variant="black"
            />

            {/* Password Input with Show/Hide Icon */}
            <FormInput
              icon={<Lock className="w-4 h-4" />}
              label="Password"
              id="password"
              name="password"
              type={showPwd ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              variant="black"
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPwd((prev) => !prev)}
                  className="focus:outline-none"
                >
                  {showPwd ? (
                    <EyeOff className="w-4 h-4 text-black" />
                  ) : (
                    <Eye className="w-4 h-4 text-black" />
                  )}
                </button>
              }
            />

            {/* Remember Me + Forgot Link */}
            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black accent-black"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span className="text-sm text-gray-700">Stay Signed In</span>
              </label>

              <Link
                to="/forgot-password"
                className="text-sm font-medium text-black hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-base font-semibold rounded-lg"
              variant="black"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-gray-600">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-black hover:underline"
            >
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
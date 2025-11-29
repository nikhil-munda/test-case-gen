"use client";

import { useToast } from "@/components/ui/toast";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [code, setCode] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [thinkingLevel, setThinkingLevel] = useState("Standard");
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch current user data

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get(
          `/api/user/getCurrentUser`,
          {
            withCredentials: true,
            headers: {
              'ngrok-skip-browser-warning': 'true',
            },
          }
        );
        console.log('reponse', response);
        if (response.status === 200 && response.data) {
          setUser(() => response.data.data);
        } else {
          router.push("/signin");
        }
      } catch (error: any) {
        if (error.response?.status === 401) {
          toast({
            title: "Session Expired",
            description: "Please sign in again",
            variant: "destructive",
          });
        } else if (
          error.code === "ECONNREFUSED" ||
          error.code === "ERR_NETWORK"
        ) {
          toast({
            title: "Server Error",
            description:
              "Cannot connect to server. Please make sure the backend is running.",
            variant: "destructive",
          });
        }

        router.push("/signin");
      } finally {
        setIsCheckingAuth(false);
      }
    };

    fetchCurrentUser();
  }, [router, toast]);

  // Reset thinking level if non-premium user has premium option selected
  useEffect(() => {
    if (
      user &&
      !user.isPremium &&
      (thinkingLevel === "Standard" || thinkingLevel === "Advanced")
    ) {
      setThinkingLevel("Basic");
      toast({
        title: "Thinking Level Reset",
        description:
          "Your thinking level has been reset to Basic. Upgrade to premium for advanced features.",
        variant: "default",
      });
    }
  }, [user, thinkingLevel, toast]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      const response = await axios.post(
        `api/auth/logout`,
        {},
        {
          withCredentials: true, // Important: Include cookies in the request
        }
      );

      if (response.status === 200) {
        toast({
          title: "Success",
          description: "You have been successfully logged out",
          variant: "default",
        });

        // Clear user state and redirect
        setUser(null);
        router.push("/signin");
      }
    } catch (error: any) {
      // Even if API call fails, still redirect (cookie might be expired)
      toast({
        title: "Logged out",
        description: "You have been logged out",
        variant: "default",
      });

      setUser(null);
      router.push("/signin");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      toast({
        title: "Error",
        description: "Please enter your code",
        variant: "destructive",
      });
      return;
    }

    if (!problemStatement.trim()) {
      toast({
        title: "Error",
        description: "Please enter the problem statement",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResult("");

    try {
      const response = await axios.post(
        `http://localhost:4000/test/getTestCase`,
        {
          code: code.trim(),
          problemStatement: problemStatement.trim(),
          thinkingLevel,
        },
        {
          withCredentials: true,
        }
      );

      console.log("Response:", response.data);

      if (response.data.success && response.data.testCases) {
        // Format the JSON response into readable text
        const testCases = response.data.testCases;
        const analysis = response.data.analysis || "";
        const totalTests = response.data.totalTests || testCases.length;

        let formattedOutput = `✅ Generated ${totalTests} Test Cases\n`;
        formattedOutput += `${"=".repeat(60)}\n\n`;

        if (analysis) {
          formattedOutput += `📊 Analysis:\n${analysis}\n\n`;
          formattedOutput += `${"=".repeat(60)}\n\n`;
        }

        testCases.forEach((tc: any, index: number) => {
          formattedOutput += `🔹 Test Case ${index + 1}: ${tc.description}\n`;
          formattedOutput += `${"-".repeat(60)}\n`;
          formattedOutput += `📥 Input:\n${tc.input}\n\n`;
          formattedOutput += `📤 Expected Output:\n${tc.expectedOutput}\n\n`;
          formattedOutput += `${"=".repeat(60)}\n\n`;
        });

        setResult(formattedOutput);
        toast({
          title: "Success",
          description: `Generated ${totalTests} test cases successfully!`,
          variant: "success",
        });
      } else if (response.data.message) {
        setResult(response.data.message);
        toast({
          title: "Info",
          description: response.data.message,
          variant: "default",
        });
      } else if (response.data.error) {
        toast({
          title: "Error",
          description: "Failed to generate test case",
          variant: "destructive",
        });
        setResult(`Error: ${JSON.stringify(response.data.error)}`);
      } else {
        setResult("No test cases generated. Please try again.");
        toast({
          title: "Warning",
          description: "No test cases were generated",
          variant: "default",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
      setResult(
        "Failed to connect to server. Please make sure the backend is running."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const clearAll = () => {
    setCode("");
    setProblemStatement("");
    setResult("");
    setThinkingLevel("Standard");
  };

  // Show loading spinner while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-emerald-700 font-medium">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  // Only render main content if user is authenticated
  if (!user) {
    console.log('ankit')
    return null; // This should not happen due to redirect, but just in case
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Avatar */}
        <div className="relative mb-8">
          {/* User Avatar in top right */}
          <div className="absolute top-0 right-0">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 bg-white rounded-lg px-3 py-2 shadow-md hover:shadow-lg transition-shadow border border-emerald-200"
              >
                <img
                  src={
                    user.picture ||
                    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  }
                  alt={user.name || "User"}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="text-left hidden sm:block">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-emerald-800">
                      {user.name || "User"}
                    </p>
                    {user?.isPremium && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border border-amber-200">
                        ⭐ Premium
                      </span>
                    )}
                  </div>
                  {/* <p className="text-xs text-emerald-600">{user.email}</p> */}
                </div>
                <svg
                  className={`w-4 h-4 text-emerald-600 transition-transform ${showUserMenu ? "rotate-180" : ""
                    }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-emerald-200 py-2 z-10">
                  {/* <div className="px-4 py-2 border-b border-emerald-100">
                    <p className="text-sm font-medium text-emerald-800">{user.name || 'User'}</p>
                    <p className="text-xs text-emerald-600">{user.email}</p>
                  </div> */}
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      router.push("/profile");
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-800"
                  >
                    Profile Settings
                  </button>

                  <hr className="my-1 border-emerald-100" />
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      handleLogout();
                    }}
                    disabled={isLoggingOut}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isLoggingOut ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600 mr-2"></div>
                        Signing Out...
                      </>
                    ) : (
                      "Sign Out"
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Main Header Content */}
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-emerald-800 mb-4">
              Test Case Generator
            </h1>
            <p className="text-lg text-emerald-600 max-w-2xl mx-auto">
              Generate stress test cases for your C++ code solutions. Input your
              code and problem statement to find potential edge cases.
            </p>
          </div>
        </div>

        {/* Rest of your existing form JSX remains the same */}
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {/* Left Column - Input */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-emerald-200">
              <label
                htmlFor="problemStatement"
                className="block text-sm font-semibold text-emerald-800 mb-3"
              >
                Problem Statement
              </label>
              <textarea
                id="problemStatement"
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                placeholder="Describe the problem you're trying to solve..."
                className="w-full h-32 px-4 py-3 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none text-gray-700 placeholder-gray-400"
                disabled={isLoading}
              />
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-emerald-200">
              <label
                htmlFor="code"
                className="block text-sm font-semibold text-emerald-800 mb-3"
              >
                Your C++ Solution
              </label>
              <textarea
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste your C++ code here..."
                className="w-full h-80 px-4 py-3 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none font-mono text-sm text-gray-700 placeholder-gray-400"
                disabled={isLoading}
              />
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-emerald-200">
              <label
                htmlFor="thinkingLevel"
                className="block text-sm font-semibold text-emerald-800 mb-3"
              >
                Thinking Level
              </label>

              {/* Premium Status Info */}
              {!user?.isPremium && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center text-amber-700">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm font-medium">
                      Standard and Advanced thinking require a premium
                      subscription
                    </span>
                  </div>
                </div>
              )}

              <select
                id="thinkingLevel"
                value={thinkingLevel}
                onChange={(e) => {
                  // Prevent non-premium users from selecting premium options
                  if (
                    !user?.isPremium &&
                    (e.target.value === "Standard" ||
                      e.target.value === "Advanced")
                  ) {
                    // Show premium upgrade message
                    toast({
                      title: "Premium Required",
                      description:
                        "Please upgrade to premium to use Standard and Advanced thinking levels.",
                      variant: "destructive",
                    });
                    return;
                  }
                  setThinkingLevel(e.target.value);
                }}
                className="w-full px-4 py-3 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-700"
                disabled={isLoading}
              >
                <option value="Basic">🆓 Basic (Free)</option>
                <option
                  value="Standard"
                  disabled={!user?.isPremium}
                  className={
                    !user?.isPremium ? "text-gray-400 bg-gray-100" : ""
                  }
                >
                  {user?.isPremium
                    ? "⭐ Standard (Premium)"
                    : "🔒 Standard (Premium Required)"}
                </option>
                <option
                  value="Advanced"
                  disabled={!user?.isPremium}
                  className={
                    !user?.isPremium ? "text-gray-400 bg-gray-100" : ""
                  }
                >
                  {user?.isPremium
                    ? "🚀 Advanced (Premium)"
                    : "🔒 Advanced (Premium Required)"}
                </option>
              </select>

              {/* Premium Upgrade Button */}
              {!user?.isPremium && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => router.push("/profile")}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Upgrade to Premium
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold py-4 px-6 rounded-lg transition-colors shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Generating...
                  </div>
                ) : (
                  "Generate Test Case"
                )}
              </button>

              <button
                type="button"
                onClick={clearAll}
                disabled={isLoading}
                className="px-6 py-4 border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white disabled:border-emerald-400 disabled:text-emerald-400 font-semibold rounded-lg transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Right Column - Result */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-emerald-200">
            <h3 className="text-lg font-semibold text-emerald-800 mb-4">
              Generated Test Case
            </h3>

            {result ? (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700 overflow-auto max-h-96">
                    {result}
                  </pre>
                </div>

                <button
                  onClick={() => navigator.clipboard.writeText(result)}
                  className="w-full bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-medium py-2 px-4 rounded-lg transition-colors border border-emerald-300"
                >
                  Copy to Clipboard
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-80 text-gray-400">
                <div className="text-center">
                  <div className="text-6xl mb-4">🧪</div>
                  <p className="text-lg">Test case will appear here</p>
                  <p className="text-sm mt-2">
                    Fill in your code and problem statement, then click generate
                  </p>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

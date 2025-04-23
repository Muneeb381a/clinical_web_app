import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useDebounce } from "use-debounce";
import { fetchWithRetry } from "../utils/api";
import { toast } from "react-toastify";

const searchSchema = z.object({
  search: z
    .string()
    .min(1, "Please enter a mobile number or name")
    .refine(
      (val) => /^[0-9]{11}$/.test(val) || /^[a-zA-Z\s]{1,50}$/.test(val),
      "Enter a valid 11-digit mobile number or name (letters and spaces only, up to 50 characters)"
    ),
});

const PatientSearchForm = ({ onSearch, isSearching }) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({ resolver: zodResolver(searchSchema) });
  const [suggestions, setSuggestions] = useState([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchInput = watch("search") || "";
  const [debouncedSearch] = useDebounce(searchInput, 300);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch suggestions for name input
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!navigator.onLine) {
        toast.error("You are offline. Please check your network connection.");
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }

      const isName = /^[a-zA-Z\s]{1,50}$/.test(debouncedSearch);
      if (!debouncedSearch || !isName || /^[0-9]{11}$/.test(debouncedSearch)) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }

      setIsSuggesting(true);
      try {
        const suggestionRes = await fetchWithRetry(
          "get",
          `http://localhost:4500/api/patients/suggest?name=${encodeURIComponent(debouncedSearch)}`,
          "patient-suggestions",
          null,
          (data) => {
            if (!data?.success || !Array.isArray(data.data)) {
              console.warn("Invalid suggestion response:", data);
              return { success: false, data: [] };
            }
            return data;
          }
        );

        const suggestionsData = suggestionRes.data || [];
        setSuggestions(suggestionsData);
        setShowDropdown(suggestionsData.length > 0 || isSuggesting);
      } catch (error) {
        console.error("Error fetching suggestions:", {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          query: debouncedSearch,
        });
        toast.error(
          error.response?.status === 500
            ? "Server error fetching suggestions. Please try again."
            : error.response?.status === 503
            ? "Database connection error. Please try again."
            : "Failed to fetch suggestions. Please try again."
        );
        setSuggestions([]);
        setShowDropdown(false);
      } finally {
        setIsSuggesting(false);
      }
    };

    fetchSuggestions();
  }, [debouncedSearch]);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setValue("search", suggestion.name, { shouldValidate: true });
    setShowDropdown(false);
    handleSubmit(onSearch)();
    inputRef.current?.blur();
  };

  // Handle form submission
  const onSubmit = (data) => {
    setShowDropdown(false);
    onSearch(data);
  };

  return (
    <div className="mb-8 bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-blue-700 p-2.5 rounded-lg text-white shadow-sm">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            ></path>
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Patient Lookup
          </h3>
          <p className="text-sm text-gray-600">
            Search existing patient records by mobile number or name
          </p>
        </div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
            Mobile Number or Name <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-3 relative" ref={dropdownRef}>
            <div className="relative w-full">
              <input
                {...register("search")}
                placeholder="03001234567 or Name"
                className="w-full rounded-xl border-2 border-gray-200 bg-white p-3.5 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all pr-10"
                onFocus={() =>
                  setShowDropdown(suggestions.length > 0 || isSuggesting)
                }
                autoComplete="off"
                ref={(e) => {
                  register("search").ref(e);
                  inputRef.current = e;
                }}
              />
              {isSuggesting && (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-600"
                >
                  🌀
                </motion.span>
              )}
            </div>
            <button
              type="submit"
              disabled={isSearching || isSuggesting}
              className="self-stretch px-8 bg-blue-700 text-white font-semibold rounded-xl shadow-md hover:bg-blue-800 transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? (
                <div className="flex items-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="inline-block"
                  >
                    🌀
                  </motion.span>
                  Searching...
                </div>
              ) : (
                "Find Patient"
              )}
            </button>
            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 mt-2 w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden"
                >
                  {isSuggesting ? (
                    <div className="p-4 flex items-center gap-2 text-gray-600">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="inline-block"
                      >
                        🌀
                      </motion.span>
                      Loading suggestions...
                    </div>
                  ) : suggestions.length === 0 ? (
                    <div className="p-4 text-gray-600">
                      No suggestions found
                    </div>
                  ) : (
                    <ul className="max-h-60 overflow-y-auto">
                      {suggestions.map((suggestion, index) => (
                        <motion.li
                          key={index}
                          whileHover={{ backgroundColor: "#f0f9ff" }}
                          className="p-4 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-center justify-between"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          <span className="text-gray-800 font-medium">
                            {suggestion.name}
                          </span>
                          <span className="text-sm text-gray-500">
                            {suggestion.mobile || "No mobile"}
                          </span>
                        </motion.li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        {errors.search && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2.5 rounded-lg">
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              ></path>
            </svg>
            <span className="text-sm">{errors.search.message}</span>
          </div>
        )}
      </form>
    </div>
  );
};

export default PatientSearchForm;

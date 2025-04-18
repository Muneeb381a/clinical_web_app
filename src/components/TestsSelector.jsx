import React, { useMemo } from "react";
import Select from "react-select";
import { FaFlask, FaSearch, FaTimes, FaPlus } from "react-icons/fa";

const TestsSelector = ({ allTests, selectedTests, onSelect, onRemove }) => {
  // Validate and map allTests to testOptions
  const testOptions = useMemo(() => {
    if (!Array.isArray(allTests)) {
      console.warn("allTests is not an array:", allTests);
      return [];
    }
    return allTests
      .filter((test) => test && test.id && test.test_name)
      .map((test) => ({
        label: test.test_name || "Unknown Test",
        value: test.id,
      }));
  }, [allTests]);

  // Filter valid selected tests
  const selectedTestOptions = useMemo(() => {
    if (!Array.isArray(selectedTests)) {
      console.warn("selectedTests is not an array:", selectedTests);
      return [];
    }
    return selectedTests
      .map((testId) => testOptions.find((option) => option.value === testId))
      .filter(Boolean);
  }, [selectedTests, testOptions]);

  const handleChange = (selectedOptions) => {
    const newSelectedIds = selectedOptions
      ? selectedOptions.map((option) => option.value)
      : [];
    console.log("Selected test IDs:", newSelectedIds);
    onSelect(newSelectedIds);
  };

  // Custom styles for react-select
  const customStyles = {
    control: (base) => ({
      ...base,
      minHeight: "44px",
      borderColor: "#e5e7eb",
      "&:hover": { borderColor: "#9ca3af" },
      boxShadow: "none",
    }),
    option: (base, { isFocused }) => ({
      ...base,
      backgroundColor: isFocused ? "#f5f3ff" : "white",
      color: "#4b5563",
      "&:active": { backgroundColor: "#ede9fe" },
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: "#f5f3ff",
      borderRadius: "8px",
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: "#6d28d9",
      fontWeight: "500",
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: "#6d28d9",
      ":hover": { backgroundColor: "#ddd6fe", color: "#4c1d95" },
    }),
  };

  return (
    <div className="space-y-6">
      <div>
        <label
          htmlFor="tests-selector"
          className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"
        >
          <FaFlask className="text-purple-600" />
          Select Diagnostic Tests
        </label>
        {testOptions.length === 0 ? (
          <p className="text-sm text-yellow-600">
            No tests available. Please try again later.
          </p>
        ) : (
          <Select
            inputId="tests-selector"
            options={testOptions}
            value={selectedTestOptions}
            onChange={handleChange}
            isMulti
            isDisabled={testOptions.length === 0}
            placeholder="Search diagnostic tests..."
            styles={customStyles}
            className="react-select-container"
            classNamePrefix="react-select"
            aria-label="Select diagnostic tests"
            components={{
              DropdownIndicator: () => <FaSearch className="mr-3 text-gray-400" />,
            }}
          />
        )}
      </div>

      {selectedTestOptions.length > 0 && (
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center gap-2 mb-3 text-gray-600">
            <FaPlus className="text-sm" />
            <span className="text-sm font-medium">Selected Tests</span>
            <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
              {selectedTestOptions.length} selected
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedTestOptions.map((test) => (
              <div
                key={test.value}
                className="group bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all hover:bg-purple-100"
              >
                <span className="text-sm">{test.label}</span>
                <button
                  type="button"
                  onClick={() => {
                    console.log("Removing test ID:", test.value);
                    onRemove(test.value);
                  }}
                  className="text-purple-400 hover:text-purple-700 transition-colors"
                  aria-label={`Remove ${test.label}`}
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TestsSelector;
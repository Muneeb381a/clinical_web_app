import React, { useMemo } from "react";
import Select from "react-select";
import { FaFlask, FaSearch } from "react-icons/fa";

const TestsSelector = ({ allTests, selectedTests, onSelect }) => {
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
    onSelect(newSelectedIds);
  };

  // Custom styles for react-select
  const customStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: "48px",
      borderColor: state.isFocused ? "#8b5cf6" : "#e5e7eb",
      borderWidth: "2px",
      borderRadius: "10px",
      boxShadow: state.isFocused ? "0 0 0 2px rgba(139, 92, 246, 0.2)" : "none",
      "&:hover": { borderColor: "#8b5cf6" },
      transition: "all 0.2s ease",
    }),
    option: (base, { isFocused, isSelected }) => ({
      ...base,
      backgroundColor: isSelected
        ? "#8b5cf6"
        : isFocused
        ? "#ede9fe"
        : "white",
      color: isSelected ? "white" : "#4b5563",
      padding: "10px 16px",
      fontSize: "14px",
      "&:active": { backgroundColor: "#7c3aed" },
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: "#f3f0ff",
      borderRadius: "8px",
      padding: "2px 6px",
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: "#7c3aed",
      fontWeight: "500",
      fontSize: "14px",
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: "#7c3aed",
      borderRadius: "0 8px 8px 0",
      ":hover": { backgroundColor: "#ddd6fe", color: "#5b21b6" },
    }),
    placeholder: (base) => ({
      ...base,
      color: "#9ca3af",
      fontSize: "14px",
    }),
    input: (base) => ({
      ...base,
      color: "#4b5563",
      fontSize: "14px",
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: "#9ca3af",
      padding: "8px",
      ":hover": { color: "#6b7280" },
    }),
    clearIndicator: (base) => ({
      ...base,
      color: "#9ca3af",
      padding: "8px",
      ":hover": { color: "#6b7280" },
    }),
    indicatorSeparator: (base) => ({
      ...base,
      backgroundColor: "#e5e7eb",
    }),
  };

  return (
    <div className="space-y-2">
      <div>
        <label
          htmlFor="tests-selector"
          className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"
        >
          <FaFlask className="text-purple-500" />
          <span>Diagnostic Tests</span>
          {selectedTestOptions.length > 0 && (
            <span className="ml-auto text-xs bg-purple-100 text-green-700 px-2 py-1 rounded-full">
              {selectedTestOptions.length} selected
            </span>
          )}
        </label>
        {testOptions.length === 0 ? (
          <div className="text-sm text-yellow-600 bg-yellow-50 px-4 py-3 rounded-lg border border-yellow-100">
            No tests available. Please try again later.
          </div>
        ) : (
          <Select
            inputId="tests-selector"
            options={testOptions}
            value={selectedTestOptions}
            onChange={handleChange}
            isMulti
            isDisabled={testOptions.length === 0}
            placeholder="Search and select tests..."
            styles={customStyles}
            className="react-select-container"
            classNamePrefix="react-select"
            aria-label="Select diagnostic tests"
            components={{
              DropdownIndicator: () => <FaSearch className="mr-1 text-gray-400" />,
            }}
            noOptionsMessage={() => "No tests found"}
          />
        )}
      </div>
    </div>
  );
};

export default TestsSelector;
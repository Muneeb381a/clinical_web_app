import React from "react";
import Select from "react-select";
import { FaFlask, FaSearch, FaTimes, FaPlus } from "react-icons/fa";

const TestsSelector = ({ allTests, selectedTests, onSelect, onRemove }) => {
  const testOptions = allTests.map((test) => ({
    label: test.test_name || "Unknown Test",
    value: test.id,
  }));

  const selectedTestOptions = selectedTests
    .map((testId) => testOptions.find((option) => option.value === testId))
    .filter(Boolean);

  const handleChange = (selectedOptions) => {
    const newSelectedIds = selectedOptions
      ? selectedOptions.map((option) => option.value)
      : [];
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
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <FaFlask className="text-purple-600" />
          Select Diagnostic Tests
        </label>
        
        <Select
          options={testOptions}
          value={selectedTestOptions}
          onChange={handleChange}
          isMulti
          placeholder={
            <div className="flex items-center gap-2 text-gray-400">
              <FaSearch />
              <span>Search diagnostic tests...</span>
            </div>
          }
          styles={customStyles}
          className="react-select-container"
          classNamePrefix="react-select"
          components={{
            DropdownIndicator: () => <FaSearch className="mr-3 text-gray-400" />,
          }}
        />
      </div>

      {selectedTests.length > 0 && (
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center gap-2 mb-3 text-gray-600">
            <FaPlus className="text-sm" />
            <span className="text-sm font-medium">Selected Tests</span>
            <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
              {selectedTests.length} selected
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
                  onClick={() => onRemove(test.value)}
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
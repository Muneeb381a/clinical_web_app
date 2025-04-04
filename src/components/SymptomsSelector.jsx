import React from "react";
import Select from "react-select";
import { FaSearch, FaTimes, FaTag, FaPlus } from "react-icons/fa";

const SymptomsSelector = ({ allSymptoms, selectedSymptoms, onSelect, onRemove }) => {
  const symptomOptions = allSymptoms.map((symptom) => ({
    label: symptom.name || "Unknown Symptom",
    value: symptom.id,
  }));

  const selectedSymptomOptions = selectedSymptoms
    .map((symptomId) => symptomOptions.find((option) => option.value === symptomId))
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
          <FaTag className="text-purple-600" />
          Select Symptoms
        </label>
        
        <Select
          options={symptomOptions}
          value={selectedSymptomOptions}
          onChange={handleChange}
          isMulti
          placeholder={
            <div className="flex items-center gap-2 text-gray-400">
              <FaSearch />
              <span>Search symptoms...</span>
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

      {selectedSymptoms.length > 0 && (
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center gap-2 mb-3 text-gray-600">
            <FaPlus className="text-sm" />
            <span className="text-sm font-medium">Selected Symptoms</span>
            <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
              {selectedSymptoms.length} selected
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {selectedSymptomOptions.map((symptom) => (
              <div
                key={symptom.value}
                className="group bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all hover:bg-purple-100"
              >
                <span className="text-sm">{symptom.label}</span>
                <button
                  type="button"
                  onClick={() => onRemove(symptom.value)}
                  className="text-purple-400 hover:text-purple-700 transition-colors"
                  aria-label={`Remove ${symptom.label}`}
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

export default SymptomsSelector;
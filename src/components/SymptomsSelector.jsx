import React from "react";
import CreatableSelect from "react-select/creatable";

const SymptomsSelector = ({
  allSymptoms,
  selectedSymptoms,
  rawSymptoms = [], // New prop
  onSelect,
  onRemove,
}) => {
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
      backgroundColor: "#ede9fe",
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: "#6d28d9",
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: "#6d28d9",
      ":hover": {
        backgroundColor: "#d1d5db",
        color: "#4b5563",
      },
    }),
  };

  const handleChange = (newValue) => {
    const selectedIds = newValue ? newValue.map((opt) => Number(opt.value)) : [];
    onSelect(selectedIds);
  };

  const handleCreate = (inputValue) => {
    // Allow creating new symptoms (optional)
    const newId = Math.max(...allSymptoms.map((s) => s.id), 0) + 1;
    const newSymptom = { id: newId, name: inputValue };
    onSelect([...selectedSymptoms, newId]);
    // Note: This doesn't persist to backend unless API supports it
  };

  // Map selectedSymptoms (IDs) to options
  const selectedOptions = selectedSymptoms
    .map((id) => {
      const symptom = allSymptoms.find((s) => s.id === id);
      return symptom ? { value: symptom.id, label: symptom.name } : null;
    })
    .filter(Boolean);

  // Add rawSymptoms (strings) if no ID matches
  const fallbackOptions = rawSymptoms
    .filter((name) => !allSymptoms.some((s) => s.name.toLowerCase() === name.toLowerCase()))
    .map((name) => ({
      value: `temp_${name}`,
      label: name,
      isDisabled: true, // Prevent selection
    }));

  return (
    <div className="relative">
      <CreatableSelect
        isMulti
        isClearable
        onChange={handleChange}
        onCreateOption={handleCreate}
        options={allSymptoms.map((symptom) => ({
          value: symptom.id,
          label: symptom.name,
        }))}
        value={[...selectedOptions, ...fallbackOptions]}
        placeholder="Select or type symptoms..."
        styles={customStyles}
        classNamePrefix="react-select"
      />
      {fallbackOptions.length > 0 && (
        <p className="mt-2 text-sm text-yellow-600">
          Some symptoms ({fallbackOptions.map((opt) => opt.label).join(", ")}) are not in the database.
        </p>
      )}
    </div>
  );
};

export default SymptomsSelector;
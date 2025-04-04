import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import CreatableSelect from 'react-select/creatable';
import Loader from './Loader'; 

const SymptomAnalysisSection = ({
  selectedSymptoms = [],
  onSymptomsChange,
}) => {
  const [symptoms, setSymptoms] = useState([]);
  const [isFetchingSymptoms, setIsFetchingSymptoms] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSearchingSymptoms, setIsSearchingSymptoms] = useState(false);

  useEffect(() => {
    const fetchSymptoms = async () => {
      setIsFetchingSymptoms(true);
      try {
        const response = await axios.get('https://patient-management-backend-nine.vercel.app/api/symptoms');
        setSymptoms(response.data.map((symptom) => ({
          value: symptom.id,
          label: symptom.name,
        })));
      } catch (error) {
        toast.error('Failed to fetch symptoms');
        console.error('Error fetching symptoms:', error);
      } finally {
        setIsFetchingSymptoms(false);
      }
    };
    fetchSymptoms();
  }, []);

  const handleCreateSymptom = async (inputValue) => {
    setIsCreating(true);
    try {
      const response = await axios.post('https://patient-management-backend-nine.vercel.app/api/symptoms', {
        name: inputValue,
      });
      const newSymptom = { value: response.data.id, label: response.data.name };
      setSymptoms((prev) => [...prev, newSymptom]);
      onSymptomsChange([...selectedSymptoms, newSymptom]);
    } catch (error) {
      toast.error('Failed to create symptom');
      console.error('Error creating symptom:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSearchSymptoms = async (inputValue) => {
    setIsSearchingSymptoms(true);
    try {
      const response = await axios.get(`https://patient-management-backend-nine.vercel.app/api/symptoms?search=${encodeURIComponent(inputValue)}`);
      setSymptoms(response.data.map((symptom) => ({
        value: symptom.id,
        label: symptom.name,
      })));
    } catch (error) {
      toast.error('Failed to search symptoms');
      console.error('Error searching symptoms:', error);
    } finally {
      setIsSearchingSymptoms(false);
    }
  };

  const customStyles = {
    control: (base) => ({
      ...base,
      border: "1px solid #e5e7eb",
      borderRadius: "12px",
      padding: "8px 12px",
      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
      "&:hover": { borderColor: "#3b82f6" },
      "&:focus-within": {
        borderColor: "#3b82f6",
        boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.2)",
      },
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: "#eff6ff",
      borderRadius: "8px",
      padding: "2px 8px",
      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: "#1d4ed8",
      fontWeight: "500",
      fontSize: "0.875rem",
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: "#1d4ed8",
      ":hover": {
        backgroundColor: "#bfdbfe",
        borderRadius: "6px",
      },
    }),
    menu: (base) => ({
      ...base,
      borderRadius: "12px",
      border: "1px solid #e5e7eb",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
      marginTop: "8px",
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? "#f0f9ff" : "white",
      color: state.isFocused ? "#0369a1" : "#1f2937",
      fontWeight: state.isFocused ? "500" : "400",
      ":active": {
        backgroundColor: "#e0f2fe",
      },
    }),
    placeholder: (base) => ({
      ...base,
      color: "#9ca3af",
      fontSize: "0.875rem",
    }),
  };

  return (
    <div className="bg-white p-7 rounded-2xl border border-gray-100 shadow-lg hover:shadow-xl transition-shadow duration-200">
      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
        <div className="bg-orange-600 p-3 rounded-xl text-white shadow-md hover:scale-105 transition-transform duration-200">
          <svg
            className="w-7 h-7"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">
            Symptom Analysis
          </h3>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            Select or create observed symptoms
          </p>
        </div>
      </div>

      {isFetchingSymptoms || isCreating ? (
        <Loader message={isCreating ? "Creating symptom..." : "Loading symptoms..."} />
      ) : (
        <CreatableSelect
          isMulti
          options={symptoms}
          value={selectedSymptoms}
          onChange={onSymptomsChange}
          onCreateOption={handleCreateSymptom}
          onInputChange={(inputValue, { action }) => {
            if (action === 'input-change' && inputValue.length >= 2) {
              handleSearchSymptoms(inputValue);
            }
          }}
          placeholder="Search or type symptoms..."
          classNamePrefix="react-select"
          isClearable
          isLoading={isSearchingSymptoms}
          formatCreateLabel={(inputValue) => `Create "${inputValue}"`}
          styles={customStyles}
        />
      )}
    </div>
  );
};

export default SymptomAnalysisSection;
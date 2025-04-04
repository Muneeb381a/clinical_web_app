import React from 'react';

const VitalSignsSection = ({ vitalSigns, onVitalSignsChange }) => {
  const validateVitals = () => {
    const errors = [];

    if (!/^\d{2,3}\/\d{2,3}$/.test(vitalSigns.bloodPressure)) {
      errors.push("Invalid blood pressure format (use XXX/XX)");
    }

    if (
      !vitalSigns.pulseRate ||
      isNaN(vitalSigns.pulseRate) ||
      vitalSigns.pulseRate < 0
    ) {
      errors.push("Invalid pulse rate");
    }

    if (
      !vitalSigns.temperature ||
      isNaN(vitalSigns.temperature) ||
      vitalSigns.temperature < 30 ||
      vitalSigns.temperature > 45
    ) {
      errors.push("Temperature must be between 30°C and 45°C");
    }

    if (
      !vitalSigns.spo2 ||
      isNaN(vitalSigns.spo2) ||
      vitalSigns.spo2 < 0 ||
      vitalSigns.spo2 > 100
    ) {
      errors.push("SpO2 must be between 0-100%");
    }

    if (
      !vitalSigns.nihss ||
      isNaN(vitalSigns.nihss) ||
      vitalSigns.nihss < 0 ||
      vitalSigns.nihss > 42
    ) {
      errors.push("NIHSS score must be between 0-42");
    }

    if (errors.length > 0) {
      alert(errors.join("\n"));
      return false;
    }
    return true;
  };

  const handleChange = (field, value) => {
    const updatedVitals = { ...vitalSigns, [field]: value };
    onVitalSignsChange(updatedVitals);

    // Optional: Validate on change and prevent invalid updates if desired
    // if (validateVitals(updatedVitals)) {
    //   onVitalSignsChange(updatedVitals);
    // }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center gap-3 mb-5 border-b border-gray-200 pb-4">
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
              d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Vital Signs</h3>
          <p className="text-sm text-gray-600">
            Enter patient's current vital measurements
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Blood Pressure */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">BP (mmHg)</label>
          <input
            type="text"
            value={vitalSigns.bloodPressure}
            onChange={(e) => handleChange("bloodPressure", e.target.value)}
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition-all placeholder-gray-400"
            placeholder="120/80"
            pattern="\d{2,3}/\d{2,3}"
            required
          />
        </div>

        {/* Pulse Rate */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Pulse (bpm)</label>
          <input
            type="number"
            min="0"
            value={vitalSigns.pulseRate}
            onChange={(e) => handleChange("pulseRate", e.target.value)}
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition-all placeholder-gray-400"
            placeholder="72"
            required
          />
        </div>

        {/* Temperature */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Temp (°C)</label>
          <input
            type="number"
            step="0.1"
            min="30"
            max="45"
            value={vitalSigns.temperature}
            onChange={(e) => handleChange("temperature", e.target.value)}
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition-all placeholder-gray-400"
            placeholder="36.6"
            required
          />
        </div>

        {/* SpO2 */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">SpO2 (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={vitalSigns.spo2}
            onChange={(e) => handleChange("spo2", e.target.value)}
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition-all placeholder-gray-400"
            placeholder="98"
            required
          />
        </div>

        {/* NIHSS Score */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">NIHSS</label>
          <input
            type="number"
            min="0"
            max="42"
            value={vitalSigns.nihss}
            onChange={(e) => handleChange("nihss", e.target.value)}
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition-all placeholder-gray-400"
            placeholder="0"
            required
          />
        </div>

        {/* Fall Assessment */}
        <div className="space-y-1 md:col-span-2">
          <label className="text-sm font-medium text-gray-700">Fall Assessment</label>
          <select
            value={vitalSigns.fall_assessment}
            onChange={(e) => handleChange("fall_assessment", e.target.value)}
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition-all text-gray-700"
            required
          >
            <option value="Done">Done</option>
            <option value="Not Done">Not Done</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default VitalSignsSection;
import React from 'react';
import SymptomAnalysisSection from './SymptomAnalysisSection';
import NeurologicalExamSection from './NeurologicalExamSection';
import DiagnosisTestSection from "./DiagnosisTestSection"
import PrescriptionManagementSection from './PrescriptionManagementSection';
import VitalSignsSection from './VitalSignsSection';
import FollowUpSection from './FollowUpSection';

const ConsultationForm = ({
  vitalSigns, onVitalSignsChange,
  selectedSymptoms, onSymptomsChange,
  neuroExamData, setNeuroExamData, neuroExamFields,
  tests, selectedTests, onTestsChange, loading,
  selectedMedicines, setSelectedMedicines, customSelectStyles,
  selectedDuration, followUpDate, followUpNotes,
  onDurationChange, onDateChange, onNotesChange,
  onSubmit, onPrint
}) => (
  <div className="space-y-8" id="consultation-content">
    <VitalSignsSection vitalSigns={vitalSigns} onVitalSignsChange={onVitalSignsChange} />
    <SymptomAnalysisSection selectedSymptoms={selectedSymptoms} onSymptomsChange={onSymptomsChange} />
    <NeurologicalExamSection neuroExamData={neuroExamData} setNeuroExamData={setNeuroExamData} fields={neuroExamFields} />
    <DiagnosisTestSection tests={tests} selectedTests={selectedTests} onTestsChange={onTestsChange} isLoading={loading} />
    <PrescriptionManagementSection selectedMedicines={selectedMedicines} setSelectedMedicines={setSelectedMedicines} customSelectStyles={customSelectStyles} />
    <div className="md:col-span-4 space-y-4">
      <h4 className="font-medium text-gray-700 bg-gray-50 p-2 rounded-lg">Clinical Decisions</h4>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Diagnosis</label>
        <textarea
          value={neuroExamData.diagnosis || ""}
          onChange={(e) => setNeuroExamData((prev) => ({ ...prev, diagnosis: e.target.value }))}
          className="w-full rounded-lg border-2 border-gray-100 p-3 h-32"
        />
      </div>
    </div>
    <FollowUpSection
      selectedDuration={selectedDuration}
      followUpDate={followUpDate}
      followUpNotes={followUpNotes}
      onDurationChange={onDurationChange}
      onDateChange={onDateChange}
      onNotesChange={onNotesChange}
    />
    <button
      onClick={onSubmit}
      className={`w-full py-4 bg-gradient-to-r from-green-600 to-teal-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.01] flex items-center justify-center ${loading ? "opacity-75 cursor-not-allowed" : ""}`}
      disabled={loading}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          Processing...
        </>
      ) : (
        <>
          <span className="inline-block mr-2">✅</span>
          Finalize & Save Consultation
        </>
      )}
    </button>
    <div className="mt-6">
      <button
        onClick={onPrint}
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2 print:hidden"
        aria-label="Print prescription"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
        </svg>
        Print Prescription
      </button>
    </div>
  </div>
);

export default ConsultationForm;
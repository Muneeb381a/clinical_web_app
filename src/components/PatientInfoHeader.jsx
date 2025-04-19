import React from 'react';
import { AiOutlineArrowLeft, AiOutlineHistory, AiOutlineUser } from 'react-icons/ai';
import PatientHistoryModal from "./PatientHistoryModal"

const PatientInfoHeader = ({ patient, onReturnHome, prescriptions, setShowPopup }) => (
  <div className="mb-8 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
    <div className="flex items-center justify-between mb-8 px-6 py-4 bg-gradient-to-r from-gray-50 to-white shadow-md rounded-2xl">
      <button
        onClick={onReturnHome}
        className="group flex items-center gap-2 px-4 py-2 bg-white text-gray-600 hover:text-gray-800 hover:bg-gray-100 border border-gray-200 rounded-xl font-medium text-sm shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
      >
        <AiOutlineArrowLeft className="w-5 h-5 transition-transform duration-200 group-hover:-translate-x-1" />
        Back to Search
      </button>
      <div className="flex items-center gap-6">
        {Array.isArray(prescriptions) && prescriptions.length > 0 && (
          <button
            onClick={() => setShowPopup(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all duration-300 cursor-pointer"
          >
            <AiOutlineHistory className="w-5 h-5" />
            Previous Prescriptions
          </button>
        )}
        {patient?.id ? (
          <PatientHistoryModal patientId={patient.id} />
        ) : (
          <p className="text-gray-500 italic text-sm">No patient selected</p>
        )}
      </div>
    </div>
    <div className="bg-gray-50 p-4 rounded-lg mb-6">
      <div className="flex items-center gap-4">
        <div className="bg-purple-100 p-2 rounded-lg">
          <AiOutlineUser className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">{patient.name}</h2>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span>ID: {patient.id}</span>
            <span className="text-gray-400">|</span>
            <span>{patient.mobile}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default PatientInfoHeader;
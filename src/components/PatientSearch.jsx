import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ToastContainer, toast } from "react-toastify";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PatientSearchForm from "./PatientSearchForm";
import AddPatientForm from "../pages/AddPatientForm";
import PrescriptionButton from "./PrescriptionButton";
import {
  FaCalendarAlt,
  FaEdit,
  FaEye,
  FaPlus,
  FaStethoscope,
  FaPills,
  FaFlask,
  FaHeartbeat,
  FaSpinner,
  FaChevronDown,
  FaChevronUp,
  FaNotesMedical,
  FaThermometer,
  FaLungs,
  FaBrain,
  FaUser,
  FaPhone,
  FaIdCard,
  FaArrowLeft,
  FaWalking,
} from "react-icons/fa";
import { fetchWithRetry } from "../utils/api";
import { CustomErrorBoundary } from "../utils/CustomErrorBoundary";

// Simple in-memory cache with TTL
const cache = {
  data: {},
  set(key, value, ttlMs) {
    this.data[key] = { value, expiry: Date.now() + ttlMs };
  },
  get(key) {
    const item = this.data[key];
    if (!item) return null;
    if (Date.now() > item.expiry) {
      delete this.data[key];
      return null;
    }
    return item.value;
  },
};

// Custom debounce function
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Simplified FullPageLoader
const FullPageLoader = ({ message = "Processing your request" }) => (
  <div className="fixed inset-0 z-[100] bg-gradient-to-br from-gray-50 to-gray-100/95 flex items-center justify-center">
    <div className="text-center space-y-6 p-8 rounded-2xl bg-white/80 shadow-xl backdrop-blur-sm">
      <div className="relative mx-auto w-20 h-20">
        <div className="absolute inset-0 border-4 border-transparent border-t-indigo-500 border-r-indigo-300 rounded-full animate-spin" />
        <div className="absolute inset-1.5 border-4 border-transparent border-t-indigo-400 border-l-indigo-200 rounded-full animate-spin [animation-duration:1.2s]" />
        <div className="absolute inset-0 bg-indigo-100/20 rounded-full animate-pulse" />
      </div>
      <p className="text-xl font-medium text-gray-900 tracking-tight animate-pulse [animation-duration:2s]">
        {message}
      </p>
    </div>
  </div>
);

// Memoized ConsultationItem component
const ConsultationItem = React.memo(
  ({ consultation, index, toggleSection, expandedSections, handleEditClick, patient }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-xl shadow-xs border border-gray-100 hover:border-purple-100 transition-all"
    >
      <div className="flex flex-wrap gap-4 justify-between items-start pb-4 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl">
            <FaCalendarAlt className="text-xl text-blue-600" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-900">
              {new Date(consultation.visit_date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </h4>
            {consultation.follow_up_date && (
              <p className="text-sm text-gray-500 mt-1">
                <span className="font-medium">Follow-up:</span>{" "}
                {new Date(consultation.follow_up_date).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
        {consultation.consultation_id && (
          <div className="flex gap-3">
            <PrescriptionButton patient={patient} consultation={consultation} />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleSection(index)}
              title="Toggle Details"
            >
              {expandedSections[index] ? (
                <FaChevronUp className="text-blue-600 hover:text-blue-800 text-xl cursor-pointer" />
              ) : (
                <FaEye className="text-blue-600 hover:text-blue-800 text-xl cursor-pointer" />
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleEditClick(consultation.consultation_id)}
              title="Edit Consultation"
            >
              <FaEdit className="text-green-600 hover:text-green-800 text-xl cursor-pointer" />
            </motion.button>
          </div>
        )}
      </div>
      {expandedSections[index] && (
        <div className="space-y-6 pt-4 border-t border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FaStethoscope className="text-gray-600" />
              <h4 className="font-semibold text-gray-900">Patient Information</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="mt-2 text-gray-900">{consultation.patient_name || "Not specified"}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="text-sm font-medium text-gray-500">Mobile</label>
                <p className="mt-2 text-gray-900">{consultation.mobile || "Not specified"}</p>
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FaNotesMedical className="text-gray-600" />
              <h4 className="font-semibold text-gray-900">Diagnosis & Symptoms</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="text-sm font-medium text-gray-500">Diagnosis</label>
                <p className="mt-2 text-gray-900">{consultation.neuro_diagnosis || "Not specified"}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="text-sm font-medium text-gray-500">Symptoms</label>
                <p className="mt-2 text-gray-900">
                  {consultation.symptoms?.filter(Boolean).join(", ") || "No symptoms recorded"}
                </p>
              </div>
              <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
                <label className="text-sm font-medium text-gray-500">Treatment Plan</label>
                <p className="mt-2 text-gray-900">{consultation.neuro_treatment_plan || "Not specified"}</p>
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-blue-100 rounded-lg">
                <FaFlask className="text-xl text-blue-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900">Tests</h4>
            </div>
            <p className="text-gray-800 font-medium leading-relaxed">
              {consultation.tests?.length > 0 ? (
                <span className="inline-flex flex-wrap gap-2">
                  {consultation.tests.map((test) => (
                    <span
                      key={test.test_id}
                      className="px-3 py-1 bg-blue-50 text-blue-800 rounded-full text-sm"
                    >
                      {test.test_name}
                    </span>
                  ))}
                </span>
              ) : (
                <span className="text-gray-500 italic">No tests prescribed</span>
              )}
            </p>
          </div>
          {consultation.vital_signs?.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-red-100 rounded-lg">
                  <FaHeartbeat className="text-xl text-red-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900">Vital Signs</h4>
              </div>
              <div className="overflow-x-auto pb-4">
                <div className="flex gap-2 min-w-max">
                  {consultation.vital_signs.map((vital, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-4 border-b border-gray-100 transition-all min-w-[300px]"
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex gap-2">
                          <div className="flex items-center justify-center gap-2 p-2 bg-red-50 rounded-lg flex-1 min-w-[150px]">
                            <FaHeartbeat className="text-red-600" />
                            <div>
                              <p className="text-xs font-medium text-red-700">BP</p>
                              <p className="text-lg font-bold text-gray-900">
                                {vital.blood_pressure || "N/A"}
                                <span className="text-xs text-gray-500 ml-1">mmHg</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-center gap-2 p-2 bg-blue-50 rounded-lg flex-1 min-w-[110px]">
                            <FaHeartbeat className="text-blue-600" />
                            <div>
                              <p className="text-xs font-medium text-blue-700">Pulse</p>
                              <p className="text-lg font-bold text-gray-900">
                                {vital.pulse_rate || "N/A"}
                                <span className="text-xs text-gray-500 ml-1">bpm</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-center gap-2 p-2 bg-orange-50 rounded-lg flex-1 min-w-[110px]">
                            <FaThermometer className="text-orange-600" />
                            <div>
                              <p className="text-xs font-medium text-orange-700">Temp</p>
                              <p className="text-lg font-bold text-gray-900">
                                {vital.temperature || "N/A"}
                                <span className="text-xs text-gray-500 ml-1">°C</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-center gap-2 p-2 bg-green-50 rounded-lg flex-1 min-w-[110px]">
                            <FaLungs className="text-green-600" />
                            <div>
                              <p className="text-xs font-medium text-green-700">SpO₂</p>
                              <p className="text-lg font-bold text-gray-900">
                                {vital.spo2_level || "N/A"}
                                <span className="text-xs text-gray-500 ml-1">%</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-center gap-3 p-3 bg-green-50 rounded-lg flex-1 min-w-[120px]">
                            <div className="p-2 bg-green-100 rounded-full">
                              <FaBrain className="text-green-600 w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                                NIHSS Score
                              </p>
                              <p className="text-lg font-bold text-gray-900 mt-1">
                                {vital.nihss_score ?? "N/A"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-center gap-3 p-3 bg-orange-50 rounded-lg flex-1 min-w-[120px]">
                            <div className="p-2 bg-orange-100 rounded-full">
                              <FaWalking className="text-orange-600 w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide">
                                Fall Assessment
                              </p>
                              <p className="text-lg font-bold text-gray-900 mt-1">
                                {vital.fall_assessment || "N/A"}
                              </p>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">
                          Recorded: {vital.recorded_at ? new Date(vital.recorded_at).toLocaleString() : "N/A"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {consultation.prescriptions?.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-purple-100 rounded-lg">
                  <FaPills className="text-xl text-purple-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900">Medication Plan</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {consultation.prescriptions.map((prescription, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-5 rounded-2xl shadow-lg border border-gray-100"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="max-w-[70%]">
                        <h3 className="font-semibold text-gray-800 truncate text-lg">
                          {prescription.brand_name || "Unnamed Medication"}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">{prescription.generic_name}</p>
                      </div>
                      <span className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full text-xs font-semibold">
                        {prescription.duration_en || "No duration"}
                      </span>
                    </div>
                    <div className="grid gap-3 text-sm">
                      <div>
                        <label className="text-gray-500">Dosage:</label>
                        <p className="text-gray-900">{prescription.dosage_en || "N/A"}</p>
                        <p className="text-gray-600 font-urdu">{prescription.dosage_urdu}</p>
                      </div>
                      <div>
                        <label className="text-gray-500">Frequency:</label>
                        <p className="text-gray-900">{prescription.frequency_en || "N/A"}</p>
                        <p className="text-gray-600 font-urdu">{prescription.frequency_urdu}</p>
                      </div>
                      <div>
                        <label className="text-gray-500">Instructions:</label>
                        <p className="text-gray-900">{prescription.instructions_en || "N/A"}</p>
                        <p className="text-gray-600 font-urdu">{prescription.instructions_urdu}</p>
                      </div>
                      <div className="pt-3 border-t border-gray-100">
                        <label className="text-gray-500">Prescribed On:</label>
                        <p className="text-gray-600">
                          {prescription.prescribed_at
                            ? new Date(prescription.prescribed_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {(consultation.cranial_nerves ||
            consultation.motor_function ||
            consultation.muscle_strength ||
            consultation.muscle_tone ||
            consultation.coordination ||
            consultation.deep_tendon_reflexes ||
            consultation.gait_assessment ||
            consultation.romberg_test ||
            consultation.plantar_reflex ||
            consultation.straight_leg_raise_test ||
            consultation.brudzinski_sign ||
            consultation.kernig_sign ||
            consultation.mmse_score ||
            consultation.gcs_score ||
            consultation.power ||
            consultation.notes) && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-blue-100 rounded-lg">
                  <FaBrain className="text-xl text-blue-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900">Neurological Examination Findings</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(consultation.cranial_nerves || consultation.notes) && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h5 className="font-medium text-blue-800 mb-2">Cranial Nerve Assessment</h5>
                    <div className="space-y-2">
                      {consultation.cranial_nerves && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Cranial Nerves:</span>
                          <span className="font-medium text-gray-800">{consultation.cranial_nerves}</span>
                        </div>
                      )}
                      {consultation.notes && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Clinical Notes:</span>
                          <span className="font-medium text-gray-800">{consultation.notes}</span>
                        </div>
                      )}
                      {consultation.power && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Power Notes:</span>
                          <span className="font-medium text-gray-800">{consultation.power}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {(consultation.motor_function ||
                  consultation.muscle_strength ||
                  consultation.muscle_tone ||
                  consultation.coordination ||
                  consultation.deep_tendon_reflexes) && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h5 className="font-medium text-green-800 mb-2">Motor Function Assessment</h5>
                    <div className="space-y-2">
                      {consultation.motor_function && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Motor Function:</span>
                          <span className="font-medium text-gray-800">{consultation.motor_function}</span>
                        </div>
                      )}
                      {consultation.muscle_strength && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Muscle Strength:</span>
                          <span className="font-medium text-gray-800">{consultation.muscle_strength}</span>
                        </div>
                      )}
                      {consultation.muscle_tone && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Muscle Tone:</span>
                          <span className="font-medium text-gray-800">{consultation.muscle_tone}</span>
                        </div>
                      )}
                      {consultation.coordination && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Coordination:</span>
                          <span className="font-medium text-gray-800">{consultation.coordination}</span>
                        </div>
                      )}
                      {consultation.deep_tendon_reflexes && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Deep Tendon Reflexes:</span>
                          <span className="font-medium text-gray-800">
                            {consultation.deep_tendon_reflexes}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {(consultation.gait_assessment ||
                  consultation.romberg_test ||
                  consultation.plantar_reflex ||
                  consultation.straight_leg_raise_test) && (
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h5 className="font-medium text-orange-800 mb-2">Special Tests</h5>
                    <div className="space-y-2">
                      {consultation.gait_assessment && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Gait Assessment:</span>
                          <span className="font-medium text-gray-800">{consultation.gait_assessment}</span>
                        </div>
                      )}
                      {consultation.romberg_test && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Romberg Test:</span>
                          <span className="font-medium text-gray-800">{consultation.romberg_test}</span>
                        </div>
                      )}
                      {consultation.plantar_reflex && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Plantar Reflex:</span>
                          <span className="font-medium text-gray-800">{consultation.plantar_reflex}</span>
                        </div>
                      )}
                      {consultation.straight_leg_raise_test && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Straight Leg Raise Test:</span>
                          <span className="font-medium text-gray-800">
                            {consultation.straight_leg_raise_test}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {(consultation.brudzinski_sign ||
                  consultation.kernig_sign ||
                  consultation.mmse_score ||
                  consultation.gcs_score) && (
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h5 className="font-medium text-purple-800 mb-2">Additional Assessments</h5>
                    <div className="space-y-2">
                      {consultation.brudzinski_sign !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Brudzinski's Sign:</span>
                          <span className="font-medium text-gray-800">
                            {consultation.brudzinski_sign ? "Positive" : "Negative"}
                          </span>
                        </div>
                      )}
                      {consultation.kernig_sign !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Kernig's Sign:</span>
                          <span className="font-medium text-gray-800">
                            {consultation.kernig_sign ? "Positive" : "Negative"}
                          </span>
                        </div>
                      )}
                      {consultation.mmse_score && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">MMSE Score:</span>
                          <span className="font-medium text-gray-800">{consultation.mmse_score}</span>
                        </div>
                      )}
                      {consultation.gcs_score && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">GCS Score:</span>
                          <span className="font-medium text-gray-800">{consultation.gcs_score}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
);

const PatientSearch = () => {
  const [state, setState] = useState({
    patient: null,
    patientsList: [],
    consultations: [],
    showAddPatient: false,
    isSearching: false,
    isAddingConsultation: false,
    searchedMobile: "",
    searchedName: "",
    expandedSections: {},
    page: 1,
  });
  const consultationsPerPage = 5; // Reduced for faster initial load
  const navigate = useNavigate();
  const location = useLocation();

  const updateState = (updates) => setState((prev) => ({ ...prev, ...updates }));

  const handleBackToHome = useCallback(() => navigate("/"), [navigate]);

  const debouncedSearch = useCallback(
    debounce(async (data) => {
      const searchInput = data.search.trim();
      if (!navigator.onLine) {
        toast.error("You are offline. Please check your network connection.");
        return;
      }

      if (!searchInput) {
        toast.error("Please enter a mobile number or name.");
        return;
      }

      updateState({
        isSearching: true,
        patient: null,
        patientsList: [],
        consultations: [],
        showAddPatient: false,
        expandedSections: {},
      });

      const isMobile = /^[0-9]{11}$/.test(searchInput);
      const isName = /^[a-zA-Z\s]{1,50}$/.test(searchInput);
      updateState({
        searchedMobile: isMobile ? searchInput : "",
        searchedName: isName ? searchInput : "",
      });

      const cacheKey = `search:${searchInput}`;
      const cachedResult = cache.get(cacheKey);
      if (cachedResult) {
        updateState({
          patient: cachedResult.patient,
          consultations: cachedResult.consultations,
          isSearching: false,
        });
        navigate(`/patients/${cachedResult.patient.id || cachedResult.patient._id}`, { replace: true });
        return;
      }

      try {
        const query = new URLSearchParams();
        if (isMobile) query.append("mobile", searchInput);
        else if (isName) query.append("name", searchInput);
        else throw new Error("Invalid input format");

        const patientRes = await fetchWithRetry(
          "get",
          `/api/patients/search?${query.toString()}`,
          "patient-search",
          { timeout: 5000 }, // 5s timeout
          (data) => {
            if (!data?.success) throw new Error(data?.message || "Invalid search response");
            return data;
          }
        );

        if (patientRes.exists) {
          const patientData = patientRes.data;
          if (Array.isArray(patientData)) {
            updateState({ patientsList: patientData, isSearching: false });
            toast.info("Multiple patients found. Please select one.");
          } else {
            const patientId = patientData.id || patientData._id;
            if (!patientId) throw new Error("Patient ID not found in response");

            const historyRes = await fetchWithRetry(
              "get",
              `/api/patient-history/${patientId}?page=1&limit=${consultationsPerPage}`,
              "patient-history",
              { timeout: 5000 },
              (data) => (Array.isArray(data) ? data : [])
            );

            cache.set(cacheKey, { patient: patientData, consultations: historyRes }, 1000 * 60 * 15); // 15 min TTL
            updateState({
              patient: patientData,
              consultations: historyRes,
              isSearching: false,
            });
            navigate(`/patients/${patientId}`, { replace: true });
          }
        } else {
          updateState({ patient: null, patientsList: [], showAddPatient: true, isSearching: false });
          toast.info("No patients found. You can add a new patient.");
        }
      } catch (error) {
        console.error("Search error:", {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          searchInput,
        });
        const errorMessage =
          error.response?.status === 400
            ? error.response.data.message
            : error.response?.status === 500
            ? "Server error. Please try again or contact support."
            : error.response?.status === 503
            ? "Database connection error. Please try again."
            : error.message || "Failed to fetch patient. Please try again.";
        toast.error(errorMessage);
        updateState({ isSearching: false });
      }
    }, 300),
    [navigate]
  );

  const handlePatientSelect = useCallback(
    async (selectedPatient) => {
      updateState({ isSearching: true, patientsList: [] });
      try {
        const patientId = selectedPatient.id || selectedPatient._id;
        const cacheKey = `patient:${patientId}`;
        const cachedResult = cache.get(cacheKey);
        if (cachedResult) {
          updateState({
            patient: cachedResult.patient,
            consultations: cachedResult.consultations,
            isSearching: false,
          });
          navigate(`/patients/${patientId}`, { replace: true });
          return;
        }

        const [patientRes, historyRes] = await Promise.all([
          fetchWithRetry(
            "get",
            `/api/patients/${patientId}`,
            "patient-by-id",
            { timeout: 5000 },
            (data) => {
              if (!data?.id && !data?._id) throw new Error("Invalid patient data");
              return data;
            }
          ),
          fetchWithRetry(
            "get",
            `/api/patient-history/${patientId}?page=1&limit=${consultationsPerPage}`,
            "patient-history",
            { timeout: 5000 },
            (data) => (Array.isArray(data) ? data : [])
          ),
        ]);

        cache.set(cacheKey, { patient: patientRes, consultations: historyRes }, 1000 * 60 * 15);
        updateState({
          patient: patientRes,
          consultations: historyRes,
          isSearching: false,
        });
        navigate(`/patients/${patientId}`, { replace: true });
      } catch (error) {
        console.error("Error loading selected patient:", {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });
        toast.error("Failed to load patient details. Please try again.");
        updateState({ isSearching: false });
      }
    },
    [navigate]
  );

  const loadMoreConsultations = useCallback(async () => {
    updateState({ isSearching: true });
    try {
      const patientId = state.patient.id || state.patient._id;
      const historyRes = await fetchWithRetry(
        "get",
        `/api/patient-history/${patientId}?page=${state.page + 1}&limit=${consultationsPerPage}`,
        "patient-history",
        { timeout: 5000 },
        (data) => (Array.isArray(data) ? data : [])
      );
      updateState({
        consultations: [...state.consultations, ...historyRes],
        page: state.page + 1,
        isSearching: false,
      });
    } catch (error) {
      console.error("Error loading more consultations:", error);
      toast.error("Failed to load more consultations.");
      updateState({ isSearching: false });
    }
  }, [state.patient, state.consultations, state.page]);

  useEffect(() => {
    const loadPatientFromURL = async () => {
      const pathParts = location.pathname.split("/");
      const patientId = pathParts[2];

      if (pathParts[1] === "patients" && patientId && patientId !== "new") {
        const cacheKey = `patient:${patientId}`;
        const cachedResult = cache.get(cacheKey);
        if (cachedResult) {
          updateState({
            patient: cachedResult.patient,
            consultations: cachedResult.consultations,
            isSearching: false,
          });
          return;
        }

        try {
          updateState({ isSearching: true });
          const [patientRes, historyRes] = await Promise.all([
            fetchWithRetry(
              "get",
              `/api/patients/${patientId}`,
              "patient-by-id",
              { timeout: 5000 },
              (data) => {
                if (!data?.id && !data?._id) throw new Error("Invalid patient data");
                return data;
              }
            ),
            fetchWithRetry(
              "get",
              `/api/patient-history/${patientId}?page=1&limit=${consultationsPerPage}`,
              "patient-history",
              { timeout: 5000 },
              (data) => (Array.isArray(data) ? data : [])
            ),
          ]);

          cache.set(cacheKey, { patient: patientRes, consultations: historyRes }, 1000 * 60 * 15);
          updateState({
            patient: patientRes,
            consultations: historyRes,
            isSearching: false,
          });
        } catch (error) {
          console.error("Error loading patient from URL:", {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            code: error.code,
          });
          toast.error(
            error.response?.status === 500
              ? "Server error loading patient. Please try again."
              : "Failed to load patient from URL"
          );
          updateState({ isSearching: false });
        }
      } else if (pathParts[1] === "patients" && pathParts[2] === "new") {
        const urlParams = new URLSearchParams(location.search);
        const mobile = urlParams.get("mobile");
        const name = urlParams.get("name");
        if (mobile || name) {
          updateState({
            searchedMobile: mobile || "",
            searchedName: name || "",
            showAddPatient: true,
            isSearching: false,
          });
        }
      } else if (pathParts[1] === "") {
        updateState({
          patient: null,
          patientsList: [],
          consultations: [],
          showAddPatient: false,
          expandedSections: {},
          isSearching: false,
        });
      }
    };
    loadPatientFromURL();
  }, [location, navigate]);

  const handleNewPatientAdded = useCallback(
    (patientId) => {
      console.log("PatientSearch - New patient added with ID:", patientId);
      updateState({ showAddPatient: false });
      navigate(`/patients/${patientId}/consultations/new`);
    },
    [navigate]
  );

  const handleAddConsultation = useCallback(() => {
    updateState({ isAddingConsultation: true });
    const patientId = state.patient.id || state.patient._id;
    setTimeout(() => {
      navigate(`/patients/${patientId}/consultations/new`);
    }, 500);
  }, [navigate, state.patient]);

  const handleEditClick = useCallback(
    (consultationId) => navigate(`/patients/${state.patient.id || state.patient._id}/consultations/${consultationId}/edit`),
    [navigate, state.patient]
  );

  const toggleSection = useCallback(
    (index) => updateState({ expandedSections: { ...state.expandedSections, [index]: !state.expandedSections[index] } }),
    [state.expandedSections]
  );

  const filteredConsultations = useMemo(
    () => state.consultations.filter((c) => c.visit_date && new Date(c.visit_date).getFullYear() > 1970),
    [state.consultations]
  );

  return (
    <CustomErrorBoundary navigate={navigate}>
      <div className="min-h-screen p-8 relative overflow-hidden isolate w-[90vw] mx-auto before:absolute before:inset-0 before:bg-gradient-to-br before:from-white before:-z-10">
        {state.isSearching && <FullPageLoader message="Searching patient records..." />}
        {state.isAddingConsultation && <FullPageLoader message="Loading new consultation..." />}

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mx-auto max-w-6xl rounded-2xl border border-white bg-white/95 backdrop-blur-sm p-8 shadow-2xl shadow-gray-100/30"
        >
          <h2 className="mb-6 border-b border-gray-200 pb-4 text-2xl font-bold text-gray-900">
            <span className="bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">
              Patient Consultation Portal
            </span>
          </h2>

          {!state.patient && state.patientsList.length === 0 && !state.showAddPatient && (
            <PatientSearchForm onSearch={debouncedSearch} isSearching={state.isSearching} />
          )}

          {state.patientsList.length > 0 && (
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Multiple Patients Found</h3>
              <p className="text-sm text-gray-600 mb-6">Please select a patient from the list below:</p>
              <div className="space-y-4">
                {state.patientsList.map((p) => (
                  <motion.div
                    key={p.id || p._id}
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-200 cursor-pointer"
                    onClick={() => handlePatientSelect(p)}
                  >
                    <div>
                      <p className="font-semibold text-gray-800">{p.name || "Unknown"}</p>
                      <p className="text-sm text-gray-600">{p.mobile || "No mobile"}</p>
                    </div>
                    <FaEye className="text-blue-600 text-xl" />
                  </motion.div>
                ))}
              </div>
              <button
                onClick={() => updateState({ patientsList: [], showAddPatient: true })}
                className="mt-4 text-blue-600 hover:text-blue-800 font-semibold"
              >
                Add New Patient
              </button>
            </div>
          )}

          {state.patient && (
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-blue-50/80 to-purple-50/80 p-8 rounded-2xl border border-white/20 shadow-xl backdrop-blur-sm">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBackToHome}
                  className="mb-6 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold transition-colors duration-200 shadow-sm hover:shadow-md cursor-pointer"
                >
                  <FaArrowLeft className="text-lg" />
                  Back to Home
                </motion.button>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-5 mb-8"
                >
                  <motion.div
                    whileHover={{ scale: 1.05, rotate: -5 }}
                    className="p-4 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-xl shadow-lg"
                  >
                    <FaStethoscope className="text-2xl" />
                  </motion.div>
                  <div>
                    <p className="text-sm font-medium text-purple-600 mb-1">Medical Record</p>
                    <h3 className="text-2xl font-bold text-gray-800 tracking-tight">Patient Profile</h3>
                  </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  {[
                    { label: "Patient ID", value: state.patient.id || state.patient._id, icon: FaIdCard },
                    { label: "Full Name", value: state.patient.name || "Unknown", icon: FaUser },
                    { label: "Mobile", value: state.patient.mobile || "N/A", icon: FaPhone },
                  ].map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group bg-white/95 p-5 rounded-xl shadow-sm border border-white transition-all hover:border-purple-100 hover:shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                          <item.icon className="text-lg" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 tracking-wide mb-1">
                            {item.label}
                          </p>
                          <p className="text-lg font-semibold text-gray-800">{item.value}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center">
                  <motion.button
                    whileHover={{
                      scale: 1.02,
                      background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                      boxShadow: "0 4px 14px rgba(124, 58, 237, 0.25)",
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddConsultation}
                    disabled={state.isAddingConsultation}
                    className={`relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl shadow-lg transition-all flex items-center gap-3 w-full md:w-auto justify-center overflow-hidden cursor-pointer ${
                      state.isAddingConsultation ? "opacity-80 cursor-not-allowed" : ""
                    }`}
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity">
                      <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white/30 opacity-40 animate-shine" />
                    </div>
                    {state.isAddingConsultation ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <FaSpinner className="w-5 h-5 text-white" />
                      </motion.div>
                    ) : (
                      <FaPlus className="w-5 h-5 text-white" />
                    )}
                    <span className="font-semibold tracking-wide">New Consultation</span>
                  </motion.button>
                </motion.div>
              </div>

              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-purple-600 text-white rounded-lg">
                    <FaCalendarAlt className="text-2xl" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">Consultation History</h3>
                </div>

                {filteredConsultations.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <p className="text-gray-500 text-lg">No previous consultations found</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {filteredConsultations.map((consultation, index) => (
                      <ConsultationItem
                        key={index}
                        consultation={consultation}
                        index={index}
                        toggleSection={toggleSection}
                        expandedSections={state.expandedSections}
                        handleEditClick={handleEditClick}
                        patient={state.patient}
                      />
                    ))}
                    {state.consultations.length >= state.page * consultationsPerPage && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={loadMoreConsultations}
                        className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
                      >
                        Load More
                      </motion.button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {state.showAddPatient && !state.patient && state.patientsList.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white p-8 rounded-xl border border-gray-100 shadow-xs"
            >
              <AddPatientForm
                searchedMobile={state.searchedMobile}
                searchedName={state.searchedName}
                onSuccess={handleNewPatientAdded}
              />
            </motion.div>
          )}
        </motion.div>
        <ToastContainer position="bottom-right" />
      </div>
    </CustomErrorBoundary>
  );
};

export default PatientSearch;
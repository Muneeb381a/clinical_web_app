import { useState, useEffect } from "react";
import axios from "axios";
import {
  FaTimes,
  FaNotesMedical,
  FaCalendarAlt,
  FaStethoscope,
  FaPills,
  FaFlask,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import { MdOutlineFilterList } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";

const PatientHistory = ({ patientId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (index) => {
    setExpandedSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const fetchHistory = async () => {
    if (!patientId) {
      setError("Patient ID is required");
      return;
    }

    setFilterDate("");
    setLoading(true);
    setError("");

    try {
      console.log(`Fetching history for patient ID: ${patientId}`);
      const response = await axios.get(
        `https://patient-management-backend-nine.vercel.app/api/patient-history/${patientId}`,
        { timeout: 10000 }
      );
      console.log("API Response:", response.data);

      if (!Array.isArray(response.data)) {
        setHistory([response.data]);
      } else {
        setHistory(response.data);
      }
      setShowModal(true);
    } catch (err) {
      console.error("Error fetching patient history:", err);
      setError(`Failed to fetch patient history: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("Updated history:", history);
  }, [history]);

  return (
    <div className="shadow-xl rounded-xl max-w-4xl">
      <button
        onClick={fetchHistory}
        className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-6 py-3 rounded-xl font-bold hover:from-teal-700 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
        disabled={loading}
      >
        {loading ? (
          <svg
            className="w-5 h-5 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4l3.5-3.5L12 0V4a8 8 0 018 8h-4l3.5 3.5L20 12h-4a8 8 0 01-8 8v-4l-3.5 3.5L4 20v-4a8 8 0 01-8-8h4z"
            ></path>
          </svg>
        ) : (
          <FaNotesMedical className="text-lg" />
        )}
        {loading ? "Loading History..." : "View Medical History"}
      </button>

      {error && (
        <p className="text-center text-red-600 mt-4 font-medium">{error}</p>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            div
            className="fixed inset-0 z-1000 flex justify-center items-start pt-20 backdrop-blur-md bg-opacity-50"
          >
            <motion.div
              initial={{ y: -20, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: -20, scale: 0.95 }}
              className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto relative"
            >
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text">
                    Medical History
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {patientId} • {history.length} records found
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                >
                  <FaTimes className="text-2xl text-gray-500 hover:text-red-600" />
                </button>
              </div>

              <div className="mb-6 bg-teal-50 p-4 rounded-lg flex items-center gap-4">
                <MdOutlineFilterList className="text-2xl text-teal-600" />
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="border border-teal-200 bg-white px-4 py-2 rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
                {filterDate && (
                  <button
                    onClick={() => setFilterDate("")}
                    className="ml-2 px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    Clear Filter
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <div className="text-center py-8">
                  <div className="inline-block p-4 bg-gray-100 rounded-full">
                    <FaNotesMedical className="text-4xl text-gray-400" />
                  </div>
                  <p className="mt-4 text-gray-500 font-medium">
                    No medical history records found for this patient.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {history
                    .filter(
                      (record) =>
                        !filterDate || record.visit_date.startsWith(filterDate)
                    )
                    .map((record, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-teal-100 rounded-lg">
                              <FaCalendarAlt className="text-teal-600 text-xl" />
                            </div>
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900">
                                {new Date(record.visit_date).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  }
                                )}
                              </h3>
                              {record.follow_up_date && (
                                <p className="text-sm text-gray-500 mt-1">
                                  Follow-up:{" "}
                                  {new Date(
                                    record.follow_up_date
                                  ).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => toggleSection(index)}
                            className="text-gray-500 hover:text-teal-600 p-2 rounded-lg"
                          >
                            {expandedSections[index] ? (
                              <FaChevronUp />
                            ) : (
                              <FaChevronDown />
                            )}
                          </button>
                        </div>

                        {expandedSections[index] && (
                          <div className="space-y-6 pt-4 border-t border-gray-100">
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <FaNotesMedical className="text-gray-600" />
                                <h4 className="font-semibold text-gray-900">
                                  Diagnosis & Symptoms
                                </h4>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                  <label className="text-sm font-medium text-gray-500">
                                    Diagnosis
                                  </label>
                                  <p className="mt-1 text-gray-900">
                                    {record.diagnosis || "Not specified"}
                                  </p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                  <label className="text-sm font-medium text-gray-500">
                                    Symptoms
                                  </label>
                                  <p className="mt-1 text-gray-900">
                                    {record.symptoms
                                      ?.filter(Boolean)
                                      .join(", ") || "No symptoms recorded"}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="bg-white border-2 border-gray-200 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex flex-col md:gap-4">
                                {/* Title with icon */}
                                <div className="inline-flex items-center gap-2 mb-2 md:mb-0">
                                  <FaFlask className="w-5 h-5 text-blue-600" />{" "}
                                  {/* Add your preferred icon */}
                                  <span className="text-base font-semibold text-gray-700">
                                    Prescribed Tests
                                  </span>
                                </div>

                                {/* Tests list */}
                                <div className="flex-1">
                                  <p className="text-gray-800 font-medium leading-relaxed">
                                    {record.tests?.length > 0 ? (
                                      <span className="inline-flex flex-wrap gap-2">
                                        {record.tests.map((test) => (
                                          <span
                                            key={test.test_id}
                                            className="px-3 py-1 bg-blue-50 text-blue-800 rounded-full text-sm"
                                          >
                                            {test.test_name}
                                          </span>
                                        ))}
                                      </span>
                                    ) : (
                                      <span className="text-gray-500 italic">
                                        No tests prescribed
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                            {record.prescriptions.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-3">
                                  <FaPills className="text-purple-600" />
                                  <h4 className="font-semibold text-gray-900">
                                    Prescriptions
                                  </h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {record.prescriptions.map(
                                    (prescription, idx) => (
                                      <div
                                        key={idx}
                                        className="bg-purple-50 p-4 rounded-lg"
                                      >
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <h5 className="font-medium text-purple-800">
                                              {prescription.brand_name}
                                            </h5>
                                            <p className="text-sm text-purple-600">
                                              {prescription.generic_name}
                                            </p>
                                          </div>
                                          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                                            {prescription.duration_en}
                                          </span>
                                        </div>
                                        <div className="mt-2 text-sm text-gray-600">
                                          <p>{prescription.dosage_en}</p>
                                          <p>{prescription.frequency_en}</p>
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}

                            {(record.cranial_nerves ||
                              record.motor_function ||
                              record.muscle_strength ||
                              record.muscle_tone ||
                              record.coordination ||
                              record.sensory_examination ||
                              record.pain_sensation ||
                              record.proprioception ||
                              record.vibration_sense ||
                              record.romberg_test ||
                              record.gait_assessment ||
                              record.diagnosis ||
                              record.tremors ||
                              record.speech_assessment) && (
                              <div className="mt-6 pt-4 border-t border-gray-100">
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="p-2.5 bg-blue-100 rounded-lg">
                                    <FaStethoscope className="text-xl text-blue-600" />
                                  </div>
                                  <h4 className="text-lg font-semibold text-gray-900">
                                    Neurological Examination Findings
                                  </h4>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Cranial Nerve Assessment */}
                                  {(record.cranial_nerves ||
                                    record.speech_assessment) && (
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                      <h5 className="font-medium text-blue-800 mb-2">
                                        Cranial Nerve Assessment
                                      </h5>
                                      <div className="space-y-2">
                                        {record.cranial_nerves && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">
                                              Cranial Nerves:
                                            </span>
                                            <span className="font-medium text-gray-800">
                                              {record.cranial_nerves}
                                            </span>
                                          </div>
                                        )}
                                        {record.diagnosis && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">
                                              Diagnosis:
                                            </span>
                                            <span className="font-medium text-gray-800">
                                              {record.diagnosis}
                                            </span>
                                          </div>
                                        )}
                                        {record.speech_assessment && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">
                                              Speech Assessment:
                                            </span>
                                            <span className="font-medium text-gray-800">
                                              {record.speech_assessment}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Motor Function */}
                                  {(record.motor_function ||
                                    record.muscle_strength ||
                                    record.muscle_tone) && (
                                    <div className="bg-green-50 p-4 rounded-lg">
                                      <h5 className="font-medium text-green-800 mb-2">
                                        Motor Function
                                      </h5>
                                      <div className="space-y-2">
                                        {record.motor_function && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">
                                              Motor Function:
                                            </span>
                                            <span className="font-medium text-gray-800">
                                              {record.motor_function}
                                            </span>
                                          </div>
                                        )}
                                        {record.muscle_strength && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">
                                              Muscle Strength:
                                            </span>
                                            <span className="font-medium text-gray-800">
                                              {record.muscle_strength}
                                            </span>
                                          </div>
                                        )}
                                        {record.muscle_tone && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">
                                              Muscle Tone:
                                            </span>
                                            <span className="font-medium text-gray-800">
                                              {record.muscle_tone}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Sensory Examination */}
                                  {(record.sensory_examination ||
                                    record.pain_sensation ||
                                    record.proprioception ||
                                    record.vibration_sense) && (
                                    <div className="bg-purple-50 p-4 rounded-lg">
                                      <h5 className="font-medium text-purple-800 mb-2">
                                        Sensory Examination
                                      </h5>
                                      <div className="space-y-2">
                                        {record.sensory_examination && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">
                                              Sensory Exam:
                                            </span>
                                            <span className="font-medium text-gray-800">
                                              {record.sensory_examination}
                                            </span>
                                          </div>
                                        )}
                                        {record.pain_sensation && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">
                                              Pain Sensation:
                                            </span>
                                            <span
                                              className={`badge ${
                                                record.pain_sensation
                                                  ? "bg-green-100 text-green-800"
                                                  : "bg-red-100 text-red-800"
                                              }`}
                                            >
                                              {record.pain_sensation
                                                ? "Present"
                                                : "Absent"}
                                            </span>
                                          </div>
                                        )}
                                        {record.proprioception && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">
                                              Proprioception:
                                            </span>
                                            <span
                                              className={`badge ${
                                                record.proprioception
                                                  ? "bg-green-100 text-green-800"
                                                  : "bg-red-100 text-red-800"
                                              }`}
                                            >
                                              {record.proprioception
                                                ? "Intact"
                                                : "Impaired"}
                                            </span>
                                          </div>
                                        )}
                                        {record.vibration_sense && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">
                                              Vibration Sense:
                                            </span>
                                            <span
                                              className={`badge ${
                                                record.vibration_sense
                                                  ? "bg-green-100 text-green-800"
                                                  : "bg-red-100 text-red-800"
                                              }`}
                                            >
                                              {record.vibration_sense
                                                ? "Present"
                                                : "Absent"}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Coordination & Gait */}
                                  {(record.coordination ||
                                    record.romberg_test ||
                                    record.gait_assessment ||
                                    record.tremors) && (
                                    <div className="bg-amber-50 p-4 rounded-lg">
                                      <h5 className="font-medium text-amber-800 mb-2">
                                        Coordination & Gait
                                      </h5>
                                      <div className="space-y-2">
                                        {record.coordination && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">
                                              Coordination:
                                            </span>
                                            <span className="font-medium text-gray-800">
                                              {record.coordination}
                                            </span>
                                          </div>
                                        )}
                                        {record.romberg_test && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">
                                              Romberg Test:
                                            </span>
                                            <span className="font-medium text-gray-800">
                                              {record.romberg_test}
                                            </span>
                                          </div>
                                        )}
                                        {record.gait_assessment && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">
                                              Gait Assessment:
                                            </span>
                                            <span className="font-medium text-gray-800">
                                              {record.gait_assessment}
                                            </span>
                                          </div>
                                        )}
                                        {record.tremors && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">
                                              Tremors:
                                            </span>
                                            <span
                                              className={`badge ${
                                                record.tremors
                                                  ? "bg-green-100 text-green-800"
                                                  : "bg-red-100 text-red-800"
                                              }`}
                                            >
                                              {record.tremors
                                                ? "Present"
                                                : "Absent"}
                                            </span>
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
                    ))}
                </div>
              )}

              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors duration-200"
                >
                  Close History
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PatientHistory;

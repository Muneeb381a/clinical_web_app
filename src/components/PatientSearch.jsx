import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import PatientSearchForm from "./PatientSearchForm";
import AddPatientForm from "../pages/AddPatientForm";
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
  FaFilePdf,
} from "react-icons/fa";
import { motion } from "framer-motion";
import PrescriptionButton from "./PrescriptionButton";

const PatientSearch = () => {
  const [patient, setPatient] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isAddingConsultation, setIsAddingConsultation] = useState(false); // New state for Add Consultation loader
  const [searchedMobile, setSearchedMobile] = useState("");
  const [expandedSections, setExpandedSections] = useState({});
  const navigate = useNavigate();

  const FullPageLoader = ({ message = "Processing your request" }) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-gradient-to-br from-white/95 to-blue-50/95 backdrop-blur-lg flex items-center justify-center"
    >
      <div className="text-center space-y-6">
        <motion.div
          className="relative mx-auto w-20 h-20"
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{
            rotate: {
              repeat: Infinity,
              duration: 1.8,
              ease: "linear",
            },
            scale: {
              repeat: Infinity,
              duration: 2,
              ease: "easeInOut",
            },
          }}
        >
          <div className="absolute inset-0 border-4 border-blue-100 rounded-full" />
          <motion.div
            className="absolute inset-0 border-t-4 border-b-4 border-blue-600 rounded-full"
            animate={{
              rotate: [0, 180],
              opacity: [0.8, 1],
            }}
            transition={{
              rotate: {
                repeat: Infinity,
                duration: 1.2,
                ease: "easeInOut",
              },
              opacity: {
                repeat: Infinity,
                duration: 1.5,
                ease: "easeInOut",
              },
            }}
          />
        </motion.div>

        <div className="space-y-3">
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-xl font-semibold text-gray-800 tracking-wide"
          >
            {message}
          </motion.p>
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-sm text-gray-500 font-medium flex items-center justify-center gap-1"
          >
            <motion.span
              animate={{ y: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              •
            </motion.span>
            <motion.span
              animate={{ y: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
            >
              •
            </motion.span>
            <motion.span
              animate={{ y: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}
            >
              •
            </motion.span>
          </motion.p>
        </div>

        <motion.div
          className="h-1 bg-blue-100 rounded-full max-w-[200px] mx-auto overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="h-full bg-blue-600 w-1/2"
            animate={{
              x: [-100, 200],
            }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      </div>
    </motion.div>
  );

  // const onSearch = async (data) => {
  //   if (!data.mobile.trim()) {
  //     toast.error("Please enter a valid mobile number.");
  //     return;
  //   }

  //   const mobile = data.mobile.trim();
  //   setIsSearching(true);
  //   setPatient(null);
  //   setConsultations([]);
  //   setShowAddPatient(false);
  //   setExpandedSections({});

  //   try {
  //     const patientRes = await axios.get(
  //       `https://patient-management-backend-nine.vercel.app/api/patients/search?mobile=${encodeURIComponent(
  //         mobile
  //       )}`
  //     );

  //     if (patientRes.data?.exists) {
  //       const patientData = patientRes.data.data;
  //       const patientId = patientData.id || patientData._id;
  //       setPatient(patientData);

  //       const historyRes = await axios.get(
  //         `https://patient-management-backend-nine.vercel.app/api/patient-history/${patientId}`,
  //         { timeout: 10000 }
  //       );
  //       setConsultations(
  //         Array.isArray(historyRes.data) ? historyRes.data : [historyRes.data]
  //       );
  //     } else {
  //       setPatient(null);
  //       setSearchedMobile(mobile);
  //       setShowAddPatient(true);
  //     }
  //   } catch (error) {
  //     console.error("Error fetching patient or history", error);
  //     toast.error(
  //       error.message || "Failed to fetch patient. Please try again."
  //     );
  //   } finally {
  //     setIsSearching(false);
  //   }
  // };

  // In your PatientSearch component, modify the onSearch function
  const onSearch = async (data) => {
    if (!data.mobile.trim()) {
      toast.error("Please enter a valid mobile number.");
      return;
    }

    const mobile = data.mobile.trim();
    setIsSearching(true);
    setPatient(null);
    setConsultations([]);
    setShowAddPatient(false);
    setExpandedSections({});

    try {
      const patientRes = await axios.get(
        `https://patient-management-backend-nine.vercel.app/api/patients/search?mobile=${encodeURIComponent(
          mobile
        )}`
      );

      if (patientRes.data?.exists) {
        const patientData = patientRes.data.data;
        const patientId = patientData.id || patientData._id;

        // Update URL here
        navigate(`/patients/${patientId}`, { replace: true });

        setPatient(patientData);

        const historyRes = await axios.get(
          `https://patient-management-backend-nine.vercel.app/api/patient-history/${patientId}`,
          { timeout: 10000 }
        );
        setConsultations(
          Array.isArray(historyRes.data) ? historyRes.data : [historyRes.data]
        );
      } else {
        setPatient(null);
        setSearchedMobile(mobile);
        setShowAddPatient(true);
      }
    } catch (error) {
      console.error("Error fetching patient or history", error);
      toast.error(
        error.message || "Failed to fetch patient. Please try again."
      );
    } finally {
      setIsSearching(false);
    }
  };

  // Update the useEffect to handle direct patient URLs
  useEffect(() => {
    const loadPatientFromURL = async () => {
      const pathParts = window.location.pathname.split("/");
      const patientId = pathParts[2];

      if (pathParts[1] === "patients" && patientId && patientId !== "new") {
        try {
          setIsSearching(true);
          const patientRes = await axios.get(
            `https://patient-management-backend-nine.vercel.app/api/patients/${patientId}`
          );

          if (patientRes.data) {
            setPatient(patientRes.data);
            const historyRes = await axios.get(
              `https://patient-management-backend-nine.vercel.app/api/patient-history/${patientId}`
            );
            setConsultations(
              Array.isArray(historyRes.data)
                ? historyRes.data
                : [historyRes.data]
            );
          }
        } catch (error) {
          console.error("Error loading patient from URL:", error);
          toast.error("Failed to load patient from URL");
        } finally {
          setIsSearching(false);
        }
      } else if (pathParts[1] === "patients" && pathParts[2] === "new") {
        const urlParams = new URLSearchParams(window.location.search);
        const mobile = urlParams.get("mobile");
        if (mobile) {
          setSearchedMobile(mobile);
          setShowAddPatient(true);
        }
      }
    };
    loadPatientFromURL();
  }, [navigate]); // Add navigate to dependency array

  const handleNewPatientAdded = () => onSearch({ mobile: searchedMobile });
  const handleAddConsultation = () => {
    setIsAddingConsultation(true); // Start loader
    const patientId = patient.id || patient._id;
    // Simulate navigation delay (remove setTimeout in production if navigation is instant)
    setTimeout(() => {
      navigate(`/patients/${patientId}/consultations/new`);
      // setIsAddingConsultation(false); // Reset in useEffect or on page load if needed
    }, 500); // Adjust delay as needed
  };
  const handleEditClick = (consultationId) =>
    navigate(
      `/patients/${
        patient.id || patient._id
      }/consultations/${consultationId}/edit`
    );
  const toggleSection = (index) =>
    setExpandedSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));

  useEffect(() => {
    const loadPatientFromURL = async () => {
      const pathParts = window.location.pathname.split("/");
      if (pathParts[1] === "patients" && pathParts[2] === "new") {
        const urlParams = new URLSearchParams(window.location.search);
        const mobile = urlParams.get("mobile");
        if (mobile) {
          setSearchedMobile(mobile);
          setShowAddPatient(true);
        }
      }
    };
    loadPatientFromURL();
  }, []);

  return (
    <div className="min-h-screen p-8 relative overflow-hidden isolate w-[90vw] mx-auto before:absolute before:inset-0 before:bg-gradient-to-br before:from-white before:-z-10">
      {isSearching && <FullPageLoader message="Searching patient records..." />}
      {isAddingConsultation && (
        <FullPageLoader message="Loading new consultation..." />
      )}

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

        {!patient && !showAddPatient && (
          <PatientSearchForm onSearch={onSearch} />
        )}

        {patient && (
          <div className="space-y-8">
            {/* Patient Profile Section */}
            <div className="bg-gradient-to-br from-blue-50/80 to-purple-50/80 p-8 rounded-2xl border border-white/20 shadow-xl backdrop-blur-sm">
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
                  <p className="text-sm font-medium text-purple-600 mb-1">
                    Medical Record
                  </p>
                  <h3 className="text-2xl font-bold text-gray-800 tracking-tight">
                    Patient Profile
                  </h3>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {[
                  {
                    label: "Patient ID",
                    value: patient.id || patient._id,
                    icon: FaIdCard,
                  },
                  {
                    label: "Full Name",
                    value: patient.name || "Unknown",
                    icon: FaUser,
                  },
                  {
                    label: "Mobile",
                    value: patient.mobile || "N/A",
                    icon: FaPhone,
                  },
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
                        <p className="text-lg font-semibold text-gray-800">
                          {item.value}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center"
              >
                <motion.button
                  whileHover={{
                    scale: 1.02,
                    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                    boxShadow: "0 4px 14px rgba(124, 58, 237, 0.25)",
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddConsultation}
                  disabled={isAddingConsultation}
                  className={`
        relative bg-gradient-to-r from-blue-600 to-purple-600 text-white 
        px-8 py-4 rounded-xl shadow-lg transition-all flex items-center gap-3
        w-full md:w-auto justify-center overflow-hidden
        ${isAddingConsultation ? "opacity-80 cursor-not-allowed" : ""}
      `}
                >
                  {/* Shine effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity">
                    <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white/30 opacity-40 animate-shine" />
                  </div>

                  {isAddingConsultation ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    >
                      <FaSpinner className="w-5 h-5 text-white" />
                    </motion.div>
                  ) : (
                    <FaPlus className="w-5 h-5 text-white" />
                  )}
                  <span className="font-semibold tracking-wide">
                    New Consultation
                  </span>
                </motion.button>
              </motion.div>
            </div>

            {/* Consultation History */}
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-purple-600 text-white rounded-lg">
                  <FaCalendarAlt className="text-2xl" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">
                  Consultation History
                </h3>
              </div>

              {consultations.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <p className="text-gray-500 text-lg">
                    No previous consultations found
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {consultations.map((consultation, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white p-6 rounded-xl shadow-xs border border-gray-100 hover:border-purple-100 transition-all"
                    >
                      {/* Consultation Header */}
                      <div className="flex flex-wrap gap-4 justify-between items-start pb-4 border-b border-gray-100">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-blue-50 rounded-xl">
                            <FaCalendarAlt className="text-xl text-blue-600" />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">
                              {new Date(
                                consultation.visit_date
                              ).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </h4>
                            {consultation.follow_up_date && (
                              <p className="text-sm text-gray-500 mt-1">
                                <span className="font-medium">Follow-up:</span>{" "}
                                {new Date(
                                  consultation.follow_up_date
                                ).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <PrescriptionButton
                            patient={patient}
                            consultation={consultation}
                          />
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => toggleSection(index)}
                            title="Toggle Details"
                          >
                            {expandedSections[index] ? (
                              <FaChevronUp className="text-blue-600 hover:text-blue-800 text-xl" />
                            ) : (
                              <FaEye className="text-blue-600 hover:text-blue-800 text-xl" />
                            )}
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() =>
                              handleEditClick(consultation.consultation_id)
                            }
                            title="Edit Consultation"
                          >
                            <FaEdit className="text-green-600 hover:text-green-800 text-xl" />
                          </motion.button>
                        </div>
                      </div>

                      {/* Consultation Details (Inline) */}
                      {expandedSections[index] && (
                        <div className="space-y-6 pt-4 border-t border-gray-100">
                          {/* Patient Information */}
                          <div>
                            <div className="flex items-center gap-2 mb-4">
                              <FaStethoscope className="text-gray-600" />
                              <h4 className="font-semibold text-gray-900">
                                Patient Information
                              </h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <label className="text-sm font-medium text-gray-500">
                                  Name
                                </label>
                                <p className="mt-2 text-gray-900">
                                  {consultation.patient_name || "Not specified"}
                                </p>
                              </div>
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <label className="text-sm font-medium text-gray-500">
                                  Mobile
                                </label>
                                <p className="mt-2 text-gray-900">
                                  {consultation.mobile || "Not specified"}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Diagnosis & Symptoms */}
                          <div>
                            <div className="flex items-center gap-2 mb-4">
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
                                <p className="mt-2 text-gray-900">
                                  {consultation.neuro_diagnosis ||
                                    "Not specified"}
                                </p>
                              </div>
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <label className="text-sm font-medium text-gray-500">
                                  Symptoms
                                </label>
                                <p className="mt-2 text-gray-900">
                                  {consultation.symptoms
                                    ?.filter(Boolean)
                                    .join(", ") || "No symptoms recorded"}
                                </p>
                              </div>
                              <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
                                <label className="text-sm font-medium text-gray-500">
                                  Treatment Plan
                                </label>
                                <p className="mt-2 text-gray-900">
                                  {consultation.neuro_treatment_plan ||
                                    "Not specified"}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Tests */}
                          <div>
                            <div className="flex items-center gap-3 mb-4">
                              <div className="p-2.5 bg-blue-100 rounded-lg">
                                <FaFlask className="text-xl text-blue-600" />
                              </div>
                              <h4 className="text-lg font-semibold text-gray-900">
                                Tests
                              </h4>
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
                                <span className="text-gray-500 italic">
                                  No tests prescribed
                                </span>
                              )}
                            </p>
                          </div>

                          {/* Vital Signs */}
                          {consultation.vital_signs?.length > 0 && (
                            <div className="mt-6 pt-4 border-t border-gray-100">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 bg-red-100 rounded-lg">
                                  <FaHeartbeat className="text-xl text-red-600" />
                                </div>
                                <h4 className="text-lg font-semibold text-gray-900">
                                  Vital Signs
                                </h4>
                              </div>
                              <div className="overflow-x-auto pb-4">
                                <div className="flex gap-2 min-w-max">
                                  {consultation.vital_signs.map(
                                    (vital, idx) => (
                                      <div
                                        key={idx}
                                        className="bg-white p-4 border-b border-gray-100 transition-all min-w-[300px]"
                                      >
                                        <div className="flex flex-col gap-3">
                                          <div className="flex gap-2">
                                            <div className="flex items-center justify-center gap-2 p-2 bg-red-50 rounded-lg flex-1 min-w-[150px]">
                                              <FaHeartbeat className="text-red-600" />
                                              <div>
                                                <p className="text-xs font-medium text-red-700">
                                                  BP
                                                </p>
                                                <p className="text-lg font-bold text-gray-900">
                                                  {vital.blood_pressure ||
                                                    "N/A"}
                                                  <span className="text-xs text-gray-500 ml-1">
                                                    mmHg
                                                  </span>
                                                </p>
                                              </div>
                                            </div>
                                            <div className="flex items-center justify-center gap-2 p-2 bg-blue-50 rounded-lg flex-1 min-w-[110px]">
                                              <FaHeartbeat className="text-blue-600" />
                                              <div>
                                                <p className="text-xs font-medium text-blue-700">
                                                  Pulse
                                                </p>
                                                <p className="text-lg font-bold text-gray-900">
                                                  {vital.pulse_rate || "N/A"}
                                                  <span className="text-xs text-gray-500 ml-1">
                                                    bpm
                                                  </span>
                                                </p>
                                              </div>
                                            </div>
                                            <div className="flex items-center justify-center gap-2 p-2 bg-orange-50 rounded-lg flex-1 min-w-[110px]">
                                              <FaThermometer className="text-orange-600" />
                                              <div>
                                                <p className="text-xs font-medium text-orange-700">
                                                  Temp
                                                </p>
                                                <p className="text-lg font-bold text-gray-900">
                                                  {vital.temperature || "N/A"}
                                                  <span className="text-xs text-gray-500 ml-1">
                                                    °C
                                                  </span>
                                                </p>
                                              </div>
                                            </div>
                                            <div className="flex items-center justify-center gap-2 p-2 bg-green-50 rounded-lg flex-1 min-w-[110px]">
                                              <FaLungs className="text-green-600" />
                                              <div>
                                                <p className="text-xs font-medium text-green-700">
                                                  SpO₂
                                                </p>
                                                <p className="text-lg font-bold text-gray-900">
                                                  {vital.spo2_level || "N/A"}
                                                  <span className="text-xs text-gray-500 ml-1">
                                                    %
                                                  </span>
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                          <p className="text-xs text-gray-500">
                                            Recorded:{" "}
                                            {vital.recorded_at
                                              ? new Date(
                                                  vital.recorded_at
                                                ).toLocaleString()
                                              : "N/A"}
                                          </p>
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Prescriptions */}
                          {consultation.prescriptions?.length > 0 && (
                            <div className="mt-6 pt-4 border-t border-gray-100">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 bg-purple-100 rounded-lg">
                                  <FaPills className="text-xl text-purple-600" />
                                </div>
                                <h4 className="text-lg font-semibold text-gray-900">
                                  Medication Plan
                                </h4>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {consultation.prescriptions.map(
                                  (prescription, idx) => (
                                    <div
                                      key={idx}
                                      className="bg-white p-5 rounded-2xl shadow-lg border border-gray-100"
                                    >
                                      <div className="flex justify-between items-start mb-4">
                                        <div className="max-w-[70%]">
                                          <h3 className="font-semibold text-gray-800 truncate text-lg">
                                            {prescription.brand_name ||
                                              "Unnamed Medication"}
                                          </h3>
                                          <p className="text-sm text-gray-500 truncate">
                                            {prescription.generic_name}
                                          </p>
                                        </div>
                                        <span className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full text-xs font-semibold">
                                          {prescription.duration_en ||
                                            "No duration"}
                                        </span>
                                      </div>
                                      <div className="grid gap-3 text-sm">
                                        <div>
                                          <label className="text-gray-500">
                                            Dosage:
                                          </label>
                                          <p className="text-gray-900">
                                            {prescription.dosage_en || "N/A"}
                                          </p>
                                          <p className="text-gray-600 font-urdu">
                                            {prescription.dosage_urdu}
                                          </p>
                                        </div>
                                        <div>
                                          <label className="text-gray-500">
                                            Frequency:
                                          </label>
                                          <p className="text-gray-900">
                                            {prescription.frequency_en || "N/A"}
                                          </p>
                                          <p className="text-gray-600 font-urdu">
                                            {prescription.frequency_urdu}
                                          </p>
                                        </div>
                                        <div>
                                          <label className="text-gray-500">
                                            Instructions:
                                          </label>
                                          <p className="text-gray-900">
                                            {prescription.instructions_en ||
                                              "N/A"}
                                          </p>
                                          <p className="text-gray-600 font-urdu">
                                            {prescription.instructions_urdu}
                                          </p>
                                        </div>
                                        <div className="pt-3 border-t border-gray-100">
                                          <label className="text-gray-500">
                                            Prescribed On:
                                          </label>
                                          <p className="text-gray-600">
                                            {prescription.prescribed_at
                                              ? new Date(
                                                  prescription.prescribed_at
                                                ).toLocaleDateString("en-US", {
                                                  month: "short",
                                                  day: "numeric",
                                                  year: "numeric",
                                                })
                                              : "N/A"}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                          {/* Neurological Examination Findings */}
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
                            consultation.notes) && (
                            <div className="mt-6 pt-4 border-t border-gray-100">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 bg-blue-100 rounded-lg">
                                  <FaBrain className="text-xl text-blue-600" />
                                </div>
                                <h4 className="text-lg font-semibold text-gray-900">
                                  Neurological Examination Findings
                                </h4>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(consultation.cranial_nerves ||
                                  consultation.notes) && (
                                  <div className="bg-blue-50 p-4 rounded-lg">
                                    <h5 className="font-medium text-blue-800 mb-2">
                                      Cranial Nerve Assessment
                                    </h5>
                                    <div className="space-y-2">
                                      {consultation.cranial_nerves && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">
                                            Cranial Nerves:
                                          </span>
                                          <span className="font-medium text-gray-800">
                                            {consultation.cranial_nerves}
                                          </span>
                                        </div>
                                      )}
                                      {consultation.notes && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">
                                            Clinical Notes:
                                          </span>
                                          <span className="font-medium text-gray-800">
                                            {consultation.notes}
                                          </span>
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
                                    <h5 className="font-medium text-green-800 mb-2">
                                      Motor Function Assessment
                                    </h5>
                                    <div className="space-y-2">
                                      {consultation.motor_function && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">
                                            Motor Function:
                                          </span>
                                          <span className="font-medium text-gray-800">
                                            {consultation.motor_function}
                                          </span>
                                        </div>
                                      )}
                                      {consultation.muscle_strength && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">
                                            Muscle Strength:
                                          </span>
                                          <span className="font-medium text-gray-800">
                                            {consultation.muscle_strength}
                                          </span>
                                        </div>
                                      )}
                                      {consultation.muscle_tone && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">
                                            Muscle Tone:
                                          </span>
                                          <span className="font-medium text-gray-800">
                                            {consultation.muscle_tone}
                                          </span>
                                        </div>
                                      )}
                                      {consultation.coordination && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">
                                            Coordination:
                                          </span>
                                          <span className="font-medium text-gray-800">
                                            {consultation.coordination}
                                          </span>
                                        </div>
                                      )}
                                      {consultation.deep_tendon_reflexes && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">
                                            Deep Tendon Reflexes:
                                          </span>
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
                                    <h5 className="font-medium text-orange-800 mb-2">
                                      Special Tests
                                    </h5>
                                    <div className="space-y-2">
                                      {consultation.gait_assessment && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">
                                            Gait Assessment:
                                          </span>
                                          <span className="font-medium text-gray-800">
                                            {consultation.gait_assessment}
                                          </span>
                                        </div>
                                      )}
                                      {consultation.romberg_test && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">
                                            Romberg Test:
                                          </span>
                                          <span className="font-medium text-gray-800">
                                            {consultation.romberg_test}
                                          </span>
                                        </div>
                                      )}
                                      {consultation.plantar_reflex && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">
                                            Plantar Reflex:
                                          </span>
                                          <span className="font-medium text-gray-800">
                                            {consultation.plantar_reflex}
                                          </span>
                                        </div>
                                      )}
                                      {consultation.straight_leg_raise_test && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">
                                            Straight Leg Raise Test:
                                          </span>
                                          <span className="font-medium text-gray-800">
                                            {
                                              consultation.straight_leg_raise_test
                                            }
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
                                    <h5 className="font-medium text-purple-800 mb-2">
                                      Additional Assessments
                                    </h5>
                                    <div className="space-y-2">
                                      {consultation.brudzinski_sign !==
                                        undefined && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">
                                            Brudzinski's Sign:
                                          </span>
                                          <span className="font-medium text-gray-800">
                                            {consultation.brudzinski_sign
                                              ? "Positive"
                                              : "Negative"}
                                          </span>
                                        </div>
                                      )}
                                      {consultation.kernig_sign !==
                                        undefined && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">
                                            Kernig's Sign:
                                          </span>
                                          <span className="font-medium text-gray-800">
                                            {consultation.kernig_sign
                                              ? "Positive"
                                              : "Negative"}
                                          </span>
                                        </div>
                                      )}
                                      {consultation.mmse_score && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">
                                            MMSE Score:
                                          </span>
                                          <span className="font-medium text-gray-800">
                                            {consultation.mmse_score}
                                          </span>
                                        </div>
                                      )}
                                      {consultation.gcs_score && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">
                                            GCS Score:
                                          </span>
                                          <span className="font-medium text-gray-800">
                                            {consultation.gcs_score}
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
            </div>
          </div>
        )}

        {showAddPatient && !patient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white p-8 rounded-xl border border-gray-100 shadow-xs"
          >
            <AddPatientForm
              searchedMobile={searchedMobile}
              onSuccess={handleNewPatientAdded}
            />
          </motion.div>
        )}
      </motion.div>
      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default PatientSearch;

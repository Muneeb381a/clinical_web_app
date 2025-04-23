import React, { useState, useEffect, useCallback, Component } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import PatientInfoHeader from "./PatientInfoHeader";
import ConsultationForm from "./ConsultationForm";
import PrescriptionsPopup from "./PrescriptionsPopup";
import printConsultation from "../utils/printConsultation";
import { v4 as uuidv4 } from "uuid";
import FullPageLoader from "../pages/FullPageLoader";

const neuroExamFields = [
  "motor_function",
  "muscle_tone",
  "muscle_strength",
  "straight_leg_raise_left",
  "straight_leg_raise_right",
  "deep_tendon_reflexes",
  "plantar_reflex",
  "pupillary_reaction",
  "speech_assessment",
  "gait_assessment",
  "coordination",
  "sensory_examination",
  "cranial_nerves",
  "mental_status",
  "cerebellar_function",
  "muscle_wasting",
  "abnormal_movements",
  "romberg_test",
  "nystagmus",
  "fundoscopy",
];

const BASE_URL = "https://patient-management-backend-nine.vercel.app";
const MAX_RETRIES = 3;
const TIMEOUT = 15000; // Increased to handle latency

/**
 * Performs an API request with retries, timeouts, and exponential backoff.
 * @param {string} method - HTTP method (get, post)
 * @param {string} url - API endpoint URL
 * @param {string} key - Cache and logging key
 * @param {Object} [data] - Request payload for POST
 * @param {Function} [transform] - Optional data transformation function
 * @param {number} [retries=3] - Number of retry attempts
 * @param {number} [backoff=1000] - Initial backoff delay in milliseconds
 * @param {number} [timeout=15000] - Request timeout in milliseconds
 * @returns {Promise<any>} Transformed or raw data
 * @throws {Error} If all retries fail or request times out
 */
const fetchWithRetry = async (
  method,
  url,
  key,
  data,
  transform,
  retries = MAX_RETRIES,
  backoff = 1000,
  timeout = TIMEOUT
) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const config = {
        method,
        url: `${BASE_URL}${url}`,
        timeout,
        headers: { "Content-Type": "application/json" },
        ...(method === "post" && { data }),
      };
      const response = await axios(config);

      const responseData =
        response.data.data && Array.isArray(response.data.data)
          ? response.data.data
          : response.data;

      if (!responseData) {
        throw new Error(`Empty response for ${key}`);
      }

      const transformed = transform ? transform(responseData) : responseData;
      console.log(
        `[${method.toUpperCase()}] Fetched ${key} (attempt ${attempt}):`,
        transformed
      );
      return transformed;
    } catch (error) {
      const errorDetails = {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        url: `${BASE_URL}${url}`,
        attempt,
        retries,
        method,
        payload: data,
      };
      console.error(`Error ${method} ${key}:`, errorDetails);

      if (attempt === retries || error.code === "ECONNABORTED") {
        throw new Error(`Failed to ${method} ${key}: ${error.message}`);
      }

      if (error.response?.status === 429 || error.response?.status === 503) {
        const delay = backoff * Math.pow(2, attempt - 1);
        console.warn(
          `Retrying ${key} after ${delay}ms due to ${error.response.status}`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else if (
        error.response?.status >= 400 &&
        error.response?.status < 500
      ) {
        throw error; // No retry for client errors
      } else {
        const delay = backoff * Math.pow(2, attempt - 1);
        console.warn(`Retrying ${key} after ${delay}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
};

/**
 * Fetches patient-related data with caching and robust error handling.
 * @param {string} patientId - Patient ID
 * @param {Function} setLoading - React state setter for loading state
 * @param {Function} setFetchError - React state setter for error message
 * @param {Function} setPatient - React state setter for patient data
 * @param {Function} setSymptomsOptions - React state setter for symptoms options
 * @param {Function} setTests - React state setter for tests options
 * @param {Function} setNeuroOptions - React state setter for neuro exam options
 * @param {Function} refreshMedicines - Function to refresh medicines data
 * @param {string[]} neuroExamFields - Array of neuro exam field names
 * @throws {TypeError} If any parameter is invalid
 */
const fetchData = async (
  patientId,
  setLoading,
  setFetchError,
  setPatient,
  setSymptomsOptions,
  setTests,
  setNeuroOptions,
  refreshMedicines,
  neuroExamFields
) => {
  // Validate parameters
  const args = {
    patientId,
    setLoading,
    setFetchError,
    setPatient,
    setSymptomsOptions,
    setTests,
    setNeuroOptions,
    refreshMedicines,
    neuroExamFields,
  };
  if (typeof setLoading !== "function") {
    console.error(
      "setLoading is not a function. Received:",
      setLoading,
      "All arguments:",
      args
    );
    throw new TypeError("setLoading must be a function");
  }
  if (typeof setFetchError !== "function") {
    console.error(
      "setFetchError is not a function. Received:",
      setFetchError,
      "All arguments:",
      args
    );
    throw new TypeError("setFetchError must be a function");
  }
  if (typeof setPatient !== "function") {
    console.error(
      "setPatient is not a function. Received:",
      setPatient,
      "All arguments:",
      args
    );
    throw new TypeError("setPatient must be a function");
  }
  if (typeof setSymptomsOptions !== "function") {
    console.error(
      "setSymptomsOptions is not a function. Received:",
      setSymptomsOptions,
      "All arguments:",
      args
    );
    throw new TypeError("setSymptomsOptions must be a function");
  }
  if (typeof setTests !== "function") {
    console.error(
      "setTests is not a function. Received:",
      setTests,
      "All arguments:",
      args
    );
    throw new TypeError("setTests must be a function");
  }
  if (typeof setNeuroOptions !== "function") {
    console.error(
      "setNeuroOptions is not a function. Received:",
      setNeuroOptions,
      "All arguments:",
      args
    );
    throw new TypeError("setNeuroOptions must be a function");
  }
  if (typeof refreshMedicines !== "function") {
    console.error(
      "refreshMedicines is not a function. Received:",
      refreshMedicines,
      "All arguments:",
      args
    );
    throw new TypeError("refreshMedicines must be a function");
  }
  if (!Array.isArray(neuroExamFields)) {
    console.error(
      "neuroExamFields is not an array. Received:",
      neuroExamFields,
      "All arguments:",
      args
    );
    throw new TypeError("neuroExamFields must be an array");
  }
  if (!patientId || typeof patientId !== "string") {
    console.error(
      "Invalid patientId. Received:",
      patientId,
      "All arguments:",
      args
    );
    throw new TypeError("patientId must be a non-empty string");
  }

  setLoading(true);
  setFetchError(null);

  // In-memory cache
  const cache = new Map();

  const fetchCached = async (key, url, transform) => {
    if (cache.has(key)) {
      console.log(`Using cached data for ${key}`);
      return cache.get(key);
    }
    const data = await fetchWithRetry("get", url, key, null, transform);
    cache.set(key, data);
    return data;
  };

  try {
    // Fetch patient data (critical, no cache)
    const patientData = await fetchWithRetry(
      "get",
      `/api/patients/${patientId}`,
      "patient",
      null,
      (data) => {
        if (!data || !data.id) {
          throw new Error("Invalid patient data");
        }
        return {
          id: String(data.id),
          name: data.name || "Unknown",
          mobile: data.mobile || "",
          age: data.age || null,
          gender: data.gender || null,
        };
      }
    );
    setPatient(patientData);

    // Parallelize non-critical fetches
    const results = await Promise.allSettled([
      // Refresh medicines
      refreshMedicines().catch((err) => {
        console.warn("Failed to refresh medicines:", err);
        toast.warn("Failed to load medicines. Some features may be limited.");
        return [];
      }),

      // Fetch symptoms
      fetchCached("symptoms", "/api/symptoms", (data) =>
        Array.isArray(data)
          ? data.map((sym) => ({
              value: String(sym.id || ""),
              label: sym.name || "Unknown",
            }))
          : []
      )
        .then((symptomsData) => {
          setSymptomsOptions(symptomsData);
          return symptomsData;
        })
        .catch((err) => {
          console.warn("Failed to fetch symptoms:", err);
          toast.warn("Failed to load symptoms. Please try again.");
          setSymptomsOptions([]);
          return [];
        }),

      // Fetch tests
      fetchCached("tests", "/api/tests", (data) =>
        Array.isArray(data)
          ? data.map((test) => ({
              value: String(test.id || ""),
              label: test.test_name || test.name || "Unknown",
            }))
          : []
      )
        .then((testsData) => {
          setTests(testsData);
          return testsData;
        })
        .catch((err) => {
          console.warn("Failed to fetch tests:", err);
          toast.warn("Failed to load tests. Please try again.");
          setTests([]);
          return [];
        }),

      // Fetch neuro options
      Promise.all(
        neuroExamFields.map((field) =>
          fetchCached(`neuro-${field}`, `/api/neuro-options/${field}`, (data) =>
            Array.isArray(data)
              ? data.map((opt) => ({
                  value: String(opt.id || ""),
                  label: opt.value || "Unknown",
                }))
              : []
          ).catch((err) => {
            console.warn(`Failed to fetch neuro-options for ${field}:`, err);
            toast.warn(`Failed to load options for ${field}.`);
            return [];
          })
        )
      )
        .then((neuroResults) => {
          const neuroOptionsMap = {};
          neuroExamFields.forEach((field, index) => {
            neuroOptionsMap[field] = neuroResults[index] || [];
          });
          setNeuroOptions(neuroOptionsMap);
          return neuroOptionsMap;
        })
        .catch((err) => {
          console.warn("Failed to fetch neuro options:", err);
          toast.warn("Failed to load neuro exam options.");
          setNeuroOptions({});
          return {};
        }),
    ]);

    // Log fetch results
    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        console.log(`Fetch ${index} succeeded:`, result.value);
      } else {
        console.warn(`Fetch ${index} failed:`, result.reason);
      }
    });

    // Check if all non-critical fetches failed
    if (results.slice(1).every((result) => result.status === "rejected")) {
      throw new Error("All non-critical data fetches failed");
    }
  } catch (error) {
    console.error("Critical fetch error:", error);
    const errorMessage =
      error.response?.status === 404
        ? "Patient not found. Please check the patient ID."
        : `Failed to load data: ${error.message}`;
    setFetchError(errorMessage);
    toast.error(errorMessage);
  } finally {
    setLoading(false);
  }
};

// Custom error boundary without external package
class CustomErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center flex-col">
          <p className="text-lg text-red-600">
            Error: {this.state.error.message}
          </p>
          <button
            onClick={() => this.props.navigate("/")}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
          >
            Return to Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const PatientConsultation = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [tests, setTests] = useState([]);
  const [selectedTests, setSelectedTests] = useState([]);
  const [neuroExamData, setNeuroExamData] = useState({});
  const [neuroOptions, setNeuroOptions] = useState({});
  const [symptomsOptions, setSymptomsOptions] = useState([]);
  const [followUpDate, setFollowUpDate] = useState(null);
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedMedicines, setSelectedMedicines] = useState([]);
  const [vitalSigns, setVitalSigns] = useState({
    pulseRate: "",
    bloodPressure: "",
    temperature: "",
    spo2: "",
    nihss: "",
    fall_assessment: "Done",
  });
  const [fetchError, setFetchError] = useState(null);
  const [pendingSubmission, setPendingSubmission] = useState(null); // For offline queuing

  const customSelectStyles = {
    control: (base) => ({
      ...base,
      borderColor: "#ccc",
      boxShadow: "none",
      padding: "2px 2px",
      minHeight: "45px",
      display: "flex",
      alignItems: "center",
      "&:hover": { borderColor: "#888" },
    }),
    option: (provided, state) => ({
      ...provided,
      padding: "12px 15px",
      display: "flex",
      alignItems: "center",
      backgroundColor: state.isSelected ? "#4CAF50" : "#fff",
      color: state.isSelected ? "#fff" : "#333",
      "&:hover": { backgroundColor: "#f1f1f1" },
    }),
  };

  const refreshMedicines = useCallback(async () => {
    try {
      const medicinesData = await fetchWithRetry(
        "get",
        "/api/medicines",
        "medicines",
        null,
        (data) =>
          Array.isArray(data)
            ? data.map((med) => ({
                value: String(med.id || ""),
                label: `${med.form || ""} ${med.brand_name}${
                  med.strength ? ` (${med.strength})` : ""
                }`.trim(),
                raw: med,
              }))
            : []
      );
      setMedicines(medicinesData);
      console.log(
        "Refreshed medicines:",
        medicinesData.map((m) => m.value)
      );

      const validIds = medicinesData.map((m) => m.value);
      const invalidMedicines = selectedMedicines.filter(
        (med) => med.medicine_id && !validIds.includes(String(med.medicine_id))
      );
      if (invalidMedicines.length > 0) {
        console.warn("Invalid medicines found:", invalidMedicines);
        toast.warn(
          `Removed unrecognized medicines (IDs: ${invalidMedicines
            .map((m) => m.medicine_id)
            .join(", ")}). Please reselect.`
        );
        setSelectedMedicines((prev) =>
          prev.filter((med) => validIds.includes(String(med.medicine_id)))
        );
      }
    } catch (error) {
      console.error("Failed to refresh medicines:", error);
      toast.error("Failed to load medicines. Please try again.");
      return [];
    }
  }, [selectedMedicines]);

  useEffect(() => {
    if (!patientId) {
      setFetchError("No patient ID provided");
      setLoading(false);
      toast.error("No patient ID provided. Please select a patient.");
      return;
    }

    fetchData(
      patientId,
      setLoading,
      setFetchError,
      setPatient,
      setSymptomsOptions,
      setTests,
      setNeuroOptions,
      refreshMedicines,
      neuroExamFields
    );
  }, [patientId]);

  useEffect(() => {
    console.log("Patient state updated:", patient);
    console.log("Current selectedMedicines:", selectedMedicines);
  }, [patient, selectedMedicines]);

  // Handle offline submissions
  useEffect(() => {
    const handleOnline = async () => {
      if (pendingSubmission && navigator.onLine) {
        console.log(
          "Network restored, retrying pending submission:",
          pendingSubmission
        );
        toast.info("Network restored. Retrying submission...");
        await submitConsultation(pendingSubmission);
        setPendingSubmission(null);
      }
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [pendingSubmission]);

  const handlePrint = async () => {
    if (selectedMedicines.length === 0) {
      toast.warn("No medicines selected to print.");
      return;
    }

    await refreshMedicines();

    const validIds = medicines.map((m) => String(m.value));
    const invalidMedicines = selectedMedicines.filter(
      (med) => med.medicine_id && !validIds.includes(String(med.medicine_id))
    );
    if (invalidMedicines.length > 0) {
      toast.error(
        `Cannot print: Unrecognized medicines (IDs: ${invalidMedicines
          .map((m) => m.medicine_id)
          .join(", ")}). Please reselect.`
      );
      return;
    }

    console.log("Triggering print with:", { selectedMedicines, medicines });
    try {
      printConsultation({
        patient,
        selectedMedicines,
        medicines,
        vitalSigns,
        selectedTests,
        tests,
        selectedSymptoms,
        neuroExamData,
        followUpDate,
        followUpNotes,
      });
    } catch (error) {
      console.error("Print error:", error);
      toast.error("Failed to print consultation. Please try again.");
    }
  };

  const submitConsultation = async (queuedData = null) => {
    if (!patient || !patient.id) {
      toast.error("Patient data is missing or invalid.");
      return;
    }
    if (submissionLoading) {
      toast.warn("Please wait for the ongoing submission to complete.");
      return;
    }
    if (!navigator.onLine) {
      console.warn("Offline: Queuing submission data");
      setPendingSubmission({
        patient,
        selectedMedicines,
        vitalSigns,
        selectedTests,
        selectedSymptoms,
        neuroExamData,
        followUpDate,
        followUpNotes,
        selectedDuration,
      });
      toast.warn("Offline. Submission queued. Please reconnect to submit.");
      return;
    }
  
    setSubmissionLoading(true);
  
    try {
      await refreshMedicines();
  
      const validIds = medicines.map((m) => String(m.value));
      const invalidMedicines = selectedMedicines.filter(
        (med) => med.medicine_id && !validIds.includes(String(med.medicine_id))
      );
      if (invalidMedicines.length > 0) {
        toast.error(
          `Cannot submit: Unrecognized medicines (IDs: ${invalidMedicines
            .map((m) => m.medicine_id)
            .join(", ")}). Please reselect.`
        );
        return;
      }
  
      const consultationPayload = {
        patient_id: String(patient.id),
        doctor_name: "Dr. Abdul Rauf",
        diagnosis: neuroExamData?.diagnosis?.trim() || null,
        notes: neuroExamData?.treatment_plan?.trim() || null,
        visit_date: new Date().toISOString(), // Align with server
      };
  
      // Validate payload
      if (!consultationPayload.patient_id) {
        throw new Error("Invalid patient ID in consultation payload");
      }
  
      console.log("Creating consultation with payload:", consultationPayload);
      let consultationId;
      try {
        const consultationRes = await fetchWithRetry(
          "post",
          "/api/consultations",
          "consultation",
          consultationPayload,
          (data) => data
        );
        console.log("Consultation response:", consultationRes);
        consultationId = consultationRes?.consultation?.id;
        if (!consultationId) {
          throw new Error("Server did not return a consultation ID.");
        }
        console.log("Consultation created with ID:", consultationId);
      } catch (error) {
        console.error("Failed to create consultation:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
        let errorMessage;
        if (error.response?.status === 400) {
          errorMessage = error.response?.data?.details || "Invalid consultation data. Please check patient ID and inputs.";
        } else if (error.response?.status >= 500) {
          errorMessage = "Server error creating consultation. Please try again.";
        } else {
          errorMessage = error.message || "Failed to create consultation.";
        }
        toast.error(errorMessage);
        throw error; // Exit early
      }
  
      const failedSteps = [];
      const requests = [];
  
      // Vitals
      if (vitalSigns && Object.values(vitalSigns).some((v) => v && v !== "")) {
        const vitalsPayload = {
          consultation_id: consultationId,
          patient_id: String(patient.id),
          pulse_rate: Number(vitalSigns.pulseRate) || null,
          blood_pressure: vitalSigns.bloodPressure?.trim() || null,
          temperature: Number(vitalSigns.temperature) || null,
          spo2_level: Number(vitalSigns.spo2) || null,
          nihss_score: Number(vitalSigns.nihss) || null,
          fall_assessment: vitalSigns.fall_assessment || "Done",
        };
        requests.push(
          fetchWithRetry(
            "post",
            "/api/vitals",
            "Vitals",
            vitalsPayload,
            (data) => data
          ).catch((e) => {
            failedSteps.push(
              `Vitals: ${e.message} (HTTP ${e.response?.status || "unknown"})`
            );
            throw e;
          })
        );
      }
  
      // Symptoms
      if (Array.isArray(selectedSymptoms) && selectedSymptoms.length > 0) {
        const validSymptomIds = symptomsOptions.map((s) => String(s.value));
        const symptomIds = selectedSymptoms
          .map((s) => s?.value && String(s.value))
          .filter((id) => id && validSymptomIds.includes(id));
        if (symptomIds.length === 0) {
          console.warn("No valid symptom IDs after validation:", {
            selectedSymptoms,
            validSymptomIds,
          });
          failedSteps.push("Symptoms: No valid symptoms selected");
        } else {
          const symptomsPayload = { symptom_ids: symptomIds };
          console.log("Submitting symptoms payload:", symptomsPayload);
          requests.push(
            fetchWithRetry(
              "post",
              `/api/consultations/${consultationId}/symptoms`,
              "Symptoms",
              symptomsPayload,
              (data) => data
            ).catch((e) => {
              const errorMessage =
                e.response?.data?.message ||
                e.message ||
                "Unknown error submitting symptoms";
              failedSteps.push(
                `Symptoms: ${errorMessage} (HTTP ${e.response?.status || "unknown"})`
              );
              throw e;
            })
          );
        }
      }
  
      // Prescriptions
      if (Array.isArray(selectedMedicines) && selectedMedicines.length > 0) {
        const invalidMedicines = selectedMedicines.filter(
          (med) => !med.medicine_id || String(med.medicine_id).trim() === ""
        );
        if (invalidMedicines.length > 0) {
          console.error("Invalid or missing medicine IDs:", invalidMedicines);
          toast.error(
            "Cannot submit prescriptions: Some medicines have invalid or missing IDs."
          );
          failedSteps.push("Prescriptions: Invalid or missing medicine IDs");
        } else {
          const prescriptionsPayload = {
            consultation_id: String(consultationId),
            medicines: selectedMedicines.map((med) => ({
              medicine_id: String(med.medicine_id),
              dosage_en: med.dosage_en ? String(med.dosage_en).trim() : "",
              dosage_urdu: med.dosage_urdu?.trim() || "",
              frequency_en: med.frequency_en?.trim() || "",
              frequency_urdu: med.frequency_urdu?.trim() || "",
              duration_en: med.duration_en?.trim() || "",
              duration_urdu: med.duration_urdu?.trim() || "",
              instructions_en: med.instructions_en?.trim() || "",
              instructions_urdu: med.instructions_urdu?.trim() || "",
              how_to_take_en: med.how_to_take_en?.trim() || null,
              how_to_take_urdu: med.how_to_take_urdu?.trim() || null,
            })),
          };
          console.log("Submitting prescriptions payload:", prescriptionsPayload);
          requests.push(
            fetchWithRetry(
              "post",
              "/api/prescriptions",
              "Prescriptions",
              prescriptionsPayload,
              (data) => data
            ).catch((error) => {
              const errorMessage =
                error.response?.data?.error ||
                error.response?.data?.message ||
                error.message ||
                "Unknown error submitting prescriptions";
              console.error("Prescriptions failed:", {
                status: error.response?.status,
                responseData: error.response?.data,
                payload: prescriptionsPayload,
              });
              failedSteps.push(
                `Prescriptions: ${errorMessage} (HTTP ${error.response?.status || "unknown"})`
              );
              toast.error(
                error.response?.status === 400
                  ? `Failed to submit prescriptions: ${errorMessage}. Please reselect medicines.`
                  : `Failed to submit prescriptions: ${errorMessage}`
              );
              throw error;
            })
          );
        }
      }
  
      // Tests
      if (Array.isArray(selectedTests) && selectedTests.length > 0) {
        const testIds = selectedTests
          .map((test) =>
            test && typeof test === "object" && "value" in test
              ? String(test.value)
              : String(test)
          )
          .filter((id) => id && Number.isInteger(Number(id)));
        const validTestIds = tests.map((t) => String(t.value));
        const invalidTestIds = testIds.filter((id) => !validTestIds.includes(id));
        if (invalidTestIds.length > 0) {
          console.error("Invalid test IDs:", invalidTestIds);
          toast.error(
            `Cannot submit tests: Unrecognized test IDs (${invalidTestIds.join(", ")}). Please reselect tests.`
          );
          failedSteps.push(`Tests: Invalid test IDs (${invalidTestIds.join(", ")})`);
        } else if (testIds.length > 0) {
          const testsPayload = {
            test_ids: testIds,
            consultation_id: consultationId,
          };
          console.log("Submitting tests payload:", testsPayload);
          requests.push(
            fetchWithRetry(
              "post",
              "/api/tests/assign",
              "Tests",
              testsPayload,
              (data) => data
            ).catch((error) => {
              const errorMessage =
                error.response?.data?.error ||
                error.response?.data?.message ||
                error.message ||
                "Unknown error submitting tests";
              console.error("Tests failed:", {
                status: error.response?.status,
                responseData: error.response?.data,
                payload: testsPayload,
              });
              failedSteps.push(
                `Tests: ${errorMessage} (HTTP ${error.response?.status || "unknown"})`
              );
              toast.error(
                error.response?.status === 400
                  ? `Failed to submit tests: ${errorMessage}. Please reselect tests.`
                  : `Failed to submit tests: ${errorMessage}`
              );
              throw error;
            })
          );
        } else {
          console.warn("No valid test IDs after processing:", { selectedTests });
          toast.warn("No valid tests selected. Please reselect tests.");
          failedSteps.push("Tests: No valid test IDs selected");
        }
      }
  
      // Neuro Exam
      if (neuroExamData && Object.keys(neuroExamData).length > 0) {
        const neuroPayload = {
          consultation_id: consultationId,
          patient_id: String(patient.id),
          ...neuroExamData,
          pain_sensation: !!neuroExamData.pain_sensation,
          vibration_sense: !!neuroExamData.vibration_sense,
          proprioception: !!neuroExamData.proprioception,
          temperature_sensation: !!neuroExamData.temperature_sensation,
          brudzinski_sign: !!neuroExamData.brudzinski_sign,
          kernig_sign: !!neuroExamData.kernig_sign,
          facial_sensation: !!neuroExamData.facial_sensation,
          swallowing_function: !!neuroExamData.swallowing_function,
          mmse_score: neuroExamData.mmse_score
            ? parseInt(neuroExamData.mmse_score)
            : null,
          gcs_score: neuroExamData.gcs_score
            ? parseInt(neuroExamData.gcs_score)
            : null,
        };
        requests.push(
          fetchWithRetry(
            "post",
            "/api/examination",
            "Neuro Exam",
            neuroPayload,
            (data) => data
          ).catch((e) => {
            failedSteps.push(
              `Neuro Exam: ${e.message} (HTTP ${e.response?.status || "unknown"})`
            );
            throw e;
          })
        );
      }
  
      // Follow-Up
      if (
        selectedDuration &&
        followUpDate &&
        followUpDate instanceof Date &&
        !isNaN(followUpDate)
      ) {
        const durationDays = Number(selectedDuration);
        if (!isNaN(durationDays) && durationDays > 0) {
          const followUpPayload = {
            follow_up_date: followUpDate.toISOString().split("T")[0],
            notes: followUpNotes?.trim() || "General check-up",
            duration_days: durationDays,
          };
          requests.push(
            fetchWithRetry(
              "post",
              `/api/followups/consultations/${consultationId}/followups`,
              "Follow-Up",
              followUpPayload,
              (data) => data
            ).catch((e) => {
              failedSteps.push(
                `Follow-Up: ${e.message} (HTTP ${e.response?.status || "unknown"})`
              );
              throw e;
            })
          );
        }
      }
  
      // Execute parallel requests
      if (requests.length > 0) {
        console.log("Executing parallel requests:", requests.length);
        await Promise.allSettled(requests).then((results) => {
          results.forEach((result, index) => {
            if (result.status === "rejected") {
              console.warn(`Request ${index} failed:`, result.reason);
            }
          });
        });
      }
  
      if (failedSteps.length > 0) {
        console.warn("Failed steps:", failedSteps);
        toast.warn(
          `Consultation saved, but some steps failed: ${failedSteps.join(", ")}.`
        );
      } else {
        toast.success("Consultation processed successfully!");
      }
  
      // Reset state
      setVitalSigns({
        pulseRate: "",
        bloodPressure: "",
        temperature: "",
        spo2: "",
        nihss: "",
        fall_assessment: "Done",
      });
      setFollowUpDate(null);
      setFollowUpNotes("");
      setSelectedDuration(null);
  
      // Attempt to print
      setTimeout(async () => {
        try {
          await handlePrint();
        } catch (printError) {
          console.warn("Print failed:", printError);
          toast.warn("Consultation saved, but printing failed.");
        }
      }, 0);
  
      navigate("/");
    } catch (error) {
      console.error("Submission error:", error);
      let errorMessage =
        error.response?.data?.details ||
        error.response?.data?.message ||
        error.message ||
        "Submission error";
      if (error.code === "ECONNABORTED") {
        errorMessage = "Request timed out. Please check your network.";
      } else if (error.response?.status >= 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (error.response?.status === 400) {
        errorMessage = `Invalid data: ${error.response?.data?.details || error.response?.data?.message || "Check your inputs."}`;
      } else if (error.response?.status === 404) {
        errorMessage = "Resource not found. Please check the data.";
      }
      toast.error(errorMessage);
    } finally {
      setSubmissionLoading(false);
    }
  };

  return (
    <CustomErrorBoundary navigate={navigate}>
      <div className="min-h-screen p-8 relative overflow-hidden isolate w-[90vw] mx-auto before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.9),_transparent)] before:opacity-50 before:-z-10">
        <div className="mx-auto max-w-6xl rounded-2xl border border-white/30 bg-white/95 backdrop-blur-sm p-8 shadow-2xl shadow-gray-100/30">
          <h2 className="mb-6 border-b border-gray-200 pb-4 text-2xl font-bold text-gray-900">
            <span className="bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">
              Patient Consultation Portal
            </span>
          </h2>
          {loading ? (
            <div className="min-h-screen flex items-center justify-center">
              <FullPageLoader isLoading={true} />
            </div>
          ) : fetchError ? (
            <div className="flex items-center justify-center flex-col">
              <p className="text-lg text-red-600">{fetchError}</p>
              <button
                onClick={() => navigate("/")}
                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
              >
                Return to Home
              </button>
            </div>
          ) : patient ? (
            <>
              <PatientInfoHeader
                patient={patient}
                onReturnHome={() => navigate("/")}
                setShowPopup={setShowPopup}
              />
              <ConsultationForm
                vitalSigns={vitalSigns}
                onVitalSignsChange={setVitalSigns}
                selectedSymptoms={selectedSymptoms}
                onSymptomsChange={setSelectedSymptoms}
                neuroExamData={neuroExamData}
                setNeuroExamData={setNeuroExamData}
                neuroExamFields={neuroExamFields}
                neuroOptions={neuroOptions}
                tests={tests}
                selectedTests={selectedTests}
                onTestsChange={setSelectedTests}
                loading={submissionLoading}
                selectedMedicines={selectedMedicines}
                setSelectedMedicines={setSelectedMedicines}
                customSelectStyles={customSelectStyles}
                selectedDuration={selectedDuration}
                followUpDate={followUpDate}
                followUpNotes={followUpNotes}
                onDurationChange={setSelectedDuration}
                onDateChange={setFollowUpDate}
                onNotesChange={setFollowUpNotes}
                onSubmit={submitConsultation}
                onPrint={handlePrint}
                medicines={medicines}
                symptomsOptions={symptomsOptions}
                refreshMedicines={refreshMedicines}
              />
              {showPopup && (
                <PrescriptionsPopup
                  prescriptions={prescriptions}
                  onClose={() => setShowPopup(false)}
                />
              )}
            </>
          ) : (
            <div className="flex items-center justify-center flex-col">
              <p className="text-lg text-red-600">
                No patient data loaded. Please try again or return home.
              </p>
              <button
                onClick={() => navigate("/")}
                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
              >
                Return to Home
              </button>
            </div>
          )}
        </div>
        <ToastContainer />
      </div>
    </CustomErrorBoundary>
  );
};

export default PatientConsultation;

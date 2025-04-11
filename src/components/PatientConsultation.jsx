import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import PatientInfoHeader from "./PatientInfoHeader";
import ConsultationForm from "./ConsultationForm";
import PrescriptionsPopup from "./PrescriptionsPopup";
import printConsultation from "../utils/printConsultation";

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

  const MAX_RETRIES = 2;
  const BASE_URL = "https://patient-management-backend-nine.vercel.app";

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

  const fetchWithRetry = async (url, resourceName, transformFn, retries = MAX_RETRIES) => {
    let attempt = 0;
    while (attempt <= retries) {
      try {
        const response = await axios.get(`${BASE_URL}${url}`, {
          timeout: 10000,
          headers: { "Content-Type": "application/json" },
        });
        console.log(`Raw response for ${resourceName}:`, response.data);
        const data = response.data.data && Array.isArray(response.data.data) ? response.data.data : response.data;
        const transformed = Array.isArray(data) ? transformFn(data) : transformFn(data);
        console.log(`Fetched ${resourceName}:`, transformed);
        return transformed;
      } catch (error) {
        console.error(`Error fetching ${resourceName} (attempt ${attempt + 1}/${retries + 1}):`, {
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
          url: `${BASE_URL}${url}`,
        });
        if (error.response?.status >= 400 && error.response?.status < 600) {
          if (attempt < retries) {
            const delay = 1000 * Math.pow(2, attempt);
            toast.info(`Failed to fetch ${resourceName}. Retrying in ${delay / 1000}s...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            attempt++;
          } else {
            console.warn(`Max retries reached for ${resourceName}. Returning default.`);
            return [];
          }
        } else {
          console.warn(`Invalid data format for ${resourceName}. Returning default.`);
          return [];
        }
      }
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setFetchError(null);

    try {
      // Fetch patient data first (critical dependency)
      const patientData = await fetchWithRetry(
        `/api/patients/${patientId}`,
        "patient",
        (data) => data
      );
      console.log("Patient data fetched:", patientData);
      if (!patientData || !patientData.id) {
        throw new Error("Invalid patient data received");
      }
      setPatient(patientData);
      console.log("Patient state set to:", patientData);

      // Parallelize independent fetches
      const fetchPromises = [
        fetchWithRetry(
          "/api/medicines",
          "medicines",
          (data) =>
            data.map((med) => ({
              value: med.id,
              label: `${med.form || ""} ${med.brand_name}${med.strength ? ` (${med.strength})` : ""}`.trim(),
            }))
        ).then((medicinesData) => {
          setMedicines(medicinesData || []);
          console.log("Medicines set:", medicinesData);
        }),

        fetchWithRetry(
          "/api/symptoms",
          "symptoms",
          (data) => data.map((sym) => ({ value: sym.id, label: sym.name }))
        ).then((symptomsData) => {
          setSymptomsOptions(symptomsData || []);
          console.log("Symptoms set:", symptomsData);
        }),

        fetchWithRetry(
          "/api/tests",
          "tests",
          (data) => data.map((test) => ({ value: test.id, label: test.test_name || test.name }))
        ).then((testsData) => {
          setTests(testsData || []);
          console.log("Tests set:", testsData);
        }),

        fetchWithRetry(
          `/api/prescriptions/patient/${patientId}`,
          "prescriptions",
          (data) => data
        ).then((prescriptionsData) => {
          setPrescriptions(prescriptionsData || []);
          console.log("Prescriptions set:", prescriptionsData);
        }),

        // Fetch all neuro-options in parallel
        Promise.all(
          neuroExamFields.map((field) =>
            fetchWithRetry(
              `/api/neuro-options/${field}`,
              `neuro-${field}`,
              (data) => data.map((opt) => ({ value: opt.id, label: opt.value }))
            )
          )
        ).then((neuroResults) => {
          const neuroOptionsMap = {};
          neuroExamFields.forEach((field, index) => {
            neuroOptionsMap[field] = neuroResults[index] || [];
          });
          setNeuroOptions(neuroOptionsMap);
          console.log("Neuro options set:", neuroOptionsMap);
        }),
      ];

      // Wait for all parallel fetches to complete
      await Promise.all(fetchPromises);
      console.log("All data fetched successfully");

    } catch (error) {
      console.error("Critical fetch error:", error);
      setFetchError(`Failed to load data: ${error.message}`);
      toast.error(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
      console.log("Loading complete, patient state:", patient, "fetchError:", fetchError);
    }
  };

  useEffect(() => {
    fetchData();
  }, [patientId, navigate]);

  useEffect(() => {
    console.log("Patient state updated:", patient);
  }, [patient]);

  const handleReturnHome = () => {
    setPatient(null);
    navigate("/");
  };

  const handlePrint = () => {
    printConsultation({
      patient,
      selectedMedicines,
      medicines,
      vitalSigns,
      selectedSymptoms,
      selectedTests,
      neuroExamData,
      followUpDate,
      followUpNotes,
    });
  };

  const submitConsultation = async () => {
    if (!patient || submissionLoading) {
      toast.error("Please wait for data to load or ongoing submission to complete.");
      return;
    }
  
    setSubmissionLoading(true);
  
    try {
      console.log("Submitting consultation with data:", {
        patient_id: patient.id,
        vitalSigns,
        selectedSymptoms,
        selectedMedicines,
        neuroExamData,
        selectedTests,
        followUpDate,
        followUpNotes,
        selectedDuration,
      });
  
      // Step 1: Create Consultation
      const consultationPayload = {
        patient_id: patient.id,
        doctor_name: "Dr. Abdul Rauf",
        diagnosis: neuroExamData.diagnosis || null,
        notes: neuroExamData.treatment_plan || null,
        consultation_date: new Date().toISOString().split("T")[0],
        status: "completed",
      };
      console.log("POST /api/consultations payload:", consultationPayload);
      const consultationRes = await axios.post(
        `${BASE_URL}/api/consultations`,
        consultationPayload,
        { timeout: 15000 }
      );
      const consultationId = consultationRes.data.id;
      console.log("Consultation created with ID:", consultationId);
  
      const requests = [];
  
      // Step 2: Vitals
      if (Object.values(vitalSigns).some((v) => v)) {
        const vitalsPayload = {
          consultation_id: consultationId,
          patient_id: patient.id,
          pulse_rate: Number(vitalSigns.pulseRate) || null,
          blood_pressure: vitalSigns.bloodPressure || null,
          temperature: Number(vitalSigns.temperature) || null,
          spo2_level: Number(vitalSigns.spo2) || null,
          nihss_score: Number(vitalSigns.nihss) || null,
          fall_assessment: vitalSigns.fall_assessment || "Done",
        };
        console.log("POST /api/vitals payload:", vitalsPayload);
        requests.push(
          axios.post(`${BASE_URL}/api/vitals`, vitalsPayload).catch((error) => {
            console.error("Error submitting vitals:", {
              status: error.response?.status,
              message: error.response?.data?.message || error.message,
              payload: vitalsPayload,
            });
            throw new Error("Failed to submit vitals");
          })
        );
      }
  
      // Step 3: Symptoms
      if (selectedSymptoms.length > 0) {
        const symptomsPayload = {
          symptom_ids: selectedSymptoms.map((s) => s.value),
        };
        console.log("POST /api/consultations/{id}/symptoms payload:", symptomsPayload);
        requests.push(
          axios.post(`${BASE_URL}/api/consultations/${consultationId}/symptoms`, symptomsPayload).catch((error) => {
            console.error("Error submitting symptoms:", {
              status: error.response?.status,
              message: error.response?.data?.message || error.message,
              payload: symptomsPayload,
            });
            throw new Error("Failed to submit symptoms");
          })
        );
      }
  
      // Step 4: Prescriptions
      if (selectedMedicines.length > 0) {
        const prescriptionsPayload = {
          consultation_id: consultationId,
          medicines: selectedMedicines.map((med) => ({
            medicine_id: med.medicine_id,
            dosage_en: med.dosage_en || "",
            dosage_urdu: med.dosage_urdu || "",
            frequency_en: med.frequency_en || "",
            frequency_urdu: med.frequency_urdu || "",
            duration_en: med.duration_en || "",
            duration_urdu: med.duration_urdu || "",
            instructions_en: med.instructions_en || "",
            instructions_urdu: med.instructions_urdu || "",
          })),
        };
        console.log("POST /api/prescriptions payload:", prescriptionsPayload);
        requests.push(
          axios.post(`${BASE_URL}/api/prescriptions`, prescriptionsPayload).catch((error) => {
            console.error("Error submitting prescriptions:", {
              status: error.response?.status,
              message: error.response?.data?.message || error.message,
              payload: prescriptionsPayload,
            });
            throw new Error("Failed to submit prescriptions");
          })
        );
      }
  
      // Step 5: Neuro Exam
      if (Object.keys(neuroExamData).length > 0) {
        const neuroPayload = {
          consultation_id: consultationId,
          patient_id: patient.id,
          ...neuroExamData,
          diagnosis: neuroExamData.diagnosis || "",
          treatment_plan: neuroExamData.treatment_plan || "",
          pain_sensation: !!neuroExamData.pain_sensation,
          vibration_sense: !!neuroExamData.vibration_sense,
          proprioception: !!neuroExamData.proprioception,
          temperature_sensation: !!neuroExamData.temperature_sensation,
          brudzinski_sign: !!neuroExamData.brudzinski_sign,
          kernig_sign: !!neuroExamData.kernig_sign,
          facial_sensation: !!neuroExamData.facial_sensation,
          swallowing_function: !!neuroExamData.swallowing_function,
          mmse_score: neuroExamData.mmse_score || "",
          gcs_score: neuroExamData.gcs_score || "",
        };
        console.log("POST /api/examination payload:", neuroPayload);
        requests.push(
          axios.post(`${BASE_URL}/api/examination`, neuroPayload).catch((error) => {
            console.error("Error submitting neuro exam:", {
              status: error.response?.status,
              message: error.response?.data?.message || error.message,
              payload: neuroPayload,
            });
            throw new Error("Failed to submit neuro exam");
          })
        );
      }
  
      // Step 6: Tests
      if (selectedTests.length > 0) {
        const testIds = selectedTests
          .map((test) => tests.find((t) => t.label === test || t.value === test)?.value)
          .filter(Boolean);
        const testsPayload = {
          test_ids: testIds,
          consultation_id: consultationId,
        };
        console.log("POST /api/tests/assign payload:", testsPayload);
        if (testIds.length > 0) {
          requests.push(
            axios.post(`${BASE_URL}/api/tests/assign`, testsPayload).catch((error) => {
              console.error("Error submitting tests:", {
                status: error.response?.status,
                message: error.response?.data?.message || error.message,
                payload: testsPayload,
              });
              throw new Error("Failed to submit tests");
            })
          );
        }
      }
  
      // Step 7: Follow-Up
      if (selectedDuration && followUpDate) {
        const followUpPayload = {
          follow_up_date: followUpDate.toISOString().split("T")[0],
          notes: followUpNotes || "عام چیک اپ",
          duration_days: Number(selectedDuration) || 7,
        };
        console.log("POST /api/followups/consultations/{id}/followups payload:", followUpPayload);
        const createFollowUpWithRetry = async (attempt = 1) => {
          try {
            return await axios.post(
              `${BASE_URL}/api/followups/consultations/${consultationId}/followups`,
              followUpPayload
            );
          } catch (error) {
            console.error(`Error submitting follow-up (attempt ${attempt}/3):`, {
              status: error.response?.status,
              message: error.response?.data?.message || error.message,
              payload: followUpPayload,
            });
            if (attempt < 3) {
              const delay = 500 * Math.pow(2, attempt);
              await new Promise((resolve) => setTimeout(resolve, delay));
              return createFollowUpWithRetry(attempt + 1);
            }
            throw new Error("Failed to submit follow-up after retries");
          }
        };
        requests.push(createFollowUpWithRetry());
      }
  
      console.log("Executing", requests.length, "requests in parallel");
      await Promise.all(requests);
      console.log("All submission requests completed");
  
      toast.success("Consultation added successfully! 🎉", { autoClose: 2000 });
      setVitalSigns({ pulseRate: "", bloodPressure: "", temperature: "", spo2: "", nihss: "", fall_assessment: "Done" });
      setFollowUpDate(null);
      setFollowUpNotes("");
      setSelectedDuration(null);
      handlePrint();
      setTimeout(() => navigate("/"), 1000);
  
    } catch (error) {
      console.error("Submission error:", {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        endpoint: error.config?.url,
        payload: error.config?.data ? JSON.parse(error.config.data) : null,
      });
      toast.error(
        error.response?.data?.message || error.message || "Failed to save consultation. Please try again."
      );
    } finally {
      setSubmissionLoading(false);
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-600">Loading consultation data...</p>
      </div>
    );
  }

  console.log("Rendering UI, patient:", patient, "fetchError:", fetchError);

  if (fetchError) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col">
        <p className="text-lg text-red-600">{fetchError}</p>
        <button
          onClick={handleReturnHome}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 relative overflow-hidden isolate w-[90vw] mx-auto before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.9),_transparent)] before:opacity-50 before:-z-10">
      <div className="mx-auto max-w-6xl rounded-2xl border border-white/30 bg-white/95 backdrop-blur-sm p-8 shadow-2xl shadow-gray-100/30">
        <h2 className="mb-6 border-b border-gray-200 pb-4 text-2xl font-bold text-gray-900">
          <span className="bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">
            Patient Consultation Portal
          </span>
        </h2>
        {patient ? (
          <>
            <PatientInfoHeader
              patient={patient}
              onReturnHome={handleReturnHome}
              setShowPopup={setShowPopup}
              prescriptions={prescriptions}
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
              onClick={handleReturnHome}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
            >
              Return to Home
            </button>
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default PatientConsultation;
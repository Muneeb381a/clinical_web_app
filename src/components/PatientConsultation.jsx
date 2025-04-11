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
  const [neuroOptions, setNeuroOptions] = useState({}); // Store neuro exam options
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
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 2;

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

  const fetchDataWithRetry = async () => {
    setLoading(true);
    setFetchError(null);

    try {
      // Fetch patient, medicines, and prescriptions
      const [patientRes, medicinesRes, prescriptionsRes] = await Promise.all([
        axios.get(
          `https://patient-management-backend-nine.vercel.app/api/patients/${patientId}`,
          { timeout: 10000 }
        ),
        axios.get(
          "https://patient-management-backend-nine.vercel.app/api/medicines",
          { timeout: 10000 }
        ),
        patientId
          ? axios.get(
              `https://patient-management-backend-nine.vercel.app/api/prescriptions/patient/${patientId}`,
              { timeout: 10000 }
            )
          : Promise.resolve({ data: [] }), // Fallback if no patientId yet
      ]);

      console.log("Patient response:", patientRes.data);
      console.log("Medicines response:", medicinesRes.data);
      console.log("Prescriptions response:", prescriptionsRes.data);

      setPatient(patientRes.data);
      setMedicines(
        medicinesRes.data.map((med) => ({
          value: med.id,
          label: `${med.form || ""} ${med.brand_name}${
            med.strength ? ` (${med.strength})` : ""
          }`.trim(),
        }))
      );
      setPrescriptions(prescriptionsRes.data || []);

      // Fetch neuro exam options for all fields
      const neuroPromises = neuroExamFields.map((field) =>
        axios
          .get(
            `https://patient-management-backend-nine.vercel.app/api/neuro-options/${field}`,
            { timeout: 10000 }
          )
          .then((res) => ({
            field,
            options: res.data.map((opt) => ({
              value: opt.id || opt.value,
              label: opt.name || opt.label,
            })),
          }))
          .catch((err) => {
            console.error(`Failed to fetch options for ${field}:`, err.message);
            return { field, options: [] }; // Fallback to empty options
          })
      );

      const neuroResults = await Promise.all(neuroPromises);
      const neuroOptionsMap = neuroResults.reduce((acc, { field, options }) => {
        acc[field] = options;
        return acc;
      }, {});
      console.log("Neuro exam options:", neuroOptionsMap);
      setNeuroOptions(neuroOptionsMap);

    } catch (error) {
      console.error("Error fetching data:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      toast.error(`Failed to load data: ${error.message}`);

      if (retryCount < MAX_RETRIES) {
        const delay = 2000 * (retryCount + 1); // Exponential backoff: 2s, 4s
        toast.info(`Retrying in ${delay / 1000} seconds... (${retryCount + 1}/${MAX_RETRIES})`);
        setTimeout(() => setRetryCount((prev) => prev + 1), delay);
      } else {
        toast.info("Max retries reached. Reloading page...");
        setTimeout(() => window.location.reload(), 2000);
      }
      setFetchError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataWithRetry();
  }, [patientId, navigate, retryCount]);

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
    if (!patient || loading || submissionLoading) {
      toast.error("Please wait for data to load or ongoing submission to complete.");
      return;
    }

    setSubmissionLoading(true);

    const currentState = {
      patientId: patient.id,
      vitalSigns,
      selectedSymptoms,
      selectedMedicines,
      neuroExamData,
      followUpDate,
      followUpNotes,
    };
    console.log("Submitting consultation with state:", currentState);

    try {
      const consultationPayload = {
        patient_id: patient.id,
        doctor_name: "Dr. Abdul Rauf",
        diagnosis: neuroExamData.diagnosis || "",
        notes: neuroExamData.treatment_plan || "",
        consultation_date: new Date().toISOString().split("T")[0],
        status: "completed",
      };

      if (!consultationPayload.patient_id || isNaN(consultationPayload.patient_id)) {
        throw new Error("Invalid patient ID");
      }
      if (!consultationPayload.consultation_date) {
        throw new Error("Missing consultation date");
      }

      const consultationRes = await axios.post(
        "https://patient-management-backend-nine.vercel.app/api/consultations",
        consultationPayload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
          timeout: 15000,
        }
      );

      if (!consultationRes.data?.id) {
        throw new Error("Failed to create consultation record");
      }

      const consultationId = consultationRes.data.id;
      console.log("Consultation created with ID:", consultationId);

      const requests = [];

      requests.push(
        axios.post(
          "https://patient-management-backend-nine.vercel.app/api/vitals",
          {
            consultation_id: consultationId,
            patient_id: patient.id,
            pulse_rate: Number(vitalSigns.pulseRate) || null,
            blood_pressure: vitalSigns.bloodPressure || null,
            temperature: Number(vitalSigns.temperature) || null,
            spo2_level: Number(vitalSigns.spo2) || null,
            nihss_score: Number(vitalSigns.nihss) || null,
            fall_assessment: vitalSigns.fall_assessment || "Done",
          }
        ).catch((err) => {
          console.error("Vitals failed:", err.response?.data || err.message);
          throw err;
        })
      );

      if (selectedSymptoms.length > 0) {
        requests.push(
          axios.post(
            `https://patient-management-backend-nine.vercel.app/api/consultations/${consultationId}/symptoms`,
            {
              symptom_ids: selectedSymptoms
                .map((s) => parseInt(s.value))
                .filter((id) => !isNaN(id)),
            }
          ).catch((err) => {
            console.error("Symptoms failed:", err.response?.data || err.message);
            throw err;
          })
        );
      }

      if (selectedMedicines.length > 0) {
        requests.push(
          axios.post(
            "https://patient-management-backend-nine.vercel.app/api/prescriptions",
            {
              consultation_id: consultationId,
              medicines: selectedMedicines.map((med) => ({
                medicine_id: med.medicine_id,
                dosage_urdu: med.dosage_urdu || "",
                frequency_urdu: med.frequency_urdu || "",
                duration_urdu: med.duration_urdu || "",
                instructions_urdu: med.instructions_urdu || "",
              })),
            }
          ).catch((err) => {
            console.error("Prescriptions failed:", err.response?.data || err.message);
            throw err;
          })
        );
      }

      const neuroPayload = {
        consultation_id: consultationId,
        patient_id: patient.id,
        ...neuroExamData,
        diagnosis: neuroExamData.diagnosis || "",
        treatment_plan: neuroExamData.treatment_plan || "",
      };

      const booleanFields = [
        "pain_sensation",
        "vibration_sense",
        "proprioception",
        "temperature_sensation",
        "brudzinski_sign",
        "kernig_sign",
        "facial_sensation",
        "swallowing_function",
      ];
      booleanFields.forEach((field) => {
        neuroPayload[field] = !!neuroExamData[field];
      });

      requests.push(
        axios.post(
          "https://patient-management-backend-nine.vercel.app/api/examination",
          neuroPayload
        ).catch((err) => {
          console.error("Neuro exam failed:", err.response?.data || err.message);
          throw err;
        })
      );

      await Promise.all(requests);

      if (followUpDate && selectedDuration) {
        await axios.post(
          `https://patient-management-backend-nine.vercel.app/api/followups/consultations/${consultationId}/followups`,
          {
            follow_up_date: new Date(followUpDate).toISOString().split("T")[0],
            notes: followUpNotes || "Routine follow-up",
            duration_days: parseInt(selectedDuration) || 7,
          }
        );
      }

      toast.success("Consultation saved successfully!");
      handlePrint();
      setTimeout(() => navigate("/"), 1500);
    } catch (error) {
      console.error("Submission failed:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to save consultation. Please try again."
      );
    } finally {
      setSubmissionLoading(false);
    }
  };

  useEffect(() => {
    const handleOnlineSync = () => {
      const pending = JSON.parse(localStorage.getItem("pendingConsultations") || "[]");
      if (pending.length > 0) {
        pending.forEach(async (data) => {
          try {
            await submitConsultation(data);
            localStorage.setItem(
              "pendingConsultations",
              JSON.stringify(pending.filter((item) => item.timestamp !== data.timestamp))
            );
          } catch (error) {
            console.error("Background sync failed:", error);
          }
        });
      }
    };
    window.addEventListener("online", handleOnlineSync);
    return () => window.removeEventListener("online", handleOnlineSync);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-600">
          Loading consultation data... Attempt {retryCount + 1}/{MAX_RETRIES + 1}
        </p>
      </div>
    );
  }

  if (fetchError && retryCount >= MAX_RETRIES) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-red-600">
          Failed to load data after multiple attempts: {fetchError}. Reloading...
        </p>
      </div>
    );
  }

  if (!patient) return null;

  return (
    <div className="min-h-screen p-8 relative overflow-hidden isolate w-[90vw] mx-auto before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.9),_transparent)] before:opacity-50 before:-z-10">
      <div className="mx-auto max-w-6xl rounded-2xl border border-white/30 bg-white/95 backdrop-blur-sm p-8 shadow-2xl shadow-gray-100/30">
        <h2 className="mb-6 border-b border-gray-200 pb-4 text-2xl font-bold text-gray-900">
          <span className="bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">
            Patient Consultation Portal
          </span>
        </h2>
        <PatientInfoHeader
          patient={patient}
          onReturnHome={handleReturnHome}
          setShowPopup={setShowPopup}
          prescriptions={prescriptions} // Pass prescriptions if needed
        />
        <ConsultationForm
          vitalSigns={vitalSigns}
          onVitalSignsChange={setVitalSigns}
          selectedSymptoms={selectedSymptoms}
          onSymptomsChange={setSelectedSymptoms}
          neuroExamData={neuroExamData}
          setNeuroExamData={setNeuroExamData}
          neuroExamFields={neuroExamFields}
          neuroOptions={neuroOptions} // Pass pre-fetched options
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
          medicines={medicines} // Pass medicines to avoid separate fetch
        />
      </div>
      <ToastContainer />
    </div>
  );
};

export default PatientConsultation;
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
  const [followUpDate, setFollowUpDate] = useState(null);
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientRes, medicinesRes] = await Promise.all([
          axios.get(
            `https://patient-management-backend-nine.vercel.app/api/patients/${patientId}`
          ),
          axios.get(
            "https://patient-management-backend-nine.vercel.app/api/medicines"
          ),
        ]);
        setPatient(patientRes.data);
        setMedicines(
          medicinesRes.data.map((med) => ({
            value: med.id,
            label: `${med.form} ${med.brand_name}${
              med.strength ? ` (${med.strength})` : ""
            }`,
          }))
        );
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load patient or medicines");
        navigate("/");
      }
    };
    fetchData();
  }, [patientId, navigate]);

  useEffect(() => {
    if (patient?.id) {
      const fetchPrescriptions = async () => {
        try {
          const response = await axios.get(
            `https://patient-management-backend-nine.vercel.app/api/prescriptions/patient/${patient.id}`
          );
          setPrescriptions(response.data || []);
        } catch (error) {
          console.error("Error fetching prescriptions:", error);
          if (error.response && error.response.status === 404)
            setPrescriptions([]);
        }
      };
      fetchPrescriptions();
    }
  }, [patient?.id]);

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

  // const submitConsultation = async () => {
  //   if (!patient) return;
  //   setLoading(true);

  //   const createFollowUpWithRetry = async (consultationId, attempt = 1) => {
  //     try {
  //       return await axios.post(
  //         `http://localhost:4500/api/followups/consultations/${consultationId}/followups`,
  //         {
  //           follow_up_date: followUpDate.toISOString().split("T")[0],
  //           notes: followUpNotes || "عام چیک اپ",
  //           duration_days: selectedDuration
  //         }
  //       );
  //     } catch (error) {
  //       if (error.response?.status === 404 && attempt < 3) {
  //         await new Promise(resolve => setTimeout(resolve, 500 * attempt));
  //         return createFollowUpWithRetry(consultationId, attempt + 1);
  //       }
  //       throw error;
  //     }
  //   };

  //   try {
  //     const consultationRes = await axios.post(
  //       "https://patient-management-backend-nine.vercel.app/api/consultations",
  //       { patient_id: patient.id, doctor_name: "Dr. Abdul Rauf" }
  //     );
  //     const consultationId = consultationRes.data.id;

  //     let allTests = [];
  //     if (!allTests.length) {
  //       const testsResponse = await axios.get("https://patient-management-backend-nine.vercel.app/api/tests");
  //       allTests = testsResponse.data;
  //     }

  //     const testIds = selectedTests.map(name => allTests.find(t => t.test_name === name)?.id).filter(Boolean);
  //     const testAssignmentPromises = testIds.map(testId =>
  //       axios.post("https://patient-management-backend-nine.vercel.app/api/tests/assign", {
  //         test_id: testId,
  //         consultation_id: consultationId,
  //       })
  //     );

  //     const apiCalls = [];
  //     const hasVitalValues = Object.values({
  //       pulse_rate: vitalSigns.pulseRate,
  //       blood_pressure: vitalSigns.bloodPressure,
  //       temperature: vitalSigns.temperature,
  //       spo2_level: vitalSigns.spo2,
  //       nihss_score: vitalSigns.nihss,
  //     }).some(v => v);

  //     if (hasVitalValues) {
  //       apiCalls.push(
  //         axios.post("https://patient-management-backend-nine.vercel.app/api/vitals", {
  //           consultation_id: consultationId,
  //           patient_id: patient.id,
  //           pulse_rate: Number(vitalSigns.pulseRate) || null,
  //           blood_pressure: vitalSigns.bloodPressure || null,
  //           temperature: Number(vitalSigns.temperature) || null,
  //           spo2_level: Number(vitalSigns.spo2) || null,
  //           nihss_score: Number(vitalSigns.nihss) || null,
  //           fall_assessment: vitalSigns.fall_assessment || "Done",
  //         })
  //       );
  //     }

  //     if (selectedSymptoms.length > 0) {
  //       apiCalls.push(
  //         axios.post(`https://patient-management-backend-nine.vercel.app/api/consultations/${consultationId}/symptoms`, {
  //           patient_id: patient.id,
  //           symptom_ids: selectedSymptoms.map(s => s.value),
  //         })
  //       );
  //     }

  //     if (selectedMedicines.length > 0) {
  //       apiCalls.push(
  //         axios.post("https://patient-management-backend-nine.vercel.app/api/prescriptions", {
  //           consultation_id: consultationId,
  //           patient_id: patient.id,
  //           medicines: selectedMedicines.map(med => ({
  //             medicine_id: med.medicine_id,
  //             dosage_en: med.dosage_en,
  //             dosage_urdu: med.dosage_urdu,
  //             frequency_en: med.frequency_en,
  //             frequency_urdu: med.frequency_urdu,
  //             duration_en: med.duration_en,
  //             duration_urdu: med.duration_urdu,
  //             instructions_en: med.instructions_en,
  //             instructions_urdu: med.instructions_urdu,
  //           })),
  //         })
  //       );
  //     }

  //     const neuroData = neuroExamFields.reduce((acc, key) => {
  //       if (neuroExamData[key]?.trim()) acc[key] = neuroExamData[key];
  //       return acc;
  //     }, {});
  //     const hasNeuroData = Object.keys(neuroData).length > 0;

  //     if (hasNeuroData || neuroExamData.diagnosis || neuroExamData.treatment_plan) {
  //       apiCalls.push(
  //         axios.post("https://patient-management-backend-nine.vercel.app/api/examination", {
  //           consultation_id: consultationId,
  //           patient_id: patient.id,
  //           ...neuroData,
  //           diagnosis: neuroExamData.diagnosis || "",
  //           treatment_plan: neuroExamData.treatment_plan || "",
  //           pain_sensation: !!neuroExamData.pain_sensation,
  //           vibration_sense: !!neuroExamData.vibration_sense,
  //           proprioception: !!neuroExamData.proprioception,
  //           temperature_sensation: !!neuroExamData.temperature_sensation,
  //           brudzinski_sign: !!neuroExamData.brudzinski_sign,
  //           kernig_sign: !!neuroExamData.kernig_sign,
  //           facial_sensation: !!neuroExamData.facial_sensation,
  //           swallowing_function: !!neuroExamData.swallowing_function,
  //           mmse_score: neuroExamData.mmse_score || "",
  //           gcs_score: neuroExamData.gcs_score || "",
  //         })
  //       );
  //     }

  //     if (selectedDuration && followUpDate) {
  //     apiCalls.push(createFollowUpWithRetry(consultationId));  // Changed this line
  //   }

  //     apiCalls.push(...testAssignmentPromises);
  //     const results = await Promise.allSettled(apiCalls);
  //     const failedCalls = results.filter(r => r.status === "rejected");

  //     if (failedCalls.length > 0) {
  //       console.error("Some API calls failed:", failedCalls.map(r => r.reason.response?.data || r.reason.message));
  //       throw new Error("Some parts of the form could not be submitted.");
  //     }

  //     toast.success("Consultation added successfully! 🎉", { position: "top-right", autoClose: 2000 });
  //     setVitalSigns({ pulseRate: "", bloodPressure: "", temperature: "", spo2: "", nihss: "", fall_assessment: "Done" });
  //     setFollowUpDate(null);
  //     setFollowUpNotes("");
  //     setSelectedDuration(null);
  //     handlePrint();
  //     setTimeout(() => {
  //       navigate('/');
  //       window.location.reload();
  //     }, 1000);
  //   } catch (error) {
  //     console.error("❌ Error submitting consultation:", error.response?.data || error.message);
  //     alert("An error occurred while saving the consultation.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const submitConsultation = async () => {
  //   if (!patient) return;
  //   setLoading(true);

  //   // Retry handler specifically for follow-ups
  //   const createFollowUpWithRetry = async (consultationId, attempt = 1) => {
  //     try {
  //       return await axios.post(
  //         `https://patient-management-backend-nine.vercel.app/api/followups/consultations/${consultationId}/followups`,
  //         {
  //           follow_up_date: followUpDate.toISOString().split("T")[0],
  //           notes: followUpNotes || "عام چیک اپ",
  //           duration_days: selectedDuration,
  //         }
  //       );
  //     } catch (error) {
  //       if (attempt < 3) {
  //         const delay = 500 * Math.pow(2, attempt);
  //         await new Promise((resolve) => setTimeout(resolve, delay));
  //         return createFollowUpWithRetry(consultationId, attempt + 1);
  //       }
  //       throw error;
  //     }
  //   };

  //   try {
  //     // 1. Create Consultation First
  //     const consultationRes = await axios.post(
  //       "https://patient-management-backend-nine.vercel.app/api/consultations",
  //       {
  //         patient_id: patient.id,
  //         doctor_name: "Dr. Abdul Rauf",
  //         diagnosis: neuroExamData.diagnosis || null,
  //         notes: neuroExamData.treatment_plan || null,
  //       }
  //     );
  //     const consultationId = consultationRes.data.id;

  //     // 2. Sequential Processing of Dependencies
  //     const processingSteps = [];

  //     // 2A. Assign Tests
  //     if (selectedTests.length > 0) {
  //       const testsResponse = await axios.get(
  //         "https://patient-management-backend-nine.vercel.app/api/tests"
  //       );
  //       const testIds = selectedTests
  //         .map(
  //           (name) => testsResponse.data.find((t) => t.test_name === name)?.id
  //         )
  //         .filter(Boolean);

  //       if (testIds.length > 0) {
  //         processingSteps.push(
  //           axios.post(
  //             "https://patient-management-backend-nine.vercel.app/api/tests/assign",
  //             { test_ids: testIds, consultation_id: consultationId }
  //           )
  //         );
  //       }
  //     }

  //     // 2B. Add Vitals
  //     processingSteps.push(
  //       axios.post(
  //         "https://patient-management-backend-nine.vercel.app/api/vitals",
  //         {
  //           consultation_id: consultationId,
  //           patient_id: patient.id,
  //           pulse_rate: Number(vitalSigns.pulseRate) || null,
  //           blood_pressure: vitalSigns.bloodPressure || null,
  //           temperature: Number(vitalSigns.temperature) || null,
  //           spo2_level: Number(vitalSigns.spo2) || null,
  //           nihss_score: Number(vitalSigns.nihss) || null,
  //           fall_assessment: vitalSigns.fall_assessment || "Done",
  //         }
  //       )
  //     );

  //     // 2C. Add Symptoms
  //     if (selectedSymptoms.length > 0) {
  //       processingSteps.push(
  //         axios.post(
  //           `https://patient-management-backend-nine.vercel.app/api/consultations/${consultationId}/symptoms`,
  //           { symptom_ids: selectedSymptoms.map((s) => s.value) }
  //         )
  //       );
  //     }

  //     // 2D. Add Prescriptions
  //     if (selectedMedicines.length > 0) {
  //       processingSteps.push(
  //         axios.post(
  //           "https://patient-management-backend-nine.vercel.app/api/prescriptions",
  //           {
  //             consultation_id: consultationId,
  //             medicines: selectedMedicines.map((med) => ({
  //               medicine_id: med.medicine_id,
  //               dosage_en: med.dosage_en,
  //               dosage_urdu: med.dosage_urdu,
  //               frequency_en: med.frequency_en,
  //               frequency_urdu: med.frequency_urdu,
  //               duration_en: med.duration_en,
  //               duration_urdu: med.duration_urdu,
  //               instructions_en: med.instructions_en,
  //               instructions_urdu: med.instructions_urdu,
  //             })),
  //           }
  //         )
  //       );
  //     }

  //     // 2E. Add Neuro Exam Data
  //     processingSteps.push(
  //       axios.post(
  //         "https://patient-management-backend-nine.vercel.app/api/examination",
  //         {
  //           consultation_id: consultationId,
  //           patient_id: patient.id,
  //           ...neuroExamData,
  //           diagnosis: neuroExamData.diagnosis || "",
  //           treatment_plan: neuroExamData.treatment_plan || "",
  //           pain_sensation: !!neuroExamData.pain_sensation,
  //           vibration_sense: !!neuroExamData.vibration_sense,
  //           proprioception: !!neuroExamData.proprioception,
  //           temperature_sensation: !!neuroExamData.temperature_sensation,
  //           brudzinski_sign: !!neuroExamData.brudzinski_sign,
  //           kernig_sign: !!neuroExamData.kernig_sign,
  //           facial_sensation: !!neuroExamData.facial_sensation,
  //           swallowing_function: !!neuroExamData.swallowing_function,
  //           mmse_score: neuroExamData.mmse_score || "",
  //           gcs_score: neuroExamData.gcs_score || "",
  //         }
  //       )
  //     );

  //     // 3. Execute All Processing Steps
  //     const results = await Promise.allSettled(processingSteps);
  //     const failedSteps = results.filter((r) => r.status === "rejected");

  //     // 4. Handle Follow-up After Core Data
  //     if (selectedDuration && followUpDate) {
  //       try {
  //         await createFollowUpWithRetry(consultationId);
  //       } catch (error) {
  //         failedSteps.push({
  //           status: "rejected",
  //           reason: error,
  //         });
  //       }
  //     }

  //     // 5. Handle Any Failures
  //     if (failedSteps.length > 0) {
  //       const errorMessages = failedSteps.map(
  //         (f) => f.reason.response?.data?.error || f.reason.message
  //       );

  //       console.error("Partial submission errors:", errorMessages);
  //       throw new Error(
  //         `Some components failed to save: ${errorMessages.join(", ")}`
  //       );
  //     }

  //     // 6. Success Handling
  //     toast.success("Consultation added successfully! 🎉", {
  //       position: "top-right",
  //       autoClose: 2000,
  //     });

  //     // 7. Reset Form State
  //     setVitalSigns({
  //       pulseRate: "",
  //       bloodPressure: "",
  //       temperature: "",
  //       spo2: "",
  //       nihss: "",
  //       fall_assessment: "Done",
  //     });
  //     setFollowUpDate(null);
  //     setFollowUpNotes("");
  //     setSelectedDuration(null);

  //     // 8. Navigation and Print
  //     handlePrint();
  //     setTimeout(() => {
  //       navigate("/");
  //       window.location.reload();
  //     }, 1000);
  //   } catch (error) {
  //     console.error("Submission Error:", {
  //       error: error.message,
  //       patientId: patient?.id,
  //       timestamp: new Date().toISOString(),
  //     });

  //     alert(
  //       error.message.includes("Some components")
  //         ? error.message
  //         : "Failed to save consultation. Please check your data and try again."
  //     );
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const submitConsultation = async () => {
  //   if (!patient) return;
  //   setLoading(true);

  //   // 1. Create consultation payload
  //   const consultationPayload = {
  //     patient_id: patient.id,
  //     doctor_name: "Dr. Abdul Rauf",
  //     diagnosis: neuroExamData.diagnosis || null,
  //     notes: neuroExamData.treatment_plan || null,
  //   };

  //   try {
  //     // 2. Create main consultation
  //     const consultationRes = await axios.post(
  //       "https://patient-management-backend-nine.vercel.app/api/consultations",
  //       consultationPayload
  //     );
  //     const consultationId = consultationRes.data.id;

  //     // 3. Prepare all secondary requests
  //     const requests = [];

  //     // 3A. Handle Tests Assignment
  //     if (selectedTests.length > 0) {
  //       requests.push(async () => {
  //         const testsRes = await axios.get(
  //           "https://patient-management-backend-nine.vercel.app/api/tests"
  //         );
  //         const testIds = selectedTests
  //           .map((name) => testsRes.data.find((t) => t.test_name === name)?.id)
  //           .filter(Boolean);

  //         if (testIds.length > 0) {
  //           return axios.post(
  //             "https://patient-management-backend-nine.vercel.app/api/tests/assign",
  //             { test_ids: testIds, consultation_id: consultationId }
  //           );
  //         }
  //       });
  //     }

  //     // 3B. Handle Vitals
  //     requests.push(() =>
  //       axios.post(
  //         "https://patient-management-backend-nine.vercel.app/api/vitals",
  //         {
  //           consultation_id: consultationId,
  //           patient_id: patient.id,
  //           pulse_rate: Number(vitalSigns.pulseRate) || null,
  //           blood_pressure: vitalSigns.bloodPressure || null,
  //           temperature: Number(vitalSigns.temperature) || null,
  //           spo2_level: Number(vitalSigns.spo2) || null,
  //           nihss_score: Number(vitalSigns.nihss) || null,
  //           fall_assessment: vitalSigns.fall_assessment || "Done",
  //         }
  //       )
  //     );

  //     // 3C. Handle Symptoms
  //     if (selectedSymptoms.length > 0) {
  //       try {
  //         // Convert to numbers and validate
  //         const symptomIds = selectedSymptoms.map(s => {
  //           const id = Number(s.value);
  //           if (isNaN(id)) throw new Error(`Invalid symptom ID: ${s.value}`);
  //           return id;
  //         });

  //         const response = await axios.post(
  //           `/api/consultations/${consultationId}/symptoms`,
  //           { symptom_ids: symptomIds },
  //           {
  //             headers: {
  //               'Content-Type': 'application/json',
  //             }
  //           }
  //         );

  //         console.log('Symptoms added:', response.data.added_count);
  //       } catch (error) {
  //         console.error('Symptom submission error:', {
  //           error: error.response?.data || error.message,
  //           attemptedIds: symptomIds,
  //           consultationId
  //         });
  //         throw new Error(
  //           error.response?.data?.error || 'Failed to save symptoms to consultation'
  //         );
  //       }
  //     }

  //     // 3D. Handle Prescriptions
  //     if (selectedMedicines.length > 0) {
  //       requests.push(() =>
  //         axios.post(
  //           "https://patient-management-backend-nine.vercel.app/api/prescriptions",
  //           {
  //             consultation_id: consultationId,
  //             medicines: selectedMedicines.map((med) => ({
  //               medicine_id: med.medicine_id,
  //               dosage_urdu: med.dosage_urdu,
  //               frequency_urdu: med.frequency_urdu,
  //               duration_urdu: med.duration_urdu,
  //               instructions_urdu: med.instructions_urdu,
  //             })),
  //           }
  //         )
  //       );
  //     }

  //     // 3E. Handle Neuro Exam
  //     requests.push(() =>
  //       axios.post(
  //         "https://patient-management-backend-nine.vercel.app/api/examination",
  //         {
  //           consultation_id: consultationId,
  //           patient_id: patient.id,
  //           ...neuroExamData,
  //           diagnosis: neuroExamData.diagnosis || "",
  //           treatment_plan: neuroExamData.treatment_plan || "",
  //           pain_sensation: !!neuroExamData.pain_sensation,
  //           vibration_sense: !!neuroExamData.vibration_sense,
  //           proprioception: !!neuroExamData.proprioception,
  //           temperature_sensation: !!neuroExamData.temperature_sensation,
  //           brudzinski_sign: !!neuroExamData.brudzinski_sign,
  //           kernig_sign: !!neuroExamData.kernig_sign,
  //           facial_sensation: !!neuroExamData.facial_sensation,
  //           swallowing_function: !!neuroExamData.swallowing_function,
  //           mmse_score: neuroExamData.mmse_score || "",
  //           gcs_score: neuroExamData.gcs_score || "",
  //         }
  //       )
  //     );

  //     // 4. Execute all requests with error handling
  //     const results = await Promise.allSettled(
  //       requests.map((fn) => fn().catch((e) => e))
  //     );

  //     // 5. Check for errors in any request
  //     const errors = results
  //       .filter((result) => result.status === "rejected")
  //       .map(
  //         (result) =>
  //           result.reason.response?.data?.message || result.reason.message
  //       );

  //     if (errors.length > 0) {
  //       console.error("Partial submission errors:", errors);
  //       throw new Error(`Some components failed: ${errors.join(", ")}`);
  //     }

  //     // 6. Handle Follow-up
  //     if (selectedDuration && followUpDate) {
  //       try {
  //         await axios.post(
  //           `https://patient-management-backend-nine.vercel.app/api/followups/consultations/${consultationId}/followups`,
  //           {
  //             follow_up_date: followUpDate.toISOString().split("T")[0],
  //             notes: followUpNotes || "عام چیک اپ",
  //             duration_days: selectedDuration,
  //           }
  //         );
  //       } catch (error) {
  //         console.error("Follow-up error:", error.response?.data);
  //         throw new Error("Follow-up creation failed");
  //       }
  //     }

  //     // 7. Success handling
  //     toast.success("Consultation added successfully! 🎉", {
  //       position: "top-right",
  //       autoClose: 2000,
  //     });

  //     // Reset form state
  //     setVitalSigns({
  //       pulseRate: "",
  //       bloodPressure: "",
  //       temperature: "",
  //       spo2: "",
  //       nihss: "",
  //       fall_assessment: "Done",
  //     });
  //     setFollowUpDate(null);
  //     setFollowUpNotes("");
  //     setSelectedDuration(null);

  //     handlePrint();
  //     setTimeout(() => navigate("/"), 1000);
  //   } catch (error) {
  //     console.error("Submission Error:", error);
  //     alert(
  //       error.message ||
  //         "Failed to save consultation. Please check your data and try again."
  //     );
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const submitConsultation = async () => {
    if (!patient) return;
    setLoading(true);

    // Prepare complete consultation data for offline storage
    const consultationData = {
      patient: patient.id,
      doctor: "Dr. Abdul Rauf",
      diagnosis: neuroExamData.diagnosis,
      treatmentPlan: neuroExamData.treatment_plan,
      tests: selectedTests,
      vitals: vitalSigns,
      symptoms: selectedSymptoms,
      medicines: selectedMedicines,
      followUp: {
        date: followUpDate,
        notes: followUpNotes,
        duration: selectedDuration,
      },
      timestamp: new Date().toISOString(),
    };

    // Local storage helper
    const storeOfflineConsultation = () => {
      const pending = JSON.parse(
        localStorage.getItem("pendingConsultations") || "[]"
      );
      localStorage.setItem(
        "pendingConsultations",
        JSON.stringify([...pending, consultationData])
      );
      toast.warning("Consultation saved locally. Will submit when online.", {
        position: "top-right",
        autoClose: 3000,
      });
    };

    // Optimized submission function
    const processConsultation = async () => {
      try {
        // 1. Create main consultation with timeout
        const consultationRes = await Promise.race([
          axios.post(
            "https://patient-management-backend-nine.vercel.app/api/consultations",
            {
              patient_id: patient.id,
              doctor_name: "Dr. Abdul Rauf",
              diagnosis: neuroExamData.diagnosis || null,
              notes: neuroExamData.treatment_plan || null,
            }
          ),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Request timeout")), 5000)
          ),
        ]);

        const consultationId = consultationRes.data.id;

        // 2. Prepare all parallel requests
        const requests = [];

        // 2A. Tests Assignment (optimized)
        if (selectedTests.length > 0) {
          requests.push(
            (async () => {
              const testsRes = await axios.get("/api/tests");
              const testIds = selectedTests
                .map(
                  (name) => testsRes.data.find((t) => t.test_name === name)?.id
                )
                .filter(Boolean);

              return testIds.length > 0
                ? axios.post("/api/tests/assign", {
                    test_ids: testIds,
                    consultation_id: consultationId,
                  })
                : Promise.resolve();
            })()
          );
        }

        // 2B. Vitals
        requests.push(
          axios.post("/api/vitals", {
            consultation_id: consultationId,
            patient_id: patient.id,
            ...vitalSigns,
            pulse_rate: Number(vitalSigns.pulseRate) || null,
            temperature: Number(vitalSigns.temperature) || null,
            spo2_level: Number(vitalSigns.spo2) || null,
            nihss_score: Number(vitalSigns.nihss) || null,
          })
        );

        // 2C. Symptoms (parallelized)
        if (selectedSymptoms.length > 0) {
          requests.push(
            axios.post(`/api/consultations/${consultationId}/symptoms`, {
              symptom_ids: selectedSymptoms.map((s) => Number(s.value)),
            })
          );
        }

        // 2D. Prescriptions
        if (selectedMedicines.length > 0) {
          requests.push(
            axios.post("/api/prescriptions", {
              consultation_id: consultationId,
              medicines: selectedMedicines.map((med) => ({
                medicine_id: med.medicine_id,
                dosage_urdu: med.dosage_urdu,
                frequency_urdu: med.frequency_urdu,
                duration_urdu: med.duration_urdu,
                instructions_urdu: med.instructions_urdu,
              })),
            })
          );
        }

        // 2E. Neuro Exam
        requests.push(
          axios.post("/api/examination", {
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
          })
        );

        // 3. Execute all requests in parallel
        const results = await Promise.allSettled(requests);
        const errors = results.filter((r) => r.status === "rejected");

        // 4. Handle follow-up (non-blocking)
        if (selectedDuration && followUpDate) {
          axios
            .post(`/api/followups/consultations/${consultationId}/followups`, {
              follow_up_date: followUpDate.toISOString().split("T")[0],
              notes: followUpNotes || "عام چیک اپ",
              duration_days: selectedDuration,
            })
            .catch((e) => console.warn("Follow-up failed:", e));
        }

        // 5. Handle partial errors
        if (errors.length > 0) {
          console.warn("Partial data saved:", errors);
          storeOfflineConsultation();
          throw new Error("Some data saved - remaining will sync later");
        }

        // 6. Success handling
        toast.success("Consultation submitted! 🎉");
        handlePrint();
        setTimeout(() => navigate("/"), 1000);
      } catch (error) {
        if (!navigator.onLine || error.message.includes("Network Error")) {
          storeOfflineConsultation();
        } else {
          throw error;
        }
      } finally {
        // 7. Reset form regardless of success
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
      }
    };

    try {
      await processConsultation();
    } catch (error) {
      console.error("Submission Error:", error);
      alert(
        error.message.includes("Some data saved")
          ? "Partially saved - remaining data will sync when online"
          : "Failed to save consultation. Please check your data and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Add background sync
  window.addEventListener("online", () => {
    const pending = JSON.parse(
      localStorage.getItem("pendingConsultations") || []
    );
    if (pending.length > 0) {
      pending.forEach(async (data) => {
        try {
          await submitConsultation(data);
          localStorage.setItem(
            "pendingConsultations",
            JSON.stringify(
              pending.filter((item) => item.timestamp !== data.timestamp)
            )
          );
        } catch (error) {
          console.error("Background sync failed:", error);
        }
      });
    }
  });

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
          // prescriptions={prescriptions}
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
          tests={tests}
          selectedTests={selectedTests}
          onTestsChange={setSelectedTests}
          loading={loading}
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
        />
        {/* {showPopup && (
          <PrescriptionsPopup
            prescriptions={prescriptions}
            onClose={() => setShowPopup(false)}
          />
        )} */}
      </div>
      <ToastContainer />
    </div>
  );
};

export default PatientConsultation;

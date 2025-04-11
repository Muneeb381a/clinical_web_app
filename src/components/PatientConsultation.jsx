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


  const submitConsultation = async () => {
    if (!patient) return;
    setLoading(true);
  
    try {
      // 1. Prepare consultation payload with validation
      const consultationPayload = {
        patient_id: patient.id,
        doctor_name: "Dr. Abdul Rauf",
        diagnosis: neuroExamData.diagnosis || "",
        notes: neuroExamData.treatment_plan || "",
        consultation_date: new Date().toISOString().split('T')[0], // Required field
        status: "completed" // Add required status field
      };
  
      // 2. Client-side validation
      const validationErrors = [];
      if (!consultationPayload.patient_id || isNaN(consultationPayload.patient_id)) {
        validationErrors.push("Invalid patient ID");
      }
      if (!consultationPayload.consultation_date) {
        validationErrors.push("Missing consultation date");
      }
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(", "));
      }
  
      // 3. Create consultation
      const consultationRes = await axios.post(
        "https://patient-management-backend-nine.vercel.app/api/consultations",
        consultationPayload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          },
          timeout: 10000
        }
      );
  
      if (!consultationRes.data?.id) {
        throw new Error("Failed to create consultation record");
      }
  
      const consultationId = consultationRes.data.id;
  
      // 4. Prepare all additional data requests
      const requests = [];
  
      // Add vital signs
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
        )
      );
  
      // Add symptoms
      if (selectedSymptoms.length > 0) {
        requests.push(
          axios.post(
            `https://patient-management-backend-nine.vercel.app/api/consultations/${consultationId}/symptoms`,
            {
              symptom_ids: selectedSymptoms
                .map(s => parseInt(s.value))
                .filter(id => !isNaN(id))
            }
          )
        );
      }
  
      // Add prescriptions
      if (selectedMedicines.length > 0) {
        requests.push(
          axios.post(
            "https://patient-management-backend-nine.vercel.app/api/prescriptions",
            {
              consultation_id: consultationId,
              medicines: selectedMedicines.map(med => ({
                medicine_id: med.medicine_id,
                dosage_urdu: med.dosage_urdu || "",
                frequency_urdu: med.frequency_urdu || "",
                duration_urdu: med.duration_urdu || "",
                instructions_urdu: med.instructions_urdu || "",
              }))
            }
          )
        );
      }
  
      // Add neuro exam
      const neuroPayload = {
        consultation_id: consultationId,
        patient_id: patient.id,
        ...neuroExamData,
        diagnosis: neuroExamData.diagnosis || "",
        treatment_plan: neuroExamData.treatment_plan || "",
      };
      
      // Convert boolean fields
      const booleanFields = [
        'pain_sensation', 'vibration_sense', 'proprioception',
        'temperature_sensation', 'brudzinski_sign', 'kernig_sign',
        'facial_sensation', 'swallowing_function'
      ];
      
      booleanFields.forEach(field => {
        neuroPayload[field] = !!neuroExamData[field];
      });
  
      requests.push(
        axios.post(
          "https://patient-management-backend-nine.vercel.app/api/examination",
          neuroPayload
        )
      );
  
      // 5. Execute all requests
      const results = await Promise.allSettled(requests);
      
      // 6. Handle errors
      const failedRequests = results.filter(r => r.status === "rejected");
      if (failedRequests.length > 0) {
        console.error("Partial failures:", failedRequests);
        throw new Error("Some components failed to save");
      }
  
      // 7. Add follow-up if needed
      if (followUpDate && selectedDuration) {
        await axios.post(
          `https://patient-management-backend-nine.vercel.app/api/followups/consultations/${consultationId}/followups`,
          {
            follow_up_date: new Date(followUpDate).toISOString().split('T')[0],
            notes: followUpNotes || "Routine follow-up",
            duration_days: parseInt(selectedDuration) || 7
          }
        );
      }
  
      // 8. Success handling
      toast.success("Consultation saved successfully!");
      handlePrint();
      setTimeout(() => navigate("/"), 1500);
  
    } catch (error) {
      console.error("Submission failed:", {
        error: error.response?.data || error.message,
        stack: error.stack
      });
  
      toast.error(
        error.response?.data?.message ||
        error.message ||
        "Failed to save consultation. Please check your data."
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

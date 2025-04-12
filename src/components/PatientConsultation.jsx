import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import PatientInfoHeader from "./PatientInfoHeader";
import ConsultationForm from "./ConsultationForm";
import PrescriptionsPopup from "./PrescriptionsPopup";
import printConsultation from "../utils/printConsultation";
import { v4 as uuidv4 } from 'uuid';

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

  const fetchWithRetry = async (
    url,
    resourceName,
    transformFn,
    retries = MAX_RETRIES
  ) => {
    let attempt = 0;
    while (attempt <= retries) {
      try {
        const response = await axios.get(`${BASE_URL}${url}`, {
          timeout: 10000,
          headers: { "Content-Type": "application/json" },
        });
        console.log(`Raw response for ${resourceName}:`, response.data);
        const data =
          response.data.data && Array.isArray(response.data.data)
            ? response.data.data
            : response.data;
        const transformed = Array.isArray(data)
          ? transformFn(data)
          : transformFn(data);
        console.log(`Fetched ${resourceName}:`, transformed);
        return transformed;
      } catch (error) {
        console.error(
          `Error fetching ${resourceName} (attempt ${attempt + 1}/${
            retries + 1
          }):`,
          {
            status: error.response?.status,
            message: error.response?.data?.message || error.message,
            url: `${BASE_URL}${url}`,
          }
        );
        if (error.response?.status >= 400 && error.response?.status < 600) {
          if (attempt < retries) {
            const delay = 1000 * Math.pow(2, attempt);
            // toast.info(`Failed to fetch ${resourceName}. Retrying in ${delay / 1000}s...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            attempt++;
          } else {
            console.warn(
              `Max retries reached for ${resourceName}. Returning default.`
            );
            return [];
          }
        } else {
          console.warn(
            `Invalid data format for ${resourceName}. Returning default.`
          );
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
        fetchWithRetry("/api/medicines", "medicines", (data) =>
          data.map((med) => ({
            value: med.id,
            label: `${med.form || ""} ${med.brand_name}${
              med.strength ? ` (${med.strength})` : ""
            }`.trim(),
          }))
        ).then((medicinesData) => {
          setMedicines(medicinesData || []);
          console.log("Medicines set:", medicinesData);
        }),

        fetchWithRetry("/api/symptoms", "symptoms", (data) =>
          data.map((sym) => ({ value: sym.id, label: sym.name }))
        ).then((symptomsData) => {
          setSymptomsOptions(symptomsData || []);
          console.log("Symptoms set:", symptomsData);
        }),

        fetchWithRetry("/api/tests", "tests", (data) =>
          data.map((test) => ({
            value: test.id,
            label: test.test_name || test.name,
          }))
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
          // console.log("Neuro options set:", neuroOptionsMap);
        }),
      ];

      // Wait for all parallel fetches to complete
      await Promise.all(fetchPromises);
      console.log("All data fetched successfully");
    } catch (error) {
      console.error("Critical fetch error:", error);
      setFetchError(`Failed to load data: ${error.message}`);
      // toast.error(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
      console.log(
        "Loading complete, patient state:",
        patient,
        "fetchError:",
        fetchError
      );
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
      toast.error(
        "Please wait for data to load or ongoing submission to complete."
      );
      return;
    }

    setSubmissionLoading(true);

    try {
      // Step 1: Create Consultation (Core)
      const consultationPayload = {
        patient_id: patient.id,
        doctor_name: "Dr. Abdul Rauf",
        diagnosis: neuroExamData.diagnosis || null,
        notes: neuroExamData.treatment_plan || null,
        consultation_date: new Date().toISOString().split("T")[0],
        status: "completed",
      };

      const consultationRes = await axios.post(
        `${BASE_URL}/api/consultations`,
        consultationPayload,
        { timeout: 15000 }
      );
      const consultationId = consultationRes.data.id;

      // Retry handler for non-critical requests
      const withRetry = async (fn, retries = 3) => {
        try {
          return await fn();
        } catch (error) {
          if (retries <= 0) throw error;
          await new Promise((resolve) =>
            setTimeout(resolve, 500 * (3 - retries))
          );
          return withRetry(fn, retries - 1);
        }
      };

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

        requests.push(
          withRetry(() =>
            axios
              .post(`${BASE_URL}/api/vitals`, vitalsPayload)
              .catch((error) => console.error("Vitals failed silently"))
          )
        );
      }

      // Step 3: Symptoms
      if (selectedSymptoms.length > 0) {
        const symptomsPayload = {
          symptom_ids: selectedSymptoms.map((s) => s.value).filter(Boolean),
        };

        requests.push(
          withRetry(() =>
            axios
              .post(
                `${BASE_URL}/api/consultations/${consultationId}/symptoms`,
                symptomsPayload
              )
              .catch((error) => console.error("Symptoms failed silently"))
          )
        );
      }

      // Step 4: Prescriptions
      if (selectedMedicines.length > 0) {
        const prescriptionsPayload = {
          consultation_id: consultationId,
          medicines: selectedMedicines
            .map((med) => ({
              medicine_id: med.medicine_id,
              dosage_en: med.dosage_en || "",
              dosage_urdu: med.dosage_urdu || "",
              frequency_en: med.frequency_en || "",
              frequency_urdu: med.frequency_urdu || "",
              duration_en: med.duration_en || "",
              duration_urdu: med.duration_urdu || "",
              instructions_en: med.instructions_en || "",
              instructions_urdu: med.instructions_urdu || "",
            }))
            .filter((m) => m.medicine_id),
        };

        requests.push(
          withRetry(() =>
            axios
              .post(`${BASE_URL}/api/prescriptions`, prescriptionsPayload)
              .catch((error) => console.error("Prescriptions failed silently"))
          )
        );
      }

      // Step 5: Neuro Exam
      if (Object.keys(neuroExamData).length > 0) {
        const neuroPayload = {
          consultation_id: consultationId,
          patient_id: patient.id,
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
          withRetry(() =>
            axios
              .post(`${BASE_URL}/api/examination`, neuroPayload)
              .catch((error) => console.error("Neuro exam failed silently"))
          )
        );
      }

      // Step 6: Tests
      if (selectedTests.length > 0) {
        const testIds = selectedTests
          .map(
            (test) =>
              tests.find((t) => t.label === test || t.value === test)?.value
          )
          .filter(Boolean);

        if (testIds.length > 0) {
          const testsPayload = {
            test_ids: testIds,
            consultation_id: consultationId,
          };

          requests.push(
            withRetry(() =>
              axios
                .post(`${BASE_URL}/api/tests/assign`, testsPayload)
                .catch((error) => console.error("Tests failed silently"))
            )
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

        requests.push(
          withRetry(() =>
            axios
              .post(
                `${BASE_URL}/api/followups/consultations/${consultationId}/followups`,
                followUpPayload
              )
              .catch((error) => console.error("Follow-up failed silently"))
          )
        );
      }

      // Execute all requests with failure tolerance
      await Promise.all(requests.map((p) => p.catch((e) => e)));

      // Success handling
      toast.success("Consultation processed successfully");
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
      handlePrint();
      navigate("/");
    } catch (error) {
      console.error("Main error:", error);
      toast.error(error.response?.data?.message || "Submission error occurred");
    } finally {
      setSubmissionLoading(false);
    }
  };


  // const submitConsultation = async () => {
  //   // Early validation for patient and submission state
  //   if (!patient || !patient.id) {
  //     toast.error('Patient data is missing or invalid. Please select a patient.');
  //     return;
  //   }
  //   if (submissionLoading) {
  //     toast.error('Please wait for the ongoing submission to complete.');
  //     return;
  //   }
  //   if (!navigator.onLine) {
  //     toast.error('No internet connection. Please check your network and try again.');
  //     return;
  //   }
  
  //   setSubmissionLoading(true);
  
  //   try {
  //     // Step 1: Create Consultation (Core)
  //     const consultationPayload = {
  //       patient_id: String(patient.id), // Normalize ID to string
  //       doctor_name: 'Dr. Abdul Rauf',
  //       diagnosis: neuroExamData?.diagnosis?.trim() || null,
  //       notes: neuroExamData?.treatment_plan?.trim() || null,
  //       consultation_date: new Date().toISOString().split('T')[0],
  //       status: 'completed',
  //     };
  
  //     console.log('Creating consultation with payload:', consultationPayload); // Debug log
  //     const consultationRes = await axios.post(
  //       `${BASE_URL}/api/consultations`,
  //       consultationPayload,
  //       { timeout: 15000 }
  //     ).catch((error) => {
  //       if (error.code === 'ECONNABORTED') {
  //         throw new Error('Consultation creation timed out. Please check your network.');
  //       }
  //       throw error;
  //     });
  
  //     const consultationId = consultationRes.data?.id;
  //     if (!consultationId) {
  //       throw new Error('Server did not return a consultation ID.');
  //     }
  
  //     // Retry handler for non-critical requests with improved error handling
  //     const withRetry = async (fn, stepName, retries = 3) => {
  //       try {
  //         return await fn();
  //       } catch (error) {
  //         console.warn(`${stepName} attempt ${4 - retries} failed:`, error.message);
  //         if (retries <= 0 || error.response?.status === 400 || error.response?.status === 404) {
  //           console.error(`${stepName} failed after retries:`, error.message);
  //           return { error: true, message: error.message }; // Return error object instead of throwing
  //         }
  //         await new Promise((resolve) => setTimeout(resolve, 500 * (3 - retries)));
  //         return withRetry(fn, stepName, retries - 1);
  //       }
  //     };
  
  //     const requests = [];
  
  //     // Step 2: Vitals
  //     if (vitalSigns && Object.values(vitalSigns).some((v) => v && v !== '')) {
  //       const vitalsPayload = {
  //         consultation_id: consultationId,
  //         patient_id: String(patient.id),
  //         pulse_rate:
  //           vitalSigns.pulseRate && !isNaN(Number(vitalSigns.pulseRate))
  //             ? Number(vitalSigns.pulseRate)
  //             : null,
  //         blood_pressure: vitalSigns.bloodPressure?.trim() || null,
  //         temperature:
  //           vitalSigns.temperature && !isNaN(Number(vitalSigns.temperature))
  //             ? Number(vitalSigns.temperature)
  //             : null,
  //         spo2_level:
  //           vitalSigns.spo2 && !isNaN(Number(vitalSigns.spo2))
  //             ? Number(vitalSigns.spo2)
  //             : null,
  //         nihss_score:
  //           vitalSigns.nihss && !isNaN(Number(vitalSigns.nihss))
  //             ? Number(vitalSigns.nihss)
  //             : null,
  //         fall_assessment: vitalSigns.fall_assessment || 'Done',
  //       };
  
  //       if (!Object.values(vitalsPayload).some((v) => v !== null && v !== 'Done')) {
  //         console.warn('Skipping vitals: No valid data provided');
  //       } else {
  //         requests.push(
  //           withRetry(
  //             () =>
  //               axios.post(`${BASE_URL}/api/vitals`, vitalsPayload, { timeout: 15000 }),
  //             'Vitals'
  //           )
  //         );
  //       }
  //     }
  
  //     // Step 3: Symptoms
  //     if (Array.isArray(selectedSymptoms) && selectedSymptoms.length > 0) {
  //       const symptomIds = selectedSymptoms
  //         .map((s) => s?.value)
  //         .filter(Boolean);
  //       if (symptomIds.length === 0) {
  //         console.warn('Skipping symptoms: No valid symptom IDs');
  //       } else {
  //         const symptomsPayload = { symptom_ids: symptomIds };
  //         requests.push(
  //           withRetry(
  //             () =>
  //               axios.post(
  //                 `${BASE_URL}/api/consultations/${consultationId}/symptoms`,
  //                 symptomsPayload,
  //                 { timeout: 15000 }
  //               ),
  //             'Symptoms'
  //           )
  //         );
  //       }
  //     }
  
  //     // Step 4: Prescriptions
  //     if (Array.isArray(selectedMedicines) && selectedMedicines.length > 0) {
  //       const medicines = selectedMedicines
  //         .map((med) => ({
  //           medicine_id: med?.medicine_id,
  //           dosage_en: med?.dosage_en?.trim() || '',
  //           dosage_urdu: med?.dosage_urdu?.trim() || '',
  //           frequency_en: med?.frequency_en?.trim() || '',
  //           frequency_urdu: med?.frequency_urdu?.trim() || '',
  //           duration_en: med?.duration_en?.trim() || '',
  //           duration_urdu: med?.duration_urdu?.trim() || '',
  //           instructions_en: med?.instructions_en?.trim() || '',
  //           instructions_urdu: med?.instructions_urdu?.trim() || '',
  //         }))
  //         .filter((m) => m.medicine_id);
  //       if (medicines.length === 0) {
  //         console.warn('Skipping prescriptions: No valid medicines');
  //       } else {
  //         const prescriptionsPayload = {
  //           consultation_id: consultationId,
  //           medicines,
  //         };
  //         requests.push(
  //           withRetry(
  //             () =>
  //               axios.post(`${BASE_URL}/api/prescriptions`, prescriptionsPayload, {
  //                 timeout: 15000,
  //               }),
  //             'Prescriptions'
  //           )
  //         );
  //       }
  //     }
  
  //     // Step 5: Neuro Exam
  //     if (neuroExamData && Object.keys(neuroExamData).length > 0) {
  //       const neuroPayload = {
  //         consultation_id: consultationId,
  //         patient_id: String(patient.id),
  //         ...neuroExamData,
  //         pain_sensation: !!neuroExamData.pain_sensation,
  //         vibration_sense: !!neuroExamData.vibration_sense,
  //         proprioception: !!neuroExamData.proprioception,
  //         temperature_sensation: !!neuroExamData.temperature_sensation,
  //         brudzinski_sign: !!neuroExamData.brudzinski_sign,
  //         kernig_sign: !!neuroExamData.kernig_sign,
  //         facial_sensation: !!neuroExamData.facial_sensation,
  //         swallowing_function: !!neuroExamData.swallowing_function,
  //         mmse_score:
  //           neuroExamData.mmse_score && !isNaN(parseInt(neuroExamData.mmse_score))
  //             ? parseInt(neuroExamData.mmse_score)
  //             : null,
  //         gcs_score:
  //           neuroExamData.gcs_score && !isNaN(parseInt(neuroExamData.gcs_score))
  //             ? parseInt(neuroExamData.gcs_score)
  //             : null,
  //       };
  
  //       if (!Object.values(neuroPayload).some((v) => v !== null && v !== false)) {
  //         console.warn('Skipping neuro exam: No valid data provided');
  //       } else {
  //         requests.push(
  //           withRetry(
  //             () =>
  //               axios.post(`${BASE_URL}/api/examination`, neuroPayload, {
  //                 timeout: 15000,
  //               }),
  //             'Neuro Exam'
  //           )
  //         );
  //       }
  //     }
  
  //     // Step 6: Tests
  //     if (Array.isArray(selectedTests) && selectedTests.length > 0) {
  //       const testIds = selectedTests
  //         .map((test) => tests?.find((t) => t.label === test || t.value === test)?.value)
  //         .filter(Boolean);
  //       if (testIds.length === 0) {
  //         console.warn('Skipping tests: No valid test IDs');
  //       } else {
  //         const testsPayload = {
  //           test_ids: testIds,
  //           consultation_id: consultationId,
  //         };
  //         requests.push(
  //           withRetry(
  //             () =>
  //               axios.post(`${BASE_URL}/api/tests/assign`, testsPayload, {
  //                 timeout: 15000,
  //               }),
  //             'Tests'
  //           )
  //         );
  //       }
  //     }
  
  //     // Step 7: Follow-Up
  //     if (selectedDuration && followUpDate && followUpDate instanceof Date && !isNaN(followUpDate)) {
  //       const durationDays = Number(selectedDuration);
  //       if (isNaN(durationDays) || durationDays <= 0) {
  //         console.warn('Skipping follow-up: Invalid duration or date');
  //       } else {
  //         const followUpPayload = {
  //           follow_up_date: followUpDate.toISOString().split('T')[0],
  //           notes: followUpNotes?.trim() || 'عام چیک اپ',
  //           duration_days: durationDays,
  //         };
  //         requests.push(
  //           withRetry(
  //             () =>
  //               axios.post(
  //                 `${BASE_URL}/api/followups/consultations/${consultationId}/followups`,
  //                 followUpPayload,
  //                 { timeout: 15000 }
  //               ),
  //             'Follow-Up'
  //           )
  //         );
  //       }
  //     }
  
  //     // Execute all requests with failure tolerance
  //     const results = await Promise.all(
  //       requests.map((req) => req.catch((e) => ({ error: true, message: e.message })))
  //     );
  
  //     // Check for non-critical failures
  //     const failedRequests = results.filter((r) => r?.error);
  //     if (failedRequests.length > 0) {
  //       console.warn('Non-critical request failures:', failedRequests);
  //       toast.warn(
  //         `Consultation saved, but ${failedRequests.length} step(s) (e.g., vitals, symptoms) failed. Please verify.`
  //       );
  //     } else {
  //       toast.success('Consultation processed successfully!');
  //     }
  
  //     // Reset form state
  //     setVitalSigns({
  //       pulseRate: '',
  //       bloodPressure: '',
  //       temperature: '',
  //       spo2: '',
  //       nihss: '',
  //       fall_assessment: 'Done',
  //     });
  //     setFollowUpDate(null);
  //     setFollowUpNotes('');
  //     setSelectedDuration(null);
  
  //     // Print and navigate
  //     try {
  //       await handlePrint(); // Assumes async; remove await if synchronous
  //     } catch (printError) {
  //       console.warn('Print failed:', printError.message);
  //       toast.warn('Consultation saved, but printing failed.');
  //     }
  //     navigate('/');
  //   } catch (error) {
  //     console.error('Submission error:', {
  //       message: error.message,
  //       status: error.response?.status,
  //       data: error.response?.data,
  //     });
  //     let errorMessage = error.response?.data?.message || error.message || 'Submission error occurred';
  //     if (error.code === 'ECONNABORTED') {
  //       errorMessage = 'Request timed out. Please check your network and try again.';
  //     } else if (error.response?.status >= 500) {
  //       errorMessage = 'Server error occurred. Please try again later.';
  //     } else if (error.response?.status === 400) {
  //       errorMessage = `Invalid data sent: ${error.response?.data?.message || 'Check your inputs.'}`;
  //     }
  //     toast.error(errorMessage);
  //   } finally {
  //     setSubmissionLoading(false);
  //   }
  // };
 
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
              // prescriptions={prescriptions}
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

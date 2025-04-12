import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import PatientInfoHeader from "./PatientInfoHeader";
import ConsultationForm from "./ConsultationForm";
import PrescriptionsPopup from "./PrescriptionsPopup";
import printConsultation from "../utils/printConsultation";
import { v4 as uuidv4 } from "uuid";

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

  const refreshMedicines = useCallback(async () => {
    try {
      const medicinesData = await fetchWithRetry(
        "/api/medicines",
        "medicines",
        (data) =>
          data.map((med) => ({
            value: String(med.id), // Normalize to string
            label: `${med.form || ""} ${med.brand_name}${
              med.strength ? ` (${med.strength})` : ""
            }`.trim(),
            raw: med,
          }))
      );
      setMedicines(medicinesData || []);
      console.log(
        "Refreshed medicines:",
        medicinesData.map((m) => m.value)
      );

      // Clean invalid selectedMedicines
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
    }
  }, [selectedMedicines]);

  const fetchData = async () => {
    setLoading(true);
    setFetchError(null);

    try {
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

      await Promise.all([
        refreshMedicines(),
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
      ]);
      console.log("All data fetched successfully");
    } catch (error) {
      console.error("Critical fetch error:", error);
      setFetchError(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [patientId, navigate]);

  useEffect(() => {
    console.log("Patient state updated:", patient);
    console.log("Current selectedMedicines:", selectedMedicines);
  }, [patient, selectedMedicines]);

  const handlePrint = async () => {
    if (selectedMedicines.length === 0) {
      toast.warn("No medicines selected to print.");
      return;
    }

    await refreshMedicines(); // Ensure medicines are up-to-date

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
  };

  // const submitConsultation = async () => {
  //   if (!patient || !patient.id) {
  //     toast.error("Patient data is missing or invalid.");
  //     return;
  //   }
  //   if (submissionLoading) {
  //     toast.error("Please wait for the ongoing submission to complete.");
  //     return;
  //   }
  //   if (!navigator.onLine) {
  //     toast.error("No internet connection. Please check your network.");
  //     return;
  //   }

  //   setSubmissionLoading(true);

  //   try {
  //     await refreshMedicines(); // Sync medicines before submission

  //     const validIds = medicines.map((m) => String(m.value));
  //     const invalidMedicines = selectedMedicines.filter(
  //       (med) => med.medicine_id && !validIds.includes(String(med.medicine_id))
  //     );
  //     if (invalidMedicines.length > 0) {
  //       toast.error(
  //         `Cannot submit: Unrecognized medicines (IDs: ${invalidMedicines
  //           .map((m) => m.medicine_id)
  //           .join(", ")}). Please reselect.`
  //       );
  //       return;
  //     }

  //     const consultationPayload = {
  //       patient_id: String(patient.id),
  //       doctor_name: "Dr. Abdul Rauf",
  //       diagnosis: neuroExamData?.diagnosis?.trim() || null,
  //       notes: neuroExamData?.treatment_plan?.trim() || null,
  //       consultation_date: new Date().toISOString().split("T")[0],
  //       status: "completed",
  //     };

  //     console.log("Creating consultation with payload:", consultationPayload);
  //     const consultationRes = await axios.post(
  //       `${BASE_URL}/api/consultations`,
  //       consultationPayload,
  //       { timeout: 15000 }
  //     );
  //     const consultationId = consultationRes.data?.id;
  //     if (!consultationId) {
  //       throw new Error("Server did not return a consultation ID.");
  //     }
  //     console.log("Consultation created with ID:", consultationId);

  //     const withRetry = async (fn, stepName, retries = 2) => {
  //       try {
  //         const result = await fn();
  //         console.log(`${stepName} succeeded`);
  //         return result;
  //       } catch (error) {
  //         console.warn(`${stepName} attempt ${3 - retries} failed:`, error);
  //         if (
  //           retries <= 0 ||
  //           error.response?.status === 400 ||
  //           error.response?.status === 404
  //         ) {
  //           throw error;
  //         }
  //         await new Promise((resolve) => setTimeout(resolve, 500 * (2 - retries)));
  //         return withRetry(fn, stepName, retries - 1);
  //       }
  //     };

  //     const failedSteps = [];

  //     // Vitals
  //     if (
  //       vitalSigns &&
  //       Object.values(vitalSigns).some((v) => v && v !== "")
  //     ) {
  //       const vitalsPayload = {
  //         consultation_id: consultationId,
  //         patient_id: String(patient.id),
  //         pulse_rate: Number(vitalSigns.pulseRate) || null,
  //         blood_pressure: vitalSigns.bloodPressure?.trim() || null,
  //         temperature: Number(vitalSigns.temperature) || null,
  //         spo2_level: Number(vitalSigns.spo2) || null,
  //         nihss_score: Number(vitalSigns.nihss) || null,
  //         fall_assessment: vitalSigns.fall_assessment || "Done",
  //       };
  //       await withRetry(
  //         () =>
  //           axios.post(`${BASE_URL}/api/vitals`, vitalsPayload, {
  //             timeout: 15000,
  //           }),
  //         "Vitals"
  //       ).catch((e) => failedSteps.push(`Vitals: ${e.message}`));
  //     }

  //     // Symptoms
  //     if (Array.isArray(selectedSymptoms) && selectedSymptoms.length > 0) {
  //       // Validate against symptomsOptions
  //       const validSymptomIds = symptomsOptions.map((s) => String(s.value));
  //       const symptomIds = selectedSymptoms
  //         .map((s) => s?.value && String(s.value))
  //         .filter((id) => id && validSymptomIds.includes(id));

  //       if (symptomIds.length === 0) {
  //         console.warn("No valid symptom IDs after validation:", {
  //           selectedSymptoms,
  //           validSymptomIds,
  //         });
  //         failedSteps.push("Symptoms: No valid symptoms selected");
  //       } else {
  //         const symptomsPayload = { symptom_ids: symptomIds };
  //         console.log("Submitting symptoms payload:", symptomsPayload);
  //         await withRetry(
  //           () =>
  //             axios.post(
  //               `${BASE_URL}/api/consultations/${consultationId}/symptoms`,
  //               symptomsPayload,
  //               { timeout: 15000 }
  //             ),
  //           "Symptoms"
  //         ).catch((error) => {
  //           const errorMessage =
  //             error.response?.data?.message ||
  //             error.message ||
  //             "Unknown error submitting symptoms";
  //           console.error("Symptoms submission failed:", {
  //             status: error.response?.status,
  //             data: error.response?.data,
  //             payload: symptomsPayload,
  //           });
  //           failedSteps.push(`Symptoms: ${errorMessage}`);
  //         });
  //       }
  //     } else {
  //       console.log("No symptoms selected, skipping submission");
  //     }

  //     // Prescriptions
  //     if (Array.isArray(selectedMedicines) && selectedMedicines.length > 0) {
  //       const prescriptionsPayload = {
  //         consultation_id: String(consultationId),
  //         medicines: selectedMedicines.map((med) => ({
  //           medicine_id: String(med.medicine_id),
  //           dosage_en: med.dosage_en?.trim() || "",
  //           dosage_urdu: med.dosage_urdu?.trim() || "",
  //           frequency_en: med.frequency_en?.trim() || "",
  //           frequency_urdu: med.frequency_urdu?.trim() || "",
  //           duration_en: med.duration_en?.trim() || "",
  //           duration_urdu: med.duration_urdu?.trim() || "",
  //           instructions_en: med.instructions_en?.trim() || "",
  //           instructions_urdu: med.instructions_urdu?.trim() || "",
  //         })),
  //       };
  //       console.log("Prescriptions payload:", prescriptionsPayload);
  //       await withRetry(
  //         () =>
  //           axios.post(`${BASE_URL}/api/prescriptions`, prescriptionsPayload, {
  //             timeout: 15000,
  //           }),
  //         "Prescriptions"
  //       ).catch((e) => failedSteps.push(`Prescriptions: ${e.message}`));
  //     }

  //     // Neuro Exam
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
  //         mmse_score: neuroExamData.mmse_score
  //           ? parseInt(neuroExamData.mmse_score)
  //           : null,
  //         gcs_score: neuroExamData.gcs_score
  //           ? parseInt(neuroExamData.gcs_score)
  //           : null,
  //       };
  //       await withRetry(
  //         () =>
  //           axios.post(`${BASE_URL}/api/examination`, neuroPayload, {
  //             timeout: 15000,
  //           }),
  //         "Neuro Exam"
  //       ).catch((e) => failedSteps.push(`Neuro Exam: ${e.message}`));
  //     }

  //     // Tests
  //     if (Array.isArray(selectedTests) && selectedTests.length > 0) {
  //       const testIds = selectedTests
  //         .map((id) => String(id))
  //         .filter((id) => id && typeof id === "string");
  //       if (testIds.length > 0) {
  //         const testsPayload = {
  //           test_ids: testIds,
  //           consultation_id: consultationId,
  //         };
  //         await withRetry(
  //           () =>
  //             axios.post(`${BASE_URL}/api/tests/assign`, testsPayload, {
  //               timeout: 15000,
  //             }),
  //           "Tests"
  //         ).catch((e) => failedSteps.push(`Tests: ${e.message}`));
  //       }
  //     }

  //     // Follow-Up
  //     if (
  //       selectedDuration &&
  //       followUpDate &&
  //       followUpDate instanceof Date &&
  //       !isNaN(followUpDate)
  //     ) {
  //       const durationDays = Number(selectedDuration);
  //       if (!isNaN(durationDays) && durationDays > 0) {
  //         const followUpPayload = {
  //           follow_up_date: followUpDate.toISOString().split("T")[0],
  //           notes: followUpNotes?.trim() || "عام چیک اپ",
  //           duration_days: durationDays,
  //         };
  //         await withRetry(
  //           () =>
  //             axios.post(
  //               `${BASE_URL}/api/followups/consultations/${consultationId}/followups`,
  //               followUpPayload,
  //               { timeout: 15000 }
  //             ),
  //           "Follow-Up"
  //         ).catch((e) => failedSteps.push(`Follow-Up: ${e.message}`));
  //       }
  //     }

  //     if (failedSteps.length > 0) {
  //       console.warn("Failed steps:", failedSteps);
  //       toast.warn(
  //         `Consultation saved, but some steps failed: ${failedSteps.join(", ")}.`
  //       );
  //     } else {
  //       toast.success("Consultation processed successfully!");
  //     }

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

  //     try {
  //       await handlePrint();
  //     } catch (printError) {
  //       console.warn("Print failed:", printError);
  //       toast.warn("Consultation saved, but printing failed.");
  //     }
  //     navigate("/");
  //   } catch (error) {
  //     console.error("Submission error:", error);
  //     let errorMessage =
  //       error.response?.data?.message || error.message || "Submission error";
  //     if (error.code === "ECONNABORTED") {
  //       errorMessage = "Request timed out. Please check your network.";
  //     } else if (error.response?.status >= 500) {
  //       errorMessage = "Server error. Please try again later.";
  //     } else if (error.response?.status === 400) {
  //       errorMessage = `Invalid data: ${
  //         error.response?.data?.message || "Check your inputs."
  //       }`;
  //     }
  //     toast.error(errorMessage);
  //   } finally {
  //     setSubmissionLoading(false);
  //   }
  // };

  const submitConsultation = async () => {
    if (!patient || !patient.id) {
      toast.error("Patient data is missing or invalid.");
      return;
    }
    if (submissionLoading) {
      toast.error("Please wait for the ongoing submission to complete.");
      return;
    }
    if (!navigator.onLine) {
      toast.error("No internet connection. Please check your network.");
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
        consultation_date: new Date().toISOString().split("T")[0],
        status: "completed",
      };

      console.log("Creating consultation with payload:", consultationPayload);
      const consultationRes = await axios.post(
        `${BASE_URL}/api/consultations`,
        consultationPayload,
        { timeout: 10000 }
      );
      const consultationId = consultationRes.data?.id;
      if (!consultationId) {
        throw new Error("Server did not return a consultation ID.");
      }
      console.log("Consultation created with ID:", consultationId);

      const withRetry = async (fn, stepName, retries = 1) => {
        try {
          const result = await fn();
          console.log(`${stepName} succeeded`);
          return result;
        } catch (error) {
          console.warn(`${stepName} attempt ${2 - retries} failed:`, {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
          });
          if (
            retries <= 0 ||
            error.response?.status === 400 ||
            error.response?.status === 404
          ) {
            throw error;
          }
          await new Promise((resolve) => setTimeout(resolve, 300));
          return withRetry(fn, stepName, retries - 1);
        }
      };

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
          withRetry(
            () =>
              axios.post(`${BASE_URL}/api/vitals`, vitalsPayload, {
                timeout: 10000,
              }),
            "Vitals"
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
            withRetry(
              () =>
                axios.post(
                  `${BASE_URL}/api/consultations/${consultationId}/symptoms`,
                  symptomsPayload,
                  { timeout: 10000 }
                ),
              "Symptoms"
            ).catch((e) => {
              const errorMessage =
                e.response?.data?.message ||
                e.message ||
                "Unknown error submitting symptoms";
              failedSteps.push(
                `Symptoms: ${errorMessage} (HTTP ${
                  e.response?.status || "unknown"
                })`
              );
              throw e;
            })
          );
        }
      }

      // Prescriptions
      if (Array.isArray(selectedMedicines) && selectedMedicines.length > 0) {
        // Check for duplicate medicine_ids
        const medicineIds = selectedMedicines.map((med) =>
          String(med.medicine_id)
        );
        const duplicates = medicineIds.filter(
          (id, index) => id && medicineIds.indexOf(id) !== index
        );
        if (duplicates.length > 0) {
          console.error("Duplicate medicine IDs:", duplicates);
          toast.error(
            `Cannot submit prescriptions: Duplicate medicines (IDs: ${[
              ...new Set(duplicates),
            ].join(", ")}).`
          );
          failedSteps.push(`Prescriptions: Duplicate medicine IDs`);
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
            })),
          };
          console.log(
            "Prescriptions payload:",
            JSON.stringify(prescriptionsPayload, null, 2)
          );
          requests.push(
            withRetry(
              () =>
                axios.post(
                  `${BASE_URL}/api/prescriptions`,
                  prescriptionsPayload,
                  {
                    timeout: 10000,
                  }
                ),
              "Prescriptions"
            ).catch((error) => {
              const errorMessage =
                error.response?.data?.message ||
                error.message ||
                "Unknown error submitting prescriptions";
              console.error("Prescriptions failed:", {
                status: error.response?.status,
                data: error.response?.data,
                payload: prescriptionsPayload,
              });
              failedSteps.push(
                `Prescriptions: ${errorMessage} (HTTP ${
                  error.response?.status || "unknown"
                })`
              );
              throw error;
            })
          );
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
          withRetry(
            () =>
              axios.post(`${BASE_URL}/api/examination`, neuroPayload, {
                timeout: 10000,
              }),
            "Neuro Exam"
          ).catch((e) => {
            failedSteps.push(
              `Neuro Exam: ${e.message} (HTTP ${
                e.response?.status || "unknown"
              })`
            );
            throw e;
          })
        );
      }

      // Tests
      if (Array.isArray(selectedTests) && selectedTests.length > 0) {
        const testIds = selectedTests
          .map((id) => String(id))
          .filter((id) => id && typeof id === "string");
        if (testIds.length > 0) {
          const testsPayload = {
            test_ids: testIds,
            consultation_id: consultationId,
          };
          requests.push(
            withRetry(
              () =>
                axios.post(`${BASE_URL}/api/tests/assign`, testsPayload, {
                  timeout: 10000,
                }),
              "Tests"
            ).catch((e) => {
              failedSteps.push(
                `Tests: ${e.message} (HTTP ${e.response?.status || "unknown"})`
              );
              throw e;
            })
          );
        }
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
            notes: followUpNotes?.trim() || "عام چیک اپ",
            duration_days: durationDays,
          };
          requests.push(
            withRetry(
              () =>
                axios.post(
                  `${BASE_URL}/api/followups/consultations/${consultationId}/followups`,
                  followUpPayload,
                  { timeout: 10000 }
                ),
              "Follow-Up"
            ).catch((e) => {
              failedSteps.push(
                `Follow-Up: ${e.message} (HTTP ${
                  e.response?.status || "unknown"
                })`
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
          `Consultation saved, but some steps failed: ${failedSteps.join(
            ", "
          )}.`
        );
      } else {
        toast.success("Consultation processed successfully!");
      }

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
        error.response?.data?.message || error.message || "Submission error";
      if (error.code === "ECONNABORTED") {
        errorMessage = "Request timed out. Please check your network.";
      } else if (error.response?.status >= 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (error.response?.status === 400) {
        errorMessage = `Invalid data: ${
          error.response?.data?.message || "Check your inputs."
        }`;
      }
      toast.error(errorMessage);
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

  if (fetchError) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col">
        <p className="text-lg text-red-600">{fetchError}</p>
        <button
          onClick={() => navigate("/")}
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
              refreshMedicines={refreshMedicines} // Pass refresh function
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
  );
};

export default PatientConsultation;

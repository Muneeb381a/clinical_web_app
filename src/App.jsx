import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaArrowUp, FaArrowDown, FaBan, FaReply } from "react-icons/fa";

import {
  AiOutlinePlus,
  AiOutlinePrinter,
  AiOutlineDownload,
  AiOutlineCloseCircle,
  AiOutlineHome,
  AiOutlineArrowLeft,
  AiOutlineCalendar,
  AiOutlineMan,
  AiOutlineMobile,
  AiOutlineIdcard,
  AiOutlineUser,
  AiOutlineSearch,
  AiOutlineHistory,
  AiOutlineFileText,
  AiOutlineClose,
  AiOutlineFolderOpen,
  AiOutlineMedicineBox,
} from "react-icons/ai";
import AddPatientForm from "./pages/AddPatientForm";
import { urduDate } from "./utils/dateUtils";

// Schema for searching patients by mobile
const searchSchema = z.object({
  mobile: z.string().min(10, "Enter a valid mobile number"),
});

const PrescriptionDetail = ({ label, en, urdu }) => (
  <div className="flex justify-between items-start">
    <span className="font-medium text-gray-600">{label}:</span>
    <div className="text-right">
      <p className="text-gray-800">{en}</p>
      <p className="text-gray-500 text-sm">{urdu}</p>
    </div>
  </div>
);

const PatientSearch = () => {
  const [patient, setPatient] = useState(null);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [symptoms, setSymptoms] = useState([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [consultationData, setConsultationData] = useState(null);
  const [tests, setTests] = useState([]);
  const [selectedTests, setSelectedTests] = useState([]);
  const [customTest, setCustomTest] = useState("");
  const [neuroExamData, setNeuroExamData] = useState([]);
  const [followUpDate, setFollowUpDate] = useState(null);
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(null);
  const [isFetchingSymptoms, setIsFetchingSymptoms] = useState(false);
  const [patients, setPatients] = useState([]);
  const [searchedMobile, setSearchedMobile] = useState("");
  const [fetchingMedicines, setIsFetchingMedicines] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [prescriptions, setPrescriptions] = useState([]);
  const [showPopup, setShowPopup] = useState(false);

  const [selectedMedicines, setSelectedMedicines] = useState([{}, {}, {}]);

  const handleReturnHome = () => {
    setPatient(null);
    setShowAddPatient(false);
    setSearchedMobile("");
    window.history.pushState({}, "", "/");
  };

  const handleNewPatient = (newPatient) => {
    setPatients([...patients, newPatient]); // Update patient list
  };

  useEffect(() => {
    axios
      .get("https://patient-management-backend-nine.vercel.app/api/tests")
      .then((res) => setTests(res.data))
      .catch((err) => console.error("Error fetching tests:", err));
  }, []);

  // Handle test selection or creation
  const handleTestChange = (selectedOptions) => {
    setSelectedTests(selectedOptions.map((option) => option.value));
  };

  const handleCreateMedicine = async (inputValue) => {
    setIsCreating(true);
    try {
      const response = await axios.post(
        "https://patient-management-backend-nine.vercel.app/api/medicines",
        {
          medicine_name: inputValue,
          generic_name: "",
          urdu_name: "",
          urdu_form: "",
          urdu_strength: "",
        }
      );

      const newMedicine = response.data;

      const formattedMedicine = {
        value: newMedicine.id,
        label: `${newMedicine.form} ${newMedicine.brand_name} (${newMedicine.strength})`,
      };

      // Add new medicine to options
      setMedicines((prev) => [...prev, formattedMedicine]);

      return newMedicine.id; // 🔹 Return new medicine ID ✅
    } catch (error) {
      console.error("Creation failed:", error);
      alert(error.response?.data?.error || "Invalid medicine format");
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  const customSelectStyles = {
    control: (base) => ({
      ...base,
      borderColor: "#ccc",
      boxShadow: "none",
      "&:hover": { borderColor: "#888" },
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? "#4CAF50" : "#fff",
      color: state.isSelected ? "#fff" : "#333",
      "&:hover": {
        backgroundColor: "#f1f1f1",
      },
    }),
  };

  const handlePrint = () => {
    const printContent = document.getElementById("consultation-content");
    if (!printContent) {
      alert("No consultation data to print");
      return;
    }

    const printWindow = window.open(
      "https://paitient-prescription-frontend.vercel.app",
      "_blank"
    );
    if (!printWindow) {
      alert("Pop-up blocked! Allow pop-ups for this site.");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Prescription - ${patient?.name || "Unknown Patient"}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              margin: 20mm 15mm 15mm 15mm;
              color: #374151;
              font-size: 11px;
              line-height: 1.4;
            }
  
            .prescription-container {
              display: grid;
              grid-template-columns: 1fr 1.5fr 1fr;
              gap: 6mm;
              margin-top: 5mm;
            }
  
            .column {
              padding: 2mm;
              border-right: 3px solid #000000;
            }
  
            .patient-info {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 15mm;
              margin-bottom: 5mm;
              padding: 2mm;
            }
  
            .section-title {
              font-weight: 600;
              color: #000000;
              padding-bottom: 2mm;
              margin-bottom: 3mm;
              border-bottom: 1px solid #2e3033;
            }
  
            .medicine-table {
              width: 100%;
              border-collapse: collapse;
              margin: 2mm 0;
            }
  
            .medicine-table th {
              padding: 3mm 1mm;
              text-align: left;
              font-weight: 600;
              font-size: 12px;
            }
  
            .medicine-table td {
              padding: 2mm 1mm;
              border-bottom: 1px solid #e5e7eb;
              font-size: 10px;
            }
  
            .test-list {
              list-style: none;
              padding: 0;
              margin: 0;
            }
  
            .test-list li {
              padding: 1.5mm 0;
              border-bottom: 1px solid #e5e7eb;
              list-style-type: disc;
            }
  
            .exam-table {
              width: 100%;
              border-collapse: collapse;
            }

  
            .exam-table td {
              padding: 2mm 1mm;
              border-bottom: 1px solid #e5e7eb;
              font-size: 10px;
            }
  
            .follow-up-section {
              margin-top: 6mm;
              padding: 3mm;
              background: #f0fdfa;
              border-radius: 4px;
            }
  
            .urdu-date {
              font-family: 'Noto Nastaliq Urdu', serif;
              direction: rtl;
              margin-left: 5px;
              color: #4b5563;
            }
  
            @media print {
              body {
                margin: 15mm 10mm 10mm 10mm;
              }
              .section-title {
                color: #1e3a8a !important;
              }
            }
          </style>
        </head>
        <body>
        <div style="height: 30mm"></div>
          <div class="patient-info">
            <div><strong>MR#:</strong> ${patient?.mr_no || "-"}</div>
            <div><strong>Name:</strong> ${patient?.name || "-"}</div>
            <div><strong>Age/Sex:</strong> ${patient?.age || "-"}/${
      patient?.gender || "-"
    }</div>
            <div><strong>Checkup Date:</strong> ${
              patient?.checkup_date || "-"
            }</div>
          </div>
  
          <div class="prescription-container">
            <!-- Tests & Symptoms Column -->
            <div class="column">
              <div class="section-title">TESTS & SYMPTOMS</div>
              <ul class="test-list">
                ${selectedTests
                  .map(
                    (test) => `
                  <li>${test}</li>
                `
                  )
                  .join("")}
              </ul>
              <h3>Symptoms</h3>
              <ul class="test-list">
              ${selectedSymptoms
                .map(
                  (s) => `
                <li>${s.label}</li> 
              `
                )
                .join("")}
              </ul>
            </div>
  
            <!-- Medicines Column -->
            <div class="column">
              <div class="section-title">PRESCRIPTION</div>
              <table class="medicine-table">
                <thead>
                  <tr>
                    <th>Medicine</th>
                    <th style="width: 15%">Frequency</th>
                    <th style="width: 15%">Dosage</th>
                    <th style="width: 20%">Duration</th>
                    <th style="width: 20%">Instructions</th>
                    <th style="width: 20%">Route</th>
                  </tr>
                </thead>
                <tbody>
                  ${selectedMedicines
                    .map((med) => {
                      const medicineData = medicines.find(
                        (m) => m.value === med.medicine_id
                      );
                      return `
                        <tr>
                          <td>${medicineData?.label || "-"}</td>
                          <td>${med.frequency_urdu || "-"}</td>
                          <td>${med.dosage_urdu || "-"}</td>
                          <td>${med.duration_urdu || "-"}</td>
                          <td>${med.instructions_urdu || "-"}</td>
                          <td>${med.how_to_take_urdu || "-"}</td>
                        </tr>
                      `;
                    })
                    .join("")}
                </tbody>
              </table>
            </div>
  
            <!-- Examination Column -->
            <div class="column">
              <div class="section-title">EXAMINATION</div>
              <table class="exam-table">
  ${[
    { label: "Motor Function", key: "motor_function" },
    { label: "Muscle Tone", key: "muscle_tone" },
    { label: "Muscle Strength", key: "muscle_strength" },
    { label: "Straight Leg Test", key: "straight_leg_raise_test" },
    { label: "Reflexes", key: "deep_tendon_reflexes" },
    { label: "Gait", key: "gait_assessment" },
    { label: "Plantars", key: "plantar_reflex" },
    { label: "Pupils", key: "pupillary_reaction" },
    { label: "Speech Assessment", key: "speech_assessment" },
    { label: "Coordination", key: "coordination" },
    { label: "Sensory Examination", key: "sensory_examination" },
    { label: "Cranial Nerves", key: "cranial_nerves" },
    { label: "Mental Status", key: "mental_status" },
    { label: "Cerebellar Function", key: "cerebellar_function" },
    { label: "Muscle Wasting", key: "muscle_wasting" },
    { label: "Abnormal Movements", key: "abnormal_movements" },
    { label: "Romberg", key: "romberg_test" },
    { label: "Nystagmus", key: "nystagmus" },
    { label: "Fundoscopy", key: "fundoscopy" },
    { label: "Sensation", key: "pain_sensation", type: "check" },
    { label: "Vibration Sense", key: "vibration_sense", type: "check" },
    { label: "Proprioception", key: "proprioception", type: "check" },
    {
      label: "Temperature Sensation",
      key: "temperature_sensation",
      type: "check",
    },
    { label: "Brudzinski Sign", key: "brudzinski_sign", type: "check" },
    { label: "Kernig Sign", key: "kernig_sign", type: "check" },
    { label: "Facial Sensation", key: "facial_sensation", type: "check" },
    { label: "Swallowing Function", key: "swallowing_function", type: "check" },
    { label: "Diagnosis", key: "diagnosis" },
  ]
    .filter(({ key }) => {
      const value = neuroExamData[key];
      return (
        value !== undefined &&
        value !== null &&
        (typeof value !== "string" || value.trim() !== "")
      );
    })
    .map(({ label, key, type }) => {
      const value = neuroExamData[key];
      const displayValue =
        type === "check" ? (value ? "✓" : "✗") : value || "-";

      return `
        <tr>
          <td><strong>${label}:</strong></td>
          <td>${displayValue}</td>
        </tr>
      `;
    })
    .join("")}
</table>
            </div>
          </div>
  
          ${
            followUpDate
              ? `
            <div class="follow-up-section">
              <div class="section-title">FOLLOW UP</div>
              <div style="display: flex; justify-content: space-between; gap: 5mm">
                <div><strong>Date:</strong> ${new Date(
                  followUpDate
                ).toLocaleDateString()}</div>
                <div class="urdu-date">${urduDate(followUpDate)}</div>
                <div><strong>Notes:</strong> ${followUpNotes || "-"}</div>
              </div>
            </div>
          `
              : ""
          }
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Fetch symptoms and medicines on load
  useEffect(() => {
    const fetchSymptoms = async () => {
      setIsFetchingSymptoms(true);
      try {
        const res = await axios.get(
          "https://patient-management-backend-nine.vercel.app/api/symptoms"
        );
        setSymptoms(res.data.map((s) => ({ value: s.id, label: s.name })));
      } catch (error) {
        console.error("Error fetching symptoms:", error);
      } finally {
        setIsFetchingSymptoms(false);
      }
    };

    const fetchMedicines = async () => {
      setIsFetchingMedicines(true);
      try {
        const res = await axios.get(
          "https://patient-management-backend-nine.vercel.app/api/medicines"
        );
        setMedicines(
          res.data.map((m) => ({
            value: m.id,
            label: `${m.form} ${m.brand_name} (${m.strength})`,
          }))
        );
      } catch (error) {
        console.error("Error fetching medicines:", error);
      } finally {
        setIsFetchingMedicines(false);
      }
    };

    fetchSymptoms();
    fetchMedicines();
  }, []);

  const fetchPrescriptions = async (patientId) => {
    try {
      const response = await axios.get(
        `https://patient-management-backend-nine.vercel.app/api/prescriptions/patient/${patientId}`
      );
      setPrescriptions(response.data);
      setShowPopup(true);
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
    }
  };

  // handle create symptoms
  const handleCreateSymptom = async (inputValue) => {
    setIsFetchingSymptoms(true);
    try {
      const response = await axios.post(
        "https://patient-management-backend-nine.vercel.app/api/symptoms",
        {
          name: inputValue, // Sending new symptom name
        }
      );

      const newSymptom = {
        value: response.data.id, // Assuming the API returns the new symptom's ID
        label: response.data.name,
      };

      setSymptoms((prev) => [...prev, newSymptom]); // Add to options
      setSelectedSymptoms((prev) => [...prev, newSymptom]); // Select it immediately
    } catch (error) {
      console.error("Error adding new symptom:", error);
    } finally {
      setIsFetchingSymptoms(false);
    }
  };

  // Form for searching patients
  const {
    register: registerSearch,
    handleSubmit: handleSearchSubmit,
    formState: { errors: searchErrors },
  } = useForm({ resolver: zodResolver(searchSchema) });

  // Search for patient by mobile
  const onSearch = async (data) => {
    if (!data.mobile.trim()) {
      alert("Please enter a valid mobile number.");
      return;
    }

    const mobile = data.mobile.trim();
    const startTime = Date.now();
    setIsSearching(true);

    try {
      const res = await axios.get(
        `https://patient-management-backend-nine.vercel.app/api/patients/search?mobile=${encodeURIComponent(
          mobile
        )}`
      );

      const elapsed = Date.now() - startTime;
      if (elapsed < 500) {
        await new Promise((resolve) => setTimeout(resolve, 500 - elapsed));
      }

      if (res.data?.exists) {
        if (!res.data.data?.id && !res.data.data?._id) {
          throw new Error("Patient ID not found in API response");
        }

        const patientId = res.data.data.id || res.data.data._id;
        setPatient(res.data.data);
        setShowAddPatient(false);

        // Update URL for existing patient
        window.history.pushState(
          { patientId },
          "",
          `/patients/${patientId}/add-prescription`
        );
      } else {
        setPatient(null);
        setSearchedMobile(mobile);
        setShowAddPatient(true);

        // Update URL for new patient registration
        window.history.pushState(
          { newPatient: true, mobile },
          "",
          `/patients/new?mobile=${encodeURIComponent(mobile)}`
        );
      }
    } catch (error) {
      console.error("Error fetching patient", error);
      setPatient(null);
      setShowAddPatient(false);
      alert(error.message || "Failed to fetch patient. Please try again.");
      window.history.replaceState(null, "", "/");
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const loadPatientFromURL = async () => {
      const pathParts = window.location.pathname.split("/");

      // Handle existing patient prescription page
      if (pathParts[1] === "patients" && pathParts[3] === "add-prescription") {
        const patientId = pathParts[2];
        try {
          const res = await axios.get(
            `https://patient-management-backend-nine.vercel.app/api/patients/${patientId}`
          );
          setPatient(res.data);
          setShowAddPatient(false);
        } catch (error) {
          console.error("Error loading patient from URL:", error);
          alert("Invalid patient ID in URL");
          window.history.replaceState(null, "", "/");
        }
      }
      // Handle new patient registration page
      else if (pathParts[1] === "patients" && pathParts[2] === "new") {
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

  const handleNewPatientAdded = () => {
    // Re-trigger the search with the same mobile number
    onSearch({ mobile: searchedMobile });
  };

  // Submit symptoms & medicines for a patient
  const submitConsultation = async () => {
    if (!patient) {
      alert("Please search for a patient first.");
      return;
    }
    setLoading(true);
    try {
      // Step 1: Create a consultation entry
      const consultationRes = await axios.post(
        "https://patient-management-backend-nine.vercel.app/api/consultations",
        { patient_id: patient.id, doctor_name: "Dr. Abdul Rauf" }
      );

      const consultationId = consultationRes.data.id;

      // Step 2: Submit symptoms
      await axios.post(
        `https://patient-management-backend-nine.vercel.app/api/consultations/${consultationRes.data.id}/symptoms`,
        {
          patient_id: patient.id,
          symptom_ids: selectedSymptoms.map((s) => s.value),
        }
      );

      // Step 3: Submit medicines
      await axios.post(
        "https://patient-management-backend-nine.vercel.app/api/prescriptions",
        {
          consultation_id: consultationId,
          patient_id: patient.id,
          medicines: selectedMedicines.map((med) => ({
            medicine_id: med.medicine_id,
            dosage_en: med.dosage_en,
            dosage_urdu: med.dosage_urdu,
            frequency_en: med.frequency_en,
            frequency_urdu: med.frequency_urdu,
            duration_en: med.duration_en,
            duration_urdu: med.duration_urdu,
            instructions_en: med.instructions_en,
            instructions_urdu: med.instructions_urdu,
            how_to_take_en: med.how_to_take_en,
            how_to_take_urdu: med.how_to_take_urdu,
          })),
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      // Step 5: Submit tests
      for (const testName of selectedTests) {
        try {
          let test = tests.find((t) => t.test_name === testName);

          // If test does not exist, create a new one
          if (!test) {
            const testResponse = await axios.post(
              "https://patient-management-backend-nine.vercel.app/api/tests",
              { test_name: testName, test_notes: "Optional test notes" }
            );
            test = testResponse.data; // Assign the created test
            setTests((prevTests) => [...prevTests, test]); // Update the test list
          }

          // Assign test to consultation
          await axios.post(
            "https://patient-management-backend-nine.vercel.app/api/tests/assign",
            {
              test_id: test.id,
              consultation_id: consultationId,
            }
          );
        } catch (error) {
          console.error("Error adding/assigning test:", error);
        }
      }

      await axios.post(
        "https://patient-management-backend-nine.vercel.app/api/examination",
        {
          consultation_id: consultationId,
          patient_id: patient.id,
          motor_function: neuroExamData.motor_function || "",
          muscle_tone: neuroExamData.muscle_tone || "",
          muscle_strength: neuroExamData.muscle_strength || "",
          straight_leg_raise_test: neuroExamData.straight_leg_raise_test,
          deep_tendon_reflexes: neuroExamData.deep_tendon_reflexes || "",
          plantar_reflex: neuroExamData.plantar_reflex || "",
          pupillary_reaction: neuroExamData.pupillary_reaction || "",
          speech_assessment: neuroExamData.speech_assessment || "",
          gait_assessment: neuroExamData.gait_assessment || "",
          coordination: neuroExamData.coordination || "",
          sensory_examination: neuroExamData.sensory_examination || "",
          cranial_nerves: neuroExamData.cranial_nerves || "",
          mental_status: neuroExamData.mental_status || "",
          cerebellar_function: neuroExamData.cerebellar_function || "",
          muscle_wasting: neuroExamData.muscle_wasting || "",
          abnormal_movements: neuroExamData.abnormal_movements || "",
          romberg_test: neuroExamData.romberg_test || "",
          nystagmus: neuroExamData.nystagmus || "",
          fundoscopy: neuroExamData.fundoscopy || "",
          diagnosis: neuroExamData.diagnosis || "",
          pain_sensation: !!neuroExamData.pain_sensation,
          vibration_sense: !!neuroExamData.vibration_sense,
          proprioception: !!neuroExamData.proprioception,
          temperature_sensation: !!neuroExamData.temperature_sensation,
          brudzinski_sign: !!neuroExamData.brudzinski_sign,
          kernig_sign: !!neuroExamData.kernig_sign,
          facial_sensation: !!neuroExamData.facial_sensation,
          swallowing_function: !!neuroExamData.swallowing_function,
        },
        { headers: { "Content-Type": "application/json" } }
      );

      if (!selectedDuration) {
        alert("براہ کرم ایک مدت منتخب کریں");
        return;
      }

      try {
        await axios.post(
          `https://patient-management-backend-nine.vercel.app/api/followups/consultations/${consultationId}/followups`,
          {
            follow_up_date: followUpDate.toISOString().split("T")[0],
            notes: followUpNotes || "عام چیک اپ", // Default Urdu note
            duration_days: selectedDuration,
          }
        );

        alert("فالو اپ کامیابی سے شیڈول ہو گیا!");
        setSelectedDuration(null);
        setFollowUpNotes("");
      } catch (error) {
        console.error("فالو اپ شیڈولنگ میں خرابی:", error);
        alert("فالو اپ شیڈول کرنے میں ناکامی۔ براہ کرم دوبارہ کوشش کریں۔");
      }

      toast.success("Consultation added successfully! 🎉", {
        position: "top-right",
        autoClose: 3000,
      });
      alert("Consultation saved successfully.");
      setFollowUpDate(null);
      setFollowUpNotes("");
      setTimeout(() => {
        handlePrint();
      }, 500);
    } catch (error) {
      console.error(
        "Error submitting consultation",
        error.response?.data || error.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-8 relative 
overflow-hidden isolate w-[90vw] mx-auto before:absolute before:inset-0 
before:bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.9),_transparent)] 
before:opacity-50 before:-z-10"
    >
      <div className="mx-auto max-w-6xl rounded-2xl border border-white/30 bg-white/95 backdrop-blur-sm p-8 shadow-2xl shadow-gray-100/30">
        <h2 className="mb-6 border-b border-gray-200 pb-4 text-2xl font-bold text-gray-900">
          <span className="bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">
            Patient Consultation Portal
          </span>
        </h2>
        {patient && (
          <div className="mb-8 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={handleReturnHome}
                className="bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-700 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium transition-colors flex items-center gap-2 group"
              >
                <AiOutlineArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                Back to Search
              </button>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => fetchPrescriptions(patient.id)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
                >
                  <AiOutlineHistory className="w-5 h-5" />
                  Show Previous Prescriptions
                </button>
              </div>
            </div>

            {/* Patient Info Header */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="flex items-center gap-4">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <AiOutlineUser className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {patient.name}
                  </h2>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span>ID: {patient.id}</span>
                    <span className="text-gray-400">|</span>
                    <span>{patient.mobile}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Prescriptions Popup */}
            {showPopup && (
              <div className="fixed inset-0 bg-black/30 backdrop-blur-md z-50 overflow-y-auto">
                <div className="min-h-screen flex items-start justify-center p-4 pt-20 pb-8">
                  <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-4xl mx-auto border border-gray-200">
                    {/* Popup Header */}
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <AiOutlineFileText className="text-blue-600" />
                        Treatment History
                      </h2>
                      <button
                        onClick={() => setShowPopup(false)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <AiOutlineClose className="w-6 h-6 text-gray-600" />
                      </button>
                    </div>

                    {/* Prescriptions List */}
                    <div className="space-y-6">
                      {prescriptions.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2">
                          {prescriptions.map((prescription) => (
                            <div
                              key={prescription.id}
                              className="bg-gray-50 p-5 rounded-xl border border-gray-200 hover:border-blue-200 transition-colors"
                            >
                              <div className="flex items-start gap-4">
                                <div className="bg-blue-100 p-2 rounded-lg">
                                  <AiOutlineMedicineBox className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                    {prescription.brand_name}
                                    <span className="block text-sm text-gray-500 mt-1">
                                      {prescription.urdu_name}
                                    </span>
                                  </h3>

                                  <div className="space-y-2 text-sm">
                                    <PrescriptionDetail
                                      label="Dosage"
                                      en={prescription.dosage_en}
                                      urdu={prescription.dosage_urdu}
                                    />
                                    <PrescriptionDetail
                                      label="Frequency"
                                      en={prescription.frequency_en}
                                      urdu={prescription.frequency_urdu}
                                    />
                                    <PrescriptionDetail
                                      label="Duration"
                                      en={prescription.duration_en}
                                      urdu={prescription.duration_urdu}
                                    />
                                    <PrescriptionDetail
                                      label="Instructions"
                                      en={prescription.instructions_en}
                                      urdu={prescription.instructions_urdu}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <AiOutlineFolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500 italic">
                            No previous treatment records found
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Mobile Close Button */}
                    <div className="sticky bottom-0 bg-white pt-6 mt-6 border-t md:hidden">
                      <button
                        onClick={() => setShowPopup(false)}
                        className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {/* Enhanced Search Section */}
        {!patient && (
          <div className="mb-8 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-700 p-2.5 rounded-lg text-white shadow-sm">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  ></path>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Patient Lookup
                </h3>
                <p className="text-sm text-gray-600">
                  Search existing patient records by mobile number
                </p>
              </div>
            </div>

            <form onSubmit={handleSearchSubmit(onSearch)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3">
                  <input
                    {...registerSearch("mobile")}
                    placeholder="0300 1234567"
                    className="w-full rounded-xl border-2 border-gray-200 bg-white p-3.5 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="self-stretch px-8 bg-blue-700 text-white font-semibold rounded-xl shadow-md hover:bg-blue-800 transition-colors flex items-center justify-center"
                  >
                    {isSearching ? (
                      <div className="flex items-center gap-2">
                        <span className="animate-spin">🌀</span> Searching...
                      </div>
                    ) : (
                      "Find Patient"
                    )}
                  </button>
                </div>
              </div>

              {searchErrors.mobile && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2.5 rounded-lg">
                  <svg
                    className="w-5 h-5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  <span className="text-sm">{searchErrors.mobile.message}</span>
                </div>
              )}
            </form>
          </div>
        )}
        {patient ? (
          <div className="space-y-8" id="consultation-content">
            {/* Symptoms Section */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-5 border-b border-gray-200 pb-4">
                <div className="bg-orange-700 p-2.5 rounded-lg text-white shadow-sm">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Symptom Analysis
                  </h3>
                  <p className="text-sm text-gray-600">
                    Select observed symptoms or add new ones
                  </p>
                </div>
              </div>

              <CreatableSelect
                isMulti
                options={symptoms}
                value={selectedSymptoms}
                onChange={setSelectedSymptoms}
                placeholder="Select or type symptoms..."
                classNamePrefix="react-select"
                isClearable
                onCreateOption={handleCreateSymptom}
                isLoading={isFetchingSymptoms}
                formatCreateLabel={(inputValue) => `Create "${inputValue}"`}
                styles={{
                  control: (base) => ({
                    ...base,
                    border: "2px solid #e5e7eb",
                    borderRadius: "0.75rem",
                    padding: "8px 12px",
                    boxShadow: "none",
                    "&:hover": { borderColor: "#3b82f6" },
                  }),
                  multiValue: (base) => ({
                    ...base,
                    backgroundColor: "#eff6ff",
                    borderRadius: "6px",
                  }),
                  multiValueLabel: (base) => ({
                    ...base,
                    color: "#1d4ed8",
                    fontWeight: "500",
                  }),
                }}
              />
            </div>
            {/* Neurological Examination Section */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="mb-5 text-lg font-bold text-gray-800 flex items-center gap-2">
                <span className="bg-purple-600 text-white p-2 rounded-lg">
                  🧠
                </span>
                Neurological Examination
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
                {/* Motor Section */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600 mb-1 block">
                      Motor Function
                    </label>
                    <CreatableSelect
                      options={[
                        { value: "Normal", label: "Normal" },
                        { value: "Weakness", label: "Weakness" },
                        { value: "Paralysis", label: "Paralysis" },
                        { value: "Spasticity", label: "Spasticity" },
                        { value: "Rigidity", label: "Rigidity" },
                        { value: "Tremors", label: "Tremors" },
                        {
                          value: "Bradykinesia",
                          label: "Slowness of Movement (Bradykinesia)",
                        },
                        {
                          value: "Hyperkinesia",
                          label: "Excessive Movement (Hyperkinesia)",
                        },
                        {
                          value: "Ataxia",
                          label: "Lack of Coordination (Ataxia)",
                        },
                        {
                          value: "Dystonia",
                          label: "Involuntary Muscle Contractions (Dystonia)",
                        },
                        {
                          value: "Fasciculations",
                          label: "Muscle Twitching (Fasciculations)",
                        },
                        {
                          value: "Hypotonia",
                          label: "Decreased Muscle Tone (Hypotonia)",
                        },
                        {
                          value: "Hypertonia",
                          label: "Increased Muscle Tone (Hypertonia)",
                        },
                        {
                          value: "Myoclonus",
                          label: "Sudden Muscle Jerks (Myoclonus)",
                        },
                        {
                          value: "Chorea",
                          label: "Involuntary Rapid Movements (Chorea)",
                        },
                        {
                          value: "Hemiparesis",
                          label: "Weakness on One Side (Hemiparesis)",
                        },
                        {
                          value: "Hemiplegia",
                          label: "Paralysis on One Side (Hemiplegia)",
                        },
                        {
                          value: "Quadriparesis",
                          label: "Weakness in All Limbs (Quadriparesis)",
                        },
                        {
                          value: "Quadriplegia",
                          label: "Paralysis in All Limbs (Quadriplegia)",
                        },
                        {
                          value: "Monoparesis",
                          label: "Weakness in One Limb (Monoparesis)",
                        },
                        {
                          value: "Monoplegia",
                          label: "Paralysis in One Limb (Monoplegia)",
                        },
                      ]}
                      isSearchable
                      isClearable
                      value={
                        [
                          { value: "Normal", label: "Normal" },
                          { value: "Weakness", label: "Weakness" },
                          { value: "Paralysis", label: "Paralysis" },
                          { value: "Spasticity", label: "Spasticity" },
                          { value: "Rigidity", label: "Rigidity" },
                          { value: "Tremors", label: "Tremors" },
                          {
                            value: "Bradykinesia",
                            label: "Slowness of Movement (Bradykinesia)",
                          },
                          {
                            value: "Hyperkinesia",
                            label: "Excessive Movement (Hyperkinesia)",
                          },
                          {
                            value: "Ataxia",
                            label: "Lack of Coordination (Ataxia)",
                          },
                          {
                            value: "Dystonia",
                            label: "Involuntary Muscle Contractions (Dystonia)",
                          },
                          {
                            value: "Fasciculations",
                            label: "Muscle Twitching (Fasciculations)",
                          },
                          {
                            value: "Hypotonia",
                            label: "Decreased Muscle Tone (Hypotonia)",
                          },
                          {
                            value: "Hypertonia",
                            label: "Increased Muscle Tone (Hypertonia)",
                          },
                          {
                            value: "Myoclonus",
                            label: "Sudden Muscle Jerks (Myoclonus)",
                          },
                          {
                            value: "Chorea",
                            label: "Involuntary Rapid Movements (Chorea)",
                          },
                          {
                            value: "Hemiparesis",
                            label: "Weakness on One Side (Hemiparesis)",
                          },
                          {
                            value: "Hemiplegia",
                            label: "Paralysis on One Side (Hemiplegia)",
                          },
                          {
                            value: "Quadriparesis",
                            label: "Weakness in All Limbs (Quadriparesis)",
                          },
                          {
                            value: "Quadriplegia",
                            label: "Paralysis in All Limbs (Quadriplegia)",
                          },
                          {
                            value: "Monoparesis",
                            label: "Weakness in One Limb (Monoparesis)",
                          },
                          {
                            value: "Monoplegia",
                            label: "Paralysis in One Limb (Monoplegia)",
                          },
                        ].find(
                          (option) =>
                            option.value === neuroExamData.motor_function
                        ) ||
                        (neuroExamData.motor_function
                          ? {
                              value: neuroExamData.motor_function,
                              label: neuroExamData.motor_function,
                            }
                          : null)
                      }
                      onChange={(selectedOption) =>
                        setNeuroExamData((prev) => ({
                          ...prev,
                          motor_function: selectedOption
                            ? selectedOption.value
                            : "",
                        }))
                      }
                      onCreateOption={(inputValue) =>
                        setNeuroExamData((prev) => ({
                          ...prev,
                          motor_function: inputValue, // Allows custom text input
                        }))
                      }
                      placeholder="Select or type..."
                      className="w-full text-sm rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-gray-400 transition-colors"
                      classNames={{
                        control: (state) =>
                          `p-2 ${
                            state.isFocused
                              ? "border-purple-500"
                              : "border-gray-300"
                          } bg-white`,
                        input: () => "text-gray-700",
                        placeholder: () => "text-gray-400",
                        menu: () =>
                          "border border-gray-200 rounded-lg shadow-lg mt-1",
                        option: (state) =>
                          `px-4 py-2 ${
                            state.isFocused
                              ? "bg-purple-50 text-purple-700"
                              : "text-gray-700"
                          }`,
                        dropdownIndicator: () =>
                          "text-gray-400 hover:text-gray-500",
                        clearIndicator: () =>
                          "text-gray-400 hover:text-red-500",
                      }}
                      styles={{
                        control: (base) => ({
                          ...base,
                          borderColor: "#d1d5db", // gray-300
                          backgroundImage:
                            "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiA2YjcyOGIiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS1jaGV2cm9uLWRvd24iPjxwYXRoIGQ9Im02IDkgNiA2IDYtNiIvPjwvc3ZnPg==')",
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "right 1rem center",
                        }),
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600 mb-1 block">
                      Muscle Tone
                    </label>
                    <CreatableSelect
                      options={[
                        { value: "Normal", label: "Normal" },
                        {
                          value: "Hypotonic",
                          label: "Hypotonic (Decreased Muscle Tone)",
                        },
                        {
                          value: "Hypertonic",
                          label: "Hypertonic (Increased Muscle Tone)",
                        },
                        { value: "Rigidity", label: "Rigidity" },
                        { value: "Spasticity", label: "Spasticity" },
                        {
                          value: "Flaccidity",
                          label: "Flaccidity (Complete Loss of Muscle Tone)",
                        },
                        {
                          value: "Clonus",
                          label:
                            "Clonus (Involuntary Rhythmic Muscle Contractions)",
                        },
                        {
                          value: "Dystonia",
                          label: "Dystonia (Involuntary Muscle Contractions)",
                        },
                        {
                          value: "Paratonia",
                          label:
                            "Paratonia (Involuntary Resistance to Passive Movement)",
                        },
                      ]}
                      isSearchable
                      isClearable
                      value={
                        neuroExamData.muscle_tone
                          ? {
                              value: neuroExamData.muscle_tone,
                              label: neuroExamData.muscle_tone,
                            }
                          : null
                      }
                      onChange={(selectedOption) =>
                        setNeuroExamData((prev) => ({
                          ...prev,
                          muscle_tone: selectedOption
                            ? selectedOption.value
                            : "",
                        }))
                      }
                      onCreateOption={(inputValue) =>
                        setNeuroExamData((prev) => ({
                          ...prev,
                          muscle_tone: inputValue, // Allows custom text input
                        }))
                      }
                      placeholder="Select or type..."
                      className="w-full text-sm rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-gray-400 transition-colors"
                      classNames={{
                        control: (state) =>
                          `p-2 ${
                            state.isFocused
                              ? "border-purple-500"
                              : "border-gray-300"
                          } bg-white`,
                        input: () => "text-gray-700",
                        placeholder: () => "text-gray-400",
                        menu: () =>
                          "border border-gray-200 rounded-lg shadow-lg mt-1",
                        option: (state) =>
                          `px-4 py-2 ${
                            state.isFocused
                              ? "bg-purple-50 text-purple-700"
                              : "text-gray-700"
                          }`,
                        dropdownIndicator: () =>
                          "text-gray-400 hover:text-gray-500",
                        clearIndicator: () =>
                          "text-gray-400 hover:text-red-500",
                      }}
                    />
                  </div>
                </div>
                {/* Reflexes Section */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600 mb-1 block">
                      Reflexes
                    </label>
                    <CreatableSelect
                      options={[
                        { value: "Normal", label: "Normal" },
                        { value: "Brisk", label: "Brisk" },
                        { value: "Exaggerated", label: "Exaggerated" },
                        {
                          value: "Hyperreflexia",
                          label: "Hyperreflexia (Overactive Reflexes)",
                        },
                        {
                          value: "Hyporeflexia",
                          label: "Hyporeflexia (Reduced Reflexes)",
                        },
                        { value: "Absent", label: "Absent" },
                        {
                          value: "Clonus",
                          label:
                            "Clonus (Involuntary Rhythmic Reflex Contractions)",
                        },
                        {
                          value: "Babinski Sign",
                          label: "Babinski Sign (Upgoing Toe Reflex)",
                        },
                        {
                          value: "Hoffmann’s Reflex",
                          label: "Hoffmann’s Reflex (Finger Flexor Response)",
                        },
                        {
                          value: "Pendular Reflexes",
                          label:
                            "Pendular Reflexes (Slow, Repetitive Reflex Movements)",
                        },
                      ]}
                      isSearchable
                      isClearable
                      value={
                        neuroExamData.deep_tendon_reflexes
                          ? {
                              value: neuroExamData.deep_tendon_reflexes,
                              label: neuroExamData.deep_tendon_reflexes,
                            }
                          : null
                      }
                      onChange={(selectedOption) =>
                        setNeuroExamData((prev) => ({
                          ...prev,
                          deep_tendon_reflexes: selectedOption
                            ? selectedOption.value
                            : "",
                        }))
                      }
                      onCreateOption={(inputValue) =>
                        setNeuroExamData((prev) => ({
                          ...prev,
                          deep_tendon_reflexes: inputValue, // Allows custom text input
                        }))
                      }
                      placeholder="Select or type..."
                      className="w-full text-sm rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-gray-400 transition-colors"
                      classNames={{
                        control: (state) =>
                          `p-2 ${
                            state.isFocused
                              ? "border-purple-500"
                              : "border-gray-300"
                          } bg-white`,
                        input: () => "text-gray-700",
                        placeholder: () => "text-gray-400",
                        menu: () =>
                          "border border-gray-200 rounded-lg shadow-lg mt-1",
                        option: (state) =>
                          `px-4 py-2 ${
                            state.isFocused
                              ? "bg-purple-50 text-purple-700"
                              : "text-gray-700"
                          }`,
                        dropdownIndicator: () =>
                          "text-gray-400 hover:text-gray-500",
                        clearIndicator: () =>
                          "text-gray-400 hover:text-red-500",
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600 mb-1 block">
                      Muscle Strength
                    </label>
                    <CreatableSelect
                      options={[
                        {
                          value: "0/5 - No contraction",
                          label: "0/5 - No contraction",
                        },
                        {
                          value: "1/5 - Trace contraction",
                          label: "1/5 - Trace contraction",
                        },
                        {
                          value: "2/5 - Active movement (gravity eliminated)",
                          label: "2/5 - Active movement (gravity eliminated)",
                        },
                        {
                          value: "3/5 - Active movement against gravity",
                          label: "3/5 - Active movement against gravity",
                        },
                        {
                          value: "4/5 - Active movement against resistance",
                          label: "4/5 - Active movement against resistance",
                        },
                        { value: "5/5 - Normal", label: "5/5 - Normal" },
                      ]}
                      isSearchable
                      isClearable
                      value={
                        neuroExamData.muscle_strength
                          ? {
                              value: neuroExamData.muscle_strength,
                              label: neuroExamData.muscle_strength,
                            }
                          : null
                      }
                      onChange={(selectedOption) =>
                        setNeuroExamData((prev) => ({
                          ...prev,
                          muscle_strength: selectedOption
                            ? selectedOption.value
                            : "",
                        }))
                      }
                      onCreateOption={(inputValue) =>
                        setNeuroExamData((prev) => ({
                          ...prev,
                          muscle_strength: inputValue,
                        }))
                      }
                      placeholder="Select or type..."
                      className="w-full text-sm rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-gray-400 transition-colors"
                      classNames={{
                        control: (state) =>
                          `p-2 ${
                            state.isFocused
                              ? "border-purple-500"
                              : "border-gray-300"
                          } bg-white`,
                        input: () => "text-gray-700",
                        placeholder: () => "text-gray-400",
                        menu: () =>
                          "border border-gray-200 rounded-lg shadow-lg mt-1",
                        option: (state) =>
                          `px-4 py-2 ${
                            state.isFocused
                              ? "bg-purple-50 text-purple-700"
                              : "text-gray-700"
                          }`,
                        dropdownIndicator: () =>
                          "text-gray-400 hover:text-gray-500",
                        clearIndicator: () =>
                          "text-gray-400 hover:text-red-500",
                      }}
                    />
                  </div>
                </div>

                {/* other sections   */}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600 mb-1 block">
                      Straight Leg Raise (SLR) Test
                    </label>
                    <CreatableSelect
                      options={[
                        { value: "Negative", label: "✅ Negative" },
                        {
                          value: "Positive at 30°",
                          label: "📏 Positive at 30°",
                        },
                        {
                          value: "Positive at 30° with Pain",
                          label: "📏🔥 Positive at 30° with Pain",
                        },
                        {
                          value: "Positive at 30° Bilateral",
                          label: "📏🔄 Positive at 30° Bilateral",
                        },
                        {
                          value: "Positive at 30° Left",
                          label: "📏⬅️ Positive at 30° Left",
                        },
                        {
                          value: "Positive at 30° Right",
                          label: "📏➡️ Positive at 30° Right",
                        },
                        {
                          value: "Positive at 30° with Sciatic Pain",
                          label: "📏⚡ Positive at 30° with Sciatic Pain",
                        },
                        {
                          value: "Positive at 45°",
                          label: "📏 Positive at 45°",
                        },
                        {
                          value: "Positive at 60°",
                          label: "📏 Positive at 60°",
                        },
                        {
                          value: "Bilateral Positive",
                          label: "🔄 Bilateral Positive",
                        },
                        {
                          value: "Bilateral Negative",
                          label: "✅✅ Bilateral Negative",
                        },
                        { value: "Severe Pain", label: "🔥 Severe Pain" },
                        { value: "Mild Pain", label: "💢 Mild Pain" },
                        {
                          value: "Restricted Movement",
                          label: "🚫 Restricted Movement",
                        },
                        {
                          value: "Hyperextension Pain",
                          label: "⚡ Hyperextension Pain",
                        },
                      ]}
                      isSearchable
                      isClearable
                      value={
                        neuroExamData.straight_leg_raise_test
                          ? {
                              value: neuroExamData.straight_leg_raise_test,
                              label: neuroExamData.straight_leg_raise_test, // Use same value as label
                            }
                          : null
                      }
                      onChange={(selectedOption) =>
                        setNeuroExamData((prev) => ({
                          ...prev,
                          straight_leg_raise_test: selectedOption
                            ? selectedOption.value
                            : null, // Store only the value
                        }))
                      }
                      onCreateOption={(inputValue) =>
                        setNeuroExamData((prev) => ({
                          ...prev,
                          straight_leg_raise_test: inputValue, // Store user input directly
                        }))
                      }
                      placeholder="Select or type..."
                      className="w-full text-sm rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-gray-400 transition-colors"
                      classNames={{
                        control: (state) =>
                          `p-2 ${
                            state.isFocused
                              ? "border-purple-500"
                              : "border-gray-300"
                          } bg-white`,
                        input: () => "text-gray-700",
                        placeholder: () => "text-gray-400",
                        menu: () =>
                          "border border-gray-200 rounded-lg shadow-lg mt-1",
                        option: (state) =>
                          `px-4 py-2 ${
                            state.isFocused
                              ? "bg-purple-50 text-purple-700"
                              : "text-gray-700"
                          }`,
                        dropdownIndicator: () =>
                          "text-gray-400 hover:text-gray-500",
                        clearIndicator: () =>
                          "text-gray-400 hover:text-red-500",
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600 mb-1 block">
                      Plantars
                    </label>
                    <CreatableSelect
                      options={[
                        {
                          value: "Upwards",
                          label: (
                            <div className="flex items-center gap-2">
                              <FaArrowUp className="text-blue-600" /> Upwards
                            </div>
                          ),
                        },
                        {
                          value: "Downward",
                          label: (
                            <div className="flex items-center gap-2">
                              <FaArrowDown className="text-green-600" />{" "}
                              Downward
                            </div>
                          ),
                        },
                        {
                          value: "Mute",
                          label: (
                            <div className="flex items-center gap-2">
                              <FaBan className="text-gray-500" /> Mute
                            </div>
                          ),
                        },
                        {
                          value: "Withdrawal",
                          label: (
                            <div className="flex items-center gap-2">
                              <FaReply className="text-red-600" /> Withdrawal
                            </div>
                          ),
                        },
                        {
                          value: "Bilateral Upwards",
                          label: (
                            <div className="flex items-center gap-2">
                              <FaArrowUp className="text-blue-600" />
                              <FaArrowUp className="text-blue-600" /> Bilateral
                              Upwards
                            </div>
                          ),
                        },
                        {
                          value: "Bilateral Downward",
                          label: (
                            <div className="flex items-center gap-2">
                              <FaArrowDown className="text-green-600" />
                              <FaArrowDown className="text-green-600" />{" "}
                              Bilateral Downward
                            </div>
                          ),
                        },
                        {
                          value: "Bilateral Mute",
                          label: (
                            <div className="flex items-center gap-2">
                              <FaBan className="text-gray-500" />
                              <FaBan className="text-gray-500" /> Bilateral Mute
                            </div>
                          ),
                        },
                      ]}
                      isSearchable
                      isClearable
                      value={
                        neuroExamData.plantar_reflex
                          ? {
                              value: neuroExamData.plantar_reflex,
                              label: (
                                <div className="flex items-center gap-2">
                                  {neuroExamData.plantar_reflex.includes(
                                    "Upwards"
                                  ) && <FaArrowUp className="text-blue-600" />}
                                  {neuroExamData.plantar_reflex.includes(
                                    "Downward"
                                  ) && (
                                    <FaArrowDown className="text-green-600" />
                                  )}
                                  {neuroExamData.plantar_reflex.includes(
                                    "Mute"
                                  ) && <FaBan className="text-gray-500" />}
                                  {neuroExamData.plantar_reflex.includes(
                                    "Withdrawal"
                                  ) && <FaReply className="text-red-600" />}
                                  {neuroExamData.plantar_reflex}
                                </div>
                              ),
                            }
                          : null
                      }
                      onChange={(selectedOption) =>
                        setNeuroExamData((prev) => ({
                          ...prev,
                          plantar_reflex: selectedOption
                            ? selectedOption.value
                            : "",
                        }))
                      }
                      onCreateOption={(inputValue) =>
                        setNeuroExamData((prev) => ({
                          ...prev,
                          plantar_reflex: inputValue, // Allows custom input
                        }))
                      }
                      placeholder="Select or type..."
                      className="w-full text-sm rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-gray-400 transition-colors"
                      classNames={{
                        control: (state) =>
                          `p-2 ${
                            state.isFocused
                              ? "border-purple-500"
                              : "border-gray-300"
                          } bg-white`,
                        input: () => "text-gray-700",
                        placeholder: () => "text-gray-400",
                        menu: () =>
                          "border border-gray-200 rounded-lg shadow-lg mt-1",
                        option: (state) =>
                          `px-4 py-2 flex items-center ${
                            state.isFocused
                              ? "bg-purple-50 text-purple-700"
                              : "text-gray-700"
                          }`,
                        dropdownIndicator: () =>
                          "text-gray-400 hover:text-gray-500",
                        clearIndicator: () =>
                          "text-gray-400 hover:text-red-500",
                      }}
                    />
                  </div>
                </div>
                {/* Reflexes Section */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600 mb-1 block">
                      Sensory Examination
                    </label>
                    <CreatableSelect
                      options={[
                        { value: "Normal", label: "Normal" },
                        {
                          value: "Altered",
                          label: "Altered",
                        },
                        {
                          value: "Intact",
                          label: "Intact",
                        },
                        {
                          value: "Increased Sensation (Hyperesthesia)",
                          label: "Increased Sensation (Hyperesthesia)",
                        },
                        {
                          value: "Tingling or Burning (Paresthesia)",
                          label: "Tingling or Burning (Paresthesia)",
                        },
                      ]}
                      isSearchable
                      isClearable
                      value={
                        neuroExamData.sensory_examination
                          ? {
                              value: neuroExamData.sensory_examination,
                              label: neuroExamData.sensory_examination,
                            }
                          : null
                      }
                      onChange={(selectedOption) =>
                        setNeuroExamData((prev) => ({
                          ...prev,
                          sensory_examination: selectedOption
                            ? selectedOption.value
                            : "",
                        }))
                      }
                      onCreateOption={(inputValue) =>
                        setNeuroExamData((prev) => ({
                          ...prev,
                          sensory_examination: inputValue, // Allows custom text input
                        }))
                      }
                      placeholder="Select or type..."
                      className="w-full text-sm rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-gray-400 transition-colors"
                      classNames={{
                        control: (state) =>
                          `p-2 ${
                            state.isFocused
                              ? "border-purple-500"
                              : "border-gray-300"
                          } bg-white`,
                        input: () => "text-gray-700",
                        placeholder: () => "text-gray-400",
                        menu: () =>
                          "border border-gray-200 rounded-lg shadow-lg mt-1",
                        option: (state) =>
                          `px-4 py-2 ${
                            state.isFocused
                              ? "bg-purple-50 text-purple-700"
                              : "text-gray-700"
                          }`,
                        dropdownIndicator: () =>
                          "text-gray-400 hover:text-gray-500",
                        clearIndicator: () =>
                          "text-gray-400 hover:text-red-500",
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600 mb-1 block">
                      Pain Sensation
                    </label>
                    <CreatableSelect
                      options={[
                        { value: "Normal", label: "Normal" },
                        {
                          value: "Hypalgesia",
                          label: "Reduced Pain Sensation (Hypalgesia)",
                        },
                        {
                          value: "Analgesia",
                          label: "Absent Pain Sensation (Analgesia)",
                        },
                        {
                          value: "Hyperalgesia",
                          label: "Increased Pain Sensation (Hyperalgesia)",
                        },
                      ]}
                      isSearchable
                      isClearable
                      value={
                        [
                          { value: "Normal", label: "Normal" },
                          {
                            value: "Hypalgesia",
                            label: "Reduced Pain Sensation (Hypalgesia)",
                          },
                          {
                            value: "Analgesia",
                            label: "Absent Pain Sensation (Analgesia)",
                          },
                          {
                            value: "Hyperalgesia",
                            label: "Increased Pain Sensation (Hyperalgesia)",
                          },
                        ].find(
                          (option) =>
                            option.value === neuroExamData.pain_sensation
                        ) ||
                        (neuroExamData.pain_sensation
                          ? {
                              value: neuroExamData.pain_sensation,
                              label: neuroExamData.pain_sensation,
                            }
                          : null)
                      }
                      onChange={(selectedOption) =>
                        setNeuroExamData((prev) => ({
                          ...prev,
                          pain_sensation: selectedOption
                            ? selectedOption.value
                            : "",
                        }))
                      }
                      onCreateOption={(inputValue) =>
                        setNeuroExamData((prev) => ({
                          ...prev,
                          pain_sensation: inputValue, // Allows custom text input
                        }))
                      }
                      placeholder="Select or type..."
                      className="w-full text-sm rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-gray-400 transition-colors"
                      classNames={{
                        control: (state) =>
                          `p-2 ${
                            state.isFocused
                              ? "border-purple-500"
                              : "border-gray-300"
                          } bg-white`,
                        input: () => "text-gray-700",
                        placeholder: () => "text-gray-400",
                        menu: () =>
                          "border border-gray-200 rounded-lg shadow-lg mt-1",
                        option: (state) =>
                          `px-4 py-2 ${
                            state.isFocused
                              ? "bg-purple-50 text-purple-700"
                              : "text-gray-700"
                          }`,
                        dropdownIndicator: () =>
                          "text-gray-400 hover:text-gray-500",
                        clearIndicator: () =>
                          "text-gray-400 hover:text-red-500",
                      }}
                      styles={{
                        control: (base) => ({
                          ...base,
                          borderColor: "#d1d5db", // gray-300
                          backgroundImage:
                            "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiA2YjcyOGIiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS1jaGV2cm9uLWRvd24iPjxwYXRoIGQ9Im02IDkgNiA2IDYtNiIvPjwvc3ZnPg==')",
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "right 1rem center",
                        }),
                      }}
                    />
                  </div>
                </div>

                {/* more sections */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600 mb-1 block">
                      Speech Assessment
                    </label>
                    <CreatableSelect
                      options={[
                        { value: "Normal", label: "Normal" },
                        { value: "Slurred", label: "Slurred Speech" },
                        {
                          value: "Dysarthria",
                          label: "Dysarthria (Weak or Slow Speech)",
                        },
                        {
                          value: "Aphasia",
                          label: "Aphasia (Loss of Speech Ability)",
                        },
                        {
                          value: "Dysphonia",
                          label: "Dysphonia (Hoarse or Weak Voice)",
                        },
                        {
                          value: "Mutism",
                          label: "Mutism (Inability to Speak)",
                        },
                        {
                          value: "scanning speech",
                          label: "scanning speech (speech abnormality)",
                        },
                      ]}
                      isSearchable
                      isClearable
                      value={
                        [
                          { value: "Normal", label: "Normal" },
                          { value: "Slurred", label: "Slurred Speech" },
                          {
                            value: "Dysarthria",
                            label: "Dysarthria (Weak or Slow Speech)",
                          },
                          {
                            value: "Aphasia",
                            label: "Aphasia (Loss of Speech Ability)",
                          },
                          {
                            value: "Dysphonia",
                            label: "Dysphonia (Hoarse or Weak Voice)",
                          },
                          {
                            value: "Mutism",
                            label: "Mutism (Inability to Speak)",
                          },
                        ].find(
                          (option) =>
                            option.value === neuroExamData.speech_assessment
                        ) ||
                        (neuroExamData.speech_assessment
                          ? {
                              value: neuroExamData.speech_assessment,
                              label: neuroExamData.speech_assessment,
                            }
                          : null)
                      }
                      onChange={(selectedOption) =>
                        setNeuroExamData((prev) => ({
                          ...prev,
                          speech_assessment: selectedOption
                            ? selectedOption.value
                            : "",
                        }))
                      }
                      onCreateOption={(inputValue) =>
                        setNeuroExamData((prev) => ({
                          ...prev,
                          speech_assessment: inputValue, // Allows custom input
                        }))
                      }
                      placeholder="Select or type..."
                      className="w-full text-sm rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-gray-400 transition-colors"
                      classNames={{
                        control: (state) =>
                          `p-2 ${
                            state.isFocused
                              ? "border-purple-500"
                              : "border-gray-300"
                          } bg-white`,
                        input: () => "text-gray-700",
                        placeholder: () => "text-gray-400",
                        menu: () =>
                          "border border-gray-200 rounded-lg shadow-lg mt-1",
                        option: (state) =>
                          `px-4 py-2 ${
                            state.isFocused
                              ? "bg-purple-50 text-purple-700"
                              : "text-gray-700"
                          }`,
                        dropdownIndicator: () =>
                          "text-gray-400 hover:text-gray-500",
                        clearIndicator: () =>
                          "text-gray-400 hover:text-red-500",
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600 mb-1 block">
                      Coordination
                    </label>
                    <CreatableSelect
                      options={[
                        { value: "Normal", label: "Normal" },
                        {
                          value: "Dysmetria",
                          label: "Dysmetria (Impaired Distance Control)",
                        },
                        {
                          value: "Ataxia",
                          label: "Ataxia (Uncoordinated Movements)",
                        },
                        {
                          value: "Tremors",
                          label: "Tremors (Shaking Movements)",
                        },
                        {
                          value: "Adiadochokinesia",
                          label:
                            "Adiadochokinesia (Inability to Perform Rapid Movements)",
                        },
                        {
                          value: "Dyssynergia",
                          label: "Dyssynergia (Lack of Smooth Coordination)",
                        },
                      ]}
                      isSearchable
                      isClearable
                      value={
                        [
                          { value: "Normal", label: "Normal" },
                          {
                            value: "Dysmetria",
                            label: "Dysmetria (Impaired Distance Control)",
                          },
                          {
                            value: "Ataxia",
                            label: "Ataxia (Uncoordinated Movements)",
                          },
                          {
                            value: "Tremors",
                            label: "Tremors (Shaking Movements)",
                          },
                          {
                            value: "Adiadochokinesia",
                            label:
                              "Adiadochokinesia (Inability to Perform Rapid Movements)",
                          },
                          {
                            value: "Dyssynergia",
                            label: "Dyssynergia (Lack of Smooth Coordination)",
                          },
                        ].find(
                          (option) =>
                            option.value === neuroExamData.coordination
                        ) ||
                        (neuroExamData.coordination
                          ? {
                              value: neuroExamData.coordination,
                              label: neuroExamData.coordination,
                            }
                          : null)
                      }
                      onChange={(selectedOption) =>
                        setNeuroExamData((prev) => ({
                          ...prev,
                          coordination: selectedOption
                            ? selectedOption.value
                            : "",
                        }))
                      }
                      onCreateOption={(inputValue) =>
                        setNeuroExamData((prev) => ({
                          ...prev,
                          coordination: inputValue, // Allows custom input
                        }))
                      }
                      placeholder="Select or type..."
                      className="w-full text-sm rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-gray-400 transition-colors"
                      classNames={{
                        control: (state) =>
                          `p-2 ${
                            state.isFocused
                              ? "border-purple-500"
                              : "border-gray-300"
                          } bg-white`,
                        input: () => "text-gray-700",
                        placeholder: () => "text-gray-400",
                        menu: () =>
                          "border border-gray-200 rounded-lg shadow-lg mt-1",
                        option: (state) =>
                          `px-4 py-2 ${
                            state.isFocused
                              ? "bg-purple-50 text-purple-700"
                              : "text-gray-700"
                          }`,
                        dropdownIndicator: () =>
                          "text-gray-400 hover:text-gray-500",
                        clearIndicator: () =>
                          "text-gray-400 hover:text-red-500",
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600 mb-1 block">
                      Sensory Function
                    </label>
                    <CreatableSelect
                      options={[
                        { value: "Normal", label: "Normal" },
                        {
                          value: "Hypoesthesia",
                          label: "Hypoesthesia (Decreased Sensation)",
                        },
                        {
                          value: "Anesthesia",
                          label: "Anesthesia (Absent Sensation)",
                        },
                        {
                          value: "Hyperesthesia",
                          label: "Hyperesthesia (Increased Sensation)",
                        },
                        {
                          value: "Paresthesia",
                          label: "Paresthesia (Tingling or Burning)",
                        },
                        {
                          value: "Dysesthesia",
                          label: "Dysesthesia (Abnormal Unpleasant Sensation)",
                        },
                      ]}
                      isSearchable
                      isClearable
                      value={
                        [
                          { value: "Normal", label: "Normal" },
                          {
                            value: "Hypoesthesia",
                            label: "Hypoesthesia (Decreased Sensation)",
                          },
                          {
                            value: "Anesthesia",
                            label: "Anesthesia (Absent Sensation)",
                          },
                          {
                            value: "Hyperesthesia",
                            label: "Hyperesthesia (Increased Sensation)",
                          },
                          {
                            value: "Paresthesia",
                            label: "Paresthesia (Tingling or Burning)",
                          },
                          {
                            value: "Dysesthesia",
                            label:
                              "Dysesthesia (Abnormal Unpleasant Sensation)",
                          },
                        ].find(
                          (option) =>
                            option.value === neuroExamData.sensory_function
                        ) ||
                        (neuroExamData.sensory_function
                          ? {
                              value: neuroExamData.sensory_function,
                              label: neuroExamData.sensory_function,
                            }
                          : null)
                      }
                      onChange={(selectedOption) =>
                        setNeuroExamData((prev) => ({
                          ...prev,
                          sensory_function: selectedOption
                            ? selectedOption.value
                            : "",
                        }))
                      }
                      onCreateOption={(inputValue) =>
                        setNeuroExamData((prev) => ({
                          ...prev,
                          sensory_function: inputValue, // Allows custom input
                        }))
                      }
                      placeholder="Select or type..."
                      className="w-full text-sm rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-gray-400 transition-colors"
                      classNames={{
                        control: (state) =>
                          `p-2 ${
                            state.isFocused
                              ? "border-purple-500"
                              : "border-gray-300"
                          } bg-white`,
                        input: () => "text-gray-700",
                        placeholder: () => "text-gray-400",
                        menu: () =>
                          "border border-gray-200 rounded-lg shadow-lg mt-1",
                        option: (state) =>
                          `px-4 py-2 ${
                            state.isFocused
                              ? "bg-purple-50 text-purple-700"
                              : "text-gray-700"
                          }`,
                        dropdownIndicator: () =>
                          "text-gray-400 hover:text-gray-500",
                        clearIndicator: () =>
                          "text-gray-400 hover:text-red-500",
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600 mb-1 block">
                      Cranial Nerves
                    </label>
                    <CreatableSelect
                      options={[
                        { value: "Normal", label: "Normal" },
                        {
                          value: "CN I - Olfactory (Smell Impairment)",
                          label: "CN I - Olfactory (Smell Impairment)",
                        },
                        {
                          value: "CN II - Optic (Vision Loss)",
                          label: "CN II - Optic (Vision Loss)",
                        },
                        {
                          value: "CN III - Oculomotor (Ptosis, Diplopia)",
                          label: "CN III - Oculomotor (Ptosis, Diplopia)",
                        },
                        {
                          value: "CN IV - Trochlear (Vertical Diplopia)",
                          label: "CN IV - Trochlear (Vertical Diplopia)",
                        },
                        {
                          value: "CN V - Trigeminal (Facial Numbness)",
                          label: "CN V - Trigeminal (Facial Numbness)",
                        },
                        {
                          value: "CN VI - Abducens (Lateral Gaze Palsy)",
                          label: "CN VI - Abducens (Lateral Gaze Palsy)",
                        },
                        {
                          value: "CN VII - Facial (Facial Weakness)",
                          label: "CN VII - Facial (Facial Weakness)",
                        },
                        {
                          value:
                            "CN VIII - Vestibulocochlear (Hearing Loss, Vertigo)",
                          label:
                            "CN VIII - Vestibulocochlear (Hearing Loss, Vertigo)",
                        },
                        {
                          value:
                            "CN IX - Glossopharyngeal (Swallowing Difficulty)",
                          label:
                            "CN IX - Glossopharyngeal (Swallowing Difficulty)",
                        },
                        {
                          value: "CN X - Vagus (Hoarseness, Dysphagia)",
                          label: "CN X - Vagus (Hoarseness, Dysphagia)",
                        },
                        {
                          value: "CN XI - Accessory (Shoulder Weakness)",
                          label: "CN XI - Accessory (Shoulder Weakness)",
                        },
                        {
                          value: "CN XII - Hypoglossal (Tongue Deviation)",
                          label: "CN XII - Hypoglossal (Tongue Deviation)",
                        },
                      ]}
                      isSearchable
                      isClearable
                      value={
                        [
                          { value: "Normal", label: "Normal" },
                          {
                            value: "CN I - Olfactory (Smell Impairment)",
                            label: "CN I - Olfactory (Smell Impairment)",
                          },
                          {
                            value: "CN II - Optic (Vision Loss)",
                            label: "CN II - Optic (Vision Loss)",
                          },
                          {
                            value: "CN III - Oculomotor (Ptosis, Diplopia)",
                            label: "CN III - Oculomotor (Ptosis, Diplopia)",
                          },
                          {
                            value: "CN IV - Trochlear (Vertical Diplopia)",
                            label: "CN IV - Trochlear (Vertical Diplopia)",
                          },
                          {
                            value: "CN V - Trigeminal (Facial Numbness)",
                            label: "CN V - Trigeminal (Facial Numbness)",
                          },
                          {
                            value: "CN VI - Abducens (Lateral Gaze Palsy)",
                            label: "CN VI - Abducens (Lateral Gaze Palsy)",
                          },
                          {
                            value: "CN VII - Facial (Facial Weakness)",
                            label: "CN VII - Facial (Facial Weakness)",
                          },
                          {
                            value:
                              "CN VIII - Vestibulocochlear (Hearing Loss, Vertigo)",
                            label:
                              "CN VIII - Vestibulocochlear (Hearing Loss, Vertigo)",
                          },
                          {
                            value:
                              "CN IX - Glossopharyngeal (Swallowing Difficulty)",
                            label:
                              "CN IX - Glossopharyngeal (Swallowing Difficulty)",
                          },
                          {
                            value: "CN X - Vagus (Hoarseness, Dysphagia)",
                            label: "CN X - Vagus (Hoarseness, Dysphagia)",
                          },
                          {
                            value: "CN XI - Accessory (Shoulder Weakness)",
                            label: "CN XI - Accessory (Shoulder Weakness)",
                          },
                          {
                            value: "CN XII - Hypoglossal (Tongue Deviation)",
                            label: "CN XII - Hypoglossal (Tongue Deviation)",
                          },
                        ].find(
                          (option) =>
                            option.value === neuroExamData.cranial_nerves
                        ) ||
                        (neuroExamData.cranial_nerves
                          ? {
                              value: neuroExamData.cranial_nerves,
                              label: neuroExamData.cranial_nerves,
                            }
                          : null)
                      }
                      onChange={(selectedOption) =>
                        setNeuroExamData((prev) => ({
                          ...prev,
                          cranial_nerves: selectedOption
                            ? selectedOption.value
                            : "",
                        }))
                      }
                      onCreateOption={(inputValue) =>
                        setNeuroExamData((prev) => ({
                          ...prev,
                          cranial_nerves: inputValue, // Allows custom input
                        }))
                      }
                      placeholder="Select or type..."
                      className="w-full text-sm rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-gray-400 transition-colors"
                      classNames={{
                        control: (state) =>
                          `p-2 ${
                            state.isFocused
                              ? "border-purple-500"
                              : "border-gray-300"
                          } bg-white`,
                        input: () => "text-gray-700",
                        placeholder: () => "text-gray-400",
                        menu: () =>
                          "border border-gray-200 rounded-lg shadow-lg mt-1",
                        option: (state) =>
                          `px-4 py-2 ${
                            state.isFocused
                              ? "bg-purple-50 text-purple-700"
                              : "text-gray-700"
                          }`,
                        dropdownIndicator: () =>
                          "text-gray-400 hover:text-gray-500",
                        clearIndicator: () =>
                          "text-gray-400 hover:text-red-500",
                      }}
                    />
                  </div>
                </div>

                {/* add more sections */}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600 mb-1 block">
                      Mental Status
                    </label>
                    <CreatableSelect
                      options={[
                        { value: "Alert", label: "Alert" },
                        { value: "Confused", label: "Confused" },
                        { value: "Disoriented", label: "Disoriented" },
                        { value: "Lethargic", label: "Lethargic" },
                        { value: "Stuporous", label: "Stuporous" },
                        { value: "Comatose", label: "Comatose" },
                        { value: "Agitated", label: "Agitated" },
                        { value: "Delirious", label: "Delirious" },
                        { value: "Unresponsive", label: "Unresponsive" },
                      ]}
                      isSearchable
                      isClearable
                      value={
                        [
                          { value: "Alert", label: "Alert" },
                          { value: "Confused", label: "Confused" },
                          { value: "Disoriented", label: "Disoriented" },
                          { value: "Lethargic", label: "Lethargic" },
                          { value: "Stuporous", label: "Stuporous" },
                          { value: "Comatose", label: "Comatose" },
                          { value: "Agitated", label: "Agitated" },
                          { value: "Delirious", label: "Delirious" },
                          { value: "Unresponsive", label: "Unresponsive" },
                        ].find(
                          (option) =>
                            option.value === neuroExamData.mental_status
                        ) ||
                        (neuroExamData.mental_status
                          ? {
                              value: neuroExamData.mental_status,
                              label: neuroExamData.mental_status,
                            }
                          : null)
                      }
                      onChange={(selectedOption) =>
                        setNeuroExamData((prev) => ({
                          ...prev,
                          mental_status: selectedOption
                            ? selectedOption.value
                            : "",
                        }))
                      }
                      onCreateOption={(inputValue) =>
                        setNeuroExamData((prev) => ({
                          ...prev,
                          mental_status: inputValue, // Allows custom input
                        }))
                      }
                      placeholder="Select or type..."
                      className="w-full text-sm rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-gray-400 transition-colors"
                      classNames={{
                        control: (state) =>
                          `p-2 ${
                            state.isFocused
                              ? "border-purple-500"
                              : "border-gray-300"
                          } bg-white`,
                        input: () => "text-gray-700",
                        placeholder: () => "text-gray-400",
                        menu: () =>
                          "border border-gray-200 rounded-lg shadow-lg mt-1",
                        option: (state) =>
                          `px-4 py-2 ${
                            state.isFocused
                              ? "bg-purple-50 text-purple-700"
                              : "text-gray-700"
                          }`,
                        dropdownIndicator: () =>
                          "text-gray-400 hover:text-gray-500",
                        clearIndicator: () =>
                          "text-gray-400 hover:text-red-500",
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600 mb-1 block">
                      Cerebellar Function
                    </label>
                    <CreatableSelect
                      options={[
                        { value: "Normal", label: "Normal" },
                        { value: "Ataxia", label: "Ataxia" },
                        {
                          value: "Dysdiadochokinesia",
                          label: "Dysdiadochokinesia",
                        },
                        {
                          value: "Intention Tremor",
                          label: "Intention Tremor",
                        },
                        { value: "Dysmetria", label: "Dysmetria" },
                      ]}
                      isSearchable
                      isClearable
                      value={
                        [
                          { value: "Normal", label: "Normal" },
                          { value: "Ataxia", label: "Ataxia" },
                          {
                            value: "Dysdiadochokinesia",
                            label: "Dysdiadochokinesia",
                          },
                          {
                            value: "Intention Tremor",
                            label: "Intention Tremor",
                          },
                          { value: "Dysmetria", label: "Dysmetria" },
                        ].find(
                          (option) =>
                            option.value === neuroExamData.cerebellar_function
                        ) ||
                        (neuroExamData.cerebellar_function
                          ? {
                              value: neuroExamData.cerebellar_function,
                              label: neuroExamData.cerebellar_function,
                            }
                          : null)
                      }
                      onChange={(selectedOption) =>
                        setNeuroExamData((prev) => ({
                          ...prev,
                          cerebellar_function: selectedOption
                            ? selectedOption.value
                            : "",
                        }))
                      }
                      onCreateOption={(inputValue) =>
                        setNeuroExamData((prev) => ({
                          ...prev,
                          cerebellar_function: inputValue, // Allows custom input
                        }))
                      }
                      placeholder="Select or type..."
                      className="w-full text-sm rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-gray-400 transition-colors"
                      classNames={{
                        control: (state) =>
                          `p-2 ${
                            state.isFocused
                              ? "border-purple-500"
                              : "border-gray-300"
                          } bg-white`,
                        input: () => "text-gray-700",
                        placeholder: () => "text-gray-400",
                        menu: () =>
                          "border border-gray-200 rounded-lg shadow-lg mt-1",
                        option: (state) =>
                          `px-4 py-2 ${
                            state.isFocused
                              ? "bg-purple-50 text-purple-700"
                              : "text-gray-700"
                          }`,
                        dropdownIndicator: () =>
                          "text-gray-400 hover:text-gray-500",
                        clearIndicator: () =>
                          "text-gray-400 hover:text-red-500",
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600 mb-1 block">
                      Muscle Wasting
                    </label>
                    <CreatableSelect
                      options={[
                        { value: "None", label: "None" },
                        { value: "Mild", label: "Mild" },
                        { value: "Moderate", label: "Moderate" },
                        { value: "Severe", label: "Severe" },
                        { value: "Generalized", label: "Generalized" },
                        { value: "Localized", label: "Localized" },
                      ]}
                      isSearchable
                      isClearable
                      value={
                        [
                          { value: "None", label: "None" },
                          { value: "Mild", label: "Mild" },
                          { value: "Moderate", label: "Moderate" },
                          { value: "Severe", label: "Severe" },
                          { value: "Generalized", label: "Generalized" },
                          { value: "Localized", label: "Localized" },
                        ].find(
                          (option) =>
                            option.value === neuroExamData.muscle_wasting
                        ) ||
                        (neuroExamData.muscle_wasting
                          ? {
                              value: neuroExamData.muscle_wasting,
                              label: neuroExamData.muscle_wasting,
                            }
                          : null)
                      }
                      onChange={(selectedOption) =>
                        setNeuroExamData((prev) => ({
                          ...prev,
                          muscle_wasting: selectedOption
                            ? selectedOption.value
                            : "",
                        }))
                      }
                      onCreateOption={(inputValue) =>
                        setNeuroExamData((prev) => ({
                          ...prev,
                          muscle_wasting: inputValue, // Allows custom input
                        }))
                      }
                      placeholder="Select or type..."
                      className="w-full text-sm rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-gray-400 transition-colors"
                      classNames={{
                        control: (state) =>
                          `p-2 ${
                            state.isFocused
                              ? "border-purple-500"
                              : "border-gray-300"
                          } bg-white`,
                        input: () => "text-gray-700",
                        placeholder: () => "text-gray-400",
                        menu: () =>
                          "border border-gray-200 rounded-lg shadow-lg mt-1",
                        option: (state) =>
                          `px-4 py-2 ${
                            state.isFocused
                              ? "bg-purple-50 text-purple-700"
                              : "text-gray-700"
                          }`,
                        dropdownIndicator: () =>
                          "text-gray-400 hover:text-gray-500",
                        clearIndicator: () =>
                          "text-gray-400 hover:text-red-500",
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600 mb-1 block">
                      Abnormal Movements
                    </label>
                    <CreatableSelect
                      options={[
                        { value: "None", label: "None" },
                        { value: "Tremors", label: "Tremors" },
                        { value: "Chorea", label: "Chorea" },
                        { value: "Athetosis", label: "Athetosis" },
                        { value: "Myoclonus", label: "Myoclonus" },
                        { value: "Dystonia", label: "Dystonia" },
                        { value: "Tics", label: "Tics" },
                        {
                          value: "Bradykinesia",
                          label: "Bradykinesia (Slow Movement)",
                        },
                        { value: "Rigidity", label: "Rigidity" },
                      ]}
                      isSearchable
                      isClearable
                      value={
                        [
                          { value: "None", label: "None" },
                          { value: "Tremors", label: "Tremors" },
                          { value: "Chorea", label: "Chorea" },
                          { value: "Athetosis", label: "Athetosis" },
                          { value: "Myoclonus", label: "Myoclonus" },
                          { value: "Dystonia", label: "Dystonia" },
                          { value: "Tics", label: "Tics" },
                          {
                            value: "Bradykinesia",
                            label: "Bradykinesia (Slow Movement)",
                          },
                          { value: "Rigidity", label: "Rigidity" },
                        ].find(
                          (option) =>
                            option.value === neuroExamData.abnormal_movements
                        ) ||
                        (neuroExamData.abnormal_movements
                          ? {
                              value: neuroExamData.abnormal_movements,
                              label: neuroExamData.abnormal_movements,
                            }
                          : null)
                      }
                      onChange={(selectedOption) =>
                        setNeuroExamData((prev) => ({
                          ...prev,
                          abnormal_movements: selectedOption
                            ? selectedOption.value
                            : "",
                        }))
                      }
                      onCreateOption={(inputValue) =>
                        setNeuroExamData((prev) => ({
                          ...prev,
                          abnormal_movements: inputValue, // Allows custom input
                        }))
                      }
                      placeholder="Select or type..."
                      className="w-full text-sm rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-gray-400 transition-colors"
                      classNames={{
                        control: (state) =>
                          `p-2 ${
                            state.isFocused
                              ? "border-purple-500"
                              : "border-gray-300"
                          } bg-white`,
                        input: () => "text-gray-700",
                        placeholder: () => "text-gray-400",
                        menu: () =>
                          "border border-gray-200 rounded-lg shadow-lg mt-1",
                        option: (state) =>
                          `px-4 py-2 ${
                            state.isFocused
                              ? "bg-purple-50 text-purple-700"
                              : "text-gray-700"
                          }`,
                        dropdownIndicator: () =>
                          "text-gray-400 hover:text-gray-500",
                        clearIndicator: () =>
                          "text-gray-400 hover:text-red-500",
                      }}
                    />
                  </div>
                </div>

                {/* remaining fields */}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600 mb-1 block">
                      Romberg Test
                    </label>
                    <CreatableSelect
                      options={[
                        { value: "Negative", label: "Negative (Normal)" },
                        {
                          value: "Positive",
                          label: "Positive (Instability Present)",
                        },
                        {
                          value: "Mild Instability",
                          label: "Mild Instability",
                        },
                        {
                          value: "Severe Instability",
                          label: "Severe Instability",
                        },
                      ]}
                      isSearchable
                      isClearable
                      value={
                        [
                          { value: "Negative", label: "Negative (Normal)" },
                          {
                            value: "Positive",
                            label: "Positive (Instability Present)",
                          },
                          {
                            value: "Mild Instability",
                            label: "Mild Instability",
                          },
                          {
                            value: "Severe Instability",
                            label: "Severe Instability",
                          },
                        ].find(
                          (option) =>
                            option.value === neuroExamData.romberg_test
                        ) ||
                        (neuroExamData.romberg_test
                          ? {
                              value: neuroExamData.romberg_test,
                              label: neuroExamData.romberg_test,
                            }
                          : null)
                      }
                      onChange={(selectedOption) =>
                        setNeuroExamData((prev) => ({
                          ...prev,
                          romberg_test: selectedOption
                            ? selectedOption.value
                            : "",
                        }))
                      }
                      onCreateOption={(inputValue) =>
                        setNeuroExamData((prev) => ({
                          ...prev,
                          romberg_test: inputValue, // Allows custom input
                        }))
                      }
                      placeholder="Select or type..."
                      className="w-full text-sm rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-gray-400 transition-colors"
                      classNames={{
                        control: (state) =>
                          `p-2 ${
                            state.isFocused
                              ? "border-purple-500"
                              : "border-gray-300"
                          } bg-white`,
                        input: () => "text-gray-700",
                        placeholder: () => "text-gray-400",
                        menu: () =>
                          "border border-gray-200 rounded-lg shadow-lg mt-1",
                        option: (state) =>
                          `px-4 py-2 ${
                            state.isFocused
                              ? "bg-purple-50 text-purple-700"
                              : "text-gray-700"
                          }`,
                        dropdownIndicator: () =>
                          "text-gray-400 hover:text-gray-500",
                        clearIndicator: () =>
                          "text-gray-400 hover:text-red-500",
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600 mb-1 block">
                      Fundoscopy (Fundal Examination)
                    </label>
                    <CreatableSelect
                      options={[
                        { value: "Normal", label: "👁 Normal" },
                        { value: "Papilledema", label: "🔴 Papilledema" },
                        { value: "Optic Atrophy", label: "⚪ Optic Atrophy" },
                        {
                          value: "Retinal Hemorrhages",
                          label: "🩸 Retinal Hemorrhages",
                        },
                        {
                          value: "Hypertensive Retinopathy",
                          label: "⚡ Hypertensive Retinopathy",
                        },
                      ]}
                      isSearchable
                      isClearable
                      value={
                        neuroExamData.fundoscopy
                          ? {
                              value: neuroExamData.fundoscopy,
                              label: neuroExamData.fundoscopy,
                            }
                          : null
                      }
                      onChange={(selectedOption) =>
                        setNeuroExamData((prev) => ({
                          ...prev,
                          fundoscopy: selectedOption
                            ? selectedOption.value
                            : "",
                        }))
                      }
                      onCreateOption={(inputValue) =>
                        setNeuroExamData((prev) => ({
                          ...prev,
                          fundoscopy: inputValue, // Allows adding custom text
                        }))
                      }
                      placeholder="Select or type..."
                      className="w-full text-sm rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-gray-400 transition-colors"
                      classNames={{
                        control: (state) =>
                          `p-2 ${
                            state.isFocused
                              ? "border-purple-500"
                              : "border-gray-300"
                          } bg-white`,
                        input: () => "text-gray-700",
                        placeholder: () => "text-gray-400",
                        menu: () =>
                          "border border-gray-200 rounded-lg shadow-lg mt-1",
                        option: (state) =>
                          `px-4 py-2 ${
                            state.isFocused
                              ? "bg-purple-50 text-purple-700"
                              : "text-gray-700"
                          }`,
                        dropdownIndicator: () =>
                          "text-gray-400 hover:text-gray-500",
                        clearIndicator: () =>
                          "text-gray-400 hover:text-red-500",
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600 mb-1 block">
                    Nystagmus
                  </label>
                  <CreatableSelect
                    options={[
                      { value: "Absent", label: "Absent (Normal)" },
                      { value: "Horizontal", label: "Horizontal Nystagmus" },
                      { value: "Vertical", label: "Vertical Nystagmus" },
                      { value: "Rotatory", label: "Rotatory Nystagmus" },
                      {
                        value: "Gaze-Evoked",
                        label: "Gaze-Evoked Nystagmus",
                      },
                      { value: "Positional", label: "Positional Nystagmus" },
                    ]}
                    isSearchable
                    isClearable
                    value={
                      [
                        { value: "Absent", label: "Absent (Normal)" },
                        {
                          value: "Horizontal",
                          label: "Horizontal Nystagmus",
                        },
                        { value: "Vertical", label: "Vertical Nystagmus" },
                        { value: "Rotatory", label: "Rotatory Nystagmus" },
                        {
                          value: "Gaze-Evoked",
                          label: "Gaze-Evoked Nystagmus",
                        },
                        {
                          value: "Positional",
                          label: "Positional Nystagmus",
                        },
                      ].find(
                        (option) => option.value === neuroExamData.nystagmus
                      ) ||
                      (neuroExamData.nystagmus
                        ? {
                            value: neuroExamData.nystagmus,
                            label: neuroExamData.nystagmus,
                          }
                        : null)
                    }
                    onChange={(selectedOption) =>
                      setNeuroExamData((prev) => ({
                        ...prev,
                        nystagmus: selectedOption ? selectedOption.value : "",
                      }))
                    }
                    onCreateOption={(inputValue) =>
                      setNeuroExamData((prev) => ({
                        ...prev,
                        nystagmus: inputValue, // Allows custom input
                      }))
                    }
                    placeholder="Select or type..."
                    className="w-full text-sm rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-gray-400 transition-colors"
                    classNames={{
                      control: (state) =>
                        `p-2 ${
                          state.isFocused
                            ? "border-purple-500"
                            : "border-gray-300"
                        } bg-white`,
                      input: () => "text-gray-700",
                      placeholder: () => "text-gray-400",
                      menu: () =>
                        "border border-gray-200 rounded-lg shadow-lg mt-1",
                      option: (state) =>
                        `px-4 py-2 ${
                          state.isFocused
                            ? "bg-purple-50 text-purple-700"
                            : "text-gray-700"
                        }`,
                      dropdownIndicator: () =>
                        "text-gray-400 hover:text-gray-500",
                      clearIndicator: () => "text-gray-400 hover:text-red-500",
                    }}
                  />
                </div>
                {/* checkboxes */}
                <div></div>
                <div className="my-3 group">
                  <label
                    htmlFor="pain_sensation"
                    className="flex items-center gap-3 cursor-pointer select-none
              px-4 py-3 rounded-lg transition-all duration-200
              hover:bg-blue-50 dark:hover:bg-blue-900/20
              border border-transparent hover:border-blue-100
              dark:hover:border-blue-900/30"
                  >
                    <input
                      id="pain_sensation"
                      type="checkbox"
                      className="w-6 h-6 rounded-lg border-2 border-gray-300 
                text-blue-600 focus:ring-2 focus:ring-blue-500 
                focus:ring-offset-2 cursor-pointer
                dark:border-gray-600 dark:bg-gray-800
                dark:checked:bg-blue-500 dark:checked:border-blue-500
                transition-colors duration-200"
                      checked={neuroExamData.pain_sensation || false}
                      onChange={(e) =>
                        setNeuroExamData({
                          ...neuroExamData,
                          pain_sensation: e.target.checked,
                        })
                      }
                    />
                    <span className="text-base font-semibold text-black hover:text-gray-800 transition-colors duration-200">
                      Pain Sensation
                      <span
                        className="block text-sm font-normal text-gray-500 
                      dark:text-gray-400 mt-1"
                      >
                        Assess response to sharp/dull stimuli
                      </span>
                    </span>

                    {/* Interactive status indicator */}
                    <span
                      className="w-3 h-3 rounded-full bg-blue-200 
                   group-hover:bg-blue-300 ml-auto
                   dark:bg-blue-900/40 
                   dark:group-hover:bg-blue-900/60
                   transition-colors duration-200"
                    ></span>
                  </label>
                </div>

                <div className="my-3 group">
                  <label
                    htmlFor="vibration_sense" // Fixed: Match input id
                    className="flex items-center gap-3 cursor-pointer select-none
              px-3 py-2 rounded-lg transition-all duration-200
              hover:bg-blue-50 dark:hover:bg-blue-900/20
              border border-transparent hover:border-blue-100
              dark:hover:border-blue-900/30"
                  >
                    <input
                      id="vibration_sense"
                      type="checkbox"
                      className="w-6 h-6 rounded-lg border-2 border-gray-300 
                text-blue-600 focus:ring-2 focus:ring-blue-500 
                focus:ring-offset-2 cursor-pointer
                dark:border-gray-600 dark:bg-gray-800
                dark:checked:bg-blue-500 dark:checked:border-blue-500
                transition-colors duration-200"
                      checked={neuroExamData.vibration_sense || false}
                      onChange={(e) =>
                        setNeuroExamData({
                          ...neuroExamData,
                          vibration_sense: e.target.checked,
                        })
                      }
                    />
                    <span className="text-base font-semibold text-black hover:text-gray-800 transition-colors duration-200">
                      Vibration Sensation
                      <span
                        className="block text-xs font-normal text-gray-500 
                      dark:text-gray-400 mt-1"
                      >
                        Test with tuning fork
                      </span>
                    </span>

                    {/* Optional status indicator */}
                    <span
                      className="w-2 h-2 rounded-full bg-blue-200 
                   group-hover:bg-blue-300 ml-2
                   dark:bg-blue-900/40 
                   dark:group-hover:bg-blue-900/60
                   transition-colors duration-200"
                    ></span>
                  </label>
                </div>
                {/* additional check boxes */}

                {/* Proprioception */}
                <div className="my-3 group">
                  <label
                    htmlFor="proprioception"
                    className="flex items-center gap-3 cursor-pointer select-none px-4 py-3 rounded-lg transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30"
                  >
                    <input
                      id="proprioception"
                      type="checkbox"
                      className="w-6 h-6 rounded-lg border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer dark:border-gray-600 dark:bg-gray-800 dark:checked:bg-blue-500 dark:checked:border-blue-500 transition-colors duration-200"
                      checked={neuroExamData.proprioception || false}
                      onChange={(e) =>
                        setNeuroExamData({
                          ...neuroExamData,
                          proprioception: e.target.checked,
                        })
                      }
                    />
                    <span className="text-base font-semibold text-black hover:text-gray-800 transition-colors duration-200">
                      Proprioception
                      <span className="block text-sm font-normal text-gray-500 dark:text-gray-400 mt-1">
                        Joint position sense assessment
                      </span>
                    </span>
                    <span className="w-3 h-3 rounded-full bg-blue-200 group-hover:bg-blue-300 ml-auto dark:bg-blue-900/40 dark:group-hover:bg-blue-900/60 transition-colors duration-200"></span>
                  </label>
                </div>

                {/* Temperature Sensation */}
                <div className="my-3 group">
                  <label
                    htmlFor="temperature_sensation"
                    className="flex items-center gap-3 cursor-pointer select-none px-4 py-3 rounded-lg transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30"
                  >
                    <input
                      id="temperature_sensation"
                      type="checkbox"
                      className="w-6 h-6 rounded-lg border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer dark:border-gray-600 dark:bg-gray-800 dark:checked:bg-blue-500 dark:checked:border-blue-500 transition-colors duration-200"
                      checked={neuroExamData.temperature_sensation || false}
                      onChange={(e) =>
                        setNeuroExamData({
                          ...neuroExamData,
                          temperature_sensation: e.target.checked,
                        })
                      }
                    />
                    <span className="text-base font-semibold text-black hover:text-gray-800 transition-colors duration-200">
                      Temperature Sensation
                      <span className="block text-sm font-normal text-gray-500 dark:text-gray-400 mt-1">
                        Test with warm/cold objects
                      </span>
                    </span>
                    <span className="w-3 h-3 rounded-full bg-blue-200 group-hover:bg-blue-300 ml-auto dark:bg-blue-900/40 dark:group-hover:bg-blue-900/60 transition-colors duration-200"></span>
                  </label>
                </div>

                {/* Brudzinski Sign */}
                <div className="my-3 group">
                  <label
                    htmlFor="brudzinski_sign"
                    className="flex items-center gap-3 cursor-pointer select-none px-4 py-3 rounded-lg transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30"
                  >
                    <input
                      id="brudzinski_sign"
                      type="checkbox"
                      className="w-6 h-6 rounded-lg border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer dark:border-gray-600 dark:bg-gray-800 dark:checked:bg-blue-500 dark:checked:border-blue-500 transition-colors duration-200"
                      checked={neuroExamData.brudzinski_sign || false}
                      onChange={(e) =>
                        setNeuroExamData({
                          ...neuroExamData,
                          brudzinski_sign: e.target.checked,
                        })
                      }
                    />
                    <span className="text-base font-semibold text-black hover:text-gray-800 transition-colors duration-200">
                      Brudzinski Sign
                      <span className="block text-sm font-normal text-gray-500 dark:text-gray-400 mt-1">
                        Neck flexion causing hip flexion
                      </span>
                    </span>
                    <span className="w-3 h-3 rounded-full bg-blue-200 group-hover:bg-blue-300 ml-auto dark:bg-blue-900/40 dark:group-hover:bg-blue-900/60 transition-colors duration-200"></span>
                  </label>
                </div>

                {/* Kernig Sign */}
                <div className="my-3 group">
                  <label
                    htmlFor="kernig_sign"
                    className="flex items-center gap-3 cursor-pointer select-none px-4 py-3 rounded-lg transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30"
                  >
                    <input
                      id="kernig_sign"
                      type="checkbox"
                      className="w-6 h-6 rounded-lg border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer dark:border-gray-600 dark:bg-gray-800 dark:checked:bg-blue-500 dark:checked:border-blue-500 transition-colors duration-200"
                      checked={neuroExamData.kernig_sign || false}
                      onChange={(e) =>
                        setNeuroExamData({
                          ...neuroExamData,
                          kernig_sign: e.target.checked,
                        })
                      }
                    />
                    <span className="text-base font-semibold text-black hover:text-gray-800 transition-colors duration-200">
                      Kernig Sign
                      <span className="block text-sm font-normal text-gray-500 dark:text-gray-400 mt-1">
                        Hip flexion with knee extension resistance
                      </span>
                    </span>
                    <span className="w-3 h-3 rounded-full bg-blue-200 group-hover:bg-blue-300 ml-auto dark:bg-blue-900/40 dark:group-hover:bg-blue-900/60 transition-colors duration-200"></span>
                  </label>
                </div>

                {/* Facial Sensation */}
                <div className="my-3 group">
                  <label
                    htmlFor="facial_sensation"
                    className="flex items-center gap-3 cursor-pointer select-none px-4 py-3 rounded-lg transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30"
                  >
                    <input
                      id="facial_sensation"
                      type="checkbox"
                      className="w-6 h-6 rounded-lg border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer dark:border-gray-600 dark:bg-gray-800 dark:checked:bg-blue-500 dark:checked:border-blue-500 transition-colors duration-200"
                      checked={neuroExamData.facial_sensation || false}
                      onChange={(e) =>
                        setNeuroExamData({
                          ...neuroExamData,
                          facial_sensation: e.target.checked,
                        })
                      }
                    />
                    <span className="text-base font-semibold text-black hover:text-gray-800 transition-colors duration-200">
                      Facial Sensation
                      <span className="block text-sm font-normal text-gray-500 dark:text-gray-400 mt-1">
                        Test all three trigeminal branches
                      </span>
                    </span>
                    <span className="w-3 h-3 rounded-full bg-blue-200 group-hover:bg-blue-300 ml-auto dark:bg-blue-900/40 dark:group-hover:bg-blue-900/60 transition-colors duration-200"></span>
                  </label>
                </div>

                {/* Swallowing Function */}
                <div className="my-3 group">
                  <label
                    htmlFor="swallowing_function"
                    className="flex items-center gap-3 cursor-pointer select-none px-4 py-3 rounded-lg transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30"
                  >
                    <input
                      id="swallowing_function"
                      type="checkbox"
                      className="w-6 h-6 rounded-lg border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer dark:border-gray-600 dark:bg-gray-800 dark:checked:bg-blue-500 dark:checked:border-blue-500 transition-colors duration-200"
                      checked={neuroExamData.swallowing_function || false}
                      onChange={(e) =>
                        setNeuroExamData({
                          ...neuroExamData,
                          swallowing_function: e.target.checked,
                        })
                      }
                    />
                    <span className="text-base font-semibold text-black hover:text-gray-800 transition-colors duration-200">
                      Swallowing Function
                      <span className="block text-sm font-normal text-black dark:text-gray-400 mt-1">
                        Assess cranial nerves IX and X
                      </span>
                    </span>
                    <span className="w-3 h-3 rounded-full bg-blue-200 group-hover:bg-blue-300 ml-auto dark:bg-blue-900/40 dark:group-hover:bg-blue-900/60 transition-colors duration-200"></span>
                  </label>
                </div>
                {/* Diagnosis & Treatment */}
                <div className="md:col-span-4 space-y-4">
                  <h4 className="font-medium text-gray-700 bg-gray-50 p-2 rounded-lg">
                    Clinical Decisions
                  </h4>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Diagnosis *
                    </label>
                    <textarea
                      value={neuroExamData.diagnosis || ""}
                      onChange={(e) =>
                        setNeuroExamData((prev) => ({
                          ...prev,
                          diagnosis: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border-2 border-gray-100 p-3 h-32"
                      required
                    />
                  </div>
                </div>
                {/* Additional Fields */}
                <div className="flex flex-col md:flex-col gap-4 md:col-span-4 w-full">
                  <h4 className="font-semibold text-gray-800 border-l-4 border-purple-500 pl-3 py-1.5">
                    Additional Observations
                  </h4>

                  <div className="flex flex-col md:flex-row gap-4 w-full">
                    <div className="flex-1 space-y-2">
                      <label className="text-sm font-medium text-gray-600 mb-1 block">
                        Gait Analysis
                      </label>
                      <CreatableSelect
                        options={[
                          { value: "Normal Gait", label: "Normal Gait" },
                          {
                            value: "Ataxic Gait",
                            label: "Ataxic Gait (Unsteady, Staggering)",
                          },
                          {
                            value: "Shuffling Gait",
                            label:
                              "Shuffling Gait (Short Steps, Dragging Feet)",
                          },
                          {
                            value: "Hemiplegic Gait",
                            label:
                              "Hemiplegic Gait (One-Sided Weakness, Circumduction)",
                          },
                          {
                            value: "Spastic Gait",
                            label: "Spastic Gait (Stiff, Scissoring Legs)",
                          },
                          {
                            value: "Steppage Gait",
                            label: "Steppage Gait (High Steps, Foot Drop)",
                          },
                          {
                            value: "Waddling Gait",
                            label: "Waddling Gait (Hip Weakness)",
                          },
                        ]}
                        isSearchable
                        isClearable
                        value={
                          [
                            { value: "Normal Gait", label: "Normal Gait" },
                            {
                              value: "Ataxic Gait",
                              label: "Ataxic Gait (Unsteady, Staggering)",
                            },
                            {
                              value: "Shuffling Gait",
                              label:
                                "Shuffling Gait (Short Steps, Dragging Feet)",
                            },
                            {
                              value: "Hemiplegic Gait",
                              label:
                                "Hemiplegic Gait (One-Sided Weakness, Circumduction)",
                            },
                            {
                              value: "Spastic Gait",
                              label: "Spastic Gait (Stiff, Scissoring Legs)",
                            },
                            {
                              value: "Steppage Gait",
                              label: "Steppage Gait (High Steps, Foot Drop)",
                            },
                            {
                              value: "Waddling Gait",
                              label: "Waddling Gait (Hip Weakness)",
                            },
                          ].find(
                            (option) =>
                              option.value === neuroExamData.gait_assessment
                          ) ||
                          (neuroExamData.gait_assessment
                            ? {
                                value: neuroExamData.gait_assessment,
                                label: neuroExamData.gait_assessment,
                              }
                            : null)
                        }
                        onChange={(selectedOption) =>
                          setNeuroExamData((prev) => ({
                            ...prev,
                            gait_assessment: selectedOption
                              ? selectedOption.value
                              : "",
                          }))
                        }
                        onCreateOption={(inputValue) =>
                          setNeuroExamData((prev) => ({
                            ...prev,
                            gait_assessment: inputValue,
                          }))
                        }
                        placeholder="Select or type..."
                        className="w-full text-sm rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-gray-400 transition-colors"
                        classNames={{
                          control: (state) =>
                            `p-2 ${
                              state.isFocused
                                ? "border-purple-500"
                                : "border-gray-300"
                            } bg-white`,
                          input: () => "text-gray-700",
                          placeholder: () => "text-gray-400",
                          menu: () =>
                            "border border-gray-200 rounded-lg shadow-lg mt-1",
                          option: (state) =>
                            `px-4 py-2 ${
                              state.isFocused
                                ? "bg-purple-50 text-purple-700"
                                : "text-gray-700"
                            }`,
                          dropdownIndicator: () =>
                            "text-gray-400 hover:text-gray-500",
                          clearIndicator: () =>
                            "text-gray-400 hover:text-red-500",
                        }}
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <label className="text-sm font-medium text-gray-600 mb-1 block">
                        Pupillary Reaction
                      </label>
                      <CreatableSelect
                        options={[
                          {
                            value: "Normal",
                            label: "Normal (Reactive to Light)",
                          },
                          { value: "Sluggish", label: "Sluggish Reaction" },
                          {
                            value: "Non-Reactive",
                            label: "Non-Reactive Pupils",
                          },
                          {
                            value: "Unequal",
                            label: "Unequal Pupils (Anisocoria)",
                          },
                          {
                            value: "Dilation",
                            label: "Dilated Pupils (Mydriasis)",
                          },
                          {
                            value: "Constriction",
                            label: "Constricted Pupils (Miosis)",
                          },
                        ]}
                        isSearchable
                        isClearable
                        value={
                          [
                            {
                              value: "Normal",
                              label: "Normal (Reactive to Light)",
                            },
                            { value: "Sluggish", label: "Sluggish Reaction" },
                            {
                              value: "Non-Reactive",
                              label: "Non-Reactive Pupils",
                            },
                            {
                              value: "Unequal",
                              label: "Unequal Pupils (Anisocoria)",
                            },
                            {
                              value: "Dilation",
                              label: "Dilated Pupils (Mydriasis)",
                            },
                            {
                              value: "Constriction",
                              label: "Constricted Pupils (Miosis)",
                            },
                          ].find(
                            (option) =>
                              option.value === neuroExamData.pupillary_reaction
                          ) ||
                          (neuroExamData.pupillary_reaction
                            ? {
                                value: neuroExamData.pupillary_reaction,
                                label: neuroExamData.pupillary_reaction,
                              }
                            : null)
                        }
                        onChange={(selectedOption) =>
                          setNeuroExamData((prev) => ({
                            ...prev,
                            pupillary_reaction: selectedOption
                              ? selectedOption.value
                              : "",
                          }))
                        }
                        onCreateOption={(inputValue) =>
                          setNeuroExamData((prev) => ({
                            ...prev,
                            pupillary_reaction: inputValue, // Allows custom text input
                          }))
                        }
                        placeholder="Select or type..."
                        className="w-full text-sm rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-gray-400 transition-colors"
                        classNames={{
                          control: (state) =>
                            `p-2 ${
                              state.isFocused
                                ? "border-purple-500"
                                : "border-gray-300"
                            } bg-white`,
                          input: () => "text-gray-700",
                          placeholder: () => "text-gray-400",
                          menu: () =>
                            "border border-gray-200 rounded-lg shadow-lg mt-1",
                          option: (state) =>
                            `px-4 py-2 ${
                              state.isFocused
                                ? "bg-purple-50 text-purple-700"
                                : "text-gray-700"
                            }`,
                          dropdownIndicator: () =>
                            "text-gray-400 hover:text-gray-500",
                          clearIndicator: () =>
                            "text-gray-400 hover:text-red-500",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* test sections */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-5 border-b border-gray-200 pb-4">
                <div className="bg-orange-900 p-2.5 rounded-lg text-white shadow-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Add Tests
                  </h3>
                  <p className="text-sm text-gray-600">Prescribed Tests</p>
                </div>
              </div>

              <CreatableSelect
                isMulti
                options={tests.map((test) => ({
                  value: test.test_name,
                  label: test.test_name,
                }))}
                value={selectedTests.map((test) => ({
                  value: test,
                  label: test,
                }))}
                onChange={(newTests) =>
                  setSelectedTests(newTests.map((t) => t.value))
                }
                onCreateOption={(newTestName) => {
                  setSelectedTests([...selectedTests, newTestName]);
                }}
                placeholder="Type or select a test..."
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </div>
            {/* Enhanced Medicines Section */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="bg-purple-600 p-2 rounded-lg text-white">
                  💊
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Prescription Management
                </h3>
              </div>
              <div className="space-y-4">
                {selectedMedicines.map((med, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-1 grid grid-cols-6 gap-3">
                      {/* Medicine Selection */}
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-600">
                          Medicine
                        </label>
                        <CreatableSelect
                          isLoading={isCreating}
                          loadingMessage={() => "Creating medicine..."}
                          options={medicines}
                          value={
                            medicines.find(
                              (m) =>
                                m.value ===
                                selectedMedicines[index]?.medicine_id
                            ) || null
                          }
                          onCreateOption={async (inputValue) => {
                            const newId = await handleCreateMedicine(
                              inputValue
                            );
                            if (newId) {
                              setSelectedMedicines((prev) =>
                                prev.map((item, i) =>
                                  i === index
                                    ? { ...item, medicine_id: newId }
                                    : item
                                )
                              );
                            }
                          }}
                          onChange={(selectedOption) => {
                            setSelectedMedicines((prev) =>
                              prev.map((item, i) =>
                                i === index
                                  ? {
                                      ...item,
                                      medicine_id: selectedOption.value,
                                    }
                                  : item
                              )
                            );
                          }}
                          styles={customSelectStyles}
                        />
                      </div>

                      {/* Frequency (Morning, Night) */}
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-600">
                          Frequency
                        </label>
                        <Select
                          options={[
                            { value: "morning", label: "صبح (Morning)" },
                            { value: "afternoon", label: "دوپہر (Afternoon)" },
                            { value: "evening", label: "شام (Evening)" },
                            { value: "night", label: "رات (Night)" },
                            { value: "morning_evening", label: "صبح، شام (Morning & Evening)" },
                            { value: "morning_night", label: "صبح، رات (Morning & Night)" },
                            { value: "afternoon_evening", label: "دوپہر، شام (Afternoon & Evening)" },
                            { value: "afternoon_night", label: "دوپہر، رات (Afternoon & Night)" },
                            { value: "morning_evening_night", label: "صبح، شام، رات (Morning, Evening & Night)" },
                            { value: "morning_afternoon_evening", label: "صبح، دوپہر، شام (Morning, Afternoon & Evening)" },
                            { value: "morning_afternoon_night", label: "صبح، دوپہر، رات (Morning, Afternoon & Night)" },
                            { value: "afternoon_evening_night", label: "دوپہر، شام، رات (Afternoon, Evening & Night)" },
                            { value: "early_morning", label: "صبح سویرے (Early Morning)" },
                            { value: "late_morning", label: "دیر صبح (Late Morning)" },
                            { value: "late_afternoon", label: "دیر دوپہر (Late Afternoon)" },
                            { value: "sunset", label: "غروب آفتاب (Sunset)" },
                            { value: "midnight", label: "آدھی رات (Midnight)" },
                            { value: "late_night", label: "رات دیر گئے (Late Night)" },
                            { value: "morning_afternoon", label: "صبح، دوپہر (Morning & Afternoon)" },
                            { value: "evening_night", label: "شام، رات (Evening & Night)" },
                            { value: "early_morning_night", label: "صبح سویرے، رات (Early Morning & Night)" },
                            { value: "morning_late_afternoon", label: "صبح، دیر دوپہر (Morning & Late Afternoon)" },
                            { value: "afternoon_sunset", label: "دوپہر، غروب آفتاب (Afternoon & Sunset)" },
                            { value: "all_day", label: "پورا دن (All Day)" },
                            { value: "all_night", label: "پوری رات (All Night)" },
                            { value: "24_hours", label: "چوبیس گھنٹے (24 Hours)" }
                          ]}
                          
                          className="react-select-container"
                          classNamePrefix="react-select"
                          defaultValue={{ value: "morning", label: "صبح (Morning)" }}
                          onChange={(e) => {
                            setSelectedMedicines((prev) =>
                              prev.map((item, i) =>
                                i === index
                                  ? {
                                      ...item,
                                      frequency_en: e.value,
                                      frequency_urdu: e.label,
                                    }
                                  : item
                              )
                            );
                          }}
                          styles={customSelectStyles}
                        />
                      </div>

                      {/* Dosage (1 pill, 2 pills) */}
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-600">
                          Dosage
                        </label>
                        <Select
                          options={[
                            // Tablet Dosages (Fractions & Whole)
                            { value: "0.25", label: "ایک چوتھائی گولی (1/4 گولی)" },
                            { value: "0.5", label: "آدھی گولی (1/2 گولی)" },
                            { value: "0.75", label: "تین چوتھائی گولی (3/4 گولی)" },
                            { value: "1", label: "ایک گولی (1 گولی)" },
                            { value: "1.5", label: "ڈیڑھ گولی (1.5 گولی)" },
                            { value: "2", label: "دو گولیاں (2 گولیاں)" },
                            { value: "2.5", label: "ڈھائی گولیاں (2.5 گولیاں)" },
                            { value: "3", label: "تین گولیاں (3 گولیاں)" },
                            { value: "3.5", label: "ساڑھے تین گولیاں (3.5 گولیاں)" },
                            { value: "4", label: "چار گولیاں (4 گولیاں)" },
                            { value: "5", label: "پانچ گولیاں (5 گولیاں)" },
                            { value: "6", label: "چھ گولیاں (6 گولیاں)" },
                            { value: "7", label: "سات گولیاں (7 گولیاں)" },
                            { value: "8", label: "آٹھ گولیاں (8 گولیاں)" },
                            { value: "10", label: "دس گولیاں (10 گولیاں)" },
                          
                            // Spoon Dosages
                            { value: "half_spoon", label: "آدھا چمچ (1/2 چمچ)" },
                            { value: "one_spoon", label: "ایک چمچ (1 چمچ)" },
                            { value: "one_and_half_spoon", label: "ڈیڑھ چمچ (1.5 چمچ)" },
                            { value: "two_spoons", label: "دو چمچ (2 چمچ)" },
                            { value: "three_spoons", label: "تین چمچ (3 چمچ)" },
                          
                            // Liquid Dosages (Milliliters)
                            { value: "2.5_ml", label: "ڈھائی ملی لیٹر (2.5 ml)" },
                            { value: "5_ml", label: "پانچ ملی لیٹر (5 ml)" },
                            { value: "7.5_ml", label: "ساڑھے سات ملی لیٹر (7.5 ml)" },
                            { value: "10_ml", label: "دس ملی لیٹر (10 ml)" },
                            { value: "15_ml", label: "پندرہ ملی لیٹر (15 ml)" },
                            { value: "20_ml", label: "بیس ملی لیٹر (20 ml)" },
                            { value: "25_ml", label: "پچیس ملی لیٹر (25 ml)" },
                            { value: "30_ml", label: "تیس ملی لیٹر (30 ml)" },
                          
                            // Droplet Dosages
                            { value: "one_droplet", label: "ایک قطرہ (1 قطرہ)" },
                            { value: "two_droplets", label: "دو قطرے (2 قطرے)" },
                            { value: "three_droplets", label: "تین قطرے (3 قطرے)" },
                            { value: "five_droplets", label: "پانچ قطرے (5 قطرے)" },
                            { value: "ten_droplets", label: "دس قطرے (10 قطرے)" },
                          
                            // Injection Dosages
                            { value: "half_injection", label: "آدھا ٹیکہ (1/2 ٹیکہ)" },
                            { value: "one_injection", label: "ایک ٹیکہ (1 ٹیکہ)" },
                            { value: "two_injections", label: "دو ٹیکے (2 ٹیکے)" },
                            { value: "three_injections", label: "تین ٹیکے (3 ٹیکے)" },
                          
                            // Sachet Dosages
                            { value: "half_sachet", label: "آدھا ساشے (1/2 ساشے)" },
                            { value: "one_sachet", label: "ایک ساشے (1 ساشے)" },
                            { value: "two_sachets", label: "دو ساشے (2 ساشے)" },
                            { value: "three_sachets", label: "تین ساشے (3 ساشے)" },
                          
                            // Special Cases
                            { value: "as_needed", label: "ضرورت کے مطابق (As Needed)" },
                            { value: "before_meal", label: "کھانے سے پہلے (Before Meal)" },
                            { value: "after_meal", label: "کھانے کے بعد (After Meal)" },
                            { value: "every_6_hours", label: "ہر 6 گھنٹے بعد (Every 6 Hours)" },
                            { value: "every_8_hours", label: "ہر 8 گھنٹے بعد (Every 8 Hours)" },
                            { value: "every_12_hours", label: "ہر 12 گھنٹے بعد (Every 12 Hours)" },
                            { value: "once_a_day", label: "دن میں ایک بار (Once a Day)" },
                            { value: "twice_a_day", label: "دن میں دو بار (Twice a Day)" },
                            { value: "three_times_a_day", label: "دن میں تین بار (Three Times a Day)" },
                            { value: "four_times_a_day", label: "دن میں چار بار (Four Times a Day)" }
                          ]}
                          
                          className="react-select-container"
                          classNamePrefix="react-select"
                          defaultValue={{ value: "1", label: "ایک گولی (1 گولی)" }}
                          onChange={(e) => {
                            setSelectedMedicines((prev) =>
                              prev.map((item, i) =>
                                i === index
                                  ? {
                                      ...item,
                                      dosage_en: e.value,
                                      dosage_urdu: e.label,
                                    }
                                  : item
                              )
                            );
                          }}
                          styles={customSelectStyles}
                        />
                      </div>

                      {/* Duration (1 week, 2 weeks) */}
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-600">
                          Duration
                        </label>
                        <Select
                          options={[
                            // Days (1-30)
                            { value: "1_day", label: "1 دن" },
                            { value: "2_days", label: "2 دن" },
                            { value: "3_days", label: "3 دن" },
                            { value: "4_days", label: "4 دن" },
                            { value: "5_days", label: "5 دن" },
                            { value: "6_days", label: "6 دن" },
                            { value: "7_days", label: "7 دن (1 ہفتہ)" },
                            { value: "8_days", label: "8 دن" },
                            { value: "9_days", label: "9 دن" },
                            { value: "10_days", label: "10 دن" },
                            { value: "11_days", label: "11 دن" },
                            { value: "12_days", label: "12 دن" },
                            { value: "13_days", label: "13 دن" },
                            { value: "14_days", label: "14 دن (2 ہفتے)" },
                            { value: "15_days", label: "15 دن" },
                            { value: "20_days", label: "20 دن" },
                            { value: "25_days", label: "25 دن" },
                            { value: "30_days", label: "30 دن (1 مہینہ)" },
                          
                            // Weeks (1-12)
                            { value: "1_week", label: "1 ہفتہ" },
                            { value: "2_weeks", label: "2 ہفتے" },
                            { value: "3_weeks", label: "3 ہفتے" },
                            { value: "4_weeks", label: "4 ہفتے (1 مہینہ)" },
                            { value: "6_weeks", label: "6 ہفتے" },
                            { value: "8_weeks", label: "8 ہفتے (2 مہینے)" },
                            { value: "10_weeks", label: "10 ہفتے" },
                            { value: "12_weeks", label: "12 ہفتے (3 مہینے)" },
                          
                            // Months (1-12)
                            { value: "1_month", label: "1 مہینہ" },
                            { value: "2_months", label: "2 مہینے" },
                            { value: "3_months", label: "3 مہینے" },
                            { value: "4_months", label: "4 مہینے" },
                            { value: "5_months", label: "5 مہینے" },
                            { value: "6_months", label: "6 مہینے (نصف سال)" },
                            { value: "9_months", label: "9 مہینے" },
                            { value: "12_months", label: "12 مہینے (1 سال)" },
                          
                            // Special Cases
                            { value: "as_needed", label: "ضرورت کے مطابق" },
                            { value: "long_term", label: "طویل مدتی علاج" },
                            { value: "short_term", label: "مختصر مدتی علاج" }
                          ]}
                          
                          className="react-select-container"
                          classNamePrefix="react-select"
                          defaultValue={{ value: "7_days", label: "7 دن (1 ہفتہ)" }}
                          onChange={(e) => {
                            setSelectedMedicines((prev) =>
                              prev.map((item, i) =>
                                i === index
                                  ? {
                                      ...item,
                                      duration_en: e.value,
                                      duration_urdu: e.label,
                                    }
                                  : item
                              )
                            );
                          }}
                          styles={customSelectStyles}
                        />
                      </div>

                      {/* Instruction (After meal, Before meal) */}
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-600">
                          Instruction
                        </label>
                        <Select
                          options={[
                            // Meal-related timings
                            { value: "before_meal", label: "کھانے سے پہلے" },
                            { value: "with_meal", label: "کھانے کے ساتھ" },
                            { value: "after_meal", label: "کھانے کے بعد" },
                            { value: "empty_stomach", label: "خالی پیٹ" },
                            { value: "before_breakfast", label: "ناشتے سے پہلے" },
                            { value: "after_breakfast", label: "ناشتے کے بعد" },
                            { value: "before_lunch", label: "دوپہر کے کھانے سے پہلے" },
                            { value: "after_lunch", label: "دوپہر کے کھانے کے بعد" },
                            { value: "before_dinner", label: "رات کے کھانے سے پہلے" },
                            { value: "after_dinner", label: "رات کے کھانے کے بعد" },
                            { value: "with_milk", label: "دودھ کے ساتھ" },
                            { value: "before_tea", label: "چائے سے پہلے" },
                            { value: "after_tea", label: "چائے کے بعد" },
                          
                            // Special cases
                            { value: "only_if_needed", label: "ضرورت کے مطابق" },
                            { value: "with_water", label: "پانی کے ساتھ" },
                            { value: "with_juice", label: "جوس کے ساتھ" },
                            { value: "with_yogurt", label: "دہی کے ساتھ" },
                            { value: "with_fatty_foods", label: "چکنائی والے کھانے کے ساتھ" },
                            { value: "without_dairy", label: "ڈیری مصنوعات کے بغیر" },
                            { value: "avoid_caffeine", label: "کیفین سے بچیں" }
                          ]}
                          
                          className="react-select-container"
                          classNamePrefix="react-select"
                          defaultValue={{ value: "with_meal", label: "کھانے کے ساتھ" }}
                          onChange={(e) => {
                            setSelectedMedicines((prev) =>
                              prev.map((item, i) =>
                                i === index
                                  ? {
                                      ...item,
                                      instructions_en: e.value,
                                      instructions_urdu: e.label,
                                    }
                                  : item
                              )
                            );
                          }}
                          styles={customSelectStyles}
                        />
                      </div>

                      {/* How to Take (By mouth, Injection) */}
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-600">
                          How to Take
                        </label>
                        <Select
                          options={[
                            // Oral (Mouth)
                            { value: "mouth", label: "منہ کے ذریعے (زبانی)" },
                            { value: "sublingual", label: "زبان کے نیچے" },
                            { value: "buccal", label: "گال کے اندر" },
                          
                            // Injection (Injections)
                            { value: "intravenous", label: "نس میں (IV - Intravenous)" },
                            { value: "intramuscular", label: "پٹھوں میں (IM - Intramuscular)" },
                            { value: "subcutaneous", label: "جلد کے نیچے (SC - Subcutaneous)" },
                            { value: "intradermal", label: "جلد کے اندر (ID - Intradermal)" },
                          
                            // Topical (Skin)
                            { value: "topical", label: "جلد پر لگانے کے لیے (Topical)" },
                            { value: "transdermal", label: "جلد پر چسپاں کرنے کے لیے (Transdermal Patch)" },
                            { value: "ointment", label: "مرہم یا کریم" },
                            { value: "gel", label: "جل" },
                          
                            // Eye (Ophthalmic)
                            { value: "eye_drops", label: "آنکھ میں ڈالنے کے لیے (Eye Drops)" },
                            { value: "eye_ointment", label: "آنکھ کے لیے مرہم (Eye Ointment)" },
                          
                            // Ear (Otic)
                            { value: "ear_drops", label: "کان میں ڈالنے کے لیے (Ear Drops)" },
                          
                            // Nasal (Nose)
                            { value: "nasal_spray", label: "ناک کے ذریعے (Nasal Spray)" },
                            { value: "nasal_drops", label: "ناک میں ڈالنے کے لیے (Nasal Drops)" },
                          
                            // Inhalation (Respiratory)
                            { value: "inhalation", label: "سانس کے ذریعے (Inhalation)" },
                            { value: "nebulizer", label: "نبولائزر کے ذریعے (Nebulizer)" },
                            { value: "inhaler", label: "انہیلر کے ذریعے (Inhaler)" },
                          
                            // Rectal (Anus)
                            { value: "rectal_suppository", label: "مقعد کے ذریعے (Suppository)" },
                            { value: "rectal_cream", label: "مقعد کے لیے کریم" },
                          
                            // Vaginal (Female)
                            { value: "vaginal_suppository", label: "اندام نہانی کے ذریعے (Suppository)" },
                            { value: "vaginal_cream", label: "اندام نہانی کے لیے کریم" },
                            { value: "vaginal_gel", label: "اندام نہانی کے لیے جیل" },
                          
                            // Other Specialized Routes
                            { value: "surgical_implant", label: "جسم میں نصب شدہ (Surgical Implant)" },
                            { value: "infusion", label: "انفیوژن (Intravenous Infusion)" }
                          ]}
                          
                          className="react-select-container"
                          classNamePrefix="react-select"
                          defaultValue={{ value: "mouth", label: "منہ کے ذریعے (زبانی)" }}
                          onChange={(e) => {
                            setSelectedMedicines((prev) =>
                              prev.map((item, i) =>
                                i === index
                                  ? {
                                      ...item,
                                      how_to_take_en: e.value,
                                      how_to_take_urdu: e.label,
                                    }
                                  : item
                              )
                            );
                          }}
                          styles={customSelectStyles}
                        />
                      </div>
                    </div>

                    {/* Remove Medicine */}
                    <button
                      onClick={() => {
                        setSelectedMedicines((prev) =>
                          prev.filter((_, i) => i !== index)
                        );
                      }}
                      className="text-red-500 hover:text-red-700 mt-4"
                    >
                      <AiOutlineCloseCircle className="w-5 h-5" />
                    </button>
                  </div>
                ))}

                {/* Add New Medicine */}
                <button
                  onClick={() =>
                    setSelectedMedicines((prev) => [
                      ...prev,
                      {
                        medicine_id: "",
                        dosage: "",
                        frequency_en: "",
                        frequency_urdu: "",
                        duration_en: "",
                        duration_urdu: "",
                        instructions_en: "",
                        instructions_urdu: "",
                        how_to_take_en: "",
                        how_to_take_urdu: "",
                      },
                    ])
                  }
                  className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-200 text-blue-600 hover:border-blue-400 hover:bg-blue-50/50 p-4 transition-all"
                >
                  <AiOutlinePlus className="w-5 h-5" />
                  Add New Medication
                </button>
              </div>
            </div>

            {/* followup */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="bg-purple-600 text-white p-2 rounded-lg">
                  📅
                </span>
                Follow Up
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Please Select the Date of Followup
                  </label>
                  <select
                    value={selectedDuration}
                    onChange={(e) => {
                      const days = parseInt(e.target.value);
                      const date = new Date();
                      date.setDate(date.getDate() + days);
                      setFollowUpDate(date);
                      setSelectedDuration(days);
                    }}
                    className="w-full rounded-lg border-2 border-gray-100 p-3 urdu-font"
                    required
                  >
                    <option value="">مدت منتخب کریں</option>
                    <option value="10">10 دن بعد (10 Days)</option>
                    <option value="15">15 دن بعد (15 Days)</option>
                    <option value="30">ایک مہینہ بعد (1 Month)</option>
                    <option value="45">ڈیڑھ مہینہ بعد (1.5 Months)</option>
                    <option value="60">دو مہینے بعد (2 Months)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Additional Instructions(Optional)
                  </label>
                  <textarea
                    value={followUpNotes}
                    onChange={(e) => setFollowUpNotes(e.target.value)}
                    className="w-full rounded-lg border-2 border-gray-100 p-3 h-32 urdu-font"
                    placeholder="Write Instruction Here"
                  />
                </div>
              </div>

              {selectedDuration && (
                <div className="mt-4 text-right text-sm text-gray-600 urdu-font">
                  منتخب کردہ تاریخ:{" "}
                  {new Date(followUpDate).toLocaleDateString("ur-PK", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              )}
            </div>
            {/* Enhanced Final Button */}
            <button
              onClick={submitConsultation}
              className={`w-full py-4 bg-gradient-to-r from-green-600 to-teal-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.01] flex items-center justify-center ${
                loading ? "opacity-75 cursor-not-allowed" : ""
              }`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
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
                      d="M4 12a8 8 0 018-8v8H4z"
                    ></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <span className="inline-block mr-2">✅</span>
                  Finalize & Save Consultation
                </>
              )}
            </button>
            <div className="mt-6">
              <button
                onClick={handlePrint}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2 print:hidden"
                aria-label="Print prescription"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Print Prescription
              </button>
            </div>
          </div>
        ) : (
          showAddPatient && (
            <AddPatientForm
              searchedMobile={searchedMobile}
              onSuccess={handleNewPatientAdded}
            />
          )
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default PatientSearch;

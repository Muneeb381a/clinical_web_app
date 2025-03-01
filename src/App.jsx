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

import {
  AiOutlinePlus,
  AiOutlinePrinter,
  AiOutlineDownload,
  AiOutlineCloseCircle,
} from "react-icons/ai";
import AddPatientForm from "./pages/AddPatientForm";
import { urduDate } from "./utils/dateUtils";

// Schema for searching patients by mobile
const searchSchema = z.object({
  mobile: z.string().min(10, "Enter a valid mobile number"),
});

const initialNeuroExamState = {
  motor_function: "",
  muscle_tone: null,
  muscle_strength: null,
  deep_tendon_reflexes: "",
  plantar_reflex: null,
  sensory_examination: "",
  pain_sensation: false,
  vibration_sense: false,
  proprioception: false,
  temperature_sensation: false,
  coordination: "",
  finger_nose_test: "",
  heel_shin_test: "",
  gait_assessment: null,
  romberg_test: "",
  cranial_nerves: "",
  pupillary_reaction: null,
  eye_movements: null,
  facial_sensation: false,
  swallowing_function: false,
  tongue_movement: null,
  straight_leg_raise_test: "",
  lasegue_test: "",
  brudzinski_sign: false,
  kernig_sign: false,
  cognitive_assessment: "",
  speech_assessment: null,
  tremors: "",
  involuntary_movements: "",
  diagnosis: "",
  treatment_plan: "",
  notes: "",
};

const PatientSearch = () => {
  const [patient, setPatient] = useState(null);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [symptoms, setSymptoms] = useState([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [selectedMedicines, setSelectedMedicines] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [consultationData, setConsultationData] = useState(null);
  const [tests, setTests] = useState([]);
  const [selectedTests, setSelectedTests] = useState([]);
  const [customTest, setCustomTest] = useState("");
  const [neuroExamData, setNeuroExamData] = useState(initialNeuroExamState);
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

  // const [vitalSigns, setVitalSigns] = useState({
  //   temperature: "",
  //   bloodPressure: "",
  //   heartRate: "",
  //   respiratoryRate: "",
  //   oxygenSaturation: "",
  //   weight: "",
  // });

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


     const printWindow = window.open("", "_blank");
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
              margin: 25mm 15mm 15mm 15mm;
              color: #2d3748;
              font-size: 10px;
              line-height: 1.1;
            }
  
            .main-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 5mm;
            }
  
            .main-table td {
              vertical-align: top;
              padding: 2px;
            }
  
            .data-table {
              width: 100%;
              border-collapse: collapse;
              margin: 3px 0;
            }
  
            .data-table th, 
            .data-table td {
              border: 1px solid #ddd;
              padding: 3px;
              vertical-align: top;
            }
  
            .data-table th {
              background: #f8f8f8;
              font-weight: 600;
            }
  
            .patient-info-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 4mm;
            }
  
            .patient-info-table td {
              padding: 2px 5px;
            }
  
            .section-title {
              background: #f0f0f0;
              font-weight: 600;
              padding: 3px 5px;
              margin: 5px 0;
            }
  
            .urdu-date {
              font-family: 'Noto Nastaliq Urdu', serif;
              direction: rtl;
              margin-left: 5px;
            }
  
            @media print {
              body {
                margin: 25mm 15mm 15mm 15mm;
              }
            }
          </style>
        </head>
        <body>
          <table class="patient-info-table">
            <tr>
              <td width="33%"><strong>MR#:</strong> ${
                patient?.mr_no || "-"
              }</td>
              <td width="34%"><strong>Name:</strong> ${
                patient?.name || "-"
              }</td>
              <td width="33%"><strong>Age/Sex:</strong> ${
                patient?.age || "-"
              }/${patient?.gender || "-"}</td>
            </tr>
          </table>
  
          <table class="main-table">
            <!-- Medicines -->
            <tr>
              <td>
                <div class="section-title">PRESCRIPTION</div>
                <table class="data-table">
                  <thead>
                    <tr>
                      <th width="30%">Medicine</th>
                      <th width="15%">Dosage</th>
                      <th width="15%">Frequency</th>
                      <th width="15%">Duration</th>
                      <th width="25%">Instructions</th>
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
                          <td>${med.dosage || "-"}</td>
                          <td>${med.frequency_urdu || "-"}</td>
                          <td>${med.duration_urdu || "-"}</td>
                          <td>${med.instructions_urdu || "-"}</td>
                        </tr>
                      `;
                      })
                      .join("")}
                  </tbody>
                </table>
              </td>
            </tr>
  
            <!-- Tests -->
            <tr>
              <td>
                <div class="section-title">RECOMMENDED TESTS</div>
                <table class="data-table">
                  <tbody>
                    ${selectedTests
                      .map(
                        (test) => `
                      <tr>
                        <td>• ${test}</td>
                      </tr>
                    `
                      )
                      .join("")}
                  </tbody>
                </table>
              </td>
            </tr>
  
            <!-- Examination -->
            <tr>
              <td>
                <div class="section-title">EXAMINATION FINDINGS</div>
                <table class="data-table">
                  <tbody>
                    <tr>
                      <td width="50%"><strong>Muscle Tone:</strong> ${
                        neuroExamData.muscle_tone || "-"
                      }</td>
                      <td><strong>Reflexes:</strong> ${
                        neuroExamData.deep_tendon_reflexes || "-"
                      }</td>
                    </tr>
                    <tr>
                      <td><strong>Gait:</strong> ${
                        neuroExamData.gait_assessment || "-"
                      }</td>
                      <td><strong>Pupils:</strong> ${
                        neuroExamData.pupillary_reaction || "-"
                      }</td>
                    </tr>
                    <tr>
                      <td><strong>Romberg:</strong> ${
                        neuroExamData.romberg_test || "-"
                      }</td>
                      <td><strong>Sensation:</strong> ${
                        neuroExamData.pain_sensation ? "✓" : "✗"
                      }</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
  
            <!-- Follow-up -->
            ${
              followUpDate
                ? `
              <tr>
                <td>
                  <div class="section-title">FOLLOW UP</div>
                  <table class="data-table">
                    <tr>
                      <td width="30%"><strong>Date:</strong> ${new Date(
                        followUpDate
                      ).toLocaleDateString()}</td>
                      <td><span class="urdu-date">${urduDate(
                        followUpDate
                      )}</span></td>
                      <td width="50%"><strong>Notes:</strong> ${
                        followUpNotes || "-"
                      }</td>
                    </tr>
                  </table>
                </td>
              </tr>
            `
                : ""
            }
          </table>
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
        setPatient(res.data.data);
        setShowAddPatient(false);
      } else {
        setPatient(null);
        setSearchedMobile(mobile);
        setShowAddPatient(true);
      }
    } catch (error) {
      console.error("Error fetching patient", error);
      setPatient(null);
      setShowAddPatient(false);
      alert("Failed to fetch patient. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };
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
            dosage: med.dosage,
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

      // Step 6: Submit neurological examination with proper sanitization
      const neuroExamPayload = {
        consultation_id: consultationId,
        motor_function: neuroExamData.motor_function || null,
        muscle_tone: neuroExamData.muscle_tone,
        muscle_strength: neuroExamData.muscle_strength,
        deep_tendon_reflexes: neuroExamData.deep_tendon_reflexes || null,
        plantar_reflex: neuroExamData.plantar_reflex,
        sensory_examination: neuroExamData.sensory_examination || null,
        pain_sensation: neuroExamData.pain_sensation,
        vibration_sense: neuroExamData.vibration_sense,
        proprioception: neuroExamData.proprioception,
        temperature_sensation: neuroExamData.temperature_sensation,
        coordination: neuroExamData.coordination || null,
        finger_nose_test: neuroExamData.finger_nose_test || null,
        heel_shin_test: neuroExamData.heel_shin_test || null,
        gait_assessment: neuroExamData.gait_assessment,
        romberg_test: neuroExamData.romberg_test || null,
        cranial_nerves: neuroExamData.cranial_nerves || null,
        pupillary_reaction: neuroExamData.pupillary_reaction,
        eye_movements: neuroExamData.eye_movements,
        facial_sensation: neuroExamData.facial_sensation,
        swallowing_function: neuroExamData.swallowing_function,
        tongue_movement: neuroExamData.tongue_movement,
        straight_leg_raise_test: neuroExamData.straight_leg_raise_test || null,
        lasegue_test: neuroExamData.lasegue_test || null,
        brudzinski_sign: neuroExamData.brudzinski_sign,
        kernig_sign: neuroExamData.kernig_sign,
        cognitive_assessment: neuroExamData.cognitive_assessment || null,
        speech_assessment: neuroExamData.speech_assessment,
        tremors: neuroExamData.tremors || null,
        involuntary_movements: neuroExamData.involuntary_movements || null,
        diagnosis: neuroExamData.diagnosis,
        treatment_plan: neuroExamData.treatment_plan,
        notes: neuroExamData.notes || null,
      };

      await axios.post(
        "https://patient-management-backend-nine.vercel.app/api/examination",
        neuroExamPayload
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-8 relative overflow-hidden isolate before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.9),_transparent)] before:opacity-50 before:-z-10">
      <div className="mx-auto max-w-2xl rounded-2xl border border-white/30 bg-white/95 backdrop-blur-sm p-8 shadow-2xl shadow-gray-100/30">
        <h2 className="mb-6 border-b border-gray-200 pb-4 text-2xl font-bold text-gray-900">
          <span className="bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">
            Patient Consultation Portal
          </span>
        </h2>
        {/* Enhanced Search Section */}
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
                Mobile Number
                <span className="text-red-500">*</span>
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
                      <span className="animate-spin">🌀</span>
                      Searching...
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
        {patient ? (
          <div className="space-y-8" id="consultation-content">
            {/* Enhanced Patient Details */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-5 border-b border-gray-200 pb-4">
                <div className="bg-green-700 p-2.5 rounded-lg text-white shadow-sm">
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    ></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Patient Demographics
                  </h3>
                  <p className="text-sm text-gray-600">
                    Core patient information and medical history
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Mr-No", value: patient.mr_no, icon: "user" },
                  { label: "Full Name", value: patient.name, icon: "user" },
                  { label: "Age", value: patient.age, icon: "calendar" },
                  { label: "Gender", value: patient.gender, icon: "gender" },
                  {
                    label: "Weight",
                    value: `${patient.weight} kg`,
                    icon: "weight",
                  },
                  {
                    label: "Height",
                    value: `${patient.height} cm`,
                    icon: "height",
                  },
                  {
                    label: "Last Visit",
                    value: patient.checkup_date || "N/A",
                    icon: "clock",
                  },
                ].map((field) => (
                  <div key={field.label} className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-500">
                        {/* Icon path */}
                      </svg>
                      {field.label}
                    </label>
                    <div className="rounded-lg bg-gray-50 p-3 font-medium text-gray-800 border border-gray-200">
                      {field.value || "-"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* presciption details */}
      <div className="border border-red-500 rounded-xl p-4">
              {/* Button to fetch and show prescriptions */}
              {patient && (
                <button
                  onClick={() => {
                    fetchPrescriptions(patient.id);
                  }}
                  className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 shadow-md hover:shadow-lg font-medium focus:outline-none focus:ring-4 focus:ring-blue-300"
                >
                  View Previous Prescriptions
                </button>
              )}

              {/* Conditional rendering of the popup */}
              {showPopup && (
                <div className="fixed inset-0  backdrop-blur-sm flex items-start justify-center p-4 pt-20 transition-all">
                  <div className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full border border-gray-200 transform transition-all">
                    <h2 className="text-xl font-bold mb-4 text-gray-700 text-center border-b pb-2">
                      📋 Previous Prescriptions
                    </h2>

                    {/* Prescription list */}
                    {prescriptions.length > 0 ? (
                      <ul className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                        {prescriptions.map((prescription) => (
                          <li
                            key={prescription.id}
                            className="bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                          >
                            <div className="space-y-2">
                              <p className="text-gray-700 text-sm">
                                <span className="font-medium">Medicine:</span>{" "}
                                <span className="text-blue-600">
                                  {prescription.brand_name}
                                </span>{" "}
                                (
                                <span className="text-gray-600">
                                  {prescription.urdu_name}
                                </span>
                                )
                              </p>
                              <p className="text-gray-600 text-sm">
                                <span className="font-medium">Dosage:</span>{" "}
                                {prescription.dosage}
                              </p>
                              <p className="text-gray-600 text-sm">
                                <span className="font-medium">Frequency:</span>{" "}
                                {prescription.frequency_en} (
                                {prescription.frequency_urdu})
                              </p>
                              <p className="text-gray-600 text-sm">
                                <span className="font-medium">Duration:</span>{" "}
                                {prescription.duration_en} (
                                {prescription.duration_urdu})
                              </p>
                              <p className="text-gray-600 text-sm">
                                <span className="font-medium">
                                  Instructions:
                                </span>{" "}
                                {prescription.instructions_en} (
                                {prescription.instructions_urdu})
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 text-center py-4 italic text-sm">
                        No previous prescriptions found.
                      </p>
                    )}

                    {/* Close button */}
                    <button
                      onClick={() => setShowPopup(false)}
                      className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 w-auto mx-auto block text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-300"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
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
            {/* Neurological Examination Section */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="mb-5 text-lg font-bold text-gray-800 flex items-center gap-2">
                <span className="bg-purple-600 text-white p-2 rounded-lg">
                  🧠
                </span>
                Neurological Examination
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Motor Section */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700 bg-gray-50 p-2 rounded-lg">
                    Motor Function
                  </h4>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Motor Function
                    </label>
                    <input
                      value={neuroExamData.motor_function}
                      onChange={(e) =>
                        setNeuroExamData((p) => ({
                          ...p,
                          motor_function: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border-2 border-gray-100 p-3"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Muscle Tone
                    </label>
                    <select
                      value={neuroExamData.muscle_tone || ""}
                      onChange={(e) =>
                        setNeuroExamData((p) => ({
                          ...p,
                          muscle_tone: e.target.value || null,
                        }))
                      }
                      className="w-full rounded-lg border-2 border-gray-100 p-3"
                    >
                      <option value="">Select Muscle Tone</option>
                      <option value="Normal">Normal</option>
                      <option value="Hypotonic">Hypotonic</option>
                      <option value="Hypertonic">Hypertonic</option>
                      <option value="Rigidity">Rigidity</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Muscle Strength (MRC Scale)
                    </label>
                    <select
                      value={neuroExamData.muscle_strength || ""}
                      onChange={(e) =>
                        setNeuroExamData((p) => ({
                          ...p,
                          muscle_strength: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border-2 border-gray-100 p-3"
                    >
                      <option value="">Select Strength</option>
                      <option value="0/5">0/5 - No contraction</option>
                      <option value="1/5">1/5 - Trace contraction</option>
                      <option value="2/5">
                        2/5 - Active movement (gravity eliminated)
                      </option>
                      <option value="3/5">3/5 - Against gravity</option>
                      <option value="4/5">4/5 - Against resistance</option>
                      <option value="5/5">5/5 - Normal</option>
                    </select>
                  </div>
                </div>

                {/* Reflexes Section */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700 bg-gray-50 p-2 rounded-lg">
                    Reflexes
                  </h4>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Deep Tendon Reflexes
                    </label>
                    <input
                      value={neuroExamData.deep_tendon_reflexes}
                      onChange={(e) =>
                        setNeuroExamData((p) => ({
                          ...p,
                          deep_tendon_reflexes: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border-2 border-gray-100 p-3"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Plantar Reflex
                    </label>
                    <select
                      value={neuroExamData.plantar_reflex || ""}
                      onChange={(e) =>
                        setNeuroExamData((p) => ({
                          ...p,
                          plantar_reflex: e.target.value || null,
                        }))
                      }
                      className="w-full rounded-lg border-2 border-gray-100 p-3"
                    >
                      <option value="">Select Response</option>
                      <option value="Flexor">Flexor</option>
                      <option value="Extensor">Extensor</option>
                    </select>
                  </div>
                </div>

                {/* Sensory Section */}
                <div className="md:col-span-2 space-y-4">
                  <h4 className="font-medium text-gray-700 bg-gray-50 p-2 rounded-lg">
                    Sensory
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Checkbox inputs remain the same */}
                  </div>
                </div>

                {/* Cranial Nerves Section */}
                <div className="md:col-span-2 space-y-4">
                  <h4 className="font-medium text-gray-700 bg-gray-50 p-2 rounded-lg">
                    Cranial Nerves
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Pupillary Reaction
                      </label>
                      <select
                        value={neuroExamData.pupillary_reaction || ""}
                        onChange={(e) =>
                          setNeuroExamData((p) => ({
                            ...p,
                            pupillary_reaction: e.target.value || null,
                          }))
                        }
                        className="w-full rounded-lg border-2 border-gray-100 p-3"
                      >
                        <option value="">Select Reaction</option>
                        <option value="Brisk">Brisk</option>
                        <option value="Sluggish">Sluggish</option>
                        <option value="Non-reactive">Non-reactive</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Speech Assessment
                      </label>
                      <select
                        value={neuroExamData.speech_assessment || ""}
                        onChange={(e) =>
                          setNeuroExamData((p) => ({
                            ...p,
                            speech_assessment: e.target.value || null,
                          }))
                        }
                        className="w-full rounded-lg border-2 border-gray-100 p-3"
                      >
                        <option value="">Select Speech</option>
                        <option value="Normal">Normal</option>
                        <option value="Dysarthric">Dysarthric</option>
                        <option value="Aphasic">Aphasic</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Diagnosis & Treatment */}
                <div className="md:col-span-2 space-y-4">
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

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Treatment Plan *
                    </label>
                    <textarea
                      value={neuroExamData.treatment_plan || ""}
                      onChange={(e) =>
                        setNeuroExamData((prev) => ({
                          ...prev,
                          treatment_plan: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border-2 border-gray-100 p-3 h-32"
                      required
                    />
                  </div>
                </div>
              </div>
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
                    <div className="flex-1 grid grid-cols-3 gap-3">
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
                            { value: "morning", label: "صبح" },
                            { value: "noon", label: "دوپہر" },
                            { value: "evening", label: "شام" },
                            { value: "night", label: "رات" },
                            { value: "as_needed", label: "ضرورت کے مطابق" },
                          ]}
                          className="react-select-container"
                          classNamePrefix="react-select"
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
                            { value: "1", label: "1 گولی" },
                            { value: "2", label: "2 گولیاں" },
                            { value: "3", label: "3 گولیاں" },
                            { value: "4", label: "4 گولیاں" },
                            { value: "5", label: "5 گولیاں" },
                            { value: "6", label: "6 گولیاں" },
                            { value: "7", label: "7 گولیاں" },
                            { value: "8", label: "8 گولیاں" },
                            { value: "9", label: "9 گولیاں" },
                            { value: "10", label: "10 گولیاں" },
                          ]}
                          className="react-select-container"
                          classNamePrefix="react-select"
                          onChange={(e) => {
                            setSelectedMedicines((prev) =>
                              prev.map((item, i) =>
                                i === index
                                  ? { ...item, dosage: e.value }
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
                            { value: "1_day", label: "1 دن" },
                            { value: "2_days", label: "2 دن" },
                            { value: "3_days", label: "3 دن" },
                            { value: "4_days", label: "4 دن" },
                            { value: "5_days", label: "5 دن" },
                            { value: "6_days", label: "6 دن" },
                            { value: "1_week", label: "1 ہفتہ" },
                            { value: "2_weeks", label: "2 ہفتے" },
                            { value: "3_weeks", label: "3 ہفتے" },
                            { value: "1_month", label: "1 مہینہ" },
                            { value: "2_months", label: "2 مہینے" },
                            { value: "3_months", label: "3 مہینے" },
                          ]}
                          className="react-select-container"
                          classNamePrefix="react-select"
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
                            { value: "after_meal", label: "کھانے کے بعد" },
                            { value: "before_meal", label: "کھانے سے پہلے" },
                            { value: "before_sleep", label: "سونے سے پہلے" },
                            { value: "after_waking", label: "جاگنے کے بعد" },
                          ]}
                          className="react-select-container"
                          classNamePrefix="react-select"
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
                            { value: "mouth", label: "منہ کے ذریعے" },
                            { value: "injection", label: "انجیکشن" },
                            { value: "topical", label: "جلد پر لگانے کی دوا" },
                            {
                              value: "sublingual",
                              label: "زبان کے نیچے رکھنے والی دوا",
                            },
                            { value: "inhalation", label: "سانس کے ذریعے" },
                            { value: "nasal", label: "ناک میں ڈالنے کی دوا" },
                            {
                              value: "eye_drops",
                              label: "آنکھوں میں ڈالنے کی دوا",
                            },
                            {
                              value: "ear_drops",
                              label: "کان میں ڈالنے کی دوا",
                            },
                            {
                              value: "rectal",
                              label: "مقعد کے ذریعے (سپوزٹری)",
                            },
                            { value: "vaginal", label: "اندام نہانی کے ذریعے" },
                            {
                              value: "intravenous",
                              label: "ورید کے ذریعے (IV)",
                            },
                            {
                              value: "intramuscular",
                              label: "پٹھوں میں انجیکشن",
                            },
                            {
                              value: "subcutaneous",
                              label: "جلد کے نیچے انجیکشن",
                            },
                            {
                              value: "buccal",
                              label: "گال کے اندر جذب ہونے والی دوا",
                            },
                            {
                              value: "transdermal",
                              label: "جلد پر لگانے والا پیچ",
                            },
                          ]}
                          className="react-select-container"
                          classNamePrefix="react-select"
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

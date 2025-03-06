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
} from "react-icons/ai";
import AddPatientForm from "./pages/AddPatientForm";
import { urduDate } from "./utils/dateUtils";

// Schema for searching patients by mobile
const searchSchema = z.object({
  mobile: z.string().min(10, "Enter a valid mobile number"),
});

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

      await axios.post(
        "https://patient-management-backend-nine.vercel.app/api/examination",
        {
          consultation_id: consultationId,
          patient_id: patient.id,
          motor_function: neuroExamData.motor_function || "",
          muscle_tone: neuroExamData.muscle_tone || "",
          muscle_strength: neuroExamData.muscle_strength || "",
          straight_leg_raise_test: neuroExamData.straight_leg_raise_test || "",
          deep_tendon_reflexes: neuroExamData.deep_tendon_reflexes || "",
          plantar_reflex: neuroExamData.plantar_reflex || "",
          pupillary_reaction: neuroExamData.pupillary_reaction || "",
          speech_assessment: neuroExamData.speech_assessment || "",
          gait: neuroExamData.gait || "",
          coordination: neuroExamData.coordination || "",
          sensory_function: neuroExamData.sensory_function || "",
          cranial_nerves: neuroExamData.cranial_nerves || "",
          mental_status: neuroExamData.mental_status || "",
          cerebellar_function: neuroExamData.cerebellar_function || "",
          muscle_wasting: neuroExamData.muscle_wasting || "",
          abnormal_movements: neuroExamData.abnormal_movements || "",
          romberg_test: neuroExamData.romberg_test || "",
          nystagmus: neuroExamData.nystagmus || "",
          fundoscopy: neuroExamData.fundoscopy || "",
          diagnosis: neuroExamData.diagnosis || "",
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
                <div className="fixed inset-0 bg-black/30 backdrop-blur-md z-50 overflow-y-auto">
                  <div className="min-h-screen flex items-start justify-center p-4 pt-20 pb-8">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-4xl mx-auto border border-gray-200">
                      <div className="flex justify-between items-center mb-4 pb-2 border-b">
                        <h2 className="text-2xl font-bold text-gray-800">
                          📋 Previous Prescriptions
                        </h2>
                        <button
                          onClick={() => setShowPopup(false)}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 text-gray-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>

                      {/* Prescription list */}
                      {prescriptions.length > 0 ? (
                        <div className="space-y-4">
                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {prescriptions.map((prescription) => (
                              <div
                                key={prescription.id}
                                className="bg-gray-50 p-4 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200"
                              >
                                <div className="space-y-2">
                                  <h3 className="text-lg font-medium text-gray-800">
                                    {prescription.brand_name}
                                    <span className="block text-sm text-gray-500">
                                      {prescription.urdu_name}
                                    </span>
                                  </h3>
                                  <div className="space-y-1 text-sm">
                                    <p className="text-gray-600">
                                      <span className="font-medium">
                                        Dosage:
                                      </span>{" "}
                                      {prescription.dosage}
                                    </p>
                                    <p className="text-gray-600">
                                      <span className="font-medium">
                                        Frequency:
                                      </span>{" "}
                                      {prescription.frequency_en}
                                      <span className="text-gray-500">
                                        {" "}
                                        ({prescription.frequency_urdu})
                                      </span>
                                    </p>
                                    <p className="text-gray-600">
                                      <span className="font-medium">
                                        Duration:
                                      </span>{" "}
                                      {prescription.duration_en}
                                      <span className="text-gray-500">
                                        {" "}
                                        ({prescription.duration_urdu})
                                      </span>
                                    </p>
                                    <p className="text-gray-600">
                                      <span className="font-medium">
                                        Instructions:
                                      </span>{" "}
                                      {prescription.instructions_en}
                                      <span className="text-gray-500">
                                        {" "}
                                        ({prescription.instructions_urdu})
                                      </span>
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500 italic">
                            No previous prescriptions found.
                          </p>
                        </div>
                      )}

                      {/* Sticky Close Button for mobile */}
                      <div className="sticky bottom-0 bg-white pt-4 border-t mt-6 md:hidden">
                        <button
                          onClick={() => setShowPopup(false)}
                          className="w-full py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          Close
                        </button>
                      </div>
                    </div>
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
                  <h4 className="font-semibold text-gray-800 border-l-4 border-purple-500 pl-3 py-1.5">
                    Motor Function
                  </h4>
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
                  <h4 className="font-semibold text-gray-800 border-l-4 border-purple-500 pl-3 py-1.5">
                    Reflexes
                  </h4>
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
                        neuroExamData.muscle_strenght
                          ? {
                              value: neuroExamData.muscle_strenght,
                              label: neuroExamData.muscle_strenght,
                            }
                          : null
                      }
                      onChange={(selectedOption) =>
                        setNeuroExamData((prev) => ({
                          ...prev,
                          muscle_strenght: selectedOption
                            ? selectedOption.value
                            : "",
                        }))
                      }
                      onCreateOption={(inputValue) =>
                        setNeuroExamData((prev) => ({
                          ...prev,
                          muscle_strenght: inputValue, // Allows custom text input
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
                      ]}
                      isSearchable
                      isClearable
                      value={
                        neuroExamData.slr_test
                          ? {
                              value: neuroExamData.slr_test,
                              label: neuroExamData.slr_test_label,
                            }
                          : null
                      }
                      onChange={(selectedOption) =>
                        setNeuroExamData((prev) => ({
                          ...prev,
                          slr_test: selectedOption ? selectedOption.value : "",
                          slr_test_label: selectedOption
                            ? selectedOption.label
                            : "", // Stores the icon version
                        }))
                      }
                      onCreateOption={(inputValue) =>
                        setNeuroExamData((prev) => ({
                          ...prev,
                          slr_test: inputValue,
                          slr_test_label: inputValue, // Custom input preserves text
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

                {/* Additional Fields */}
                <div className="space-y-4 md:col-span-2">
                  <h4 className="font-semibold text-gray-800 border-l-4 border-purple-500 pl-3 py-1.5">
                    Additional Observations
                  </h4>
                  <div className="space-y-2">
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
                          label: "Shuffling Gait (Short Steps, Dragging Feet)",
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
                            option.value === neuroExamData.gait_analysis
                        ) ||
                        (neuroExamData.gait_analysis
                          ? {
                              value: neuroExamData.gait_analysis,
                              label: neuroExamData.gait_analysis,
                            }
                          : null)
                      }
                      onChange={(selectedOption) =>
                        setNeuroExamData((prev) => ({
                          ...prev,
                          gait_analysis: selectedOption
                            ? selectedOption.value
                            : "",
                        }))
                      }
                      onCreateOption={(inputValue) =>
                        setNeuroExamData((prev) => ({
                          ...prev,
                          gait_analysis: inputValue, // Allows custom text input
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
                      Pupillary Reaction
                    </label>
                    <CreatableSelect
                      options={[
                        {
                          value: "Normal",
                          label: "Normal (Reactive to Light)",
                        },
                        { value: "Sluggish", label: "Sluggish Reaction" },
                        { value: "Non-Reactive", label: "Non-Reactive Pupils" },
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
                            { value: "morning", label: "صبح (Morning)" },
                            { value: "noon", label: "دوپہر (Noon)" },
                            { value: "evening", label: "شام (Evening)" },
                            { value: "night", label: "رات (Night)" },
                            { value: "morning_noon", label: "صبح اور دوپہر (Morning & Noon)" },
                            { value: "morning_evening", label: "صبح اور شام (Morning & Evening)" },
                            { value: "noon_evening", label: "دوپہر اور شام (Noon & Evening)" },
                            { value: "evening_night", label: "شام اور رات (Evening & Night)" },
                            { value: "morning_noon_evening", label: "صبح، دوپہر، شام (Morning, Noon, Evening)" },
                            { value: "noon_evening_night", label: "دوپہر، شام، رات (Noon, Evening, Night)" },
                            { value: "all_day", label: "صبح، دوپہر، شام، رات (All Day)" },
                            { value: "as_needed", label: "ضرورت کے مطابق (As Needed)" }
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
                            { value: "0.25", label: "ایک چوتھائی گولی (1/4 گولی)" },
                            { value: "0.5", label: "آدھی گولی (1/2 گولی)" },
                            { value: "0.75", label: "تین چوتھائی گولی (3/4 گولی)" },
                            { value: "1", label: "1 گولی" },
                            { value: "1.25", label: "سوا گولی (1 1/4 گولی)" },
                            { value: "1.5", label: "ڈیڑھ گولی (1 1/2 گولی)" },
                            { value: "1.75", label: "پونے دو گولی (1 3/4 گولی)" },
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

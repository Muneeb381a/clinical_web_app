import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { toast } from 'react-toastify';

import {
  AiOutlinePlus,
  AiOutlinePrinter,
  AiOutlineDownload,
  AiOutlineCloseCircle,
} from "react-icons/ai";
import AddPatientForm from "./pages/AddPatientForm";

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
  const [selectedTests, setSelectedTests] = useState([]);
  const [customTest, setCustomTest] = useState("");

  const [patients, setPatients] = useState([]);
  const [searchedMobile, setSearchedMobile] = useState("");

  const handleNewPatient = (newPatient) => {
    setPatients([...patients, newPatient]); // Update patient list
  };

  const [vitalSigns, setVitalSigns] = useState({
    temperature: "",
    bloodPressure: "",
    heartRate: "",
    respiratoryRate: "",
    oxygenSaturation: "",
    weight: "",
  });

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
    printWindow.document.write(`
      <html>
        <head>
          <title>Consultation Print - ${
            patient?.name || "Unknown Patient"
          }</title>
          <style>
            :root {
              --primary: #1a365d;
              --secondary: #2b6cb0;
              --border-color: #e2e8f0;
              --text-muted: #718096;
            }

            body {
              font-family: 'Inter', sans-serif;
              padding: 25px 35px 100px;
              color: #2d3748;
              font-size: 13.5px;
              line-height: 1.4;
            }

            .header {
              text-align: center;
              margin-bottom: 1.5rem;
              padding-bottom: 1rem;
              border-bottom: 2px solid var(--primary);
            }

            .patient-info {
              display: flex;
              gap: 1.5rem;
              flex-wrap: wrap;
              margin: 1rem 0;
              font-weight: 600;
              color: var(--primary);
            }

            .patient-detail {
              display: flex;
              gap: 0.5rem;
              align-items: center;
            }

            .patient-detail span:first-child {
              color: var(--text-muted);
              font-weight: 500;
            }

            .section {
              background: white;
              border: 1px solid var(--border-color);
              border-radius: 6px;
              padding: 1rem;
              margin: 0.75rem 0;
              box-shadow: 0 1px 2px rgba(0,0,0,0.04);
            }

            .section-title {
              font-size: 15px;
              font-weight: 600;
              color: var(--primary);
              margin: 0 0 1rem 0;
              border-bottom: 2px solid var(--border-color);
              padding-bottom: 0.5rem;
            }

            .columns-container {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 1.5rem;
              margin-bottom: 1.5rem;
            }

            .data-row {
              display: flex;
              justify-content: space-between;
              padding: 0.5rem 0;
            }

            .data-label {
              font-weight: 600;
              color: var(--primary);
              min-width: 120px;
            }

            .med-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 0.5rem;
            }

            .med-table th {
              background: #f7fafc;
              color: var(--primary);
              font-weight: 600;
              padding: 0.75rem;
              text-align: left;
              border-bottom: 2px solid var(--border-color);
            }

            .med-table td {
              padding: 0.75rem;
              border-bottom: 1px solid var(--border-color;
            }

            .med-name {
              font-weight: 700;
              color: var(--primary);
            }

            .tests-list {
              columns: 2;
              margin: 0;
              padding: 0;
              list-style: none;
            }

            .tests-list li {
              padding: 0.25rem 0;
              break-inside: avoid;
              font-weight: 500;
            }

            .footer {
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              padding: 1rem 35px;
              background: white;
              border-top: 2px solid var(--border-color);
              font-size: 12px;
              color: var(--text-muted);
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin:0 0 4px 0; font-size:22px; color:var(--primary);">AYYUB LABS & CLINICS</h1>
            <div style="color:var(--text-muted); font-size:13px;">
              <div>Mega Hospital Second Floor Mall Road Saddar Rawalpindi Cantt.</div>
              <div>Ph: 0334-5616185</div>
            </div>
          </div>

          <!-- Compact Patient Details -->
          <div class="patient-info">
            <div class="patient-detail">
              <span>MR#:</span>
              <span>${patient?.mr_no || "-"}</span>
            </div>
            <div class="patient-detail">
              <span>Name:</span>
              <span>${patient?.name || "-"}</span>
            </div>
            <div class="patient-detail">
              <span>Age/Gender:</span>
              <span>${patient?.age || "-"}/${patient?.gender || "-"}</span>
            </div>
            <div class="patient-detail">
              <span>Date:</span>
              <span>${patient?.checkup_date || "-"}</span>
            </div>
          </div>

          <!-- Tests & Vitals Columns -->
          <div class="columns-container">
            <!-- Tests Column -->
            <div class="section">
              <h3 class="section-title">Recommended Tests</h3>
              <ul class="tests-list">
                ${selectedTests.map((test) => `<li>• ${test}</li>`).join("")}
              </ul>
            </div>

            <!-- Vitals Column -->
            <div class="section">
              <h3 class="section-title">Vital Signs</h3>
              <div class="patient-info vital-signs">
                ${Object.entries(vitalSigns)
                  .map(
                    ([key, value]) => `
                  <div class="patient-detail">
                    <span>${key}:</span>
                    <span>${value || "-"}</span>
                  </div>
                `
                  )
                  .join("")}
              </div>
            </div>
          </div>

          <!-- Medicines Section -->
          <div class="section">
          <h3 class="section-title">Medical Prescriptions</h3>
          <table class="med-table">
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Frequency</th>
                <th>Dosage</th>
                <th>Duration</th>
                <th>Instructions</th>
                <th>How to take</th>
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
                      <td class="med-name">${medicineData?.label || "-"}</td>
                      <td>${med.frequency_urdu || "-"}</td>
                      <td>${med.dosage || "-"}</td>
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

          <div class="footer">
            <div style="text-align:center; margin-bottom:4px;">
              <strong>Dr. Abdul Rauf</strong> | 
              BABAS.NCI MSCE (UK), DCH London SEC Neurology (UK)
            </div>
            <div style="text-align:center;">
              E-mail: rauf.khan5@gmail.com | Date: ${new Date().toLocaleDateString()} | Prescription #: ${
      patient?.mr_no || "N/A"
    }
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const generatePDF = async () => {
    if (!patient) {
      alert("No patient data available");
      return;
    }

    setIsGeneratingPDF(true);
    try {
      const doc = new jsPDF();

      // Add clinic header
      doc.setFontSize(16);
      doc.text("Specialist Clinics, Lab and Imaging Services", 15, 15);
      doc.setFontSize(10);
      doc.text(
        "G.T Road, Gujar Khan. Ph: 051-3513287, 0315-3513287, 0322-3513287",
        15,
        22
      );
      doc.text("Email: omerclinic@outlook.com", 15, 27);

      // Add patient information
      doc.setFontSize(12);
      let yPos = 40;
      doc.text(`Patient Name: ${patient.name}`, 15, yPos);
      yPos += 8;
      doc.text(`MR#: ${patient.mrNumber || "N/A"}`, 15, yPos);
      yPos += 8;
      doc.text(`Age/Gender: ${patient.age}Y/${patient.gender}`, 15, yPos);
      yPos += 15;

      // Add vital signs
      doc.setFontSize(14);
      doc.text("Vital Signs:", 15, yPos);
      yPos += 8;
      Object.entries(vitalSigns).forEach(([key, value]) => {
        doc.text(`${key}: ${value}`, 20, yPos);
        yPos += 8;
      });

      // Add medications
      yPos += 10;
      doc.setFontSize(14);
      doc.text("Prescribed Medications:", 15, yPos);
      yPos += 8;
      selectedMedicines.forEach((med, index) => {
        const medicine = medicines.find((m) => m.value === med.medicine_id);
        doc.text(
          `${index + 1}. ${medicine?.label || "Unknown"} - ${med.dosage}`,
          20,
          yPos
        );
        yPos += 8;
      });

      doc.save(
        `consultation-${patient.name}-${new Date()
          .toISOString()
          .slice(0, 10)}.pdf`
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF");
    }
    setIsGeneratingPDF(false);
  };

  // Fetch symptoms and medicines on load
  useEffect(() => {
    axios.get("https://patient-management-backend-nine.vercel.app/api/symptoms").then((res) => {
      setSymptoms(res.data.map((s) => ({ value: s.id, label: s.name })));
    });

    axios.get("https://patient-management-backend-nine.vercel.app/api/medicines").then((res) => {
      setMedicines(
        res.data.map((m) => ({
          value: m.id,
          label: `${m.form} ${m.brand_name} (${m.strength}))`,
        }))
      );
    });
  }, []);

  // handle create symptoms
  const handleCreateSymptom = async (inputValue) => {
    try {
      const response = await axios.post("https://patient-management-backend-nine.vercel.app/api/symptoms", {
        name: inputValue, // Sending new symptom name
      });

      const newSymptom = {
        value: response.data.id, // Assuming the API returns the new symptom's ID
        label: response.data.name,
      };

      setSymptoms((prev) => [...prev, newSymptom]); // Add to options
      setSelectedSymptoms((prev) => [...prev, newSymptom]); // Select it immediately
    } catch (error) {
      console.error("Error adding new symptom:", error);
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

    const startTime = Date.now();
    setIsSearching(true);

    try {
      const res = await axios.get(
        `https://patient-management-backend-nine.vercel.app/api/patients/search?mobile=${encodeURIComponent(
          data.mobile
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
        setSearchedMobile(data.mobile);
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

  // Submit symptoms & medicines for a patient
  const submitConsultation = async () => {
    if (!patient) {
      alert("Please search for a patient first.");
      return;
    }

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

      const vitalsData = {
        consultation_id: consultationId,
        temperature: vitalSigns?.temperature ?? 0.0,
        blood_pressure: vitalSigns?.bloodPressure?.match(/^\d{2,3}\/\d{2,3}$/)
          ? vitalSigns.bloodPressure
          : "120/80",
        pulse_rate: vitalSigns?.heartRate ?? 0,
        respiratory_rate: vitalSigns?.respiratoryRate ?? 0,
        oxygen_saturation: vitalSigns?.oxygenSaturation ?? 0,
      };

      console.log("Sending vitals data:", JSON.stringify(vitalsData, null, 2));

      await axios.post("https://patient-management-backend-nine.vercel.app/api/vitals", vitalsData, {
        headers: { "Content-Type": "application/json" },
      });

      // Step 5: Submit tests
      console.log("Submitting tests:", selectedTests);

      await axios.post("https://patient-management-backend-nine.vercel.app/api/tests", {
        consultation_id: consultationId,
        test_name: selectedTests, // Assuming selectedTests is a single test
        test_notes: "Optional test notes",
      });
      toast.success("Consultation added successfully! 🎉", {
        position: "top-right",
        autoClose: 3000,
      });
      alert("Consultation saved successfully.");
    } catch (error) {
      console.error(
        "Error submitting consultation",
        error.response?.data || error.message
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-8 relative overflow-hidden isolate before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.9),_transparent)] before:opacity-50 before:-z-10">
      <div className="mx-auto max-w-2xl rounded-2xl border border-white/30 bg-white/95 backdrop-blur-sm p-8 shadow-2xl shadow-gray-100/30">
        {/* Enhanced Header Section */}
        {/* <div className="mb-6 text-center border-b border-gray-200 pb-6 space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl shadow-sm">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                ></path>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Ayyub Labs & Clinic
              <span className="block text-sm font-normal text-gray-600 mt-1">
                Neurology & Stroke Center
              </span>
            </h1>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-center gap-3 text-sm">
              <p className="text-gray-700 font-medium px-4 py-2 bg-gray-100 rounded-lg flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  ></path>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  ></path>
                </svg>
                Mega Hospital, 2nd Floor, Mall Road, Rawalpindi Cantt
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 text-sm">
              <a
                href="tel:0334-5616185"
                className="text-gray-700 font-medium bg-gray-100 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200 transition-colors"
              >
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  ></path>
                </svg>
                <span className="text-blue-700">0334-5616185</span>
              </a>

              <a
                href="mailto:rauf.khan5@gmail.com"
                className="text-gray-700 font-medium bg-gray-100 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200 transition-colors"
              >
                <svg
                  className="w-5 h-5 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  ></path>
                </svg>
                <span className="text-purple-700">rauf.khan5@gmail.com</span>
              </a>
            </div>
          </div>

          <div className="mt-6 bg-gray-900 p-4 rounded-xl text-white shadow-lg">
            <p className="text-sm font-semibold flex items-center justify-center gap-2">
              <svg
                className="w-5 h-5 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              Dr. Abdul Rauf, MD (Neurology)
            </p>
            <p className="text-xs text-gray-300 mt-2 text-center">
              MBBS, FCPS (Pak), MRCP (UK) | Member: International Stroke
              Society, Pakistan Neurology Council
            </p>
          </div>
        </div> */}

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

            {/* Enhanced Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handlePrint}
                className="flex-1 flex items-center gap-3 justify-center rounded-xl bg-gray-100 hover:bg-gray-200 px-6 py-3.5 text-gray-700 transition-all group"
              >
                <div className="bg-blue-700 p-2 rounded-lg text-white">
                  <AiOutlinePrinter className="h-5 w-5" />
                </div>
                <span className="font-medium">Generate Print Copy</span>
              </button>
              <button
                onClick={generatePDF}
                disabled={isGeneratingPDF}
                className="flex-1 flex items-center gap-3 justify-center rounded-xl bg-gray-100 hover:bg-gray-200 px-6 py-3.5 text-gray-700 transition-all group"
              >
                <div className="bg-purple-700 p-2 rounded-lg text-white">
                  <AiOutlineDownload className="h-5 w-5" />
                </div>
                <span className="font-medium">
                  {isGeneratingPDF
                    ? "Preparing PDF..."
                    : "Download Patient Report"}
                </span>
              </button>
            </div>

            {/* Enhanced Vital Signs */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-5 border-b border-gray-200 pb-4">
                <div className="bg-red-700 p-2.5 rounded-lg text-white shadow-sm">
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
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    ></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Clinical Measurements
                  </h3>
                  <p className="text-sm text-gray-600">
                    Record patient's vital parameters
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    label: "Temperature (°C)",
                    key: "temperature",
                    icon: "thermometer",
                  },
                  {
                    label: "Blood Pressure (mmHg)",
                    key: "bloodPressure",
                    icon: "heart-pulse",
                  },
                  {
                    label: "Heart Rate (bpm)",
                    key: "heartRate",
                    icon: "heart",
                  },
                  {
                    label: "Respiratory Rate",
                    key: "respiratoryRate",
                    icon: "lungs",
                  },
                  {
                    label: "Oxygen Saturation (%)",
                    key: "oxygenSaturation",
                    icon: "oxygen",
                  },
                  { label: "Weight (kg)", key: "weight", icon: "weight" },
                ].map((field) => (
                  <div key={field.key} className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-500">{/* Icon */}</svg>
                      {field.label}
                    </label>
                    <input
                      type="number"
                      value={vitalSigns[field.key]}
                      onChange={(e) =>
                        setVitalSigns({
                          ...vitalSigns,
                          [field.key]: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border-2 border-gray-200 bg-white p-3 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                      placeholder="--"
                    />
                  </div>
                ))}
              </div>
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
                onCreateOption={(inputValue) => {
                  const newSymptom = { value: inputValue, label: inputValue };
                  setSymptoms([...symptoms, newSymptom]); 
                  setSelectedSymptoms([...selectedSymptoms, newSymptom]); 
                }}
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

            {/* test section */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select or Add a Test
              </label>
              <div className="relative">
                <CreatableSelect
                  isMulti
                  options={[
                    { value: "CBC", label: "Complete Blood Count (CBC)" },
                    { value: "LFT", label: "Liver Function Test (LFT)" },
                    { value: "RFT", label: "Renal Function Test (RFT)" },
                  ]}
                  value={selectedTests.map((test) => ({
                    value: test,
                    label: test,
                  }))}
                  onChange={(selectedOptions) =>
                    setSelectedTests(
                      selectedOptions.map((option) => option.value)
                    )
                  }
                  onCreateOption={(newTest) => {
                    const newOption = { value: newTest, label: newTest };
                    setSelectedTests([...selectedTests, newTest]); 
                  }}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  placeholder="Type or select a test..."
                  styles={{
                    control: (base) => ({
                      ...base,
                      border: "2px solid #f3f4f6",
                      borderRadius: "0.75rem",
                      padding: "0.5rem",
                      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                      "&:hover": { borderColor: "#93c5fd" },
                    }),
                    multiValue: (base) => ({
                      ...base,
                      backgroundColor: "#bfdbfe",
                      borderRadius: "9999px",
                      padding: "0 8px",
                    }),
                    multiValueLabel: (base) => ({
                      ...base,
                      color: "#1e40af",
                      fontWeight: "500",
                    }),
                    menu: (base) => ({
                      ...base,
                      borderRadius: "0.75rem",
                      border: "2px solid #f3f4f6",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isSelected ? "#3b82f6" : "white",
                      color: state.isSelected ? "white" : "#1f2937",
                      "&:hover": {
                        backgroundColor: "#60a5fa",
                        color: "white",
                      },
                    }),
                  }}
                  components={{
                    DropdownIndicator: () => (
                      <div className="pr-3">
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    ),
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {selectedTests.length} tests selected • Type to search or add a
                custom test
              </p>
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
                        <Select
                          options={medicines}
                          className="react-select-container"
                          classNamePrefix="react-select"
                          onChange={(e) => {
                            setSelectedMedicines((prev) =>
                              prev.map((item, i) =>
                                i === index
                                  ? { ...item, medicine_id: e.value }
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
                            { value: "night", label: "رات" },
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
                            { value: "1_week", label: "1 ہفتہ" },
                            { value: "2_weeks", label: "2 ہفتے" },
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
                            { value: "mouth", label: "From Mouth" },
                            { value: "injection", label: "Injection" },
                            { value: "topical", label: "Topical Application" },
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

            {/* Enhanced Final Button */}
            <button
              onClick={submitConsultation}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-teal-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.01]"
            >
              <span className="inline-block mr-2">✅</span>
              Finalize & Save Consultation
            </button>
          </div>
        ) : (
          showAddPatient && (
            <AddPatientForm
              searchedMobile={searchedMobile}
              onSuccess={handleNewPatient}
            />
          )
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default PatientSearch;

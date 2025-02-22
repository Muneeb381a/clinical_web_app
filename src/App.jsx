import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import Select from "react-select";
import {
  AiOutlinePlus,
  AiOutlinePrinter,
  AiOutlineDownload,
  AiOutlineCloseCircle,
} from "react-icons/ai";

// Schema for searching patients by mobile
const searchSchema = z.object({
  mobile: z.string().min(10, "Enter a valid mobile number"),
});



// Schema for adding a new patient
const patientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.coerce.number().positive("Enter a valid age"),
  gender: z.string().min(1, "Gender is required"),
  weight: z.coerce.number().positive("Enter a valid weight"),
  height: z.coerce.number().positive("Enter a valid height"),
  mobile: z.string().min(10, "Enter a valid mobile number"),
});

const Loader = () => (
  <div className="flex justify-center items-center p-4">
    <svg 
      className="animate-spin h-8 w-8 text-blue-600" 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  </div>
);

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

  const [vitalSigns, setVitalSigns] = useState({
    temperature: "",
    bloodPressure: "",
    heartRate: "",
    respiratoryRate: "",
    oxygenSaturation: "",
    weight: "",
    height: "",
  });

  const predefinedInstructions = [
    { value: "1-0-1", label: "1-0-1 (Morning & Night)" },
    { value: "1-1-1", label: "1-1-1 (Morning, Afternoon & Night)" },
    { value: "0-0-1", label: "0-0-1 (Night Only)" },
    { value: "1-0-0", label: "1-0-0 (Morning Only)" },
  ];
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
            body { font-family: Arial, sans-serif; padding: 20px }
            h2 { color: #1e3a8a; border-bottom: 2px solid #eee; padding-bottom: 10px }
            .section { margin-bottom: 25px }
            table { width: 100%; border-collapse: collapse; margin-top: 10px }
            td, th { border: 1px solid #ddd; padding: 8px; text-align: left }
            .header { text-align: center; margin-bottom: 20px }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Specialist Clinics, Lab & Imaging Services</h1>
            <p>G.T Road, Gujar Khan</p>
            <p>Ph: 051-3513287, 0315-3513287, 0322-3513287</p>
          </div>
  
          <h2>Patient Information</h2>
          <table>
            <tr><th>Name</th><td>${patient?.name || "-"}</td></tr>
            <tr><th>Age</th><td>${patient?.age || "-"}</td></tr>
            <tr><th>Gender</th><td>${patient?.gender || "-"}</td></tr>
          </table>
  
          <h2>Vital Signs</h2>
          <table>
            ${Object.entries(vitalSigns)
              .map(
                ([key, value]) => `
                <tr>
                  <th>${key}</th>
                  <td>${value || "-"}</td>
                </tr>
              `
              )
              .join("")}
          </table>
  
          <h2>Tests</h2>
          <ul>
            ${selectedTests.map((test) => `<li>${test}</li>`).join("")}
          </ul>
  
          <h2>Prescriptions</h2>
          <table>
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Frequency</th>
                <th>Dosage</th>
              </tr>
            </thead>
            <tbody>
              ${selectedMedicines
                .map(
                  (med) => `
                <tr>
                  <td>${
                    medicines.find((m) => m.value === med.medicine_id)?.label ||
                    "-"
                  }</td>
                  <td>${med.frequency_en || "-"}</td>
                  <td>${med.dosage || "-"}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
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
    axios
      .get("https://patient-management-backend-nine.vercel.app/api/symptoms")
      .then((res) => {
        setSymptoms(res.data.map((s) => ({ value: s.id, label: s.name })));
      });

    axios
      .get("https://patient-management-backend-nine.vercel.app/api/medicines")
      .then((res) => {
        setMedicines(
          res.data.map((m) => ({
            value: m.id,
            label: `${m.form} ${m.brand_name} (${m.strength}))`,
          }))
        );
      });
  }, []);

  // Form for searching patients
  const {
    register: registerSearch,
    handleSubmit: handleSearchSubmit,
    formState: { errors: searchErrors },
  } = useForm({ resolver: zodResolver(searchSchema) });

  // Form for adding new patients
  const {
    register: registerPatient,
    handleSubmit: handlePatientSubmit,
    formState: { errors: patientErrors },
  } = useForm({ resolver: zodResolver(patientSchema) });

  // Search for patient by mobile
  const onSearch = async (data) => {
    const startTime = Date.now();
    setIsSearching(true);
    try {
      const res = await axios.get(
        `https://patient-management-backend-nine.vercel.app/api/patients/search?mobile=${data.mobile}`
      );
      const elapsed = Date.now() - startTime;
      if (elapsed < 500) {
        await new Promise((resolve) => setTimeout(resolve, 500 - elapsed));
      }
      if (res.data.exists) {
        setPatient(res.data.data);
        setShowAddPatient(false);
      } else {
        setPatient(null);
        setShowAddPatient(true);
      }
    } catch (error) {
      console.error("Error fetching patient", error);
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
        { patient_id: patient.id, doctor_name: "Dr. Omer" }
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
          medicines: selectedMedicines,
        }
      );

      const vitalsData = {
        consultation_id: consultationId,
        temperature: vitalSigns.temperature || 0.0,
        blood_pressure: vitalSigns.bloodPressure || "N/A", // Convert to match DB
        pulse_rate: vitalSigns.heartRate || 0, // Rename to match DB
        respiratory_rate: vitalSigns.respiratoryRate || 0, // Rename
        oxygen_saturation: vitalSigns.oxygenSaturation || 0,
        weight: vitalSigns.weight || 0,
        height: vitalSigns.height || 0,
      };

      console.log("Sending vitals data:", vitalsData);

      await axios.post(
        "https://patient-management-backend-nine.vercel.app/api/vitals",
        vitalsData
      );

      // Step 5: Submit tests
      console.log("Submitting tests:", selectedTests);

      await axios.post(
        "https://patient-management-backend-nine.vercel.app/api/tests",
        {
          consultation_id: consultationId,
          test_name: selectedTests, // Assuming selectedTests is a single test
          test_notes: "Optional test notes",
        }
      );
      alert("Consultation saved successfully.");
    } catch (error) {
      console.error(
        "Error submitting consultation",
        error.response?.data || error.message
      );
    }
  };

  // Add a new patient
  const addPatient = async (data) => {
    try {
      const formattedData = {
        name: data.name,
        age: data.age,
        gender: data.gender,
        weight: data.weight,
        height: data.height,
        mobile: data.mobile,
      };

      const res = await axios.post(
        "https://patient-management-backend-nine.vercel.app/api/patients",
        formattedData
      );
      setPatient(res.data);
      setShowAddPatient(false);
    } catch (error) {
      console.error(
        "Error adding patient",
        error.response?.data || error.message
      );
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-100 p-8 relative overflow-hidden isolate before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.8),_transparent)] before:opacity-60 before:-z-10">
      <div className="mx-auto max-w-2xl rounded-2xl border border-white/20 bg-white/95 backdrop-blur-sm p-8 shadow-2xl shadow-blue-100/30">
        {/* Header Section */}
        <div className="mb-6 text-center border-b border-blue-100 pb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Specialist Clinics, Lab & Imaging Services
          </h1>
          <div className="mt-3 space-y-1.5">
            <p className="text-sm text-gray-600 font-medium">
              <span className="inline-block bg-blue-100/50 rounded-lg px-4 py-1.5">
                📍 G.T Road, Gujar Khan
              </span>
            </p>
            <p className="text-sm text-gray-600 font-medium">
              📞 Ph: <span className="text-blue-600">051-3513287</span>,
              <span className="text-purple-600"> 0315-3513287</span>,
              <span className="text-blue-600"> 0322-3513287</span>
            </p>
            <p className="text-sm text-gray-600 font-medium">
              📧 <span className="text-purple-600">omerclinic@outlook.com</span>
            </p>
          </div>
          <div className="mt-4 bg-blue-50/50 p-3 rounded-xl inline-block px-6">
            <p className="text-sm font-semibold text-blue-800">
              👨⚕️ Dr. Omer Aziz Mirza
            </p>
            <p className="text-xs text-blue-600/90">
              MBS, FCPS (Pak), MKCPS (GLASG) | Consultant Cardiologist
            </p>
          </div>
        </div>

        <h2 className="mb-6 border-b border-blue-100 pb-4 text-3xl font-extrabold text-gray-900 bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text">
          👨⚕️ Patient Consultation
        </h2>

        {/* Search Section */}
        <div className="mb-8 bg-blue-50/30 p-6 rounded-2xl">
          <h3 className="mb-4 text-lg font-bold text-gray-800 flex items-center gap-2">
            <span className="bg-blue-600 text-white p-2 rounded-lg">🔍</span>
            Search Patient
          </h3>
          <form onSubmit={handleSearchSubmit(onSearch)} className="flex gap-3">
            <input
              {...registerSearch("mobile")}
              placeholder="Enter Mobile Number"
              className="flex-grow rounded-xl border-2 border-white bg-white/90 p-3.5 shadow-lg shadow-blue-100/30 focus:border-blue-400 focus:ring-4 focus:ring-blue-50/50 transition-all duration-200"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="px-8 py-3.5 bg-gradient-to-br from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-200/40 hover:shadow-blue-300/40 transition-all duration-200 transform hover:scale-[1.02]"
            >
              {isSearching ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Searching...
                </div>
              ) : (
                "Search"
              )}
            </button>
          </form>
          {searchErrors.mobile && (
            <p className="mt-2 text-sm text-red-500">
              ⚠️ {searchErrors.mobile.message}
            </p>
          )}
        </div>

        {patient ? (
          <div className="space-y-8" id="consultation-content">
            {/* Patient Details */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="mb-5 text-lg font-bold text-gray-800 flex items-center gap-2">
                <span className="bg-green-600 text-white p-2 rounded-lg">
                  📋
                </span>
                Patient Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Name", value: patient.name },
                  { label: "Age", value: patient.age },
                  { label: "Gender", value: patient.gender },
                  { label: "Weight", value: patient.weight },
                  { label: "Height", value: patient.height },
                ].map((field) => (
                  <div key={field.label} className="space-y-1">
                    <label className="text-sm font-medium text-gray-500">
                      {field.label}
                    </label>
                    <div className="rounded-lg bg-gray-50/70 p-3 font-medium text-gray-800 border border-gray-100">
                      {field.value || "-"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handlePrint}
                className="flex-1 flex items-center gap-2 rounded-xl bg-gray-100 hover:bg-gray-200 px-6 py-3.5 text-gray-700 transition-all"
              >
                <AiOutlinePrinter className="h-5 w-5" />
                Print
              </button>
              <button
                onClick={generatePDF}
                disabled={isGeneratingPDF}
                className="flex-1 flex items-center gap-2 rounded-xl bg-blue-100 hover:bg-blue-200 px-6 py-3.5 text-blue-700 transition-all disabled:opacity-50"
              >
                {isGeneratingPDF ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5"
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
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <AiOutlineDownload className="h-5 w-5" />
                    Download PDF
                  </>
                )}
              </button>
            </div>

            {/* Vital Signs */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="mb-4 text-lg font-bold text-gray-800 flex items-center gap-2">
                <span className="bg-red-600 text-white p-2 rounded-lg">🌡️</span>
                Vital Signs
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { placeholder: "Temperature (°C)", key: "temperature" },
                  {
                    placeholder: "Blood Pressure (mmHg)",
                    key: "bloodPressure",
                  },
                  { placeholder: "Heart Rate (bpm)", key: "heartRate" },
                  {
                    placeholder: "Respiratory Rate (breaths/min)",
                    key: "respiratoryRate",
                  },
                  {
                    placeholder: "Oxygen Saturation (%)",
                    key: "oxygenSaturation",
                  },
                  { placeholder: "Weight (kg)", key: "weight" },
                  { placeholder: "Height (cm)", key: "height" },
                ].map((field) => (
                  <input
                    key={field.key}
                    type="text"
                    placeholder={field.placeholder}
                    value={vitalSigns[field.key]}
                    onChange={(e) =>
                      setVitalSigns({
                        ...vitalSigns,
                        [field.key]: e.target.value,
                      })
                    }
                    className="rounded-lg border-2 border-gray-100 bg-white p-3 shadow-sm focus:border-blue-400 focus:ring-4 focus:ring-blue-50/50 transition-all duration-200"
                  />
                ))}
              </div>
            </div>

            {/* Symptoms Section */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="mb-4 text-lg font-bold text-gray-800 flex items-center gap-2">
                <span className="bg-orange-600 text-white p-2 rounded-lg">
                  🤒
                </span>
                Symptoms Observation
              </h3>
              <Select
                isMulti
                options={symptoms}
                className="react-select-container"
                classNamePrefix="react-select"
                onChange={setSelectedSymptoms}
                placeholder="Select or type symptoms..."
                styles={customSelectStyles}
              />
            </div>
            {/* test section */}
            <div className="space-y-4">
              {/* Selected Tests Display */}
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedTests.map((test) => (
                  <div
                    key={test}
                    className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-sm flex items-center gap-2"
                  >
                    {test}
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedTests(
                          selectedTests.filter((t) => t !== test)
                        )
                      }
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {/* Custom Test Input */}
              <div className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add custom test..."
                    value={customTest}
                    onChange={(e) => setCustomTest(e.target.value)}
                    className="flex-1 rounded-lg border-2 border-gray-100 p-2.5 shadow-sm focus:border-blue-400 focus:ring-4 focus:ring-blue-50/50 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customTest.trim()) {
                        setSelectedTests([...selectedTests, customTest.trim()]);
                        setCustomTest("");
                      }
                    }}
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Test Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Standard Tests
                </label>
                <div className="relative">
                  <Select
                    isMulti
                    options={[
                      { value: "CBC", label: "Complete Blood Count (CBC)" },
                      { value: "LFT", label: "Liver Function Test (LFT)" },
                      { value: "RFT", label: "Renal Function Test (RFT)" },
                      { value: "HbA1c", label: "Hemoglobin A1c (HbA1c)" },
                      { value: "Lipid Profile", label: "Lipid Profile" },
                      { value: "Thyroid Panel", label: "Thyroid Panel" },
                      {
                        value: "Urine Routine",
                        label: "Urine Routine Examination",
                      },
                      { value: "ECG", label: "Electrocardiogram (ECG)" },
                      { value: "X-Ray Chest", label: "Chest X-Ray" },
                      { value: "MRI Brain", label: "Brain MRI" },
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
                    className="react-select-container"
                    classNamePrefix="react-select"
                    placeholder="Search or select tests..."
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
                  {selectedTests.length} tests selected • Start typing to search
                </p>
              </div>
            </div>
            {/* Medicines Section */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="mb-5 text-lg font-bold text-gray-800 flex items-center gap-2">
                <span className="bg-purple-600 text-white p-2 rounded-lg">
                  💊
                </span>
                Prescription Management
              </h3>
              <div className="space-y-4">
                {selectedMedicines.map((med, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-1 grid grid-cols-3 gap-3">
                      <Select
                        options={medicines}
                        className="react-select-container"
                        classNamePrefix="react-select"
                        onChange={(e) => {
                          const updated = [...selectedMedicines];
                          updated[index].medicine_id = e.value;
                          setSelectedMedicines(updated);
                        }}
                        placeholder="Medicine"
                        styles={customSelectStyles}
                      />
                      <Select
                        options={predefinedInstructions}
                        className="react-select-container"
                        classNamePrefix="react-select"
                        onChange={(e) => {
                          const updated = [...selectedMedicines];
                          updated[index].frequency_en = e.value;
                          setSelectedMedicines(updated);
                        }}
                        placeholder="Frequency"
                        styles={customSelectStyles}
                      />
                      <input
                        type="text"
                        placeholder="Dosage"
                        value={med.dosage}
                        onChange={(e) => {
                          const updated = [...selectedMedicines];
                          updated[index].dosage = e.target.value;
                          setSelectedMedicines(updated);
                        }}
                        className="rounded-lg border-2 border-gray-100 px-4 py-2.5 focus:border-blue-400 focus:ring-4 focus:ring-blue-50/50 transition-all duration-200"
                      />
                    </div>
                    <button
                      onClick={() => {
                        const updated = [...selectedMedicines];
                        updated.splice(index, 1);
                        setSelectedMedicines(updated);
                      }}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <AiOutlineCloseCircle className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() =>
                    setSelectedMedicines([...selectedMedicines, {}])
                  }
                  className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-200 text-blue-600 hover:border-blue-400 hover:bg-blue-50/50 p-4 transition-all duration-200"
                >
                  <AiOutlinePlus className="w-5 h-5" />
                  Add Medicine
                </button>
              </div>
            </div>

            <button
              onClick={submitConsultation}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-teal-600 text-white font-bold rounded-2xl shadow-lg shadow-green-200/40 hover:shadow-green-300/40 transition-all duration-200 transform hover:scale-[1.01]"
            >
              ✅ Finalize Consultation
            </button>
          </div>
        ) : (
          showAddPatient && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="bg-blue-600 text-white p-2 rounded-lg">
                  📝
                </span>
                Register New Patient
              </h3>
              <form
                onSubmit={handlePatientSubmit(addPatient)}
                className="grid grid-cols-2 gap-4"
              >
                {[
                  { name: "name", placeholder: "Full Name" },
                  { name: "age", placeholder: "Age", type: "number" },
                  { name: "gender", placeholder: "Gender" },
                  {
                    name: "weight",
                    placeholder: "Weight (kg)",
                    type: "number",
                  },
                  {
                    name: "height",
                    placeholder: "Height (cm)",
                    type: "number",
                  },
                  { name: "mobile", placeholder: "Mobile Number" },
                ].map((field) => (
                  <input
                    key={field.name}
                    {...registerPatient(field.name)}
                    placeholder={field.placeholder}
                    type={field.type || "text"}
                    className="rounded-lg border-2 border-gray-100 p-3 shadow-sm focus:border-blue-400 focus:ring-4 focus:ring-blue-50/50 transition-all duration-200"
                  />
                ))}
                <button
                  type="submit"
                  className="col-span-2 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-2xl shadow-lg shadow-blue-200/40 hover:shadow-blue-300/40 transition-all duration-200 transform hover:scale-[1.01]"
                >
                  📥 Register Patient
                </button>
              </form>
              <div className="mt-4 space-y-2">
                {Object.values(patientErrors).map((error, index) => (
                  <p key={index} className="text-sm text-red-500">
                    ⚠️ {error.message}
                  </p>
                ))}
              </div>
              
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default PatientSearch;

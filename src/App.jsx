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
          <title>Consultation Print</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px }
            table { border-collapse: collapse; width: 100% }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
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
    axios.get("http://localhost:4500/api/symptoms").then((res) => {
      setSymptoms(res.data.map((s) => ({ value: s.id, label: s.name })));
    });

    axios.get("http://localhost:4500/api/medicines").then((res) => {
      setMedicines(
        res.data.map((m) => ({
          value: m.id,
          label: `${m.form} ${m.brand_name} (${m.strength}) / ${m.urdu_form} ${m.urdu_name} (${m.urdu_strength})`,
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
        `http://localhost:4500/api/patients/search?mobile=${data.mobile}`
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
        "http://localhost:4500/api/consultations",
        { patient_id: patient.id, doctor_name: "Dr. John Doe" }
      );

      const consultationId = consultationRes.data.id;

      // Step 2: Submit symptoms
      await axios.post(
        `http://localhost:4500/api/consultations/${consultationRes.data.id}/symptoms`,
        {
          patient_id: patient.id,
          symptom_ids: selectedSymptoms.map((s) => s.value),
        }
      );

      // Step 3: Submit medicines
      await axios.post("http://localhost:4500/api/prescriptions", {
        consultation_id: consultationId,
        medicines: selectedMedicines,
      });

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

      await axios.post("http://localhost:4500/api/vitals", vitalsData);
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
        "http://localhost:4500/api/patients",
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-8">
      <div className="mx-auto max-w-2xl rounded-xl border border-gray-100 bg-white p-8 shadow-lg">
        <div className="mb-6 text-center border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Specialist Clinics, Lab and Imaging Services
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            G.T Road, Gujar Khan. Ph: 051-3513287, 0315-3513287, 0322-3513287
          </p>
          <p className="text-sm text-gray-600">Email: omerclinic@outlook.com</p>
          <div className="mt-4">
            <p className="text-sm font-semibold text-gray-800">
              Dr. Omer Aziz Mirza
            </p>
            <p className="text-xs text-gray-600">
              MBS, FCPS (Pak), MKCPS (GLASG) | Consultant Cardiologist
            </p>
          </div>
        </div>
        <h2 className="mb-6 border-b border-gray-200 pb-4 text-3xl font-extrabold text-gray-900">
          👨⚕️ Patient Consultation
        </h2>

        {/* Search Section */}
        <div className="mb-8">
          <h3 className="mb-4 text-lg font-bold text-gray-800">
            🔍 Search Patient
          </h3>
          <form onSubmit={handleSearchSubmit(onSearch)} className="flex gap-3">
            <input
              {...registerSearch("mobile")}
              placeholder="Enter Mobile Number"
              className="flex-grow transform rounded-xl border-2 border-gray-100 p-3.5 shadow-sm transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-50 focus:ring-opacity-50"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="transform rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 px-8 py-3.5 font-semibold text-white shadow-md transition-all hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-50"
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
          <div className="space-y-8">
            {/* Patient Details */}
            <div>
              <h3 className="mb-5 text-lg font-bold text-gray-800">
                📋 Patient Information
              </h3>
              <div className="grid grid-cols-2 gap-5">
                {[
                  { label: "Name", value: patient.name },
                  { label: "Age", value: patient.age },
                  { label: "Gender", value: patient.gender },
                  { label: "Weight", value: patient.weight },
                  { label: "Height", value: patient.height },
                ].map((field) => (
                  <div key={field.label}>
                    <label className="mb-2 block text-sm font-medium text-gray-600">
                      {field.label}
                    </label>
                    <input
                      type="text"
                      value={field.value}
                      disabled
                      className="w-full rounded-lg border-2 border-gray-100 bg-gray-100 p-3 font-medium text-gray-800 shadow-inner"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 rounded-xl bg-gray-100 px-6 py-3 text-gray-700 hover:bg-gray-200"
              >
                <AiOutlinePrinter className="h-5 w-5" />
                Print
              </button>
              <button
                onClick={generatePDF}
                disabled={isGeneratingPDF}
                className="flex items-center gap-2 rounded-xl bg-blue-100 px-6 py-3 text-blue-700 hover:bg-blue-200 disabled:opacity-50"
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
            <div>
              <h3 className="mb-4 text-lg font-bold text-gray-800">
                🌡️ Vital Signs
              </h3>
              <div className="grid grid-cols-2 gap-5">
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
                    className="rounded-lg border-2 border-gray-100 p-3 shadow-sm focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  />
                ))}
              </div>
            </div>
            {/* Symptoms Selection */}
            <div>
              <h3 className="mb-4 text-lg font-bold text-gray-800">
                🤒 Symptoms Observation
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

            {/* Medicines Section */}
            <div>
              <h3 className="mb-5 text-lg font-bold text-gray-800">
                💊 Prescription Management
              </h3>
              <div className="space-y-5">
                {selectedMedicines.map((med, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <Select
                      options={medicines}
                      className="react-select-container flex-1"
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
                      className="react-select-container flex-1"
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
                      className="flex-1 rounded-lg border-2 border-gray-100 px-4 py-2.5 shadow-sm focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={() => setSelectedMedicines([...selectedMedicines, {}])}
                className="mt-5 flex w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-white px-4 py-3 text-gray-600 transition-all hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
              >
                <AiOutlinePlus className="mr-2 h-5 w-5" />
                Add Medicine
              </button>
            </div>
            <button
              onClick={submitConsultation}
              className="w-full transform rounded-xl bg-gradient-to-br from-green-500 to-green-600 px-8 py-4 font-semibold text-white shadow-md transition-all hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-green-200"
            >
              ✅ Finalize Consultation
            </button>
          </div>
        ) : (
          showAddPatient && (
            <div className="space-y-8">
              <h3 className="text-lg font-bold text-gray-800">
                📝 Register New Patient
              </h3>
              <form
                onSubmit={handlePatientSubmit(addPatient)}
                className="grid grid-cols-2 gap-5"
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
                    className="rounded-lg border-2 border-gray-100 p-3 shadow-sm focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  />
                ))}
                <button
                  type="submit"
                  className="col-span-2 transform rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 px-8 py-4 font-semibold text-white shadow-md transition-all hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-200"
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

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
  AiOutlineCheckCircle,
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [vitalSigns, setVitalSigns] = useState({
    temperature: "",
    bloodPressure: "",
    heartRate: "",
    respiratoryRate: "",
    oxygenSaturation: "",
    weight: "",
  });

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "Male",
    mobile: "",
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
          <title>Consultation Print - ${patient?.name || "Unknown Patient"}</title>
          <style>
            body { 
              font-family: 'Arial', sans-serif; 
              padding: 15px 25px;
              line-height: 1.4;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            .clinic-info {
              font-size: 14px;
              margin: 5px 0;
            }
            .doctor-credentials {
              font-size: 12px;
              margin: 10px 0;
            }
            .patient-info {
              margin: 15px 0;
              width: 100%;
            }
            .patient-info td {
              padding: 5px 10px;
            }
            .vital-signs {
              margin: 15px 0;
              width: 100%;
              border-collapse: collapse;
            }
            .vital-signs td, .vital-signs th {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            .prescription-table {
              width: 100%;
              margin: 20px 0;
              border-collapse: collapse;
            }
            .prescription-table td, .prescription-table th {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: center;
            }
            .footer {
              margin-top: 30px;
              border-top: 2px solid #333;
              padding-top: 15px;
              font-size: 12px;
            }
            .bold {
              font-weight: bold;
            }
            .text-center {
              text-align: center;
            }
            .mb-15 {
              margin-bottom: 15px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>AYYUB LABS & CLINICS</h1>
            <p>Mega Hospital Second Floor Mall Road Saddar Rawalpindi Cantt.</p>
            <p>Ph: 0334-5616185</p>
            <div class="doctor-credentials">
              BABAS.NCI MSCE (UK), DCH London SEC Neurology (UK)<br>
              Member: Pakistan Society of Neurology, International Headache Society,<br>
              International Stroke Society, Pakistan Stroke Society
            </div>
          </div>
  
          <table class="patient-info">
            <tr>
              <td class="bold">Name:</td>
              <td>${patient?.name || "-"}</td>
            </tr>
            <tr>
              <td class="bold">Phone:</td>
              <td>${patient?.mobile || "-"}</td>
              <td class="bold">Age/Gender:</td>
              <td>${patient?.age || "-"} ${patient?.gender || ""}</td>
            </tr>
            <tr>
              <td class="bold">Date:</td>
              <td>${new Date().toLocaleDateString()}</td>
              <td class="bold">Consultant:</td>
              <td>Dr. Omer Aziz Mirza</td>
            </tr>
          </table>
  
          <table class="vital-signs">
            <tr>
              <th>Pulse heart rate</th>
              <td>${vitalSigns?.pulse || "-"} bpm</td>
              <th>Weight</th>
              <td>${vitalSigns?.weight || "-"} kg</td>
            </tr>
            <tr>
              <th>Blood pressure</th>
              <td>${vitalSigns?.bloodPressure || "-"} mmHg</td>
              <th>Height</th>
              <td>${vitalSigns?.height || "-"} cm</td>
            </tr>
            <tr>
              <th>Oxygen Saturation</th>
              <td>${vitalSigns?.oxygenSaturation || "-"}%</td>
              <th>Body Mass Index</th>
              <td>${vitalSigns?.bmi || "-"}</td>
            </tr>
          </table>
  
          <div class="mb-15">
            <h3>Prescriptions</h3>
            <table class="prescription-table">
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Dosage</th>
                  <th>Frequency</th>
                </tr>
              </thead>
              <tbody>
                ${selectedMedicines.map(med => `
                  <tr>
                    <td>${medicines.find(m => m.value === med.medicine_id)?.label || "-"}</td>
                    <td>${med.dosage || "-"}</td>
                    <td>${med.frequency_en || "-"}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
  
          <div class="footer">
            <div class="text-center">
              <strong>Recommended Follow-up Appointment Date:</strong> 
              ${new Date().toLocaleDateString()}
            </div>
            <div class="doctor-info">
              <strong>Dr. Abdul Rauf</strong><br>
              BABAS.NCI MSCE (UK), DCH London SEC Neurology (UK)<br>
              Member: Pakistan Society of Neurology, International Headache Society,
              International Stroke Society, Pakistan Stroke Society
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
      setIsSubmitting(true);
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
          medicines: selectedMedicines,
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

      await axios.post(
        "https://patient-management-backend-nine.vercel.app/api/vitals",
        vitalsData,
        { headers: { "Content-Type": "application/json" } }
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Add a new patient
  const addPatient = async (data) => {
    try {
      const formattedData = {
        name: data.name,
        age: data.age,
        gender: data.gender,
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-8 relative overflow-hidden isolate before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.9),_transparent)] before:opacity-50 before:-z-10">
      <div className="mx-auto max-w-2xl rounded-2xl border border-white/30 bg-white/95 backdrop-blur-sm p-8 shadow-2xl shadow-gray-100/30">
        {/* Enhanced Header Section */}
        <div className="mb-6 text-center border-b border-gray-200 pb-6 space-y-4">
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
        </div>

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
                    value: patient.lastVisit || "N/A",
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
                    Select observed symptoms and complaints
                  </p>
                </div>
              </div>
              <Select
                isMulti
                options={symptoms}
                className="react-select-container"
                classNamePrefix="react-select"
                onChange={setSelectedSymptoms}
                placeholder="Select or type symptoms..."
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
                      { value: "O/E", label: "On Examination" },
                      { value: "SLR", label: "Straight Leg Raise Test" },
                      { value: "Tone", label: "Muscle Tone Assessment" },
                      { value: "Reflexes", label: "Reflex Examination" },
                      { value: "Gait", label: "Gait Assessment" },
                      { value: "Power", label: "Muscle Power Assessment" },
                      { value: "C/ROM", label: "Cervical Range of Motion" },
                      {
                        value: "Phallen's",
                        label: "Phalen's Test for Carpal Tunnel Syndrome",
                      },
                      {
                        value: "Rev Phallen's",
                        label: "Reverse Phalen's Test",
                      },
                      {
                        value: "Roos Test",
                        label: "Roos Test for Thoracic Outlet Syndrome",
                      },
                      { value: "Sensory", label: "Sensory Examination" },
                      {
                        value: "Cerebellum",
                        label: "Cerebellar Function Assessment",
                      },
                      {
                        value: "Fundi",
                        label: "Fundoscopic (Eye) Examination",
                      },
                      {
                        value: "HMF",
                        label: "Higher Mental Functions Assessment",
                      },
                      { value: "MMSE", label: "Mini-Mental State Examination" },
                      {
                        value: "Gower's Sign",
                        label: "Gower's Sign Test for Muscle Weakness",
                      },
                      {
                        value: "Bradykinesia",
                        label: "Bradykinesia (Slowness of Movement)",
                      },
                      {
                        value: "Dyskinesia",
                        label: "Dyskinesia (Involuntary Movements)",
                      },
                      {
                        value: "Epley's Maneuver",
                        label: "Epley's Maneuver for Vertigo",
                      },
                      {
                        value: "Fall Assessment",
                        label: "Fall Risk Assessment",
                      },
                      {
                        value: "Speech",
                        label: "Speech and Language Examination",
                      },
                      {
                        value: "Romberg Test",
                        label: "Romberg Test for Balance and Coordination",
                      },
                      {
                        value: "Finger-Nose Test",
                        label: "Finger-Nose Test for Coordination",
                      },
                      {
                        value: "Heel-to-Shin Test",
                        label: "Heel-to-Shin Test for Coordination",
                      },
                      {
                        value: "Babinski Sign",
                        label: "Babinski Sign (Plantar Reflex)",
                      },
                      {
                        value: "Clonus",
                        label: "Clonus Test for Neuromuscular Hyperactivity",
                      },
                      {
                        value: "Hoffman’s Sign",
                        label: "Hoffman’s Sign (Cervical Myelopathy)",
                      },
                      {
                        value: "Pronator Drift",
                        label:
                          "Pronator Drift Test for Upper Motor Neuron Lesion",
                      },
                      {
                        value: "Lhermitte’s Sign",
                        label: "Lhermitte’s Sign (Spinal Cord Dysfunction)",
                      },
                      {
                        value: "Tinel’s Sign",
                        label: "Tinel’s Sign for Nerve Compression",
                      },
                      {
                        value: "Froment’s Sign",
                        label: "Froment’s Sign for Ulnar Nerve Dysfunction",
                      },
                      {
                        value: "Two-Point Discrimination",
                        label:
                          "Two-Point Discrimination Test for Sensory Function",
                      },
                      {
                        value: "Spurling’s Test",
                        label: "Spurling’s Test for Cervical Radiculopathy",
                      },
                      {
                        value: "Schober’s Test",
                        label: "Schober’s Test for Lumbar Spine Flexibility",
                      },
                      {
                        value: "Trendelenburg Test",
                        label: "Trendelenburg Test for Hip Stability",
                      },
                      {
                        value: "Dix-Hallpike Test",
                        label:
                          "Dix-Hallpike Test for Benign Paroxysmal Positional Vertigo (BPPV)",
                      },
                      {
                        value: "Sharpened Romberg Test",
                        label: "Sharpened Romberg Test for Postural Stability",
                      },
                      {
                        value: "Weber Test",
                        label: "Weber Test for Hearing Loss",
                      },
                      {
                        value: "Rinne Test",
                        label: "Rinne Test for Hearing Loss",
                      },
                      {
                        value: "Snellen Test",
                        label: "Snellen Test for Visual Acuity",
                      },
                      {
                        value: "Visual Field Test",
                        label: "Visual Field Test for Peripheral Vision",
                      },
                      {
                        value: "Glasgow Coma Scale",
                        label:
                          "Glasgow Coma Scale (GCS) for Consciousness Level",
                      },
                      { value: "CBC", label: "Complete Blood Count (CBC)" },
                      { value: "CRP", label: "C-Reactive Protein (CRP)" },
                      { value: "CPK", label: "Creatine Phosphokinase (CPK)" },
                      { value: "S. B12", label: "Serum Vitamin B12 Level" },
                      { value: "S. Calcium", label: "Serum Calcium Level" },
                      { value: "TFTs", label: "Thyroid Function Tests (TFTs)" },
                      { value: "LFTs", label: "Liver Function Tests (LFTs)" },
                      { value: "RFTs", label: "Renal Function Tests (RFTs)" },
                      { value: "Lipid profile", label: "Lipid Profile" },
                      { value: "2D Echo", label: "2D Echocardiography" },
                      {
                        value: "Carotid Doppler",
                        label: "Carotid Doppler Ultrasound",
                      },
                      { value: "CT Brain Plain", label: "CT Brain (Plain)" },
                      {
                        value: "CE CT Brain",
                        label: "Contrast-Enhanced CT Brain",
                      },
                      {
                        value: "CT head and neck",
                        label: "CT Scan of Head and Neck",
                      },
                      { value: "CTA", label: "CT Angiography (CTA)" },
                      { value: "MRI L/Spine", label: "MRI Lumbar Spine" },
                      { value: "MRI C/Spine", label: "MRI Cervical Spine" },
                      { value: "MRI D/Spine", label: "MRI Dorsal Spine" },
                      { value: "MRI whole spine", label: "MRI Whole Spine" },
                      { value: "MRI Brain Plain", label: "MRI Brain (Plain)" },
                      {
                        value: "MRI Brain with orbits",
                        label: "MRI Brain with Orbits",
                      },
                      {
                        value: "CE MRI Brain",
                        label: "Contrast-Enhanced MRI Brain",
                      },
                      {
                        value: "MRI brain stroke protocol",
                        label: "MRI Brain (Stroke Protocol)",
                      },
                      {
                        value: "MRI brain epilepsy protocol",
                        label: "MRI Brain (Epilepsy Protocol)",
                      },
                      {
                        value: "MRA",
                        label: "Magnetic Resonance Angiography (MRA)",
                      },
                      {
                        value: "MRV",
                        label: "Magnetic Resonance Venography (MRV)",
                      },
                      {
                        value: "ESR",
                        label: "Erythrocyte Sedimentation Rate (ESR)",
                      },
                      {
                        value: "ANA",
                        label: "Antinuclear Antibody (ANA) Test",
                      },
                      {
                        value: "Anti CCP",
                        label:
                          "Anti-Cyclic Citrullinated Peptide (Anti-CCP) Test",
                      },
                      {
                        value: "RA Factor",
                        label: "Rheumatoid Factor (RA Factor)",
                      },
                      { value: "HLAb27", label: "HLA-B27 Test" },
                      { value: "Hba1c", label: "Hemoglobin A1c (HbA1c) Test" },
                      { value: "BSR", label: "Blood Sugar Random (BSR) Test" },
                      {
                        value: "ACHR",
                        label: "Acetylcholine Receptor Antibody (ACHR) Test",
                      },
                      { value: "EEG", label: "Electroencephalogram (EEG)" },
                      {
                        value: "Sleep Deprived EEG",
                        label: "Sleep-Deprived EEG",
                      },
                      { value: "Vit D3 level", label: "Vitamin D3 Level" },
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

            {/* Enhanced Medicines Section */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-lg">
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-200">
                <div className="bg-purple-700 p-3 rounded-xl text-white shadow-sm">
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
                      d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                    ></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Medication Management
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Prescribe medications and dosage instructions
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {selectedMedicines.map((med, index) => (
                  <div
                    key={index}
                    className="group relative p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1 grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <span className="text-purple-700">•</span>
                            Medication
                          </label>
                          <Select
                          options={medicines}
                          className="react-select-container"
                          classNamePrefix="react-select"
                          onChange={(e) => {
                            const updated = [...selectedMedicines];
                            updated[index].medicine_id = e.value;
                            setSelectedMedicines(updated);
                          }}
                          styles={customSelectStyles}
                        />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <span className="text-purple-700">•</span>
                            Frequency
                          </label>
                          <Select
                          options={predefinedInstructions}
                          className="react-select-container"
                          classNamePrefix="react-select"
                          onChange={(e) => {
                            const updated = [...selectedMedicines];
                            updated[index].frequency_en = e.value;
                            setSelectedMedicines(updated);
                          }}
                          styles={customSelectStyles}
                        />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <span className="text-purple-700">•</span>
                            Dosage
                          </label>
                          <input
                            type="text"
                            value={med.dosage}
                            onChange={(e) => {
                              const updated = [...selectedMedicines];
                              updated[index].dosage = e.target.value;
                              setSelectedMedicines(updated);
                            }}
                            className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2.5 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
                            placeholder="e.g., 500mg"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          const updated = [...selectedMedicines];
                          updated.splice(index, 1);
                          setSelectedMedicines(updated);
                        }}
                        className="text-gray-400 hover:text-red-600 transition-colors p-2 -mt-2"
                      >
                        <AiOutlineCloseCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() =>
                    setSelectedMedicines([...selectedMedicines, {}])
                  }
                  className="w-full mt-4 flex items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-600 hover:border-purple-500 hover:bg-purple-50 hover:text-purple-700 transition-all duration-200 p-5"
                >
                  <AiOutlinePlus className="w-6 h-6" />
                  <span className="font-medium">Add New Medication</span>
                </button>
              </div>
            </div>

            {/* Enhanced Final Button */}
            <button
              onClick={submitConsultation}
              disabled={isSubmitting}
              className="w-full py-5 bg-gradient-to-r from-green-700 to-teal-700 text-white font-semibold rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-[1.005] active:scale-[0.98] group relative overflow-hidden isolate"
            >
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />

              {/* Main content */}
              <div className="relative flex items-center justify-center gap-3">
                <AiOutlineCheckCircle className="w-7 h-7 text-white/90 group-hover:text-white transition-colors duration-200" />
                <span className="text-lg tracking-wide font-medium">
                  Finalize Consultation
                </span>

                {/* Loading overlay */}
                {isSubmitting && (
                  <div className="absolute inset-0 bg-green-950/90 backdrop-blur-sm flex items-center justify-center rounded-xl">
                    {/* Modern spinner */}
                    <div className="animate-spin size-8 border-4 border-white/20 border-t-white rounded-full" />
                  </div>
                )}

                {/* Progress bar */}
                {isSubmitting && (
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-green-900/30 overflow-hidden">
                    <div className="h-full bg-white/90 animate-progress origin-left" />
                  </div>
                )}
              </div>
            </button>
          </div>
        ) : (
          showAddPatient && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-600 p-2 rounded-lg text-white">📝</div>
                <h3 className="text-lg font-semibold text-gray-800">
                  New Patient Registration
                </h3>
              </div>
              <form
                onSubmit={handlePatientSubmit(addPatient)}
                className="grid grid-cols-2 gap-4"
              >
                {[
                  { name: "name", label: "Full Name" },
                  { name: "age", label: "Age", type: "number" },
                  { name: "mobile", label: "Mobile Number" },
                ].map((field) => (
                  <div key={field.name} className="space-y-1">
                    <label className="text-sm font-medium text-gray-600">
                      {field.label}
                    </label>
                    <input
                      {...registerPatient(field.name)}
                      type={field.type || "text"}
                      className="w-full rounded-lg border-2 border-gray-100 p-3 shadow-sm focus:border-blue-400 focus:ring-4 focus:ring-blue-50/50 transition-all"
                    />
                  </div>
                ))}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-600">
                    Gender
                  </label>
                  <select
                    {...registerPatient("gender")}
                    className="w-full rounded-lg border-2 border-gray-100 p-3 shadow-sm focus:border-blue-400 focus:ring-4 focus:ring-blue-50/50 transition-all"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="col-span-2 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all"
                >
                  📥 Register New Patient
                </button>
              </form>
              <div className="mt-4 space-y-2">
                {Object.values(patientErrors).map((error, index) => (
                  <p
                    key={index}
                    className="text-sm text-red-600 flex items-center gap-2"
                  >
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

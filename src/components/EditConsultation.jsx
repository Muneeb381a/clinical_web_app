import { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaTimes,
  FaUser,
  FaStethoscope,
  FaFlask,
  FaHeartbeat,
  FaBrain,
  FaPills,
  FaNotesMedical,
  FaSpinner,
  FaPrint,
  FaPlus,
  FaTrash,
  FaThermometerHalf,
  FaTint,
} from "react-icons/fa";
import { SiOxygen } from "react-icons/si";
import NeuroExamSelect from "./NeuroExamSelect";
import SymptomsSelector from "./SymptomsSelector";
import TestsSelector from "./TestsSelector";
import { motion } from "framer-motion";

const safeRequest = async (url, options = {}) => {
  try {
    const response = await axios({
      url,
      timeout: 10000,
      ...options,
    });
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

const FormField = ({ label, placeholder, value, onChange, urdu = false }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <input
      type="text"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full p-2 border rounded-md ${urdu ? "font-urdu" : ""}`}
      dir={urdu ? "rtl" : "ltr"}
    />
  </div>
);

const SelectField = ({ label, value, onChange, options, urdu = false }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full p-2 border rounded-lg ${urdu ? "font-urdu" : ""}`}
      dir={urdu ? "rtl" : "ltr"}
    >
      <option value="">{urdu ? "تعدد منتخب کریں" : "Select Option"}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

const EditConsultation = () => {
  const { patientId, consultationId } = useParams();
  const navigate = useNavigate();
  const [editFormData, setEditFormData] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [error, setError] = useState("");
  const [allSymptoms, setAllSymptoms] = useState([]);
  const [allTests, setAllTests] = useState([]);
  const [allMedicines, setAllMedicines] = useState([]);
  const [symptomsError, setSymptomsError] = useState(null);
  const [testsError, setTestsError] = useState(null);

  const handleBloodPressureChange = (value, index) => {
    // Allow any input but sanitize
    const sanitized = value
      .replace(/[^0-9/]/g, '') // Remove non-numeric characters except /
      .replace(/(\/.*)\//, '$1'); // Prevent multiple slashes
    updateVitalSign(index, 'blood_pressure', sanitized);
  };
  
  const handleNumberChange = (value, index, field, min, max) => {
    // Allow empty or numeric values
    if (value === '' || (!isNaN(value) && !isNaN(parseFloat(value)))) {
      updateVitalSign(index, field, value);
    }
  };

  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;
  
    const createNewVitalSign = () => ({
      blood_pressure: "",
      pulse_rate: "",
      temperature: "",
      spo2_level: "",
      nihss_score: "",
      fall_assessment: "Done",
      recorded_at: new Date().toISOString(),
    });
  
    const processItems = (items, reference, key) => {
      if (!items || !Array.isArray(items)) return [];
      const processed = items
        .map((item) => {
          if (!item) return null;
          if (typeof item === "string" || typeof item === "number") {
            const found = reference.find((r) => r && r.id === item);
            return found ? found.id : null;
          } else if (typeof item === "object" && item[key]) {
            const found = reference.find((r) => r && r[key] === item[key]);
            return found ? found.id : null;
          }
          return null;
        })
        .filter(Boolean);
      console.log(`Processed ${key} items:`, processed);
      return processed;
    };
  
    const fetchData = async () => {
      try {
        setEditLoading(true);
        setError(null);
        setSymptomsError(null);
        setTestsError(null);
  
        const { data: consultationData, error: consultationError } = await safeRequest(
          `https://patient-management-backend-nine.vercel.app/api/patients/${patientId}/consultations/${consultationId}`,
          { signal: abortController.signal }
        );
        if (!consultationData || consultationError) {
          throw new Error(consultationError?.message || "Consultation not found");
        }
        console.log("Raw Consultation Tests:", consultationData.tests);
  
        const [
          { data: symptomsData, error: symptomsError },
          { data: testsData, error: testsError },
          { data: medicinesData, error: medicinesError },
        ] = await Promise.all([
          safeRequest("https://patient-management-backend-nine.vercel.app/api/symptoms", { signal: abortController.signal }),
          safeRequest("https://patient-management-backend-nine.vercel.app/api/tests", { signal: abortController.signal }),
          safeRequest("https://patient-management-backend-nine.vercel.app/api/medicines", { signal: abortController.signal }),
        ]);
  
        if (symptomsError) setSymptomsError("Couldn't load symptoms list");
        if (testsError) setTestsError("Couldn't load tests list");
        if (medicinesError) console.error("Medicines load error:", medicinesError);
  
        if (isMounted) {
          const referenceData = {
            symptoms: symptomsData ? symptomsData.filter((s) => s != null) : [],
            tests: testsData ? testsData.filter((t) => t != null) : [],
            medicines: medicinesData ? medicinesData.filter((m) => m != null) : [],
          };
          console.log("Reference Tests:", referenceData.tests);
  
          const prescriptions = consultationData.prescriptions || [];
          const tests = consultationData.tests || [];
          const follow_ups = consultationData.follow_ups || [];
  
          setAllSymptoms(referenceData.symptoms);
          setAllTests(referenceData.tests);
          setAllMedicines(referenceData.medicines);
  
          setEditFormData({
            ...consultationData,
            symptoms: processItems(consultationData.symptoms || [], referenceData.symptoms, "name"),
            tests: processItems(consultationData.tests || [], referenceData.tests, "test_name"),
            diagnosis: consultationData.neuro_diagnosis || "",
            treatment_plan: consultationData.neuro_treatment_plan || "",
            // ... (rest of fields unchanged)
            prescriptions: prescriptions.map((pres) => ({
              medicine_id: referenceData.medicines.find((m) => m && m.id === pres.medicine_id)?.id || pres.medicine_id || "",
              dosage_en: pres.dosage_en || "",
              dosage_urdu: pres.dosage_urdu || "",
              frequency_en: pres.frequency_en || "",
              frequency_urdu: pres.frequency_urdu || "",
              duration_en: pres.duration_en || "",
              duration_urdu: pres.duration_urdu || "",
              instructions_en: pres.instructions_en || "",
              instructions_urdu: pres.instructions_urdu || "",
              how_to_take_en: pres.how_to_take_en || "",
              how_to_take_urdu: pres.how_to_take_urdu || "",
              prescribed_at: pres.prescribed_at || new Date().toISOString(),
            })),
            vital_signs: consultationData.vital_signs?.length
              ? consultationData.vital_signs
              : [createNewVitalSign()],
            follow_ups: follow_ups.map((f) => ({
              follow_up_date: f.follow_up_date || "",
              notes: f.notes || "",
            })),
          });
        }
      } catch (error) {
        if (isMounted && !axios.isCancel(error)) {
          setError(error.message);
          console.error("Fetch error:", error);
        }
      } finally {
        if (isMounted) setEditLoading(false);
      }
    };
  
    fetchData();
  
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [patientId, consultationId]);

  const handleFormChange = (field, value) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addMedicine = () => {
    setEditFormData((prev) => ({
      ...prev,
      prescriptions: [
        ...(prev.prescriptions || []),
        {
          medicine_id: "",
          dosage_en: "",
          dosage_urdu: "",
          frequency_en: "",
          frequency_urdu: "",
          duration_en: "",
          duration_urdu: "",
          instructions_en: "",
          instructions_urdu: "",
          how_to_take_en: "",
          how_to_take_urdu: "",
          prescribed_at: new Date().toISOString(),
        },
      ],
    }));
  };

  const addVitalSign = () => {
    setEditFormData((prev) => ({
      ...prev,
      vital_signs: [
        ...(prev.vital_signs || []),
        {
          blood_pressure: "",
          pulse_rate: "",
          temperature: "",
          spo2_level: "",
          nihss_score: "",
          fall_assessment: "Done",
          recorded_at: new Date().toISOString(),
        },
      ],
    }));
  };

  const addFollowUp = () => {
    setEditFormData((prev) => ({
      ...prev,
      follow_ups: [
        ...(prev.follow_ups || []),
        {
          follow_up_date: "",
          notes: "",
        },
      ],
    }));
  };

  const updateField = (section, index, field, value) => {
    const newData = [...(editFormData[section] || [])];
    newData[index][field] = value;
    setEditFormData((prev) => ({ ...prev, [section]: newData }));
  };


  const updateVitalSign = (index, field, value) => {
    setEditFormData(prev => {
      const newVitalSigns = [...prev.vital_signs];
      newVitalSigns[index] = {
        ...newVitalSigns[index],
        [field]: value
      };
      return { ...prev, vital_signs: newVitalSigns };
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setEditLoading(true);

      const payload = {
        ...editFormData,
        patient_id: Number(patientId),
        consultation_id: Number(consultationId),
        tests: editFormData.tests,
        prescriptions: editFormData.prescriptions.map((pres) => ({
          ...pres,
          medicine_id: pres.medicine_id || null,
        })),
        follow_ups:
          editFormData.follow_ups?.map((f) => ({
            follow_up_date: f.follow_up_date,
            notes: f.notes || null,
          })) || [],
      };

      const cleanedPayload = Object.fromEntries(
        Object.entries(payload).filter(
          ([_, v]) => v !== null && v !== undefined
        )
      );
      if (cleanedPayload.follow_ups) {
        const invalidFollowUp = cleanedPayload.follow_ups.find(
          (f) => !f.follow_up_date
        );
        if (invalidFollowUp) {
          setError("All follow-ups must have a date");
          return;
        }
      }

      console.log("Submitting payload:", cleanedPayload);

      const response = await axios.put(
        `https://patient-management-backend-nine.vercel.app/api/patients/consultations/${consultationId}`,
        cleanedPayload,
        {
          validateStatus: (status) => status < 500,
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.status === 400) {
        throw new Error(response.data.message || "Validation failed");
      }

      // Only handle print and navigation on successful update
      if (response.status >= 200 && response.status < 300) {
        handlePrint();
        navigate(`/`);
      }
    } catch (error) {
      console.error("Update error:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "Update failed. Please check your input."
      );
      if (error.response?.data?.code === "22P02") {
        setError("Invalid data format. Please check numeric fields.");
      }
    } finally {
      setEditLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/`);
  };

  const handlePrint = () => {
    const printUrl = `https://patient-management-backend-nine.vercel.app/api/patients/${patientId}/consultations/${consultationId}/print`;
    const printWindow = window.open(printUrl, "_blank");
    if (!printWindow) {
      alert("Pop-up blocked! Allow pop-ups for this site.");
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 w-full max-w-6xl max-h-[90vh] mx-auto mt-10">
      {editLoading && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          >
            <FaSpinner className="w-12 h-12 text-blue-600" />
          </motion.div>
          <p className="text-lg font-medium text-gray-700 ml-4">Searching...</p>
        </div>
      )}
      {error && <div className="text-red-600 mb-4">{error}</div>}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Edit Consultation</h2>
        <button
          onClick={handleCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          <FaTimes className="text-2xl" />
        </button>
      </div>

      {editFormData ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FaUser className="text-blue-500" />
              Patient Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Name"
                value={editFormData.patient_name}
                onChange={(val) => handleFormChange("patient_name", val)}
              />
              <FormField
                label="Mobile"
                value={editFormData.mobile}
                onChange={(val) => handleFormChange("mobile", val)}
              />
            </div>
          </div>
          {/* Vital Signs Section */}
          <div className="bg-gray-50 p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-3">
                <FaHeartbeat
                  className="text-red-500 text-xl"
                  aria-hidden="true"
                />
                Vital Signs
              </h3>
            </div>

            {editFormData.vital_signs?.map((vital, index) => (
              <div
                key={`vital-${vital.recorded_at}-${index}`}
                className="mb-4 p-4 bg-white rounded-lg border border-gray-200 shadow-xs"
              >
                <div className="grid grid-cols-1 md:grid-cols-6 gap-x-4 gap-y-4">
                  <FormField
                    label="Blood Pressure (mmHg)"
                    placeholder="120/80"
                    value={vital.blood_pressure || ""}
                    onChange={(val) => handleBloodPressureChange(val, index)}
                    type="text"
                    inputClassName="text-center"
                    icon={
                      <FaTint className="text-gray-400" aria-hidden="true" />
                    }
                    pattern="^\d{2,3}\/\d{2,3}$"
                    errorMessage="Please use format 120/80"
                  />

                  <FormField
                   label="Pulse Rate (bpm)"
                   placeholder="e.g., 72"
                   value={vital.pulse_rate || ""}
                   onChange={(val) => handleNumberChange(val, index, 'pulse_rate', 30, 200)}
                   type="number"
                   inputClassName="text-center"
                    icon={
                      <FaHeartbeat
                        className="text-gray-400"
                        aria-hidden="true"
                      />
                    }
                    min="30"
                    max="200"
                  />

                  <FormField
                    label="Temperature (°C)"
                    placeholder="36.5"
                    value={vital.temperature || ""}
                    onChange={(val) => handleNumberChange(val, index, 'temperature', 35, 42)}
                    type="number"
                    step="0.1"
                    inputClassName="text-center"
                    icon={
                      <FaThermometerHalf
                        className="text-gray-400"
                        aria-hidden="true"
                      />
                    }
                    min="35"
                    max="42"
                  />

                  <FormField
                   label="SpO2 (%)"
                   placeholder="98"
                   value={vital.spo2_level || ""}
                   onChange={(val) => handleNumberChange(val, index, 'spo2_level', 70, 100)}
                   type="number"
                   inputClassName="text-center"
                    icon={
                      <SiOxygen className="text-gray-400" aria-hidden="true" />
                    }
                    min="70"
                    max="100"
                  />

                  {/* Additional Fields */}
                  <FormField
                    label="NIHSS Score"
                    placeholder="0-42"
                    value={vital.nihss_score}
                    onChange={(val) =>
                      handleNumberChange(val, index, "nihss_score", 0, 42)
                    }
                    type="number"
                    min="0"
                    max="42"
                  />

                  <FormField
                    label="Fall Assessment Risk"
                    value={vital.fall_assessment}
                    onChange={(val) =>
                      updateField("vital_signs", index, "fall_assessment", val)
                    }
                    type="select"
                    options={["Done", "Not Done"]}
                  />
                </div>
              </div>
            ))}
          </div>
          {/* Tests Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FaFlask className="text-purple-500" />
              Tests
            </h3>
            {testsError ? (
              <p className="text-red-600">{testsError}</p>
            ) : (
              <TestsSelector
                allTests={allTests}
                selectedTests={editFormData?.tests || []}
                onSelect={(selected) => handleFormChange("tests", selected)}
                onRemove={(testId) =>
                  handleFormChange(
                    "tests",
                    editFormData.tests.filter((t) => t !== testId)
                  )
                }
              />
            )}
          </div>
          {/* Symptoms Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FaStethoscope className="text-green-500" />
              Symptoms
            </h3>
            <SymptomsSelector
              allSymptoms={allSymptoms}
              selectedSymptoms={editFormData.symptoms || []}
              onSelect={(selectedIds) =>
                handleFormChange("symptoms", [...new Set(selectedIds)])
              }
              onRemove={(removedId) =>
                handleFormChange(
                  "symptoms",
                  editFormData.symptoms.filter((id) => id !== removedId)
                )
              }
            />
          </div>
          {/* Neurological Examination Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <FaBrain className="text-purple-600" />
              Neurological Examination
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <NeuroExamSelect
                field="motor_function"
                value={editFormData.motor_function || ""}
                onChange={handleFormChange}
              />
              <NeuroExamSelect
                field="muscle_tone"
                value={editFormData.muscle_tone || ""}
                onChange={handleFormChange}
              />
              <NeuroExamSelect
                field="muscle_strength"
                value={editFormData.muscle_strength || ""}
                onChange={handleFormChange}
              />
              <NeuroExamSelect
                field="coordination"
                value={editFormData.coordination || ""}
                onChange={handleFormChange}
              />
              <NeuroExamSelect
                field="deep_tendon_reflexes"
                value={editFormData.deep_tendon_reflexes || ""}
                onChange={handleFormChange}
              />
              <NeuroExamSelect
                field="gait_assessment"
                value={editFormData.gait_assessment || ""}
                onChange={handleFormChange}
              />

              <NeuroExamSelect
                field="cranial_nerves"
                value={editFormData.cranial_nerves || ""}
                onChange={handleFormChange}
              />
              <NeuroExamSelect
                field="romberg_test"
                value={editFormData.romberg_test || ""}
                onChange={handleFormChange}
              />
              <NeuroExamSelect
                field="plantar_reflex"
                value={editFormData.plantar_reflex || ""}
                onChange={handleFormChange}
              />
              <NeuroExamSelect
                field="straight_leg_raise_left"
                value={editFormData.straight_leg_raise_left || ""}
                onChange={handleFormChange}
              />
              <NeuroExamSelect
                field="straight_leg_raise_right"
                value={editFormData.straight_leg_raise_right || ""}
                onChange={handleFormChange}
              />
              <NeuroExamSelect
                field="speech_assessment"
                value={editFormData.speech_assessment || ""}
                onChange={handleFormChange}
              />
              <NeuroExamSelect
                field="pupillary_reaction"
                value={editFormData.pupillary_reaction || ""}
                onChange={handleFormChange}
              />
              <NeuroExamSelect
                field="sensory_examination"
                value={editFormData.sensory_examination || ""}
                onChange={handleFormChange}
              />
              <NeuroExamSelect
                field="cranial_nerves"
                value={editFormData.cranial_nerves || ""}
                onChange={handleFormChange}
              />
              <NeuroExamSelect
                field="mental_status"
                value={editFormData.mental_status || ""}
                onChange={handleFormChange}
              />
              <NeuroExamSelect
                field="cerebellar_function"
                value={editFormData.cerebellar_function || ""}
                onChange={handleFormChange}
              />
              <NeuroExamSelect
                field="muscle_wasting"
                value={editFormData.muscle_wasting || ""}
                onChange={handleFormChange}
              />
              <NeuroExamSelect
                field="abnormal_movements"
                value={editFormData.abnormal_movements || ""}
                onChange={handleFormChange}
              />
              <NeuroExamSelect
                field="nystagmus"
                value={editFormData.nystagmus || ""}
                onChange={handleFormChange}
              />
              <NeuroExamSelect
                field="fundoscopy"
                value={editFormData.fundoscopy || ""}
                onChange={handleFormChange}
              />
            </div>
            <div className="flex flex-col gap-4 w-full">
              {/* Checkboxes Container */}
              <div className="w-full flex flex-wrap p-2 bg-white rounded-xl border border-gray-200 shadow-sm">
                {[
                  { key: "brudzinski_sign", label: "Brudzinski's" },
                  { key: "kernig_sign", label: "Kernig's" },
                  { key: "temperature_sensation", label: "Temp Sense" },
                  { key: "pain_sensation", label: "Pain Sense" },
                  { key: "vibration_sense", label: "Vibration" },
                  { key: "proprioception", label: "Proprioception" },
                  { key: "facial_sensation", label: "Facial" },
                  { key: "swallowing_function", label: "Swallowing" },
                ].map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex items-center gap-1 p-2 rounded-md hover:bg-gray-50 transition-colors flex-1 min-w-[180px] max-w-[200px]"
                  >
                    <input
                      type="checkbox"
                      checked={editFormData[key] || false}
                      onChange={(e) => handleFormChange(key, e.target.checked)}
                      className="form-checkbox h-4 w-4 text-purple-500 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700 truncate">
                      {label}
                    </span>
                  </label>
                ))}
              </div>

              {/* Form Fields */}
              <div className="w-full flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-1/2">
                  <FormField
                    label="MMSE Score (0-30)"
                    placeholder="e.g., 28"
                    value={editFormData?.mmse_score || ""}
                    onChange={(val) => handleFormChange("mmse_score", val)}
                  />
                </div>
                <div className="w-full md:w-1/2">
                  <FormField
                    label="GCS Score (3-15)"
                    placeholder="e.g., 15"
                    value={editFormData?.gcs_score || ""}
                    onChange={(val) => handleFormChange("gcs_score", val)}
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Treatment Plan
                </label>
                <textarea
                  value={editFormData.treatment_plan || ""}
                  onChange={(e) =>
                    handleFormChange("treatment_plan", e.target.value)
                  }
                  className="w-full p-3 border rounded-lg"
                  rows="3"
                  placeholder="Additional examination findings..."
                />
              </div>
            </div>
          </div>
          {/* Prescriptions Section */}
          <div className="bg-gray-50 p-6 rounded-xl shadow-sm">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800">
              <FaPills className="text-purple-600 w-6 h-6" />
              Prescription
            </h3>

            {editFormData.prescriptions?.map((med, index) => (
              <div
                key={index}
                className="mb-5 p-5 bg-white rounded-xl border border-gray-200 shadow-xs hover:shadow-sm transition-shadow"
              >
                <div className="grid grid-cols-1 md:grid-cols-6 gap-2 items-start">
                  {/* Medicine Selection */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Medication Selection
                    </label>
                    <select
                      value={med.medicine_id || ""}
                      onChange={(e) =>
                        updateField(
                          "prescriptions",
                          index,
                          "medicine_id",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    >
                      <option value="" className="text-gray-400">
                        Choose Medication
                      </option>
                      {allMedicines.map((medicine) => (
                        <option
                          key={medicine.id}
                          value={medicine.id}
                          className="text-gray-700"
                        >
                          {medicine.brand_name}
                          {medicine.strength && ` (${medicine.strength})`}
                          {medicine.generic_name &&
                            ` - ${medicine.generic_name}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Dosage Field */}
                  <div className="md:col-span-1">
                    <SelectField
                      label="Dosage (Urdu)"
                      value={med.dosage_urdu}
                      onChange={(val) =>
                        updateField("prescriptions", index, "dosage_urdu", val)
                      }
                      options={[
                        {
                          value: "ایک چوتھائی گولی",
                          label: "ایک چوتھائی گولی",
                        },
                        { value: "آدھی گولی", label: "آدھی گولی" },
                        {
                          value: "شدید سر درد کے لیے",
                          label: "شدید سر درد کے لیے",
                        },
                        {
                          value: "تین چوتھائی گولی",
                          label: "تین چوتھائی گولی",
                        },
                        { value: "ایک گولی", label: "ایک گولی" },
                        { value: "ڈیڑھ گولی", label: "ڈیڑھ گولی" },
                        { value: "دو گولیاں", label: "دو گولیاں" },
                        { value: "ڈھائی گولیاں", label: "ڈھائی گولیاں" },
                        { value: "تین گولیاں", label: "تین گولیاں" },
                        {
                          value: "ساڑھے تین گولیاں",
                          label: "ساڑھے تین گولیاں",
                        },
                        { value: "چار گولیاں", label: "چار گولیاں" },
                        { value: "پانچ گولیاں", label: "پانچ گولیاں" },
                        { value: "چھ گولیاں", label: "چھ گولیاں" },
                        { value: "سات گولیاں", label: "سات گولیاں" },
                        { value: "آٹھ گولیاں", label: "آٹھ گولیاں" },
                        { value: "دس گولیاں", label: "دس گولیاں" },
                        { value: "آدھا چمچ", label: "آدھا چمچ" },
                        { value: "ایک چمچ", label: "ایک چمچ" },
                        { value: "ڈیڑھ چمچ", label: "ڈیڑھ چمچ" },
                        { value: "دو چمچ", label: "دو چمچ" },
                        { value: "تین چمچ", label: "تین چمچ" },
                        { value: "ڈھائی ملی لیٹر", label: "ڈھائی ملی لیٹر" },
                        { value: "پانچ ملی لیٹر", label: "پانچ ملی لیٹر" },
                        {
                          value: "ساڑھے سات ملی لیٹر",
                          label: "ساڑھے سات ملی لیٹر",
                        },
                        { value: "دس ملی لیٹر", label: "دس ملی لیٹر" },
                        { value: "پندرہ ملی لیٹر", label: "پندرہ ملی لیٹر" },
                        { value: "بیس ملی لیٹر", label: "بیس ملی لیٹر" },
                        { value: "پچیس ملی لیٹر", label: "پچیس ملی لیٹر" },
                        { value: "تیس ملی لیٹر", label: "تیس ملی لیٹر" },
                        { value: "ایک قطرہ", label: "ایک قطرہ" },
                        { value: "دو قطرے", label: "دو قطرے" },
                        { value: "تین قطرے", label: "تین قطرے" },
                        { value: "پانچ قطرے", label: "پانچ قطرے" },
                        { value: "دس قطرے", label: "دس قطرے" },
                        { value: "آدھا ٹیکہ", label: "آدھا ٹیکہ" },
                        { value: "ایک ٹیکہ", label: "ایک ٹیکہ" },
                        { value: "دو ٹیکے", label: "دو ٹیکے" },
                        { value: "تین ٹیکے", label: "تین ٹیکے" },
                        { value: "آدھا ساشے", label: "آدھا ساشے" },
                        { value: "ایک ساشے", label: "ایک ساشے" },
                        { value: "دو ساشے", label: "دو ساشے" },
                        { value: "تین ساشے", label: "تین ساشے" },
                        { value: "ضرورت کے مطابق", label: "ضرورت کے مطابق" },
                        { value: "کھانے سے پہلے", label: "کھانے سے پہلے" },
                        { value: "کھانے کے بعد", label: "کھانے کے بعد" },
                        { value: "ہر 6 گھنٹے بعد", label: "ہر 6 گھنٹے بعد" },
                        { value: "ہر 8 گھنٹے بعد", label: "ہر 8 گھنٹے بعد" },
                        { value: "ہر 12 گھنٹے بعد", label: "ہر 12 گھنٹے بعد" },
                        { value: "دن میں ایک بار", label: "دن میں ایک بار" },
                        { value: "دن میں دو بار", label: "دن میں دو بار" },
                        { value: "دن میں تین بار", label: "دن میں تین بار" },
                        { value: "دن میں چار بار", label: "دن میں چار بار" },
                      ]}
                      urdu
                      selectClassName="px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-lg direction-rtl hover:border-gray-300 transition-colors"
                    />
                  </div>

                  {/* Frequency Field */}
                  <div className="md:col-span-1">
                    <SelectField
                      label="Frequency (Urdu)"
                      value={med.frequency_urdu}
                      onChange={(val) =>
                        updateField(
                          "prescriptions",
                          index,
                          "frequency_urdu",
                          val
                        )
                      }
                      options={[
                        { label: "صبح", value: "صبح" },
                        { label: "دوپہر", value: "دوپہر" },
                        { label: "شام", value: "شام" },
                        { label: "رات", value: "رات" },
                        { label: "صبح، شام", value: "صبح، شام" },
                        { label: "صبح، رات", value: "صبح، رات" },
                        { label: "دوپہر، شام", value: "دوپہر، شام" },
                        { label: "دوپہر، رات", value: "دوپہر، رات" },
                        { label: "صبح، شام، رات", value: "صبح، شام، رات" },
                        { label: "صبح، دوپہر، شام", value: "صبح، دوپہر، شام" },
                        { label: "حسب ضرورت", value: "حسب ضرورت" },
                        { label: "صبح، دوپہر، رات", value: "صبح، دوپہر، رات" },
                        { label: "دوپہر، شام، رات", value: "دوپہر، شام، رات" },
                        { label: "صبح سویرے", value: "صبح سویرے" },
                        { label: "دیر صبح", value: "دیر صبح" },
                        { label: "دیر دوپہر", value: "دیر دوپہر" },
                        { label: "غروب آفتاب", value: "غروب آفتاب" },
                        { label: "آدھی رات", value: "آدھی رات" },
                        { label: "رات دیر گئے", value: "رات دیر گئے" },
                        { label: "صبح، دوپہر", value: "صبح، دوپہر" },
                        { label: "شام، رات", value: "شام، رات" },
                        { label: "صبح سویرے، رات", value: "صبح سویرے، رات" },
                        { label: "صبح، دیر دوپہر", value: "صبح، دیر دوپہر" },
                        {
                          label: "دوپہر، غروب آفتاب",
                          value: "دوپہر، غروب آفتاب",
                        },
                        { label: "پورا دن", value: "پورا دن" },
                        { label: "پوری رات", value: "پوری رات" },
                        { label: "چوبیس گھنٹے", value: "چوبیس گھنٹے" },
                      ]}
                      urdu
                      selectClassName="px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-lg direction-rtl hover:border-gray-300 transition-colors"
                    />
                  </div>

                  {/* Duration Field */}
                  <div className="md:col-span-1">
                    <SelectField
                      label="Duration (Urdu)"
                      value={med.duration_urdu}
                      onChange={(val) =>
                        updateField(
                          "prescriptions",
                          index,
                          "duration_urdu",
                          val
                        )
                      }
                      options={[
                        { value: "ایک_دن", label: "ایک دن" },
                        { value: "دو_دن", label: "دو دن" },
                        { value: "تین_دن", label: "تین دن" },
                        { value: "چار_دن", label: "چار دن" },
                        { value: "پانچ_دن", label: "پانچ دن" },
                        { value: "چھ_دن", label: "چھ دن" },
                        { value: "ایک_ہفتہ", label: "ایک ہفتہ" },
                        { value: "آٹھ_دن", label: "آٹھ دن" },
                        { value: "نو_دن", label: "نو دن" },
                        { value: "دس_دن", label: "دس دن" },
                        { value: "گیارہ_دن", label: "گیارہ دن" },
                        { value: "بارہ_دن", label: "بارہ دن" },
                        { value: "تیرہ_دن", label: "تیرہ دن" },
                        { value: "پندرہ_دن", label: "پندرہ دن" },
                        { value: "بیس_دن", label: "بیس دن" },
                        { value: "پچیس_دن", label: "پچیس دن" },
                        { value: "ایک_مہینہ", label: "ایک مہینہ" },
                        { value: "دو_ہفتے", label: "دو ہفتے" },
                        { value: "تین_ہفتے", label: "تین ہفتے" },
                        { value: "چار_ہفتے", label: "چار ہفتے" },
                        { value: "چھ_ہفتے", label: "چھ ہفتے" },
                        { value: "دس_ہفتے", label: "دس ہفتے" },
                        { value: "تین_مہینے", label: "تین مہینے" },
                        { value: "نو_مہینے", label: "نو مہینے" },
                        { value: "بارہ_مہینے", label: "بارہ مہینے" },
                        { value: "ضرورت_کے_مطابق", label: "ضرورت کے مطابق" },
                        { value: "طویل_المدت", label: "طویل المدت" },
                        { value: "مختصر_المدت", label: "مختصر المدت" },
                      ]}
                      urdu
                      selectClassName="px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-lg direction-rtl hover:border-gray-300 transition-colors"
                    />
                  </div>

                  {/* Instructions Field */}
                  <div className="md:col-span-1">
                    <SelectField
                      label="Instructions (Urdu)"
                      value={med.instructions_urdu}
                      onChange={(val) =>
                        updateField(
                          "prescriptions",
                          index,
                          "instructions_urdu",
                          val
                        )
                      }
                      options={[
                        { value: "کھانے_سے_پہلے", label: "کھانے سے پہلے" },
                        { value: "کھانے_کے_ساتھ", label: "کھانے کے ساتھ" },
                        { value: "کھانے_کے_بعد", label: "کھانے کے بعد" },
                        { value: "خالی_پیٹ", label: "خالی پیٹ" },
                        { value: "ناشتے_سے_پہلے", label: "ناشتے سے پہلے" },
                        { value: "ناشتے_کے_بعد", label: "ناشتے کے بعد" },
                        {
                          value: "دوپہر_کے_کھانے_سے_پہلے",
                          label: "دوپہر کے کھانے سے پہلے",
                        },
                        {
                          value: "دوپہر_کے_کھانے_کے_بعد",
                          label: "دوپہر کے کھانے کے بعد",
                        },
                        {
                          value: "رات_کے_کھانے_سے_پہلے",
                          label: "رات کے کھانے سے پہلے",
                        },
                        {
                          value: "رات_کے_کھانے_کے_بعد",
                          label: "رات کے کھانے کے بعد",
                        },
                        { value: "دودھ_کے_ساتھ", label: "دودھ کے ساتھ" },
                        { value: "چائے_سے_پہلے", label: "چائے سے پہلے" },
                        { value: "چائے_کے_بعد", label: "چائے کے بعد" },
                        { value: "ضرورت_کے_مطابق", label: "ضرورت کے مطابق" },
                        { value: "پانی_کے_ساتھ", label: "پانی کے ساتھ" },
                        { value: "جوس_کے_ساتھ", label: "جوس کے ساتھ" },
                        { value: "دہی_کے_ساتھ", label: "دہی کے ساتھ" },
                        {
                          value: "چکنائی_والے_کھانے_کے_ساتھ",
                          label: "چکنائی والے کھانے کے ساتھ",
                        },
                        {
                          value: "ڈیری_مصنوعات_کے_بغیر",
                          label: "ڈیری مصنوعات کے بغیر",
                        },
                        { value: "کیفین_سے_پرہیز", label: "کیفین سے پرہیز" },
                      ]}
                      urdu
                      selectClassName="px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-lg direction-rtl hover:border-gray-300 transition-colors"
                    />
                  </div>

                  {/* Delete Button */}
                </div>
                <button
                  type="button"
                  onClick={() => removeMedicine(index)}
                  className="p-1 text-red-400 hover:text-red-600 transition-all rounded-full hover:bg-red-50 relative"
                >
                  <FaTrash className="w-5 h-5 transition-transform hover:scale-110" />
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Delete
                  </span>
                </button>
              </div>
            ))}

            {/* Add Medicine Button */}
            <div className="mt-6">
              <button
                type="button"
                onClick={addMedicine}
                className="w-full md:w-auto px-5 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-all flex items-center gap-2 justify-center font-semibold hover:shadow-md"
              >
                <FaPlus className="w-4 h-4" />
                <span>Add New Medication</span>
              </button>
            </div>
          </div>
          {/* Diagnosis and Treatment Plan */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FaNotesMedical className="text-teal-500" />
              Diagnosis
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <FormField
                label="Neurological Diagnosis"
                placeholder="e.g., Migraine"
                value={editFormData.diagnosis}
                onChange={(val) => handleFormChange("diagnosis", val)}
              />
            </div>
          </div>
          {/* // followup section */}
          {/* Add this section somewhere in your form */}
          <div className="bg-gray-50 p-4 rounded-lg mt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Follow-ups</h3>
              <button
                type="button"
                onClick={addFollowUp}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add Follow-up
              </button>
            </div>

            {editFormData.follow_ups?.map((followUp, index) => (
              <div
                key={index}
                className="bg-white p-4 rounded-lg mb-4 shadow-sm"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Follow-up Date
                    </label>
                    <input
                      type="date"
                      value={followUp.follow_up_date || ""}
                      onChange={(e) =>
                        updateField(
                          "follow_ups",
                          index,
                          "follow_up_date",
                          e.target.value
                        )
                      }
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Notes
                    </label>
                    <textarea
                      value={followUp.notes || ""}
                      onChange={(e) =>
                        updateField(
                          "follow_ups",
                          index,
                          "notes",
                          e.target.value
                        )
                      }
                      className="w-full p-2 border rounded"
                      rows="2"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newFollowUps = [...editFormData.follow_ups];
                    newFollowUps.splice(index, 1);
                    setEditFormData((prev) => ({
                      ...prev,
                      follow_ups: newFollowUps,
                    }));
                  }}
                  className="mt-2 text-red-500 hover:text-red-700 text-sm"
                >
                  Remove Follow-up
                </button>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editLoading}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
            >
              {editLoading ? "Saving..." : "Update Consultation"}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <FaPrint /> Print
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
};

export default EditConsultation;

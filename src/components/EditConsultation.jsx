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
  FaPlus,
  FaTrash,
} from "react-icons/fa";
import { motion } from "framer-motion";
import SymptomsSelector from "./SymptomsSelector";
import TestsSelector from "./TestsSelector";
import NeuroExamSelect from "./NeuroExamSelect";

const safeRequest = async (url, options = {}, retries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios({
        url,
        timeout: 15000,
        ...options,
      });
      return { data: response.data, error: null };
    } catch (error) {
      if (attempt === retries || axios.isCancel(error)) {
        return { data: null, error };
      }
      console.warn(
        `Attempt ${attempt} failed for ${url}: ${error.message}. Retrying...`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

const getCachedData = (key) => {
  try {
    const data = sessionStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

const setCachedData = (key, data) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn(`Failed to cache ${key}: ${error.message}`);
  }
};

const FormField = ({
  label,
  placeholder,
  value,
  onChange,
  urdu = false,
  type = "text",
  min,
  max,
}) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <input
      type={type}
      value={value ?? ""}
      onChange={(e) => {
        let newValue =
          type === "number" ? e.target.valueAsNumber || 0 : e.target.value;
        if (type === "number" && min !== undefined && newValue < min)
          newValue = min;
        if (type === "number" && max !== undefined && newValue > max)
          newValue = max;
        onChange(newValue);
      }}
      placeholder={placeholder}
      min={min}
      max={max}
      className={`w-full p-2 border rounded-lg bg-white focus:ring-2 focus:ring-teal-500 transition ${
        urdu ? "font-urdu text-right" : ""
      }`}
    />
  </div>
);

const CheckboxField = ({ label, checked, onChange }) => (
  <div className="mb-4 flex items-center">
    <input
      type="checkbox"
      checked={checked || false}
      onChange={(e) => onChange(e.target.checked)}
      className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
    />
    <label className="ml-2 block text-sm font-medium text-gray-700">
      {label}
    </label>
  </div>
);

const SelectField = ({ label, value, onChange, options, urdu = false }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full p-2 border rounded-lg bg-white focus:ring-2 focus:ring-teal-500 transition ${
        urdu ? "font-urdu text-right" : ""
      }`}
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

const dosageOptions = [
  { value: "0.25", label: "ایک چوتھائی گولی" },
  { value: "0.5", label: "آدھی گولی" },
  { value: "0.75", label: "تین چوتھائی گولی" },
  { value: "1", label: "ایک گولی" },
  { value: "1.5", label: "ڈیڑھ گولی" },
  { value: "2", label: "دو گولیاں" },
  { value: "3", label: "تین گولیاں" },
  { value: "4", label: "چار گولیاں" },
  { value: "5", label: "پانچ گولیاں" },
  { value: "1_capsule", label: "ایک کیپسول" },
  { value: "2_capsules", label: "دو کیپسول" },
  { value: "3_capsules", label: "تین کیپسول" },
  { value: "2.5_ml", label: "ڈھائی ملی لیٹر" },
  { value: "5_ml", label: "پانچ ملی لیٹر" },
  { value: "7.5_ml", label: "ساڑھے سات ملی لیٹر" },
  { value: "10_ml", label: "دس ملی لیٹر" },
  { value: "15_ml", label: "پندرہ ملی لیٹر" },
  { value: "20_ml", label: "بیس ملی لیٹر" },
  { value: "1_drop", label: "ایک قطرہ" },
  { value: "2_drops", label: "دو قطرے" },
  { value: "5_drops", label: "پانچ قطرے" },
  { value: "1_tsp", label: "ایک چائے کا چمچ" },
  { value: "2_tsp", label: "دو چائے کے چمچ" },
];

const dosageValueToLabel = {
  0.25: "ایک چوتھائی گولی",
  0.5: "آدھی گولی",
  0.75: "تین چوتھائی گولی",
  1: "ایک گولی",
  1.5: "ڈیڑھ گولی",
  2: "دو گولیاں",
  3: "تین گولیاں",
  4: "چار گولیاں",
  5: "پانچ گولیاں",
  "1_capsule": "ایک کیپسول",
  "2_capsules": "دو کیپسول",
  "3_capsules": "تین کیپسول",
  "2.5_ml": "ڈھائی ملی لیٹر",
  "5_ml": "پانچ ملی لیٹر",
  "7.5_ml": "ساڑھے سات ملی لیٹر",
  "10_ml": "دس ملی لیٹر",
  "15_ml": "پندرہ ملی لیٹر",
  "20_ml": "بیس ملی لیٹر",
  "1_drop": "ایک قطرہ",
  "2_drops": "دو قطرے",
  "5_drops": "پانچ قطرے",
  "1_tsp": "ایک چائے کا چمچ",
  "2_tsp": "دو چائے کے چمچ",
};

const frequencyOptions = [
  { value: "morning", label: "صبح" },
  { value: "evening", label: "شام" },
  { value: "once_a_day", label: "دن میں ایک بار" },
  { value: "twice_a_day", label: "دن میں دو بار" },
  { value: "three_times_a_day", label: "دن میں تین بار" },
  { value: "every_6_hours", label: "ہر چھ گھنٹے بعد" },
  { value: "as_needed", label: "ضرورت کے مطابق" },
];

const frequencyValueToLabel = {
  morning: "صبح",
  evening: "شام",
  once_a_day: "دن میں ایک بار",
  twice_a_day: "دن میں دو بار",
  three_times_a_day: "دن میں تین بار",
  every_6_hours: "ہر چھ گھنٹے بعد",
  as_needed: "ضرورت کے مطابق",
};

const durationOptions = [
  { value: "1_day", label: "ایک دن" },
  { value: "3_days", label: "تین دن" },
  { value: "5_days", label: "پانچ دن" },
  { value: "7_days", label: "سات دن" },
  { value: "7_days_alt", label: "ایک ہفتہ" },
  { value: "14_days", label: "چودہ دن" },
  { value: "21_days", label: "ایکویں دن" },
  { value: "30_days", label: "تیس دن" },
  { value: "30_days_alt", label: "ایک ماہ" },
];

const durationValueToLabel = {
  "1_day": "ایک دن",
  "3_days": "تین دن",
  "5_days": "پانچ دن",
  "7_days": "سات دن",
  "7_days_alt": "ایک ہفتہ",
  "14_days": "چودہ دن",
  "21_days": "ایکویں دن",
  "30_days": "تیس دن",
  "30_days_alt": "ایک ماہ",
};

const instructionsOptions = [
  { value: "before_meal", label: "کھانے سے پہلے" },
  { value: "after_meal", label: "کھانے کے بعد" },
  { value: "with_meal", label: "کھانے کے ساتھ" },
  { value: "with_water", label: "پانی کے ساتھ" },
  { value: "on_empty_stomach", label: "خالی پیٹ" },
  { value: "as_needed", label: "ضرورت کے مطابق" },
];

const instructionsValueToLabel = {
  before_meal: "کھانے سے پہلے",
  after_meal: "کھانے کے بعد",
  with_meal: "کھانے کے ساتھ",
  with_water: "پانی کے ساتھ",
  on_empty_stomach: "خالی پیٹ",
  as_needed: "ضرورت کے مطابق",
};

const EditConsultation = () => {
  const { patientId, consultationId } = useParams();
  const navigate = useNavigate();
  const [editFormData, setEditFormData] = useState(null);
  const [editLoading, setEditLoading] = useState(true);
  const [error, setError] = useState("");
  const [allSymptoms, setAllSymptoms] = useState(
    getCachedData("symptoms") || []
  );
  const [allTests, setAllTests] = useState(getCachedData("tests") || []);
  const [allMedicines, setAllMedicines] = useState(
    getCachedData("medicines") || []
  );
  const [symptomsError, setSymptomsError] = useState(null);
  const [testsError, setTestsError] = useState(null);
  const [prescriptionsError, setPrescriptionsError] = useState(null);

  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;

    const normalizeValue = (value, options, fieldType = null) => {
      if (!value) return "";

      const valueToLabelMaps = {
        dosage: dosageValueToLabel,
        frequency: frequencyValueToLabel,
        duration: durationValueToLabel,
        instructions: instructionsValueToLabel,
      };

      // Map English values to Urdu labels for prescription fields
      if (
        fieldType &&
        valueToLabelMaps[fieldType] &&
        value in valueToLabelMaps[fieldType]
      ) {
        return valueToLabelMaps[fieldType][value];
      }

      // Match by value or label
      const exactMatch = options.find(
        (opt) => opt.value === value || opt.label === value
      );
      if (exactMatch) return exactMatch.label; // Always return label for prescriptions

      const labelMatch = options.find(
        (opt) => opt.label === value || value.includes(opt.label)
      );
      if (labelMatch) return labelMatch.label;

      // Handle duration aliases
      if (fieldType === "duration") {
        const durationAliases = {
          "سات دن": "ایک ہفتہ",
          "1 ہفتہ": "ایک ہفتہ",
          "تیس دن": "ایک ماہ",
          "1 ماہ": "ایک ماہ",
        };
        if (value in durationAliases) return durationAliases[value];
      }

      // Handle Urdu labels already in data
      const urduMatch = options.find((opt) => opt.label === value);
      if (urduMatch) return urduMatch.label;

      console.warn(
        `No match for value "${value}" in options for ${fieldType}`,
        options
      );
      return "";
    };

    const mapSymptomsToIds = (symptoms, allSymptoms) => {
      if (!Array.isArray(symptoms)) return [];
      return symptoms
        .map((symptom) => {
          if (typeof symptom === "number") return symptom;
          if (typeof symptom === "string") {
            const match = allSymptoms.find(
              (s) => s.name.toLowerCase() === symptom.toLowerCase()
            );
            return match ? match.id : null;
          }
          return symptom.id || null;
        })
        .filter((id) => id !== null);
    };

    const createNewVitalSign = () => ({
      blood_pressure: "",
      pulse_rate: "",
      temperature: "",
      spo2_level: "",
      nihss_score: "",
      fall_assessment: "Done",
      recorded_at: new Date().toISOString(),
    });

    const fetchData = async () => {
      try {
        setEditLoading(true);
        setError(null);
        setSymptomsError(null);
        setTestsError(null);
        setPrescriptionsError(null);

        const { data: consultationData, error: consultationError } =
          await safeRequest(
            `https://patient-management-backend-nine.vercel.app/api/patients/${patientId}/consultations/${consultationId}`,
            { signal: abortController.signal }
          );
        if (!consultationData || consultationError) {
          throw new Error(
            consultationError?.message || "Consultation not found"
          );
        }
        console.log(
          "Raw Consultation Data:",
          JSON.stringify(consultationData, null, 2)
        );

        const cachedSymptoms = getCachedData("symptoms");
        const cachedTests = getCachedData("tests");
        const cachedMedicines = getCachedData("medicines");

        const [
          { data: symptomsData, error: symptomsError },
          { data: testsData, error: testsError },
          { data: medicinesData, error: medicinesError },
        ] = await Promise.all([
          cachedSymptoms
            ? Promise.resolve({ data: cachedSymptoms, error: null })
            : safeRequest(
                "https://patient-management-backend-nine.vercel.app/api/symptoms",
                { signal: abortController.signal }
              ),
          cachedTests
            ? Promise.resolve({ data: cachedTests, error: null })
            : safeRequest(
                "https://patient-management-backend-nine.vercel.app/api/tests",
                { signal: abortController.signal }
              ),
          cachedMedicines
            ? Promise.resolve({ data: cachedMedicines, error: null })
            : safeRequest(
                "https://patient-management-backend-nine.vercel.app/api/medicines",
                { signal: abortController.signal }
              ),
        ]);

        if (isMounted) {
          if (symptomsError) setSymptomsError("Couldn't load symptoms list");
          if (testsError) setTestsError("Couldn't load tests list");
          if (medicinesError)
            setError(
              "Couldn't load medicines list. Existing prescriptions will be displayed."
            );

          const referenceData = {
            symptoms: symptomsData ? symptomsData.filter(Boolean) : [],
            tests: testsData ? testsData.filter(Boolean) : [],
            medicines: medicinesData ? medicinesData.filter(Boolean) : [],
          };

          if (symptomsData && !cachedSymptoms)
            setCachedData("symptoms", symptomsData);
          if (testsData && !cachedTests) setCachedData("tests", testsData);
          if (medicinesData && !cachedMedicines)
            setCachedData("medicines", medicinesData);

          const prescriptions = consultationData.prescriptions || [];

          setAllSymptoms(referenceData.symptoms);
          setAllTests(referenceData.tests);
          setAllMedicines(referenceData.medicines);

          const newFormData = {
            ...consultationData,
            symptoms: mapSymptomsToIds(
              consultationData.symptoms || [],
              referenceData.symptoms
            ),
            rawSymptoms: consultationData.symptoms || [],
            tests: (consultationData.tests || [])
              .filter((t) => t && (t.test_id || t.id || typeof t === "number"))
              .map((t) => t.test_id || t.id || t),
            diagnosis: consultationData.neuro_diagnosis || "",
            treatment_plan: consultationData.neuro_treatment_plan || "",
            motor_function: consultationData.motor_function || "",
            muscle_tone: consultationData.muscle_tone || "",
            muscle_strength: consultationData.muscle_strength || "",
            coordination: consultationData.coordination || "",
            deep_tendon_reflexes: consultationData.deep_tendon_reflexes || "",
            gait_assessment: consultationData.gait_assessment || "",
            cranial_nerves: consultationData.cranial_nerves || "",
            romberg_test: consultationData.romberg_test || "",
            plantar_reflex: consultationData.plantar_reflex || "",
            straight_leg_raise_left:
              consultationData.straight_leg_raise_left || "",
            straight_leg_raise_right:
              consultationData.straight_leg_raise_right || "",
            pupillary_reaction: consultationData.pupillary_reaction || "",
            speech_assessment: consultationData.speech_assessment || "",
            sensory_examination: consultationData.sensory_examination || "",
            mental_status: consultationData.mental_status || "",
            cerebellar_function: consultationData.cerebellar_function || "",
            muscle_wasting: consultationData.muscle_wasting || "",
            abnormal_movements: consultationData.abnormal_movements || "",
            nystagmus: consultationData.nystagmus || "",
            fundoscopy: consultationData.fundoscopy || "",
            finger_nose_test: consultationData.finger_nose_test || "",
            heel_shin_test: consultationData.heel_shin_test || "",
            eye_movements: consultationData.eye_movements || "",
            straight_leg_raise_test:
              consultationData.straight_leg_raise_test || "",
            lasegue_test: consultationData.lasegue_test || "",
            cognitive_assessment: consultationData.cognitive_assessment || "",
            tremors: consultationData.tremors || "",
            involuntary_movements: consultationData.involuntary_movements || "",
            tongue_movement: consultationData.tongue_movement || "",
            brudzinski_sign: consultationData.brudzinski_sign || false,
            kernig_sign: consultationData.kernig_sign || false,
            temperature_sensation:
              consultationData.temperature_sensation || false,
            pain_sensation: consultationData.pain_sensation || false,
            vibration_sense: consultationData.vibration_sense || false,
            proprioception: consultationData.proprioception || false,
            facial_sensation: consultationData.facial_sensation || false,
            swallowing_function: consultationData.swallowing_function || false,
            mmse_score: consultationData.mmse_score || "",
            gcs_score: consultationData.gcs_score || "",
            notes: consultationData.notes || "",
            prescriptions: prescriptions
              .filter((p) => p)
              .map((pres) => ({
                medicine_id: pres.medicine_id || "",
                brand_name: pres.brand_name || "",
                dosage_urdu: normalizeValue(
                  pres.dosage_urdu,
                  dosageOptions,
                  true
                ),
                frequency_urdu: normalizeValue(
                  pres.frequency_urdu,
                  frequencyOptions
                ),
                duration_urdu: normalizeValue(
                  pres.duration_urdu,
                  durationOptions
                ),
                instructions_urdu: normalizeValue(
                  pres.instructions_urdu,
                  instructionsOptions
                ),
                prescribed_at: pres.prescribed_at || new Date().toISOString(),
              })),
            vital_signs: consultationData.vital_signs?.length
              ? consultationData.vital_signs
              : [createNewVitalSign()],
            follow_ups: (consultationData.follow_ups || []).map((f) => ({
              id: f.id || null,
              follow_up_date: f.follow_up_date
                ? new Date(f.follow_up_date).toISOString().split("T")[0]
                : "",
              notes: f.notes || "",
              created_at: f.created_at || new Date().toISOString(),
            })),
          };

          setEditFormData(newFormData);

          if (
            prescriptions.length > 0 &&
            newFormData.prescriptions.every(
              (p) =>
                !p.dosage_urdu &&
                !p.frequency_urdu &&
                !p.duration_urdu &&
                !p.instructions_urdu
            )
          ) {
            setPrescriptionsError(
              "No valid prescription values loaded (e.g., dosage, frequency)"
            );
          }
        }
      } catch (error) {
        if (isMounted && !axios.isCancel(error)) {
          setError(error.message || "Failed to load consultation data");
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
          brand_name: "",
          dosage_urdu: "",
          frequency_urdu: "",
          duration_urdu: "",
          instructions_urdu: "",
          prescribed_at: new Date().toISOString(),
        },
      ],
    }));
  };

  const removeMedicine = (index) => {
    setEditFormData((prev) => ({
      ...prev,
      prescriptions: prev.prescriptions.filter((_, i) => i !== index),
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
          created_at: new Date().toISOString(),
        },
      ],
    }));
  };

  const updateField = (section, index, field, value) => {
    setEditFormData((prev) => {
      const newData = [...(prev[section] || [])];
      newData[index] = { ...newData[index], [field]: value };
      return { ...prev, [section]: newData };
    });
  };

  const removeSymptom = (symptomId) => {
    setEditFormData((prev) => ({
      ...prev,
      symptoms: prev.symptoms.filter((id) => id !== symptomId),
    }));
  };

  const removeTest = (testId) => {
    setEditFormData((prev) => ({
      ...prev,
      tests: prev.tests.filter((id) => id !== testId),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setEditLoading(true);
      setError(null);
      setPrescriptionsError(null);

      const payload = {
        ...editFormData,
        patient_id: Number(patientId),
        consultation_id: Number(consultationId),
        tests: editFormData.tests,
        prescriptions: editFormData.prescriptions.map((pres) => ({
          medicine_id: pres.medicine_id || null,
          dosage_urdu: pres.dosage_urdu || null,
          frequency_urdu: pres.frequency_urdu || null,
          duration_urdu: pres.duration_urdu || null,
          instructions_urdu: pres.instructions_urdu || null,
          prescribed_at: pres.prescribed_at,
        })),
        follow_ups: editFormData.follow_ups.map((f) => ({
          follow_up_date: f.follow_up_date,
          notes: f.notes || null,
        })),
      };

      const cleanedPayload = Object.fromEntries(
        Object.entries(payload).filter(
          ([_, v]) => v !== null && v !== undefined
        )
      );
      console.log(
        "Submitting payload:",
        JSON.stringify(cleanedPayload, null, 2)
      );

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

      if (response.status >= 200 && response.status < 300) {
        handlePrint();
        navigate(`/patients/${patientId}`);
      }
    } catch (error) {
      console.error("Update error:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "Update failed. Please check your input."
      );
    } finally {
      setEditLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/patients/${patientId}`);
  };

  const handlePrint = () => {
    const printUrl = `https://patient-management-backend-nine.vercel.app/api/patients/${patientId}/consultations/${consultationId}/print`;
    const printWindow = window.open(printUrl, "_blank");
    if (!printWindow) {
      alert("Pop-up blocked! Allow pop-ups for this site.");
    }
  };

  if (editLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <motion.div
          className="bg-white rounded-2xl shadow-xl p-8 flex items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          >
            <FaSpinner className="w-12 h-12 text-teal-500" />
          </motion.div>
          <p className="text-lg font-medium text-gray-800">
            Loading consultation data...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-7xl p-8 max-h-[90vh] overflow-y-auto"
      >
        {editLoading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            >
              <FaSpinner className="w-12 h-12 text-teal-500" />
            </motion.div>
            <p className="text-lg font-medium text-white ml-4">
              Saving Changes...
            </p>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-yellow-100 text-yellow-700 rounded-lg flex items-center gap-2">
            <FaTimes className="text-yellow-700" />
            {error}
          </div>
        )}
        {symptomsError && (
          <div className="mb-6 p-4 bg-yellow-100 text-yellow-700 rounded-lg flex items-center gap-2">
            <FaTimes className="text-yellow-700" />
            {symptomsError}
          </div>
        )}
        {testsError && (
          <div className="mb-6 p-4 bg-yellow-100 text-yellow-700 rounded-lg flex items-center gap-2">
            <FaTimes className="text-yellow-700" />
            {testsError}
          </div>
        )}
        {prescriptionsError && (
          <div className="mb-6 p-4 bg-yellow-100 text-yellow-700 rounded-lg flex items-center gap-2">
            <FaTimes className="text-yellow-700" />
            {prescriptionsError}
          </div>
        )}

        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">
            Edit Consultation
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700 transition transform hover:scale-110"
          >
            <FaTimes className="text-2xl" />
          </button>
        </div>

        {editFormData ? (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Patient Information */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-50 p-6 rounded-xl shadow-sm"
            >
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-800">
                <FaUser className="text-teal-600 w-6 h-6" />
                Patient Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Patient Name"
                  value={editFormData.patient_name}
                  onChange={(val) => handleFormChange("patient_name", val)}
                  placeholder="Enter patient name"
                />
                <FormField
                  label="Mobile"
                  value={editFormData.mobile}
                  onChange={(val) => handleFormChange("mobile", val)}
                  placeholder="Enter mobile number"
                />
                <FormField
                  label="Visit Date"
                  type="date"
                  value={editFormData.visit_date?.split("T")[0] || ""}
                  onChange={(val) => handleFormChange("visit_date", val)}
                />
                <FormField
                  label="Age"
                  type="number"
                  value={editFormData.age}
                  onChange={(val) => handleFormChange("age", val)}
                  placeholder="Enter age"
                />
                <SelectField
                  label="Gender"
                  value={editFormData.gender}
                  onChange={(val) => handleFormChange("gender", val)}
                  options={[
                    { value: "Male", label: "Male" },
                    { value: "Female", label: "Female" },
                    { value: "Other", label: "Other" },
                  ]}
                />
              </div>
            </motion.div>

            {/* Vital Signs */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-50 p-6 rounded-xl shadow-sm"
            >
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-800">
                <FaHeartbeat className="text-red-600 w-6 h-6" />
                Vital Signs
              </h3>
              {editFormData.vital_signs?.map((vital, index) => (
                <div
                  key={index}
                  className="mb-4 p-4 bg-white rounded-lg shadow-inner grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  <FormField
                    label="Blood Pressure"
                    placeholder="e.g., 120/80"
                    value={vital.blood_pressure}
                    onChange={(val) =>
                      updateField("vital_signs", index, "blood_pressure", val)
                    }
                  />
                  <FormField
                    label="Pulse Rate"
                    placeholder="e.g., 80"
                    value={vital.pulse_rate}
                    onChange={(val) =>
                      updateField("vital_signs", index, "pulse_rate", val)
                    }
                  />
                  <FormField
                    label="Temperature"
                    placeholder="e.g., 98.6"
                    value={vital.temperature}
                    onChange={(val) =>
                      updateField("vital_signs", index, "temperature", val)
                    }
                  />
                  <FormField
                    label="SpO2 Level"
                    placeholder="e.g., 98"
                    value={vital.spo2_level}
                    onChange={(val) =>
                      updateField("vital_signs", index, "spo2_level", val)
                    }
                  />
                  <FormField
                    label="NIHSS Score"
                    placeholder="e.g., 0"
                    value={vital.nihss_score}
                    onChange={(val) =>
                      updateField("vital_signs", index, "nihss_score", val)
                    }
                  />
                  <SelectField
                    label="Fall Assessment"
                    value={vital.fall_assessment}
                    onChange={(val) =>
                      updateField("vital_signs", index, "fall_assessment", val)
                    }
                    options={[
                      { value: "Done", label: "Done" },
                      { value: "Not Done", label: "Not Done" },
                    ]}
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={addVitalSign}
                className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition flex items-center gap-2"
              >
                <FaPlus />
                Add Vital Sign
              </button>
            </motion.div>

            {/* Symptoms */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-50 p-6 rounded-xl shadow-sm"
            >
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-800">
                <FaStethoscope className="text-blue-600 w-6 h-6" />
                Symptoms
              </h3>
              <SymptomsSelector
                allSymptoms={allSymptoms}
                selectedSymptoms={editFormData.symptoms}
                rawSymptoms={editFormData.rawSymptoms || []}
                onSelect={(val) => handleFormChange("symptoms", val)}
                onRemove={removeSymptom}
              />
            </motion.div>

            {/* Tests */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-gray-50 p-6 rounded-xl shadow-sm"
            >
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-800">
                <FaFlask className="text-green-600 w-6 h-6" />
                Tests
              </h3>
              <TestsSelector
                allTests={allTests}
                selectedTests={editFormData.tests}
                onSelect={(val) => handleFormChange("tests", val)}
                onRemove={removeTest}
              />
            </motion.div>

            {/* Neurological Examination */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-gray-50 p-6 rounded-xl shadow-sm"
            >
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-800">
                <FaBrain className="text-purple-600 w-6 h-6" />
                Neurological Examination
              </h3>
              <div className="space-y-8">
                {/* Dropdown Fields */}
                <div>
                  <h4 className="text-lg font-medium text-gray-700 mb-4">
                    Examination Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <NeuroExamSelect
                      field="motor_function"
                      value={editFormData.motor_function}
                      onChange={handleFormChange}
                    />
                    <NeuroExamSelect
                      field="muscle_tone"
                      value={editFormData.muscle_tone}
                      onChange={handleFormChange}
                    />
                    <NeuroExamSelect
                      field="muscle_strength"
                      value={editFormData.muscle_strength}
                      onChange={handleFormChange}
                    />
                    <NeuroExamSelect
                      field="coordination"
                      value={editFormData.coordination}
                      onChange={handleFormChange}
                    />
                    <NeuroExamSelect
                      field="deep_tendon_reflexes"
                      value={editFormData.deep_tendon_reflexes}
                      onChange={handleFormChange}
                    />
                    <NeuroExamSelect
                      field="gait_assessment"
                      value={editFormData.gait_assessment}
                      onChange={handleFormChange}
                    />
                    <NeuroExamSelect
                      field="cranial_nerves"
                      value={editFormData.cranial_nerves}
                      onChange={handleFormChange}
                    />
                    <NeuroExamSelect
                      field="romberg_test"
                      value={editFormData.romberg_test}
                      onChange={handleFormChange}
                    />
                    <NeuroExamSelect
                      field="plantar_reflex"
                      value={editFormData.plantar_reflex}
                      onChange={handleFormChange}
                    />
                    <NeuroExamSelect
                      field="straight_leg_raise_left"
                      value={editFormData.straight_leg_raise_left}
                      onChange={handleFormChange}
                    />
                    <NeuroExamSelect
                      field="straight_leg_raise_right"
                      value={editFormData.straight_leg_raise_right}
                      onChange={handleFormChange}
                    />
                    <NeuroExamSelect
                      field="pupillary_reaction"
                      value={editFormData.pupillary_reaction}
                      onChange={handleFormChange}
                    />
                    <NeuroExamSelect
                      field="speech_assessment"
                      value={editFormData.speech_assessment}
                      onChange={handleFormChange}
                    />
                    <NeuroExamSelect
                      field="sensory_examination"
                      value={editFormData.sensory_examination}
                      onChange={handleFormChange}
                    />
                    <NeuroExamSelect
                      field="mental_status"
                      value={editFormData.mental_status}
                      onChange={handleFormChange}
                    />
                    <NeuroExamSelect
                      field="cerebellar_function"
                      value={editFormData.cerebellar_function}
                      onChange={handleFormChange}
                    />
                    <NeuroExamSelect
                      field="muscle_wasting"
                      value={editFormData.muscle_wasting}
                      onChange={handleFormChange}
                    />
                    <NeuroExamSelect
                      field="abnormal_movements"
                      value={editFormData.abnormal_movements}
                      onChange={handleFormChange}
                    />
                    <NeuroExamSelect
                      field="nystagmus"
                      value={editFormData.nystagmus}
                      onChange={handleFormChange}
                    />
                    <NeuroExamSelect
                      field="fundoscopy"
                      value={editFormData.fundoscopy}
                      onChange={handleFormChange}
                    />
                    <NeuroExamSelect
                      field="finger_nose_test"
                      value={editFormData.finger_nose_test}
                      onChange={handleFormChange}
                    />
                    <NeuroExamSelect
                      field="heel_shin_test"
                      value={editFormData.heel_shin_test}
                      onChange={handleFormChange}
                    />
                    <NeuroExamSelect
                      field="eye_movements"
                      value={editFormData.eye_movements}
                      onChange={handleFormChange}
                    />
                    <NeuroExamSelect
                      field="straight_leg_raise_test"
                      value={editFormData.straight_leg_raise_test}
                      onChange={handleFormChange}
                    />
                    <NeuroExamSelect
                      field="lasegue_test"
                      value={editFormData.lasegue_test}
                      onChange={handleFormChange}
                    />
                    <NeuroExamSelect
                      field="cognitive_assessment"
                      value={editFormData.cognitive_assessment}
                      onChange={handleFormChange}
                    />
                    <NeuroExamSelect
                      field="tremors"
                      value={editFormData.tremors}
                      onChange={handleFormChange}
                    />
                    <NeuroExamSelect
                      field="involuntary_movements"
                      value={editFormData.involuntary_movements}
                      onChange={handleFormChange}
                    />
                    <NeuroExamSelect
                      field="tongue_movement"
                      value={editFormData.tongue_movement}
                      onChange={handleFormChange}
                    />
                  </div>
                </div>

                {/* Checkbox Fields */}
                <div>
                  <h4 className="text-lg font-medium text-gray-700 mb-4">
                    Sensory and Neurological Signs
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <CheckboxField
                      label="Brudzinski Sign"
                      checked={editFormData.brudzinski_sign}
                      onChange={(val) =>
                        handleFormChange("brudzinski_sign", val)
                      }
                    />
                    <CheckboxField
                      label="Kernig Sign"
                      checked={editFormData.kernig_sign}
                      onChange={(val) => handleFormChange("kernig_sign", val)}
                    />
                    <CheckboxField
                      label="Temperature Sensation"
                      checked={editFormData.temperature_sensation}
                      onChange={(val) =>
                        handleFormChange("temperature_sensation", val)
                      }
                    />
                    <CheckboxField
                      label="Pain Sensation"
                      checked={editFormData.pain_sensation}
                      onChange={(val) =>
                        handleFormChange("pain_sensation", val)
                      }
                    />
                    <CheckboxField
                      label="Vibration Sense"
                      checked={editFormData.vibration_sense}
                      onChange={(val) =>
                        handleFormChange("vibration_sense", val)
                      }
                    />
                    <CheckboxField
                      label="Proprioception"
                      checked={editFormData.proprioception}
                      onChange={(val) =>
                        handleFormChange("proprioception", val)
                      }
                    />
                    <CheckboxField
                      label="Facial Sensation"
                      checked={editFormData.facial_sensation}
                      onChange={(val) =>
                        handleFormChange("facial_sensation", val)
                      }
                    />
                    <CheckboxField
                      label="Swallowing Function"
                      checked={editFormData.swallowing_function}
                      onChange={(val) =>
                        handleFormChange("swallowing_function", val)
                      }
                    />
                  </div>
                </div>

                {/* Score Fields */}
                <div>
                  <h4 className="text-lg font-medium text-gray-700 mb-4">
                    Cognitive Scores
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      label="MMSE Score (0–30)"
                      type="number"
                      value={editFormData.mmse_score}
                      onChange={(val) => handleFormChange("mmse_score", val)}
                      placeholder="Enter MMSE score"
                      min={0}
                      max={30}
                    />
                    <FormField
                      label="GCS Score (3–15)"
                      type="number"
                      value={editFormData.gcs_score}
                      onChange={(val) => handleFormChange("gcs_score", val)}
                      placeholder="Enter GCS score"
                      min={3}
                      max={15}
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Prescriptions */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="bg-gray-50 p-6 rounded-xl shadow-sm"
            >
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-800">
                <FaPills className="text-indigo-600 w-6 h-6" />
                Prescriptions
              </h3>
              {editFormData.prescriptions?.map((med, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="mb-4 p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition flex items-center gap-4 flex-wrap"
                >
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1 font-urdu">
                      دوائی
                    </label>
                    <select
                      value={med.medicine_id || ""}
                      onChange={(e) => {
                        const selectedMedicine = allMedicines.find(
                          (m) => m.id === parseInt(e.target.value)
                        );
                        updateField(
                          "prescriptions",
                          index,
                          "medicine_id",
                          e.target.value
                        );
                        updateField(
                          "prescriptions",
                          index,
                          "brand_name",
                          selectedMedicine?.brand_name || ""
                        );
                      }}
                      className="w-full p-2 border rounded-lg bg-white focus:ring-2 focus:ring-teal-500 transition font-urdu text-right"
                      disabled={allMedicines.length === 0 && !med.brand_name}
                    >
                      <option value="">
                        {allMedicines.length === 0 && med.brand_name
                          ? med.brand_name
                          : "دوائی منتخب کریں"}
                      </option>
                      {allMedicines.length > 0
                        ? allMedicines.map((medicine) => (
                            <option key={medicine.id} value={medicine.id}>
                              {medicine.form || ""} {medicine.brand_name || ""}{" "}
                              {medicine.strength || ""}
                            </option>
                          ))
                        : med.brand_name && (
                            <option value={med.medicine_id}>
                              {med.brand_name}
                            </option>
                          )}
                    </select>
                  </div>
                  <SelectField
                    label="خوراک"
                    value={med.dosage_urdu}
                    onChange={(val) =>
                      updateField("prescriptions", index, "dosage_urdu", val)
                    }
                    options={dosageOptions.map((opt) => ({
                      value: opt.label,
                      label: opt.label,
                    }))}
                    urdu
                    className="flex-1 min-w-[150px]"
                  />
                  <SelectField
                    label="تعدد"
                    value={med.frequency_urdu}
                    onChange={(val) =>
                      updateField("prescriptions", index, "frequency_urdu", val)
                    }
                    options={frequencyOptions.map((opt) => ({
                      value: opt.label,
                      label: opt.label,
                    }))}
                    urdu
                    className="flex-1 min-w-[150px]"
                  />
                  <SelectField
                    label="مدت"
                    value={med.duration_urdu}
                    onChange={(val) =>
                      updateField("prescriptions", index, "duration_urdu", val)
                    }
                    options={durationOptions.map((opt) => ({
                      value: opt.label,
                      label: opt.label,
                    }))}
                    urdu
                    className="flex-1 min-w-[150px]"
                  />
                  <SelectField
                    label="ہدایات"
                    value={med.instructions_urdu}
                    onChange={(val) =>
                      updateField(
                        "prescriptions",
                        index,
                        "instructions_urdu",
                        val
                      )
                    }
                    options={instructionsOptions.map((opt) => ({
                      value: opt.label,
                      label: opt.label,
                    }))}
                    urdu
                    className="flex-1 min-w-[150px]"
                  />
                  <button
                    type="button"
                    onChange={() => removeMedicine(index)}
                    className="text-red-500 hover:text-red-700 transition transform hover:scale-110"
                  >
                    <FaTrash className="w-5 h-5" />
                  </button>
                </motion.div>
              ))}
              <button
                type="button"
                onClick={addMedicine}
                className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition flex items-center gap-2"
                disabled={allMedicines.length === 0}
              >
                <FaPlus />
                Add Medicine
              </button>
              {allMedicines.length === 0 && (
                <p className="mt-2 text-sm text-yellow-600 font-urdu">
                  نوٹ: دوائیوں کی فہرست لوڈ ہونے تک نئی دوائیاں شامل نہیں کی جا
                  سکتیں۔
                </p>
              )}
            </motion.div>

            {/* Diagnosis */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="bg-gray-50 p-6 rounded-xl shadow-sm"
            >
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-800">
                <FaNotesMedical className="text-orange-600 w-6 h-6" />
                Diagnosis
              </h3>
              <FormField
                label="Diagnosis"
                placeholder="Enter diagnosis"
                value={editFormData.diagnosis}
                onChange={(val) => handleFormChange("diagnosis", val)}
              />
              <FormField
                label="Treatment Plan"
                placeholder="Enter treatment plan"
                value={editFormData.treatment_plan}
                onChange={(val) => handleFormChange("treatment_plan", val)}
              />
            </motion.div>

            {/* Follow-ups */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="bg-gray-50 p-6 rounded-xl shadow-sm"
            >
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-800">
                <FaNotesMedical className="text-pink-600 w-6 h-6" />
                Follow-ups
              </h3>
              {editFormData.follow_ups?.map((followUp, index) => (
                <div
                  key={index}
                  className="mb-4 p-4 bg-white rounded-lg shadow-inner grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <FormField
                    label="Follow-up Date"
                    type="date"
                    value={followUp.follow_up_date}
                    onChange={(val) =>
                      updateField("follow_ups", index, "follow_up_date", val)
                    }
                  />
                  <FormField
                    label="Notes"
                    placeholder="Enter notes"
                    value={followUp.notes}
                    onChange={(val) =>
                      updateField("follow_ups", index, "notes", val)
                    }
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={addFollowUp}
                className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition flex items-center gap-2"
              >
                <FaPlus />
                Add Follow-up
              </button>
            </motion.div>

            {/* Form Actions */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="flex justify-end gap-4 mt-8"
            >
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editLoading}
                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50"
              >
                {editLoading ? "Saving..." : "Update Consultation"}
              </button>
            </motion.div>
          </form>
        ) : (
          <p className="text-center text-gray-500">
            No consultation data available.
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default EditConsultation;

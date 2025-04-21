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
import FullPageLoader from "../pages/FullPageLoader";

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
  disabled = false,
  required = false,
}) => (
  <div style={{ marginBottom: "1rem" }}>
    <label
      style={{
        display: "block",
        fontSize: "0.875rem",
        fontWeight: "500",
        color: "#374151",
        marginBottom: "0.25rem",
      }}
    >
      {label}
      {required && <span style={{ color: "#ef4444" }}>*</span>}
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
      disabled={disabled}
      required={required}
      style={{
        width: "100%",
        padding: "0.5rem",
        border: "1px solid #d1d5db",
        borderRadius: "0.375rem",
        backgroundColor: "#ffffff",
        fontSize: "0.875rem",
        color: "#374151",
        outline: "none",
        transition: "all 0.2s",
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
        ...(urdu
          ? {
              fontFamily: "'Noto Nastaliq Urdu', sans-serif",
              textAlign: "right",
            }
          : {}),
        ...(disabled
          ? { backgroundColor: "#f3f4f6", cursor: "not-allowed" }
          : {}),
      }}
      onFocus={(e) => (e.target.style.borderColor = "#14b8a6")}
      onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
    />
  </div>
);

const CheckboxField = ({ label, checked, onChange }) => (
  <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center" }}>
    <input
      type="checkbox"
      checked={checked || false}
      onChange={(e) => onChange(e.target.checked)}
      style={{
        height: "1rem",
        width: "1rem",
        color: "#14b8a6",
        border: "1px solid #d1d5db",
        borderRadius: "0.25rem",
        cursor: "pointer",
      }}
    />
    <label
      style={{
        marginLeft: "0.5rem",
        fontSize: "0.875rem",
        fontWeight: "500",
        color: "#374151",
      }}
    >
      {label}
    </label>
  </div>
);

const SelectField = ({
  label,
  value,
  onChange,
  options,
  urdu = false,
  bilingual = false,
  onEnglishChange = null,
  englishValue = null,
  required = false,
}) => {
  const handleChange = (selectedValue) => {
    if (bilingual) {
      const selectedOption = options.find(
        (opt) => opt.label === selectedValue || opt.value === selectedValue
      );
      onChange(selectedOption ? selectedOption.label : selectedValue);
      if (onEnglishChange) {
        onEnglishChange(selectedOption ? selectedOption.value : selectedValue);
      }
    } else {
      onChange(selectedValue);
    }
  };

  const displayValue = bilingual
    ? options.find((opt) => opt.value === englishValue)?.label || value
    : value;

  return (
    <div
      style={{
        marginBottom: "1rem",
        ...(urdu ? { fontFamily: "'Noto Nastaliq Urdu', sans-serif" } : {}),
      }}
    >
      <label
        style={{
          display: "block",
          fontSize: "0.875rem",
          fontWeight: "500",
          color: "#374151",
          marginBottom: "0.25rem",
        }}
      >
        {label}
        {required && <span style={{ color: "#ef4444" }}>*</span>}
      </label>
      <select
        value={displayValue || ""}
        onChange={(e) => handleChange(e.target.value)}
        style={{
          width: "100%",
          padding: "0.5rem",
          border: "1px solid #d1d5db",
          borderRadius: "0.375rem",
          backgroundColor: "#ffffff",
          fontSize: "0.875rem",
          color: "#374151",
          outline: "none",
          transition: "all 0.2s",
          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
          ...(urdu ? { textAlign: "right" } : {}),
        }}
        onFocus={(e) => (e.target.style.borderColor = "#14b8a6")}
        onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
        required={required}
      >
        <option value="" style={{ color: "#6b7280" }}>
          {urdu ? "منتخب کریں" : "Select Option"}
        </option>
        {options.map((opt) => (
          <option
            key={opt.value}
            value={bilingual ? opt.label : opt.value}
            style={{ color: "#374151" }}
          >
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

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
  { value: "afternoon", label: "دوپہر" },
  { value: "evening", label: "شام" },
  { value: "night", label: "رات" },
  { value: "morning_evening", label: "صبح، شام" },
  { value: "morning_night", label: "صبح، رات" },
  { value: "afternoon_evening", label: "دوپہر، شام" },
  { value: "afternoon_night", label: "دوپہر، رات" },
  { value: "morning_evening_night", label: "صبح، شام، رات" },
  { value: "morning_afternoon_evening", label: "صبح، دوپہر، شام" },
  { value: "as_needed", label: "حسب ضرورت" },
  { value: "morning_afternoon_night", label: "صبح، دوپہر، رات" },
  { value: "afternoon_evening_night", label: "دوپہر، شام، رات" },
  { value: "early_morning", label: "صبح سویرے" },
  { value: "late_morning", label: "دیر صبح" },
  { value: "late_afternoon", label: "دیر دوپہر" },
  { value: "sunset", label: "غروب آفتاب" },
  { value: "midnight", label: "آدھی رات" },
  { value: "late_night", label: "رات دیر گئے" },
  { value: "morning_afternoon", label: "صبح، دوپہر" },
  { value: "evening_night", label: "شام، رات" },
  { value: "early_morning_night", label: "صبح سویرے، رات" },
  { value: "morning_late_afternoon", label: "صبح، دیر دوپہر" },
  { value: "afternoon_sunset", label: "دوپہر، غروب آفتاب" },
  { value: "all_day", label: "پورا دن" },
  { value: "all_night", label: "پوری رات" },
  { value: "24_hours", label: "چوبیس گھنٹے" }
];

const frequencyValueToLabel = {
  morning: "صبح",
  afternoon: "دوپہر",
  evening: "شام",
  night: "رات",
  morning_evening: "صبح، شام",
  morning_night: "صبح، رات",
  afternoon_evening: "دوپہر، شام",
  afternoon_night: "دوپہر، رات",
  morning_evening_night: "صبح، شام، رات",
  morning_afternoon_evening: "صبح، دوپہر، شام",
  as_needed: "حسب ضرورت",
  morning_afternoon_night: "صبح، دوپہر، رات",
  afternoon_evening_night: "دوپہر، شام، رات",
  early_morning: "صبح سویرے",
  late_morning: "دیر صبح",
  late_afternoon: "دیر دوپہر",
  sunset: "غروب آفتاب",
  midnight: "آدھی رات",
  late_night: "رات دیر گئے",
  morning_afternoon: "صبح، دوپہر",
  evening_night: "شام، رات",
  early_morning_night: "صبح سویرے، رات",
  morning_late_afternoon: "صبح، دیر دوپہر",
  afternoon_sunset: "دوپہر، غروب آفتاب",
  all_day: "پورا دن",
  all_night: "پوری رات",
  "24_hours": "چوبیس گھنٹے"
};

const durationOptions = [
  // Days (1-31)
  { value: "1_day", label: "ایک دن" },
  { value: "2_days", label: "دو دن" },
  { value: "3_days", label: "تین دن" },
  { value: "4_days", label: "چار دن" },
  { value: "5_days", label: "پانچ دن" },
  { value: "6_days", label: "چھ دن" },
  { value: "7_days", label: "ایک ہفتہ" },
  { value: "10_days", label: "دس دن" },
  { value: "14_days", label: "دو ہفتے" },
  { value: "15_days", label: "پندرہ دن" },
  { value: "21_days", label: "تین ہفتے" },
  { value: "28_days", label: "چار ہفتے" },
  { value: "30_days", label: "ایک ماہ" },
  { value: "45_days", label: "پینتالیس دن" },
  { value: "60_days", label: "دو ماہ" },
  { value: "90_days", label: "تین ماہ" },

  // Weeks
  { value: "1_week", label: "ایک ہفتہ" },
  { value: "2_weeks", label: "دو ہفتے" },
  { value: "3_weeks", label: "تین ہفتے" },
  { value: "4_weeks", label: "چار ہفتے" },
  { value: "6_weeks", label: "چھ ہفتے" },
  { value: "8_weeks", label: "آٹھ ہفتے" },
  { value: "12_weeks", label: "بارہ ہفتے" },

  // Months
  { value: "1_month", label: "ایک ماہ" },
  { value: "2_months", label: "دو ماہ" },
  { value: "3_months", label: "تین ماہ" },
  { value: "4_months", label: "چار ماہ" },
  { value: "6_months", label: "چھ ماہ" },
  { value: "9_months", label: "نو ماہ" },
  { value: "12_months", label: "ایک سال" },
  { value: "18_months", label: "ڈیڑھ سال" },

  // Years
  { value: "1_year", label: "ایک سال" },
  { value: "2_years", label: "دو سال" },
  { value: "3_years", label: "تین سال" },

  // Special Durations
  { value: "as_needed", label: "ضرورت کے مطابق" },
  { value: "until_finished", label: "دوا ختم ہونے تک" },
  { value: "lifetime", label: "زندگی بھر" },
  { value: "short_term", label: "مختصر مدت" },
  { value: "long_term", label: "طویل مدت" }
];

const durationValueToLabel = {
  // Days
  "1_day": "ایک دن",
  "2_days": "دو دن",
  "3_days": "تین دن",
  "4_days": "چار دن",
  "5_days": "پانچ دن",
  "6_days": "چھ دن",
  "7_days": "ایک ہفتہ",
  "10_days": "دس دن",
  "14_days": "دو ہفتے",
  "15_days": "پندرہ دن",
  "21_days": "تین ہفتے",
  "28_days": "چار ہفتے",
  "30_days": "ایک ماہ",
  "45_days": "پینتالیس دن",
  "60_days": "دو ماہ",
  "90_days": "تین ماہ",

  // Weeks
  "1_week": "ایک ہفتہ",
  "2_weeks": "دو ہفتے",
  "3_weeks": "تین ہفتے",
  "4_weeks": "چار ہفتے",
  "6_weeks": "چھ ہفتے",
  "8_weeks": "آٹھ ہفتے",
  "12_weeks": "بارہ ہفتے",

  // Months
  "1_month": "ایک ماہ",
  "2_months": "دو ماہ",
  "3_months": "تین ماہ",
  "4_months": "چار ماہ",
  "6_months": "چھ ماہ",
  "9_months": "نو ماہ",
  "12_months": "ایک سال",
  "18_months": "ڈیڑھ سال",

  // Years
  "1_year": "ایک سال",
  "2_years": "دو سال",
  "3_years": "تین سال",

  // Special Durations
  "as_needed": "ضرورت کے مطابق",
  "until_finished": "دوا ختم ہونے تک",
  "lifetime": "زندگی بھر",
  "short_term": "مختصر مدت",
  "long_term": "طویل مدت"
};

const instructionsOptions = [
  { value: "before_meal", label: "کھانے سے پہلے" },
  { value: "after_meal", label: "کھانے کے بعد" },
  { value: "with_meal", label: "کھانے کے ساتھ" },
  { value: "with_water", label: "پانی کے ساتھ" },
  { value: "with_milk", label: "دودھ کے ساتھ" },
  { value: "with_juice", label: "جوس کے ساتھ" },
  { value: "on_empty_stomach", label: "خالی پیٹ" },
  { value: "before_breakfast", label: "ناشتے سے پہلے" },
  { value: "after_breakfast", label: "ناشتے کے بعد" },
  { value: "before_lunch", label: "دوپہر کے کھانے سے پہلے" },
  { value: "after_lunch", label: "دوپہر کے کھانے کے بعد" },
  { value: "before_dinner", label: "رات کے کھانے سے پہلے" },
  { value: "after_dinner", label: "رات کے کھانے کے بعد" },
  { value: "at_bedtime", label: "سونے سے پہلے" },
  { value: "chew_tab", label: "چبا کر کھائیں" },
  { value: "sublingual", label: "زیر زبان رکھیں" },
  { value: "avoid_alcohol", label: "الکحل سے پرہیز" },
  { value: "as_needed", label: "ضرورت کے مطابق" },
  { value: "as_directed", label: "ڈاکٹر کے مشورے سے" }
];

const instructionsValueToLabel = {
  before_meal: "کھانے سے پہلے",
  after_meal: "کھانے کے بعد",
  with_meal: "کھانے کے ساتھ",
  with_water: "پانی کے ساتھ",
  with_milk: "دودھ کے ساتھ",
  with_juice: "جوس کے ساتھ",
  on_empty_stomach: "خالی پیٹ",
  before_breakfast: "ناشتے سے پہلے",
  after_breakfast: "ناشتے کے بعد",
  before_lunch: "دوپہر کے کھانے سے پہلے",
  after_lunch: "دوپہر کے کھانے کے بعد",
  before_dinner: "رات کے کھانے سے پہلے",
  after_dinner: "رات کے کھانے کے بعد",
  at_bedtime: "سونے سے پہلے",
  chew_tab: "چبا کر کھائیں",
  sublingual: "زیر زبان رکھیں",
  avoid_alcohol: "الکحل سے پرہیز",
  as_needed: "ضرورت کے مطابق",
  as_directed: "ڈاکٹر کے مشورے سے"
};

const getEnglishValue = (urduLabel, options) => {
  if (!urduLabel) return "";
  const option = options.find((opt) => opt.label === urduLabel);
  return option ? option.value : urduLabel;
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
      if (
        fieldType &&
        valueToLabelMaps[fieldType] &&
        value in valueToLabelMaps[fieldType]
      ) {
        return valueToLabelMaps[fieldType][value];
      }
      const option = options.find(
        (opt) => opt.value === value || opt.label === value
      );
      return option ? option.label : value;
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
            `https://patient-management-backend-nine.vercel.app/api/patients/${patientId}/consultations/${consultationId}?t=${Date.now()}`,
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
            setPrescriptionsError(
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

          // Normalize tests
          const normalizedTests = (consultationData.tests || [])
            .map((t) => {
              console.log("Processing test:", t);
              const testId = t.test_id || t.id;
              if (!Number.isInteger(testId)) {
                console.warn("Invalid test ID:", t);
                return null;
              }
              return testId;
            })
            .filter(Boolean);
          console.log("Normalized Tests:", normalizedTests);

          // Check for missing test IDs in allTests
          const allTestIds = referenceData.tests.map((t) => t.id);
          const missingTestIds = normalizedTests.filter(
            (id) => !allTestIds.includes(id)
          );
          if (missingTestIds.length > 0) {
            console.warn("Test IDs not in allTests:", missingTestIds);
            setTestsError(
              `Some tests (IDs: ${missingTestIds.join(
                ", "
              )}) are not available. Please reselect tests.`
            );
          }

          const prescriptions = (consultationData.prescriptions || []).map(
            (pres) => ({
              medicine_id: pres.medicine_id || "",
              brand_name: pres.brand_name || "",
              dosage_en:
                pres.dosage_en ||
                getEnglishValue(pres.dosage_urdu, dosageOptions),
              frequency_en:
                pres.frequency_en ||
                getEnglishValue(pres.frequency_urdu, frequencyOptions),
              duration_en:
                pres.duration_en ||
                getEnglishValue(pres.duration_urdu, durationOptions),
              instructions_en:
                pres.instructions_en ||
                getEnglishValue(pres.instructions_urdu, instructionsOptions),
              dosage_urdu: normalizeValue(
                pres.dosage_urdu || pres.dosage_en,
                dosageOptions,
                "dosage"
              ),
              frequency_urdu: normalizeValue(
                pres.frequency_urdu || pres.frequency_en,
                frequencyOptions,
                "frequency"
              ),
              duration_urdu: normalizeValue(
                pres.duration_urdu || pres.duration_en,
                durationOptions,
                "duration"
              ),
              instructions_urdu: normalizeValue(
                pres.instructions_urdu || pres.instructions_en,
                instructionsOptions,
                "instructions"
              ),
              prescribed_at: pres.prescribed_at || new Date().toISOString(),
            })
          );

          setAllSymptoms(referenceData.symptoms);
          setAllTests(referenceData.tests);
          setAllMedicines(referenceData.medicines);

          const newFormData = {
            ...consultationData,
            patient_name: consultationData.patient_name || "",
            gender: consultationData.gender || "Male",
            mobile: consultationData.mobile || "",
            symptoms: mapSymptomsToIds(
              consultationData.symptoms || [],
              referenceData.symptoms
            ),
            rawSymptoms: consultationData.symptoms || [],
            tests: normalizedTests,
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
            // mental_status: consultationData.mental_status || "",
            // cerebellar_function: consultationData.cerebellar_function || "",
            // muscle_wasting: consultationData.muscle_wasting || "",
            // abnormal_movements: consultationData.abnormal_movements || "",
            // nystagmus: consultationData.nystagmus || "",
            fundoscopy: consultationData.fundoscopy || "",
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
            prescriptions,
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
          dosage_en: "",
          frequency_en: "",
          duration_en: "",
          instructions_en: "",
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

      if (!editFormData.patient_name) {
        setError("Patient name is required.");
        setEditLoading(false);
        return;
      }

      const validTestIds = editFormData.tests.filter((testId) =>
        allTests.some((test) => test.id === testId)
      );
      if (editFormData.tests.length !== validTestIds.length) {
        console.warn(
          "Invalid test IDs found:",
          editFormData.tests.filter((id) => !validTestIds.includes(id))
        );
        setError("Some selected tests are invalid. Please reselect tests.");
        setEditLoading(false);
        return;
      }

      const payload = {
        ...editFormData,
        patient_id: Number(patientId),
        consultation_id: Number(consultationId),
        patient_name: editFormData.patient_name,
        gender: editFormData.gender,
        mobile: editFormData.mobile,
        tests: validTestIds,
        prescriptions: editFormData.prescriptions.map((pres) => ({
          medicine_id: pres.medicine_id,
          brand_name: pres.brand_name,
          dosage_en: pres.dosage_en,
          frequency_en: pres.frequency_en,
          duration_en: pres.duration_en,
          instructions_en: pres.instructions_en,
          dosage_urdu: pres.dosage_urdu,
          frequency_urdu: pres.frequency_urdu,
          duration_urdu: pres.duration_urdu,
          instructions_urdu: pres.instructions_urdu,
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
        sessionStorage.removeItem(`patient_${patientId}_consultations`);
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

  const handlePrint = () => {
    const printUrl = `https://patient-management-backend-nine.vercel.app/api/patients/${patientId}/consultations/${consultationId}/print?lang=urdu`;
    const printWindow = window.open(printUrl, "_blank");
    if (!printWindow) {
      alert("Pop-up blocked! Allow pop-ups for this site.");
    }
  };

  const handleCancel = () => {
    if (
      window.confirm(
        "Are you sure you want to cancel? Unsaved changes will be lost."
      )
    ) {
      navigate(`/patients/${patientId}`);
    }
  };

  if (editLoading && !editFormData) {
    return <FullPageLoader isLoading={true} />;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom right, #f3f4f6, #e5e7eb)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          width: "100%",
          maxWidth: "80rem",
          backgroundColor: "#ffffff",
          padding: "2rem",
          borderRadius: "1rem",
          boxShadow: "0 10px 20px rgba(0, 0, 0, 0.1)",
          maxHeight: "90vh",
          overflow: "auto",
        }}
      >
        {editLoading && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 50,
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            >
              <FaSpinner
                style={{ width: "3rem", height: "3rem", color: "#14b8a6" }}
              />
            </motion.div>
            <p
              style={{
                fontSize: "1.125rem",
                fontWeight: "500",
                color: "#ffffff",
                marginLeft: "1rem",
              }}
            >
              Saving Changes...
            </p>
          </div>
        )}
        {error && (
          <div
            style={{
              marginBottom: "1.5rem",
              padding: "1rem",
              backgroundColor: "#fee2e2",
              color: "#b91c1c",
              borderRadius: "0.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <FaTimes style={{ color: "#b91c1c" }} />
            {error}
            <button
              onClick={() => setError("")}
              style={{
                marginLeft: "auto",
                color: "#b91c1c",
                cursor: "pointer",
                transition: "color 0.2s",
              }}
              onMouseOver={(e) => (e.target.style.color = "#991b1b")}
              onMouseOut={(e) => (e.target.style.color = "#b91c1c")}
            >
              <FaTimes />
            </button>
          </div>
        )}
        {symptomsError && (
          <div
            style={{
              marginBottom: "1.5rem",
              padding: "1rem",
              backgroundColor: "#fef9c3",
              color: "#854d0e",
              borderRadius: "0.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <FaTimes style={{ color: "#854d0e" }} />
            {symptomsError}
            <button
              onClick={() => setSymptomsError("")}
              style={{
                marginLeft: "auto",
                color: "#854d0e",
                cursor: "pointer",
                transition: "color 0.2s",
              }}
              onMouseOver={(e) => (e.target.style.color = "#713f12")}
              onMouseOut={(e) => (e.target.style.color = "#854d0e")}
            >
              <FaTimes />
            </button>
          </div>
        )}
        {testsError && (
          <div
            style={{
              marginBottom: "1.5rem",
              padding: "1rem",
              backgroundColor: "#fef9c3",
              color: "#854d0e",
              borderRadius: "0.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <FaTimes style={{ color: "#854d0e" }} />
            {testsError}
            <button
              onClick={() => setTestsError("")}
              style={{
                marginLeft: "auto",
                color: "#854d0e",
                cursor: "pointer",
                transition: "color 0.2s",
              }}
              onMouseOver={(e) => (e.target.style.color = "#713f12")}
              onMouseOut={(e) => (e.target.style.color = "#854d0e")}
            >
              <FaTimes />
            </button>
          </div>
        )}
        {prescriptionsError && (
          <div
            style={{
              marginBottom: "1.5rem",
              padding: "1rem",
              backgroundColor: "#fef9c3",
              color: "#854d0e",
              borderRadius: "0.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <FaTimes style={{ color: "#854d0e" }} />
            {prescriptionsError}
            <button
              onClick={() => setPrescriptionsError("")}
              style={{
                marginLeft: "auto",
                color: "#854d0e",
                cursor: "pointer",
                transition: "color 0.2s",
              }}
              onMouseOver={(e) => (e.target.style.color = "#713f12")}
              onMouseOut={(e) => (e.target.style.color = "#854d0e")}
            >
              <FaTimes />
            </button>
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
          }}
        >
          <h2
            style={{
              fontSize: "1.875rem",
              fontWeight: "700",
              color: "#1f2937",
            }}
          >
            Edit Consultation
          </h2>
          <button
            onClick={handleCancel}
            style={{
              color: "#ef4444",
              backgroundColor: "#f3f4f6",
              borderRadius: "9999px",
              padding: "0.5rem",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseOver={(e) => {
              e.target.style.color = "#dc2626";
              e.target.style.transform = "scale(1.1)";
            }}
            onMouseOut={(e) => {
              e.target.style.color = "#ef4444";
              e.target.style.transform = "scale(1)";
            }}
            aria-label="Cancel"
          >
            <FaTimes style={{ fontSize: "1.5rem" }} />
          </button>
        </div>

        {editFormData ? (
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
          >
            {/* Patient Information */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              style={{
                backgroundColor: "#f9fafb",
                padding: "1.5rem",
                borderRadius: "0.75rem",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
              }}
            >
              <h3
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "600",
                  color: "#1f2937",
                  marginBottom: "1.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <FaUser
                  style={{
                    color: "#14b8a6",
                    width: "1.5rem",
                    height: "1.5rem",
                  }}
                />
                Patient Information
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "1.5rem",
                }}
              >
                <FormField
                  label="Patient Name"
                  value={editFormData.patient_name}
                  onChange={(val) => handleFormChange("patient_name", val)}
                  placeholder="Enter patient name"
                  required
                />
                <FormField
                  label="Mobile"
                  value={editFormData.mobile}
                  onChange={(val) => handleFormChange("mobile", val)}
                  placeholder="Enter mobile number"
                  disabled
                />
                <FormField
                  label="Visit Date"
                  type="date"
                  value={editFormData.visit_date?.split("T")[0] || ""}
                  onChange={(val) => handleFormChange("visit_date", val)}
                  required
                />
                <FormField
                  label="Age"
                  type="number"
                  value={editFormData.age}
                  onChange={(val) => handleFormChange("age", val)}
                  placeholder="Enter age"
                  min={0}
                  max={150}
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
                  required
                />
              </div>
            </motion.div>

            {/* Vital Signs */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              style={{
                backgroundColor: "#f9fafb",
                padding: "1.5rem",
                borderRadius: "0.75rem",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
              }}
            >
              <h3
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "600",
                  color: "#1f2937",
                  marginBottom: "1.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <FaHeartbeat
                  style={{
                    color: "#ef4444",
                    width: "1.5rem",
                    height: "1.5rem",
                  }}
                />
                Vital Signs
              </h3>
              {editFormData.vital_signs?.map((vital, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: "1rem",
                    padding: "1rem",
                    backgroundColor: "#ffffff",
                    borderRadius: "0.5rem",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "1rem",
                  }}
                >
                  <FormField
                    label="Blood Pressure"
                    placeholder="e.g., 120/80 mmHg"
                    value={vital.blood_pressure}
                    onChange={(val) =>
                      updateField("vital_signs", index, "blood_pressure", val)
                    }
                  />
                  <FormField
                    label="Pulse Rate"
                    placeholder="e.g., 80 bpm"
                    value={vital.pulse_rate}
                    onChange={(val) =>
                      updateField("vital_signs", index, "pulse_rate", val)
                    }
                  />
                  <FormField
                    label="Temperature"
                    placeholder="e.g., 98.6°F"
                    value={vital.temperature}
                    onChange={(val) =>
                      updateField("vital_signs", index, "temperature", val)
                    }
                  />
                  <FormField
                    label="SpO2 Level"
                    placeholder="e.g., 98%"
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
            </motion.div>

            {/* Symptoms */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{
                backgroundColor: "#f9fafb",
                padding: "1.5rem",
                borderRadius: "0.75rem",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
              }}
            >
              <h3
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "600",
                  color: "#1f2937",
                  marginBottom: "1.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <FaStethoscope
                  style={{
                    color: "#3b82f6",
                    width: "1.5rem",
                    height: "1.5rem",
                  }}
                />
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
              style={{
                backgroundColor: "#f9fafb",
                padding: "1.5rem",
                borderRadius: "0.75rem",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
              }}
            >
              <h3
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "600",
                  color: "#1f2937",
                  marginBottom: "1.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <FaFlask
                  style={{
                    color: "#22c55e",
                    width: "1.5rem",
                    height: "1.5rem",
                  }}
                />
                Tests
              </h3>
              <TestsSelector
                allTests={allTests}
                selectedTests={editFormData.tests}
                onSelect={(newTestIds) =>
                  setEditFormData({
                    ...editFormData,
                    tests: [...new Set(newTestIds)],
                  })
                }
                onRemove={removeTest}
              />
            </motion.div>

            {/* Neurological Examination */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{
                backgroundColor: "#f9fafb",
                padding: "1.5rem",
                borderRadius: "0.75rem",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
              }}
            >
              <h3
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "600",
                  color: "#1f2937",
                  marginBottom: "1.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <FaBrain
                  style={{
                    color: "#8b5cf6",
                    width: "1.5rem",
                    height: "1.5rem",
                  }}
                />
                Neurological Examination
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "2rem",
                }}
              >
                <div>
                  <h4
                    style={{
                      fontSize: "1.125rem",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "1rem",
                    }}
                  >
                    Examination Details
                  </h4>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "1.5rem",
                    }}
                  >
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
                      field="pupillary_reaction"
                      value={editFormData.pupillary_reaction || ""}
                      onChange={handleFormChange}
                    />
                    <NeuroExamSelect
                      field="speech_assessment"
                      value={editFormData.speech_assessment || ""}
                      onChange={handleFormChange}
                    />
                    <NeuroExamSelect
                      field="sensory_examination"
                      value={editFormData.sensory_examination || ""}
                      onChange={handleFormChange}
                    />
                    {/* <NeuroExamSelect
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
                    /> */}
                    {/* <NeuroExamSelect
                      field="abnormal_movements"
                      value={editFormData.abnormal_movements || ""}
                      onChange={handleFormChange}
                    />
                    <NeuroExamSelect
                      field="nystagmus"
                      value={editFormData.nystagmus || ""}
                      onChange={handleFormChange}
                    /> */}
                    <NeuroExamSelect
                      field="fundoscopy"
                      value={editFormData.fundoscopy || ""}
                      onChange={handleFormChange}
                    />
                  </div>
                </div>

                <div>
                  <h4
                    style={{
                      fontSize: "1.125rem",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "1rem",
                    }}
                  >
                    Sensory and Neurological Signs
                  </h4>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "1.5rem",
                    }}
                  >
                    <CheckboxField
                      label="Brudzinski Sign"
                      checked={editFormData.brudzinski_sign || false}
                      onChange={(val) =>
                        handleFormChange("brudzinski_sign", val)
                      }
                    />
                    <CheckboxField
                      label="Kernig Sign"
                      checked={editFormData.kernig_sign || false}
                      onChange={(val) => handleFormChange("kernig_sign", val)}
                    />
                    <CheckboxField
                      label="Temperature Sensation"
                      checked={editFormData.temperature_sensation || false}
                      onChange={(val) =>
                        handleFormChange("temperature_sensation", val)
                      }
                    />
                    <CheckboxField
                      label="Pain Sensation"
                      checked={editFormData.pain_sensation || false}
                      onChange={(val) =>
                        handleFormChange("pain_sensation", val)
                      }
                    />
                    <CheckboxField
                      label="Vibration Sense"
                      checked={editFormData.vibration_sense || false}
                      onChange={(val) =>
                        handleFormChange("vibration_sense", val)
                      }
                    />
                    <CheckboxField
                      label="Proprioception"
                      checked={editFormData.proprioception || false}
                      onChange={(val) =>
                        handleFormChange("proprioception", val)
                      }
                    />
                    <CheckboxField
                      label="Facial Sensation"
                      checked={editFormData.facial_sensation || false}
                      onChange={(val) =>
                        handleFormChange("facial_sensation", val)
                      }
                    />
                    <CheckboxField
                      label="Swallowing Function"
                      checked={editFormData.swallowing_function || false}
                      onChange={(val) =>
                        handleFormChange("swallowing_function", val)
                      }
                    />
                  </div>
                </div>

                <div>
                  <h4
                    style={{
                      fontSize: "1.125rem",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "1rem",
                    }}
                  >
                    Cognitive Scores
                  </h4>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "1.5rem",
                    }}
                  >
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
              style={{
                backgroundColor: "#f9fafb",
                padding: "1.5rem",
                borderRadius: "0.75rem",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
              }}
            >
              <h3
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "600",
                  color: "#1f2937",
                  marginBottom: "1.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <FaPills
                  style={{
                    color: "#f59e0b",
                    width: "1.5rem",
                    height: "1.5rem",
                  }}
                />
                Prescriptions
              </h3>
              {editFormData.prescriptions?.map((med, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  style={{
                    marginBottom: "1rem",
                    padding: "1rem",
                    backgroundColor: "#ffffff",
                    borderRadius: "0.5rem",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "1rem",
                    alignItems: "center",
                    transition: "box-shadow 0.2s",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.boxShadow =
                      "0 4px 8px rgba(0, 0, 0, 0.1)")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.boxShadow =
                      "0 2px 4px rgba(0, 0, 0, 0.05)")
                  }
                >
                  <div style={{ flex: "1", minWidth: "200px" }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "0.25rem",
                        fontFamily: "'Noto Nastaliq Urdu', sans-serif",
                      }}
                    >
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
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid #d1d5db",
                        borderRadius: "0.375rem",
                        backgroundColor: "#ffffff",
                        fontSize: "0.875rem",
                        color: "#374151",
                        outline: "none",
                        transition: "all 0.2s",
                        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "#14b8a6")}
                      onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
                      disabled={allMedicines.length === 0 && !med.brand_name}
                    >
                      <option value="" style={{ color: "#6b7280" }}>
                        {allMedicines.length === 0 && med.brand_name
                          ? med.brand_name
                          : "دوائی منتخب کریں"}
                      </option>
                      {allMedicines.length > 0
                        ? allMedicines.map((medicine) => (
                            <option
                              key={medicine.id}
                              value={medicine.id}
                              style={{ color: "#374151" }}
                            >
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
                    englishValue={med.dosage_en}
                    onChange={(val) =>
                      updateField("prescriptions", index, "dosage_urdu", val)
                    }
                    onEnglishChange={(val) =>
                      updateField("prescriptions", index, "dosage_en", val)
                    }
                    options={dosageOptions}
                    urdu
                    bilingual={true}
                    style={{ flex: "1", minWidth: "150px" }}
                  />
                  <SelectField
                    label="تعدد"
                    value={med.frequency_urdu}
                    englishValue={med.frequency_en}
                    onChange={(val) =>
                      updateField("prescriptions", index, "frequency_urdu", val)
                    }
                    onEnglishChange={(val) =>
                      updateField("prescriptions", index, "frequency_en", val)
                    }
                    options={frequencyOptions}
                    urdu
                    bilingual={true}
                    style={{ flex: "1", minWidth: "150px" }}
                  />
                  <SelectField
                    label="مدت"
                    value={med.duration_urdu}
                    englishValue={med.duration_en}
                    onChange={(val) =>
                      updateField("prescriptions", index, "duration_urdu", val)
                    }
                    onEnglishChange={(val) =>
                      updateField("prescriptions", index, "duration_en", val)
                    }
                    options={durationOptions}
                    urdu
                    bilingual={true}
                    style={{ flex: "1", minWidth: "150px" }}
                  />
                  <SelectField
                    label="ہدایات"
                    value={med.instructions_urdu}
                    englishValue={med.instructions_en}
                    onChange={(val) =>
                      updateField(
                        "prescriptions",
                        index,
                        "instructions_urdu",
                        val
                      )
                    }
                    onEnglishChange={(val) =>
                      updateField(
                        "prescriptions",
                        index,
                        "instructions_en",
                        val
                      )
                    }
                    options={instructionsOptions}
                    urdu
                    bilingual={true}
                    style={{ flex: "1", minWidth: "150px" }}
                  />
                  <button
                    type="button"
                    onClick={() => removeMedicine(index)}
                    style={{
                      color: "#ef4444",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseOver={(e) => {
                      e.target.style.color = "#dc2626";
                      e.target.style.transform = "scale(1.1)";
                    }}
                    onMouseOut={(e) => {
                      e.target.style.color = "#ef4444";
                      e.target.style.transform = "scale(1)";
                    }}
                    aria-label="Remove Medicine"
                  >
                    <FaTrash style={{ width: "1.25rem", height: "1.25rem" }} />
                  </button>
                </motion.div>
              ))}
              <button
                type="button"
                onClick={addMedicine}
                style={{
                  marginTop: "1rem",
                  padding: "0.5rem 1rem",
                  backgroundColor: "#14b8a6",
                  color: "#ffffff",
                  borderRadius: "0.375rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  cursor: allMedicines.length === 0 ? "not-allowed" : "pointer",
                  transition: "background-color 0.2s",
                  opacity: allMedicines.length === 0 ? 0.5 : 1,
                }}
                onMouseOver={(e) =>
                  allMedicines.length > 0 &&
                  (e.target.style.backgroundColor = "#0d9488")
                }
                onMouseOut={(e) =>
                  allMedicines.length > 0 &&
                  (e.target.style.backgroundColor = "#14b8a6")
                }
                disabled={allMedicines.length === 0}
              >
                <FaPlus /> Add Medicine
              </button>
              {allMedicines.length === 0 && (
                <p
                  style={{
                    marginTop: "0.5rem",
                    fontSize: "0.875rem",
                    color: "#d97706",
                    fontFamily: "'Noto Nastaliq Urdu', sans-serif",
                  }}
                >
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
              style={{
                backgroundColor: "#f9fafb",
                padding: "1.5rem",
                borderRadius: "0.75rem",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
              }}
            >
              <h3
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "600",
                  color: "#1f2937",
                  marginBottom: "1.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <FaNotesMedical
                  style={{
                    color: "#f97316",
                    width: "1.5rem",
                    height: "1.5rem",
                  }}
                />
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
              style={{
                backgroundColor: "#f9fafb",
                padding: "1.5rem",
                borderRadius: "0.75rem",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
              }}
            >
              <h3
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "600",
                  color: "#1f2937",
                  marginBottom: "1.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <FaNotesMedical
                  style={{
                    color: "#ec4899",
                    width: "1.5rem",
                    height: "1.5rem",
                  }}
                />
                Follow-ups
              </h3>
              {editFormData.follow_ups?.map((followUp, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: "1rem",
                    padding: "1rem",
                    backgroundColor: "#ffffff",
                    borderRadius: "0.5rem",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "1rem",
                  }}
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
            </motion.div>

            {/* Form Actions */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "1rem",
                marginTop: "2rem",
              }}
            >
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: "#e5e7eb",
                  color: "#374151",
                  borderRadius: "0.375rem",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseOver={(e) =>
                  (e.target.style.backgroundColor = "#d1d5db")
                }
                onMouseOut={(e) => (e.target.style.backgroundColor = "#e5e7eb")}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editLoading}
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: "#14b8a6",
                  color: "#ffffff",
                  borderRadius: "0.375rem",
                  cursor: editLoading ? "not-allowed" : "pointer",
                  transition: "background-color 0.2s, opacity 0.2s",
                  opacity: editLoading ? 0.5 : 1,
                  border: "none",
                  fontSize: "1rem",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                  ...(!editLoading && {
                    ":hover": {
                      backgroundColor: "#0d9488",
                    },
                    ":active": {
                      backgroundColor: "#0f766e",
                      transform: "scale(0.98)",
                    },
                  }),
                }}
              >
                {editLoading ? (
                  <>
                    <span
                      style={{
                        display: "inline-block",
                        animation: "spin 1s linear infinite",
                        marginRight: "0.5rem",
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                    </span>
                    Saving...
                  </>
                ) : (
                  "Update Consultation"
                )}
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

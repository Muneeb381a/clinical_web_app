import { useState, useEffect } from "react";
import Select from "react-select";
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
  // Tablet options
  { value: "0.25", label: "ایک چوتھائی گولی" },
  { value: "0.33", label: "ایک تہائی گولی" },
  { value: "0.5", label: "آدھی گولی" },
  { value: "0.66", label: "دو تہائی گولی" },
  { value: "0.75", label: "تین چوتھائی گولی" },
  { value: "1", label: "ایک گولی" },
  { value: "1.25", label: "سوا ایک گولی" },
  { value: "1.33", label: "ایک اور تہائی گولی" },
  { value: "1.5", label: "ڈیڑھ گولی" },
  { value: "1.66", label: "ایک اور دو تہائی گولی" },
  { value: "1.75", label: "ایک اور تین چوتھائی گولی" },
  { value: "2", label: "دو گولیاں" },
  { value: "2.25", label: "سوا دو گولیاں" },
  { value: "2.33", label: "دو اور ایک تہائی گولیاں" },
  { value: "2.5", label: "ڈھائی گولیاں" },
  { value: "2.66", label: "دو اور دو تہائی گولیاں" },
  { value: "2.75", label: "دو اور تین چوتھائی گولیاں" },
  { value: "3", label: "تین گولیاں" },
  { value: "3.25", label: "سوا تین گولیاں" },
  { value: "3.33", label: "تین اور ایک تہائی گولیاں" },
  { value: "3.5", label: "ساڑھے تین گولیاں" },
  { value: "3.66", label: "تین اور دو تہائی گولیاں" },
  { value: "3.75", label: "تین اور تین چوتھائی گولیاں" },
  { value: "4", label: "چار گولیاں" },
  { value: "4.25", label: "سوا چار گولیاں" },
  { value: "4.33", label: "چار اور ایک تہائی گولیاں" },
  { value: "4.5", label: "ساڑھے چار گولیاں" },
  { value: "4.66", label: "چار اور دو تہائی گولیاں" },
  { value: "4.75", label: "چار اور تین چوتھائی گولیاں" },
  { value: "5", label: "پانچ گولیاں" },
  { value: "5.25", label: "سوا پانچ گولیاں" },
  { value: "5.33", label: "پانچ اور ایک تہائی گولیاں" },
  { value: "5.5", label: "ساڑھے پانچ گولیاں" },
  { value: "5.66", label: "پانچ اور دو تہائی گولیاں" },
  { value: "5.75", label: "پانچ اور تین چوتھائی گولیاں" },
  { value: "6", label: "چھ گولیاں" },
  { value: "6.25", label: "سوا چھ گولیاں" },
  { value: "6.33", label: "چھ اور ایک تہائی گولیاں" },
  { value: "6.5", label: "ساڑھے چھ گولیاں" },
  { value: "6.66", label: "چھ اور دو تہائی گولیاں" },
  { value: "6.75", label: "چھ اور تین چوتھائی گولیاں" },
  { value: "7", label: "سات گولیاں" },
  { value: "7.25", label: "سوا سات گولیاں" },
  { value: "7.33", label: "سات اور ایک تہائی گولیاں" },
  { value: "7.5", label: "ساڑھے سات گولیاں" },
  { value: "7.66", label: "سات اور دو تہائی گولیاں" },
  { value: "7.75", label: "سات اور تین چوتھائی گولیاں" },
  { value: "8", label: "آٹھ گولیاں" },
  { value: "8.5", label: "ساڑھے آٹھ گولیاں" },
  { value: "9", label: "نو گولیاں" },
  { value: "9.5", label: "ساڑھے نو گولیاں" },
  { value: "10", label: "دس گولیاں" },
  { value: "11", label: "گیارہ گولیاں" },
  { value: "12", label: "بارہ گولیاں" },
  { value: "13", label: "تیرہ گولیاں" },
  { value: "14", label: "چودہ گولیاں" },
  { value: "15", label: "پندرہ گولیاں" },

  // Capsule options
  { value: "1_capsule", label: "ایک کیپسول" },
  { value: "2_capsules", label: "دو کیپسول" },
  { value: "3_capsules", label: "تین کیپسول" },

  // Spoon measurements
  { value: "quarter_spoon", label: "چوتھائی چمچ" },
  { value: "third_spoon", label: "تہائی چمچ" },
  { value: "half_spoon", label: "آدھا چمچ" },
  { value: "two_thirds_spoon", label: "دو تہائی چمچ" },
  { value: "three_quarters_spoon", label: "تین چوتھائی چمچ" },
  { value: "one_spoon", label: "ایک چمچ" },
  { value: "one_and_quarter_spoons", label: "سوا ایک چمچ" },
  { value: "one_and_third_spoons", label: "ایک اور تہائی چمچ" },
  { value: "one_and_half_spoon", label: "ڈیڑھ چمچ" },
  { value: "one_and_two_thirds_spoons", label: "ایک اور دو تہائی چمچ" },
  { value: "one_and_three_quarters_spoons", label: "ایک اور تین چوتھائی چمچ" },
  { value: "two_spoons", label: "دو چمچ" },
  { value: "two_and_half_spoons", label: "ڈھائی چمچ" },
  { value: "three_spoons", label: "تین چمچ" },
  { value: "three_and_half_spoons", label: "ساڑھے تین چمچ" },
  { value: "four_spoons", label: "چار چمچ" },
  { value: "five_spoons", label: "پانچ چمچ" },

  // ML measurements
  { value: "0.5_ml", label: "آدھا ملی لیٹر" },
  { value: "1_ml", label: "ایک ملی لیٹر" },
  { value: "1.5_ml", label: "ڈیڑھ ملی لیٹر" },
  { value: "2_ml", label: "دو ملی لیٹر" },
  { value: "2.5_ml", label: "ڈھائی ملی لیٹر" },
  { value: "3_ml", label: "تین ملی لیٹر" },
  { value: "3.5_ml", label: "ساڑھے تین ملی لیٹر" },
  { value: "4_ml", label: "چار ملی لیٹر" },
  { value: "4.5_ml", label: "ساڑھے چار ملی لیٹر" },
  { value: "5_ml", label: "پانچ ملی لیٹر" },
  { value: "5.5_ml", label: "ساڑھے پانچ ملی لیٹر" },
  { value: "6_ml", label: "چھ ملی لیٹر" },
  { value: "6.5_ml", label: "ساڑھے چھ ملی لیٹر" },
  { value: "7_ml", label: "سات ملی لیٹر" },
  { value: "7.5_ml", label: "ساڑھے سات ملی لیٹر" },
  { value: "8_ml", label: "آٹھ ملی لیٹر" },
  { value: "8.5_ml", label: "ساڑھے آٹھ ملی لیٹر" },
  { value: "9_ml", label: "نو ملی لیٹر" },
  { value: "9.5_ml", label: "ساڑھے نو ملی لیٹر" },
  { value: "10_ml", label: "دس ملی لیٹر" },
  { value: "12.5_ml", label: "ساڑھے بارہ ملی لیٹر" },
  { value: "15_ml", label: "پندرہ ملی لیٹر" },
  { value: "20_ml", label: "بیس ملی لیٹر" },
  { value: "25_ml", label: "پچیس ملی لیٹر" },
  { value: "30_ml", label: "تیس ملی لیٹر" },
  { value: "40_ml", label: "چالیس ملی لیٹر" },
  { value: "50_ml", label: "پچاس ملی لیٹر" },
  { value: "60_ml", label: "ساٹھ ملی لیٹر" },
  { value: "75_ml", label: "پچھتر ملی لیٹر" },
  { value: "100_ml", label: "سو ملی لیٹر" },
  { value: "125_ml", label: "سو پچیس ملی لیٹر" },
  { value: "150_ml", label: "سو پچاس ملی لیٹر" },
  { value: "200_ml", label: "دو سو ملی لیٹر" },

  // Droplets
  { value: "one_droplet", label: "ایک قطرہ" },
  { value: "two_droplets", label: "دو قطرے" },
  { value: "three_droplets", label: "تین قطرے" },
  { value: "four_droplets", label: "چار قطرے" },
  { value: "five_droplets", label: "پانچ قطرے" },
  { value: "six_droplets", label: "چھ قطرے" },
  { value: "seven_droplets", label: "سات قطرے" },
  { value: "eight_droplets", label: "آٹھ قطرے" },
  { value: "nine_droplets", label: "نو قطرے" },
  { value: "ten_droplets", label: "دس قطرے" },
  { value: "twelve_droplets", label: "بارہ قطرے" },
  { value: "fifteen_droplets", label: "پندرہ قطرے" },
  { value: "twenty_droplets", label: "بیس قطرے" },

  // Injections
  { value: "quarter_injection", label: "چوتھائی ٹیکہ" },
  { value: "third_injection", label: "تہائی ٹیکہ" },
  { value: "half_injection", label: "آدھا ٹیکہ" },
  { value: "two_thirds_injection", label: "دو تہائی ٹیکہ" },
  { value: "three_quarters_injection", label: "تین چوتھائی ٹیکہ" },
  { value: "one_injection", label: "ایک ٹیکہ" },
  { value: "one_and_quarter_injections", label: "سوا ایک ٹیکہ" },
  { value: "one_and_third_injections", label: "ایک اور تہائی ٹیکہ" },
  { value: "one_and_half_injection", label: "ڈیڑھ ٹیکہ" },
  { value: "one_and_two_thirds_injections", label: "ایک اور دو تہائی ٹیکہ" },
  {
    value: "one_and_three_quarters_injections",
    label: "ایک اور تین چوتھائی ٹیکہ",
  },
  { value: "two_injections", label: "دو ٹیکے" },
  { value: "two_and_half_injections", label: "ڈھائی ٹیکے" },
  { value: "three_injections", labelthink: "ساڑھے تین ٹیکے" },
  { value: "three_and_half_injections", label: "ساڑھے تین ٹیکے" },
  { value: "four_injections", label: "چار ٹیکے" },
  { value: "five_injections", label: "پانچ ٹیکے" },

  // Sachets
  { value: "quarter_sachet", label: "چوتھائی ساشے" },
  { value: "third_sachet", label: "تہائی ساشے" },
  { value: "half_sachet", label: "آدھا ساشے" },
  { value: "two_thirds_sachet", label: "دو تہائی ساشے" },
  { value: "three_quarters_sachet", label: "تین چوتھائی ساشے" },
  { value: "one_sachet", label: "ایک ساشے" },
  { value: "one_and_quarter_sachets", label: "سوا ایک ساشے" },
  { value: "one_and_third_sachets", label: "ایک اور تہائی ساشے" },
  { value: "one_and_half_sachet", label: "ڈیڑھ ساشے" },
  { value: "one_and_two_thirds_sachets", label: "ایک اور دو تہائی ساشے" },
  {
    value: "one_and_three_quarters_sachets",
    label: "ایک اور تین چوتھائی ساشے",
  },
  { value: "two_sachets", label: "دو ساشے" },
  { value: "two_and_half_sachets", label: "ڈھائی ساشے" },
  { value: "three_sachets", label: "تین ساشے" },
  { value: "three_and_half_sachets", label: "ساڑھے تین ساشے" },
  { value: "four_sachets", label: "چار ساشے" },
  { value: "five_sachets", label: "پانچ ساشے" },

  // Special cases
  { value: "headache_mild", label: "ہلکے سر درد کے لیے" },
  { value: "headache_moderate", label: "معتدل سر درد کے لیے" },
  { value: "headache_severe", label: "شدید سر درد کے لیے" },
  { value: "pain_mild", label: "ہلکے درد کے لیے" },
  { value: "pain_moderate", label: "معتدل درد کے لیے" },
  { value: "pain_severe", label: "شدید درد کے لیے" },
  { value: "as_needed", label: "ضرورت کے مطابق" },
  { value: "before_meal", label: "کھانے سے پہلے" },
  { value: "after_meal", label: "کھانے کے بعد" },
  { value: "with_meal", label: "کھانے کے ساتھ" },
  { value: "empty_stomach", label: "خالی پیٹ" },
  { value: "at_bedtime", label: "سونے سے پہلے" },

  // Frequencies
  { value: "every_2_hours", label: "ہر 2 گھنٹے بعد" },
  { value: "every_3_hours", label: "ہر 3 گھنٹے بعد" },
  { value: "every_4_hours", label: "ہر 4 گھنٹے بعد" },
  { value: "every_5_hours", label: "ہر 5 گھنٹے بعد" },
  { value: "every_6_hours", label: "ہر 6 گھنٹے بعد" },
  { value: "every_8_hours", label: "ہر 8 گھنٹے بعد" },
  { value: "every_12_hours", label: "ہر 12 گھنٹے بعد" },
  { value: "once_a_day", label: "دن میں ایک بار" },
  { value: "twice_a_day", label: "دن میں دو بار" },
  { value: "three_times_a_day", label: "دن میں تین بار" },
  { value: "four_times_a_day", label: "دن میں چار بار" },
  { value: "five_times_a_day", label: "دن میں پانچ بار" },
  { value: "every_other_day", label: "ایک دن چھوڑ کر" },
  { value: "twice_a_week", label: "ہفتے میں دو بار" },
  { value: "thrice_a_week", label: "ہفتے میں تین بار" },
  { value: "once_a_week", label: "ہفتے میں ایک بار" },
  { value: "once_a_month", label: "مہینے میں ایک بار" },
  { value: "as_directed", label: "ڈاکٹر کے مشورے کے مطابق" },
];

const dosageValueToLabel = {
  0.25: "ایک چوتھائی گولی",
  0.33: "ایک تہائی گولی",
  0.5: "آدھی گولی",
  0.66: "دو تہائی گولی",
  0.75: "تین چوتھائی گولی",
  1: "ایک گولی",
  1.25: "سوا ایک گولی",
  1.33: "ایک اور تہائی گولی",
  1.5: "ڈیڑھ گولی",
  1.66: "ایک اور دو تہائی گولی",
  1.75: "ایک اور تین چوتھائی گولی",
  2: "دو گولیاں",
  2.25: "سوا دو گولیاں",
  2.33: "دو اور ایک تہائی گولیاں",
  2.5: "ڈھائی گولیاں",
  2.66: "دو اور دو تہائی گولیاں",
  2.75: "دو اور تین چوتھائی گولیاں",
  3: "تین گولیاں",
  3.25: "سوا تین گولیاں",
  3.33: "تین اور ایک تہائی گولیاں",
  3.5: "ساڑھے تین گولیاں",
  3.66: "تین اور دو تہائی گولیاں",
  3.75: "تین اور تین چوتھائی گولیاں",
  4: "چار گولیاں",
  4.25: "سوا چار گولیاں",
  4.33: "چار اور ایک تہائی گولیاں",
  4.5: "ساڑھے چار گولیاں",
  4.66: "چار اور دو تہائی گولیاں",
  4.75: "چار اور تین چوتھائی گولیاں",
  5: "پانچ گولیاں",
  5.25: "سوا پانچ گولیاں",
  5.33: "پانچ اور ایک تہائی گولیاں",
  5.5: "ساڑھے پانچ گولیاں",
  5.66: "پانچ اور دو تہائی گولیاں",
  5.75: "پانچ اور تین چوتھائی گولیاں",
  6: "چھ گولیاں",
  6.25: "سوا چھ گولیاں",
  6.33: "چھ اور ایک تہائی گولیاں",
  6.5: "ساڑھے چھ گولیاں",
  6.66: "چھ اور دو تہائی گولیاں",
  6.75: "چھ اور تین چوتھائی گولیاں",
  7: "سات گولیاں",
  7.25: "سوا سات گولیاں",
  7.33: "سات اور ایک تہائی گولیاں",
  7.5: "ساڑھے سات گولیاں",
  7.66: "سات اور دو تہائی گولیاں",
  7.75: "سات اور تین چوتھائی گولیاں",
  8: "آٹھ گولیاں",
  8.5: "ساڑھے آٹھ گولیاں",
  9: "نو گولیاں",
  9.5: "ساڑھے نو گولیاں",
  10: "دس گولیاں",
  11: "گیارہ گولیاں",
  12: "بارہ گولیاں",
  13: "تیرہ گولیاں",
  14: "چودہ گولیاں",
  15: "پندرہ گولیاں",
  "1_capsule": "ایک کیپسول",
  "2_capsules": "دو کیپسول",
  "3_capsules": "تین کیپسول",
  quarter_spoon: "چوتھائی چمچ",
  third_spoon: "تہائی چمچ",
  half_spoon: "آدھا چمچ",
  two_thirds_spoon: "دو تہائی چمچ",
  three_quarters_spoon: "تین چوتھائی چمچ",
  one_spoon: "ایک چمچ",
  one_and_quarter_spoons: "سوا ایک چمچ",
  one_and_third_spoons: "ایک اور تہائی چمچ",
  one_and_half_spoon: "ڈیڑھ چمچ",
  one_and_two_thirds_spoons: "ایک اور دو تہائی چمچ",
  one_and_three_quarters_spoons: "ایک اور تین چوتھائی چمچ",
  two_spoons: "دو چمچ",
  two_and_half_spoons: "ڈھائی چمچ",
  three_spoons: "تین چمچ",
  three_and_half_spoons: "ساڑھے تین چمچ",
  four_spoons: "چار چمچ",
  five_spoons: "پانچ چمچ",
  "0.5_ml": "آدھا ملی لیٹر",
  "1_ml": "ایک ملی لیٹر",
  "1.5_ml": "ڈیڑھ ملی لیٹر",
  "2_ml": "دو ملی لیٹر",
  "2.5_ml": "ڈھائی ملی لیٹر",
  "3_ml": "تین ملی لیٹر",
  "3.5_ml": "ساڑھے تین ملی لیٹر",
  "4_ml": "چار ملی لیٹر",
  "4.5_ml": "ساڑھے چار ملی لیٹر",
  "5_ml": "پانچ ملی لیٹر",
  "5.5_ml": "ساڑھے پانچ ملی لیٹر",
  "6_ml": "چھ ملی لیٹر",
  "6.5_ml": "ساڑھے چھ ملی لیٹر",
  "7_ml": "سات ملی لیٹر",
  "7.5_ml": "ساڑھے سات ملی لیٹر",
  "8_ml": "آٹھ ملی لیٹر",
  "8.5_ml": "ساڑھے آٹھ ملی لیٹر",
  "9_ml": "نو ملی لیٹر",
  "9.5_ml": "ساڑھے نو ملی لیٹر",
  "10_ml": "دس ملی لیٹر",
  "12.5_ml": "ساڑھے بارہ ملی لیٹر",
  "15_ml": "پندرہ ملی لیٹر",
  "20_ml": "بیس ملی لیٹر",
  "25_ml": "پچیس ملی لیٹر",
  "30_ml": "تیس ملی لیٹر",
  "40_ml": "چالیس ملی لیٹر",
  "50_ml": "پچاس ملی لیٹر",
  "60_ml": "ساٹھ ملی لیٹر",
  "75_ml": "پچھتر ملی لیٹر",
  "100_ml": "سو ملی لیٹر",
  "125_ml": "سو پچیس ملی لیٹر",
  "150_ml": "سو پچاس ملی لیٹر",
  "200_ml": "دو سو ملی لیٹر",
  one_droplet: "ایک قطرہ",
  two_droplets: "دو قطرے",
  three_droplets: "تین قطرے",
  four_droplets: "چار قطرے",
  five_droplets: "پانچ قطرے",
  six_droplets: "چھ قطرے",
  seven_droplets: "سات قطرے",
  eight_droplets: "آٹھ قطرے",
  nine_droplets: "نو قطرے",
  ten_droplets: "دس قطرے",
  twelve_droplets: "بارہ قطرے",
  fifteen_droplets: "پندرہ قطرے",
  twenty_droplets: "بیس قطرے",
  quarter_injection: "چوتھائی ٹیکہ",
  third_injection: "تہائی ٹیکہ",
  half_injection: "آدھا ٹیکہ",
  two_thirds_injection: "دو تہائی ٹیکہ",
  three_quarters_injection: "تین چوتھائی ٹیکہ",
  one_injection: "ایک ٹیکہ",
  one_and_quarter_injections: "سوا ایک ٹیکہ",
  one_and_third_injections: "ایک اور تہائی ٹیکہ",
  one_and_half_injection: "ڈیڑھ ٹیکہ",
  one_and_two_thirds_injections: "ایک اور دو تہائی ٹیکہ",
  one_and_three_quarters_injections: "ایک اور تین چوتھائی ٹیکہ",
  two_injections: "دو ٹیکے",
  two_and_half_injections: "ڈھائی ٹیکے",
  three_injections: "تین ٹیکے",
  three_and_half_injections: "ساڑھے تین ٹیکے",
  four_injections: "چار ٹیکے",
  five_injections: "پانچ ٹیکے",
  quarter_sachet: "چوتھائی ساشے",
  third_sachet: "تہائی ساشے",
  half_sachet: "آدھا ساشے",
  two_thirds_sachet: "دو تہائی ساشے",
  three_quarters_sachet: "تین چوتھائی ساشے",
  one_sachet: "ایک ساشے",
  one_and_quarter_sachets: "سوا ایک ساشے",
  one_and_third_sachets: "ایک اور تہائی ساشے",
  one_and_half_sachet: "ڈیڑھ ساشے",
  one_and_two_thirds_sachets: "ایک اور دو تہائی ساشے",
  one_and_three_quarters_sachets: "ایک اور تین چوتھائی ساشے",
  two_sachets: "دو ساشے",
  two_and_half_sachets: "ڈھائی ساشے",
  three_sachets: "تین ساشے",
  three_and_half_sachets: "ساڑھے تین ساشے",
  four_sachets: "چار ساشے",
  five_sachets: "پانچ ساشے",
  headache_mild: "ہلکے سر درد کے لیے",
  headache_moderate: "معتدل سر درد کے لیے",
  headache_severe: "شدید سر درد کے لیے",
  pain_mild: "ہلکے درد کے لیے",
  pain_moderate: "معتدل درد کے لیے",
  pain_severe: "شدید درد کے لیے",
  as_needed: "ضرورت کے مطابق",
  before_meal: "کھانے سے پہلے",
  after_meal: "کھانے کے بعد",
  with_meal: "کھانے کے ساتھ",
  empty_stomach: "خالی پیٹ",
  at_bedtime: "سونے سے پہلے",
  every_2_hours: "ہر 2 گھنٹے بعد",
  every_3_hours: "ہر 3 گھنٹے بعد",
  every_4_hours: "ہر 4 گھنٹے بعد",
  every_5_hours: "ہر 5 گھنٹے بعد",
  every_6_hours: "ہر 6 گھنٹے بعد",
  every_8_hours: "ہر 8 گھنٹے بعد",
  every_12_hours: "ہر 12 گھنٹے بعد",
  once_a_day: "دن میں ایک بار",
  twice_a_day: "دن میں دو بار",
  three_times_a_day: "دن میں تین بار",
  four_times_a_day: "دن میں چار بار",
  five_times_a_day: "دن میں پانچ بار",
  every_other_day: "ایک دن چھوڑ کر",
  twice_a_week: "ہفتے میں دو بار",
  thrice_a_week: "ہفتے میں تین بار",
  once_a_week: "ہفتے میں ایک بار",
  once_a_month: "مہینے میں ایک بار",
  as_directed: "ڈاکٹر کے مشورے کے مطابق",
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
  { value: "24_hours", label: "چوبیس گھنٹے" },
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
  "24_hours": "چوبیس گھنٹے",
};

const durationOptions = [
  // Days
  { value: "1_day", label: "1 دن" },
  { value: "2_days", label: "2 دن" },
  { value: "3_days", label: "3 دن" },
  { value: "4_days", label: "4 دن" },
  { value: "5_days", label: "5 دن" },
  { value: "6_days", label: "6 دن" },
  { value: "7_days", label: "1 ہفتہ (7 دن)" },
  { value: "8_days", label: "8 دن" },
  { value: "9_days", label: "9 دن" },
  { value: "10_days", label: "10 دن" },
  { value: "11_days", label: "11 دن" },
  { value: "12_days", label: "12 دن" },
  { value: "13_days", label: "13 دن" },
  { value: "14_days", label: "2 ہفتے (14 دن)" },
  { value: "15_days", label: "15 دن" },
  { value: "16_days", label: "16 دن" },
  { value: "17_days", label: "17 دن" },
  { value: "18_days", label: "18 دن" },
  { value: "19_days", label: "19 دن" },
  { value: "20_days", label: "20 دن" },
  { value: "21_days", label: "3 ہفتے (21 دن)" },
  { value: "22_days", label: "22 دن" },
  { value: "23_days", label: "23 دن" },
  { value: "24_days", label: "24 دن" },
  { value: "25_days", label: "25 دن" },
  { value: "26_days", label: "26 دن" },
  { value: "27_days", label: "27 دن" },
  { value: "28_days", label: "4 ہفتے (28 دن)" },
  { value: "29_days", label: "29 دن" },
  { value: "30_days", label: "1 مہینہ (30 دن)" },
  { value: "31_days", label: "31 دن" },
  { value: "45_days", label: "45 دن" },
  { value: "60_days", label: "2 مہینے (60 دن)" },
  { value: "90_days", label: "3 مہینے (90 دن)" },

  // Weeks
  { value: "1_week", label: "1 ہفتہ" },
  { value: "1.5_weeks", label: "ڈیڑھ ہفتہ" },
  { value: "2_weeks", label: "2 ہفتے" },
  { value: "2.5_weeks", label: "ڈھائی ہفتے" },
  { value: "3_weeks", label: "3 ہفتے" },
  { value: "3.5_weeks", label: "ساڑھے تین ہفتے" },
  { value: "4_weeks", label: "1 مہینہ (4 ہفتے)" },
  { value: "5_weeks", label: "5 ہفتے" },
  { value: "6_weeks", label: "6 ہفتے" },
  { value: "7_weeks", label: "7 ہفتے" },
  { value: "8_weeks", label: "2 مہینے (8 ہفتے)" },
  { value: "9_weeks", label: "9 ہفتے" },
  { value: "10_weeks", label: "10 ہفتے" },
  { value: "11_weeks", label: "11 ہفتے" },
  { value: "12_weeks", label: "3 مہینے (12 ہفتے)" },
  { value: "16_weeks", label: "4 مہینے (16 ہفتے)" },
  { value: "20_weeks", label: "5 مہینے (20 ہفتے)" },
  { value: "24_weeks", label: "6 مہینے (24 ہفتے)" },
  { value: "36_weeks", label: "9 مہینے (36 ہفتے)" },
  { value: "48_weeks", label: "12 مہینے (48 ہفتے)" },

  // Months
  { value: "1_month", label: "1 مہینہ" },
  { value: "1.5_months", label: "ڈیڑھ مہینہ" },
  { value: "2_months", label: "2 مہینے" },
  { value: "2.5_months", label: "ڈھائی مہینے" },
  { value: "3_months", label: "3 مہینے" },
  { value: "3.5_months", label: "ساڑھے تین مہینے" },
  { value: "4_months", label: "4 مہینے" },
  { value: "5_months", label: "5 مہینے" },
  { value: "6_months", label: "6 مہینے" },
  { value: "7_months", label: "7 مہینے" },
  { value: "8_months", label: "8 مہینے" },
  { value: "9_months", label: "9 مہینے" },
  { value: "10_months", label: "10 مہینے" },
  { value: "11_months", label: "11 مہینے" },
  { value: "12_months", label: "12 مہینے (1 سال)" },
  { value: "18_months", label: "18 مہینے (ڈیڑھ سال)" },
  { value: "24_months", label: "24 مہینے (2 سال)" },
  { value: "36_months", label: "36 مہینے (3 سال)" },

  // Years
  { value: "1_year", label: "1 سال" },
  { value: "1.5_years", label: "ڈیڑھ سال" },
  { value: "2_years", label: "2 سال" },
  { value: "2.5_years", label: "ڈھائی سال" },
  { value: "3_years", label: "3 سال" },
  { value: "4_years", label: "4 سال" },
  { value: "5_years", label: "5 سال" },
  { value: "10_years", label: "10 سال" },

  // Special Durations
  { value: "as_needed", label: "ضرورت کے مطابق" },
  { value: "until_finished", label: "دوا ختم ہونے تک" },
  { value: "lifetime", label: "زندگی بھر کے لیے" },
  { value: "short_term", label: "مختصر مدتی علاج" },
  { value: "long_term", label: "طویل مدتی علاج" },
  { value: "medium_term", label: "درمیانی مدتی علاج (2-4 ہفتے)" },
  { value: "until_improved", label: "بہتری تک" },
  { value: "until_test_normal", label: "ٹیسٹ معمول ہونے تک" },
  { value: "until_symptoms_resolve", label: "علامات ختم ہونے تک" },
  { value: "continuous", label: "مسلسل استعمال" },
  { value: "intermittent", label: "وقتاً فوقتاً استعمال" },
  { value: "cyclic", label: "چکری استعمال (مخصوص دورانیے کے لیے)" },
  { value: "alternate_days", label: "ایک دن چھوڑ کر" },
  {
    value: "weekly_cycles",
    label: "ہفتہ وار چکر (مثلاً 3 ہفتے استعمال، 1 ہفتہ آرام)",
  },
  { value: "monthly_cycles", label: "ماہانہ چکر" },
  { value: "as_prescribed", label: "ڈاکٹر کے مشورے کے مطابق" },
];

const durationValueToLabel = {
  // Days
  "1_day": "1 دن",
  "2_days": "2 دن",
  "3_days": "3 دن",
  "4_days": "4 دن",
  "5_days": "5 دن",
  "6_days": "6 دن",
  "7_days": "1 ہفتہ (7 دن)",
  "8_days": "8 دن",
  "9_days": "9 دن",
  "10_days": "10 دن",
  "11_days": "11 دن",
  "12_days": "12 دن",
  "13_days": "13 دن",
  "14_days": "2 ہفتے (14 دن)",
  "15_days": "15 دن",
  "16_days": "16 دن",
  "17_days": "17 دن",
  "18_days": "18 دن",
  "19_days": "19 دن",
  "20_days": "20 دن",
  "21_days": "3 ہفتے (21 دن)",
  "22_days": "22 دن",
  "23_days": "23 دن",
  "24_days": "24 دن",
  "25_days": "25 دن",
  "26_days": "26 دن",
  "27_days": "27 دن",
  "28_days": "4 ہفتے (28 دن)",
  "29_days": "29 دن",
  "30_days": "1 مہینہ (30 دن)",
  "31_days": "31 دن",
  "45_days": "45 دن",
  "60_days": "2 مہینے (60 دن)",
  "90_days": "3 مہینے (90 دن)",

  // Weeks
  "1_week": "1 ہفتہ",
  "1.5_weeks": "ڈیڑھ ہفتہ",
  "2_weeks": "2 ہفتے",
  "2.5_weeks": "ڈھائی ہفتے",
  "3_weeks": "3 ہفتے",
  "3.5_weeks": "ساڑھے تین ہفتے",
  "4_weeks": "1 مہینہ (4 ہفتے)",
  "5_weeks": "5 ہفتے",
  "6_weeks": "6 ہفتے",
  "7_weeks": "7 ہفتے",
  "8_weeks": "2 مہینے (8 ہفتے)",
  "9_weeks": "9 ہفتے",
  "10_weeks": "10 ہفتے",
  "11_weeks": "11 ہفتے",
  "12_weeks": "3 مہینے (12 ہفتے)",
  "16_weeks": "4 مہینے (16 ہفتے)",
  "20_weeks": "5 مہینے (20 ہفتے)",
  "24_weeks": "6 مہینے (24 ہفتے)",
  "36_weeks": "9 مہینے (36 ہفتے)",
  "48_weeks": "12 مہینے (48 ہفتے)",

  // Months
  "1_month": "1 مہینہ",
  "1.5_months": "ڈیڑھ مہینہ",
  "2_months": "2 مہینے",
  "2.5_months": "ڈھائی مہینے",
  "3_months": "3 مہینے",
  "3.5_months": "ساڑھے تین مہینے",
  "4_months": "4 مہینے",
  "5_months": "5 مہینے",
  "6_months": "6 مہینے",
  "7_months": "7 مہینے",
  "8_months": "8 مہینے",
  "9_months": "9 مہینے",
  "10_months": "10 مہینے",
  "11_months": "11 مہینے",
  "12_months": "12 مہینے (1 سال)",
  "18_months": "18 مہینے (ڈیڑھ سال)",
  "24_months": "24 مہینے (2 سال)",
  "36_months": "36 مہینے (3 سال)",

  // Years
  "1_year": "1 سال",
  "1.5_years": "ڈیڑھ سال",
  "2_years": "2 سال",
  "2.5_years": "ڈھائی سال",
  "3_years": "3 سال",
  "4_years": "4 سال",
  "5_years": "5 سال",
  "10_years": "10 سال",

  // Special Durations
  as_needed: "ضرورت کے مطابق",
  until_finished: "دوا ختم ہونے تک",
  lifetime: "زندگی بھر کے لیے",
  short_term: "مختصر مدتی علاج",
  long_term: "طویل مدتی علاج",
  medium_term: "درمیانی مدتی علاج (2-4 ہفتے)",
  until_improved: "بہتری تک",
  until_test_normal: "ٹیسٹ معمول ہونے تک",
  until_symptoms_resolve: "علامات ختم ہونے تک",
  continuous: "مسلسل استعمال",
  intermittent: "وقتاً فوقتاً استعمال",
  cyclic: "چکری استعمال (مخصوص دورانیے کے لیے)",
  alternate_days: "ایک دن چھوڑ کر",
  weekly_cycles: "ہفتہ وار چکر (مثلاً 3 ہفتے استعمال، 1 ہفتہ آرام)",
  monthly_cycles: "ماہانہ چکر",
  as_prescribed: "ڈاکٹر کے مشورے کے مطابق",
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
  { value: "as_directed", label: "ڈاکٹر کے مشورے سے" },
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
  as_directed: "ڈاکٹر کے مشورے سے",
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
                    <Select
                      value={
                        med.medicine_id
                          ? allMedicines
                              .filter((m) => m.id === parseInt(med.medicine_id))
                              .map((m) => ({
                                value: m.id,
                                label: `${m.form || ""} ${m.brand_name || ""} ${
                                  m.strength || ""
                                }`.trim(),
                              }))[0]
                          : null
                      }
                      onChange={(selectedOption) => {
                        const selectedMedicine = allMedicines.find(
                          (m) => m.id === selectedOption?.value
                        );
                        updateField(
                          "prescriptions",
                          index,
                          "medicine_id",
                          selectedOption?.value || ""
                        );
                        updateField(
                          "prescriptions",
                          index,
                          "brand_name",
                          selectedMedicine?.brand_name || ""
                        );
                      }}
                      options={allMedicines.map((medicine) => ({
                        value: medicine.id,
                        label: `${medicine.form || ""} ${
                          medicine.brand_name || ""
                        } ${medicine.strength || ""}`.trim(),
                      }))}
                      placeholder={
                        allMedicines.length === 0 && med.brand_name
                          ? med.brand_name
                          : "دوائی منتخب کریں"
                      }
                      isSearchable={true}
                      isClearable={true}
                      isDisabled={allMedicines.length === 0 && !med.brand_name}
                      styles={{
                        control: (provided, state) => ({
                          ...provided,
                          padding: "0.25rem",
                          border: `1px solid ${
                            state.isFocused ? "#14b8a6" : "#d1d5db"
                          }`,
                          borderRadius: "0.375ram",
                          backgroundColor: "#ffffff",
                          fontSize: "0.875rem",
                          color: "#374151",
                          boxShadow: state.isFocused
                            ? "0 0 0 1px #14b8a6"
                            : "0 1px 2px rgba(0, 0, 0, 0.05)",
                          "&:hover": {
                            borderColor: "#14b8a6",
                          },
                        }),
                        option: (provided, state) => ({
                          ...provided,
                          color: state.isSelected ? "#ffffff" : "#374151",
                          backgroundColor: state.isSelected
                            ? "#14b8a6"
                            : state.isFocused
                            ? "#e0f2f1"
                            : "#ffffff",
                          fontSize: "0.875rem",
                        }),
                        placeholder: (provided) => ({
                          ...provided,
                          color: "#6b7280",
                        }),
                        singleValue: (provided) => ({
                          ...provided,
                          color: "#374151",
                        }),
                        menu: (provided) => ({
                          ...provided,
                          zIndex: 9999,
                        }),
                      }}
                      noOptionsMessage={() => "کوئی دوائی نہیں ملی"}
                    />
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

import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import CreatableSelect from "react-select/creatable";
import Select from "react-select";
import { AiOutlineCloseCircle, AiOutlinePlus } from "react-icons/ai";
import Loader from "./Loader";

const MEDICINE_DEFAULTS = {
  Tablet: {
    dosage_en: "1",
    dosage_urdu: "ایک گولی",
    frequency_en: "morning",
    frequency_urdu: "صبح",
    duration_en: "7_days",
    duration_urdu: "1 ہفتہ",
    instructions_en: "after_meal",
    instructions_urdu: "کھانے کے بعد",
  },
};

const PrescriptionManagementSection = ({
  selectedMedicines = [],
  setSelectedMedicines,
  customSelectStyles,
  medicines,
  refreshMedicines,
}) => {
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (medicines.length === 0) {
      toast.warn("No medicines available. Please create a new medicine.");
    }
  }, [medicines]);

  const handleCreateMedicine = async (inputValue) => {
    if (!inputValue.trim()) {
      toast.error("Medicine name cannot be empty");
      return null;
    }
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
          form: "Tablet",
          brand_name: inputValue,
        },
        { timeout: 10000 }
      );
      const newMedicine = response.data;
      if (!newMedicine.id) {
        throw new Error("Server did not return a valid medicine ID");
      }
      const formattedMedicine = {
        value: String(newMedicine.id),
        label: `${newMedicine.form || "Tablet"} ${newMedicine.brand_name}${
          newMedicine.strength ? ` (${newMedicine.strength})` : ""
        }`,
        raw: newMedicine,
      };
      console.log("Created medicine:", newMedicine);
      // Verify creation
      const verifyRes = await axios.get(
        "https://patient-management-backend-nine.vercel.app/api/medicines"
      );
      const createdMedicine = verifyRes.data.find(
        (m) => String(m.id) === String(newMedicine.id)
      );
      if (!createdMedicine) {
        console.warn("Created medicine not found in database:", newMedicine);
        toast.error("Medicine created but not saved. Please retry.");
        return null;
      }
      // Update medicines via refresh
      await refreshMedicines();
      console.log("Verified created medicine:", createdMedicine);
      toast.success(`Medicine "${inputValue}" created`);
      return String(newMedicine.id);
    } catch (error) {
      console.error("Medicine creation failed:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      toast.error(error.response?.data?.error || "Failed to create medicine");
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddMedicine = async (inputValue = null) => {
    let newId = null;
    if (inputValue) {
      newId = await handleCreateMedicine(inputValue);
      if (!newId) return;
    }
    setSelectedMedicines((prev) => [
      ...prev,
      {
        medicine_id: newId || "",
        form: "Tablet",
        dosage_en: MEDICINE_DEFAULTS.Tablet.dosage_en,
        dosage_urdu: MEDICINE_DEFAULTS.Tablet.dosage_urdu,
        frequency_en: MEDICINE_DEFAULTS.Tablet.frequency_en,
        frequency_urdu: MEDICINE_DEFAULTS.Tablet.frequency_urdu,
        duration_en: MEDICINE_DEFAULTS.Tablet.duration_en,
        duration_urdu: MEDICINE_DEFAULTS.Tablet.duration_urdu,
        instructions_en: MEDICINE_DEFAULTS.Tablet.instructions_en,
        instructions_urdu: MEDICINE_DEFAULTS.Tablet.instructions_urdu,
      },
    ]);
    console.log("Added medicine with medicine_id:", newId || "empty");
  };

  const validateMedicines = () => {
    if (selectedMedicines.length === 0) return true;
    const invalid = selectedMedicines.some((med, index) => {
      if (!med.medicine_id || med.medicine_id === "") {
        console.warn(`Empty medicine_id at index ${index}:`, med);
        return true;
      }
      if (!medicines.some((m) => m.value === String(med.medicine_id))) {
        console.warn(`Invalid medicine_id at index ${index}:`, med);
        return true;
      }
      return false;
    });
    if (invalid) {
      toast.error(
        "Some medicines are invalid or not recognized. Please select valid medicines or remove entries."
      );
      return false;
    }
    return true;
  };

  // Modified to allow selecting the same medicine multiple times
  const getAvailableMedicines = () => {
    return medicines; // Return all medicines without filtering
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="bg-purple-600 p-2 rounded-lg text-white">💊</div>
        <h3 className="text-lg font-semibold text-gray-800">
          Prescription Management
        </h3>
      </div>

      {/* Optional: Add note for user clarity */}
      <p className="text-sm text-gray-500 mb-2">
        You can select the same medicine multiple times with different dosages
        or instructions.
      </p>

      {medicines.length === 0 && !isCreating ? (
        <div className="text-center text-gray-600">
          <p>No medicines available. Create a new medicine to proceed.</p>
          <CreatableSelect
            isLoading={isCreating}
            loadingMessage={() => "Creating medicine..."}
            options={[]}
            value={null}
            onCreateOption={(inputValue) => handleAddMedicine(inputValue)}
            placeholder="Type to create a new medicine..."
            isClearable
            styles={customSelectStyles}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {selectedMedicines.map((med, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="flex-1 grid grid-cols-5 gap-3">
                {/* Medicine Selection */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-600">
                    Medicine
                  </label>
                  <CreatableSelect
                    isLoading={isCreating}
                    loadingMessage={() => "Creating medicine..."}
                    options={getAvailableMedicines()} // Updated to use new function
                    value={
                      med.medicine_id
                        ? medicines.find(
                            (m) => m.value === String(med.medicine_id)
                          ) || {
                            value: med.medicine_id,
                            label: `Unknown (${med.medicine_id})`,
                          }
                        : null
                    }
                    onCreateOption={async (inputValue) => {
                      const newId = await handleCreateMedicine(inputValue);
                      if (newId) {
                        setSelectedMedicines((prev) =>
                          prev.map((item, i) =>
                            i === index ? { ...item, medicine_id: newId } : item
                          )
                        );
                        console.log(
                          "Selected new medicine_id:",
                          newId,
                          "for index:",
                          index
                        );
                      }
                    }}
                    onChange={(selectedOption) => {
                      const newId = selectedOption ? selectedOption.value : "";
                      if (newId && !medicines.some((m) => m.value === newId)) {
                        console.warn("Selected unknown medicine_id:", newId);
                        toast.warn(
                          `Medicine ID ${newId} is not recognized. Please create or select a valid medicine.`
                        );
                        return;
                      }
                      setSelectedMedicines((prev) =>
                        prev.map((item, i) =>
                          i === index ? { ...item, medicine_id: newId } : item
                        )
                      );
                      console.log(
                        "Medicine selected:",
                        selectedOption,
                        "new medicine_id:",
                        newId,
                        "for index:",
                        index
                      );
                    }}
                    placeholder="Select or create medicine..."
                    isClearable
                    styles={customSelectStyles}
                  />
                </div>

                {/* Frequency */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-600">
                    Frequency
                  </label>
                  <Select
                    options={[
                      { value: "morning", label: "صبح" },
                      { value: "afternoon", label: "دوپہر" },
                      { value: "evening", label: "شام" },
                      { value: "night", label: "رات" },
                      { value: "morning_evening", label: "صبح، شام" },
                      { value: "morning_night", label: "صبح، رات" },
                      { value: "afternoon_evening", label: "دوپہر، شام" },
                      { value: "afternoon_night", label: "دوپہر، رات" },
                      {
                        value: "morning_evening_night",
                        label: "صبح، شام، رات",
                      },
                      {
                        value: "morning_afternoon_evening",
                        label: "صبح، دوپہر، شام",
                      },
                      { value: "as_needed", label: "حسب ضرورت" },
                      {
                        value: "morning_afternoon_night",
                        label: "صبح، دوپہر، رات",
                      },
                      {
                        value: "afternoon_evening_night",
                        label: "دوپہر، شام، رات",
                      },
                      { value: "early_morning", label: "صبح سویرے" },
                      { value: "late_morning", label: "دیر صبح" },
                      { value: "late_afternoon", label: "دیر دوپہر" },
                      { value: "sunset", label: "غروب آفتاب" },
                      { value: "midnight", label: "آدھی رات" },
                      { value: "late_night", label: "رات دیر گئے" },
                      { value: "morning_afternoon", label: "صبح، دوپہر" },
                      { value: "evening_night", label: "شام، رات" },
                      {
                        value: "early_morning_night",
                        label: "صبح سویرے، رات",
                      },
                      {
                        value: "morning_late_afternoon",
                        label: "صبح، دیر دوپہر",
                      },
                      {
                        value: "afternoon_sunset",
                        label: "دوپہر، غروب آفتاب",
                      },
                      { value: "all_day", label: "پورا دن" },
                      { value: "all_night", label: "پوری رات" },
                      { value: "24_hours", label: "چوبیس گھنٹے" },
                    ]}
                    value={
                      med.frequency_en
                        ? {
                            value: med.frequency_en,
                            label: med.frequency_urdu,
                          }
                        : null
                    }
                    onChange={(option) => {
                      setSelectedMedicines((prev) =>
                        prev.map((item, i) =>
                          i === index
                            ? {
                                ...item,
                                frequency_en: option ? option.value : "",
                                frequency_urdu: option ? option.label : "",
                              }
                            : item
                        )
                      );
                    }}
                    placeholder="Select frequency..."
                    isClearable
                    styles={customSelectStyles}
                    className="font-urdu"
                  />
                </div>

                {/* Dosage */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-600">
                    Dosage
                  </label>
                  <Select
                    options={[
                      // Tablet options (complete fractional sequence)
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

                      // Spoon measurements (complete set)
                      { value: "quarter_spoon", label: "چوتھائی چمچ" },
                      { value: "third_spoon", label: "تہائی چمچ" },
                      { value: "half_spoon", label: "آدھا چمچ" },
                      { value: "two_thirds_spoon", label: "دو تہائی چمچ" },
                      {
                        value: "three_quarters_spoon",
                        label: "تین چوتھائی چمچ",
                      },
                      { value: "one_spoon", label: "ایک چمچ" },
                      { value: "one_and_quarter_spoons", label: "سوا ایک چمچ" },
                      {
                        value: "one_and_third_spoons",
                        label: "ایک اور تہائی چمچ",
                      },
                      { value: "one_and_half_spoon", label: "ڈیڑھ چمچ" },
                      {
                        value: "one_and_two_thirds_spoons",
                        label: "ایک اور دو تہائی چمچ",
                      },
                      {
                        value: "one_and_three_quarters_spoons",
                        label: "ایک اور تین چوتھائی چمچ",
                      },
                      { value: "two_spoons", label: "دو چمچ" },
                      { value: "two_and_half_spoons", label: "ڈھائی چمچ" },
                      { value: "three_spoons", label: "تین چمچ" },
                      {
                        value: "three_and_half_spoons",
                        label: "ساڑھے تین چمچ",
                      },
                      { value: "four_spoons", label: "چار چمچ" },
                      { value: "five_spoons", label: "پانچ چمچ" },

                      // ML measurements (complete sequence)
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

                      // Droplets (complete set)
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

                      // Injections (complete set)
                      { value: "quarter_injection", label: "چوتھائی ٹیکہ" },
                      { value: "third_injection", label: "تہائی ٹیکہ" },
                      { value: "half_injection", label: "آدھا ٹیکہ" },
                      { value: "two_thirds_injection", label: "دو تہائی ٹیکہ" },
                      {
                        value: "three_quarters_injection",
                        label: "تین چوتھائی ٹیکہ",
                      },
                      { value: "one_injection", label: "ایک ٹیکہ" },
                      {
                        value: "one_and_quarter_injections",
                        label: "سوا ایک ٹیکہ",
                      },
                      {
                        value: "one_and_third_injections",
                        label: "ایک اور تہائی ٹیکہ",
                      },
                      { value: "one_and_half_injection", label: "ڈیڑھ ٹیکہ" },
                      {
                        value: "one_and_two_thirds_injections",
                        label: "ایک اور دو تہائی ٹیکہ",
                      },
                      {
                        value: "one_and_three_quarters_injections",
                        label: "ایک اور تین چوتھائی ٹیکہ",
                      },
                      { value: "two_injections", label: "دو ٹیکے" },
                      { value: "two_and_half_injections", label: "ڈھائی ٹیکے" },
                      { value: "three_injections", label: "تین ٹیکے" },
                      {
                        value: "three_and_half_injections",
                        label: "ساڑھے تین ٹیکے",
                      },
                      { value: "four_injections", label: "چار ٹیکے" },
                      { value: "five_injections", label: "پانچ ٹیکے" },

                      // Sachets (complete set)
                      { value: "quarter_sachet", label: "چوتھائی ساشے" },
                      { value: "third_sachet", label: "تہائی ساشے" },
                      { value: "half_sachet", label: "آدھا ساشے" },
                      { value: "two_thirds_sachet", label: "دو تہائی ساشے" },
                      {
                        value: "three_quarters_sachet",
                        label: "تین چوتھائی ساشے",
                      },
                      { value: "one_sachet", label: "ایک ساشے" },
                      {
                        value: "one_and_quarter_sachets",
                        label: "سوا ایک ساشے",
                      },
                      {
                        value: "one_and_third_sachets",
                        label: "ایک اور تہائی ساشے",
                      },
                      { value: "one_and_half_sachet", label: "ڈیڑھ ساشے" },
                      {
                        value: "one_and_two_thirds_sachets",
                        label: "ایک اور دو تہائی ساشے",
                      },
                      {
                        value: "one_and_three_quarters_sachets",
                        label: "ایک اور تین چوتھائی ساشے",
                      },
                      { value: "two_sachets", label: "دو ساشے" },
                      { value: "two_and_half_sachets", label: "ڈھائی ساشے" },
                      { value: "three_sachets", label: "تین ساشے" },
                      {
                        value: "three_and_half_sachets",
                        label: "ساڑھے تین ساشے",
                      },
                      { value: "four_sachets", label: "چار ساشے" },
                      { value: "five_sachets", label: "پانچ ساشے" },

                      // Special cases
                      { value: "headache_mild", label: "ہلکے سر درد کے لیے" },
                      {
                        value: "headache_moderate",
                        label: "معتدل سر درد کے لیے",
                      },
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

                      // Frequencies (complete set)
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
                      {
                        value: "as_directed",
                        label: "ڈاکٹر کے مشورے کے مطابق",
                      },
                    ]}
                    value={
                      med.dosage_en
                        ? {
                            value: med.dosage_en,
                            label: med.dosage_urdu,
                          }
                        : null
                    }
                    onChange={(option) => {
                      setSelectedMedicines((prev) =>
                        prev.map((item, i) =>
                          i === index
                            ? {
                                ...item,
                                dosage_en: option ? option.value : "",
                                dosage_urdu: option ? option.label : "",
                              }
                            : item
                        )
                      );
                    }}
                    placeholder="Select dosage..."
                    isClearable
                    styles={customSelectStyles}
                    className="font-urdu"
                  />
                </div>

                {/* Duration */}
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

                      // Weeks (complete set)
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

                      // Months (complete set)
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

                      // Special durations
                      { value: "long_term", label: "طویل مدتی علاج" },
                      { value: "short_term", label: "مختصر مدتی علاج" },
                      { value: "as_needed", label: "ضرورت کے مطابق" },
                      {
                        value: "medium_term",
                        label: "درمیانی مدتی علاج (2-4 ہفتے)",
                      },
                      { value: "lifetime", label: "زندگی بھر کے لیے" },
                      { value: "until_improved", label: "بہتری تک" },
                      {
                        value: "until_test_normal",
                        label: "ٹیسٹ معمول ہونے تک",
                      },
                      {
                        value: "until_symptoms_resolve",
                        label: "علامات ختم ہونے تک",
                      },
                      { value: "continuous", label: "مسلسل استعمال" },
                      { value: "intermittent", label: "وقتاً فوقتاً استعمال" },
                      {
                        value: "cyclic",
                        label: "چکری استعمال (مخصوص دورانیے کے لیے)",
                      },
                      { value: "alternate_days", label: "ایک دن چھوڑ کر" },
                      {
                        value: "weekly_cycles",
                        label:
                          "ہفتہ وار چکر (مثلاً 3 ہفتے استعمال، 1 ہفتہ آرام)",
                      },
                      { value: "monthly_cycles", label: "ماہانہ چکر" },
                      {
                        value: "as_prescribed",
                        label: "ڈاکٹر کے مشورے کے مطابق",
                      },
                    ]}
                    value={
                      med.duration_en
                        ? {
                            value: med.duration_en,
                            label: med.duration_urdu,
                          }
                        : null
                    }
                    onChange={(option) => {
                      setSelectedMedicines((prev) =>
                        prev.map((item, i) =>
                          i === index
                            ? {
                                ...item,
                                duration_en: option ? option.value : "",
                                duration_urdu: option ? option.label : "",
                              }
                            : item
                        )
                      );
                    }}
                    placeholder="Select duration..."
                    isClearable
                    styles={customSelectStyles}
                    className="font-urdu"
                  />
                </div>

                {/* Instruction */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-600">
                    Instruction
                  </label>
                  <Select
                    options={[
                      { value: "before_meal", label: "کھانے سے پہلے" },
                      { value: "with_meal", label: "کھانے کے ساتھ" },
                      { value: "after_meal", label: "کھانے کے بعد" },
                      { value: "empty_stomach", label: "خالی پیٹ" },
                      { value: "between_meals", label: "کھانوں کے درمیان" },

                      // Specific meal timings
                      { value: "before_breakfast", label: "ناشتے سے پہلے" },
                      { value: "with_breakfast", label: "ناشتے کے ساتھ" },
                      { value: "after_breakfast", label: "ناشتے کے بعد" },
                      {
                        value: "before_lunch",
                        label: "دوپہر کے کھانے سے پہلے",
                      },
                      { value: "with_lunch", label: "دوپہر کے کھانے کے ساتھ" },
                      { value: "after_lunch", label: "دوپہر کے کھانے کے بعد" },
                      { value: "before_dinner", label: "رات کے کھانے سے پہلے" },
                      { value: "with_dinner", label: "رات کے کھانے کے ساتھ" },
                      { value: "after_dinner", label: "رات کے کھانے کے بعد" },
                      {
                        value: "before_snack",
                        label: "نسوار/ہلکے کھانے سے پہلے",
                      },
                      {
                        value: "with_snack",
                        label: "نسوار/ہلکے کھانے کے ساتھ",
                      },
                      {
                        value: "after_snack",
                        label: "نسوار/ہلکے کھانے کے بعد",
                      },

                      // Fluid-related timings
                      { value: "with_water", label: "پانی کے ساتھ" },
                      { value: "with_milk", label: "دودھ کے ساتھ" },
                      { value: "with_juice", label: "جوس کے ساتھ" },
                      { value: "before_tea", label: "چائے سے پہلے" },
                      { value: "after_tea", label: "چائے کے بعد" },
                      { value: "with_tea", label: "چائے کے ساتھ" },
                      { value: "before_coffee", label: "کافی سے پہلے" },
                      { value: "after_coffee", label: "کافی کے بعد" },

                      // Food-specific instructions
                      { value: "with_yogurt", label: "دہی کے ساتھ" },
                      { value: "with_honey", label: "شہد کے ساتھ" },
                      {
                        value: "with_fatty_foods",
                        label: "چکنائی والے کھانے کے ساتھ",
                      },
                      {
                        value: "with_high_fiber",
                        label: "ریشے دار کھانے کے ساتھ",
                      },
                      {
                        value: "with_protein",
                        label: "پروٹین والے کھانے کے ساتھ",
                      },
                      { value: "without_dairy", label: "ڈیری مصنوعات کے بغیر" },
                      {
                        value: "without_iron",
                        label: "آئرن والی غذاؤں کے بغیر",
                      },
                      {
                        value: "without_calcium",
                        label: "کیلشیم والی غذاؤں کے بغیر",
                      },

                      // Special conditions
                      { value: "only_if_needed", label: "ضرورت کے مطابق" },
                      { value: "avoid_caffeine", label: "کیفین سے بچیں" },
                      { value: "avoid_alcohol", label: "الکحل سے بچیں" },
                      { value: "avoid_grapefruit", label: "گریپ فروٹ سے بچیں" },
                      { value: "avoid_sun", label: "دھوپ سے بچیں" },
                      { value: "on_awakening", label: "صبح بیدار ہوتے ہی" },
                      { value: "at_bedtime", label: "سونے سے پہلے" },
                      { value: "during_pain", label: "درد ہونے پر" },
                      { value: "during_nausea", label: "متلی ہونے پر" },
                      { value: "during_heartburn", label: "سینے کی جلن پر" },

                      // Body position instructions
                      {
                        value: "upright_position",
                        label: "کھڑے ہو کر/بیٹھ کر",
                      },
                      { value: "lying_down", label: "لیٹ کر" },
                      { value: "left_side", label: "بائیں کروٹ لیٹ کر" },
                      { value: "right_side", label: "دائیں کروٹ لیٹ کر" },

                      // Special administration instructions
                      { value: "chew_tab", label: "چبا کر کھائیں" },
                      {
                        value: "dissolve_in_mouth",
                        label: "منہ میں گولی رکھ کر گلیں",
                      },
                      { value: "sublingual", label: "زیر زبان رکھیں" },
                      {
                        value: "with_full_glass",
                        label: "ایک گلاس پانی کے ساتھ",
                      },
                      { value: "without_water", label: "بغیر پانی کے" },
                      { value: "on_empty_bladder", label: "خالی مثانے پر" },
                      { value: "on_full_bladder", label: "بھرے مثانے پر" },

                      // Time-specific instructions
                      { value: "morning", label: "صبح" },
                      { value: "noon", label: "دوپہر" },
                      { value: "evening", label: "شام" },
                      { value: "night", label: "رات" },
                      { value: "every_morning", label: "روزانہ صبح" },
                      { value: "every_night", label: "روزانہ رات" },
                      { value: "alternate_days", label: "ایک دن چھوڑ کر" },
                      { value: "after_one_week", label: "ایک ہفتے بعد" },
                      { value: "after_two_weeks", label: "دو ہفتے بعد" },
                      { value: "after_three_weeks", label: "تین ہفتے بعد" },
                      { value: "after_one_month", label: "ایک مہینے بعد" },
                    ]}
                    value={
                      med.instructions_en
                        ? {
                            value: med.instructions_en,
                            label: med.instructions_urdu,
                          }
                        : null
                    }
                    onChange={(option) => {
                      setSelectedMedicines((prev) =>
                        prev.map((item, i) =>
                          i === index
                            ? {
                                ...item,
                                instructions_en: option ? option.value : "",
                                instructions_urdu: option ? option.label : "",
                              }
                            : item
                        )
                      );
                    }}
                    placeholder="Select instruction..."
                    isClearable
                    styles={customSelectStyles}
                    className="font-urdu"
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedMedicines((prev) =>
                    prev.filter((_, i) => i !== index)
                  );
                  console.log("Removed medicine at index:", index);
                }}
                className="text-red-500 hover:text-red-700 mt-4"
              >
                <AiOutlineCloseCircle className="w-5 h-5" />
              </button>
            </div>
          ))}

          <button
            onClick={() => handleAddMedicine()}
            className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-200 text-blue-600 hover:border-blue-400 hover:bg-blue-50/50 p-4 transition-all cursor-pointer"
            disabled={isCreating}
          >
            <AiOutlinePlus className="w-5 h-5" />
            Add New Medication
          </button>
        </div>
      )}
    </div>
  );
};

export default PrescriptionManagementSection;

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
    const invalid = selectedMedicines.some((med) => {
      if (!med.medicine_id || med.medicine_id === "") {
        console.warn("Empty medicine_id in:", med);
        return true;
      }
      if (!medicines.some((m) => m.value === String(med.medicine_id))) {
        console.warn("Invalid medicine_id not in medicines:", med);
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

  // Filter available medicines to exclude those already selected
  const getAvailableMedicines = (currentIndex) => {
    const selectedIds = selectedMedicines
      .filter((_, i) => i !== currentIndex) // Exclude the current medicine to allow editing
      .map((med) => med.medicine_id)
      .filter((id) => id); // Exclude empty IDs
    return medicines.filter((medicine) => !selectedIds.includes(medicine.value));
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="bg-purple-600 p-2 rounded-lg text-white">💊</div>
        <h3 className="text-lg font-semibold text-gray-800">
          Prescription Management
        </h3>
      </div>

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
                    options={getAvailableMedicines(index)} // Filter out selected medicines
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
                      { value: "0.25", label: "ایک چوتھائی گولی" },
                      { value: "0.5", label: "آدھی گولی" },
                      { value: "headache_severe", label: "شدید سر درد کے لیے" },
                      { value: "0.75", label: "تین چوتھائی گولی" },
                      { value: "1", label: "ایک گولی" },
                      { value: "1.5", label: "ڈیڑھ گولی" },
                      { value: "2", label: "دو گولیاں" },
                      { value: "2.5", label: "ڈھائی گولیاں" },
                      { value: "3", label: "تین گولیاں" },
                      { value: "3.5", label: "ساڑھے تین گولیاں" },
                      { value: "4", label: "چار گولیاں" },
                      { value: "5", label: "پانچ گولیاں" },
                      { value: "6", label: "چھ گولیاں" },
                      { value: "7", label: "سات گولیاں" },
                      { value: "8", label: "آٹھ گولیاں" },
                      { value: "10", label: "دس گولیاں" },
                      { value: "half_spoon", label: "آدھا چمچ" },
                      { value: "one_spoon", label: "ایک چمچ" },
                      { value: "one_and_half_spoon", label: "ڈیڑھ چمچ" },
                      { value: "two_spoons", label: "دو چمچ" },
                      { value: "three_spoons", label: "تین چمچ" },
                      { value: "1_ml", label: "ایک ملی لیٹر" },
                      { value: "2_ml", label: "دو ملی لیٹر" },
                      { value: "2.5_ml", label: "ڈھائی ملی لیٹر" },
                      { value: "5_ml", label: "پانچ ملی لیٹر" },
                      { value: "7.5_ml", label: "ساڑھے سات ملی لیٹر" },
                      { value: "10_ml", label: "دس ملی لیٹر" },
                      { value: "15_ml", label: "پندرہ ملی لیٹر" },
                      { value: "20_ml", label: "بیس ملی لیٹر" },
                      { value: "25_ml", label: "پچیس ملی لیٹر" },
                      { value: "30_ml", label: "تیس ملی لیٹر" },
                      { value: "3_ml", label: "تین ملی لیٹر" },
                      { value: "4_ml", label: "چار ملی لیٹر" },
                      { value: "6_ml", label: "چھ ملی لیٹر" },
                      { value: "8_ml", label: "آٹھ ملی لیٹر" },
                      { value: "9_ml", label: "نو ملی لیٹر" },
                      { value: "12.5_ml", label: "ساڑھے بارہ ملی لیٹر" },
                      { value: "50_ml", label: "پچاس ملی لیٹر" },
                      { value: "100_ml", label: "سو ملی لیٹر" },
                      { value: "one_droplet", label: "ایک قطرہ" },
                      { value: "two_droplets", label: "دو قطرے" },
                      { value: "three_droplets", label: "تین قطرے" },
                      { value: "five_droplets", label: "پانچ قطرے" },
                      { value: "ten_droplets", label: "دس قطرے" },
                      { value: "half_injection", label: "آدھا ٹیکہ" },
                      { value: "one_injection", label: "ایک ٹیکہ" },
                      { value: "two_injections", label: "دو ٹیکے" },
                      { value: "three_injections", label: "تین ٹیکے" },
                      { value: "half_sachet", label: "آدھا ساشے" },
                      { value: "one_sachet", label: "ایک ساشے" },
                      { value: "two_sachets", label: "دو ساشے" },
                      { value: "three_sachets", label: "تین ساشے" },
                      { value: "as_needed", label: "ضرورت کے مطابق" },
                      { value: "before_meal", label: "کھانے سے پہلے" },
                      { value: "after_meal", label: "کھانے کے بعد" },
                      { value: "every_6_hours", label: "ہر 6 گھنٹے بعد" },
                      { value: "every_8_hours", label: "ہر 8 گھنٹے بعد" },
                      { value: "every_12_hours", label: "ہر 12 گھنٹے بعد" },
                      { value: "once_a_day", label: "دن میں ایک بار" },
                      { value: "twice_a_day", label: "دن میں دو بار" },
                      { value: "three_times_a_day", label: "دن میں تین بار" },
                      { value: "four_times_a_day", label: "دن میں چار بار" },
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
                      { value: "7_days", label: "1 ہفتہ" },
                      { value: "8_days", label: "8 دن" },
                      { value: "9_days", label: "9 دن" },
                      { value: "10_days", label: "10 دن" },
                      { value: "11_days", label: "11 دن" },
                      { value: "12_days", label: "12 دن" },
                      { value: "13_days", label: "13 دن" },
                      { value: "14_days", label: "2 ہفتے" },
                      { value: "15_days", label: "15 دن" },
                      { value: "20_days", label: "20 دن" },
                      { value: "25_days", label: "25 دن" },
                      { value: "30_days", label: "1 مہینہ" },
                      { value: "1_week", label: "1 ہفتہ" },
                      { value: "2_weeks", label: "2 ہفتے" },
                      { value: "3_weeks", label: "3 ہفتے" },
                      { value: "4_weeks", label: "1 مہینہ" },
                      { value: "6_weeks", label: "6 ہفتے" },
                      { value: "8_weeks", label: "2 مہینے" },
                      { value: "10_weeks", label: "10 ہفتے" },
                      { value: "12_weeks", label: "3 مہینے" },
                      { value: "1_month", label: "1 مہینہ" },
                      { value: "2_months", label: "2 مہینے" },
                      { value: "3_months", label: "3 مہینے" },
                      { value: "4_months", label: "4 مہینے" },
                      { value: "5_months", label: "5 مہینے" },
                      { value: "6_months", label: "6 مہینے" },
                      { value: "9_months", label: "9 مہینے" },
                      { value: "12_months", label: "12 مہینے" },
                      { value: "as_needed", label: "ضرورت کے مطابق" },
                      { value: "long_term", label: "طویل مدتی علاج" },
                      { value: "short_term", label: "مختصر مدتی علاج" },
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
                      { value: "before_breakfast", label: "ناشتے سے پہلے" },
                      { value: "after_breakfast", label: "ناشتے کے بعد" },
                      {
                        value: "before_lunch",
                        label: "دوپہر کے کھانے سے پہلے",
                      },
                      { value: "after_lunch", label: "دوپہر کے کھانے کے بعد" },
                      { value: "before_dinner", label: "رات کے کھانے سے پہلے" },
                      { value: "after_dinner", label: "رات کے کھانے کے بعد" },
                      { value: "with_milk", label: "دودھ کے ساتھ" },
                      { value: "before_tea", label: "چائے سے پہلے" },
                      { value: "after_tea", label: "چائے کے بعد" },
                      { value: "only_if_needed", label: "ضرورت کے مطابق" },
                      { value: "with_water", label: "پانی کے ساتھ" },
                      { value: "with_juice", label: "جوس کے ساتھ" },
                      { value: "with_yogurt", label: "دہی کے ساتھ" },
                      {
                        value: "with_fatty_foods",
                        label: "چکنائی والے کھانے کے ساتھ",
                      },
                      { value: "without_dairy", label: "ڈیری مصنوعات کے بغیر" },
                      { value: "avoid_caffeine", label: "کیفین سے بچیں" },
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
            className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-200 text-blue-600 hover:border-blue-400 hover:bg-blue-50/50 p-4 transition-all"
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
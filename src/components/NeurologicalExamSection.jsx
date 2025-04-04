import React from 'react';
import NeuroExamSelect from './NeuroExamSelect';



const NeurologicalExamSection = ({
  neuroExamData = {},
  setNeuroExamData,
  fields = [], 
}) => {
  const handleFieldChange = (field, value) => {
    setNeuroExamData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <h3 className="mb-5 text-lg font-bold text-gray-800 flex items-center gap-2">
        <span className="bg-purple-600 text-white p-2 rounded-lg">🧠</span>
        Neurological Examination
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
        {/* Neuro Exam Select Fields */}
        {fields.map((field) => (
          <NeuroExamSelect
            key={field}
            field={field}
            value={neuroExamData[field]}
            onChange={handleFieldChange}
          />
        ))}

        {/* Checkboxes */}
        <div className="my-3 group">
          <label
            htmlFor="pain_sensation"
            className="flex items-center gap-3 cursor-pointer select-none px-4 py-3 rounded-lg transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30"
          >
            <input
              id="pain_sensation"
              type="checkbox"
              className="w-6 h-6 rounded-lg border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer dark:border-gray-600 dark:bg-gray-800 dark:checked:bg-blue-500 dark:checked:border-blue-500 transition-colors duration-200"
              checked={neuroExamData.pain_sensation || false}
              onChange={(e) =>
                setNeuroExamData({
                  ...neuroExamData,
                  pain_sensation: e.target.checked,
                })
              }
            />
            <span className="text-base font-semibold text-black hover:text-gray-800 transition-colors duration-200">
              Pain Sensation
              <span className="block text-sm font-normal text-gray-500 dark:text-gray-400 mt-1">
                Assess response to sharp/dull stimuli
              </span>
            </span>
            <span className="w-3 h-3 rounded-full bg-blue-200 group-hover:bg-blue-300 ml-auto dark:bg-blue-900/40 dark:group-hover:bg-blue-900/60 transition-colors duration-200"></span>
          </label>
        </div>

        <div className="my-3 group">
          <label
            htmlFor="vibration_sense"
            className="flex items-center gap-3 cursor-pointer select-none px-3 py-2 rounded-lg transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30"
          >
            <input
              id="vibration_sense"
              type="checkbox"
              className="w-6 h-6 rounded-lg border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer dark:border-gray-600 dark:bg-gray-800 dark:checked:bg-blue-500 dark:checked:border-blue-500 transition-colors duration-200"
              checked={neuroExamData.vibration_sense || false}
              onChange={(e) =>
                setNeuroExamData({
                  ...neuroExamData,
                  vibration_sense: e.target.checked,
                })
              }
            />
            <span className="text-base font-semibold text-black hover:text-gray-800 transition-colors duration-200">
              Vibration Sensation
              <span className="block text-xs font-normal text-gray-500 dark:text-gray-400 mt-1">
                Test with tuning fork
              </span>
            </span>
            <span className="w-2 h-2 rounded-full bg-blue-200 group-hover:bg-blue-300 ml-2 dark:bg-blue-900/40 dark:group-hover:bg-blue-900/60 transition-colors duration-200"></span>
          </label>
        </div>

        <div className="my-3 group">
          <label
            htmlFor="proprioception"
            className="flex items-center gap-3 cursor-pointer select-none px-4 py-3 rounded-lg transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30"
          >
            <input
              id="proprioception"
              type="checkbox"
              className="w-6 h-6 rounded-lg border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer dark:border-gray-600 dark:bg-gray-800 dark:checked:bg-blue-500 dark:checked:border-blue-500 transition-colors duration-200"
              checked={neuroExamData.proprioception || false}
              onChange={(e) =>
                setNeuroExamData({
                  ...neuroExamData,
                  proprioception: e.target.checked,
                })
              }
            />
            <span className="text-base font-semibold text-black hover:text-gray-800 transition-colors duration-200">
              Proprioception
              <span className="block text-sm font-normal text-gray-500 dark:text-gray-400 mt-1">
                Joint position sense assessment
              </span>
            </span>
            <span className="w-3 h-3 rounded-full bg-blue-200 group-hover:bg-blue-300 ml-auto dark:bg-blue-900/40 dark:group-hover:bg-blue-900/60 transition-colors duration-200"></span>
          </label>
        </div>

        <div className="my-3 group">
          <label
            htmlFor="temperature_sensation"
            className="flex items-center gap-3 cursor-pointer select-none px-4 py-3 rounded-lg transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30"
          >
            <input
              id="temperature_sensation"
              type="checkbox"
              className="w-6 h-6 rounded-lg border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer dark:border-gray-600 dark:bg-gray-800 dark:checked:bg-blue-500 dark:checked:border-blue-500 transition-colors duration-200"
              checked={neuroExamData.temperature_sensation || false}
              onChange={(e) =>
                setNeuroExamData({
                  ...neuroExamData,
                  temperature_sensation: e.target.checked,
                })
              }
            />
            <span className="text-base font-semibold text-black hover:text-gray-800 transition-colors duration-200">
              Temperature Sensation
              <span className="block text-sm font-normal text-gray-500 dark:text-gray-400 mt-1">
                Test with warm/cold objects
              </span>
            </span>
            <span className="w-3 h-3 rounded-full bg-blue-200 group-hover:bg-blue-300 ml-auto dark:bg-blue-900/40 dark:group-hover:bg-blue-900/60 transition-colors duration-200"></span>
          </label>
        </div>

        <div className="my-3 group">
          <label
            htmlFor="brudzinski_sign"
            className="flex items-center gap-3 cursor-pointer select-none px-4 py-3 rounded-lg transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30"
          >
            <input
              id="brudzinski_sign"
              type="checkbox"
              className="w-6 h-6 rounded-lg border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer dark:border-gray-600 dark:bg-gray-800 dark:checked:bg-blue-500 dark:checked:border-blue-500 transition-colors duration-200"
              checked={neuroExamData.brudzinski_sign || false}
              onChange={(e) =>
                setNeuroExamData({
                  ...neuroExamData,
                  brudzinski_sign: e.target.checked,
                })
              }
            />
            <span className="text-base font-semibold text-black hover:text-gray-800 transition-colors duration-200">
              Brudzinski Sign
              <span className="block text-sm font-normal text-gray-500 dark:text-gray-400 mt-1">
                Neck flexion causing hip flexion
              </span>
            </span>
            <span className="w-3 h-3 rounded-full bg-blue-200 group-hover:bg-blue-300 ml-auto dark:bg-blue-900/40 dark:group-hover:bg-blue-900/60 transition-colors duration-200"></span>
          </label>
        </div>

        <div className="my-3 group">
          <label
            htmlFor="kernig_sign"
            className="flex items-center gap-3 cursor-pointer select-none px-4 py-3 rounded-lg transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30"
          >
            <input
              id="kernig_sign"
              type="checkbox"
              className="w-6 h-6 rounded-lg border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer dark:border-gray-600 dark:bg-gray-800 dark:checked:bg-blue-500 dark:checked:border-blue-500 transition-colors duration-200"
              checked={neuroExamData.kernig_sign || false}
              onChange={(e) =>
                setNeuroExamData({
                  ...neuroExamData,
                  kernig_sign: e.target.checked,
                })
              }
            />
            <span className="text-base font-semibold text-black hover:text-gray-800 transition-colors duration-200">
              Kernig Sign
              <span className="block text-sm font-normal text-gray-500 dark:text-gray-400 mt-1">
                Hip flexion with knee extension resistance
              </span>
            </span>
            <span className="w-3 h-3 rounded-full bg-blue-200 group-hover:bg-blue-300 ml-auto dark:bg-blue-900/40 dark:group-hover:bg-blue-900/60 transition-colors duration-200"></span>
          </label>
        </div>

        <div className="my-3 group">
          <label
            htmlFor="facial_sensation"
            className="flex items-center gap-3 cursor-pointer select-none px-4 py-3 rounded-lg transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30"
          >
            <input
              id="facial_sensation"
              type="checkbox"
              className="w-6 h-6 rounded-lg border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer dark:border-gray-600 dark:bg-gray-800 dark:checked:bg-blue-500 dark:checked:border-blue-500 transition-colors duration-200"
              checked={neuroExamData.facial_sensation || false}
              onChange={(e) =>
                setNeuroExamData({
                  ...neuroExamData,
                  facial_sensation: e.target.checked,
                })
              }
            />
            <span className="text-base font-semibold text-black hover:text-gray-800 transition-colors duration-200">
              Facial Sensation
              <span className="block text-sm font-normal text-gray-500 dark:text-gray-400 mt-1">
                Test all three trigeminal branches
              </span>
            </span>
            <span className="w-3 h-3 rounded-full bg-blue-200 group-hover:bg-blue-300 ml-auto dark:bg-blue-900/40 dark:group-hover:bg-blue-900/60 transition-colors duration-200"></span>
          </label>
        </div>

        <div className="my-3 group">
          <label
            htmlFor="swallowing_function"
            className="flex items-center gap-3 cursor-pointer select-none px-4 py-3 rounded-lg transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30"
          >
            <input
              id="swallowing_function"
              type="checkbox"
              className="w-6 h-6 rounded-lg border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer dark:border-gray-600 dark:bg-gray-800 dark:checked:bg-blue-500 dark:checked:border-blue-500 transition-colors duration-200"
              checked={neuroExamData.swallowing_function || false}
              onChange={(e) =>
                setNeuroExamData({
                  ...neuroExamData,
                  swallowing_function: e.target.checked,
                })
              }
            />
            <span className="text-base font-semibold text-black hover:text-gray-800 transition-colors duration-200">
              Swallowing Function
              <span className="block text-sm font-normal text-black dark:text-gray-400 mt-1">
                Assess cranial nerves IX and X
              </span>
            </span>
            <span className="w-3 h-3 rounded-full bg-blue-200 group-hover:bg-blue-300 ml-auto dark:bg-blue-900/40 dark:group-hover:bg-blue-900/60 transition-colors duration-200"></span>
          </label>
        </div>

        {/* Additional Observations */}
        <div className="flex flex-col md:flex-col gap-4 md:col-span-4 w-full">
          <h4 className="font-semibold text-gray-800 border-l-4 border-purple-500 pl-3 py-1.5">
            Additional Observations
          </h4>
          <div className="flex gap-6 md:col-span-4 w-full">
            {/* MMSE Score */}
            <div className="w-full space-y-2">
              <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <span>MMSE Score</span>
                <span className="text-xs text-gray-500">
                  (Mini-Mental State Examination)
                </span>
              </label>
              <div className="relative flex items-center gap-2 w-full">
                <input
                  type="text"
                  value={neuroExamData.mmse_score?.split("/")[0] || ""}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 2);
                    setNeuroExamData((prev) => ({
                      ...prev,
                      mmse_score: value ? `${value}/30` : "",
                    }));
                  }}
                  className="w-full px-4 py-3 text-base font-medium border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-300 focus:border-purple-500 focus:outline-none bg-white placeholder-gray-400"
                  placeholder="e.g., 24"
                />
                <span className="absolute right-3 text-gray-500 font-medium">
                  /30
                </span>
              </div>
              {neuroExamData.mmse_score &&
                parseInt(neuroExamData.mmse_score.split("/")[0]) > 30 && (
                  <p className="text-red-600 text-sm font-medium mt-1 bg-red-50 px-2 py-1 rounded-md">
                    Score must not exceed 30
                  </p>
                )}
            </div>

            {/* GCS Score */}
            <div className="w-full space-y-2">
              <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <span>GCS Score</span>
                <span className="text-xs text-gray-500">
                  (Glasgow Coma Scale)
                </span>
              </label>
              <div className="relative flex items-center gap-2 w-full">
                <input
                  type="number"
                  min={1}
                  max={15}
                  value={neuroExamData.gcs_score?.split("/")[0] || ""}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    if (value >= 1 && value <= 15) {
                      setNeuroExamData((prev) => ({
                        ...prev,
                        gcs_score: `${value}/15`,
                      }));
                    } else if (e.target.value === "") {
                      setNeuroExamData((prev) => ({
                        ...prev,
                        gcs_score: "",
                      }));
                    }
                  }}
                  className="w-full pr-10 px-4 py-3 text-base font-medium border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-300 focus:border-purple-500 focus:outline-none bg-white placeholder-gray-400"
                  placeholder="1 to 15"
                />
                <span className="absolute right-3 text-gray-500 font-medium">
                  /15
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Examination */}
        <div className="md:col-span-4 space-y-4">
          <h4 className="font-medium text-gray-700 bg-gray-50 p-2 rounded-lg">
            Additional Examination
          </h4>
          <div className="w-full space-y-2">
            <label className="text-sm font-semibold text-gray-800">
              Treatment Plan
            </label>
            <textarea
              value={neuroExamData.treatment_plan || ""}
              onChange={(e) =>
                setNeuroExamData((prev) => ({
                  ...prev,
                  treatment_plan: e.target.value,
                }))
              }
              className="w-full px-4 py-3 text-base font-medium border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-300 focus:border-purple-500 focus:outline-none bg-white placeholder-gray-400"
              placeholder="Enter treatment plan..."
              rows="3"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NeurologicalExamSection;
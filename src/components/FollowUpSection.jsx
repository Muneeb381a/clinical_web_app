import React from 'react';

const FollowUpSection = ({
  selectedDuration,
  followUpDate,
  followUpNotes,
  onDurationChange,
  onDateChange,
  onNotesChange,
}) => {
  const handleDurationChange = (e) => {
    const days = parseInt(e.target.value);
    const date = new Date();
    if (days > 0) {
      date.setDate(date.getDate() + days);
    } else {
      date.setDate(null); // Reset date if "No follow-up" is selected
    }
    onDurationChange(days);
    onDateChange(days > 0 ? date : null); // Set null for "No follow-up"
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mt-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span className="bg-purple-600 text-white p-2 rounded-lg">📅</span>
        Follow Up
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Please Select the Date of Followup
          </label>
          <select
            value={selectedDuration || ""}
            onChange={handleDurationChange}
            className="w-full rounded-lg border-2 border-gray-100 p-3 urdu-font"
            required
          >
            <option value="">مدت منتخب کریں</option>
            <option value="7">ایک ہفتہ بعد</option>
            <option value="10">10 دن بعد</option>
            <option value="15">15 دن بعد</option>
            <option value="21">3 ہفتے بعد</option>
            <option value="30">ایک مہینہ بعد</option>
            <option value="45">ڈیڑھ مہینہ بعد</option>
            <option value="60">دو مہینے بعد</option>
            <option value="90">تین مہینے بعد</option>
            <option value="120">چار مہینے بعد</option>
            <option value="180">چھ مہینے بعد</option>
            <option value="365">ایک سال بعد</option>
            <option value="0">فالو اپ نہیں</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Additional Instructions (Optional)
          </label>
          <textarea
            value={followUpNotes}
            onChange={(e) => onNotesChange(e.target.value)}
            className="w-full rounded-lg border-2 border-gray-100 p-3 h-32 urdu-font"
            placeholder="Write Instruction Here"
          />
        </div>
      </div>

      {selectedDuration && selectedDuration > 0 && followUpDate && (
        <div className="mt-4 text-right text-sm text-gray-600 urdu-font">
          منتخب کردہ تاریخ:{" "}
          {new Date(followUpDate).toLocaleDateString("ur-PK", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      )}
    </div>
  );
};

export default FollowUpSection;
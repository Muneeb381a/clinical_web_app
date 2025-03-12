import { useState } from "react";
import axios from "axios";

const PatientHistory = ({ patientId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  const fetchHistory = async () => {
    if (!patientId) {
      setError("Patient ID is required");
      return;
    }
  
    setLoading(true);
    setError("");
  
    try {
      console.log(`Fetching history for patient ID: ${patientId}`);
      const response = await axios.get(
        `https://patient-management-backend-nine.vercel.app/api/patient-history/${patientId}`,
        { timeout: 10000 }
      );
      console.log("API Response:", response.data);
  
      if (!Array.isArray(response.data)) {
        throw new Error("Invalid response format: Expected an array");
      }
  
      setHistory(response.data);
      setShowModal(true);
    } catch (err) {
      console.error("Error fetching patient history:", err);
      setError(`Failed to fetch patient history: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  

  return (
    <div className="p-6 bg-gradient-to-br from-white to-gray-100 shadow-xl rounded-xl max-w-4xl mx-auto">

      {/* Fetch Button */}
      <button
        onClick={fetchHistory}
        className="bg-teal-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-teal-700 transition-all duration-300 shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
        disabled={loading}
      >
        {loading ? "Fetching..." : "View Details"}
      </button>

      {loading && (
        <p className="text-center text-teal-600 mt-4 font-medium animate-pulse">
          Loading...
        </p>
      )}
      {error && (
        <p className="text-center text-red-600 mt-4 font-medium">{error}</p>
      )}

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-70 flex justify-center items-center z-[1000] transition-opacity duration-300"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-95 hover:scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                Patient History
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-red-600 text-2xl font-bold transition-colors duration-200"
              >
                ×
              </button>
            </div>

            {/* No history found message */}
            {history.length === 0 ? (
              <p className="text-gray-500 text-center italic py-4">
                No history found for this patient.
              </p>
            ) : (
              <div className="space-y-6">
                {history.map((record, index) => (
                  <div
                    key={index}
                    className="border-b border-gray-200 pb-6 last:border-b-0"
                  >
                    <h3 className="text-lg font-semibold text-teal-700">
                      Visit Date:{" "}
                      {new Date(record.visit_date).toLocaleDateString()}
                    </h3>
                    <p className="text-gray-700 mt-2">
                      <strong className="font-medium">Diagnosis:</strong>{" "}
                      {record.diagnosis || "N/A"}
                    </p>
                    <p className="text-gray-700">
                      <strong className="font-medium">Symptoms:</strong>{" "}
                      {record.symptoms.length > 0
                        ? record.symptoms.join(", ")
                        : "No symptoms recorded"}
                    </p>

                    {/* Prescriptions Section */}
                    {record.prescriptions.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-md font-semibold text-gray-800">
                          Prescriptions:
                        </h4>
                        <ul className="list-disc ml-6 text-gray-600 space-y-2">
                          {record.prescriptions.map((prescription, idx) => (
                            <li key={idx} className="leading-relaxed">
                              <span className="font-medium text-gray-800">
                                {prescription.brand_name}
                              </span>{" "}
                              - {prescription.dosage_en} |{" "}
                              {prescription.frequency_en} |{" "}
                              {prescription.duration_en}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Tests Section */}
                    {record.tests.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-md font-semibold text-gray-800">
                          Tests:
                        </h4>
                        <ul className="list-disc ml-6 text-gray-600 space-y-2">
                          {record.tests.map((test, idx) => (
                            <li key={idx} className="leading-relaxed">
                              {test.test_name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Follow-up Date */}
                    {record.follow_up_date && (
                      <p className="text-gray-700 mt-3">
                        <strong className="font-medium">Next Follow-up:</strong>{" "}
                        {new Date(record.follow_up_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Close Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition-all duration-300 shadow-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientHistory;
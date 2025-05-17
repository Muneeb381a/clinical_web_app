import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Loader from './Loader';
import { FaArrowLeft, FaPrint, FaFlask, FaUser } from 'react-icons/fa';
import DiagnosisTestSection from './DiagnosisTestSection';

const BASE_URL = 'https://patient-management-backend-nine.vercel.app';
const DOCTOR_NAME = 'Dr. Umer'; 
const AddTestForm = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [selectedTests, setSelectedTests] = useState([]);
  const [testDetails, setTestDetails] = useState([]); // Store test details
  const [isLoadingPatient, setIsLoadingPatient] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch patient details
  useEffect(() => {
    const fetchPatient = async () => {
      setIsLoadingPatient(true);
      try {
        const response = await axios.get(`${BASE_URL}/api/patients/${patientId}`);
        setPatient(response.data);
      } catch (error) {
        toast.error(`Failed to fetch patient: ${error.response?.data?.error || error.message}`);
        console.error('Error fetching patient:', error.response?.data || error);
        navigate('/');
      } finally {
        setIsLoadingPatient(false);
      }
    };
    if (patientId) {
      fetchPatient();
    } else {
      toast.error('Invalid patient ID');
      navigate('/');
    }
  }, [patientId, navigate]);

  // Fetch test details for selected tests
  useEffect(() => {
    const fetchTestDetails = async () => {
      if (selectedTests.length === 0) {
        setTestDetails([]);
        return;
      }
      try {
        // Fetch all tests and filter by selected IDs
        const response = await axios.get(`${BASE_URL}/api/tests`);
        const tests = response.data.filter((test) =>
          selectedTests.includes(test.id.toString())
        );
        setTestDetails(tests);
        console.log('Test details:', tests);
      } catch (error) {
        console.error('Error fetching test details:', error.response?.data || error);
        toast.error('Failed to fetch test details');
      }
    };
    fetchTestDetails();
  }, [selectedTests]);

  const handleSaveTests = async () => {
    if (selectedTests.length === 0) {
      toast.error('Please select at least one test');
      return;
    }
    setIsSaving(true);
    try {
      // Step 1: Create a new consultation
      console.log('Creating new consultation for patient:', patientId);
      const consultationResponse = await axios.post(`${BASE_URL}/api/consultations`, {
        patient_id: patientId,
        doctor_name: DOCTOR_NAME,
        visit_date: new Date().toISOString(),
        notes: 'Consultation created for assigning diagnostic tests',
      });
      console.log('Consultation response:', consultationResponse.data);
      const consultationId = consultationResponse.data.consultation?.id;
      console.log('Consultation created with ID:', consultationId);

      if (!consultationId) {
        throw new Error('Consultation ID not found in response');
      }

      // Step 2: Assign tests to the consultation
      console.log('Selected tests:', selectedTests);
      // Handle both string array and object array formats
      const testIds = Array.isArray(selectedTests)
        ? selectedTests.every((test) => typeof test === 'string')
          ? selectedTests
          : selectedTests.map((test) => test.value)
        : [];
      // Filter out invalid IDs
      const validTestIds = testIds.filter((id) => id != null && id !== '');
      console.log('Assigning tests to consultation:', { consultation_id: consultationId, test_ids: validTestIds });

      if (validTestIds.length === 0) {
        throw new Error('No valid test IDs selected');
      }

      await axios.post(`${BASE_URL}/api/tests/assign`, {
        consultation_id: consultationId,
        test_ids: validTestIds,
      });

      toast.success('Tests assigned to consultation successfully');
      handlePrint();
      navigate(`/patients/${patientId}`, { replace: true });
    } catch (error) {
      toast.error(`Failed to save tests: ${error.response?.data?.error || error.message}`);
      console.error('Error saving tests:', error.response?.data || error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    console.log('Printing tests:', selectedTests);
    console.log('Test details for print:', testDetails);
    const testLabels = testDetails.map((test) => test.test_name || test.id);
    const printWindow = window.open('', '_blank'); // Initialize printWindow
    printWindow.document.write(`
      <html>
        <head>
          <title>Diagnostic Tests</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; color: #333; }
            .patient-info { margin-bottom: 20px; }
            ul { list-style: none; padding: 0; }
            li { padding: 10px 0; font-size: 16px; border-bottom: 1px solid #eee; }
            .footer { margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <h1>Diagnostic Tests</h1>
          <div class="patient-info">
            <p><strong>Patient ID:</strong> ${patientId}</p>
            <p><strong>Patient Name:</strong> ${patient?.name || 'N/A'}</p>
            <p><strong>Doctor Name:</strong> ${DOCTOR_NAME}</p>
          </div>
          <ul>
            ${testLabels.map((label) => `<li>${label}</li>`).join('')}
          </ul>
          <div class="footer">
            <p>Printed on ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleBack = () => {
    console.log('Navigating back to patient profile:', patientId);
    navigate(`/patients/${patientId}`);
  };

  if (isLoadingPatient) {
    return <Loader message="Loading patient details..." color="purple-600" />;
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-2xl border border-gray-100 shadow-lg">
        <div className="flex items-center gap-4 mb-6">
          <FaFlask className="text-3xl text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-800">Add Tests for Patient</h2>
        </div>

        {/* Patient Details */}
        {patient && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div className="flex items-center gap-3">
              <FaUser className="text-xl text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-800">Patient Details</h3>
            </div>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="text-gray-900">{patient.name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Mobile</label>
                <p className="text-gray-900">{patient.mobile || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Patient ID</label>
                <p className="text-gray-900">{patientId}</p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleBack}
          className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold"
        >
          <FaArrowLeft />
          Back to Patient Profile
        </button>

        {/* Test Selection */}
        <DiagnosisTestSection
          selectedTests={selectedTests}
          onTestsChange={setSelectedTests}
        />

        {/* Action Buttons */}
        <div className="mt-6 flex gap-4 justify-end">
          <button
            onClick={handleSaveTests}
            className={`flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold ${
              isSaving || selectedTests.length === 0
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-purple-700'
            }`}
            disabled={isSaving || selectedTests.length === 0}
          >
            {isSaving ? 'Saving...' : 'Save Tests'}
          </button>
          <button
            onClick={handlePrint}
            className={`flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold ${
              selectedTests.length === 0 || isSaving
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-blue-700'
            }`}
            disabled={selectedTests.length === 0 || isSaving}
          >
            <FaPrint />
            Print Tests
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTestForm;
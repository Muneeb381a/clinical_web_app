// src/components/PatientSearch.jsx
import { useState, useEffect } from 'react';
import ErrorBoundary from './ErrorBoundary';

const PatientSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(
        `/api/patients/search?mobile=${encodeURIComponent(searchTerm)}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        setPatientData(null);
        setError(data.message || 'Patient not found');
        return;
      }

      setPatientData(data.data);
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message);
      setPatientData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="search-container">
        <form onSubmit={handleSearch}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter mobile number"
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {error && <div className="error-message">{error}</div>}

        <PatientDetails patient={patientData} />
      </div>
    </ErrorBoundary>
  );
};

const PatientDetails = ({ patient }) => {
  if (!patient) return null;

  // Add null checks for all nested properties
  return (
    <div className="patient-card">
      <h2>{patient.name || 'No name available'}</h2>
      <p>Mobile: {patient.mobile}</p>
      <p>Age: {patient.age ?? 'N/A'}</p>
      {/* Add other fields with proper null checks */}
    </div>
  );
};

export default PatientSearch;
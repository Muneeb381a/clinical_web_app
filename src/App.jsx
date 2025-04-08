import React, { useState, useEffect, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import TimeGreeting from "./components/TimeGreeting";
import PatientSearch from "./components/PatientSearch";
import PatientConsultation from "./components/PatientConsultation";
import PatientHistory from "./components/PatientHistoryModal";
import EditConsultation from "./components/EditConsultation";
import { Loader } from "./pages/Loader";



const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  // Simulate initial app loading (e.g., fetching config, auth, etc.)
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Simulate some async initialization (replace with actual initialization if needed)
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('App initialization failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  // If loading, show the loader
  if (isLoading) {
    return <Loader />;
  }

  return (
    <>
      {/* Header Section with Time Greeting */}
      <header className="sticky top-0 z-10">
        <div className="max-w-8xl mx-auto px-4 py-2 flex justify-end">
          <TimeGreeting
            locale="en-PK"
            timeZone="Asia/Karachi"
          />
        </div>
      </header>

      {/* Main Content with Suspense for lazy-loaded components */}
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={<PatientSearch />} />
          <Route path="/patients/:patientId" element={<PatientSearch />} />
          <Route path="/patients/new" element={<PatientSearch />} />
          <Route
            path="/patients/:patientId/consultation"
            element={<PatientConsultation />}
          />
          <Route
            path="/patients/:patientId/history"
            element={<PatientHistory />}
          />
          <Route
            path="/patients/:patientId/consultations/:consultationId/edit"
            element={<EditConsultation />}
          />
          <Route
            path="/patients/:patientId/consultations/new"
            element={<PatientConsultation />}
          />
        </Routes>
      </Suspense>
    </>
  );
};

export default App;
const PrescriptionViewer = () => {
    const { patientId, consultationId } = useParams();
    
    return (
      <iframe 
        src={`/api/patients/${patientId}/consultations/${consultationId}/pdf`}
        className="w-full h-screen"
        title="Prescription"
      />
    );
  };

  export default PrescriptionViewer
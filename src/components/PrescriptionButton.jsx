import { motion } from 'framer-motion';
import { FaFilePdf } from 'react-icons/fa';

const PrescriptionButton = ({ patient, consultation }) => {
  const handleOpenPrescription = () => {
    const patientId = patient.id || patient._id;
    const url = `/api/patients/${patientId}/consultations/${consultation.consultation_id}/pdf`;
    
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleOpenPrescription}
      title="Open PDF Prescription"
      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
    >
      <FaFilePdf className="text-red-600 text-xl hover:text-red-800" />
    </motion.button>
  );
};

export default PrescriptionButton;
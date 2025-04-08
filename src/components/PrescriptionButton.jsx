import { motion } from 'framer-motion';
import { FaFilePdf } from 'react-icons/fa';

const PrescriptionButton = ({ patient, consultation }) => {
    const handleOpenPrescription = () => {
      const url = `/api/patients/${patient.id}/consultations/${consultation.consultation_id}/pdf`;
      window.open(url, '_blank', 'noopener,noreferrer');
    };
  
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleOpenPrescription}
        title="Open PDF Prescription"
      >
        <FaFilePdf className="text-red-600 text-xl hover:text-red-800" />
      </motion.button>
    );
  };

export default PrescriptionButton;
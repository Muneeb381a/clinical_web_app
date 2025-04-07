import { motion } from 'framer-motion';
import { FaFilePdf } from 'react-icons/fa';

const PrescriptionButton = ({ patient, consultation }) => {
    const handleOpenPrescription = () => {
      const patientId = patient.id || patient._id;
      const url = `/api/patients/${patientId}/consultations/${consultation.consultation_id}/pdf`;
      
      // Open in new tab with print behavior
      const printWindow = window.open(url, '_blank');
      
      // Handle print after content loads
      const checkLoaded = setInterval(() => {
        if (printWindow.document.readyState === 'complete') {
          clearInterval(checkLoaded);
          try {
            printWindow.print();
            setTimeout(() => printWindow.close(), 5000); // Close after delay
          } catch (error) {
            console.error('Print failed:', error);
            printWindow.close();
          }
        }
      }, 100);
    };
  
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleOpenPrescription}
        title="Open Prescription"
      >
        <FaFilePdf className="text-red-600 text-xl hover:text-red-800" />
      </motion.button>
    );
  };

export default PrescriptionButton;
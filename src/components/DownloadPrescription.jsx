import React from 'react';

function DownloadPrescription({ patientId }) {
    const downloadPDF = async () => {
        console.log("Patient ID:", patientId);  // Log the patientId to check

        if (!patientId) {
            alert("Patient ID is missing.");
            return;
        }

        try {
            const baseUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:4500' : ''; // Add production URL if needed
            const response = await fetch(`${baseUrl}/api/prescriptions/download/${patientId}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/pdf',
                },
            });

            if (response.ok) {
                const blob = await response.blob();
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'prescription.pdf';
                link.click();
            } else {
                throw new Error('Failed to generate the prescription');
            }
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    };

    return (
        <div>
            <button onClick={downloadPDF}>Download Prescription</button>
        </div>
    );
}

export default DownloadPrescription;

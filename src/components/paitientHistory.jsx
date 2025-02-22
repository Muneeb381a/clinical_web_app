import { useState, useEffect } from "react";
import { fetchSymptoms, fetchMedicines, addConsultation } from "../api/api";

export default function PatientHistory({ patient }) {
    const [symptoms, setSymptoms] = useState([]);
    const [medicines, setMedicines] = useState([]);
    const [selectedSymptoms, setSelectedSymptoms] = useState([]);
    const [selectedMedicines, setSelectedMedicines] = useState([]);
    const [instruction, setInstruction] = useState("");

    useEffect(() => {
        fetchSymptoms().then(setSymptoms);
        fetchMedicines().then(setMedicines);
    }, []);

    const handleAddMedicine = () => {
        if (!selectedMedicines.includes(instruction)) {
            setSelectedMedicines([...selectedMedicines, { medicine_id: instruction, instructions: instruction }]);
        }
    };

    const handleSubmit = async () => {
        await addConsultation({
            patient_id: patient.id,
            symptoms: selectedSymptoms,
            medicines: selectedMedicines
        });
        alert("Consultation added!");
    };

    return (
        <div className="p-4 border mt-4">
            <h2 className="text-lg font-bold">Patient Details</h2>
            <p>Name: {patient.name}</p>
            <p>Mobile: {patient.mobile_number}</p>

            <h3 className="mt-4 font-bold">Add Consultation</h3>

            <label>Symptoms:</label>
            <select multiple className="border p-2 w-full" onChange={(e) => setSelectedSymptoms([...e.target.selectedOptions].map(o => o.value))}>
                {symptoms.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>

            <label className="mt-2">Medicines:</label>
            <select className="border p-2 w-full" onChange={(e) => setInstruction(e.target.value)}>
                {medicines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <button onClick={handleAddMedicine} className="bg-green-500 text-white p-2 mt-2">Add Medicine</button>

            <ul>
                {selectedMedicines.map((m, index) => (
                    <li key={index}>{m.instructions}</li>
                ))}
            </ul>

            <button onClick={handleSubmit} className="bg-blue-500 text-white p-2 mt-4">Save Consultation</button>
        </div>
    );
}

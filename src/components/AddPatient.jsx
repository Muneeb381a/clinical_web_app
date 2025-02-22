import React, { useState } from "react";
import axios from "axios";

const AddPatient = ({ setPatientData }) => {
    const [name, setName] = useState("");
    const [mobile, setMobile] = useState("");
    const [gender, setGender] = useState("");
    const [address, setAddress] = useState("");

    const handleAddPatient = async () => {
        const newPatient = { name, mobile, gender, address };
        try {
            const res = await axios.post("/api/patients", newPatient);
            setPatientData(res.data.data);
        } catch (error) {
            console.error("Error adding patient", error);
        }
    };

    return (
        <div>
            <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <input
                type="text"
                placeholder="Mobile"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
            />
            <input
                type="text"
                placeholder="Gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
            />
            <textarea
                placeholder="Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
            />
            <button onClick={handleAddPatient}>Add Patient</button>
        </div>
    );
};


export default AddPatient;
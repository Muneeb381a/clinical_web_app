import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

const patientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.coerce.number().positive("Enter a valid age"),
  gender: z.enum(["Male", "Female", "Others"]),
  mobile: z.string().min(10, "Enter a valid mobile number").max(15),
});

const AddPatientForm = ({ searchedMobile, onSuccess, onClose }) => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(patientSchema),
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    if (searchedMobile) {
      setValue("mobile", searchedMobile);
    }
  }, [searchedMobile, setValue]);

  const addPatient = async (data) => {
    setLoading(true);
    try {
      const res = await axios.post("https://patient-management-backend-nine.vercel.app/api/patients", {
        name: data.name,
        age: Number(data.age),
        gender: data.gender,
        mobile: data.mobile,
      });

      const patientId = res.data.id || res.data._id;
      console.log("AddPatientForm - Backend response:", res.data);
      console.log("AddPatientForm - Patient ID:", patientId);

      if (!patientId) {
        throw new Error("Patient ID not found in response");
      }

      toast.success("Patient registered successfully!", {
        position: "top-right",
        autoClose: 2000,
      });
      

      if (onSuccess) onSuccess(); // Trigger any additional success actions
      if (onClose) onClose(); // Close the popup after success

      setTimeout(() => {
        console.log(
          "AddPatientForm - Navigating to:",
          `/patients/${patientId}/consultations/new`
        );
        navigate(`/patients/${patientId}/consultations/new`, { replace: true });
      }, 300);

      console.log("Patient Registered:", res.data);
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to register patient";
      toast.error(`Error: ${errorMessage}`, {
        position: "top-right",
        autoClose: 4000,
      });
      console.error("Error adding patient", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <ToastContainer />
      <h3 className="text-lg font-semibold text-gray-800">New Patient Registration</h3>
      <form onSubmit={handleSubmit(addPatient)} className="grid grid-cols-2 gap-4 mt-4">
        {[{ name: "name", label: "Full Name" }, { name: "age", label: "Age", type: "number" },
          { name: "mobile", label: "Mobile Number", type: "text", readOnly: true }].map((field) => (
          <div key={field.name} className="space-y-1">
            <label className="text-sm font-medium text-gray-600">{field.label}</label>
            <input
              {...register(field.name)}
              type={field.type || "text"}
              className={`w-full rounded-lg border-2 border-gray-100 p-3 shadow-sm focus:border-blue-400 focus:ring-4 focus:ring-blue-50/50 transition-all ${
                field.readOnly ? "bg-gray-100 cursor-not-allowed" : ""
              }`}
              readOnly={field.readOnly}
            />
          </div>
        ))}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-600">Gender</label>
          <select
            {...register("gender")}
            className="w-full rounded-lg border-2 border-gray-100 p-3 shadow-sm focus:border-blue-400 focus:ring-4 focus:ring-blue-50/50 transition-all"
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Others">Others</option>
          </select>
        </div>
        <button
          type="submit"
          className="col-span-2 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all"
          disabled={loading}
        >
          {loading ? "Registering..." : "📥 Register New Patient"}
        </button>
      </form>
      <div className="mt-4 space-y-2">
        {Object.values(errors).map((error, index) => (
          <p key={index} className="text-sm text-red-600 flex items-center gap-2">
            ⚠️ {error.message}
          </p>
        ))}
      </div>
    </div>
  );
};

export default AddPatientForm;

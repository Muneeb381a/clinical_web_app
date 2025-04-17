// src/components/Patient/PatientSearchForm.jsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const searchSchema = z.object({
  mobile: z.string().min(10, "Enter a valid mobile number"),
});

const PatientSearchForm = ({ onSearch, isSearching }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(searchSchema) });

  return (
    <div className="mb-8 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-blue-700 p-2.5 rounded-lg text-white shadow-sm">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Patient Lookup</h3>
          <p className="text-sm text-gray-600">Search existing patient records by mobile number</p>
        </div>
      </div>
      <form onSubmit={handleSubmit(onSearch)} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
            Mobile Number <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-3">
            <input
              {...register("mobile")}
              placeholder="0300 1234567"
              className="w-full rounded-xl border-2 border-gray-200 bg-white p-3.5 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="self-stretch px-8 bg-blue-700 text-white font-semibold rounded-xl shadow-md hover:bg-blue-800 transition-colors flex items-center justify-center cursor-pointer"
            >
              {isSearching ? (
                <div className="flex items-center gap-2">
                  <span className="animate-spin">🌀</span> Searching...
                </div>
              ) : (
                "Find Patient"
              )}
            </button>
          </div>
        </div>
        {errors.mobile && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2.5 rounded-lg">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
            </svg>
            <span className="text-sm">{errors.mobile.message}</span>
          </div>
        )}
      </form>
    </div>
  );
};

export default PatientSearchForm;
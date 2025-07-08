import React from "react";
import { Upload } from "lucide-react";

/**
 * FileUpload reusable component
 * Props:
 * - id: string (input id)
 * - accept: string (accepted file types)
 * - onUpload: function (called when upload button is clicked)
 * - buttonText: string (button label)
 * - status: string (status message)
 * - helpText: string (optional help/placeholder text)
 * - className: string (optional extra classes)
 */
export default function FileUpload({
  id,
  accept,
  onUpload,
  buttonText = "Upload",
  status = "",
  helpText = "",
  className = "",
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <div className="input-div">
        <Upload className="upload-icon" />
        <input
          id={id}
          type="file"
          accept={accept}
          className="upload-input"
        />
      </div>
      {helpText && (
        <p className="text-gray-400 mt-4 mb-4 text-center">{helpText}</p>
      )}
      <button
        onClick={onUpload}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-3xl transition-colors mt-8"
      >
        {buttonText}
      </button>
      {status && (
        <div className="mt-4 text-sm text-gray-400 text-center">{status}</div>
      )}
    </div>
  );
} 
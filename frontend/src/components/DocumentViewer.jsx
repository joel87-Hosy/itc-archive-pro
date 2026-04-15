// frontend/src/components/DocumentViewer.jsx
import { Download, Printer, X } from "lucide-react";

const DocumentViewer = ({ fileUrl, fileName, onClose }) => {
  if (!fileUrl) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl h-[90vh] rounded-xl flex flex-col overflow-hidden shadow-2xl">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <span className="text-blue-600">Aperçu :</span> {fileName}
          </h3>
          <div className="flex gap-3">
            <button
              className="p-2 hover:bg-gray-200 rounded-full text-gray-600"
              title="Imprimer"
            >
              <Printer size={20} />
            </button>
            <a
              href={fileUrl}
              download
              className="p-2 hover:bg-gray-200 rounded-full text-gray-600"
              title="Télécharger"
            >
              <Download size={20} />
            </a>
            <button
              onClick={onClose}
              className="p-2 hover:bg-red-100 text-red-500 rounded-full"
            >
              <X size={24} />
            </button>
          </div>
        </div>
        <div className="flex-1 bg-gray-200">
          <iframe
            src={`${fileUrl}#toolbar=0`}
            className="w-full h-full border-none"
            title="Aperçu du document"
          ></iframe>
        </div>
      </div>
    </div>
  );
};

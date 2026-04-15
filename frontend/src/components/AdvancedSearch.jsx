// frontend/src/components/AdvancedSearch.jsx
import { useState } from "react";

const AdvancedSearch = ({ onSearch }) => {
  const [filters, setFilters] = useState({
    query: "",
    category: "",
    dateStart: "",
  });

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6 flex flex-wrap gap-4 items-end">
      <div className="flex-1">
        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">
          Recherche
        </label>
        <input
          type="text"
          placeholder="Référence ou titre..."
          className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          onChange={(e) => setFilters({ ...filters, query: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">
          Département
        </label>
        <select
          className="border rounded-md p-2 text-sm bg-white"
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
        >
          <option value="">Tous les départements</option>
          <option value="Technique">Technique</option>
          <option value="RH">RH</option>
          <option value="Finance">Finance</option>
        </select>
      </div>
      <button
        onClick={() => onSearch(filters)}
        className="bg-slate-900 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition"
      >
        Filtrer les archives
      </button>
    </div>
  );
};

// On simule un utilisateur connecté (ceci viendrait de votre API Login)
const currentUser = {
  name: "Koné",
  role: "ARCHIVISTE",
  department: "Technique",
};

// Utilisation dans le composant Dashboard :
const Dashboard = () => {
  const { role, department } = currentUser;

  return (
    <aside className="w-64 bg-slate-900 text-white p-6">
      <nav className="space-y-2">
        {/* Visible par tous */}
        <button className="flex items-center gap-3 w-full p-3 bg-blue-600 rounded-lg">
          <Database size={18} /> Explorateur
        </button>

        {/* Uniquement pour les archivistes ou admins */}
        {(role === "ADMIN" || role === "ARCHIVISTE") && (
          <button className="flex items-center gap-3 w-full p-3 hover:bg-slate-800 rounded-lg">
            <Upload size={18} /> Verser un document
          </button>
        )}

        {/* Uniquement pour l'Admin système */}
        {role === "ADMIN" && (
          <button className="flex items-center gap-3 w-full p-3 hover:bg-slate-800 rounded-lg text-red-400">
            <Shield size={18} /> Sécurité & Logs
          </button>
        )}
      </nav>
    </aside>
  );
};

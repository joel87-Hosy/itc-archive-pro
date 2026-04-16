import {
  Database,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  LogOut,
  Printer,
  Search,
  Shield,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { exportArchivesToExcel } from "../utils/exportArchives";

// --- COMPOSANT : VISUALISEUR DE DOCUMENTS ---
const DocumentViewer = ({ fileUrl, fileName, onClose }) => {
  if (!fileUrl) return null;
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl h-[90vh] rounded-xl flex flex-col overflow-hidden shadow-2xl">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <FileText size={18} className="text-blue-600" /> {fileName}
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
              className="p-2 hover:bg-red-100 text-red-500 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>
        <div className="flex-1 bg-gray-100">
          <iframe
            src={`${fileUrl}#toolbar=0`}
            className="w-full h-full border-none"
            title="Aperçu"
          ></iframe>
        </div>
      </div>
    </div>
  );
};

// --- COMPOSANT PRINCIPAL : DASHBOARD ---
const Dashboard = () => {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Tous");
  const [sortOption, setSortOption] = useState("date");
  const [activeSection, setActiveSection] = useState("explorer");
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [isAccountsLoading, setIsAccountsLoading] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [accountForm, setAccountForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
  });
  const [accountMessage, setAccountMessage] = useState("");
  const headerRef = useRef(null);
  const mainContentRef = useRef(null);
  const navigate = useNavigate();

  const normalizeRoleLabel = (role = "") => {
    const normalizedRole = role.trim().toUpperCase();

    switch (normalizedRole) {
      case "ADMIN":
      case "ADMINISTRATEUR":
        return "Administrateur";
      case "ARCHIVISTE":
        return "Archiviste";
      case "SUPERVISEUR":
        return "Superviseur";
      case "CONSULTATION":
        return "Consultation";
      default:
        return role || "Utilisateur";
    }
  };

  const displayRole = normalizeRoleLabel(
    localStorage.getItem("user_role") || "Archiviste",
  );
  const displayDepartment =
    localStorage.getItem("user_department") || "Département Technique";
  const isAdmin = displayRole === "Administrateur";
  const isSuperviseur = displayRole === "Superviseur";
  const isArchiviste = displayRole === "Archiviste";
  const canUploadDocuments = isSuperviseur || isArchiviste;
  const canExportReports = isSuperviseur || isArchiviste;
  const canAccessAdministration = isAdmin || isSuperviseur || isArchiviste;
  const canAddUsers = isAdmin;
  const canManageAccounts = isAdmin || isSuperviseur;
  const LOCAL_STORAGE_ACCOUNTS_KEY = "itc_accounts";
  const logoSrc = `${process.env.PUBLIC_URL}/itc-logo.jpg`;

  const defaultAccounts = [
    {
      id: 1,
      name: "Admin ITC",
      email: "admin@itc.ci",
      role: "Administrateur",
      department: "Administration",
    },
    {
      id: 2,
      name: "Superviseur ITC",
      email: "superviseur@itc.ci",
      role: "Superviseur",
      department: "Supervision",
    },
    {
      id: 3,
      name: "Archive ITC",
      email: "archives@itc.ci",
      role: "Archiviste",
      department: "Archives",
    },
    {
      id: 4,
      name: "Consult ITC",
      email: "consultation@itc.ci",
      role: "Consultation",
      department: "Consultation",
    },
  ];

  const getLocalAccounts = () => {
    try {
      const storedAccounts = JSON.parse(
        localStorage.getItem(LOCAL_STORAGE_ACCOUNTS_KEY) || "null",
      );

      if (Array.isArray(storedAccounts) && storedAccounts.length > 0) {
        return storedAccounts;
      }
    } catch (error) {
      console.error("Impossible de lire les comptes locaux", error);
    }

    localStorage.setItem(
      LOCAL_STORAGE_ACCOUNTS_KEY,
      JSON.stringify(defaultAccounts),
    );
    return defaultAccounts;
  };

  const saveLocalAccounts = (nextAccounts) => {
    setAccounts(nextAccounts);
    localStorage.setItem(
      LOCAL_STORAGE_ACCOUNTS_KEY,
      JSON.stringify(nextAccounts),
    );
  };

  const loadAccounts = async () => {
    setIsAccountsLoading(true);

    try {
      const response = await fetch("/api/users");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Impossible de charger les comptes.");
      }

      setAccounts(result.data || []);
    } catch (error) {
      setAccounts(getLocalAccounts());
    } finally {
      setIsAccountsLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    const updateHeaderOffset = () => {
      const headerHeight = headerRef.current?.offsetHeight || 0;
      document.documentElement.style.setProperty(
        "--dashboard-header-offset",
        `${headerHeight + 12}px`,
      );
    };

    updateHeaderOffset();
    window.addEventListener("resize", updateHeaderOffset);

    return () => {
      window.removeEventListener("resize", updateHeaderOffset);
    };
  }, []);

  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [activeSection]);

  const handleExportReport = () => {
    if (!canExportReports) {
      return;
    }

    if (documents.length === 0) {
      window.alert("Aucun document disponible pour l'export.");
      return;
    }

    exportArchivesToExcel(documents);
  };

  const handleLogout = () => {
    localStorage.removeItem("itc_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_department");
    navigate("/login");
  };

  const resetAccountForm = () => {
    setAccountForm({ name: "", email: "", password: "", role: "" });
    setSelectedAccountId("");
  };

  const handleAccountFieldChange = (field, value) => {
    setAccountForm((current) => ({ ...current, [field]: value }));
    setAccountMessage("");
  };

  const handleAccountSelection = (value) => {
    setSelectedAccountId(value);
    setAccountMessage("");

    if (!value) {
      resetAccountForm();
      return;
    }

    const selectedAccount = accounts.find(
      (account) => account.id === Number(value),
    );

    if (selectedAccount) {
      setAccountForm({
        name: selectedAccount.name,
        email: selectedAccount.email,
        password: "",
        role: selectedAccount.role,
      });
    }
  };

  const handleCreateAccount = async () => {
    if (!canAddUsers) {
      setAccountMessage(
        "Seul l'administrateur peut ajouter un nouveau compte.",
      );
      return;
    }

    if (
      !accountForm.name.trim() ||
      !accountForm.email.trim() ||
      !accountForm.password.trim() ||
      !accountForm.role
    ) {
      setAccountMessage(
        "Veuillez renseigner tous les champs avant la création.",
      );
      return;
    }

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(accountForm),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Création du compte impossible.");
      }

      setAccountMessage(
        result.message || "Le nouveau compte a été créé avec succès.",
      );
      resetAccountForm();
      await loadAccounts();
    } catch (error) {
      const localAccounts = getLocalAccounts();
      const normalizedEmail = accountForm.email.trim().toLowerCase();

      if (
        localAccounts.some(
          (account) => account.email?.toLowerCase() === normalizedEmail,
        )
      ) {
        setAccountMessage("Un compte avec cet email existe déjà.");
        return;
      }

      const nextAccounts = [
        ...localAccounts,
        {
          id: Date.now(),
          name: accountForm.name.trim(),
          email: normalizedEmail,
          role: accountForm.role,
          department: "Département Technique",
        },
      ];

      saveLocalAccounts(nextAccounts);
      setAccountMessage("Le nouveau compte a été créé avec succès.");
      resetAccountForm();
    }
  };

  const handleUpdateAccount = async () => {
    if (!canManageAccounts) {
      setAccountMessage(
        "Vous n'êtes pas autorisé à modifier les comptes utilisateurs.",
      );
      return;
    }

    if (!selectedAccountId) {
      setAccountMessage("Sélectionnez d'abord un compte à modifier.");
      return;
    }

    if (
      !accountForm.name.trim() ||
      !accountForm.email.trim() ||
      !accountForm.role
    ) {
      setAccountMessage(
        "Complétez les informations du compte avant la modification.",
      );
      return;
    }

    try {
      const response = await fetch(`/api/users/${selectedAccountId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(accountForm),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Mise à jour du compte impossible.");
      }

      setAccountMessage(
        result.message || "Le compte sélectionné a été modifié avec succès.",
      );
      resetAccountForm();
      await loadAccounts();
    } catch (error) {
      const nextAccounts = getLocalAccounts().map((account) =>
        account.id === Number(selectedAccountId)
          ? {
              ...account,
              name: accountForm.name.trim(),
              email: accountForm.email.trim().toLowerCase(),
              role: accountForm.role,
            }
          : account,
      );

      saveLocalAccounts(nextAccounts);
      setAccountMessage("Le compte sélectionné a été modifié avec succès.");
      resetAccountForm();
    }
  };

  const handleDeleteAccount = async (accountId = selectedAccountId) => {
    const targetAccountId = accountId || selectedAccountId;

    if (!canManageAccounts) {
      setAccountMessage(
        "Vous n'êtes pas autorisé à supprimer des comptes utilisateurs.",
      );
      return;
    }

    if (!targetAccountId) {
      setAccountMessage("Sélectionnez un compte à supprimer.");
      return;
    }

    try {
      const response = await fetch(`/api/users/${targetAccountId}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Suppression du compte impossible.");
      }

      setAccountMessage(
        result.message || "Le compte sélectionné a été supprimé avec succès.",
      );
      resetAccountForm();
      await loadAccounts();
    } catch (error) {
      const nextAccounts = getLocalAccounts().filter(
        (account) => account.id !== Number(targetAccountId),
      );

      saveLocalAccounts(nextAccounts);
      setAccountMessage("Le compte sélectionné a été supprimé avec succès.");
      resetAccountForm();
    }
  };

  const categories = [
    "Tous",
    "Etude",
    "Gestion Stock ITC",
    "RH",
    "Finance",
    "Supervision ITC",
    "Attachement ITC",
    "Corrdination-Moov ITC",
    "Coordination-Orange ITC",
  ];

  const documentsData = [
    {
      id: 1,
      reference: "ITC-2026-001",
      title: "Analyse couverture Nord",
      fileName: "Analyse_Couverture_Nord.pdf",
      category: "Etude",
      registeredAt: "2026-04-14",
    },
    {
      id: 2,
      reference: "ITC-2026-002",
      title: "Avant projet fibre urbaine",
      fileName: "Avant_Projet_Fibre_Urbaine.pdf",
      category: "Etude",
      registeredAt: "2026-04-10",
    },
    {
      id: 3,
      reference: "ITC-2026-003",
      title: "Bon entrée matériel",
      fileName: "Bon_Entree_Materiel.pdf",
      category: "Gestion Stock ITC",
      registeredAt: "2026-04-13",
    },
    {
      id: 4,
      reference: "ITC-2026-004",
      title: "Fiche inventaire entrepôt",
      fileName: "Fiche_Inventaire_Entrepot.pdf",
      category: "Gestion Stock ITC",
      registeredAt: "2026-04-08",
    },
    {
      id: 5,
      reference: "ITC-2026-005",
      title: "Contrat assistant RH",
      fileName: "Contrat_Assistant_RH.pdf",
      category: "RH",
      registeredAt: "2026-04-12",
    },
    {
      id: 6,
      reference: "ITC-2026-006",
      title: "Dossier formation interne",
      fileName: "Dossier_Formation_Interne.pdf",
      category: "RH",
      registeredAt: "2026-04-07",
    },
    {
      id: 7,
      reference: "ITC-2026-007",
      title: "Budget mensuel exploitation",
      fileName: "Budget_Mensuel_Exploitation.pdf",
      category: "Finance",
      registeredAt: "2026-04-11",
    },
    {
      id: 8,
      reference: "ITC-2026-008",
      title: "Facture fournisseur réseau",
      fileName: "Facture_Fournisseur_Reseau.pdf",
      category: "Finance",
      registeredAt: "2026-04-06",
    },
    {
      id: 9,
      reference: "ITC-2026-009",
      title: "Alerte supervision backbone",
      fileName: "Alerte_Supervision_Backbone.pdf",
      category: "Supervision ITC",
      registeredAt: "2026-04-15",
    },
    {
      id: 10,
      reference: "ITC-2026-010",
      title: "Rapport supervision accès",
      fileName: "Rapport_Supervision_Acces.pdf",
      category: "Supervision ITC",
      registeredAt: "2026-04-05",
    },
    {
      id: 11,
      reference: "ITC-2026-011",
      title: "Compte rendu réunion Moov",
      fileName: "Compte_Rendu_Reunion_Moov.pdf",
      category: "Corrdination-Moov ITC",
      registeredAt: "2026-04-09",
    },
    {
      id: 12,
      reference: "ITC-2026-012",
      title: "Planning intervention Moov",
      fileName: "Planning_Intervention_Moov.pdf",
      category: "Corrdination-Moov ITC",
      registeredAt: "2026-04-04",
    },
    {
      id: 13,
      reference: "ITC-2026-013",
      title: "Compte rendu réunion Orange",
      fileName: "Compte_Rendu_Reunion_Orange.pdf",
      category: "Coordination-Orange ITC",
      registeredAt: "2026-04-03",
    },
    {
      id: 14,
      reference: "ITC-2026-014",
      title: "Suivi déploiement Orange",
      fileName: "Suivi_Deploiement_Orange.pdf",
      category: "Coordination-Orange ITC",
      registeredAt: "2026-04-15",
    },
  ];

  const categoryOrder = categories.reduce((accumulator, category, index) => {
    accumulator[category] = index;
    return accumulator;
  }, {});

  const documents = documentsData
    .filter((item) => {
      const matchesCategory =
        categoryFilter === "Tous" || categoryFilter === item.category;
      const matchesSearch =
        searchTerm.trim() === "" ||
        item.reference
          .toLowerCase()
          .includes(searchTerm.trim().toLowerCase()) ||
        item.fileName.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
        item.title.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.trim().toLowerCase());

      return matchesCategory && matchesSearch;
    })
    .sort((firstItem, secondItem) => {
      if (
        categoryFilter === "Tous" &&
        firstItem.category !== secondItem.category
      ) {
        return (
          categoryOrder[firstItem.category] - categoryOrder[secondItem.category]
        );
      }

      if (sortOption === "reference") {
        return firstItem.reference.localeCompare(secondItem.reference, "fr", {
          sensitivity: "base",
        });
      }

      if (sortOption === "nom") {
        return firstItem.fileName.localeCompare(secondItem.fileName, "fr", {
          sensitivity: "base",
        });
      }

      return (
        new Date(secondItem.registeredAt) - new Date(firstItem.registeredAt)
      );
    });

  const stats = [
    {
      label: "Etude",
      count: documentsData.filter((doc) => doc.category === "Etude").length,
      color: "border-blue-500",
    },
    {
      label: "Gestion Stock ITC",
      count: documentsData.filter((doc) => doc.category === "Gestion Stock ITC")
        .length,
      color: "border-indigo-500",
    },
    {
      label: "RH",
      count: documentsData.filter((doc) => doc.category === "RH").length,
      color: "border-emerald-500",
    },
    {
      label: "Finance",
      count: documentsData.filter((doc) => doc.category === "Finance").length,
      color: "border-orange-500",
    },
    {
      label: "Supervision ITC",
      count: documentsData.filter((doc) => doc.category === "Supervision ITC")
        .length,
      color: "border-blue-500",
    },
    {
      label: "Attachement ITC",
      count: documentsData.filter((doc) => doc.category === "Attachement ITC")
        .length,
      color: "border-orange-500",
    },
    {
      label: "Corrdination-Moov ITC",
      count: documentsData.filter(
        (doc) => doc.category === "Corrdination-Moov ITC",
      ).length,
      color: "border-indigo-500",
    },
    {
      label: "Coordination-Orange ITC",
      count: documentsData.filter(
        (doc) => doc.category === "Coordination-Orange ITC",
      ).length,
      color: "border-emerald-500",
    },
  ];

  const displayedStats =
    categoryFilter === "Tous"
      ? [
          {
            label: "Total Archives",
            count: documentsData.length,
            color: "border-blue-500",
          },
          ...stats,
        ]
      : stats.filter((stat) => stat.label === categoryFilter);

  const totalDocuments = documentsData.length || 1;
  const activeCategories = stats.filter((stat) => stat.count > 0);
  const categoryAnalytics = activeCategories.map((stat, index) => ({
    ...stat,
    percent: Math.round((stat.count / totalDocuments) * 100),
    shortLabel: stat.label
      .replace("Gestion Stock ITC", "Stock")
      .replace("Supervision ITC", "Supervision")
      .replace("Corrdination-Moov ITC", "Moov")
      .replace("Coordination-Orange ITC", "Orange")
      .replace("Attachement ITC", "Attachement"),
    barClass: [
      "bg-blue-500",
      "bg-violet-500",
      "bg-emerald-500",
      "bg-amber-500",
    ][index % 4],
  }));

  const maxCategoryCount = Math.max(
    ...categoryAnalytics.map((item) => item.count),
    1,
  );

  const latestArchiveDate = documentsData.reduce(
    (latestDate, document) => {
      const currentDate = new Date(`${document.registeredAt}T12:00:00`);
      return currentDate > latestDate ? currentDate : latestDate;
    },
    new Date(`${documentsData[0]?.registeredAt || "2026-04-15"}T12:00:00`),
  );

  const activityByDay = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(latestArchiveDate);
    day.setDate(latestArchiveDate.getDate() - (6 - index));

    const year = day.getFullYear();
    const month = String(day.getMonth() + 1).padStart(2, "0");
    const dayNumber = String(day.getDate()).padStart(2, "0");
    const dateKey = `${year}-${month}-${dayNumber}`;

    return {
      label: day.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
      }),
      count: documentsData.filter(
        (document) => document.registeredAt === dateKey,
      ).length,
    };
  });

  const maxActivityCount = Math.max(
    ...activityByDay.map((day) => day.count),
    1,
  );

  const workflowSteps = [
    {
      title: "Collecte",
      value: totalDocuments,
      note: "Documents reçus",
      accent: "bg-blue-500",
    },
    {
      title: "Classement",
      value: activeCategories.length,
      note: "Catégories actives",
      accent: "bg-violet-500",
    },
    {
      title: "Suivi",
      value: documents.length,
      note: "Documents affichés",
      accent: "bg-emerald-500",
    },
    {
      title: "Comptes",
      value: accounts.length,
      note: "Utilisateurs suivis",
      accent: "bg-amber-500",
    },
  ];

  const overviewMetrics = [
    {
      label: "Résultats visibles",
      value: Math.round((documents.length / totalDocuments) * 100),
      detail: `${documents.length} / ${totalDocuments} documents`,
      barClass: "bg-blue-500",
    },
    {
      label: "Couverture catégories",
      value: Math.round(
        (activeCategories.length / Math.max(categories.length - 1, 1)) * 100,
      ),
      detail: `${activeCategories.length} catégories actives`,
      barClass: "bg-violet-500",
    },
    {
      label: "Comptes configurés",
      value: Math.min(
        100,
        Math.round(
          (accounts.length / Math.max(defaultAccounts.length, 1)) * 100,
        ),
      ),
      detail: `${accounts.length} comptes`,
      barClass: "bg-emerald-500",
    },
  ];

  const navigationItems = [
    {
      key: "explorer",
      label: "Archives",
      icon: Database,
      visible: true,
    },
    {
      key: "upload",
      label: "Versement",
      icon: Upload,
      visible: canUploadDocuments,
    },
    {
      key: "admin",
      label: "Administration",
      icon: Shield,
      visible: canAccessAdministration,
    },
  ].filter((item) => item.visible);

  return (
    <div className="dashboard-shell min-h-screen bg-gray-50 font-sans text-slate-900">
      <header ref={headerRef} className="website-header">
        <div className="website-nav-bar">
          <div className="website-nav-top">
            <div className="website-brand">
              <div className="website-brand-logo">
                <img
                  src={logoSrc}
                  alt="ITC"
                  style={{
                    display: "block",
                    height: "3rem",
                    width: "3rem",
                    objectFit: "contain",
                    borderRadius: "0.75rem",
                  }}
                />
              </div>

              <div className="min-w-0">
                <h1 className="website-brand-title">ARCHIVE PRO</h1>
                <p className="website-brand-subtitle">
                  Portail documentaire ITC
                </p>
              </div>
            </div>

            <div className="website-menu-search relative group">
              <Search
                className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors"
                size={18}
              />
              <input
                type="text"
                placeholder="Rechercher une archive..."
                className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="website-actions">
              <div className="website-user-card">
                <p className="text-sm font-bold">{displayRole}</p>
                <p className="text-[11px] text-slate-500 font-medium">
                  {displayDepartment}
                </p>
              </div>

              {canExportReports && (
                <button
                  onClick={handleExportReport}
                  className="website-cta website-export"
                >
                  <FileSpreadsheet size={18} /> Exporter
                </button>
              )}

              <button
                onClick={handleLogout}
                className="website-cta website-logout"
              >
                <LogOut size={18} /> Déconnexion
              </button>
            </div>
          </div>

          <div className="website-tabs-bar">
            <nav className="website-menu" aria-label="Navigation principale">
              {navigationItems.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveSection(key)}
                  className={`website-menu-button ${
                    activeSection === key ? "active" : ""
                  }`}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main
        ref={mainContentRef}
        className="dashboard-main min-w-0 px-4 lg:px-8 py-4"
      >
        {activeSection === "explorer" && (
          <div className="archive-page-stack">
            <div className="document-space-banner document-space-content-banner mb-8">
              <p className="document-space-kicker">Espace documentaire</p>
              <h2 className="document-space-heading">
                Tableau de bord des archives
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all text-center ${
                    categoryFilter === cat
                      ? "bg-slate-900 text-white shadow-md"
                      : "bg-white text-slate-600 border border-gray-200 hover:border-blue-400"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {displayedStats.map((stat) => (
                <div
                  key={stat.label}
                  className={`bg-white p-6 rounded-2xl shadow-sm border-l-4 ${stat.color}`}
                >
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
                    {stat.label}
                  </p>
                  <h3 className="text-3xl font-black text-slate-800">
                    {stat.count}
                  </h3>
                </div>
              ))}
            </div>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-5 gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                      Graphique bâtonné
                    </p>
                    <h2 className="text-lg font-black text-slate-800">
                      Archives par catégorie
                    </h2>
                  </div>
                  <div className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold">
                    {totalDocuments} documents suivis
                  </div>
                </div>

                <div className="flex items-end justify-between gap-3 h-64">
                  {categoryAnalytics.map((item) => (
                    <div
                      key={item.label}
                      className="flex-1 min-w-0 h-full flex flex-col justify-end items-center gap-2"
                    >
                      <span className="text-[11px] font-bold text-slate-500">
                        {item.count}
                      </span>
                      <div className="w-full max-w-[56px] h-44 bg-slate-100 rounded-t-2xl rounded-b-md overflow-hidden flex items-end">
                        <div
                          className={`${item.barClass} w-full rounded-t-2xl`}
                          style={{
                            height: `${Math.max(
                              14,
                              (item.count / maxCategoryCount) * 100,
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 font-semibold text-center leading-tight">
                        {item.shortLabel}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-1">
                  Diagramme
                </p>
                <h2 className="text-lg font-black text-slate-800 mb-5">
                  Flux documentaire
                </h2>

                <div className="space-y-3">
                  {workflowSteps.map((step, index) => (
                    <div key={step.title} className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl ${step.accent} text-white grid place-items-center font-black`}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-slate-800">
                              {step.title}
                            </p>
                            <p className="text-xs text-slate-500">
                              {step.note}
                            </p>
                          </div>
                          <span className="text-lg font-black text-slate-800">
                            {step.value}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wide">
                  <span>Collecte</span>
                  <span>→</span>
                  <span>Classement</span>
                  <span>→</span>
                  <span>Suivi</span>
                  <span>→</span>
                  <span>Accès</span>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-1">
                  Graphique bâtonné
                </p>
                <h2 className="text-lg font-black text-slate-800 mb-5">
                  Activité des 7 derniers jours
                </h2>

                <div className="flex items-end justify-between gap-3 h-48">
                  {activityByDay.map((day) => (
                    <div
                      key={day.label}
                      className="flex-1 h-full flex flex-col justify-end items-center gap-2"
                    >
                      <span className="text-[11px] font-bold text-slate-500">
                        {day.count}
                      </span>
                      <div className="w-full max-w-[38px] h-36 bg-slate-100 rounded-t-2xl rounded-b-md flex items-end overflow-hidden">
                        <div
                          className="w-full bg-blue-500 rounded-t-2xl"
                          style={{
                            height: `${Math.max(
                              18,
                              (day.count / maxActivityCount) * 100,
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold text-center">
                        {day.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-1">
                  Diagramme de suivi
                </p>
                <h2 className="text-lg font-black text-slate-800 mb-5">
                  Indicateurs opérationnels
                </h2>

                <div className="space-y-4">
                  {overviewMetrics.map((metric) => (
                    <div key={metric.label}>
                      <div className="flex items-center justify-between mb-1.5 text-sm">
                        <span className="font-semibold text-slate-700">
                          {metric.label}
                        </span>
                        <span className="text-slate-500 font-bold">
                          {metric.value}%
                        </span>
                      </div>
                      <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`${metric.barClass} h-full rounded-full`}
                          style={{ width: `${metric.value}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {metric.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <div className="flex justify-between items-center mb-6 bg-white border border-gray-100 rounded-2xl p-4">
              <p className="text-sm font-semibold text-slate-700">
                Trier les documents par :
              </p>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-slate-700"
              >
                <option value="date">Date</option>
                <option value="reference">Référence</option>
                <option value="nom">Nom</option>
              </select>
            </div>

            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <Filter size={18} className="text-blue-500" />
                  {categoryFilter === "Tous"
                    ? "Derniers versements"
                    : `Documents - ${categoryFilter}`}
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/50 text-slate-400 text-[11px] uppercase font-black tracking-widest">
                    <tr>
                      <th className="px-8 py-4">Référence</th>
                      <th className="px-8 py-4">Nom du Document</th>
                      <th className="px-8 py-4">Catégorie</th>
                      <th className="px-8 py-4">Date d'enregistrement</th>
                      <th className="px-8 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-gray-50">
                    {documents.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-blue-50/30 transition-colors group"
                      >
                        <td className="px-8 py-5 font-mono text-blue-600 font-bold">
                          {item.reference}
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-50 text-red-500 rounded-lg group-hover:bg-red-500 group-hover:text-white transition-colors">
                              <FileText size={18} />
                            </div>
                            <span className="font-semibold text-slate-700">
                              {item.fileName}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-md text-[11px] font-bold uppercase">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-slate-500 font-medium">
                          {new Date(item.registeredAt).toLocaleDateString(
                            "fr-FR",
                          )}
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="inline-flex gap-2 flex-wrap justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewUrl(
                                  `http://api.itc.ci/uploads/doc_${item.id}.pdf`,
                                );
                                setSelectedFileName(item.fileName);
                              }}
                              className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-bold text-xs hover:bg-blue-600 hover:text-white transition-all"
                            >
                              Visualiser
                            </button>
                            {isArchiviste && (
                              <a
                                href={`http://api.itc.ci/uploads/doc_${item.id}.pdf`}
                                download={item.fileName}
                                className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-lg font-bold text-xs hover:bg-emerald-600 hover:text-white transition-all"
                              >
                                Télécharger
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {activeSection === "upload" && !canUploadDocuments && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6">
              <h2 className="font-bold text-slate-800 text-lg">
                Accès restreint
              </h2>
              <p className="text-slate-500 text-sm mt-2">
                Votre profil n'a pas le droit de verser un document.
              </p>
            </div>
          </section>
        )}

        {activeSection === "upload" && canUploadDocuments && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50">
              <h2 className="font-bold text-slate-800 text-lg">
                Verser un document
              </h2>
              <p className="text-slate-500 text-sm mt-2">
                Cette section permet de préparer l'ajout d'un nouveau document
                dans l'archive.
              </p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-6">
                <input
                  type="text"
                  placeholder="Titre du document"
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <input
                  type="text"
                  placeholder="Référence"
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowUploadForm(true)}
                  className="bg-blue-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-slate-900 transition-all"
                >
                  Ouvrir le formulaire de versement
                </button>
              </div>

              {showUploadForm && (
                <div className="mt-8 bg-gray-50 rounded-2xl border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">
                    Formulaire de versement
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <input
                      type="text"
                      placeholder="Nom du document"
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                    <select
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Sélectionner une catégorie
                      </option>
                      {categories.slice(1).map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    <input
                      type="file"
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-white shadow-sm"
                    />
                    <div className="flex gap-3">
                      <button
                        type="button"
                        className="bg-emerald-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-slate-900 transition-all"
                      >
                        Enregistrer
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowUploadForm(false)}
                        className="bg-white text-slate-700 px-4 py-3 rounded-lg font-bold border border-gray-200 hover:bg-gray-100 transition-all"
                      >
                        Fermer
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {activeSection === "admin" && canAccessAdministration && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
              <div>
                <h2 className="font-bold text-slate-800 text-lg">
                  Administration système
                </h2>
                <p className="text-slate-500 text-sm mt-2">
                  Gérez les utilisateurs, les rôles et les paramètres
                  d'archivage.
                </p>
              </div>
              {canAddUsers && (
                <button
                  type="button"
                  onClick={() => {
                    resetAccountForm();
                    setAccountMessage("");
                    setShowAccountForm(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-slate-900 transition-all"
                >
                  Ajouter un compte
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-6 p-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-blue-500">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
                  Utilisateurs
                </p>
                <h3 className="text-3xl font-black text-slate-800">
                  {accounts.length}
                </h3>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-indigo-500">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
                  Rôles
                </p>
                <h3 className="text-3xl font-black text-slate-800">
                  {new Set(accounts.map((account) => account.role)).size}
                </h3>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-emerald-500">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
                  Sauvegardes
                </p>
                <h3 className="text-3xl font-black text-slate-800">OK</h3>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-orange-500">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
                  Journaux
                </p>
                <h3 className="text-3xl font-black text-slate-800">128</h3>
              </div>
            </div>

            {!canAddUsers && (
              <div className="mx-6 mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                L'ajout de nouveaux comptes est réservé à l'administrateur.
              </div>
            )}

            {showAccountForm && canManageAccounts && (
              <div className="p-6 border-t border-gray-100 bg-gray-50">
                <h3 className="text-lg font-bold text-slate-800 mb-4">
                  Gestion des comptes utilisateurs
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <input
                    type="text"
                    placeholder="Nom complet"
                    value={accountForm.name}
                    onChange={(e) =>
                      handleAccountFieldChange("name", e.target.value)
                    }
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                  <input
                    type="email"
                    placeholder="Adresse email"
                    value={accountForm.email}
                    onChange={(e) =>
                      handleAccountFieldChange("email", e.target.value)
                    }
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                  <input
                    type="password"
                    placeholder="Mot de passe initial"
                    value={accountForm.password}
                    onChange={(e) =>
                      handleAccountFieldChange("password", e.target.value)
                    }
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                  <select
                    value={accountForm.role}
                    onChange={(e) =>
                      handleAccountFieldChange("role", e.target.value)
                    }
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    <option value="">Attribuer un rôle</option>
                    <option value="Administrateur">Administrateur</option>
                    <option value="Archiviste">Archiviste</option>
                    <option value="Consultation">Consultation</option>
                    <option value="Superviseur">Superviseur</option>
                  </select>

                  {isAccountsLoading && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                      Chargement des comptes en cours...
                    </div>
                  )}

                  {accountMessage && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
                      {accountMessage}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    {canAddUsers && (
                      <button
                        type="button"
                        onClick={handleCreateAccount}
                        className="bg-emerald-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-slate-900 transition-all"
                      >
                        Créer le compte
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleUpdateAccount}
                      className="bg-amber-500 text-white px-4 py-3 rounded-lg font-bold hover:bg-amber-600 transition-all"
                    >
                      Modifier le compte
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      className="bg-red-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-red-700 transition-all"
                    >
                      Supprimer le compte
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        resetAccountForm();
                        setAccountMessage("");
                        setShowAccountForm(false);
                      }}
                      className="bg-white text-slate-700 px-4 py-3 rounded-lg font-bold border border-gray-200 hover:bg-gray-100 transition-all"
                    >
                      Fermer
                    </button>
                  </div>
                </div>

                <div className="mt-6 overflow-x-auto rounded-2xl border border-gray-200 bg-white">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-slate-500 text-xs uppercase font-bold">
                      <tr>
                        <th className="px-4 py-3">Nom</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Rôle</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accounts.map((account) => (
                        <tr
                          key={account.id}
                          className="border-t border-gray-100"
                        >
                          <td className="px-4 py-3 font-semibold text-slate-700">
                            {account.name}
                          </td>
                          <td className="px-4 py-3 text-slate-500">
                            {account.email}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-bold">
                              {account.role}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {canManageAccounts ? (
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowAccountForm(true);
                                    handleAccountSelection(String(account.id));
                                  }}
                                  className="bg-amber-500 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-amber-600 transition-all"
                                >
                                  Modifier
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAccountMessage("");
                                    handleDeleteAccount(account.id);
                                  }}
                                  className="bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-red-700 transition-all"
                                >
                                  Supprimer
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs font-semibold text-slate-400">
                                Consultation
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Composant de prévisualisation (Modale) */}
      <DocumentViewer
        fileUrl={previewUrl}
        fileName={selectedFileName}
        onClose={() => setPreviewUrl(null)}
      />
    </div>
  );
};

export default Dashboard;

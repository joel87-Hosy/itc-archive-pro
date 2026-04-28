import {
  Bot,
  Brain,
  Cloud,
  Search,
  Smartphone,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const fallbackOverview = {
  deploymentMode: "edge-ready",
  syncStatus: "Prêt pour la synchronisation cloud sécurisée.",
  capabilities: [
    {
      id: "agents-genai",
      title: "IA ubiquitaire",
      summary:
        "Suggestions de recherche, classement intelligent et assistance contextuelle sans modifier le flux actuel.",
      status: "Prêt",
    },
    {
      id: "cloud-edge",
      title: "Cloud & Edge",
      summary:
        "Le portail reste exploitable localement et peut être connecté à une architecture cloud progressive.",
      status: "Actif",
    },
    {
      id: "web-mobile",
      title: "Web & Mobile",
      summary:
        "L'interface conserve une expérience responsive, adaptée au bureau comme au mobile.",
      status: "Convergé",
    },
  ],
};

const iconMap = {
  "agents-genai": Bot,
  "cloud-edge": Cloud,
  "web-mobile": Smartphone,
};

const assistantSamples = [
  "Que faut-il prioriser ?",
  "Conseil pour la recherche",
  "Mode cloud ou edge ?",
];

const searchSamples = [
  "documents finance récents",
  "archives RH",
  "rapports Orange par date",
];

const getDocumentDate = (document) => {
  const value = document.uploadedAt || document.registeredAt;
  const parsed = value ? new Date(value) : null;
  return Number.isNaN(parsed?.getTime()) ? null : parsed;
};

const InnovationHub = ({
  documentsData = [],
  accounts = [],
  displayRole = "Utilisateur",
  searchTerm = "",
  onApplySmartSearch = () => {},
}) => {
  const [overview, setOverview] = useState(fallbackOverview);
  const [assistantPrompt, setAssistantPrompt] = useState("");
  const [assistantReply, setAssistantReply] = useState(
    "Bonjour. Je peux vous aider à prioriser les archives, guider la recherche et recommander le meilleur mode d’exploitation.",
  );
  const [naturalQuery, setNaturalQuery] = useState("");
  const [smartSearchMessage, setSmartSearchMessage] = useState(
    "Décrivez votre besoin en langage naturel et la recherche sera appliquée automatiquement.",
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof window === "undefined" ? true : window.navigator.onLine,
  );

  useEffect(() => {
    const updateConnectionState = () => {
      setIsOnline(window.navigator.onLine);
    };
    window.addEventListener("online", updateConnectionState);
    window.addEventListener("offline", updateConnectionState);
    return () => {
      window.removeEventListener("online", updateConnectionState);
      window.removeEventListener("offline", updateConnectionState);
    };
  }, []);

  useEffect(() => {
    if (!isAssistantOpen) return undefined;
    const handleEscape = (event) => {
      if (event.key === "Escape") setIsAssistantOpen(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isAssistantOpen]);

  // Suppression de l'appel API - on utilise directement fallbackOverview
  useEffect(() => {
    setOverview(fallbackOverview);
  }, []);

  const dominantCategory = useMemo(() => {
    if (!documentsData.length) return "Archives générales";
    const counts = documentsData.reduce((accumulator, document) => {
      accumulator[document.category] = (accumulator[document.category] || 0) + 1;
      return accumulator;
    }, {});
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Archives générales";
  }, [documentsData]);

  const recentDocumentsCount = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return documentsData.filter((document) => {
      const documentDate = getDocumentDate(document);
      return documentDate && documentDate >= sevenDaysAgo;
    }).length;
  }, [documentsData]);

  const assistantSuggestions = useMemo(() => {
    const suggestions = [
      `Le moteur intelligent recommande de prioriser la catégorie ${dominantCategory}.`,
      isOnline
        ? "La synchronisation cloud peut être exploitée pour les équipes distantes."
        : "Le portail reste en mode edge local pour préserver la continuité de service.",
      accounts.length > 0
        ? `${accounts.length} compte(s) sont déjà prêts pour un pilotage collaboratif multi-écrans.`
        : "Ajoutez des comptes pour activer une collaboration plus fluide sur web et mobile.",
    ];
    if (searchTerm.trim()) {
      suggestions.unshift(
        `Suggestion GenAI : enrichir la recherche autour de "${searchTerm.trim()}" avec des filtres métiers.`,
      );
    }
    return suggestions.slice(0, 4);
  }, [accounts.length, dominantCategory, isOnline, searchTerm]);

  // Assistant IA local (sans API)
  const askAssistant = async (prompt) => {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) {
      setAssistantReply("Saisissez une question métier, par exemple sur la recherche, la priorité documentaire ou le mode cloud/mobile.");
      return;
    }
    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setAssistantReply(
      `Vue métier : ${documentsData.length} document(s) suivis, ${recentDocumentsCount} récent(s), catégorie dominante "${dominantCategory}". Conseil : priorisez les documents récents de la catégorie ${dominantCategory}.`,
    );
    setIsGenerating(false);
  };

  // Recherche naturelle locale (sans API)
  const runNaturalSearch = async (query) => {
    const cleanQuery = query.trim();
    if (!cleanQuery) {
      setSmartSearchMessage("Saisissez une demande comme finance récente, documents RH ou rapports Orange.");
      return;
    }
    setIsSearching(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    const fallbackSearch = cleanQuery.split(" ")[0] || "";
    onApplySmartSearch({
      category: "Tous",
      searchTerm: fallbackSearch,
      sortOption: "date",
    });
    setSmartSearchMessage(`Recherche rapide appliquée avec le mot-clé "${fallbackSearch || "général"}".`);
    setIsSearching(false);
  };

  return (
    <>
      {isAssistantOpen && (
        <button
          type="button"
          className="floating-ai-backdrop"
          aria-label="Fermer le panneau IA"
          onClick={() => setIsAssistantOpen(false)}
        />
      )}

      <div
        className={`floating-ai-panel ${isAssistantOpen ? "open" : ""}`}
        aria-hidden={!isAssistantOpen}
      >
        {/* Aurora border glow */}
        <div className="floating-ai-panel__aurora" aria-hidden="true" />

        <div className="floating-ai-panel__header">
          <div className="floating-ai-panel__header-left">
            <span className="floating-ai-panel__brain-icon">
              <Brain size={16} />
            </span>
            <div>
              <p className="floating-ai-panel__eyebrow">
                <Sparkles size={10} style={{ display: "inline", marginRight: "4px", verticalAlign: "middle" }} />
                Intelligence Artificielle
              </p>
              <h3 className="floating-ai-panel__title">
                Assistant & Recherche intelligente
              </h3>
            </div>
          </div>
          <div className="floating-ai-panel__header-right">
            <span className={`floating-ai-status-dot ${isOnline ? "online" : "offline"}`} title={isOnline ? "En ligne" : "Hors-ligne"} />
            <button
              type="button"
              className="floating-ai-panel__close"
              aria-label="Fermer l'assistant IA"
              onClick={() => setIsAssistantOpen(false)}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="floating-ai-panel__content">

          {/* Assistant IA */}
          <div className="ai-card ai-card--emerald">
            <div className="ai-card__header">
              <div className="ai-card__icon-wrap ai-card__icon-wrap--emerald">
                <Bot size={15} />
              </div>
              <div>
                <p className="ai-card__label">Assistant IA métier</p>
                <h4 className="ai-card__title">Posez une question sur vos archives</h4>
              </div>
            </div>

            <div className="ai-chips">
              {assistantSamples.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => { setAssistantPrompt(sample); askAssistant(sample); }}
                  className="ai-chip ai-chip--emerald"
                >
                  <Zap size={10} />
                  {sample}
                </button>
              ))}
            </div>

            <div className="ai-input-row">
              <textarea
                value={assistantPrompt}
                onChange={(event) => setAssistantPrompt(event.target.value)}
                rows={3}
                placeholder="Quels documents dois-je traiter en priorité cette semaine ?"
                className="ai-textarea ai-textarea--emerald"
              />
              <button
                type="button"
                onClick={() => askAssistant(assistantPrompt)}
                disabled={isGenerating}
                className="ai-btn ai-btn--emerald"
              >
                {isGenerating ? (
                  <span className="ai-typing-dots">
                    <span /><span /><span />
                  </span>
                ) : (
                  <>
                    <Brain size={14} />
                    Analyser
                  </>
                )}
              </button>
            </div>

            <div className="ai-reply ai-reply--emerald">
              <span className="ai-reply__icon"><Bot size={13} /></span>
              <p className="ai-reply__text">{assistantReply}</p>
            </div>
          </div>

          {/* Recherche naturelle */}
          <div className="ai-card ai-card--cyan">
            <div className="ai-card__header">
              <div className="ai-card__icon-wrap ai-card__icon-wrap--cyan">
                <Search size={15} />
              </div>
              <div>
                <p className="ai-card__label">Recherche IA avancée</p>
                <h4 className="ai-card__title">Cherchez en langage naturel</h4>
              </div>
            </div>

            <div className="ai-chips">
              {searchSamples.map((sampleQuery) => (
                <button
                  key={sampleQuery}
                  type="button"
                  onClick={() => { setNaturalQuery(sampleQuery); runNaturalSearch(sampleQuery); }}
                  className="ai-chip ai-chip--cyan"
                >
                  <Search size={10} />
                  {sampleQuery}
                </button>
              ))}
            </div>

            <div className="ai-input-row">
              <textarea
                value={naturalQuery}
                onChange={(event) => setNaturalQuery(event.target.value)}
                rows={3}
                placeholder="Montre-moi les documents finance les plus récents…"
                className="ai-textarea ai-textarea--cyan"
              />
              <button
                type="button"
                onClick={() => runNaturalSearch(naturalQuery)}
                disabled={isSearching}
                className="ai-btn ai-btn--cyan"
              >
                {isSearching ? (
                  <span className="ai-typing-dots">
                    <span /><span /><span />
                  </span>
                ) : (
                  <>
                    <Search size={14} />
                    Rechercher
                  </>
                )}
              </button>
            </div>

            <div className="ai-reply ai-reply--cyan">
              <span className="ai-reply__icon"><Sparkles size={13} /></span>
              <p className="ai-reply__text">{smartSearchMessage}</p>
            </div>
          </div>

        </div>
      </div>

      <button
        type="button"
        className={`floating-ai-launcher ${isAssistantOpen ? "active" : ""}`}
        onClick={() => setIsAssistantOpen((current) => !current)}
        aria-expanded={isAssistantOpen}
        aria-label={isAssistantOpen ? "Fermer l'assistant IA" : "Ouvrir l'assistant IA"}
      >
        <span className="floating-ai-launcher__pulse" aria-hidden="true" />
        <span className="floating-ai-launcher__icon">
          {isAssistantOpen ? <X size={17} /> : <Bot size={17} />}
        </span>
        <span className="floating-ai-launcher__text">
          {isAssistantOpen ? "Fermer l'IA" : "Assistant IA"}
        </span>
        <span className="floating-ai-launcher__badge" aria-hidden="true" />
      </button>
    </>
  );
};

export default InnovationHub;

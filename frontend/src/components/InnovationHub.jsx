import {
  ArrowRight,
  Bot,
  Cloud,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wifi,
  WifiOff,
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
        "L’interface conserve une expérience responsive, adaptée au bureau comme au mobile.",
      status: "Convergé",
    },
  ],
};

const iconMap = {
  "agents-genai": Bot,
  "cloud-edge": Cloud,
  "web-mobile": Smartphone,
};

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
    let isMounted = true;

    const loadOverview = async () => {
      try {
        const response = await fetch("/api/innovation/overview");
        const result = await response.json();

        if (isMounted && response.ok && result?.data) {
          setOverview(result.data);
        }
      } catch {
        if (isMounted) {
          setOverview(fallbackOverview);
        }
      }
    };

    loadOverview();

    return () => {
      isMounted = false;
    };
  }, []);

  const dominantCategory = useMemo(() => {
    if (!documentsData.length) {
      return "Archives générales";
    }

    const counts = documentsData.reduce((accumulator, document) => {
      accumulator[document.category] =
        (accumulator[document.category] || 0) + 1;
      return accumulator;
    }, {});

    return (
      Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      "Archives générales"
    );
  }, [documentsData]);

  const recentDocumentsCount = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return documentsData.filter((document) => {
      const documentDate = getDocumentDate(document);
      return documentDate && documentDate >= sevenDaysAgo;
    }).length;
  }, [documentsData]);

  const deviceMode =
    typeof window !== "undefined" && window.innerWidth < 768 ? "Mobile" : "Web";

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
        `Suggestion GenAI : enrichir la recherche autour de “${searchTerm.trim()}” avec des filtres métiers.`,
      );
    }

    return suggestions.slice(0, 4);
  }, [accounts.length, dominantCategory, isOnline, searchTerm]);

  const askAssistant = async (prompt) => {
    const cleanPrompt = prompt.trim();

    if (!cleanPrompt) {
      setAssistantReply(
        "Saisissez une question métier, par exemple sur la recherche, la priorité documentaire ou le mode cloud/mobile.",
      );
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/innovation/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: cleanPrompt,
          context: {
            documentsCount: documentsData.length,
            recentDocumentsCount,
            accountsCount: accounts.length,
            dominantCategory,
            role: displayRole,
            isOnline,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok || !result?.data?.reply) {
        throw new Error("Réponse indisponible");
      }

      setAssistantReply(result.data.reply);
    } catch {
      setAssistantReply(
        `Vue métier : ${documentsData.length} document(s) suivis, ${recentDocumentsCount} récent(s), catégorie dominante ${dominantCategory}.`,
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const runNaturalSearch = async (query) => {
    const cleanQuery = query.trim();

    if (!cleanQuery) {
      setSmartSearchMessage(
        "Saisissez une demande comme finance récente, documents RH ou rapports Orange.",
      );
      return;
    }

    setIsSearching(true);

    try {
      const response = await fetch("/api/innovation/natural-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: cleanQuery }),
      });

      const result = await response.json();

      if (!response.ok || !result?.data) {
        throw new Error("Recherche indisponible");
      }

      onApplySmartSearch(result.data);
      setSmartSearchMessage(result.data.explanation);
    } catch {
      const fallbackSearch = cleanQuery.split(" ")[0] || "";
      onApplySmartSearch({
        category: "Tous",
        searchTerm: fallbackSearch,
        sortOption: "date",
      });
      setSmartSearchMessage(
        `Recherche rapide appliquée avec le mot-clé ${fallbackSearch || "général"}.`,
      );
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <section className="mb-10 rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 text-white shadow-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-cyan-100">
            <Sparkles size={14} /> Transformation technologique
          </p>
          <h2 className="text-2xl font-black leading-tight">
            Votre application est maintenant prête pour l’IA, le cloud-edge et
            la convergence web/mobile
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-200">
            Cette couche d’innovation reste non bloquante : elle complète votre
            portail documentaire sans casser le code existant.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
          <p className="font-bold text-white">Mode actuel</p>
          <div className="mt-2 flex items-center gap-2 text-slate-200">
            {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
            <span>{isOnline ? "Connecté" : "Hors ligne"}</span>
          </div>
          <p className="mt-1 text-xs text-cyan-100">{overview.syncStatus}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {overview.capabilities.map((item) => {
          const Icon = iconMap[item.id] || ShieldCheck;

          return (
            <article
              key={item.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-cyan-100">
                  <Icon size={18} />
                  <span className="font-bold">{item.title}</span>
                </div>
                <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-200">
                  {item.status}
                </span>
              </div>
              <p className="text-sm text-slate-200">{item.summary}</p>
            </article>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-100">
            Pilotage adaptatif
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-xs text-slate-300">Rôle actif</p>
              <p className="mt-1 text-lg font-black">{displayRole}</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-xs text-slate-300">Archives récentes</p>
              <p className="mt-1 text-lg font-black">{recentDocumentsCount}</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-xs text-slate-300">Canal prioritaire</p>
              <p className="mt-1 text-lg font-black">{deviceMode}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-cyan-100">
            Suggestions de l’assistant
          </p>
          <div className="space-y-2">
            {assistantSuggestions.map((suggestion) => (
              <div
                key={suggestion}
                className="flex items-start gap-2 rounded-xl bg-slate-950/35 px-3 py-2 text-sm text-slate-100"
              >
                <ArrowRight size={15} className="mt-0.5 text-cyan-200" />
                <span>{suggestion}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-emerald-400/20 bg-slate-950/45 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-100">
                Assistant IA métier
              </p>
              <h3 className="mt-1 text-lg font-black text-white">
                Posez une question sur vos archives
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                "Que faut-il prioriser ?",
                "Conseil pour la recherche",
                "Mode cloud ou edge ?",
              ].map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => {
                    setAssistantPrompt(sample);
                    askAssistant(sample);
                  }}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-100"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto]">
            <textarea
              value={assistantPrompt}
              onChange={(event) => setAssistantPrompt(event.target.value)}
              rows={3}
              placeholder="Exemple : quels documents dois-je traiter en priorité cette semaine ?"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
            />
            <button
              type="button"
              onClick={() => askAssistant(assistantPrompt)}
              disabled={isGenerating}
              className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGenerating ? "Analyse..." : "Interroger l'assistant"}
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-100">
            {assistantReply}
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-400/20 bg-slate-950/45 p-4">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-100">
            Recherche IA avancée
          </p>
          <h3 className="mt-1 text-lg font-black text-white">
            Cherchez en langage naturel
          </h3>

          <div className="mt-3 flex flex-wrap gap-2">
            {[
              "documents finance récents",
              "archives RH",
              "rapports Orange par date",
            ].map((sampleQuery) => (
              <button
                key={sampleQuery}
                type="button"
                onClick={() => {
                  setNaturalQuery(sampleQuery);
                  runNaturalSearch(sampleQuery);
                }}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-100"
              >
                {sampleQuery}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto]">
            <textarea
              value={naturalQuery}
              onChange={(event) => setNaturalQuery(event.target.value)}
              rows={3}
              placeholder="Exemple : montre-moi les documents finance les plus récents"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
            />
            <button
              type="button"
              onClick={() => runNaturalSearch(naturalQuery)}
              disabled={isSearching}
              className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSearching ? "Filtrage..." : "Appliquer la recherche"}
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-100">
            {smartSearchMessage}
          </div>
        </div>
      </div>
    </section>
  );
};

export default InnovationHub;

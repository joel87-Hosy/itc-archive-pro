// frontend/src/pages/Login.jsx
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authenticateHostedUser } from "../utils/hostedAuth";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const logoSrc = `${process.env.PUBLIC_URL}/itc-logo.jpg`;
  const coverImageUrl = `${process.env.PUBLIC_URL}/image-couverture.png`;

  useEffect(() => {
    localStorage.removeItem("itc_accounts");
    const lastEmail = localStorage.getItem("itc_last_email") || "";
    if (lastEmail) {
      setEmail(lastEmail);
    }
  }, []);

  const persistSession = ({ token, user }) => {
    localStorage.setItem("itc_token", token);
    localStorage.setItem("user_role", user.role || "Archiviste");
    localStorage.setItem("user_name", user.name || email.trim());
    localStorage.setItem(
      "user_department",
      user.department || "Département Technique",
    );
    localStorage.setItem(
      "itc_last_email",
      (user.email || email.trim()).toLowerCase(),
    );
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setIsSubmitting(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      if (!normalizedEmail || !password.trim()) {
        throw new Error(
          "Veuillez renseigner votre email et votre mot de passe.",
        );
      }

      try {
        const response = await fetch("/api/users/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: normalizedEmail, password }),
        });

        const rawResult = await response.text();
        let result = {};

        try {
          result = rawResult ? JSON.parse(rawResult) : {};
        } catch {
          result = {};
        }

        if (!response.ok) {
          throw new Error(result.message || "Email ou mot de passe incorrect.");
        }

        persistSession({
          token: result.token || `session-${Date.now()}`,
          user: {
            ...result.user,
            email: normalizedEmail,
          },
        });

        navigate("/dashboard");
        return;
      } catch {
        // Le portail hébergé bascule sur le mode local sécurisé si l'API n'est pas joignable.
      }

      const hostedUser = await authenticateHostedUser(
        normalizedEmail,
        password,
      );

      persistSession({
        token: `hosted-session-${Date.now()}`,
        user: {
          ...hostedUser,
          email: normalizedEmail,
        },
      });

      navigate("/dashboard");
    } catch (error) {
      setLoginError(
        error.message ||
          "Connexion impossible pour le moment. Vérifiez le service utilisateur.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="login-shell min-h-screen bg-white flex"
      style={{ "--archive-illustration-art": `url(${coverImageUrl})` }}
    >
      {/* Côté Gauche : Formulaire */}
      <div className="login-form-panel flex-1 flex flex-col justify-center px-8 md:px-24 lg:px-32">
        <div className="mb-10 login-intro-block">
          <div
            className="login-brand-card bg-white rounded-2xl border border-gray-200 shadow-sm p-3 mb-4"
            style={{ maxWidth: "285px" }}
          >
            <img
              src={logoSrc}
              alt="ITC"
              style={{
                display: "block",
                width: "100%",
                transform: "scale(1.04)",
              }}
            />
          </div>
          <p className="login-kicker">
            Portail documentaire nouvelle génération
          </p>
          <h2 className="text-3xl font-black text-slate-900">
            Bienvenue sur Archive Pro
          </h2>
          <p className="text-slate-500 mt-2 font-medium">
            Connectez-vous pour accéder à votre espace d'archivage sécurisé.
          </p>
        </div>

        <form onSubmit={handleLogin} className="login-form space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
              Email Professionnel
            </label>
            <div className="relative group">
              <Mail
                className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors"
                size={20}
              />
              <input
                type="email"
                required
                value={email}
                placeholder="nom.prenom@ivoiretechno.com"
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                onChange={(e) => {
                  setEmail(e.target.value);
                  setLoginError("");
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                Mot de passe
              </label>
              <a
                href="#"
                className="text-sm font-bold text-blue-600 hover:text-blue-800"
              >
                Oublié ?
              </a>
            </div>
            <div className="relative group">
              <Lock
                className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors"
                size={20}
              />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                placeholder="••••••••"
                className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                onChange={(e) => {
                  setPassword(e.target.value);
                  setLoginError("");
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {loginError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {loginError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-blue-600 transform transition-all active:scale-[0.98] shadow-xl shadow-slate-200"
          >
            {isSubmitting ? "Connexion en cours..." : "Se connecter au portail"}
          </button>
        </form>

        <footer className="mt-12 text-center text-slate-400 text-xs font-medium">
          &copy; 2026 Ivoire Techno Com. Système d'archivage sécurisé.
        </footer>
      </div>

      {/* Côté Droit : Visuel (Masqué sur mobile) */}
      <div className="login-showcase-panel hidden lg:flex flex-1 bg-slate-900 relative overflow-hidden items-center justify-center p-12">
        {/* Cercles décoratifs */}
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-600 rounded-full blur-[120px] opacity-20"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-indigo-600 rounded-full blur-[120px] opacity-20"></div>

        <div className="relative z-10 text-center max-w-md">
          <div className="inline-flex p-4 bg-white rounded-3xl mb-8 shadow-xl">
            <img
              src={logoSrc}
              alt="ITC"
              style={{ display: "block", width: "220px", maxWidth: "100%" }}
            />
          </div>
          <h3 className="text-4xl font-black text-white mb-4 leading-tight">
            Archive Pro une Plateforme d'archivage numérique sécurisée et facile
            à utiliser, conçue pour les professionnels de l'archivage.
          </h3>
          <p className="text-slate-300 text-lg login-showcase-copy">
            Retrouvez une navigation plus claire, une recherche immédiate et une
            expérience inspirée des interfaces modernes.
          </p>

          <div className="mt-12 grid grid-cols-2 gap-4 text-left">
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
              <p className="text-blue-400 font-bold text-xl">100%</p>
              <p className="text-slate-500 text-xs font-bold uppercase">
                Traçabilité
              </p>
            </div>
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
              <p className="text-blue-400 font-bold text-xl">AES-256</p>
              <p className="text-slate-500 text-xs font-bold uppercase">
                Chiffrement
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

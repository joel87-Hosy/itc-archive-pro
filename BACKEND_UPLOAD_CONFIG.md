# Configuration Backend Upload Service

## Vue d'ensemble
Le backend gère maintenant les uploads de fichiers. Cela **contourne complètement les problèmes CORS** en faisant l'upload côté serveur.

### Comment ça marche:
```
Frontend (GitHub Pages) → Backend (Render) → Firebase Storage
                ✅ CORS OK              ✅ Pas de CORS côté serveur
```

---

## Installation des dépendances

```bash
cd backend
npm install
```

Cela installe:
- `firebase-admin` - SDK serveur Firebase
- `multer` - Gestion des uploads multipart

---

## Configuration Firebase Admin SDK

### Option 1: Variable d'environnement (Production - Render)

Obtenir les credentials:
1. Ouvrir https://console.firebase.google.com
2. Aller à **Paramètres du projet → Comptes de service**
3. Cliquer **Générer une nouvelle clé privée** → JSON
4. Copier le contenu JSON

Sur Render:
1. Aller à **Settings → Environment**
2. Ajouter variable `FIREBASE_SERVICE_ACCOUNT` avec la valeur JSON (en une ligne, sans retours)

```
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"archive-itc",...}
```

### Option 2: Fichier local (Développement)

Créer `backend/firebase-service-account.json`:
```json
{
  "type": "service_account",
  "project_id": "archive-itc",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-...@archive-itc.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

⚠️ **Ne pas committer ce fichier!** Il est déjà dans `.gitignore`.

---

## Tester localement

```bash
cd backend
npm run dev
```

Puis tester l'upload avec curl:
```bash
curl -X POST http://localhost:5000/api/upload \
  -F "file=@test.pdf" \
  -F "title=Mon document" \
  -F "category=Finance"
```

Ou depuis le frontend:
1. Démarrer le frontend: `cd frontend && npm start`
2. Aller à http://localhost:3000
3. Tenter un upload → devrait fonctionner!

---

## Variables d'environnement Frontend

### Développement (localhost):
```
REACT_APP_API_URL=http://localhost:5000
```

### Production (GitHub Pages + Render):
```
REACT_APP_API_URL=https://itc-archive-pro-api.onrender.com
```

Le workflow GitHub Actions définit automatiquement ceci lors de la construction.

---

## Sécurité Firebase Storage

L'upload se fait côté serveur avec les credentials service account, donc les fichiers sont protégés.

**Règles Firebase Storage** (recommandé):
```js
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /archives/{allPaths=**} {
      // Lecture: authentifiés
      allow read: if request.auth != null;
      // Écriture: depuis notre backend uniquement
      allow write: if request.auth == null; // Service account
      // Suppression: admin uniquement
      allow delete: if request.auth != null && 
        get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

---

## Logs et Debugging

### Vérifier que Firebase Admin est chargé:
```bash
# Dans les logs du serveur
npm run dev
# Chercher: "Firebase Admin initialized" ou "Firebase Storage not configured"
```

### Tester la connexion Firebase:
```bash
curl http://localhost:5000
# Devrait retourner: {"success":true,"message":"Backend ITC Archive en cours d'exécution"}
```

### Erreurs courantes:

#### "Firebase Storage not configured"
- ✓ Vérifier la variable FIREBASE_SERVICE_ACCOUNT
- ✓ Vérifier firebase-service-account.json existe et est valide
- ✓ Redémarrer le serveur

#### "Invalid service account"
- ✓ Copier-coller la clé JSON complètement et sans erreurs
- ✓ Vérifier que c'est au format JSON valide

#### "Permission denied"
- ✓ Vérifier que le service account a accès à Firebase Storage
- ✓ Vérifier les règles Firebase Storage

---

## Déploiement sur Render

1. Push les changements backend
2. Render redéploiera automatiquement
3. Ajouter `FIREBASE_SERVICE_ACCOUNT` dans Render → Settings → Environment
4. Redémarrer le service
5. Tester l'upload depuis GitHub Pages

✅ Les uploads devraient fonctionner maintenant!

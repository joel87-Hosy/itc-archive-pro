# 🔧 Configuration CORS Firebase Storage

## ⚠️ Problème
Les uploads échouent avec l'erreur:
```
Access to XMLHttpRequest ... has been blocked by CORS policy
```

C'est normal : GitHub Pages (`joel87-hosy.github.io`) ne peut pas communiquer avec Firebase Storage sans configuration CORS.

---

## ✅ Solution: Configurer CORS sur Firebase Storage

### **Étape 1: Installer Google Cloud SDK**

```bash
# Windows PowerShell (en tant qu'Admin)
(New-Object Net.ServicePointManager).SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Invoke-WebRequest https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe -OutFile .\GoogleCloudSDKInstaller.exe
.\GoogleCloudSDKInstaller.exe
```

Ou télécharger manuellement: https://cloud.google.com/sdk/docs/install-sdk

Après l'installation:
```bash
gcloud init
```

---

### **Étape 2: Configurer Firebase/Cloud avec votre compte**

```bash
gcloud auth login
gcloud config set project archive-itc
```

(Remplacer `archive-itc` par votre Project ID Firebase)

---

### **Étape 3: Appliquer la configuration CORS**

```bash
gsutil cors set cors.json gs://archive-itc.appspot.com
```

**Vérifier que CORS est appliqué:**
```bash
gsutil cors get gs://archive-itc.appspot.com
```

Devrait afficher:
```json
[
  {
    "origin": ["https://joel87-hosy.github.io"],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Authorization", "Content-Length", "User-Agent"]
  }
]
```

---

## 🔐 Sécurité Firebase Storage (Important!)

### **Règles actuelles (⚠️ TROP PERMISSIVES):**
Si vos règles sont:
```
allow read, write: if true;
```
→ N'importe qui peut télécharger/supprimer n'importe quoi!

### **Règles recommandées:**

Aller sur https://console.firebase.google.com → Storage → Règles

```js
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Authentification requise pour tous les uploads
    match /archives/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.email_verified;
      allow delete: if request.auth != null && (
        request.auth.token.custom_claims.role == 'admin' ||
        request.auth.token.custom_claims.role == 'archiviste'
      );
    }
    
    // Bloquer le reste
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 🧪 Tester l'upload après configuration

1. Ouvrir https://joel87-hosy.github.io/itc-archive-pro/#/dashboard
2. Essayer de verser un fichier
3. Si ça marche → **CORS est configuré! ✅**
4. Sinon → vérifier la console (F12 → Console) pour voir l'erreur

---

## ❌ Si ça ne marche toujours pas

**Option 1: Ajouter localhost pour développement local**

```bash
gsutil cors set cors-local.json gs://archive-itc.appspot.com
```

Créer `cors-local.json`:
```json
[
  {
    "origin": ["https://joel87-hosy.github.io", "http://localhost:3000", "http://localhost:5000"],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Authorization", "Content-Length", "User-Agent"]
  }
]
```

---

**Option 2: Utiliser un Backend Proxy (serveur Node.js)**

Si CORS Firebase ne fonctionne pas, utiliser le backend pour relayer les uploads:
- Frontend → Node.js Backend → Firebase Storage
- Le backend gère l'authentification + les uploads
- Voir `backend/server.js` pour implémenter une route `/api/upload`

---

## 📋 Checklist

- [ ] Google Cloud SDK installé
- [ ] `gcloud auth login` fait
- [ ] `gcloud config set project archive-itc` fait
- [ ] `gsutil cors set cors.json gs://archive-itc.appspot.com` exécuté
- [ ] Upload testé sur GitHub Pages → ✅ Marche!

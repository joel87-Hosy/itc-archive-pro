# 🔍 Diagnostic & Troubleshooting Upload Errors

## 1️⃣ Erreur: "CORS policy blocked"

### 🔴 Symptôme:
```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/...' 
has been blocked by CORS policy
```

### ✅ Solution:
```bash
# Installer Google Cloud SDK
gcloud auth login
gcloud config set project archive-itc

# Appliquer la configuration CORS
gsutil cors set cors.json gs://archive-itc.appspot.com

# Vérifier que CORS est appliqué
gsutil cors get gs://archive-itc.appspot.com
```

---

## 2️⃣ Erreur: "404 - File Not Found"

### 🔴 Symptôme:
```
Failed to load resource: the server responded with a status of 404
```

### 🤔 Possible causes:
- Fichier corrompu après compression
- Chemin de fichier invalide
- Fichier trop volumineux

### ✅ Actions:
1. Vérifier la taille du fichier (< 100MB recommandé)
2. Essayer avec un fichier PDF simple
3. Vérifier console (F12 → Console) pour l'erreur détaillée

---

## 3️⃣ Erreur: "Unauthorized"

### 🔴 Symptôme:
```
storage/unauthorized: User is not authorized to perform the desired action.
```

### ✅ Solution:
Vérifier les règles Firebase Storage dans **Firebase Console → Storage → Règles**:

```js
// CORRECT (pour app dev)
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /archives/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
      allow delete: if request.auth != null;
    }
  }
}
```

---

## 4️⃣ Upload fonctionne localement (localhost:3000) mais pas sur GitHub Pages

### 🔴 Symptôme:
- ✅ Fonctionne sur `http://localhost:3000`
- ❌ Échoue sur `https://joel87-hosy.github.io/itc-archive-pro/`

### ✅ Solution:
CORS n'a été configuré que pour GitHub Pages. Ajouter localhost pour développement:

```bash
# Créer cors-dev.json
cat > cors-dev.json << 'EOF'
[
  {
    "origin": ["https://joel87-hosy.github.io", "http://localhost:3000"],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Authorization"]
  }
]
EOF

# Appliquer
gsutil cors set cors-dev.json gs://archive-itc.appspot.com
```

---

## 5️⃣ Comment tester CORS manuellement?

```javascript
// Dans la console du navigateur (F12 → Console)
fetch('https://firebasestorage.googleapis.com/v0/b/archive-itc.appspot.com/o?name=test', {
  method: 'OPTIONS',
  headers: { 'Origin': 'https://joel87-hosy.github.io' }
}).then(r => {
  console.log('Status:', r.status);
  console.log('Headers:', r.headers.get('access-control-allow-origin'));
});
```

Devrait retourner:
- Status: 200 ✅
- Headers: https://joel87-hosy.github.io ✅

---

## 6️⃣ Vérifier la configuration CORS actuelle

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

## 7️⃣ Reset CORS (réinitialiser tout)

```bash
# Supprimer toute config CORS
gsutil cors delete gs://archive-itc.appspot.com

# Réappliquer la config correcte
gsutil cors set cors.json gs://archive-itc.appspot.com
```

---

## 📊 Checklist Diagnostic

- [ ] `gsutil cors get` affiche la bonne origine
- [ ] Firebase Storage règles permettent `write` et `read`
- [ ] Fichier < 100MB
- [ ] Console du navigateur (F12) : pas d'autre erreur
- [ ] JavaScript fetch test fonctionne (étape 5)
- [ ] Essayer avec un fichier simple (PDF, image < 5MB)

---

## 🆘 Si rien ne marche?

1. Consulter les logs Firebase: https://console.firebase.google.com
2. Ouvrir la console du navigateur (F12 → Console)
3. Copier l'erreur complète et l'envoyer
4. Vérifier que `gcloud` est installé: `gcloud --version`
5. Vérifier permissions Google Cloud: `gcloud auth list`

# 🏅 Pool Olympique — Los Angeles 2028

Application web de pool olympique : les participants choisissent le pays gagnant pour chaque discipline. Les pronostics sont verrouillés au début des jeux.

---

## 🏗️ Architecture

```
olympic-pool/
├── frontend/         React + Vite (interface utilisateur)
├── backend/          Node.js + Express (API REST)
└── supabase_schema.sql
```

**Technologies :**
- **Frontend** : React 18, Vite, CSS custom (no framework UI)
- **Backend** : Node.js, Express, JWT, bcryptjs
- **Base de données** : Supabase (PostgreSQL gratuit)
- **Données olympiques** : API gratuite [Codante.io](https://apis.codante.io/olympic-games)

---

## 🚀 Installation

### 1. Créer le projet Supabase

1. Va sur [supabase.com](https://supabase.com) → **New project**
2. Copie l'URL et la clé **service_role** (Settings → API)
3. Dans l'éditeur SQL, colle et exécute `supabase_schema.sql`

---

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# Remplir .env avec tes clés Supabase
npm run dev
```

**Variables `.env` :**

| Variable | Description |
|---|---|
| `SUPABASE_URL` | URL de ton projet Supabase |
| `SUPABASE_SERVICE_KEY` | Clé service_role (jamais exposée côté client) |
| `JWT_SECRET` | Secret aléatoire long pour signer les tokens |
| `ADMIN_KEY` | Clé secrète pour saisir les résultats après les jeux |
| `LOCK_DATE` | Date de verrouillage des pronostics (ISO 8601) |

---

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

---

## 📡 Endpoints API

### Auth
| Méthode | Route | Description |
|---|---|---|
| POST | `/auth/register` | Créer un compte |
| POST | `/auth/login` | Connexion |
| GET  | `/auth/me` | Profil (🔒 auth) |

### Pronostics
| Méthode | Route | Description |
|---|---|---|
| GET  | `/picks` | Mes pronostics (🔒 auth) |
| POST | `/picks` | Créer/modifier un pronostic (🔒 auth) |
| DELETE | `/picks/:discipline_id` | Supprimer un pronostic (🔒 auth) |

### Résultats & Classement
| Méthode | Route | Description |
|---|---|---|
| GET | `/leaderboard` | Tous les pronostics avec scores |
| GET | `/results` | Résultats officiels |
| POST | `/results` | Entrer un résultat (🔑 admin JWT) |
| DELETE | `/results/:id` | Supprimer un résultat (🔑 admin JWT) |
| GET | `/admin/users` | Liste des utilisateurs (🔑 admin JWT) |
| GET | `/admin/picks` | Tous les pronostics (🔑 admin JWT) |
| PUT | `/admin/users/:id` | Changer le rôle admin (🔑 admin JWT) |

> Les routes admin sont maintenant protégées par JWT avec `is_admin: true` — plus besoin de clé dans l'en-tête.

---

## 🌐 Données olympiques (Codante.io)

L'API est **gratuite, sans clé, 100 req/min** :

```
GET https://apis.codante.io/olympic-games/disciplines  → Liste des sports
GET https://apis.codante.io/olympic-games/countries    → Pays participants
GET https://apis.codante.io/olympic-games/events?discipline=ATH → Événements par sport
```

> **Note :** Les données sont celles de Paris 2024. Pour LA 2028, une API similaire sera disponible. En attendant, la structure est identique.

---

## 🚢 Déploiement

**Backend** → [Railway](https://railway.app) ou [Render](https://render.com) (tier gratuit)
```bash
# Variables d'environnement à configurer sur la plateforme
```

**Frontend** → [Vercel](https://vercel.com) ou [Netlify](https://netlify.com) (gratuit)
```bash
# Build command: npm run build
# Output dir: dist
# VITE_API_URL=https://ton-backend.railway.app
```

---

## 🔑 Créer le premier compte Admin

1. **Créer un compte normalement** via l'interface (inscription)
2. **Dans Supabase → Table Editor → users**, trouver ton utilisateur et mettre `is_admin = true`

   Ou via l'éditeur SQL :
   ```sql
   UPDATE public.users SET is_admin = true WHERE username = 'ton_pseudo';
   ```
3. **Se reconnecter** (le token JWT est regénéré au login avec le rôle admin)
4. L'onglet **🔑 Administration** apparaît dans la navigation

Une fois admin, tu peux **promouvoir d'autres utilisateurs** directement depuis l'interface (onglet Administration → Joueurs).

---

- ✅ Inscription / connexion (pseudo + mot de passe)
- ✅ Disciplines chargées dynamiquement via Codante.io
- ✅ Pays participants par discipline via Codante.io
- ✅ Pronostics modifiables jusqu'à la date de verrouillage
- ✅ Anneau de progression visuel
- ✅ Classement en temps réel (après saisie des résultats)
- ✅ Interface responsive mobile
- ✅ Verrouillage automatique à la date configurée

---

## 📝 Licence

Projet open source — libre de l'adapter pour tes amis !

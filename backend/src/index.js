import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import ogs from 'open-graph-scraper';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Config Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer en mémoire (pas de fichier temporaire sur disque)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Fichier non-image refusé'));
    cb(null, true);
  },
});

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

// ─── Blacklist tokens (mémoire) ───────────────────────────────────────────────
const tokenBlacklist = new Set();

// ─── Rôles (level bas = plus de droits) ──────────────────────────────────────
// superadmin = 1, admin = 2, captain = 3, player = 99
const ROLE_PLAYER = 99;

// ─── Helpers rôles ────────────────────────────────────────────────────────────
async function getRoles() {
  const { data } = await supabase.from('roles').select('*').order('level');
  return data || [];
}

async function getRoleById(id) {
  const { data } = await supabase.from('roles').select('*').eq('id', id).single();
  return data;
}

async function getUserWithRole(userId) {
  const { data } = await supabase.from('users')
    .select('*, roles(id, name, level, permissions)')
    .eq('id', userId).single();
  return data;
}

function userLevel(user) {
  return user.roles?.level ?? ROLE_PLAYER;
}

function hasPermission(user, perm) {
  const perms = user.roles?.permissions || {};
  return perms[perm] === true;
}

// ─── Middlewares ──────────────────────────────────────────────────────────────
function extractToken(req, res) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) { res.status(401).json({ error: 'Token manquant' }); return null; }
  if (tokenBlacklist.has(token)) { res.status(401).json({ error: 'Session expirée' }); return null; }
  try {
    const user = jwt.verify(token, JWT_SECRET);
    return { token, user };
  } catch {
    res.status(401).json({ error: 'Token invalide' });
    return null;
  }
}

function authMiddleware(req, res, next) {
  const result = extractToken(req, res);
  if (!result) return;
  req.user = result.user;
  req.token = result.token;
  next();
}

// requireLevel(n) : autorise si role_level <= n (superadmin=1 passe partout)
function requireLevel(level) {
  return (req, res, next) => {
    const result = extractToken(req, res);
    if (!result) return;
    req.user = result.user;
    req.token = result.token;
    if ((req.user.role_level ?? ROLE_PLAYER) > level) {
      return res.status(403).json({ error: 'Permissions insuffisantes' });
    }
    next();
  };
}

// requirePermission(perm) : vérifie une permission spécifique dans le JWT
function requirePermission(perm) {
  return (req, res, next) => {
    const result = extractToken(req, res);
    if (!result) return;
    req.user = result.user;
    req.token = result.token;
    const perms = req.user.role_permissions || {};
    if (perms[perm] !== true) {
      return res.status(403).json({ error: 'Permissions insuffisantes' });
    }
    next();
  };
}

// ─── makeToken ────────────────────────────────────────────────────────────────
function makeToken(user) {
  const roleLevel = user.roles?.level ?? (user.is_admin ? 2 : ROLE_PLAYER);
  const roleName  = user.roles?.name  ?? (user.is_admin ? 'admin' : 'player');
  const roleId    = user.role_id ?? null;
  const rolePerms = user.roles?.permissions ?? {};

  return jwt.sign({
    id: user.id,
    username: user.username,
    is_admin: roleLevel <= 2,          // rétrocompat
    role_id: roleId,
    role_name: roleName,
    role_level: roleLevel,
    role_permissions: rolePerms,
    must_change_password: user.must_change_password || false,
    favorite_country: user.favorite_country || null,
    avatar_url: user.avatar_url || null,
    avatar_original_url: user.avatar_original_url || null,
    avatar_url_external: user.avatar_url_external || null,
    avatar_type: user.avatar_type || 'letter',
    avatar_color: user.avatar_color || '#000000',
    avatar_text_color: user.avatar_text_color || '#FFFFFF',
    language: user.language || 'fr-fr',
  }, JWT_SECRET, { expiresIn: '7d' });
}

function safeUser(user) {
  const { password_hash, temp_password_hash, ...safe } = user;
  return safe;
}

// ─── Settings helpers ─────────────────────────────────────────────────────────
async function getSettings() {
  const { data } = await supabase.from('settings').select('*');
  const map = {};
  (data || []).forEach(s => { map[s.key] = s.value; });
  return {
    inactivity_enabled: map['inactivity_enabled'] !== 'false',
    inactivity_timeout: parseInt(map['inactivity_timeout'] || '30', 10),
    inactivity_warning: parseInt(map['inactivity_warning'] || '2', 10),
  };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
app.post('/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Champs requis' });
  if (password.length < 6) return res.status(400).json({ error: 'Mot de passe trop court (6 car. min)' });

  const { data: existing } = await supabase.from('users').select('id').eq('username', username.toLowerCase()).single();
  if (existing) return res.status(409).json({ error: "Nom d'utilisateur déjà pris" });

  const hash = await bcrypt.hash(password, 10);
  const { data, error } = await supabase.from('users').insert({ username: username.toLowerCase(), password_hash: hash }).select('*, roles(id, name, level, permissions)').single();
  if (error) return res.status(500).json({ error: 'Erreur serveur' });

  res.json({ token: makeToken(data), user: safeUser(data) });
});

app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const { data: user } = await supabase.from('users').select('*, roles(id, name, level, permissions)').eq('username', username.toLowerCase()).single();
  if (!user) return res.status(401).json({ error: 'Identifiants invalides' });

  if (user.temp_password_hash) {
    const tempValid = await bcrypt.compare(password, user.temp_password_hash);
    if (tempValid) {
      await supabase.from('users').update({ must_change_password: true }).eq('id', user.id);
      user.must_change_password = true;
      return res.json({ token: makeToken(user), user: safeUser(user) });
    }
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Identifiants invalides' });

  res.json({ token: makeToken(user), user: safeUser(user) });
});

app.get('/auth/me', authMiddleware, async (req, res) => {
  const { data, error } = await supabase.from('users')
    .select('*, roles(id, name, level, permissions)')
    .eq('id', req.user.id).single();
  if (error) return res.status(500).json({ error: error?.message || String(error) });
  res.json({ user: safeUser(data), token: makeToken(data) });
});

app.post('/auth/logout', authMiddleware, (req, res) => {
  tokenBlacklist.add(req.token);
  res.json({ success: true });
});

app.post('/auth/change-password', authMiddleware, async (req, res) => {
  const { new_password } = req.body;
  if (!new_password || new_password.length < 6) return res.status(400).json({ error: 'Mot de passe trop court (6 car. min)' });
  const hash = await bcrypt.hash(new_password, 10);
  const { data, error } = await supabase.from('users')
    .update({ password_hash: hash, must_change_password: false, temp_password_hash: null })
    .eq('id', req.user.id).select('*, roles(id, name, level, permissions)').single();
  if (error) return res.status(500).json({ error: error?.message || String(error) });
  res.json({ token: makeToken(data), user: safeUser(data) });
});

app.put('/auth/favorite-country', authMiddleware, async (req, res) => {
  const { country_id } = req.body;
  const { data, error } = await supabase.from('users')
    .update({ favorite_country: country_id || null })
    .eq('id', req.user.id).select('*, roles(id, name, level, permissions)').single();
  if (error) return res.status(500).json({ error: error?.message || String(error) });
  res.json({ token: makeToken(data), user: safeUser(data) });
});

app.put('/auth/avatar', authMiddleware, async (req, res) => {
  const { avatar_url, avatar_color, avatar_text_color, avatar_type, avatar_url_external } = req.body;
  const updates = {};
  if (avatar_url !== undefined)          updates.avatar_url = avatar_url || null;
  if (avatar_color !== undefined)        updates.avatar_color = avatar_color || '#000000';
  if (avatar_text_color !== undefined)   updates.avatar_text_color = avatar_text_color || '#FFFFFF';
  if (avatar_type !== undefined)         updates.avatar_type = avatar_type;
  if (avatar_url_external !== undefined) updates.avatar_url_external = avatar_url_external || null;
  const { data, error } = await supabase.from('users')
    .update(updates).eq('id', req.user.id).select('*, roles(id, name, level, permissions)').single();
  if (error) return res.status(500).json({ error: error?.message || String(error) });
  res.json({ token: makeToken(data), user: safeUser(data) });
});

app.post('/auth/avatar/upload', authMiddleware, async (req, res) => {
  const { base64, contentType, originalBase64, originalContentType } = req.body;
  if (!base64 || !contentType) return res.status(400).json({ error: 'base64 et contentType requis' });
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];
  if (!allowed.includes(contentType)) return res.status(400).json({ error: 'Format non supporté' });
  const buffer = Buffer.from(base64, 'base64');
  if (buffer.length > 10 * 1024 * 1024) return res.status(400).json({ error: 'Image trop grande (max 10MB)' });
  const cropPath = `${req.user.id}/avatar.png`;
  const { error: upErr } = await supabase.storage.from('avatars').upload(cropPath, buffer, { contentType, upsert: true });
  if (upErr) return res.status(500).json({ error: upErr.message });
  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(cropPath);
  const avatar_url = urlData.publicUrl + '?t=' + Date.now();
  const updates = { avatar_url, avatar_type: 'upload' };
  if (originalBase64 && originalContentType) {
    const origExt = originalContentType.split('/')[1].replace('jpeg', 'jpg');
    const origPath = `${req.user.id}/avatar_original.${origExt}`;
    const origBuffer = Buffer.from(originalBase64, 'base64');
    const { error: origErr } = await supabase.storage.from('avatars').upload(origPath, origBuffer, { contentType: originalContentType, upsert: true });
    if (!origErr) {
      const { data: origUrl } = supabase.storage.from('avatars').getPublicUrl(origPath);
      updates.avatar_original_url = origUrl.publicUrl;
    }
  }
  const { data, error } = await supabase.from('users')
    .update(updates).eq('id', req.user.id).select('*, roles(id, name, level, permissions)').single();
  if (error) return res.status(500).json({ error: error?.message || String(error) });
  res.json({ token: makeToken(data), user: safeUser(data), avatar_url });
});

app.put('/auth/language', authMiddleware, async (req, res) => {
  const { language } = req.body;
  const VALID_LANGS = ['fr-fr', 'fr-ca', 'en-us', 'en-gb', 'en-ca'];
  if (!language || !VALID_LANGS.includes(language)) return res.status(400).json({ error: 'Langue invalide' });
  const { data, error } = await supabase.from('users')
    .update({ language }).eq('id', req.user.id).select('*, roles(id, name, level, permissions)').single();
  if (error) return res.status(500).json({ error: error?.message || String(error) });
  res.json({ token: makeToken(data), user: safeUser(data) });
});

app.post('/auth/avatar/fetch-image', authMiddleware, async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL requise' });
  try {
    const response = await fetch(url);
    if (!response.ok) return res.status(400).json({ error: 'Image inaccessible' });
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    res.json({ base64, contentType, dataUrl: `data:${contentType};base64,${base64}` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Picks ────────────────────────────────────────────────────────────────────
const LOCK_DATE = new Date(process.env.LOCK_DATE || '2028-07-18T00:00:00Z');
const isLocked = () => new Date() >= LOCK_DATE;

app.get('/picks', authMiddleware, async (req, res) => {
  const { data, error } = await supabase.from('picks').select('*').eq('user_id', req.user.id);
  if (error) return res.status(500).json({ error: error?.message || String(error) });
  res.json(data);
});

app.post('/picks', authMiddleware, async (req, res) => {
  if (isLocked()) return res.status(403).json({ error: 'Les pronostics sont verrouillés' });
  const { discipline_id, country_id } = req.body;
  if (!discipline_id || !country_id) return res.status(400).json({ error: 'discipline_id et country_id requis' });
  const { data, error } = await supabase.from('picks')
    .upsert({ user_id: req.user.id, discipline_id, country_id }, { onConflict: 'user_id,discipline_id' })
    .select().single();
  if (error) return res.status(500).json({ error: error?.message || String(error) });
  res.json(data);
});

app.delete('/picks/:discipline_id', authMiddleware, async (req, res) => {
  if (isLocked()) return res.status(403).json({ error: 'Les pronostics sont verrouillés' });
  const { error } = await supabase.from('picks').delete().eq('user_id', req.user.id).eq('discipline_id', req.params.discipline_id);
  if (error) return res.status(500).json({ error: error?.message || String(error) });
  res.json({ success: true });
});

// ─── Leaderboard ──────────────────────────────────────────────────────────────
function computePoints(pick_country, result) {
  if (!result || !pick_country) return 0;
  let pts = 0;
  if (pick_country === result.gold_country_id)   pts += 5;
  if (pick_country === result.silver_country_id) pts += 3;
  if (pick_country === result.bronze_country_id) pts += 1;
  return pts;
}

app.get('/leaderboard', async (req, res) => {
  const [{ data: picks, error: pe }, { data: results, error: re }, { data: users, error: ue }] = await Promise.all([
    supabase.from('picks').select('user_id, discipline_id, country_id, users(username)').order('user_id'),
    supabase.from('results').select('*'),
    supabase.from('users').select('id, username'),
  ]);
  if (pe || re || ue) return res.status(500).json({ error: pe || re || ue });
  const resultMap = {};
  results.forEach(r => { resultMap[r.discipline_id] = r; });
  const scoredPicks = picks.map(p => ({ ...p, points: computePoints(p.country_id, resultMap[p.discipline_id]) }));
  const usersWithPicks = new Set(picks.map(p => p.user_id));
  const zeroPicks = users
    .filter(u => !usersWithPicks.has(u.id))
    .map(u => ({ user_id: u.id, users: { username: u.username }, discipline_id: '__none__', country_id: null, points: 0 }));
  res.json([...scoredPicks, ...zeroPicks]);
});

// ─── Results ──────────────────────────────────────────────────────────────────
app.get('/results', async (req, res) => {
  const { data, error } = await supabase.from('results').select('*');
  if (error) return res.status(500).json({ error: error?.message || String(error) });
  res.json(data);
});

app.post('/results', requireLevel(2), async (req, res) => {
  const { discipline_id, gold_country_id, silver_country_id, bronze_country_id } = req.body;
  if (!discipline_id) return res.status(400).json({ error: 'discipline_id requis' });
  const { data, error } = await supabase.from('results')
    .upsert({ discipline_id, gold_country_id: gold_country_id || null, silver_country_id: silver_country_id || null, bronze_country_id: bronze_country_id || null }, { onConflict: 'discipline_id' })
    .select().single();
  if (error) return res.status(500).json({ error: error?.message || String(error) });
  res.json(data);
});

app.delete('/results/:discipline_id', requireLevel(2), async (req, res) => {
  const { error } = await supabase.from('results').delete().eq('discipline_id', req.params.discipline_id);
  if (error) return res.status(500).json({ error: error?.message || String(error) });
  res.json({ success: true });
});

app.post('/admin/fetch-results', requireLevel(2), async (req, res) => {
  try {
    const response = await fetch('https://apis.codante.io/olympic-games/events?page=1');
    const json = await response.json();
    const events = json.data || [];
    let imported = 0;
    for (const event of events) {
      if (!event.discipline_id) continue;
      const medals = { gold: null, silver: null, bronze: null };
      (event.competitors || []).forEach(c => {
        if (c.result_position === 1) medals.gold = c.country_id;
        else if (c.result_position === 2) medals.silver = c.country_id;
        else if (c.result_position === 3) medals.bronze = c.country_id;
      });
      if (!medals.gold) continue;
      await supabase.from('results').upsert(
        { discipline_id: event.discipline_id, gold_country_id: medals.gold, silver_country_id: medals.silver, bronze_country_id: medals.bronze },
        { onConflict: 'discipline_id' }
      );
      imported++;
    }
    res.json({ success: true, imported });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Admin — Rôles ────────────────────────────────────────────────────────────
app.get('/admin/roles', requireLevel(2), async (req, res) => {
  const roles = await getRoles();
  res.json(roles);
});

// ─── Admin — Users ────────────────────────────────────────────────────────────
app.get('/admin/users', requireLevel(3), async (req, res) => {
  const { data, error } = await supabase.from('users')
    .select('id, username, role_id, must_change_password, created_at, roles(id, name, level)')
    .order('created_at');
  if (error) return res.status(500).json({ error: error?.message || String(error) });
  res.json(data);
});

app.get('/admin/picks', requireLevel(2), async (req, res) => {
  const { data, error } = await supabase.from('picks').select('*, users(username)').order('discipline_id');
  if (error) return res.status(500).json({ error: error?.message || String(error) });
  res.json(data);
});

// Changer le rôle d'un utilisateur
app.put('/admin/users/:id/role', requireLevel(2), async (req, res) => {
  const { role_id } = req.body;
  const myLevel = req.user.role_level ?? ROLE_PLAYER;

  // Un superadmin ne peut pas modifier son propre rôle
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'Vous ne pouvez pas modifier votre propre rôle' });
  }

  // Vérifier que la cible n'a pas un niveau supérieur ou égal au demandeur
  const targetUser = await getUserWithRole(req.params.id);
  if (targetUser && userLevel(targetUser) <= myLevel) {
    return res.status(403).json({ error: 'Vous ne pouvez pas modifier le rôle de cet utilisateur' });
  }

  // role_id null = retour au statut joueur (pas de rôle)
  if (!role_id) {
    const { data, error } = await supabase.from('users')
      .update({ role_id: null }).eq('id', req.params.id)
      .select('*, roles(id, name, level, permissions)').single();
    if (error) return res.status(500).json({ error: error?.message || String(error) });
    return res.json(data);
  }

  // Récupérer le rôle cible
  const targetRole = await getRoleById(role_id);
  if (!targetRole) return res.status(400).json({ error: 'Rôle invalide' });

  // On ne peut pas attribuer un rôle de niveau >= au sien (ex: admin ne peut pas nommer superadmin)
  if (targetRole.level <= myLevel) {
    return res.status(403).json({ error: 'Vous ne pouvez pas attribuer un rôle supérieur ou égal au vôtre' });
  }

  const { data, error } = await supabase.from('users')
    .update({ role_id }).eq('id', req.params.id)
    .select('*, roles(id, name, level, permissions)').single();
  if (error) return res.status(500).json({ error: error?.message || String(error) });
  res.json(data);
});

app.delete('/admin/users/:id', requireLevel(2), async (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'Tu ne peux pas te supprimer toi-même' });
  const myLevel = req.user.role_level ?? ROLE_PLAYER;
  const targetUser = await getUserWithRole(req.params.id);
  if (targetUser && userLevel(targetUser) <= myLevel) {
    return res.status(403).json({ error: 'Vous ne pouvez pas supprimer cet utilisateur' });
  }
  const { error } = await supabase.from('users').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error?.message || String(error) });
  res.json({ success: true });
});

app.post('/admin/users/:id/temp-password', requireLevel(2), async (req, res) => {
  const { temp_password } = req.body;
  if (!temp_password || temp_password.length < 4) return res.status(400).json({ error: 'Mot de passe trop court' });
  const hash = await bcrypt.hash(temp_password, 10);
  const { error } = await supabase.from('users').update({ temp_password_hash: hash, must_change_password: true }).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error?.message || String(error) });
  res.json({ success: true, temp_password });
});

// ─── Admin — Settings (superadmin seulement) ─────────────────────────────────
app.get('/admin/settings', requireLevel(1), async (req, res) => {
  try { res.json(await getSettings()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/admin/settings', requireLevel(1), async (req, res) => {
  const { inactivity_enabled, inactivity_timeout, inactivity_warning } = req.body;
  const updates = [];
  if (inactivity_enabled !== undefined) updates.push({ key: 'inactivity_enabled', value: String(inactivity_enabled) });
  if (inactivity_timeout !== undefined) updates.push({ key: 'inactivity_timeout', value: String(inactivity_timeout) });
  if (inactivity_warning !== undefined) updates.push({ key: 'inactivity_warning', value: String(inactivity_warning) });
  for (const u of updates) await supabase.from('settings').upsert(u, { onConflict: 'key' });
  res.json(await getSettings());
});

app.get('/settings', async (req, res) => {
  try { res.json(await getSettings()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Groupes ──────────────────────────────────────────────────────────────────
app.get('/groups', authMiddleware, async (req, res) => {
  const { data, error } = await supabase.from('groups').select('*, group_members(user_id, users(username))').order('name');
  if (error) return res.status(500).json({ error: error?.message || String(error) });
  const level = req.user.role_level ?? ROLE_PLAYER;
  if (level <= 2) return res.json(data);
  // Capitaine : groupes créés par lui OU dont il est membre
  const userGroups = data.filter(g =>
    g.created_by === req.user.id ||
    (g.group_members || []).some(m => m.user_id === req.user.id)
  );
  res.json(userGroups);
});

app.post('/groups', requireLevel(3), async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Nom requis' });
  const { data, error } = await supabase.from('groups').insert({ name, created_by: req.user.id }).select().single();
  if (error) return res.status(500).json({ error: error?.message || String(error) });
  // Sync table channels
  await supabase.from('channels').upsert({ id: `group_${data.id}`, name, type: 'group' }, { onConflict: 'id' });
  res.json(data);
});

app.delete('/groups/:id', requireLevel(3), async (req, res) => {
  const level = req.user.role_level ?? ROLE_PLAYER;
  if (level >= 3) {
    // Capitaine : vérifier qu'il est propriétaire du groupe
    const { data: grp } = await supabase.from('groups').select('created_by, group_members(user_id)').eq('id', req.params.id).single();
    const isMember = (grp?.group_members || []).some(m => m.user_id === req.user.id);
    if (!grp || (grp.created_by !== req.user.id && !isMember)) return res.status(403).json({ error: 'Vous ne pouvez supprimer que vos propres groupes' });
  }
  // Supprimer le channel — messages supprimés en cascade via FK channels → messages
  await supabase.from('channels').delete().eq('id', `group_${req.params.id}`);
  const { error } = await supabase.from('groups').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error?.message || String(error) });
  res.json({ success: true });
});

app.post('/groups/:id/members', requireLevel(3), async (req, res) => {
  const level = req.user.role_level ?? ROLE_PLAYER;
  if (level >= 3) {
    const { data: grp } = await supabase.from('groups').select('created_by, group_members(user_id)').eq('id', req.params.id).single();
    const isMember = (grp?.group_members || []).some(m => m.user_id === req.user.id);
    if (!grp || (grp.created_by !== req.user.id && !isMember)) return res.status(403).json({ error: 'Vous ne pouvez gérer que vos propres groupes' });
  }
  const { user_id } = req.body;
  const { error } = await supabase.from('group_members').upsert({ group_id: req.params.id, user_id }, { onConflict: 'group_id,user_id' });
  if (error) return res.status(500).json({ error: error?.message || String(error) });
  res.json({ success: true });
});

app.delete('/groups/:id/members/:user_id', requireLevel(3), async (req, res) => {
  const level = req.user.role_level ?? ROLE_PLAYER;
  if (level >= 3) {
    const { data: grp } = await supabase.from('groups').select('created_by, group_members(user_id)').eq('id', req.params.id).single();
    const isMember = (grp?.group_members || []).some(m => m.user_id === req.user.id);
    if (!grp || (grp.created_by !== req.user.id && !isMember)) return res.status(403).json({ error: 'Vous ne pouvez gérer que vos propres groupes' });
  }
  const { error } = await supabase.from('group_members').delete().eq('group_id', req.params.id).eq('user_id', req.params.user_id);
  if (error) return res.status(500).json({ error: error?.message || String(error) });
  res.json({ success: true });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🏅 API démarrée sur http://localhost:${PORT}`));

// ─── Chat ─────────────────────────────────────────────────────────────────────

// GET /chat/:room_id/members — membres du salon (accessible à tous les utilisateurs connectés)
app.get('/chat/:room_id/members', authMiddleware, async (req, res) => {
  const room_id = req.params.room_id;
  let userIds = [];

  if (room_id === 'general') {
    // Général — tous les utilisateurs
    const { data } = await supabase.from('users')
      .select('id, username, avatar_url, avatar_type, avatar_color, avatar_text_color');
    return res.json(data || []);
  }

  if (room_id.startsWith('group_')) {
    const groupId = room_id.replace('group_', '');
    const { data: members } = await supabase.from('group_members')
      .select('user_id, users(id, username, avatar_url, avatar_type, avatar_color, avatar_text_color)')
      .eq('group_id', groupId);
    const users = (members || []).map(m => m.users).filter(Boolean);
    return res.json(users);
  }

  res.json([]);
});

// GET /chat/rooms — salons accessibles par l'utilisateur
app.get('/chat/rooms', authMiddleware, async (req, res) => {
  const level = req.user.role_level ?? ROLE_PLAYER;
  const rooms = [{ id: 'general', name: 'Général', type: 'general' }];

  // Groupes accessibles
  const { data: groups } = await supabase.from('groups')
    .select('id, name, group_members(user_id)')
    .order('name');

  (groups || []).forEach(g => {
    const isMember = (g.group_members || []).some(m => m.user_id === req.user.id);
    const isAdmin  = level <= 2;
    if (isAdmin || isMember) {
      rooms.push({ id: `group_${g.id}`, name: g.name, type: 'group' });
    }
  });

  res.json(rooms);
});

// POST /chat/:room_id/messages — envoyer un message
app.post('/chat/:room_id/messages', authMiddleware, checkMuted, async (req, res) => {
  const { content, is_admin_msg, is_gif, reply_to_id, reply_to_content, reply_to_username } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Message vide' });
  if (content.length > 1000) return res.status(400).json({ error: 'Message trop long (max 1000 car.)' });

  const room_id = req.params.room_id;

  // Vérifier accès au salon
  if (room_id !== 'general') {
    const level = req.user.role_level ?? ROLE_PLAYER;
    if (room_id.startsWith('group_') && level > 2) {
      const groupId = room_id.replace('group_', '');
      const { data: membership } = await supabase.from('group_members')
        .select('user_id').eq('group_id', groupId).eq('user_id', req.user.id).single();
      // Vérifier aussi si créateur
      const { data: grp } = await supabase.from('groups')
        .select('created_by').eq('id', groupId).single();
      if (!membership && grp?.created_by !== req.user.id) {
        return res.status(403).json({ error: 'Accès refusé à ce salon' });
      }
    }
  }

  // Récupérer avatar + role depuis la DB (fraîcheur garantie)
  const { data: profile } = await supabase.from('users')
    .select('avatar_url, avatar_type, avatar_color, avatar_text_color, role_id, roles(level)')
    .eq('id', req.user.id).single();

  const { data, error } = await supabase.from('messages').insert({
    room_id,
    user_id:            req.user.id,
    username:           req.user.username,
    content:            content.trim(),
    role_level:         profile?.roles?.level ?? req.user.role_level ?? 99,
    is_admin_msg:       !!(is_admin_msg && (profile?.roles?.level ?? 99) <= 2),
    is_gif:             !!is_gif,
    avatar_url:         profile?.avatar_url || null,
    avatar_type:        profile?.avatar_type || 'letter',
    avatar_color:       profile?.avatar_color || '#000000',
    avatar_text_color:  profile?.avatar_text_color || '#FFFFFF',
    reply_to_id:        reply_to_id || null,
    reply_to_content:   reply_to_content || null,
    reply_to_username:  reply_to_username || null,
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});




// GET /chat/:room_id/reports — signalements du salon (admin seulement)
app.get('/chat/:room_id/reports', requireLevel(2), async (req, res) => {
  const { data, error } = await supabase
    .from('reports')
    .select('id, message_id, reason, created_at, reported_by, users!reported_by(username)')
    .eq('resolved', false)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  // Filtrer par room_id en récupérant les messages
  const msgIds = [...new Set((data || []).map(r => r.message_id))];
  if (!msgIds.length) return res.json({ data: [] });
  const { data: msgs } = await supabase.from('messages').select('id, room_id').in('id', msgIds);
  const roomMsgIds = new Set((msgs || []).filter(m => m.room_id === req.params.room_id).map(m => m.id));
  const filtered = (data || []).filter(r => roomMsgIds.has(r.message_id));
  res.json({ data: filtered });
});

// POST /chat/messages/:id/resolve — approuver (effacer signalement)
app.post('/chat/messages/:id/resolve', requireLevel(2), async (req, res) => {
  const { error } = await supabase.from('reports').update({ resolved: true }).eq('message_id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Cache en mémoire pour les previews de liens
const linkPreviewCache = new Map();


// POST /chat/:room_id/upload — upload image vers Cloudinary
app.post('/chat/:room_id/upload', authMiddleware, checkMuted, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' });
  try {
    // Upload vers Cloudinary via stream
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'chat-images', resource_type: 'image', transformation: [{ quality: 'auto', fetch_format: 'auto' }] },
        (error, result) => error ? reject(error) : resolve(result)
      );
      stream.end(req.file.buffer);
    });

    // Récupérer le profil pour les champs avatar
    const { data: profile } = await supabase.from('users')
      .select('avatar_url, avatar_type, avatar_color, avatar_text_color, role_id, roles(level)')
      .eq('id', req.user.id).single();

    // Créer le message avec l'URL Cloudinary
    const { data, error } = await supabase.from('messages').insert({
      room_id:           req.params.room_id,
      user_id:           req.user.id,
      username:          req.user.username,
      content:           result.secure_url,
      is_image:          true,
      role_level:        profile?.roles?.level ?? req.user.role_level ?? 99,
      avatar_url:        profile?.avatar_url || null,
      avatar_type:       profile?.avatar_type || 'letter',
      avatar_color:      profile?.avatar_color || '#000000',
      avatar_text_color: profile?.avatar_text_color || '#FFFFFF',
    }).select().single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ─── Room Reads ────────────────────────────────────────────────────────────────

// GET /chat/room-reads — récupérer les last_read de l'utilisateur
app.get('/chat/room-reads', authMiddleware, async (req, res) => {
  const { data, error } = await supabase.from('room_reads')
    .select('room_id, last_read')
    .eq('user_id', req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// POST /chat/room-reads/:room_id — mettre à jour le last_read
app.post('/chat/room-reads/:room_id', authMiddleware, async (req, res) => {
  const { error } = await supabase.from('room_reads').upsert({
    user_id:   req.user.id,
    room_id:   req.params.room_id,
    last_read: new Date().toISOString(),
  }, { onConflict: 'user_id,room_id' });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ─── Mutes ─────────────────────────────────────────────────────────────────────

// GET /chat/mutes — liste des mutes actifs (admin)
app.get('/chat/mutes', requireLevel(2), async (req, res) => {
  const { data, error } = await supabase.from('mutes')
    .select('*, users!user_id(username), muter:users!muted_by(username)')
    .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// POST /chat/mutes — muter un utilisateur
app.post('/chat/mutes', requireLevel(2), async (req, res) => {
  const { user_id, reason, expires_at } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id requis' });

  // Vérifier hiérarchie — on ne peut muter que des niveaux inférieurs
  const { data: target } = await supabase.from('users')
    .select('roles(level)').eq('id', user_id).single();
  const targetLevel = target?.roles?.level ?? 99;
  const adminLevel  = req.user.role_level ?? 99;
  if (adminLevel >= targetLevel) return res.status(403).json({ error: 'Vous ne pouvez pas muter un utilisateur de niveau supérieur ou égal' });

  const { data: inserted, error } = await supabase.from('mutes').insert({
    user_id, muted_by: req.user.id, reason, expires_at: expires_at || null,
  }).select('id').single();
  if (error) return res.status(500).json({ error: error.message });
  // Recharger avec le join users pour que le frontend ait le username
  const { data } = await supabase.from('mutes')
    .select('*, users!user_id(username), muter:users!muted_by(username)')
    .eq('id', inserted.id).single();
  res.json(data);
});

// DELETE /chat/mutes/:id — retirer un mute
app.delete('/chat/mutes/:id', requireLevel(2), async (req, res) => {
  const { error } = await supabase.from('mutes').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Middleware — vérifier si l'utilisateur est muté (utilisé dans sendMessage)
async function checkMuted(req, res, next) {
  const now = new Date().toISOString();
  // Nettoyer les mutes expirés au passage
  await supabase.from('mutes')
    .delete()
    .eq('user_id', req.user.id)
    .not('expires_at', 'is', null)
    .lt('expires_at', now);
  // Vérifier s'il reste un mute actif
  const { data } = await supabase.from('mutes')
    .select('id, expires_at, reason')
    .eq('user_id', req.user.id)
    .or('expires_at.is.null,expires_at.gt.' + now)
    .limit(1).maybeSingle();
  if (data) return res.status(403).json({ error: `Vous êtes muté${data.reason ? ` : ${data.reason}` : ''}`, muted: true });
  next();
}
// GET /chat/link-preview?url=... — aperçu Open Graph d'un lien
app.get('/chat/link-preview', authMiddleware, async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'URL requise' });

  // Retourner depuis le cache si disponible
  if (linkPreviewCache.has(url)) return res.json(linkPreviewCache.get(url));

  try {
    const { result } = await ogs({ url, timeout: 5000, fetchOptions: { headers: { 'user-agent': 'Mozilla/5.0' } } });
    const preview = {
      title: result.ogTitle || result.twitterTitle || null,
      description: result.ogDescription || result.twitterDescription || null,
      image: result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url || null,
      siteName: result.ogSiteName || null,
      url,
    };
    linkPreviewCache.set(url, preview);
    // Limiter le cache à 200 entrées
    if (linkPreviewCache.size > 200) linkPreviewCache.delete(linkPreviewCache.keys().next().value);
    res.json(preview);
  } catch {
    const empty = { title: null, description: null, image: null, siteName: null, url };
    linkPreviewCache.set(url, empty);
    res.json(empty);
  }
});
// POST /chat/messages/:id/report — signaler un message
app.post('/chat/messages/:id/report', authMiddleware, async (req, res) => {
  const { reason } = req.body;
  const { data: msg } = await supabase.from('messages').select('id, content, user_id, room_id').eq('id', req.params.id).single();
  if (!msg) return res.status(404).json({ error: 'Message introuvable' });
  const { error } = await supabase.from('reports').insert({
    message_id: req.params.id,
    reported_by: req.user.id,
    reason: reason || null,
  });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// POST /chat/messages/:id/pin — épingler/désépingler (admin seulement)
app.post('/chat/messages/:id/pin', requireLevel(2), async (req, res) => {
  const { pinned } = req.body;
  const { error } = await supabase.from('messages').update({ is_pinned: !!pinned }).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// GET /chat/:room_id/pinned — message épinglé du salon
app.get('/chat/:room_id/pinned', authMiddleware, async (req, res) => {
  const { data, error } = await supabase.from('messages')
    .select('id, content, user_id, is_gif, users(username)')
    .eq('room_id', req.params.room_id)
    .eq('is_pinned', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (error) return res.json({ data: null });
  res.json({ data });
});
// PATCH /chat/messages/:id — éditer un message
app.patch('/chat/messages/:id', authMiddleware, async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Contenu requis' });
  const { data: msg } = await supabase.from('messages').select('user_id').eq('id', req.params.id).single();
  if (!msg) return res.status(404).json({ error: 'Message introuvable' });
  if (msg.user_id !== req.user.id) return res.status(403).json({ error: 'Non autorisé' });
  const { error } = await supabase.from('messages')
    .update({ content: content.trim(), edited_at: new Date().toISOString() })
    .eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});
// DELETE /chat/messages/:id — soft delete (admin seulement)
app.delete('/chat/messages/:id', requireLevel(2), async (req, res) => {
  const { error } = await supabase.from('messages')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ─── Réactions ────────────────────────────────────────────────────────────────
// POST /chat/messages/:id/reactions — toggle une réaction
app.post('/chat/messages/:id/reactions', authMiddleware, async (req, res) => {
  const { emoji } = req.body;
  if (!emoji) return res.status(400).json({ error: 'Emoji requis' });
  if (['🖕','🖕🏻','🖕🏼','🖕🏽','🖕🏾','🖕🏿'].includes(emoji)) return res.status(400).json({ error: 'Emoji non autorisé' });

  const message_id = req.params.id;
  const user_id = req.user.id;

  // Vérifier si la réaction existe déjà
  const { data: existing } = await supabase.from('reactions')
    .select('id').eq('message_id', message_id).eq('user_id', user_id).eq('emoji', emoji).single();

  if (existing) {
    // Supprimer (toggle off)
    await supabase.from('reactions').delete().eq('id', existing.id);
    return res.json({ action: 'removed' });
  } else {
    // Ajouter (toggle on)
    await supabase.from('reactions').insert({ message_id, user_id, emoji });
    return res.json({ action: 'added' });
  }
});

// GET /chat/messages/reactions?room_id=xxx — toutes les réactions d'un salon
app.get('/chat/messages/reactions', authMiddleware, async (req, res) => {
  const { room_id } = req.query;
  if (!room_id) return res.status(400).json({ error: 'room_id requis' });

  // D'abord récupérer les IDs des messages du salon
  const { data: msgs } = await supabase.from('messages')
    .select('id').eq('room_id', room_id).is('deleted_at', null);

  if (!msgs || msgs.length === 0) return res.json([]);

  const msgIds = msgs.map(m => m.id);
  const { data, error } = await supabase.from('reactions')
    .select('id, message_id, user_id, emoji')
    .in('message_id', msgIds);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// ═══════════════════════════════════════════════════════════════════════════════
// ─── ESPACE FAMILLE v7.1 — requireLevel(1) sur toutes les routes ─────────────
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Membres ──────────────────────────────────────────────────────────────────

// GET /family/members
app.get('/family/members', requireLevel(1), async (req, res) => {
  const { data, error } = await supabase
    .from('family_members')
    .select('*')
    .eq('owner_id', req.user.id)
    .order('sort_order', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// POST /family/members
app.post('/family/members', requireLevel(1), async (req, res) => {
  const { name, color, emoji, avatar_url, is_child, birthdate, sort_order } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Nom requis' });
  const { data, error } = await supabase.from('family_members').insert({
    owner_id: req.user.id,
    name: name.trim(), color: color || '#FF6B6B',
    emoji: emoji || null, avatar_url: avatar_url || null,
    is_child: !!is_child, birthdate: birthdate || null,
    sort_order: sort_order ?? 0,
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PUT /family/members/:id
app.put('/family/members/:id', requireLevel(1), async (req, res) => {
  const { name, color, emoji, avatar_url, is_child, birthdate, sort_order, is_active, user_id } = req.body;
  const { data, error } = await supabase.from('family_members')
    .update({
      ...(name       !== undefined && { name: name.trim() }),
      ...(color      !== undefined && { color }),
      ...(emoji      !== undefined && { emoji }),
      ...(avatar_url !== undefined && { avatar_url }),
      ...(is_child   !== undefined && { is_child }),
      ...(birthdate  !== undefined && { birthdate }),
      ...(sort_order !== undefined && { sort_order }),
      ...(is_active  !== undefined && { is_active }),
      ...(user_id    !== undefined && { user_id: user_id || null }),
    })
    .eq('id', req.params.id)
    .eq('owner_id', req.user.id)
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /family/members/:id
app.delete('/family/members/:id', requireLevel(1), async (req, res) => {
  const { error } = await supabase.from('family_members')
    .delete()
    .eq('id', req.params.id)
    .eq('owner_id', req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});


// POST /family/members/:id/link-me — lier son propre compte à un membre
app.post('/family/members/:id/link-me', requireLevel(1), async (req, res) => {
  // Vérifier qu'aucun autre membre n'est déjà lié à ce user
  const { data: existing } = await supabase.from('family_members')
    .select('id, name')
    .eq('owner_id', req.user.id)
    .eq('user_id', req.user.id)
    .maybeSingle();
  if (existing && existing.id !== req.params.id) {
    return res.status(400).json({ error: `Votre compte est déjà lié à "${existing.name}"` });
  }
  const { data, error } = await supabase.from('family_members')
    .update({ user_id: req.user.id })
    .eq('id', req.params.id)
    .eq('owner_id', req.user.id)
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /family/members/:id/link-me — délier son compte
app.delete('/family/members/:id/link-me', requireLevel(1), async (req, res) => {
  const { data, error } = await supabase.from('family_members')
    .update({ user_id: null })
    .eq('id', req.params.id)
    .eq('owner_id', req.user.id)
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ─── Listes d'épicerie ────────────────────────────────────────────────────────

// GET /family/grocery/lists
app.get('/family/grocery/lists', requireLevel(1), async (req, res) => {
  const { archived } = req.query;
  let query = supabase.from('grocery_lists')
    .select('*, grocery_items(id, checked)')
    .eq('owner_id', req.user.id)
    .order('sort_order', { ascending: true });
  if (archived === 'true') query = query.not('archived_at', 'is', null);
  else                     query = query.is('archived_at', null);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// POST /family/grocery/lists
app.post('/family/grocery/lists', requireLevel(1), async (req, res) => {
  const { title, color, sort_order } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Titre requis' });
  const { data, error } = await supabase.from('grocery_lists').insert({
    owner_id: req.user.id,
    title: title.trim(), color: color || '#4A90D9',
    sort_order: sort_order ?? 0,
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PUT /family/grocery/lists/:id
app.put('/family/grocery/lists/:id', requireLevel(1), async (req, res) => {
  const { title, color, sort_order, archived } = req.body;
  const { data, error } = await supabase.from('grocery_lists')
    .update({
      ...(title      !== undefined && { title: title.trim() }),
      ...(color      !== undefined && { color }),
      ...(sort_order !== undefined && { sort_order }),
      ...(archived   !== undefined && { archived_at: archived ? new Date().toISOString() : null }),
    })
    .eq('id', req.params.id)
    .eq('owner_id', req.user.id)
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /family/grocery/lists/:id
app.delete('/family/grocery/lists/:id', requireLevel(1), async (req, res) => {
  const { error } = await supabase.from('grocery_lists')
    .delete()
    .eq('id', req.params.id)
    .eq('owner_id', req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ─── Items d'épicerie ─────────────────────────────────────────────────────────

// GET /family/grocery/lists/:id/items
app.get('/family/grocery/lists/:id/items', requireLevel(1), async (req, res) => {
  // Vérifier ownership de la liste
  const { data: list } = await supabase.from('grocery_lists')
    .select('id').eq('id', req.params.id).eq('owner_id', req.user.id).single();
  if (!list) return res.status(403).json({ error: 'Accès refusé' });

  const { data, error } = await supabase.from('grocery_items')
    .select('*')
    .eq('list_id', req.params.id)
    .order('position', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// POST /family/grocery/lists/:id/items
app.post('/family/grocery/lists/:id/items', requireLevel(1), async (req, res) => {
  const { data: list } = await supabase.from('grocery_lists')
    .select('id').eq('id', req.params.id).eq('owner_id', req.user.id).single();
  if (!list) return res.status(403).json({ error: 'Accès refusé' });

  const { content, quantity, unit, category, member_id, position } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Contenu requis' });

  // Position par défaut = fin de liste
  let pos = position;
  if (pos === undefined) {
    const { count } = await supabase.from('grocery_items')
      .select('id', { count: 'exact', head: true }).eq('list_id', req.params.id);
    pos = count || 0;
  }

  const { data, error } = await supabase.from('grocery_items').insert({
    list_id: req.params.id,
    content: content.trim(),
    quantity: quantity || null, unit: unit || null,
    category: category || null, member_id: member_id || null,
    position: pos,
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PUT /family/grocery/items/:id
app.put('/family/grocery/items/:id', requireLevel(1), async (req, res) => {
  const { content, quantity, unit, category, member_id, position } = req.body;
  const { data, error } = await supabase.from('grocery_items')
    .update({
      ...(content   !== undefined && { content: content.trim() }),
      ...(quantity  !== undefined && { quantity }),
      ...(unit      !== undefined && { unit }),
      ...(category  !== undefined && { category }),
      ...(member_id !== undefined && { member_id }),
      ...(position  !== undefined && { position }),
    })
    .eq('id', req.params.id)
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /family/grocery/items/:id/check — toggle checked
app.post('/family/grocery/items/:id/check', requireLevel(1), async (req, res) => {
  const { data: item } = await supabase.from('grocery_items')
    .select('checked').eq('id', req.params.id).single();
  if (!item) return res.status(404).json({ error: 'Item introuvable' });

  const checked = !item.checked;
  const { data, error } = await supabase.from('grocery_items')
    .update({ checked, checked_at: checked ? new Date().toISOString() : null })
    .eq('id', req.params.id)
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /family/grocery/items/:id
app.delete('/family/grocery/items/:id', requireLevel(1), async (req, res) => {
  const { error } = await supabase.from('grocery_items').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ─── Notes ────────────────────────────────────────────────────────────────────

// GET /family/notes
app.get('/family/notes', requireLevel(1), async (req, res) => {
  const { archived } = req.query;
  let query = supabase.from('family_notes')
    .select('*, family_members(id, name, color, emoji)')
    .eq('owner_id', req.user.id)
    .order('pinned', { ascending: false })
    .order('updated_at', { ascending: false });
  if (archived === 'true') query = query.not('archived_at', 'is', null);
  else                     query = query.is('archived_at', null);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// POST /family/notes
app.post('/family/notes', requireLevel(1), async (req, res) => {
  const { title, content, member_id, color, tags } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Titre requis' });
  const { data, error } = await supabase.from('family_notes').insert({
    owner_id: req.user.id,
    title: title.trim(), content: content || null,
    member_id: member_id || null, color: color || null,
    tags: tags || [],
  }).select('*, family_members(id, name, color, emoji)').single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PUT /family/notes/:id
app.put('/family/notes/:id', requireLevel(1), async (req, res) => {
  const { title, content, member_id, color, tags, pinned, archived } = req.body;
  const { data, error } = await supabase.from('family_notes')
    .update({
      ...(title     !== undefined && { title: title.trim() }),
      ...(content   !== undefined && { content }),
      ...(member_id !== undefined && { member_id }),
      ...(color     !== undefined && { color }),
      ...(tags      !== undefined && { tags }),
      ...(pinned    !== undefined && { pinned }),
      ...(archived  !== undefined && { archived_at: archived ? new Date().toISOString() : null }),
    })
    .eq('id', req.params.id)
    .eq('owner_id', req.user.id)
    .select('*, family_members(id, name, color, emoji)').single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /family/notes/:id
app.delete('/family/notes/:id', requireLevel(1), async (req, res) => {
  const { error } = await supabase.from('family_notes')
    .delete().eq('id', req.params.id).eq('owner_id', req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ─── Agenda ───────────────────────────────────────────────────────────────────

// GET /family/events?month=2025-07
app.get('/family/events', requireLevel(1), async (req, res) => {
  const { month } = req.query; // format YYYY-MM
  let query = supabase.from('family_events')
    .select('*, family_event_members(member_id, family_members(id, name, color, emoji))')
    .eq('owner_id', req.user.id)
    .order('date', { ascending: true })
    .order('time_start', { ascending: true, nullsFirst: true });
  if (month) {
    const start = `${month}-01`;
    const end   = new Date(new Date(start).getFullYear(), new Date(start).getMonth() + 1, 0)
                    .toISOString().split('T')[0];
    query = query.gte('date', start).lte('date', end);
  }
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// POST /family/events
app.post('/family/events', requireLevel(1), async (req, res) => {
  const { title, date, time_start, time_end, all_day, location, color,
          recurrence, recurrence_end, reminder_min, notes, member_ids } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Titre requis' });
  if (!date)          return res.status(400).json({ error: 'Date requise' });

  const { data: event, error } = await supabase.from('family_events').insert({
    owner_id: req.user.id,
    title: title.trim(), date,
    time_start: time_start || null, time_end: time_end || null,
    all_day: !!all_day, location: location || null, color: color || null,
    recurrence: recurrence || 'once', recurrence_end: recurrence_end || null,
    reminder_min: reminder_min || null, notes: notes || null,
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });

  // Associer les membres
  if (member_ids?.length) {
    await supabase.from('family_event_members').insert(
      member_ids.map(mid => ({ event_id: event.id, member_id: mid }))
    );
  }

  // Retourner l'événement avec membres
  const { data: full } = await supabase.from('family_events')
    .select('*, family_event_members(member_id, family_members(id, name, color, emoji))')
    .eq('id', event.id).single();
  res.json(full);
});

// PUT /family/events/:id
app.put('/family/events/:id', requireLevel(1), async (req, res) => {
  const { title, date, time_start, time_end, all_day, location, color,
          recurrence, recurrence_end, reminder_min, notes, member_ids } = req.body;

  const { error } = await supabase.from('family_events')
    .update({
      ...(title         !== undefined && { title: title.trim() }),
      ...(date          !== undefined && { date }),
      ...(time_start    !== undefined && { time_start }),
      ...(time_end      !== undefined && { time_end }),
      ...(all_day       !== undefined && { all_day }),
      ...(location      !== undefined && { location }),
      ...(color         !== undefined && { color }),
      ...(recurrence    !== undefined && { recurrence }),
      ...(recurrence_end!== undefined && { recurrence_end }),
      ...(reminder_min  !== undefined && { reminder_min }),
      ...(notes         !== undefined && { notes }),
    })
    .eq('id', req.params.id)
    .eq('owner_id', req.user.id);
  if (error) return res.status(500).json({ error: error.message });

  // Resync membres si fournis
  if (member_ids !== undefined) {
    await supabase.from('family_event_members').delete().eq('event_id', req.params.id);
    if (member_ids.length) {
      await supabase.from('family_event_members').insert(
        member_ids.map(mid => ({ event_id: req.params.id, member_id: mid }))
      );
    }
  }

  const { data: full } = await supabase.from('family_events')
    .select('*, family_event_members(member_id, family_members(id, name, color, emoji))')
    .eq('id', req.params.id).single();
  res.json(full);
});

// DELETE /family/events/:id
app.delete('/family/events/:id', requireLevel(1), async (req, res) => {
  const { error } = await supabase.from('family_events')
    .delete().eq('id', req.params.id).eq('owner_id', req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

// ─── Middlewares ──────────────────────────────────────────────────────────────
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token manquant' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Token invalide' }); }
}

function adminMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token manquant' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    if (!req.user.is_admin) return res.status(403).json({ error: 'Accès admin requis' });
    next();
  } catch { res.status(401).json({ error: 'Token invalide' }); }
}

function makeToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, is_admin: user.is_admin || false, must_change_password: user.must_change_password || false },
    JWT_SECRET, { expiresIn: '7d' }
  );
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
app.post('/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Champs requis' });
  if (password.length < 6) return res.status(400).json({ error: 'Mot de passe trop court (6 car. min)' });

  const { data: existing } = await supabase.from('users').select('id').eq('username', username.toLowerCase()).single();
  if (existing) return res.status(409).json({ error: "Nom d'utilisateur déjà pris" });

  const hash = await bcrypt.hash(password, 10);
  const { data, error } = await supabase.from('users').insert({ username: username.toLowerCase(), password_hash: hash }).select().single();
  if (error) return res.status(500).json({ error: 'Erreur serveur' });

  res.json({ token: makeToken(data), user: { id: data.id, username: data.username, is_admin: false, must_change_password: false } });
});

app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const { data: user } = await supabase.from('users').select('*').eq('username', username.toLowerCase()).single();
  if (!user) return res.status(401).json({ error: 'Identifiants invalides' });

  // Vérifier mot de passe temporaire en premier
  if (user.temp_password_hash) {
    const tempValid = await bcrypt.compare(password, user.temp_password_hash);
    if (tempValid) {
      // Forcer le changement de mot de passe
      await supabase.from('users').update({ must_change_password: true }).eq('id', user.id);
      user.must_change_password = true;
      const token = makeToken(user);
      return res.json({ token, user: { id: user.id, username: user.username, is_admin: user.is_admin, must_change_password: true } });
    }
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Identifiants invalides' });

  res.json({ token: makeToken(user), user: { id: user.id, username: user.username, is_admin: user.is_admin, must_change_password: user.must_change_password || false } });
});

app.get('/auth/me', authMiddleware, (req, res) => res.json({ user: req.user }));

// Changer son mot de passe (obligatoire si must_change_password)
app.post('/auth/change-password', authMiddleware, async (req, res) => {
  const { new_password } = req.body;
  if (!new_password || new_password.length < 6) return res.status(400).json({ error: 'Mot de passe trop court (6 car. min)' });

  const hash = await bcrypt.hash(new_password, 10);
  const { data, error } = await supabase.from('users')
    .update({ password_hash: hash, must_change_password: false, temp_password_hash: null })
    .eq('id', req.user.id).select().single();
  if (error) return res.status(500).json({ error });

  res.json({ token: makeToken(data), user: { id: data.id, username: data.username, is_admin: data.is_admin, must_change_password: false } });
});

// ─── Picks ────────────────────────────────────────────────────────────────────
const LOCK_DATE = new Date(process.env.LOCK_DATE || '2028-07-18T00:00:00Z');
const isLocked = () => new Date() >= LOCK_DATE;

app.get('/picks', authMiddleware, async (req, res) => {
  const { data, error } = await supabase.from('picks').select('*').eq('user_id', req.user.id);
  if (error) return res.status(500).json({ error });
  res.json(data);
});

app.post('/picks', authMiddleware, async (req, res) => {
  if (isLocked()) return res.status(403).json({ error: 'Les pronostics sont verrouillés' });
  const { discipline_id, country_id } = req.body;
  if (!discipline_id || !country_id) return res.status(400).json({ error: 'discipline_id et country_id requis' });
  const { data, error } = await supabase.from('picks')
    .upsert({ user_id: req.user.id, discipline_id, country_id }, { onConflict: 'user_id,discipline_id' })
    .select().single();
  if (error) return res.status(500).json({ error });
  res.json(data);
});

app.delete('/picks/:discipline_id', authMiddleware, async (req, res) => {
  if (isLocked()) return res.status(403).json({ error: 'Les pronostics sont verrouillés' });
  const { error } = await supabase.from('picks').delete().eq('user_id', req.user.id).eq('discipline_id', req.params.discipline_id);
  if (error) return res.status(500).json({ error });
  res.json({ success: true });
});

// ─── Scoring ──────────────────────────────────────────────────────────────────
function computePoints(pick_country, result) {
  if (!result) return 0;
  if (pick_country === result.gold_country_id) return 5;
  if (pick_country === result.silver_country_id) return 3;
  if (pick_country === result.bronze_country_id) return 1;
  return 0;
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────
app.get('/leaderboard', async (req, res) => {
  const [{ data: picks, error: pe }, { data: results, error: re }] = await Promise.all([
    supabase.from('picks').select('user_id, discipline_id, country_id, users(username)').order('user_id'),
    supabase.from('results').select('*'),
  ]);
  if (pe || re) return res.status(500).json({ error: pe || re });
  const resultMap = {};
  results.forEach(r => { resultMap[r.discipline_id] = r; });
  res.json(picks.map(p => ({ ...p, points: computePoints(p.country_id, resultMap[p.discipline_id]) })));
});

// ─── Results ──────────────────────────────────────────────────────────────────
app.get('/results', async (req, res) => {
  const { data, error } = await supabase.from('results').select('*');
  if (error) return res.status(500).json({ error });
  res.json(data);
});

app.post('/results', adminMiddleware, async (req, res) => {
  const { discipline_id, gold_country_id, silver_country_id, bronze_country_id } = req.body;
  if (!discipline_id || !gold_country_id) return res.status(400).json({ error: 'discipline_id et gold_country_id requis' });
  const { data, error } = await supabase.from('results')
    .upsert({ discipline_id, gold_country_id, silver_country_id: silver_country_id || null, bronze_country_id: bronze_country_id || null }, { onConflict: 'discipline_id' })
    .select().single();
  if (error) return res.status(500).json({ error });
  res.json(data);
});

app.delete('/results/:discipline_id', adminMiddleware, async (req, res) => {
  const { error } = await supabase.from('results').delete().eq('discipline_id', req.params.discipline_id);
  if (error) return res.status(500).json({ error });
  res.json({ success: true });
});

// Fetch automatique résultats depuis Codante.io
app.post('/admin/fetch-results', adminMiddleware, async (req, res) => {
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
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Admin — Users ────────────────────────────────────────────────────────────
app.get('/admin/users', adminMiddleware, async (req, res) => {
  const { data, error } = await supabase.from('users').select('id, username, is_admin, must_change_password, created_at').order('created_at');
  if (error) return res.status(500).json({ error });
  res.json(data);
});

app.get('/admin/picks', adminMiddleware, async (req, res) => {
  const { data, error } = await supabase.from('picks').select('*, users(username)').order('discipline_id');
  if (error) return res.status(500).json({ error });
  res.json(data);
});

app.put('/admin/users/:id', adminMiddleware, async (req, res) => {
  const { is_admin } = req.body;
  const { data, error } = await supabase.from('users').update({ is_admin }).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error });
  res.json(data);
});

// Supprimer un utilisateur
app.delete('/admin/users/:id', adminMiddleware, async (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'Tu ne peux pas te supprimer toi-même' });
  const { error } = await supabase.from('users').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error });
  res.json({ success: true });
});

// Définir un mot de passe temporaire
app.post('/admin/users/:id/temp-password', adminMiddleware, async (req, res) => {
  const { temp_password } = req.body;
  if (!temp_password || temp_password.length < 4) return res.status(400).json({ error: 'Mot de passe trop court' });
  const hash = await bcrypt.hash(temp_password, 10);
  const { error } = await supabase.from('users').update({ temp_password_hash: hash, must_change_password: true }).eq('id', req.params.id);
  if (error) return res.status(500).json({ error });
  res.json({ success: true, temp_password });
});

// ─── Groupes ──────────────────────────────────────────────────────────────────
app.get('/groups', authMiddleware, async (req, res) => {
  const { data, error } = await supabase.from('groups').select('*, group_members(user_id, users(username))').order('name');
  if (error) return res.status(500).json({ error });
  res.json(data);
});

app.post('/groups', adminMiddleware, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Nom requis' });
  const { data, error } = await supabase.from('groups').insert({ name, created_by: req.user.id }).select().single();
  if (error) return res.status(500).json({ error });
  res.json(data);
});

app.delete('/groups/:id', adminMiddleware, async (req, res) => {
  const { error } = await supabase.from('groups').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error });
  res.json({ success: true });
});

app.post('/groups/:id/members', adminMiddleware, async (req, res) => {
  const { user_id } = req.body;
  const { error } = await supabase.from('group_members').upsert({ group_id: req.params.id, user_id }, { onConflict: 'group_id,user_id' });
  if (error) return res.status(500).json({ error });
  res.json({ success: true });
});

app.delete('/groups/:id/members/:user_id', adminMiddleware, async (req, res) => {
  const { error } = await supabase.from('group_members').delete().eq('group_id', req.params.id).eq('user_id', req.params.user_id);
  if (error) return res.status(500).json({ error });
  res.json({ success: true });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🏅 API démarrée sur http://localhost:${PORT}`));

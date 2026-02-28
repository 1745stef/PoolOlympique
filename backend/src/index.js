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

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

// ─── Middlewares ──────────────────────────────────────────────────────────────
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token manquant' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide' });
  }
}

function adminMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token manquant' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    if (!req.user.is_admin) return res.status(403).json({ error: 'Accès admin requis' });
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide' });
  }
}

// ─── Auth Routes ──────────────────────────────────────────────────────────────
app.post('/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Champs requis' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Mot de passe trop court (6 car. min)' });

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('username', username.toLowerCase())
    .single();
  if (existing) return res.status(409).json({ error: 'Nom d\'utilisateur déjà pris' });

  const hash = await bcrypt.hash(password, 10);
  const { data, error } = await supabase
    .from('users')
    .insert({ username: username.toLowerCase(), password_hash: hash })
    .select()
    .single();
  if (error) return res.status(500).json({ error: 'Erreur serveur' });

  const token = jwt.sign({ id: data.id, username: data.username, is_admin: data.is_admin || false }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: data.id, username: data.username, is_admin: data.is_admin || false } });
});

app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('username', username.toLowerCase())
    .single();
  if (!user) return res.status(401).json({ error: 'Identifiants invalides' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Identifiants invalides' });

  const token = jwt.sign({ id: user.id, username: user.username, is_admin: user.is_admin || false }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, username: user.username, is_admin: user.is_admin || false } });
});

app.get('/auth/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// ─── Picks Routes ─────────────────────────────────────────────────────────────
const LOCK_DATE = new Date(process.env.LOCK_DATE || '2028-07-18T00:00:00Z');

function isLocked() {
  return new Date() >= LOCK_DATE;
}

// GET all picks for the current user
app.get('/picks', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('picks')
    .select('*')
    .eq('user_id', req.user.id);
  if (error) return res.status(500).json({ error });
  res.json(data);
});

// GET leaderboard (all users + their picks after lock)
app.get('/leaderboard', async (req, res) => {
  const { data, error } = await supabase
    .from('picks')
    .select('user_id, discipline_id, country_id, users(username)')
    .order('user_id');
  if (error) return res.status(500).json({ error });
  res.json(data);
});

// GET scores (admin sets gold medalists)
app.get('/results', async (req, res) => {
  const { data, error } = await supabase
    .from('results')
    .select('*');
  if (error) return res.status(500).json({ error });
  res.json(data);
});

// POST / upsert a pick
app.post('/picks', authMiddleware, async (req, res) => {
  if (isLocked()) return res.status(403).json({ error: 'Les pronostics sont verrouillés' });
  const { discipline_id, country_id } = req.body;
  if (!discipline_id || !country_id)
    return res.status(400).json({ error: 'discipline_id et country_id requis' });

  const { data, error } = await supabase
    .from('picks')
    .upsert(
      { user_id: req.user.id, discipline_id, country_id },
      { onConflict: 'user_id,discipline_id' }
    )
    .select()
    .single();
  if (error) return res.status(500).json({ error });
  res.json(data);
});

// DELETE a pick
app.delete('/picks/:discipline_id', authMiddleware, async (req, res) => {
  if (isLocked()) return res.status(403).json({ error: 'Les pronostics sont verrouillés' });
  const { error } = await supabase
    .from('picks')
    .delete()
    .eq('user_id', req.user.id)
    .eq('discipline_id', req.params.discipline_id);
  if (error) return res.status(500).json({ error });
  res.json({ success: true });
});

// POST result (admin JWT protégé)
app.post('/results', adminMiddleware, async (req, res) => {
  const { discipline_id, gold_country_id, silver_country_id, bronze_country_id } = req.body;
  if (!discipline_id || !gold_country_id)
    return res.status(400).json({ error: 'discipline_id et gold_country_id requis' });
  const { data, error } = await supabase
    .from('results')
    .upsert(
      { discipline_id, gold_country_id, silver_country_id: silver_country_id || null, bronze_country_id: bronze_country_id || null },
      { onConflict: 'discipline_id' }
    )
    .select()
    .single();
  if (error) return res.status(500).json({ error });
  res.json(data);
});

// DELETE result (admin JWT protégé)
app.delete('/results/:discipline_id', adminMiddleware, async (req, res) => {
  const { error } = await supabase
    .from('results')
    .delete()
    .eq('discipline_id', req.params.discipline_id);
  if (error) return res.status(500).json({ error });
  res.json({ success: true });
});

// ─── Scoring helper ──────────────────────────────────────────────────────────
// Règle : or=5pts, argent=3pts, bronze=1pt
// Si un pays est sur plusieurs marches, on donne uniquement les points de la plus haute.
function computePoints(pick_country, result) {
  if (!result) return 0;
  const { gold_country_id, silver_country_id, bronze_country_id } = result;
  if (pick_country === gold_country_id) return 5;
  if (pick_country === silver_country_id) return 3;
  if (pick_country === bronze_country_id) return 1;
  return 0;
}

// GET leaderboard with computed points
app.get('/leaderboard', async (req, res) => {
  const { data: picks, error: pe } = await supabase
    .from('picks')
    .select('user_id, discipline_id, country_id, users(username)')
    .order('user_id');
  if (pe) return res.status(500).json({ error: pe });

  const { data: results, error: re } = await supabase
    .from('results')
    .select('*');
  if (re) return res.status(500).json({ error: re });

  const resultMap = {};
  results.forEach((r) => { resultMap[r.discipline_id] = r; });

  // Attach computed points to each pick
  const picksWithPoints = picks.map((p) => ({
    ...p,
    points: computePoints(p.country_id, resultMap[p.discipline_id]),
  }));

  res.json(picksWithPoints);
});

// GET admin stats — tous les picks de tous les joueurs
app.get('/admin/picks', adminMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('picks')
    .select('*, users(username)')
    .order('discipline_id');
  if (error) return res.status(500).json({ error });
  res.json(data);
});

// GET admin users list
app.get('/admin/users', adminMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, is_admin, created_at')
    .order('created_at');
  if (error) return res.status(500).json({ error });
  res.json(data);
});

// PUT toggle admin status
app.put('/admin/users/:id', adminMiddleware, async (req, res) => {
  const { is_admin } = req.body;
  const { data, error } = await supabase
    .from('users')
    .update({ is_admin })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error });
  res.json(data);
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🏅 API démarrée sur http://localhost:${PORT}`));

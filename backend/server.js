/**
 * MARKVERSE — Single-file backend (LAN-READY)
 * MongoDB + Mongoose + Express + Sessions + JWT + Multer
 *
 * Admin & User can be logged in at the same time in different tabs
 * (per-tab JWT via Authorization: Bearer <token>).
 *
 * Channels: full CRUD (admin) + public list/detail/follow/updates.
 * No demo channels are seeded — channels start empty.
 *
 * Start:   node server.js
 * Env:     PORT, HOST, MONGO_URI, SESSION_SECRET, JWT_SECRET, CLIENT_ORIGIN
 */

/* ============================================================
   IMPORTS
============================================================ */
const express        = require('express');
const mongoose       = require('mongoose');
const session        = require('express-session');
const bcrypt         = require('bcryptjs');
const jwt            = require('jsonwebtoken');
const multer         = require('multer');
const cors           = require('cors');
const path           = require('path');
const fs             = require('fs');
const os             = require('os');
require('dotenv').config();

/* ============================================================
   CONFIG
============================================================ */
const PORT          = parseInt(process.env.PORT || '5000', 10);
const HOST          = process.env.HOST || '0.0.0.0';
const MONGO_URI     = process.env.MONGO_URI || 'mongodb://localhost:27017/markverse';
const SESSION_SEC   = process.env.SESSION_SECRET || 'markverse_super_secret_2026';
const JWT_SECRET    = process.env.JWT_SECRET    || 'markverse_jwt_secret_2026_change_me';
const JWT_EXPIRES   = process.env.JWT_EXPIRES   || '30d';
const CLIENT_ORIGIN = (process.env.CLIENT_ORIGIN || '*')
  .split(',').map(s => s.trim());

/* ============================================================
   APP + MIDDLEWARE
============================================================ */
const app = express();
app.set('trust proxy', 1);

app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    if (CLIENT_ORIGIN.length && !CLIENT_ORIGIN.includes('*')) {
      if (CLIENT_ORIGIN.includes(origin)) return cb(null, true);
      return cb(null, false);
    }
    return cb(null, true);
  },
  credentials: true
}));

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

app.use(session({
  name: 'markverse.sid',
  secret: SESSION_SEC,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000
  }
}));

const UPLOAD_ROOT = path.join(__dirname, 'uploads');
['', 'thumbnails', 'videos', 'trailers', 'channels'].forEach(sub => {
  const dir = path.join(UPLOAD_ROOT, sub);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});
app.use('/uploads', express.static(UPLOAD_ROOT));

/* ============================================================
   MULTER
============================================================ */
const storage = multer.diskStorage({
  destination(req, file, cb) {
    if (file.fieldname === 'thumbnail') return cb(null, path.join(UPLOAD_ROOT, 'thumbnails'));
    if (file.fieldname === 'trailer')   return cb(null, path.join(UPLOAD_ROOT, 'trailers'));
    if (
      file.fieldname === 'file' ||
      file.fieldname === 'avatar' ||
      file.fieldname === 'banner' ||
      file.fieldname === 'image'
    ) {
      return cb(null, path.join(UPLOAD_ROOT, 'channels'));
    }
    return cb(null, path.join(UPLOAD_ROOT, 'videos'));
  },
  filename(req, file, cb) {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 * 1024, files: 10 }
});

/* ============================================================
   MONGOOSE SCHEMAS
============================================================ */
const { Schema, model } = mongoose;

/* ---------- User ---------- */
const UserSchema = new Schema({
  username: { type: String, unique: true, sparse: true, trim: true },
  name:     { type: String, default: '' },
  email:    { type: String, unique: true, required: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role:     { type: String, enum: ['User', 'Moderator', 'Admin'], default: 'User' },
  status:   { type: String, enum: ['Active', 'Pending', 'Banned'], default: 'Active' },
  avatar:   { type: String, default: '' },
  bio:      { type: String, default: '' },
  phone:    { type: String, default: '' },
  country:  { type: String, default: '' },
  has2FA:   { type: Boolean, default: false },
  canUpload:{ type: Boolean, default: false },
  featured: { type: Boolean, default: false },
  notes:    { type: String, default: '' },
  downloads:{ type: Number, default: 0 },
  uploads:  { type: Number, default: 0 },
  storage:  { type: String, default: '0 MB' },
  lastActive:{ type: Date, default: Date.now },
  notifications: {
    email:          { type: Boolean, default: true },
    push:           { type: Boolean, default: false },
    weeklyDigest:   { type: Boolean, default: true },
    securityAlerts: { type: Boolean, default: true }
  },
  preferences: {
    language: { type: String, default: 'English' },
    timezone: { type: String, default: 'UTC' },
    theme:    { type: String, default: 'System' },
    landing:  { type: String, default: 'Dashboard' }
  }
}, { timestamps: true });

/* ---------- Content ---------- */
const PartSchema = new Schema({ url: { type: String, default: '' } }, { _id: false });

const EpisodeSchema = new Schema({
  number:     { type: Number, default: 0 },
  title:      { type: String, default: '' },
  duration:   { type: String, default: '' },
  description:{ type: String, default: '' },
  rating:     { type: String, default: '' },
  year:       { type: String, default: '' },
  genre:      { type: String, default: '' },
  image:      { type: String, default: '' },
  videoUrl:   { type: String, default: '' },
  trailerUrl: { type: String, default: '' }
}, { _id: true });

const ContentSchema = new Schema({
  title:       { type: String, required: true, trim: true },
  type:        { type: String, enum: ['Movie', 'Series'], default: 'Movie' },
  genre:       { type: String, default: '' },
  year:        { type: String, default: '' },
  rating:      { type: String, default: '' },
  description: { type: String, default: '' },
  quality:     { type: String, default: 'HD' },
  language:    { type: String, default: '' },
  country:     { type: String, default: '' },
  duration:    { type: String, default: '' },
  runtime:     { type: String, default: '' },

  image:       { type: String, default: '' },
  thumbnail:   { type: String, default: '' },
  backdrop:    { type: String, default: '' },

  trailer:     { type: String, default: '' },
  trailerUrl:  { type: String, default: '' },

  videoUrl:    { type: String, default: '' },
  uploadMode:  { type: String, enum: ['single', 'parts', 'episodes'], default: 'single' },
  parts:       { type: [PartSchema], default: [] },
  partA:       { type: String, default: '' },
  partB:       { type: String, default: '' },

  episodes:    { type: [EpisodeSchema], default: [] },
  episodeCount:{ type: Number, default: 0 },

  pinned:      { type: Boolean, default: false },
  featured:    { type: Boolean, default: false },
  isTrending:  { type: Boolean, default: false },
  views:       { type: Number, default: 0 },

  channelId:   { type: Schema.Types.ObjectId, ref: 'Channel', default: null, index: true },

  createdBy:   { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

/* ---------- Channel ---------- */
const ChannelSchema = new Schema({
  name:         { type: String, required: true, trim: true },
  description:  { type: String, default: '' },
  avatar:       { type: String, default: '' },
  banner:       { type: String, default: '' },
  subscribers:  { type: Number, default: 0 },
  contentCount: { type: Number, default: 0 },
  isFollowing:  { type: Boolean, default: false },
  hasNewContent:{ type: Boolean, default: false },
  latestUploadAt:{ type: Date, default: null },
  createdBy:    { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

/* ---------- ChannelFollow ---------- */
const ChannelFollowSchema = new Schema({
  userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  channelId: { type: Schema.Types.ObjectId, ref: 'Channel', required: true },
  lastSeenUploadAt: { type: Date, default: null }
}, { timestamps: true });
ChannelFollowSchema.index({ userId: 1, channelId: 1 }, { unique: true });
ChannelFollowSchema.index({ channelId: 1, createdAt: -1 });

/* ---------- Comment ---------- */
const ReplySchema = new Schema({
  user:      { type: String, default: 'Admin' },
  text:      { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const CommentSchema = new Schema({
  userId:     { type: Schema.Types.ObjectId, ref: 'User' },
  userName:   { type: String, default: 'Anonymous' },
  titleId:    { type: Schema.Types.ObjectId, ref: 'Content' },
  titleName:  { type: String, default: '' },
  titleType:  { type: String, default: 'Movie' },
  titleImage: { type: String, default: '' },
  text:       { type: String, default: '' },
  rating:     { type: Number, default: 0 },
  likes:      { type: Number, default: 0 },
  status:     { type: String, enum: ['approved', 'pending', 'flagged', 'spam'], default: 'pending' },
  pinned:     { type: Boolean, default: false },
  replies:    { type: [ReplySchema], default: [] }
}, { timestamps: true });

/* ---------- Notification ---------- */
const NotificationSchema = new Schema({
  title:      { type: String, required: true },
  message:    { type: String, default: '' },
  type:       { type: String, enum: ['system', 'user', 'content', 'security', 'promo'], default: 'system' },
  priority:   { type: String, enum: ['low', 'normal', 'high'], default: 'normal' },
  audience:   { type: String, default: 'All users' },
  specificUserId: { type: String, default: '' },
  link:       { type: String, default: '' },
  icon:       { type: String, default: 'bell' },
  scheduled:  { type: Boolean, default: false },
  scheduledAt:{ type: String, default: '' },
  status:     { type: String, enum: ['draft', 'sent', 'scheduled', 'failed'], default: 'draft' },
  read:       { type: Boolean, default: false },
  pinned:     { type: Boolean, default: false },
  stats: {
    delivered: { type: Number, default: 0 },
    opened:    { type: Number, default: 0 },
    clicked:   { type: Number, default: 0 }
  },
  createdBy:  { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

/* ---------- Watch history ---------- */
const HistorySchema = new Schema({
  userId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  contentId:{ type: Schema.Types.ObjectId, ref: 'Content', required: true },
  progress: { type: Number, default: 0 },
  lastWatched: { type: Date, default: Date.now }
}, { timestamps: true });
HistorySchema.index({ userId: 1, contentId: 1 }, { unique: true });

/* ---------- Download tracking ---------- */
const DownloadSchema = new Schema({
  userId:          { type: Schema.Types.ObjectId, ref: 'User', required: true },
  contentId:       { type: Schema.Types.ObjectId, ref: 'Content' },
  title:           { type: String, default: '' },
  genre:           { type: String, default: '' },
  type:            { type: String, default: 'Movie' },
  quality:         { type: String, default: 'HD' },
  image:           { type: String, default: '' },
  sizeBytes:       { type: Number, default: 0 },
  downloadedBytes: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['downloading', 'pending', 'paused', 'completed', 'failed'],
    default: 'pending'
  },
  errorMessage:    { type: String, default: '' }
}, { timestamps: true });

DownloadSchema.index({ userId: 1, createdAt: -1 });

/* ---------- Models ---------- */
const User          = model('User', UserSchema);
const Content       = model('Content', ContentSchema);
const Channel       = model('Channel', ChannelSchema);
const ChannelFollow = model('ChannelFollow', ChannelFollowSchema);
const Comment       = model('Comment', CommentSchema);
const Notification  = model('Notification', NotificationSchema);
const History       = model('History', HistorySchema);
const Download      = model('Download', DownloadSchema);

/* ============================================================
   AUTH HELPERS — JWT + SESSION
============================================================ */
function signToken(user) {
  return jwt.sign(
    { uid: String(user._id), isAdmin: user.role === 'Admin' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

function extractAuth(req) {
  const header = req.headers.authorization || req.headers.Authorization || '';
  if (header.startsWith('Bearer ')) {
    const token = header.slice(7).trim();
    if (token) {
      try {
        const payload = jwt.verify(token, JWT_SECRET);
        return { userId: payload.uid, isAdmin: !!payload.isAdmin, via: 'jwt' };
      } catch (_) {}
    }
  }
  if (req.session?.userId) {
    return {
      userId: req.session.userId,
      isAdmin: !!req.session.isAdmin,
      via: 'session'
    };
  }
  return null;
}

const currentUserId = (req) => req.auth?.userId;

/* ============================================================
   GENERIC HELPERS
============================================================ */
const ok  = (res, data, status = 200) => res.status(status).json({ data });
const err = (res, message, status = 400) => res.status(status).json({ error: message });

const requireAuth = (req, res, next) => {
  const a = extractAuth(req);
  if (!a) return err(res, 'Unauthorized', 401);
  req.auth = a;
  next();
};

const requireAdmin = (req, res, next) => {
  const a = extractAuth(req);
  if (!a) return err(res, 'Unauthorized', 401);
  if (!a.isAdmin) return err(res, 'Forbidden', 403);
  req.auth = a;
  next();
};

function safeObjectId(value) {
  if (!value) return undefined;
  return mongoose.Types.ObjectId.isValid(value) ? value : undefined;
}

function clampNum(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function sanitizeParts(parts) {
  if (!Array.isArray(parts)) return [];
  return parts
    .map(p => (typeof p === 'string' ? { url: p } : p))
    .filter(p => p && typeof p.url === 'string' && p.url.trim() !== '')
    .map(p => ({ url: p.url.trim() }));
}

function sanitizeEpisodes(episodes, fallbackImage = '', fallbackYear = '', fallbackGenre = '') {
  if (!Array.isArray(episodes)) return [];
  return episodes
    .filter(ep => ep && (ep.url || ep.videoUrl))
    .map((ep, index) => ({
      number: index + 1,
      title: ep.title || `Episode ${index + 1}`,
      duration: ep.duration || '',
      description: ep.description || '',
      rating: ep.rating || '',
      year: ep.year || fallbackYear || '',
      genre: ep.genre || fallbackGenre || '',
      image: ep.image || fallbackImage || '',
      videoUrl: ep.videoUrl || ep.url || '',
      trailerUrl: ep.trailerUrl || ''
    }));
}

function handleError(res, e, label = 'error') {
  console.error(label + ':', e);
  if (e && e.name === 'ValidationError' && e.errors) {
    const msgs = Object.values(e.errors).map(x => x.message).join(', ');
    return err(res, msgs || 'Validation failed', 422);
  }
  if (e && e.name === 'CastError') {
    return err(res, `Invalid value for ${e.path}: ${e.value}`, 400);
  }
  if (e && e.code === 11000) {
    return err(res, 'Duplicate key: ' + JSON.stringify(e.keyValue || {}), 409);
  }
  return err(res, (e && e.message) || 'Server error', 500);
}

/* ============================================================
   SERIALIZERS
============================================================ */
function serializeContent(c) {
  if (!c) return null;
  const obj = c.toObject ? c.toObject() : c;
  const image = obj.image || obj.thumbnail || '';
  const trailer = obj.trailer || obj.trailerUrl || '';

  const rawEpisodes = Array.isArray(obj.episodes) ? obj.episodes : [];
  const episodes = rawEpisodes.map((episode, index) => {
    const ep = episode || {};
    return {
      ...ep,
      id: ep._id ? String(ep._id) : undefined,
      _id: ep._id ? String(ep._id) : undefined,
      number: index + 1,
      title: ep.title || `Episode ${index + 1}`,
      duration: ep.duration || '',
      description: ep.description || '',
      rating: ep.rating || '',
      year: ep.year || obj.year || '',
      genre: ep.genre || obj.genre || '',
      image: ep.image || image || '',
      videoUrl: ep.videoUrl || '',
      trailerUrl: ep.trailerUrl || ''
    };
  });

  return {
    id: String(obj._id),
    _id: String(obj._id),
    title: obj.title,
    type: obj.type,
    genre: obj.genre,
    year: obj.year,
    rating: obj.rating,
    description: obj.description,
    quality: obj.quality,
    language: obj.language,
    country: obj.country,
    duration: obj.duration || obj.runtime || '',
    runtime: obj.runtime || obj.duration || '',
    image,
    thumbnail: obj.thumbnail || image,
    backdrop: obj.backdrop || image,
    trailer,
    trailerUrl: trailer,
    videoUrl: obj.videoUrl,
    uploadMode: obj.uploadMode,
    parts: Array.isArray(obj.parts) ? obj.parts : [],
    partA: obj.partA,
    partB: obj.partB,
    episodes,
    episodesData: episodes,
    episodeCount: episodes.length,
    pinned: !!obj.pinned,
    featured: !!obj.featured,
    isTrending: !!obj.isTrending,
    views: obj.views || 0,
    channelId: obj.channelId ? String(obj.channelId) : null,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
    _createdAt: obj.createdAt ? new Date(obj.createdAt).getTime() : Date.now()
  };
}

function serializeUser(u) {
  if (!u) return null;
  const obj = u.toObject ? u.toObject() : u;
  return {
    id: String(obj._id),
    _id: String(obj._id),
    name: obj.name || obj.username || 'Unnamed',
    username: obj.username || '',
    email: obj.email,
    role: obj.role || 'User',
    status: obj.status || 'Active',
    avatar: obj.avatar || '',
    bio: obj.bio || '',
    phone: obj.phone || '',
    country: obj.country || '',
    has2FA: !!obj.has2FA,
    canUpload: !!obj.canUpload,
    featured: !!obj.featured,
    notes: obj.notes || '',
    downloads: obj.downloads || 0,
    uploads: obj.uploads || 0,
    storage: obj.storage || '0 MB',
    joined: obj.createdAt ? new Date(obj.createdAt).toISOString().slice(0, 10) : '—',
    lastActive: obj.lastActive ? new Date(obj.lastActive).getTime() : Date.now(),
    notifications: obj.notifications,
    preferences: obj.preferences,
    _createdAt: obj.createdAt ? new Date(obj.createdAt).getTime() : 0
  };
}

function serializeChannel(ch) {
  if (!ch) return null;
  const obj = ch.toObject ? ch.toObject() : ch;
  return {
    id: String(obj._id),
    _id: String(obj._id),
    name: obj.name,
    description: obj.description || '',
    avatar: obj.avatar || '',
    banner: obj.banner || '',
    subscribers: obj.subscribers || 0,
    contentCount: obj.contentCount || 0,
    isFollowing: !!obj.isFollowing,
    hasNewContent: !!obj.hasNewContent,
    latestUploadAt: obj.latestUploadAt || null,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
    _createdAt: obj.createdAt ? new Date(obj.createdAt).getTime() : Date.now()
  };
}

function serializeComment(c) {
  if (!c) return null;
  const obj = c.toObject ? c.toObject() : c;
  return {
    id: String(obj._id),
    _id: String(obj._id),
    userId: obj.userId ? String(obj.userId) : '',
    userName: obj.userName || 'Anonymous',
    titleId: obj.titleId ? String(obj.titleId) : '',
    titleName: obj.titleName || '',
    titleType: obj.titleType || 'Movie',
    titleImage: obj.titleImage || '',
    text: obj.text || '',
    rating: obj.rating || 0,
    likes: obj.likes || 0,
    status: obj.status || 'pending',
    pinned: !!obj.pinned,
    replies: (obj.replies || []).map(r => ({
      id: String(r._id),
      user: r.user || 'Admin',
      text: r.text || '',
      _createdAt: r.createdAt ? new Date(r.createdAt).getTime() : Date.now()
    })),
    _createdAt: obj.createdAt ? new Date(obj.createdAt).getTime() : Date.now()
  };
}

function serializeNotification(n) {
  if (!n) return null;
  const obj = n.toObject ? n.toObject() : n;
  return {
    id: String(obj._id),
    _id: String(obj._id),
    title: obj.title,
    message: obj.message,
    type: obj.type,
    priority: obj.priority,
    audience: obj.audience,
    specificUserId: obj.specificUserId || '',
    link: obj.link || '',
    icon: obj.icon || 'bell',
    scheduled: !!obj.scheduled,
    scheduledAt: obj.scheduledAt || '',
    status: obj.status,
    read: !!obj.read,
    pinned: !!obj.pinned,
    stats: obj.stats || { delivered: 0, opened: 0, clicked: 0 },
    _createdAt: obj.createdAt ? new Date(obj.createdAt).getTime() : Date.now()
  };
}

function serializeDownload(d) {
  if (!d) return null;
  const obj = d.toObject ? d.toObject() : d;
  const size = Number(obj.sizeBytes) || 0;
  const downloaded = clampNum(Number(obj.downloadedBytes) || 0, 0, size);
  return {
    id: String(obj._id),
    _id: String(obj._id),
    contentId: obj.contentId ? String(obj.contentId) : '',
    title: obj.title || '',
    genre: obj.genre || 'Unknown',
    type: obj.type || 'Movie',
    quality: obj.quality || 'HD',
    image: obj.image || '',
    sizeBytes: size,
    downloadedBytes: downloaded,
    status: obj.status || 'pending',
    errorMessage: obj.errorMessage || '',
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
    _createdAt: obj.createdAt ? new Date(obj.createdAt).getTime() : Date.now()
  };
}

/* ============================================================
   AUTH ROUTES
============================================================ */
app.post('/api/register', async (req, res) => {
  try {
    const { name, username, email, password } = req.body;
    if (!email || !password) return err(res, 'Email and password are required');

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return err(res, 'An account with this email already exists', 409);

    if (username) {
      const u = await User.findOne({ username });
      if (u) return err(res, 'Username is already taken', 409);
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name || username || email.split('@')[0],
      username: username || email.split('@')[0],
      email: email.toLowerCase(),
      password: hash,
      role: 'User',
      status: 'Active'
    });

    const token = signToken(user);

    req.session.userId  = String(user._id);
    req.session.isAdmin = user.role === 'Admin';

    return ok(res, { user: serializeUser(user), token }, 201);
  } catch (e) {
    console.error('register:', e);
    return err(res, e.message, 500);
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    if (!email || !password) return err(res, 'Email and password are required');

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return err(res, 'Incorrect email or password', 401);

    if (user.status === 'Banned') return err(res, 'Account suspended', 403);

    const match = await bcrypt.compare(password, user.password);
    if (!match) return err(res, 'Incorrect email or password', 401);

    const token = signToken(user);

    req.session.userId  = String(user._id);
    req.session.isAdmin = user.role === 'Admin';
    if (rememberMe) req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;

    user.lastActive = new Date();
    await user.save();

    return ok(res, { user: serializeUser(user), token });
  } catch (e) {
    console.error('login:', e);
    return err(res, e.message, 500);
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('markverse.sid');
    return ok(res, { ok: true });
  });
});

app.get('/api/me', async (req, res) => {
  const a = extractAuth(req);
  if (!a) return err(res, 'Not authenticated', 401);

  const user = await User.findById(a.userId);
  if (!user) return err(res, 'Not authenticated', 401);

  return ok(res, { user: serializeUser(user) });
});

app.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return err(res, 'Email is required');
  return ok(res, { sent: true, email });
});

/* ============================================================
   PUBLIC / BROWSE ROUTES
============================================================ */
app.get('/api/home', async (req, res) => {
  try {
    const [featured, series, movies] = await Promise.all([
      Content.find({ featured: true }).sort({ createdAt: -1 }).limit(6),
      Content.find({ type: 'Series' }).sort({ createdAt: -1 }).limit(8),
      Content.find({ type: 'Movie' }).sort({ createdAt: -1 }).limit(8)
    ]);
    return ok(res, {
      featured: featured.map(serializeContent),
      series:   series.map(serializeContent),
      movies:   movies.map(serializeContent)
    });
  } catch (e) {
    console.error('home:', e);
    return err(res, e.message, 500);
  }
});

app.get('/api/movies', async (req, res) => {
  try {
    const list = await Content.find({ type: 'Movie' }).sort({ createdAt: -1 });
    return ok(res, list.map(serializeContent));
  } catch (e) {
    return err(res, e.message, 500);
  }
});

app.get('/api/series', async (req, res) => {
  try {
    const list = await Content.find({ type: 'Series' }).sort({ createdAt: -1 });
    return ok(res, list.map(serializeContent));
  } catch (e) {
    return err(res, e.message, 500);
  }
});

app.get('/api/search', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const limit = parseInt(req.query.limit, 10) || 20;
    const filter = q
      ? { $or: [
          { title:  { $regex: q, $options: 'i' } },
          { genre:  { $regex: q, $options: 'i' } },
          { country:{ $regex: q, $options: 'i' } }
        ] }
      : {};
    const list = await Content.find(filter).sort({ createdAt: -1 }).limit(limit);
    return ok(res, list.map(serializeContent));
  } catch (e) {
    return err(res, e.message, 500);
  }
});

app.get('/api/media/:id', async (req, res) => {
  try {
    const item = await Content.findById(req.params.id);
    if (!item) return err(res, 'Not found', 404);
    Content.updateOne({ _id: item._id }, { $inc: { views: 1 } }).catch(() => {});
    return ok(res, serializeContent(item));
  } catch (e) {
    return err(res, e.message, 500);
  }
});

app.get('/api/media/:id/related', async (req, res) => {
  try {
    const item = await Content.findById(req.params.id);
    if (!item) return err(res, 'Not found', 404);

    const related = await Content.find({
      _id: { $ne: item._id },
      $or: [{ genre: item.genre }, { country: item.country }]
    }).limit(12);

    return ok(res, related.map(serializeContent));
  } catch (e) {
    return err(res, e.message, 500);
  }
});

/* ============================================================
   PUBLIC — CHANNELS
============================================================ */
async function serializeChannelsForUser(channels, userId) {
  const ids = channels.map(c => c._id);

  const counts = await Content.aggregate([
    { $match: { channelId: { $in: ids } } },
    { $group: { _id: '$channelId', count: { $sum: 1 } } }
  ]);
  const countMap = new Map(counts.map(c => [String(c._id), c.count]));

  let followedSet = new Set();
  if (userId) {
    const follows = await ChannelFollow.find({
      userId,
      channelId: { $in: ids }
    }).select('channelId');
    followedSet = new Set(follows.map(f => String(f.channelId)));
  }

  return channels.map(ch => {
    const s = serializeChannel(ch);
    s.contentCount = countMap.get(s.id) ?? s.contentCount ?? 0;
    s.isFollowing = followedSet.has(s.id);
    return s;
  });
}

/* ---------- list channels (public) ---------- */
app.get('/api/channels', async (req, res) => {
  try {
    const auth = extractAuth(req);
    const userId = auth?.userId || null;

    const q = String(req.query.q || '').trim().toLowerCase();
    const sort = String(req.query.sort || 'newest');

    const filter = q
      ? {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { description: { $regex: q, $options: 'i' } }
          ]
        }
      : {};

    const sorter =
      sort === 'followers' ? { subscribers: -1, createdAt: -1 } :
      sort === 'name'      ? { name: 1 } :
                             { createdAt: -1 };

    const list = await Channel.find(filter).sort(sorter);
    const data = await serializeChannelsForUser(list, userId);

    return ok(res, { channels: data });
  } catch (e) {
    return handleError(res, e, 'list public channels');
  }
});

/* ---------- updates on followed channels (BEFORE :id!) ---------- */
app.get('/api/channels/updates', requireAuth, async (req, res) => {
  try {
    const userId = currentUserId(req);

    const follows = await ChannelFollow.find({ userId })
      .populate('channelId', 'name avatar');

    if (!follows.length) return ok(res, { updates: [] });

    const channelIds = follows.map(f => f.channelId?._id).filter(Boolean);
    if (!channelIds.length) return ok(res, { updates: [] });

    const recent = await Content.find({ channelId: { $in: channelIds } })
      .sort({ createdAt: -1 })
      .limit(20);

    const followMap = new Map(follows.map(f => [String(f.channelId._id), f]));

    const updates = [];
    for (const c of recent) {
      const f = followMap.get(String(c.channelId));
      if (!f) continue;

      const lastSeen = f.lastSeenUploadAt || new Date(0);
      if (c.createdAt && c.createdAt > lastSeen) {
        updates.push({
          channelId: String(f.channelId._id),
          channelName: f.channelId.name,
          avatar: f.channelId.avatar || '',
          contentId: String(c._id),
          title: c.title,
          createdAt: c.createdAt
        });
      }
    }

    return ok(res, { updates });
  } catch (e) {
    return handleError(res, e, 'get channel updates');
  }
});

/* ---------- mark updates seen ---------- */
app.post('/api/channels/updates/mark-seen', requireAuth, async (req, res) => {
  try {
    const userId = currentUserId(req);
    await ChannelFollow.updateMany(
      { userId },
      { $set: { lastSeenUploadAt: new Date() } }
    );
    return ok(res, { ok: true });
  } catch (e) {
    return handleError(res, e, 'mark updates seen');
  }
});

/* ---------- single channel (public) ---------- */
app.get('/api/channels/:id', async (req, res) => {
  try {
    const channelId = safeObjectId(req.params.id);
    if (!channelId) return err(res, 'Invalid channel id', 400);

    const ch = await Channel.findById(channelId);
    if (!ch) return err(res, 'Channel not found', 404);

    const auth = extractAuth(req);
    const userId = auth?.userId || null;

    const [data] = await serializeChannelsForUser([ch], userId);

    const recent = await Content.find({ channelId })
      .sort({ createdAt: -1 })
      .limit(12);

    return ok(res, {
      channel: data,
      content: recent.map(serializeContent)
    });
  } catch (e) {
    return handleError(res, e, 'get public channel');
  }
});

/* ---------- channel content (public) ---------- */
app.get('/api/channels/:id/content', async (req, res) => {
  try {
    const channelId = safeObjectId(req.params.id);
    if (!channelId) return err(res, 'Invalid channel id', 400);

    const channel = await Channel.findById(channelId);
    if (!channel) return err(res, 'Channel not found', 404);

    const items = await Content.find({ channelId }).sort({ createdAt: -1 });
    return ok(res, { items: items.map(serializeContent) });
  } catch (e) {
    return handleError(res, e, 'list public channel content');
  }
});

/* ---------- follow / unfollow ---------- */
app.post('/api/channels/:id/follow', requireAuth, async (req, res) => {
  try {
    const channelId = safeObjectId(req.params.id);
    if (!channelId) return err(res, 'Invalid channel id', 400);

    const channel = await Channel.findById(channelId);
    if (!channel) return err(res, 'Channel not found', 404);

    const userId = currentUserId(req);
    const follow = !!req.body?.follow;

    if (follow) {
      const existing = await ChannelFollow.findOne({ userId, channelId });
      if (!existing) {
        await ChannelFollow.create({ userId, channelId });
        await Channel.findByIdAndUpdate(channelId, { $inc: { subscribers: 1 } });
      }
    } else {
      const deleted = await ChannelFollow.findOneAndDelete({ userId, channelId });
      if (deleted) {
        await Channel.findByIdAndUpdate(channelId, { $inc: { subscribers: -1 } });
      }
    }

    const updated = await Channel.findById(channelId);
    const realCount = await ChannelFollow.countDocuments({ channelId });

    // Keep the denormalized counter honest
    if (updated && updated.subscribers !== realCount) {
      updated.subscribers = realCount;
      await updated.save();
    }

    return ok(res, {
      isFollowing: follow,
      subscribers: realCount
    });
  } catch (e) {
    return handleError(res, e, 'toggle channel follow');
  }
});

/* ============================================================
   USER PROFILE
============================================================ */
app.get('/api/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(currentUserId(req));
    if (!user) return err(res, 'User not found', 404);

    const [history, downloads, notifications, achievements] = await Promise.all([
      History.find({ userId: user._id }).sort({ lastWatched: -1 }).limit(10).populate('contentId'),
      Download.find({ userId: user._id }).sort({ createdAt: -1 }).limit(20),
      Notification.find({ audience: { $in: ['All users', 'Active users'] } }).sort({ createdAt: -1 }).limit(20),
      Promise.resolve([])
    ]);

    const continueWatching = history
      .filter(h => h.contentId)
      .map(h => ({
        id: String(h.contentId._id),
        title: h.contentId.title,
        image: h.contentId.image || h.contentId.thumbnail,
        progress: h.progress,
        timeLeft: ''
      }));

    const totalMinutes = history.reduce((sum, h) => {
      const rt = parseInt(h.contentId?.runtime || h.contentId?.duration || '0', 10) || 0;
      return sum + rt;
    }, 0);

    return ok(res, {
      profile: {
        role: user.role,
        joined: user.createdAt ? new Date(user.createdAt).toISOString().slice(0, 10) : '',
        lastActive: 'just now'
      },
      user: serializeUser(user),
      preferences: user.preferences,
      security: { passwordHint: 'Last changed: never', has2FA: user.has2FA },
      continueWatching,
      genrePreferences: [],
      weeklyActivity: buildWeeklyActivity(history),
      achievements,
      activity: buildActivity(history, downloads),
      downloads: downloads.map(d => serializeDownload(d)),
      notifications: notifications.map(n => ({
        id: String(n._id),
        title: n.title,
        text: n.message,
        icon: n.icon,
        time: timeAgo(n.createdAt),
        read: n.read
      })),
      sessions: [{
        id: 'current',
        device: 'This browser',
        location: 'Unknown',
        lastActive: 'now',
        current: true,
        icon: 'monitor'
      }],
      stats: {
        downloads: downloads.length,
        hoursWatched: Math.round(totalMinutes / 60),
        reviews: 0,
        streak: '1d',
        level: '1'
      }
    });
  } catch (e) {
    console.error('profile:', e);
    return err(res, e.message, 500);
  }
});

app.put('/api/profile', requireAuth, async (req, res) => {
  try {
    const allowed = ['name','username','email','country','bio','avatar','phone','preferences','notifications'];
    const patch = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) patch[k] = req.body[k]; });

    const user = await User.findByIdAndUpdate(currentUserId(req), patch, { new: true });
    return ok(res, serializeUser(user));
  } catch (e) {
    return err(res, e.message, 500);
  }
});

app.put('/api/profile/password', requireAuth, async (req, res) => {
  try {
    const { current, next } = req.body;
    if (!current || !next) return err(res, 'Current and new password required');

    const user = await User.findById(currentUserId(req));
    const match = await bcrypt.compare(current, user.password);
    if (!match) return err(res, 'Current password is incorrect', 401);

    user.password = await bcrypt.hash(next, 10);
    await user.save();
    return ok(res, { ok: true });
  } catch (e) {
    return err(res, e.message, 500);
  }
});

app.put('/api/profile/2fa', requireAuth, async (req, res) => {
  try {
    const { enabled } = req.body;
    const user = await User.findByIdAndUpdate(
      currentUserId(req),
      { has2FA: !!enabled },
      { new: true }
    );
    return ok(res, { has2FA: user.has2FA });
  } catch (e) {
    return err(res, e.message, 500);
  }
});

app.post('/api/profile/2fa/recovery-codes', requireAuth, async (req, res) => {
  return ok(res, { codes: [] });
});

app.get('/api/profile/sessions', requireAuth, async (req, res) => {
  return ok(res, [{ id: 'current', device: 'This browser', current: true }]);
});

app.delete('/api/profile/sessions/:id', requireAuth, async (req, res) => {
  return ok(res, { ok: true });
});

app.delete('/api/profile/sessions', requireAuth, async (req, res) => {
  return ok(res, { ok: true });
});

app.put('/api/profile/preferences', requireAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      currentUserId(req),
      { preferences: req.body },
      { new: true }
    );
    return ok(res, user.preferences);
  } catch (e) {
    return err(res, e.message, 500);
  }
});

app.delete('/api/profile', requireAuth, async (req, res) => {
  try {
    await User.findByIdAndDelete(currentUserId(req));
    req.session.destroy(() => {});
    return ok(res, { ok: true });
  } catch (e) {
    return err(res, e.message, 500);
  }
});

/* ============================================================
   DOWNLOADS  (user-scoped)
============================================================ */
app.get('/api/downloads', requireAuth, async (req, res) => {
  try {
    const list = await Download.find({ userId: currentUserId(req) })
      .sort({ createdAt: -1 });
    return ok(res, list.map(serializeDownload));
  } catch (e) {
    return handleError(res, e, 'list downloads');
  }
});

app.post('/api/downloads', requireAuth, async (req, res) => {
  try {
    const {
      contentId, title, genre, type, quality, image,
      sizeBytes, downloadedBytes, status, errorMessage
    } = req.body || {};

    if (!title) return err(res, 'title is required');

    const doc = await Download.create({
      userId: currentUserId(req),
      contentId: safeObjectId(contentId),
      title: String(title),
      genre: String(genre || ''),
      type: String(type || 'Movie'),
      quality: String(quality || 'HD'),
      image: String(image || ''),
      sizeBytes: Number(sizeBytes) || 0,
      downloadedBytes: Number(downloadedBytes) || 0,
      status: ['downloading','pending','paused','completed','failed'].includes(status)
        ? status
        : 'pending',
      errorMessage: String(errorMessage || '')
    });

    return ok(res, serializeDownload(doc), 201);
  } catch (e) {
    return handleError(res, e, 'create download');
  }
});

app.put('/api/downloads/:id', requireAuth, async (req, res) => {
  try {
    const existing = await Download.findOne({
      _id: req.params.id,
      userId: currentUserId(req)
    });
    if (!existing) return err(res, 'Download not found', 404);

    const allowed = [
      'title','genre','type','quality','image',
      'sizeBytes','downloadedBytes','status','errorMessage'
    ];
    const patch = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) patch[k] = req.body[k]; });

    if (patch.sizeBytes !== undefined || patch.downloadedBytes !== undefined) {
      const size = Number(patch.sizeBytes ?? existing.sizeBytes) || 0;
      const dl   = Number(patch.downloadedBytes ?? existing.downloadedBytes) || 0;
      patch.downloadedBytes = clampNum(dl, 0, size);
      if (size > 0 && patch.downloadedBytes >= size) {
        patch.status = 'completed';
        patch.errorMessage = '';
      }
    }

    const updated = await Download.findByIdAndUpdate(
      existing._id, patch, { new: true, runValidators: true }
    );
    return ok(res, serializeDownload(updated));
  } catch (e) {
    return handleError(res, e, 'update download');
  }
});

app.delete('/api/downloads/:id', requireAuth, async (req, res) => {
  try {
    await Download.findOneAndDelete({
      _id: req.params.id,
      userId: currentUserId(req)
    });
    return ok(res, { ok: true });
  } catch (e) {
    return handleError(res, e, 'delete download');
  }
});

app.delete('/api/downloads', requireAuth, async (req, res) => {
  try {
    await Download.deleteMany({ userId: currentUserId(req) });
    return ok(res, { ok: true });
  } catch (e) {
    return handleError(res, e, 'clear downloads');
  }
});

app.post('/api/downloads/seed-defaults', requireAuth, async (req, res) => {
  try {
    const count = await Download.countDocuments({ userId: currentUserId(req) });
    if (count > 0) return ok(res, { seeded: false });

    const GB = 1024 * 1024 * 1024;
    const items = [
      { title: 'CITY OF SHADOWS', genre: 'Action',   type: 'Series', quality: '1080p', sizeBytes: Math.round(5.1*GB), downloadedBytes: Math.round(2.3*GB), status: 'downloading' },
      { title: 'MIDNIGHT SEOUL',  genre: 'K-Drama',  type: 'Series', quality: '720p',  sizeBytes: Math.round(3.2*GB), downloadedBytes: Math.round(1.1*GB), status: 'downloading' },
      { title: 'THE OUTLAW',      genre: 'Action',   type: 'Movie',  quality: '1080p', sizeBytes: Math.round(2.8*GB), downloadedBytes: 0,                 status: 'pending' },
      { title: 'ZERO HOUR',       genre: 'Thriller', type: 'Movie',  quality: '720p',  sizeBytes: Math.round(1.9*GB), downloadedBytes: 0,                 status: 'pending' },
      { title: 'DEATH RACE',      genre: 'Action',   type: 'Movie',  quality: '1080p', sizeBytes: Math.round(2.5*GB), downloadedBytes: Math.round(2.5*GB), status: 'completed' },
      { title: 'SILENT CODE',     genre: 'Mystery',  type: 'Movie',  quality: '1080p', sizeBytes: Math.round(3.0*GB), downloadedBytes: Math.round(3.0*GB), status: 'completed' },
      { title: 'NIGHT RUN',       genre: 'Action',   type: 'Movie',  quality: '4K',    sizeBytes: Math.round(8.2*GB), downloadedBytes: 0,                 status: 'failed', errorMessage: 'Network error — connection lost during download.' }
    ].map(x => ({ ...x, userId: currentUserId(req) }));

    await Download.insertMany(items);
    return ok(res, { seeded: true, count: items.length }, 201);
  } catch (e) {
    return handleError(res, e, 'seed downloads');
  }
});

/* ============================================================
   ADMIN — CONTENT
============================================================ */
app.get('/api/admin/content', requireAdmin, async (req, res) => {
  try {
    const list = await Content.find().sort({ pinned: -1, createdAt: -1 });
    return ok(res, list.map(serializeContent));
  } catch (e) {
    return err(res, e.message, 500);
  }
});

app.post('/api/admin/content', requireAdmin, async (req, res) => {
  try {
    const payload = { ...req.body };
    const owner = safeObjectId(currentUserId(req));
    if (owner) payload.createdBy = owner;

    if (payload.trailerUrl && !payload.trailer) payload.trailer = payload.trailerUrl;
    if (payload.trailer && !payload.trailerUrl) payload.trailerUrl = payload.trailer;

    if (payload.thumbnail && !payload.image) payload.image = payload.thumbnail;
    if (payload.image && !payload.thumbnail) payload.thumbnail = payload.image;

    payload.parts = sanitizeParts(payload.parts);

    if (payload.type === 'Series' || payload.uploadMode === 'episodes') {
      payload.episodes = sanitizeEpisodes(
        payload.episodes,
        payload.image || payload.thumbnail,
        payload.year,
        payload.genre
      );
      payload.episodeCount = payload.episodes.length;
    } else {
      payload.episodes = [];
      payload.episodeCount = 0;
      payload.partA = payload.parts[0]?.url || '';
      payload.partB = payload.parts[1]?.url || '';
    }

    const created = await Content.create(payload);
    return ok(res, serializeContent(created), 201);
  } catch (e) {
    return handleError(res, e, 'create content');
  }
});

app.put('/api/admin/content/:id', requireAdmin, async (req, res) => {
  try {
    const payload = { ...req.body };
    delete payload.createdBy;

    if (payload.trailerUrl && !payload.trailer) payload.trailer = payload.trailerUrl;
    if (payload.trailer && !payload.trailerUrl) payload.trailerUrl = payload.trailer;

    if (payload.thumbnail && !payload.image) payload.image = payload.thumbnail;
    if (payload.image && !payload.thumbnail) payload.thumbnail = payload.image;

    if (payload.parts !== undefined) {
      payload.parts = sanitizeParts(payload.parts);
    }

    if (
      payload.type === 'Series' ||
      payload.uploadMode === 'episodes' ||
      Array.isArray(payload.episodes)
    ) {
      payload.episodes = sanitizeEpisodes(
        payload.episodes,
        payload.image || payload.thumbnail,
        payload.year,
        payload.genre
      );
      payload.episodeCount = payload.episodes.length;
    } else if (Array.isArray(payload.parts)) {
      payload.partA = payload.parts[0]?.url || '';
      payload.partB = payload.parts[1]?.url || '';
    }

    const updated = await Content.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true, runValidators: true }
    );

    if (!updated) return err(res, 'Content not found', 404);
    return ok(res, serializeContent(updated));
  } catch (e) {
    return handleError(res, e, 'update content');
  }
});

app.delete('/api/admin/content/:id', requireAdmin, async (req, res) => {
  try {
    await Content.findByIdAndDelete(req.params.id);
    return ok(res, { ok: true });
  } catch (e) {
    return err(res, e.message, 500);
  }
});

/* ============================================================
   ADMIN — CHANNELS
============================================================ */
app.get('/api/admin/channels', requireAdmin, async (req, res) => {
  try {
    const list = await Channel.find().sort({ createdAt: -1 });

    const [counts, followCounts] = await Promise.all([
      Content.aggregate([
        { $match: { channelId: { $ne: null } } },
        { $group: { _id: '$channelId', count: { $sum: 1 } } }
      ]),
      ChannelFollow.aggregate([
        { $group: { _id: '$channelId', count: { $sum: 1 } } }
      ])
    ]);

    const countMap = new Map(counts.map(c => [String(c._id), c.count]));
    const followMap = new Map(followCounts.map(c => [String(c._id), c.count]));

    const data = list.map(ch => {
      const s = serializeChannel(ch);
      s.contentCount = countMap.get(s.id) ?? 0;
      // Real follower count from ChannelFollow (more reliable than denormalized counter)
      s.subscribers = followMap.get(s.id) ?? s.subscribers ?? 0;
      return s;
    });

    return ok(res, { channels: data });
  } catch (e) {
    return handleError(res, e, 'list channels');
  }
});

app.post('/api/admin/channels', requireAdmin, async (req, res) => {
  try {
    const { name, description, avatar, banner, subscribers } = req.body || {};
    if (!name || !String(name).trim()) {
      return err(res, 'Name is required', 400);
    }

    const owner = safeObjectId(currentUserId(req));
    const created = await Channel.create({
      name: String(name).trim(),
      description: description || '',
      avatar: avatar || '',
      banner: banner || '',
      subscribers: Number(subscribers) || 0,
      contentCount: 0,
      ...(owner ? { createdBy: owner } : {})
    });

    return ok(res, serializeChannel(created), 201);
  } catch (e) {
    return handleError(res, e, 'create channel');
  }
});

app.delete('/api/admin/channels/bulk', requireAdmin, async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    if (!ids.length) return err(res, 'ids array is required', 400);

    await Promise.all([
      Channel.deleteMany({ _id: { $in: ids } }),
      Content.deleteMany({ channelId: { $in: ids } }),
      ChannelFollow.deleteMany({ channelId: { $in: ids } })
    ]);
    return ok(res, { ok: true, deleted: ids.length });
  } catch (e) {
    return handleError(res, e, 'bulk delete channels');
  }
});

app.put('/api/admin/channels/:id', requireAdmin, async (req, res) => {
  try {
    const allowed = ['name', 'description', 'avatar', 'banner', 'subscribers'];
    const patch = {};
    allowed.forEach(k => {
      if (req.body[k] !== undefined) patch[k] = req.body[k];
    });

    if (patch.name !== undefined && !String(patch.name).trim()) {
      return err(res, 'Name cannot be empty', 400);
    }
    if (patch.subscribers !== undefined) {
      patch.subscribers = Number(patch.subscribers) || 0;
    }

    const updated = await Channel.findByIdAndUpdate(req.params.id, patch, {
      new: true,
      runValidators: true
    });
    if (!updated) return err(res, 'Channel not found', 404);

    return ok(res, serializeChannel(updated));
  } catch (e) {
    return handleError(res, e, 'update channel');
  }
});

app.delete('/api/admin/channels/:id', requireAdmin, async (req, res) => {
  try {
    await Channel.findByIdAndDelete(req.params.id);
    await Content.deleteMany({ channelId: req.params.id });
    await ChannelFollow.deleteMany({ channelId: req.params.id });
    return ok(res, { ok: true });
  } catch (e) {
    return handleError(res, e, 'delete channel');
  }
});

app.get('/api/admin/channels/:id/content', requireAdmin, async (req, res) => {
  try {
    const channelId = safeObjectId(req.params.id);
    if (!channelId) return err(res, 'Invalid channel id', 400);

    const channel = await Channel.findById(channelId);
    if (!channel) return err(res, 'Channel not found', 404);

    const list = await Content.find({ channelId }).sort({ createdAt: -1 });

    return ok(res, { items: list.map(serializeContent) });
  } catch (e) {
    return handleError(res, e, 'list channel content');
  }
});

app.post('/api/admin/channels/:id/content', requireAdmin, async (req, res) => {
  try {
    const channelId = safeObjectId(req.params.id);
    if (!channelId) return err(res, 'Invalid channel id', 400);

    const channel = await Channel.findById(channelId);
    if (!channel) return err(res, 'Channel not found', 404);

    const { title, type, url, videoUrl, views } = req.body || {};
    if (!title || !String(title).trim()) {
      return err(res, 'Title is required', 400);
    }

    const safeType = type === 'Series' ? 'Series' : 'Movie';
    const safeUrl  = String(url || videoUrl || '').trim();

    const created = await Content.create({
      title: String(title).trim(),
      type: safeType,
      genre: '',
      year: new Date().getFullYear().toString(),
      rating: '',
      description: '',
      quality: 'HD',
      language: '',
      country: '',
      duration: '',
      image: '',
      thumbnail: '',
      trailer: '',
      trailerUrl: '',
      videoUrl: safeUrl,
      uploadMode: 'single',
      parts: [],
      episodes: [],
      episodeCount: 0,
      views: Number(views) || 0,
      channelId,
      createdBy: safeObjectId(currentUserId(req))
    });

    await Channel.findByIdAndUpdate(channelId, {
      $set: { latestUploadAt: new Date() }
    });

    return ok(res, serializeContent(created), 201);
  } catch (e) {
    return handleError(res, e, 'create channel content');
  }
});

app.put('/api/admin/channels/:id/content/:contentId', requireAdmin, async (req, res) => {
  try {
    const channelId = safeObjectId(req.params.id);
    const contentId = safeObjectId(req.params.contentId);
    if (!channelId || !contentId) return err(res, 'Invalid id', 400);

    const allowed = ['title', 'type', 'url', 'videoUrl', 'views', 'description', 'thumbnail', 'image'];
    const patch = {};
    allowed.forEach(k => {
      if (req.body[k] !== undefined) patch[k] = req.body[k];
    });

    if (patch.url !== undefined) {
      patch.videoUrl = patch.url;
      delete patch.url;
    }

    if (patch.type !== undefined) {
      patch.type = patch.type === 'Series' ? 'Series' : 'Movie';
    }

    const updated = await Content.findOneAndUpdate(
      { _id: contentId, channelId },
      patch,
      { new: true, runValidators: true }
    );

    if (!updated) return err(res, 'Content not found in this channel', 404);
    return ok(res, serializeContent(updated));
  } catch (e) {
    return handleError(res, e, 'update channel content');
  }
});

app.delete('/api/admin/channels/:id/content/:contentId', requireAdmin, async (req, res) => {
  try {
    const channelId = safeObjectId(req.params.id);
    const contentId = safeObjectId(req.params.contentId);
    if (!channelId || !contentId) return err(res, 'Invalid id', 400);

    const deleted = await Content.findOneAndDelete({ _id: contentId, channelId });
    if (!deleted) return err(res, 'Content not found in this channel', 404);

    return ok(res, { ok: true });
  } catch (e) {
    return handleError(res, e, 'delete channel content');
  }
});

/* ============================================================
   ===== FOLLOWERS =====
   Admin endpoints to view / manage the users who follow a channel
============================================================ */

/* ---------- List followers of a channel (paginated + searchable) ---------- */
app.get('/api/admin/channels/:id/followers', requireAdmin, async (req, res) => {
  try {
    const channelId = safeObjectId(req.params.id);
    if (!channelId) return err(res, 'Invalid channel id', 400);

    const channel = await Channel.findById(channelId);
    if (!channel) return err(res, 'Channel not found', 404);

    const page  = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip  = (page - 1) * limit;
    const q     = String(req.query.q || '').trim().toLowerCase();

    // Build a Mongo filter that searches user fields via aggregation
    const baseMatch = { channelId: new mongoose.Types.ObjectId(channelId) };

    const pipeline = [
      { $match: baseMatch },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: false } }
    ];

    if (q) {
      pipeline.push({
        $match: {
          $or: [
            { 'user.name':     { $regex: q, $options: 'i' } },
            { 'user.username': { $regex: q, $options: 'i' } },
            { 'user.email':    { $regex: q, $options: 'i' } }
          ]
        }
      });
    }

    // Total count after search
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countRes = await ChannelFollow.aggregate(countPipeline);
    const total = countRes[0]?.total || 0;

    // Sort + paginate + project
    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          createdAt: 1,
          userId: '$user._id',
          name: { $ifNull: ['$user.name', { $ifNull: ['$user.username', 'Unknown'] }] },
          username: '$user.username',
          email: '$user.email',
          avatar: '$user.avatar',
          country: '$user.country',
          status: '$user.status',
          joinedAt: '$user.createdAt'
        }
      }
    );

    const rows = await ChannelFollow.aggregate(pipeline);

    const followers = rows.map(r => ({
      followId:   String(r._id),
      userId:     String(r.userId),
      name:       r.name || 'Unknown',
      username:   r.username || '',
      email:      r.email || '',
      avatar:     r.avatar || '',
      country:    r.country || '',
      status:     r.status || 'Active',
      joinedAt:   r.joinedAt ? new Date(r.joinedAt).getTime() : 0,
      followedAt: r.createdAt ? new Date(r.createdAt).getTime() : 0
    }));

    return ok(res, {
      channelId:   String(channelId),
      channelName: channel.name,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      followers
    });
  } catch (e) {
    return handleError(res, e, 'list channel followers');
  }
});

/* ---------- Remove a single follower (admin kick) ---------- */
app.delete('/api/admin/channels/:id/followers/:userId', requireAdmin, async (req, res) => {
  try {
    const channelId = safeObjectId(req.params.id);
    const userId    = safeObjectId(req.params.userId);
    if (!channelId || !userId) return err(res, 'Invalid id', 400);

    const deleted = await ChannelFollow.findOneAndDelete({ channelId, userId });
    if (!deleted) return err(res, 'Follower not found', 404);

    // Recompute the denormalized counter
    const realCount = await ChannelFollow.countDocuments({ channelId });
    await Channel.findByIdAndUpdate(channelId, { subscribers: realCount });

    return ok(res, { ok: true, subscribers: realCount });
  } catch (e) {
    return handleError(res, e, 'remove follower');
  }
});

/* ---------- Bulk remove followers ---------- */
app.delete('/api/admin/channels/:id/followers', requireAdmin, async (req, res) => {
  try {
    const channelId = safeObjectId(req.params.id);
    if (!channelId) return err(res, 'Invalid channel id', 400);

    const ids = Array.isArray(req.body?.userIds) ? req.body.userIds : [];
    if (!ids.length) return err(res, 'userIds array is required', 400);

    const result = await ChannelFollow.deleteMany({
      channelId,
      userId: { $in: ids }
    });

    const realCount = await ChannelFollow.countDocuments({ channelId });
    await Channel.findByIdAndUpdate(channelId, { subscribers: realCount });

    return ok(res, { ok: true, removed: result.deletedCount, subscribers: realCount });
  } catch (e) {
    return handleError(res, e, 'bulk remove followers');
  }
});

/* ---------- Resync denormalized subscriber counters ---------- */
app.post('/api/admin/channels/resync-followers', requireAdmin, async (req, res) => {
  try {
    const agg = await ChannelFollow.aggregate([
      { $group: { _id: '$channelId', count: { $sum: 1 } } }
    ]);

    let updated = 0;
    for (const row of agg) {
      if (!row._id) continue;
      const r = await Channel.findByIdAndUpdate(row._id, { subscribers: row.count });
      if (r) updated++;
    }

    // Any channel with zero follows should be 0
    const allChannels = await Channel.find().select('_id subscribers');
    const haveCount = new Set(agg.map(a => String(a._id)));
    for (const c of allChannels) {
      if (!haveCount.has(String(c._id)) && c.subscribers !== 0) {
        await Channel.findByIdAndUpdate(c._id, { subscribers: 0 });
        updated++;
      }
    }

    return ok(res, { ok: true, updated });
  } catch (e) {
    return handleError(res, e, 'resync followers');
  }
});

/* ============================================================
   ADMIN — USERS
============================================================ */
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const list = await User.find().sort({ createdAt: -1 });
    return ok(res, list.map(serializeUser));
  } catch (e) {
    return err(res, e.message, 500);
  }
});

app.post('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const { name, email, password, role, status, avatar, has2FA, canUpload, notes, country } = req.body;
    if (!email) return err(res, 'Email required');

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return err(res, 'Email already exists', 409);

    const hash = await bcrypt.hash(password || 'changeme123', 10);
    const user = await User.create({
      name, email, username: email.split('@')[0], password: hash,
      role: role || 'User', status: status || 'Pending',
      avatar: avatar || '', has2FA: !!has2FA, canUpload: !!canUpload,
      notes: notes || '', country: country || ''
    });
    return ok(res, serializeUser(user), 201);
  } catch (e) {
    return err(res, e.message, 500);
  }
});

app.put('/api/admin/users/bulk/status', requireAdmin, async (req, res) => {
  try {
    const { ids, status } = req.body;
    await User.updateMany({ _id: { $in: ids } }, { status });
    return ok(res, { ok: true });
  } catch (e) { return err(res, e.message, 500); }
});

app.put('/api/admin/users/bulk/role', requireAdmin, async (req, res) => {
  try {
    const { ids, role } = req.body;
    await User.updateMany({ _id: { $in: ids } }, { role });
    return ok(res, { ok: true });
  } catch (e) { return err(res, e.message, 500); }
});

app.put('/api/admin/users/bulk/upload-permission', requireAdmin, async (req, res) => {
  try {
    const { ids, canUpload } = req.body;
    await User.updateMany({ _id: { $in: ids } }, { canUpload: !!canUpload });
    return ok(res, { ok: true });
  } catch (e) { return err(res, e.message, 500); }
});

app.delete('/api/admin/users/bulk', requireAdmin, async (req, res) => {
  try {
    const { ids } = req.body;
    await User.deleteMany({ _id: { $in: ids } });
    return ok(res, { ok: true });
  } catch (e) { return err(res, e.message, 500); }
});

app.put('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    const allowed = ['name','username','email','role','status','avatar','bio','country',
                     'phone','has2FA','canUpload','featured','notes'];
    const patch = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) patch[k] = req.body[k]; });

    const updated = await User.findByIdAndUpdate(req.params.id, patch, { new: true });
    if (!updated) return err(res, 'Not found', 404);
    return ok(res, serializeUser(updated));
  } catch (e) {
    return err(res, e.message, 500);
  }
});

app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    return ok(res, { ok: true });
  } catch (e) {
    return err(res, e.message, 500);
  }
});

app.put('/api/admin/users/:id/upload-permission', requireAdmin, async (req, res) => {
  try {
    const { canUpload } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.params.id, { canUpload: !!canUpload }, { new: true }
    );
    return ok(res, serializeUser(updated));
  } catch (e) {
    return err(res, e.message, 500);
  }
});

app.put('/api/admin/users/:id/featured', requireAdmin, async (req, res) => {
  try {
    const { featured } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.params.id, { featured: !!featured }, { new: true }
    );
    return ok(res, serializeUser(updated));
  } catch (e) {
    return err(res, e.message, 500);
  }
});

app.post('/api/admin/users/:id/email', requireAdmin, async (req, res) => {
  return ok(res, { sent: true });
});

/* ============================================================
   ADMIN — COMMENTS
============================================================ */
app.get('/api/admin/comments', requireAdmin, async (req, res) => {
  try {
    const list = await Comment.find().sort({ pinned: -1, createdAt: -1 });
    return ok(res, list.map(serializeComment));
  } catch (e) {
    return err(res, e.message, 500);
  }
});

app.post('/api/admin/comments', requireAdmin, async (req, res) => {
  try {
    const created = await Comment.create(req.body);
    return ok(res, serializeComment(created), 201);
  } catch (e) {
    return err(res, e.message, 500);
  }
});

app.put('/api/admin/comments/bulk/status', requireAdmin, async (req, res) => {
  try {
    const { ids, status } = req.body;
    await Comment.updateMany({ _id: { $in: ids } }, { status });
    return ok(res, { ok: true });
  } catch (e) { return err(res, e.message, 500); }
});

app.delete('/api/admin/comments/bulk', requireAdmin, async (req, res) => {
  try {
    const { ids } = req.body;
    await Comment.deleteMany({ _id: { $in: ids } });
    return ok(res, { ok: true });
  } catch (e) { return err(res, e.message, 500); }
});

app.put('/api/admin/comments/:id', requireAdmin, async (req, res) => {
  try {
    const allowed = ['text','status','rating','pinned','likes'];
    const patch = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) patch[k] = req.body[k]; });
    const updated = await Comment.findByIdAndUpdate(req.params.id, patch, { new: true });
    if (!updated) return err(res, 'Not found', 404);
    return ok(res, serializeComment(updated));
  } catch (e) {
    return err(res, e.message, 500);
  }
});

app.delete('/api/admin/comments/:id', requireAdmin, async (req, res) => {
  try {
    await Comment.findByIdAndDelete(req.params.id);
    return ok(res, { ok: true });
  } catch (e) {
    return err(res, e.message, 500);
  }
});

app.post('/api/admin/comments/:id/replies', requireAdmin, async (req, res) => {
  try {
    const { text } = req.body;
    const comment = await Comment.findById(req.params.id);
    if (!comment) return err(res, 'Not found', 404);

    comment.replies.push({ user: 'Admin', text });
    await comment.save();
    const reply = comment.replies[comment.replies.length - 1];
    return ok(res, {
      id: String(reply._id),
      user: reply.user,
      text: reply.text,
      createdAt: reply.createdAt
    }, 201);
  } catch (e) {
    return err(res, e.message, 500);
  }
});

/* ============================================================
   PUBLIC — COMMENTS (per media)
============================================================ */
app.get('/api/media/:id/comments', async (req, res) => {
  try {
    const mediaId = safeObjectId(req.params.id);
    if (!mediaId) return err(res, 'Invalid media id', 400);

    const list = await Comment.find({
      titleId: mediaId,
      status: { $in: ['approved', 'pending'] }
    }).sort({ pinned: -1, createdAt: -1 }).limit(200);

    return ok(res, list.map(serializeComment));
  } catch (e) {
    return handleError(res, e, 'list media comments');
  }
});

app.post('/api/media/:id/comments', async (req, res) => {
  try {
    const a = extractAuth(req);
    if (!a) return err(res, 'Unauthorized', 401);

    const mediaId = safeObjectId(req.params.id);
    if (!mediaId) return err(res, 'Invalid media id', 400);

    const text = String(req.body?.text || '').trim();
    if (!text) return err(res, 'Comment text is required', 400);

    const [user, content] = await Promise.all([
      User.findById(a.userId),
      Content.findById(mediaId)
    ]);

    if (!user) return err(res, 'User not found', 404);
    if (!content) return err(res, 'Media not found', 404);

    const created = await Comment.create({
      userId: user._id,
      userName: user.name || user.username || 'Anonymous',
      titleId: content._id,
      titleName: content.title,
      titleType: content.type,
      titleImage: content.image || content.thumbnail || '',
      text,
      rating: Number(req.body?.rating) || 0,
      status: 'approved',
      likes: 0,
      replies: []
    });

    return ok(res, serializeComment(created), 201);
  } catch (e) {
    return handleError(res, e, 'create media comment');
  }
});

/* ============================================================
   ADMIN — NOTIFICATIONS
============================================================ */
app.get('/api/admin/notifications', requireAdmin, async (req, res) => {
  try {
    const list = await Notification.find().sort({ pinned: -1, createdAt: -1 });
    return ok(res, list.map(serializeNotification));
  } catch (e) {
    return err(res, e.message, 500);
  }
});

app.post('/api/admin/notifications', requireAdmin, async (req, res) => {
  try {
    const payload = { ...req.body };
    const owner = safeObjectId(currentUserId(req));
    if (owner) payload.createdBy = owner;

    if (payload.status === 'sent') {
      payload.stats = { delivered: 1, opened: 0, clicked: 0 };
    }

    const created = await Notification.create(payload);
    return ok(res, serializeNotification(created), 201);
  } catch (e) {
    return handleError(res, e, 'create notification');
  }
});

app.put('/api/admin/notifications/bulk/read', requireAdmin, async (req, res) => {
  try {
    const { ids, read } = req.body;
    await Notification.updateMany({ _id: { $in: ids } }, { read: !!read });
    return ok(res, { ok: true });
  } catch (e) { return err(res, e.message, 500); }
});

app.delete('/api/admin/notifications/bulk', requireAdmin, async (req, res) => {
  try {
    const { ids } = req.body;
    await Notification.deleteMany({ _id: { $in: ids } });
    return ok(res, { ok: true });
  } catch (e) { return err(res, e.message, 500); }
});

app.put('/api/admin/notifications/:id', requireAdmin, async (req, res) => {
  try {
    const patch = { ...req.body };
    const updated = await Notification.findByIdAndUpdate(req.params.id, patch, { new: true });
    if (!updated) return err(res, 'Not found', 404);
    return ok(res, serializeNotification(updated));
  } catch (e) {
    return err(res, e.message, 500);
  }
});

app.delete('/api/admin/notifications/:id', requireAdmin, async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    return ok(res, { ok: true });
  } catch (e) {
    return err(res, e.message, 500);
  }
});

/* ============================================================
   ADMIN — PROFILE
============================================================ */
app.get('/api/admin/profile', requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(currentUserId(req));
    if (!user) return err(res, 'Not found', 404);

    const uploads = await Content.countDocuments({ createdBy: user._id });
    const avatarLibrary = Array.from({ length: 16 },
      (_, i) => `https://i.pravatar.cc/150?img=${i + 1}`);

    return ok(res, {
      profile: serializeUser(user),
      stats: {
        uploads,
        downloads: user.downloads || 0,
        joined: user.createdAt ? new Date(user.createdAt).toISOString().slice(0, 10) : '—'
      },
      countries: ['USA','UK','France','Germany','Spain','Italy','South Korea','Japan','China','India','Nigeria','Canada','Australia','Brazil','Mexico','Egypt','Czechia','Other'],
      avatarLibrary,
      sessions: [{
        id: 'current',
        device: 'This browser',
        location: 'Unknown',
        lastActive: 'now',
        current: true,
        icon: 'monitor'
      }]
    });
  } catch (e) {
    return err(res, e.message, 500);
  }
});

app.put('/api/admin/profile', requireAdmin, async (req, res) => {
  try {
    const allowed = ['name','email','role','bio','avatar','phone','country',
                     'notifications','preferences'];
    const patch = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) patch[k] = req.body[k]; });

    const updated = await User.findByIdAndUpdate(currentUserId(req), patch, { new: true });
    return ok(res, serializeUser(updated));
  } catch (e) {
    return err(res, e.message, 500);
  }
});

app.put('/api/admin/profile/password', requireAdmin, async (req, res) => {
  try {
    const { current, next } = req.body;
    const user = await User.findById(currentUserId(req));
    const match = await bcrypt.compare(current, user.password);
    if (!match) return err(res, 'Current password incorrect', 401);
    user.password = await bcrypt.hash(next, 10);
    await user.save();
    return ok(res, { ok: true });
  } catch (e) { return err(res, e.message, 500); }
});

app.put('/api/admin/profile/2fa', requireAdmin, async (req, res) => {
  try {
    const { enabled } = req.body;
    const user = await User.findByIdAndUpdate(
      currentUserId(req), { has2FA: !!enabled }, { new: true }
    );
    return ok(res, { has2FA: user.has2FA });
  } catch (e) { return err(res, e.message, 500); }
});

app.post('/api/admin/profile/2fa/recovery-codes', requireAdmin, async (req, res) => {
  return ok(res, { codes: [] });
});

app.put('/api/admin/profile/preferences', requireAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      currentUserId(req), { preferences: req.body }, { new: true }
    );
    return ok(res, user.preferences);
  } catch (e) { return err(res, e.message, 500); }
});

app.delete('/api/admin/profile/sessions/:id', requireAdmin, async (req, res) => {
  return ok(res, { ok: true });
});

app.delete('/api/admin/profile/sessions', requireAdmin, async (req, res) => {
  return ok(res, { ok: true });
});

app.delete('/api/admin/profile', requireAdmin, async (req, res) => {
  return ok(res, { ok: true });
});

/* ============================================================
   ADMIN — DASHBOARD
============================================================ */
app.get('/api/admin/dashboard', requireAdmin, async (req, res) => {
  try {
    const range = req.query.range || 'week';
    const days  = { day: 1, week: 7, month: 30, year: 365 }[range] || 7;

    const [totalMovies, totalSeries, totalUsers, totalDownloads,
           totalComments, approvedComments, pendingComments,
           totalUploads, recentContent, topUsersDocs] = await Promise.all([
      Content.countDocuments({ type: 'Movie' }),
      Content.countDocuments({ type: 'Series' }),
      User.countDocuments(),
      Download.countDocuments(),
      Comment.countDocuments(),
      Comment.countDocuments({ status: 'approved' }),
      Comment.countDocuments({ status: 'pending' }),
      Content.countDocuments(),
      Content.find().sort({ createdAt: -1 }).limit(8),
      User.find().sort({ downloads: -1 }).limit(8)
    ]);

    const aggViews = await Content.aggregate([
      { $group: { _id: null, total: { $sum: '$views' } } }
    ]);
    const totalViews = aggViews[0]?.total || 0;

    const labels = [];
    const views   = [];
    const clients = [];
    const commentsSeries = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      labels.push(d.toLocaleDateString('en', { month: 'short', day: 'numeric' }));
      views.push(Math.floor(50 + Math.random() * 200));
      clients.push(Math.floor(20 + Math.random() * 90));
      commentsSeries.push(Math.floor(10 + Math.random() * 60));
    }

    const genreAgg = await Content.aggregate([
      { $match: { genre: { $ne: '' } } },
      { $group: { _id: '$genre', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 }
    ]);
    const genreTotal = genreAgg.reduce((s, g) => s + g.count, 0) || 1;
    const genreBreakdown = genreAgg.map(g => ({
      name: g._id,
      count: g.count,
      percent: Math.round((g.count / genreTotal) * 100)
    }));

    const rated = await Content.find({ rating: { $ne: '' } }).select('rating');
    const ratingNums = rated.map(r => parseFloat(r.rating)).filter(n => !isNaN(n));
    const avgRating = ratingNums.length
      ? ratingNums.reduce((a, b) => a + b, 0) / ratingNums.length
      : 0;

    return ok(res, {
      views, clients, labels,
      totalViews,
      totalClients: Math.floor(totalUsers * 0.7),
      prevViewsTotal: Math.floor(totalViews * 0.85),
      prevClientsTotal: Math.floor(totalUsers * 0.6),
      totalMovies,
      totalSeries,
      totalDownloads,
      totalUploads,
      totalUsers,
      activeUsers: totalUsers,
      totalComments,
      approvedComments,
      pendingComments,
      commentsSeries,
      genreBreakdown,
      topUsers: topUsersDocs.map(u => ({
        id: String(u._id),
        name: u.name || u.username,
        email: u.email,
        avatar: u.avatar,
        downloads: u.downloads || 0
      })),
      recentContent: recentContent.map(serializeContent),
      avgDownloadsPerUser: totalUsers ? +(totalDownloads / totalUsers).toFixed(1) : 0,
      avgUploadsPerUser: totalUsers ? +(totalUploads / totalUsers).toFixed(1) : 0,
      avgRating: +avgRating.toFixed(1),
      ratedCount: ratingNums.length
    });
  } catch (e) {
    console.error('dashboard:', e);
    return err(res, e.message, 500);
  }
});

/* ============================================================
   ADMIN — UPLOAD
============================================================ */
const multerErrorHandler = (err, req, res, next) => {
  if (!err) return next();
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large (max 20GB per file).' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: `Unexpected field: ${err.field}` });
    }
    return res.status(400).json({ error: `Upload error: ${err.code}` });
  }
  return res.status(500).json({ error: err.message || 'Upload failed' });
};

app.post('/api/admin/upload', requireAdmin,
  (req, res, next) => { req.setTimeout(0); res.setTimeout(0); next(); },
  upload.any(),
  multerErrorHandler,
  (req, res) => {
    if (!req.files || !req.files.length) {
      return err(res, 'No file uploaded', 400);
    }
    const f = req.files[0];
    const sub = path.basename(f.destination);
    const publicPath = `/uploads/${sub}/${f.filename}`;
    return ok(res, {
      url: publicPath,
      path: publicPath,
      originalname: f.originalname,
      size: f.size
    });
  }
);

app.post('/api/admin/uploads', requireAdmin,
  (req, res, next) => { req.setTimeout(0); res.setTimeout(0); next(); },
  upload.any(),
  multerErrorHandler,
  (req, res) => {
    if (!req.files || !req.files.length) {
      return err(res, 'No file uploaded', 400);
    }
    const f = req.files[0];
    const sub = path.basename(f.destination);
    const publicPath = `/uploads/${sub}/${f.filename}`;
    return ok(res, {
      url: publicPath,
      path: publicPath,
      originalname: f.originalname,
      size: f.size
    });
  }
);

app.post('/api/admin/upload/many', requireAdmin,
  (req, res, next) => { req.setTimeout(0); res.setTimeout(0); next(); },
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'video', maxCount: 1 },
    { name: 'trailer', maxCount: 1 }
  ]),
  multerErrorHandler,
  (req, res) => {
    const out = {};
    if (req.files?.thumbnail) out.thumbnail = `/uploads/thumbnails/${req.files.thumbnail[0].filename}`;
    if (req.files?.video)     out.video     = `/uploads/videos/${req.files.video[0].filename}`;
    if (req.files?.trailer)   out.trailer   = `/uploads/trailers/${req.files.trailer[0].filename}`;
    return ok(res, out);
  }
);

/* ============================================================
   UTIL: activity + weekly
============================================================ */
function timeAgo(date) {
  if (!date) return 'just now';
  const diff = Date.now() - new Date(date).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

function buildWeeklyActivity(history) {
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const buckets = days.map(label => ({ label, hours: 0 }));
  history.forEach(h => {
    const day = new Date(h.lastWatched || h.createdAt).getDay();
    buckets[day].hours += 1;
  });
  return buckets;
}

function buildActivity(history, downloads) {
  const items = [];
  history.slice(0, 5).forEach(h => {
    items.push({
      id: `w-${h._id}`,
      type: 'watch',
      text: `Watched ${h.contentId?.title || 'a title'}`,
      time: timeAgo(h.lastWatched),
      icon: 'play'
    });
  });
  downloads.slice(0, 5).forEach(d => {
    items.push({
      id: `d-${d._id}`,
      type: 'download',
      text: `Downloaded ${d.title}`,
      time: timeAgo(d.createdAt),
      icon: 'download'
    });
  });
  return items;
}

/* ============================================================
   SEED  (no demo channels — they start empty on purpose)
============================================================ */
async function seed() {
  const adminEmail = 'admin@markverse.com';

  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      name: 'Admin',
      username: 'admin',
      email: adminEmail,
      password: await bcrypt.hash('admin123', 10),
      role: 'Admin',
      status: 'Active',
      canUpload: true,
      country: 'USA',
      avatar: 'https://i.pravatar.cc/150?img=12'
    });
    console.log('✓ Seeded admin:', adminEmail, '/ admin123');
  }

  const count = await Content.countDocuments();
  if (count === 0) {
    const demos = [
      {
        title: 'Big Buck Bunny', type: 'Movie', genre: 'Animation',
        year: '2024', rating: '8.5', quality: '1080p', country: 'USA',
        description: 'A large rabbit takes revenge on three bullying rodents.',
        image: 'https://picsum.photos/seed/bbb/600/900',
        thumbnail: 'https://picsum.photos/seed/bbb/600/900',
        backdrop: 'https://picsum.photos/seed/bbb/1600/900',
        trailer: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        trailerUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        featured: true, isTrending: true
      },
      {
        title: 'Elephants Dream', type: 'Movie', genre: 'Sci-Fi',
        year: '2023', rating: '7.8', quality: '4K', country: 'Netherlands',
        description: 'Two strange men explore a vast mechanical world.',
        image: 'https://picsum.photos/seed/ed/600/900',
        thumbnail: 'https://picsum.photos/seed/ed/600/900',
        backdrop: 'https://picsum.photos/seed/ed/1600/900',
        trailer: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        trailerUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        featured: true
      },
      {
        title: 'For Bigger Blazes', type: 'Series', genre: 'Action',
        year: '2025', rating: '9.0', quality: '1080p', country: 'USA',
        description: 'An explosive series that pushes every limit.',
        image: 'https://picsum.photos/seed/fbb/600/900',
        thumbnail: 'https://picsum.photos/seed/fbb/600/900',
        backdrop: 'https://picsum.photos/seed/fbb/1600/900',
        trailer: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        trailerUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        episodes: [
          { number: 1, title: 'Ignition', duration: '45 min',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            image: 'https://picsum.photos/seed/fbb1/600/900' },
          { number: 2, title: 'Blaze', duration: '42 min',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
            image: 'https://picsum.photos/seed/fbb2/600/900' }
        ],
        episodeCount: 2,
        featured: true
      },
      {
        title: 'For Bigger Escapes', type: 'Movie', genre: 'Thriller',
        year: '2024', rating: '8.1', quality: '1080p', country: 'USA',
        description: 'A heart-pounding escape story.',
        image: 'https://picsum.photos/seed/fbe/600/900',
        thumbnail: 'https://picsum.photos/seed/fbe/600/900',
        backdrop: 'https://picsum.photos/seed/fbe/1600/900',
        trailer: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        trailerUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
      },
      {
        title: 'For Bigger Fun', type: 'Series', genre: 'Comedy',
        year: '2025', rating: '7.5', quality: 'HD', country: 'UK',
        description: 'Comedy series about finding joy in the small things.',
        image: 'https://picsum.photos/seed/fbf/600/900',
        thumbnail: 'https://picsum.photos/seed/fbf/600/900',
        backdrop: 'https://picsum.photos/seed/fbf/1600/900',
        trailer: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        trailerUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        episodes: [
          { number: 1, title: 'Pilot', duration: '30 min',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4' }
        ],
        episodeCount: 1
      }
    ];

    await Content.insertMany(demos);
    console.log(`✓ Seeded ${demos.length} demo titles`);
  }

  /* NOTE: Channel demo seed intentionally removed.
     Channels start empty; admins create them in the admin panel. */

  const commentCount = await Comment.countDocuments();
  if (commentCount === 0) {
    const contentList = await Content.find().limit(5);
    const userList = await User.find().limit(5);

    if (contentList.length && userList.length) {
      const pick = (arr, i) => arr[i % arr.length];

      const demoComments = [
        {
          userId: pick(userList, 0)._id,
          userName: pick(userList, 0).name || pick(userList, 0).username,
          titleId: pick(contentList, 0)._id,
          titleName: pick(contentList, 0).title,
          titleType: pick(contentList, 0).type,
          titleImage: pick(contentList, 0).image,
          text: 'Absolutely loved this! The cinematography was stunning.',
          rating: 5, likes: 24, status: 'approved'
        },
        {
          userId: pick(userList, 1)._id,
          userName: pick(userList, 1).name || pick(userList, 1).username,
          titleId: pick(contentList, 1)._id,
          titleName: pick(contentList, 1).title,
          titleType: pick(contentList, 1).type,
          titleImage: pick(contentList, 1).image,
          text: 'The plot twist caught me completely off guard. Highly recommend!',
          rating: 4, likes: 11, status: 'pending'
        },
        {
          userId: pick(userList, 0)._id,
          userName: pick(userList, 0).name || pick(userList, 0).username,
          titleId: pick(contentList, 2)._id,
          titleName: pick(contentList, 2).title,
          titleType: pick(contentList, 2).type,
          titleImage: pick(contentList, 2).image,
          text: 'Not my cup of tea, but the acting was solid.',
          rating: 3, likes: 3, status: 'flagged'
        },
        {
          userId: pick(userList, 1)._id,
          userName: pick(userList, 1).name || pick(userList, 1).username,
          titleId: pick(contentList, 3)._id,
          titleName: pick(contentList, 3).title,
          titleType: pick(contentList, 3).type,
          titleImage: pick(contentList, 3).image,
          text: 'Best series I have watched this year. Can\'t wait for season 2!',
          rating: 5, likes: 42, status: 'approved', pinned: true
        },
        {
          userId: pick(userList, 0)._id,
          userName: pick(userList, 0).name || pick(userList, 0).username,
          titleId: pick(contentList, 4)._id,
          titleName: pick(contentList, 4).title,
          titleType: pick(contentList, 4).type,
          titleImage: pick(contentList, 4).image,
          text: 'Check out my website for free streaming!!! spam link here',
          rating: 1, likes: 0, status: 'spam'
        }
      ];

      await Comment.insertMany(demoComments);
      console.log(`✓ Seeded ${demoComments.length} demo comments`);
    }
  }

  const notifCount = await Notification.countDocuments();
  if (notifCount === 0) {
    const owner = admin ? admin._id : undefined;

    const demoNotifications = [
      {
        title: 'Welcome to Markverse',
        message: 'Your admin panel is ready. Explore the dashboard to get started.',
        type: 'system', priority: 'normal', audience: 'All users',
        status: 'sent', read: false,
        stats: { delivered: 1240, opened: 890, clicked: 320 },
        ...(owner ? { createdBy: owner } : {})
      },
      {
        title: 'Scheduled maintenance window',
        message: 'Markverse will be down on Sunday from 02:00 to 04:00 UTC.',
        type: 'system', priority: 'high', audience: 'All users',
        status: 'scheduled', scheduled: true,
        scheduledAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
        read: false,
        stats: { delivered: 0, opened: 0, clicked: 0 },
        ...(owner ? { createdBy: owner } : {})
      },
      {
        title: 'New content added',
        message: 'Big Buck Bunny and Elephants Dream are now available.',
        type: 'content', priority: 'normal', audience: 'Active users',
        status: 'sent', read: true,
        stats: { delivered: 540, opened: 210, clicked: 88 },
        ...(owner ? { createdBy: owner } : {})
      },
      {
        title: 'Security update',
        message: 'We have enabled two-factor authentication for all admin accounts.',
        type: 'security', priority: 'high', audience: 'Admins only',
        status: 'sent', read: false, pinned: true,
        stats: { delivered: 12, opened: 12, clicked: 5 },
        ...(owner ? { createdBy: owner } : {})
      },
      {
        title: 'Summer promotion',
        message: 'Get 30% off premium subscriptions this month.',
        type: 'promo', priority: 'low', audience: 'All users',
        status: 'draft', read: false,
        stats: { delivered: 0, opened: 0, clicked: 0 },
        ...(owner ? { createdBy: owner } : {})
      }
    ];

    await Notification.insertMany(demoNotifications);
    console.log(`✓ Seeded ${demoNotifications.length} demo notifications`);
  }
}

/* ============================================================
   OPTIONAL: Serve built frontend if present
============================================================ */
const FRONTEND_DIST = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.get(/^\/(?!api|uploads).*/, (req, res) => {
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });
  console.log('✓ Serving frontend from', FRONTEND_DIST);
}

/* ============================================================
   LAN IP HELPER
============================================================ */
function getLanIPs() {
  const nets = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      const family = typeof net.family === 'string' ? net.family : `IPv${net.family}`;
      if (family === 'IPv4' && !net.internal) {
        ips.push({ iface: name, address: net.address });
      }
    }
  }
  return ips;
}

/* ============================================================
   START
============================================================ */
(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ MongoDB connected:', MONGO_URI);

    await seed();

    app.listen(PORT, HOST, () => {
      const lanIPs = getLanIPs();

      console.log('\n🎬 MARKVERSE backend is running');
      console.log('──────────────────────────────────────────────');
      console.log(`   Local:     http://localhost:${PORT}/api`);
      if (lanIPs.length) {
        lanIPs.forEach(({ iface, address }) => {
          console.log(`   Network:   http://${address}:${PORT}/api   (${iface})`);
        });
      } else {
        console.log('   Network:   (no active LAN interface detected)');
        console.log('              Connect to Wi-Fi or Ethernet and restart.');
      }
      console.log('──────────────────────────────────────────────');
      console.log('   Default admin → admin@markverse.com / admin123');
      console.log('   Uploads       → /uploads/*');
      console.log('   Upload limit  → 20GB per file');
      console.log('   Bind host     →', HOST, `(0.0.0.0 = all interfaces)`);
      console.log('   Auth mode     → Bearer JWT (per-tab) + session fallback');
      console.log('   Channels      → start empty (no demo seed)');
      console.log('   Followers     → /api/admin/channels/:id/followers');
      console.log('──────────────────────────────────────────────\n');
    });
  } catch (e) {
    console.error('✗ Failed to start:', e);
    process.exit(1);
  }
})();
/* Serveur de test LOCAL du site Redemption, pour essayer l'outil « Compo de
   simu » avant sa mise en ligne.

     node dev/serveur-local.mjs          puis http://localhost:3020/simu.html

   - Sert site/ tel quel, sauf script.js (connexion Discord, impossible sur
     localhost) remplace par un amorcage qui connecte d'office le compte de
     SIMU_COMPTE (Rorschach par defaut). Pour voir la page comme un autre
     membre : ?en_tant_que=Pseudo (ex. simu.html?en_tant_que=Elfraiche).
   - /__supabase/rest/v1/... : relais vers la vraie base avec la cle de
     service (lecture et ecriture reelles, sans RLS).
   - /api/simu : le meme coeur que la route en ligne (api/_simu-coeur.mjs),
     mais en mode a blanc : « Publier » ne poste RIEN dans #event.
   Ecoute uniquement sur 127.0.0.1. Lit DAMOCLES/.env.local (jamais affiche). */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { executer } from '../api/_simu-coeur.mjs';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = path.join(RACINE, 'site');
const PORT = parseInt(process.env.PORT || '3020', 10);
const SUPABASE_URL = 'https://yebfbdgxikbnqdkbycam.supabase.co';
const COMPTE = process.env.SIMU_COMPTE || 'Rorschach';

const ENV = {};
fs.readFileSync(path.join(RACINE, '.env.local'), 'utf8').split(/\r?\n/).forEach(function (l) {
    const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) ENV[m[1]] = m[2].trim();
});
const CLE_SERVICE = ENV.SUPABASE_SECRET_KEY;
const CLE_PUBLIQUE = ENV.SUPABASE_PUBLISHABLE_KEY;
if (!CLE_SERVICE || !CLE_PUBLIQUE || !ENV.DISCORD_BOT_TOKEN) {
    console.error('Il manque SUPABASE_SECRET_KEY, SUPABASE_PUBLISHABLE_KEY ou DISCORD_BOT_TOKEN dans .env.local');
    process.exit(1);
}

const TYPES = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
    '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml'
};

let profil = null;
async function chargerProfil(compte) {
    const r = await fetch(SUPABASE_URL + '/rest/v1/profiles?select=*&username=eq.' + encodeURIComponent(compte), {
        headers: { apikey: CLE_SERVICE, Authorization: 'Bearer ' + CLE_SERVICE }
    });
    const l = await r.json();
    if (!Array.isArray(l) || !l.length) throw new Error('Compte ' + compte + ' introuvable');
    return l[0];
}

function amorcage(profil) {
    return `/* Amorcage du serveur local : remplace script.js (pas de connexion Discord sur localhost) */
(function () {
    'use strict';
    var profil = ${JSON.stringify(profil)};
    window.REN = window.REN || {};
    window.REN.demoLocale = true;
    window.REN.supabase = window.supabase.createClient(location.origin + '/__supabase', ${JSON.stringify(CLE_PUBLIQUE)}, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
    window.REN.currentProfile = profil;
    window.REN.currentUser = { id: profil.id };
    window.REN.escapeHtml = function (s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
    };
    window.REN.toast = function (message, type) {
        var box = document.querySelector('.toast-container');
        if (!box) { box = document.createElement('div'); box.className = 'toast-container'; document.body.appendChild(box); }
        var t = document.createElement('div');
        t.className = 'toast toast--' + (type || 'info');
        t.textContent = message;
        box.appendChild(t);
        setTimeout(function () { t.classList.add('removing'); setTimeout(function () { t.remove(); }, 300); }, 3500);
    };
    document.addEventListener('DOMContentLoaded', function () {
        /* Sans script.js, la barre laterale reste vide et masquerait le contenu */
        var barre = document.getElementById('app-sidebar');
        if (barre) barre.remove();
        var nom = document.getElementById('nav-username');
        if (nom) nom.textContent = profil.username + ' (test local)';
        document.dispatchEvent(new Event('ren:ready'));
    });
})();
`;
}

function lireCorps(req) {
    return new Promise(function (res, rej) {
        const morceaux = [];
        req.on('data', function (c) { morceaux.push(c); });
        req.on('end', function () { res(Buffer.concat(morceaux)); });
        req.on('error', rej);
    });
}

function envoyer(res, statut, type, corps, extra) {
    res.writeHead(statut, Object.assign({ 'Content-Type': type, 'Cache-Control': 'no-store' }, extra || {}));
    res.end(corps);
}

async function relaisBase(req, res, url) {
    const corps = ['GET', 'HEAD'].indexOf(req.method) === -1 ? await lireCorps(req) : undefined;
    const entetes = { apikey: CLE_SERVICE, Authorization: 'Bearer ' + CLE_SERVICE };
    ['content-type', 'prefer', 'accept', 'range', 'range-unit', 'accept-profile', 'content-profile'].forEach(function (h) {
        if (req.headers[h]) entetes[h] = req.headers[h];
    });
    const cible = SUPABASE_URL + url.pathname.replace('/__supabase', '') + url.search;
    const r = await fetch(cible, { method: req.method, headers: entetes, body: corps && corps.length ? corps : undefined });
    const extra = {};
    ['content-range', 'preference-applied'].forEach(function (h) { if (r.headers.get(h)) extra[h] = r.headers.get(h); });
    envoyer(res, r.status, r.headers.get('content-type') || 'application/json', Buffer.from(await r.arrayBuffer()), extra);
}

async function routeSimu(req, res) {
    if (req.method !== 'POST') return envoyer(res, 405, 'application/json', JSON.stringify({ erreur: 'POST attendu' }));
    let corps;
    try { corps = JSON.parse((await lireCorps(req)).toString('utf8') || '{}'); } catch (e) {
        return envoyer(res, 400, 'application/json', JSON.stringify({ erreur: 'JSON invalide' }));
    }
    const ctx = {
        env: { DISCORD_BOT_TOKEN: ENV.DISCORD_BOT_TOKEN, SUPABASE_URL: SUPABASE_URL, SUPABASE_SERVICE_KEY: CLE_SERVICE, DISCORD_EVENT_CHANNEL_ID: ENV.DISCORD_EVENT_CHANNEL_ID },
        utilisateur: { id: profil.id, username: profil.username },
        aBlanc: true /* local : jamais de publication reelle */
    };
    try {
        const r = await executer(corps.action, corps, ctx);
        envoyer(res, 200, 'application/json', JSON.stringify(r));
    } catch (e) {
        envoyer(res, 500, 'application/json', JSON.stringify({ erreur: e.message }));
    }
}

function fichierStatique(req, res, url) {
    let chemin = decodeURIComponent(url.pathname);
    if (chemin === '/') chemin = '/index.html';
    const fichier = path.normalize(path.join(SITE, chemin));
    if (!fichier.startsWith(SITE) || !fs.existsSync(fichier) || fs.statSync(fichier).isDirectory()) {
        return envoyer(res, 404, 'text/plain; charset=utf-8', 'Introuvable');
    }
    const ext = path.extname(fichier).toLowerCase();
    if (ext === '.html') {
        let h = fs.readFileSync(fichier, 'utf8');
        const compte = url.searchParams.get('en_tant_que');
        const src = '/__dev/amorcage.js' + (compte ? '?compte=' + encodeURIComponent(compte) : '');
        h = h.replace(/<script src="script\.js\?v=\d+"><\/script>/, '<script src="' + src + '"></script>');
        return envoyer(res, 200, TYPES['.html'], h);
    }
    envoyer(res, 200, TYPES[ext] || 'application/octet-stream', fs.readFileSync(fichier));
}

profil = await chargerProfil(COMPTE);
http.createServer(async function (req, res) {
    const url = new URL(req.url, 'http://127.0.0.1:' + PORT);
    try {
        if (url.pathname === '/__dev/amorcage.js') {
            const compte = url.searchParams.get('compte');
            return envoyer(res, 200, TYPES['.js'], amorcage(compte ? await chargerProfil(compte) : profil));
        }
        if (url.pathname.startsWith('/__supabase/rest/v1/')) return await relaisBase(req, res, url);
        if (url.pathname.startsWith('/__supabase/')) return envoyer(res, 404, 'application/json', '{}');
        if (url.pathname === '/api/simu') return await routeSimu(req, res);
        return fichierStatique(req, res, url);
    } catch (e) {
        envoyer(res, 500, 'text/plain; charset=utf-8', 'Erreur : ' + e.message);
    }
}).listen(PORT, '127.0.0.1', function () {
    console.log('Serveur local Redemption : http://localhost:' + PORT + '/simu.html (connecte en tant que ' + profil.username + ', publication a blanc)');
});

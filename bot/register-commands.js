/* Enregistre les commandes slash du bot Redemption aupres de Discord.
   A lancer par Mathieu, en local, avec le token du bot (SECRET, jamais commit) :

     DISCORD_APP_ID=1549725206128492605 DISCORD_BOT_TOKEN=<ton_token> node bot/register-commands.js

   Optionnel : DISCORD_GUILD_ID=<id_du_serveur> pour un enregistrement instantane
   sur le serveur (sinon global, propagation jusqu'a ~1h).
   Pour recuperer l'ID du serveur : Discord > clic droit sur le serveur > Copier l'identifiant
   (le mode developpeur doit etre active dans les parametres Discord).
*/

const APP_ID = process.env.DISCORD_APP_ID;
const TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID || null;

if (!APP_ID || !TOKEN) {
    console.error('Manque DISCORD_APP_ID ou DISCORD_BOT_TOKEN en variable d\'environnement.');
    process.exit(1);
}

/* Etape 1 : juste /ping pour valider la plomberie. On ajoutera /t5 ensuite. */
const commands = [
    { name: 'ping', description: 'Verifie que le bot Redemption repond', type: 1 }
];

const url = GUILD_ID
    ? `https://discord.com/api/v10/applications/${APP_ID}/guilds/${GUILD_ID}/commands`
    : `https://discord.com/api/v10/applications/${APP_ID}/commands`;

(async () => {
    const r = await fetch(url, {
        method: 'PUT',
        headers: { 'Authorization': 'Bot ' + TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify(commands)
    });
    const txt = await r.text();
    if (r.ok) {
        console.log('Commandes enregistrees (' + (GUILD_ID ? 'serveur ' + GUILD_ID : 'global') + ') : HTTP ' + r.status);
        console.log(txt);
    } else {
        console.error('ECHEC HTTP ' + r.status + ' : ' + txt);
        process.exit(1);
    }
})().catch(e => { console.error('ERREUR: ' + e.message); process.exit(1); });

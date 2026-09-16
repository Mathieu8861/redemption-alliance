/* Enregistre les commandes slash du bot Redemption aupres de Discord.
   A lancer par Mathieu, en local, avec le token du bot (SECRET, jamais commit) :

     DISCORD_APP_ID=1549725206128492605 DISCORD_GUILD_ID=<id_du_serveur> DISCORD_BOT_TOKEN=<ton_token> node bot/register-commands.js

   Sans DISCORD_GUILD_ID l'enregistrement est global (propagation jusqu'a ~1h) ;
   avec, il est instantane sur le serveur.
   Pour recuperer l'ID du serveur : Discord > clic droit sur le serveur > Copier l'identifiant
   (le mode developpeur doit etre active dans les parametres Discord).

   ATTENTION : la requete est un PUT, elle REMPLACE la liste complete des commandes.
   Toute commande absente de ce fichier est supprimee de Discord.
*/

const APP_ID = process.env.DISCORD_APP_ID;
const TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID || null;

if (!APP_ID || !TOKEN) {
    console.error('Manque DISCORD_APP_ID ou DISCORD_BOT_TOKEN en variable d\'environnement.');
    process.exit(1);
}

/* Types d'options Discord : 3 = string, 4 = integer, 6 = user, 11 = attachment */
const OPT_STRING = 3, OPT_INT = 4, OPT_USER = 6, OPT_ATTACHMENT = 11;

/* Les valeurs (value) partent en base telles quelles : elles doivent rester en
   minuscules pour coller a bareme_points.type et aux contraintes de combats. */
const joueurs = [];
for (let i = 1; i <= 5; i++) {
    joueurs.push({
        type: OPT_USER, name: 'joueur' + i, required: false,
        description: 'Allie present dans le combat (toi tu es compte automatiquement)'
    });
}

const commands = [
    { name: 'ping', description: 'Verifie que le bot Redemption repond', type: 1 },
    {
        name: 't5',
        description: 'Declarer un combat (T5) et attribuer les points',
        type: 1,
        options: [
            {
                type: OPT_STRING, name: 'type', description: 'Attaque ou defense', required: true,
                choices: [
                    { name: 'Attaque', value: 'attaque' },
                    { name: 'Defense', value: 'defense' }
                ]
            },
            {
                type: OPT_STRING, name: 'resultat', description: 'Issue du combat', required: true,
                choices: [
                    { name: 'Victoire', value: 'victoire' },
                    { name: 'Defaite', value: 'defaite' }
                ]
            },
            { type: OPT_INT, name: 'allies', description: 'Nombre d\'allies (1 a 5)', required: true, min_value: 1, max_value: 5 },
            { type: OPT_INT, name: 'ennemis', description: 'Nombre d\'ennemis (1 a 5)', required: true, min_value: 1, max_value: 5 },
            { type: OPT_STRING, name: 'alliance', description: 'Alliance ennemie (tag ou nom)', required: true },
            { type: OPT_ATTACHMENT, name: 'screen1', description: 'Premiere preuve', required: true },
            { type: OPT_ATTACHMENT, name: 'screen2', description: 'Deuxieme preuve', required: true }
        ]
            .concat(joueurs)
            .concat([
                { type: OPT_INT, name: 'butin', description: 'Butin en kamas (victoire uniquement)', required: false, min_value: 0 },
                { type: OPT_STRING, name: 'zone', description: 'Zone du combat', required: false },
                { type: OPT_STRING, name: 'invites', description: 'Joueurs hors alliance, separes par des virgules', required: false }
            ])
    }
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
        console.log('OK - commandes enregistrees (' + (GUILD_ID ? 'serveur ' + GUILD_ID : 'global') + ') : '
            + commands.map(c => '/' + c.name).join(', '));
    } else {
        console.error('ECHEC HTTP ' + r.status + ' : ' + txt);
        process.exit(1);
    }
})().catch(e => { console.error('ERREUR: ' + e.message); process.exit(1); });

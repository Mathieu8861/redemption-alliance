/* Coeur de la route /api/recensement (sql/081), partagé avec le serveur local
   de test : la liste des membres du serveur Discord, avec le nom de leurs rôles.
   Le navigateur ne peut pas la lire lui-même (il faut le jeton du bot). */

const DISCORD = 'https://discord.com/api/v10';
const SERVEUR = '1548432166671753318'; /* serveur Discord Redemption */

async function discord(jeton, chemin) {
    for (let essai = 0; essai < 4; essai++) {
        const r = await fetch(DISCORD + chemin, {
            headers: { Authorization: 'Bot ' + jeton, 'User-Agent': 'DiscordBot (https://redemption-alliance.vercel.app, 1.0)' }
        });
        if (r.status === 429) {
            const j = await r.json().catch(() => ({}));
            await new Promise((ok) => setTimeout(ok, Math.ceil((j.retry_after || 1) * 1000) + 100));
            continue;
        }
        if (!r.ok) throw new Error('Discord ' + chemin.split('?')[0] + ' : ' + r.status);
        return r.json();
    }
    throw new Error('Discord trop chargé, réessaie dans une minute');
}

export async function membresDiscord(jeton) {
    const roles = await discord(jeton, '/guilds/' + SERVEUR + '/roles');
    const nomRole = {};
    roles.forEach((r) => { nomRole[r.id] = r.name; });
    let membres = [], apres = '0';
    for (;;) {
        const lot = await discord(jeton, '/guilds/' + SERVEUR + '/members?limit=1000&after=' + apres);
        membres = membres.concat(lot);
        if (lot.length < 1000) break;
        apres = lot[lot.length - 1].user.id;
    }
    return {
        ok: true,
        lu_le: new Date().toISOString(),
        membres: membres.map((m) => ({
            id: m.user.id,
            pseudo: m.user.username,
            nom: m.user.global_name || null,
            surnom: m.nick || null,
            avatar: m.user.avatar ? 'https://cdn.discordapp.com/avatars/' + m.user.id + '/' + m.user.avatar + '.png?size=64' : null,
            roles: m.roles.map((id) => nomRole[id] || id),
            arrive: m.joined_at,
            bot: !!m.user.bot
        }))
    };
}

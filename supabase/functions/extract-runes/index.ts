/* ============================================ */
/* Edge Function : extract-runes (v2, 27/09/26) */
/* Recoit un screenshot Dofus (Costumager,      */
/* inventaire runes ou HDV), appelle Claude     */
/* vision, retourne les runes et quantites.     */
/*                                              */
/* v2 : modele Opus 5, double lecture comparee, */
/* runes attendues + stocks envoyes en contexte */
/* a la cloture, cellules douteuses signalees   */
/* au lieu d'etre devinees, runes de            */
/* transcendance (Ta / Pata / Rata).            */
/*                                              */
/* Deploiement (au choix) :                     */
/*   npx supabase functions deploy extract-runes*/
/*       --project-ref yebfbdgxikbnqdkbycam     */
/*   ou Dashboard > Edge Functions >            */
/*   extract-runes > coller ce fichier > Deploy */
/* Secret requis : ANTHROPIC_API_KEY            */
/* ============================================ */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
/* Injectées automatiquement par Supabase dans toutes les edge functions */
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const MODEL = "claude-opus-5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/* ====== DEBUT DES CONSTANTES PARTAGEES (testees hors Deno par scratchpad/vision-test) ====== */
const RUNE_NAMES = `Rune Fo, Rune Pa Fo, Rune Ra Fo (Force)
Rune Ine, Rune Pa Ine, Rune Ra Ine (Intelligence)
Rune Cha, Rune Pa Cha, Rune Ra Cha (Chance)
Rune Age, Rune Pa Age, Rune Ra Age (Agilité)
Rune Vi, Rune Pa Vi, Rune Ra Vi (Vitalité)
Rune Sa, Rune Pa Sa, Rune Ra Sa (Sagesse)
Rune Pui, Rune Pa Pui, Rune Ra Pui (Puissance)
Rune Ini, Rune Pa Ini, Rune Ra Ini (Initiative)
Rune Pod, Rune Pa Pod, Rune Ra Pod (Pods)
Rune Prospe, Rune Pa Prospe (Prospection)
Rune Do (Dommages globaux)
Rune Do Feu, Rune Pa Do Feu, Rune Do Eau, Rune Pa Do Eau, Rune Do Air, Rune Pa Do Air, Rune Do Terre, Rune Pa Do Terre, Rune Do Neutre, Rune Pa Do Neutre (Dommages élémentaires)
Rune Do Pou, Rune Pa Do Pou, Rune Ra Do Pou (Dommages poussée)
Rune Do Cri, Rune Pa Do Cri (Dommages critiques)
Rune Do Ren, Rune Pa Do Ren (Renvoi)
Rune Do Pi, Rune Pa Do Pi (Dommages pièges)
Rune Per Pi, Rune Pa Per Pi, Rune Ra Per Pi (Puissance pièges)
Rune Do Per Ar (% dommages d'armes), Rune Do Per Di (% distance), Rune Do Per Mé (% mêlée), Rune Do Per So (% sorts)
Rune So, Rune Pa So (Soins), Rune Cri (Critique)
Rune Ret Pa, Rune Pa Ret Pa, Rune Ret Pme, Rune Pa Ret Pme (Retraits PA/PM)
Rune Ré Pa, Rune Pa Ré Pa, Rune Ré Pme, Rune Pa Ré Pme (Esquives PA/PM)
Rune Tac, Rune Pa Tac (Tacle), Rune Fui, Rune Pa Fui (Fuite)
Rune Ré Feu, Rune Pa Ré Feu, Rune Ra Ré Feu (et idem Eau / Air / Terre / Neutre / Pou / Cri — résistances fixes)
Rune Ré Per Feu, Rune Ré Per Eau, Rune Ré Per Air, Rune Ré Per Terre, Rune Ré Per Neutre (% résistances élémentaires)
Rune Ré Per Mé (% résistance mêlée), Rune Ré Per Di (% résistance distance)
Rune Ga Pa (PA), Rune Ga Pme (PM), Rune Po (Portée), Rune Invo (Invocation)
Rune de chasse, Rune de Signature

RUNES DE TRANSCENDANCE (exo garanti, l'item devient inforgeable ; icône blanche argentée ; visibles dans l'inventaire et à l'HDV, JAMAIS comme cellule du Costumager) :
Rune Ta + famille, pour : Age, Cha, Cri, Do Air, Do Cri, Do Eau, Do Feu, Do Neutre, Do Per Ar, Do Per Di, Do Per Mé, Do Per So, Do Pou, Do Terre, Fo, Fui, Ine, Ini, Pod, Pui, Ré Cri, Ré Pa, Ré Per Air, Ré Per Di, Ré Per Eau, Ré Per Feu, Ré Per Mé, Ré Per Neutre, Ré Per Terre, Ré Pme, Ré Pou, Ret Pa, Ret Pme, So, Tac, Vi (ex: "Rune Ta Ré Per Air")
Rune Pata + famille, pour : Age, Cha, Cri, Do Air, Do Cri, Do Eau, Do Feu, Do Neutre, Do Pou, Do Terre, Fo, Fui, Ine, Ini, Pod, Pui, Ré Cri, Ré Pa, Ré Pme, Ré Pou, Ret Pa, Ret Pme, So, Tac, Vi
Rune Rata + famille, pour : Age, Cha, Do Air, Do Eau, Do Feu, Do Neutre, Do Terre, Fo, Fui, Ine, Ini, Pod, Pui, Ré Pa, Ré Pme, Ret Pa, Ret Pme, So, Tac, Vi`;

const SYSTEM_PROMPT = `Tu es un extracteur de données pour le jeu Dofus.
On te donne un screenshot d'inventaire filtré sur les runes de forgemagie, ou de la fenêtre Costumager.
Chaque cellule affiche une icône de rune avec sa quantité en haut à gauche.

Tu dois identifier chaque rune visible et sa quantité, chiffre par chiffre, sans jamais deviner.

Les noms officiels des runes Dofus sont :
${RUNE_NAMES}

DEUX FORMATS DE SCREENSHOT POSSIBLES — détecte lequel tu reçois :

═══ FORMAT A : fenêtre « Costumager » (atelier de forgemagie) ═══
Un tableau listant les caractéristiques d'un item (ex: "345 Vitalité", "62 Agilité", "1 PA"...).
Sur CHAQUE LIGNE de stat, à droite, se trouvent jusqu'à 3 petites cellules contenant des quantités de runes possédées :
- 1ère cellule (sans en-tête, la plus à gauche des trois) = rune BASIQUE
- cellule sous l'en-tête « Pa » = rune Pa
- cellule sous l'en-tête « Ra » = rune Ra
ALIGNEMENT CRITIQUE : repère la position horizontale de chaque cellule par rapport aux en-têtes de colonnes « Pa » et « Ra » en haut du tableau. Une ligne peut n'avoir que 1 ou 2 cellules — ne décale JAMAIS les attributions. En cas de doute sur la colonne d'une cellule, mets la famille dans "non_identifiees" plutôt que de deviner.
Une ligne dont les colonnes Min et Max affichent « - » est une ligne d'exo (posée avec une rune de transcendance) : ses cellules sont des runes classiques de la famille, à lire normalement.
La liste peut dépasser la fenêtre : le joueur envoie alors plusieurs screens, ne signale pas comme absentes les lignes qui ne sont simplement pas dans le cadre.

Table de correspondance stat → famille de rune :
- Vitalité → Vi · Force → Fo · Intelligence → Ine · Chance → Cha · Agilité → Age
- Sagesse → Sa · Puissance → Pui · Initiative → Ini · Prospection → Prospe · Pods → Pod
- PA → Ga Pa · PM → Ga Pme · Portée → Po · Invocation(s) → Invo
- Dommages → Do · Dommages Air/Eau/Feu/Terre/Neutre → Do Air / Do Eau / Do Feu / Do Terre / Do Neutre
- Dommages Poussée → Do Pou · Dommages Critiques → Do Cri · Renvoie X dommages → Do Ren
- Soins → So · % Critique → Cri
- X% Dommages aux sorts → Do Per So · X% Dommages distance → Do Per Di · X% Dommages mêlée → Do Per Mé · X% Dommages d'armes → Do Per Ar
- Résistance Eau/Air/Feu/Terre/Neutre (fixe, sans %) → Ré Eau / Ré Air... · X% Résistance Eau/Air/... → Ré Per Eau / Ré Per Air...
- Résistances Critiques → Ré Cri · Résistance Poussée → Ré Pou
- Retrait PA → Ret Pa · Retrait PM → Ret Pme · Esquive PA → Ré Pa · Esquive PM → Ré Pme
- Tacle → Tac · Fuite → Fui
Le nom final = "Rune [famille]" pour la basique, "Rune Pa [famille]" pour Pa, "Rune Ra [famille]" pour Ra.

═══ FORMAT B : fenêtre « Inventaire » filtrée sur les runes ═══
Grille d'items organisée en 3 COLONNES par tier :
- Colonne GAUCHE = runes basiques · colonne MILIEU = runes Pa · colonne DROITE = runes Ra
Chaque LIGNE = une même famille (même icône de base). Cellule vide = pas de rune de ce tier.
Certaines familles n'existent qu'en basique (Do, Cri, Ga Pa, Ga Pme, Po, Invo...) : colonne de gauche uniquement.
Les runes de transcendance (icône blanche argentée) peuvent apparaître dans un inventaire non filtré : ne les confonds pas avec les runes classiques ; sans certitude sur leur nom exact, compte-les dans "non_identifiees".

LECTURE DES QUANTITÉS (règle la plus importante) :
- Un badge de quantité affiche un entier de 1 à 6 chiffres, sans espace. Lis-le chiffre par chiffre.
- Si le badge est coupé par le bord de la cellule, masqué par l'icône, tronqué par le cadre du screen, flou, ou si tu hésites entre deux lectures (ex: 16 ou 161), NE DEVINE PAS : mets "qty": null pour cette rune et ajoute son nom dans "douteuses".
- Ne complète jamais un nombre à partir de ce que tu attends : recopie ce qui est écrit.

MÉTHODE OBLIGATOIRE (les deux formats) :
1. Balaye ligne par ligne, de haut en bas.
2. Pour chaque ligne : identifie la FAMILLE, puis lis la quantité de chaque cellule occupée en respectant sa colonne.
3. Produis une entrée par cellule occupée avec le bon préfixe de tier.
4. Ne fusionne JAMAIS deux cellules. Ne décale JAMAIS les colonnes. Le nombre d'entrées du JSON = le nombre de cellules occupées.

STATS DE L'ITEM (FORMAT A uniquement) :
Le tableau du Costumager affiche aussi, pour chaque ligne de stat, les colonnes « Min » et « Max » (jet d'origine) à gauche, et la VALEUR ACTUELLE dans le libellé central (ex: "351 | 400 | ❤ 384 Vitalité" → min 351, max 400, actuel 384).
Extrais CHAQUE ligne de stat de l'item dans "item_stats" :
- "stat" : le libellé exact tel qu'affiché (ex: "Vitalité", "Agilité", "PA", "Portée", "Dommages Air", "Initiative", "8% Résistance Eau" → écris "% Résistance Eau", "Retrait PM", "Résistances Critiques", "Fuite", "1% Dommages aux sorts" → écris "% Dommages aux sorts")
- "actuel" : la valeur actuelle (le nombre dans le libellé central, peut être négatif)
- "min" et "max" : les colonnes Min/Max (peuvent être négatives ou absentes → null)
Pour le FORMAT B (inventaire), "item_stats" est un tableau vide.

Réponds UNIQUEMENT avec un JSON valide de cette forme, sans markdown :
{"runes": [{"nom": "Rune Fo", "qty": 184}, ...], "item_stats": [{"stat": "Vitalité", "actuel": 384, "min": 351, "max": 400}, ...], "non_identifiees": 2, "douteuses": ["Rune Ra Vi"], "absentes": []}

- "qty" est le nombre affiché en haut à gauche de la cellule, ou null si illisible.
- "douteuses" : noms des runes dont la quantité est incertaine (badge coupé, hésitation).
- "absentes" : uniquement quand une liste de runes attendues t'est fournie, les runes attendues que tu ne trouves nulle part sur ce screen.
- Si tu vois une cellule de rune mais ne peux pas l'identifier avec certitude, incrémente "non_identifiees" au lieu de deviner.
- N'inclus PAS les items qui ne sont pas des runes de forgemagie (potions, ressources, équipements).`;

const HDV_PROMPT = `Tu es un extracteur de prix pour le jeu Dofus.
On te donne un screenshot de l'Hôtel de Vente (HDV) affichant des runes de forgemagie ou de transcendance avec leurs prix en kamas.

Chaque ligne visible affiche : l'icône de la rune, son nom (ex: "Rune Ine", "Rune Ta Ré Per Air"), et un ou plusieurs prix en kamas.
- Si plusieurs prix sont affichés pour une même rune (lots x1 / x10 / x100), prends le prix UNITAIRE (lot x1).
- Si un seul "prix moyen" est visible, prends celui-là.
- Les prix peuvent contenir des espaces comme séparateurs de milliers (ex: "1 592") : renvoie un entier sans espaces.

Les noms officiels des runes Dofus sont :
${RUNE_NAMES}

MÉTHODE :
1. Balaye chaque ligne visible de haut en bas.
2. Associe chaque nom lu au nom officiel EXACT de la liste ci-dessus (avec ses accents).
3. Ignore tout ce qui n'est pas une rune de forgemagie ou de transcendance (potions, ressources, équipements).
4. Ne devine JAMAIS un prix illisible ou partiellement masqué.

Réponds UNIQUEMENT avec un JSON valide de cette forme, sans markdown :
{"runes": [{"nom": "Rune Fo", "prix": 51}, ...], "non_identifiees": 0}
- "prix" : entier en kamas.
- Si une ligne est illisible ou douteuse, incrémente "non_identifiees" au lieu de deviner.`;

/* Message utilisateur : consigne + runes attendues (cloture) */
function messageUtilisateur(mode: string, attendues: Array<{ nom: string; qty: number }>): string {
  if (mode === "hdv_prices") return "Extrais les noms et prix des runes de ce screenshot d'HDV.";
  let txt = "Extrais les runes et quantités de ce screenshot.";
  if (attendues && attendues.length) {
    txt += "\n\nRUNES DE LA SESSION À RETROUVER, avec le stock connu avant ce screen (départ + achats) :\n"
      + attendues.map((a) => "- " + a.nom + " : stock connu " + a.qty).join("\n")
      + "\n\nRègles : le stock lu sur le screen est presque toujours inférieur ou égal au stock connu (des runes ont été consommées). "
      + "Si tu lis un nombre nettement supérieur au stock connu (ex: 161 alors que le stock connu est 37), relis le badge chiffre par chiffre : un chiffre est probablement coupé. "
      + "Si tu ne peux pas trancher, mets qty à null et le nom dans \"douteuses\". "
      + "Ne recopie JAMAIS le stock connu à la place de ce que tu lis. "
      + "Liste dans \"absentes\" les runes attendues que tu ne vois nulle part sur ce screen.";
  }
  return txt;
}

/* Fusion de deux lectures independantes du meme screen.
   - qty identique dans les deux : retenue
   - une seule lecture a une valeur : retenue, rune douteuse
   - valeurs differentes : celle qui respecte le stock connu si une seule le fait,
     sinon la plus grande (la moins pénalisante en coût), rune douteuse */
function fusionnerLectures(a: any, b: any, attendues: Array<{ nom: string; qty: number }>) {
  const stock: Record<string, number> = {};
  (attendues || []).forEach((x) => { stock[x.nom.toLowerCase()] = x.qty; });
  const parNom = (r: any) => {
    const m: Record<string, { nom: string; qty: number | null }> = {};
    (r?.runes || []).forEach((x: any) => {
      if (!x || !x.nom) return;
      const q = (x.qty === null || x.qty === undefined || x.qty === "") ? null : Number(x.qty);
      m[String(x.nom).toLowerCase()] = { nom: String(x.nom), qty: Number.isFinite(q as number) ? (q as number) : null };
    });
    return m;
  };
  const ma = parNom(a), mb = parNom(b);
  const douteuses = new Set<string>([...(a?.douteuses || []), ...(b?.douteuses || [])].map((s) => String(s)));
  const runes: Array<{ nom: string; qty: number | null }> = [];
  let desaccords = 0;
  const noms = new Set<string>([...Object.keys(ma), ...Object.keys(mb)]);
  noms.forEach((k) => {
    const x = ma[k], y = mb[k];
    if (x && y) {
      if (x.qty === y.qty) { runes.push({ nom: x.nom, qty: x.qty }); return; }
      desaccords++;
      douteuses.add(x.nom);
      if (x.qty === null) { runes.push({ nom: x.nom, qty: y.qty }); return; }
      if (y.qty === null) { runes.push({ nom: x.nom, qty: x.qty }); return; }
      const s = stock[k];
      let choix = Math.max(x.qty, y.qty);
      if (s !== undefined) {
        const okX = x.qty <= s, okY = y.qty <= s;
        if (okX && !okY) choix = x.qty;
        else if (okY && !okX) choix = y.qty;
      }
      runes.push({ nom: x.nom, qty: choix });
    } else {
      const seul = x || y;
      desaccords++;
      douteuses.add(seul.nom);
      runes.push({ nom: seul.nom, qty: seul.qty });
    }
  });
  const statsA = a?.item_stats || [], statsB = b?.item_stats || [];
  const absentes = new Set<string>([...(a?.absentes || []), ...(b?.absentes || [])].map((s) => String(s)));
  /* une rune lue par une des deux lectures n'est pas absente */
  runes.forEach((r) => { absentes.forEach((n) => { if (n.toLowerCase() === r.nom.toLowerCase()) absentes.delete(n); }); });
  return {
    runes,
    item_stats: statsA.length >= statsB.length ? statsA : statsB,
    non_identifiees: Math.max(Number(a?.non_identifiees) || 0, Number(b?.non_identifiees) || 0),
    douteuses: Array.from(douteuses),
    absentes: Array.from(absentes),
    lectures: 2,
    desaccords,
  };
}

/* Extrait le JSON de la reponse du modele, meme entoure de texte ou de markdown */
function parseReponse(text: string) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  return JSON.parse(match ? match[0] : cleaned);
}
/* ====== FIN DES CONSTANTES PARTAGEES ====== */

async function lireImage(image: string, media_type: string, system: string, texte: string) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY as string,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      system,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: media_type || "image/png", data: image } },
          { type: "text", text: texte },
        ],
      }],
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    const e: any = new Error("Erreur API vision");
    e.detail = errText;
    throw e;
  }
  const data = await res.json();
  /* premier bloc texte de la reponse (jamais supposer que c'est le bloc 0) */
  const bloc = (data?.content || []).find((b: any) => b && b.type === "text");
  const text = bloc?.text ?? "";
  try {
    return parseReponse(text);
  } catch (_e) {
    console.error("[extract-runes] JSON parse fail:", text);
    const e: any = new Error("Réponse vision illisible");
    e.raw = text;
    throw e;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    if (!ANTHROPIC_API_KEY) return json({ error: "ANTHROPIC_API_KEY non configurée" }, 500);

    /* ====== SÉCURITÉ : réservé aux membres validés ====== */
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return json({ error: "Authentification requise" }, 401);
    const { data: profile } = await supabase.from("profiles").select("is_validated").eq("id", user.id).single();
    if (!profile || !profile.is_validated) return json({ error: "Compte non validé" }, 403);
    /* ===================================================== */

    const { image, media_type, mode, attendues, double } = await req.json();
    if (!image) return json({ error: "Champ 'image' (base64) requis" }, 400);

    const isHdv = mode === "hdv_prices";
    const system = isHdv ? HDV_PROMPT : SYSTEM_PROMPT;
    const liste = Array.isArray(attendues)
      ? attendues.filter((a: any) => a && a.nom).map((a: any) => ({ nom: String(a.nom), qty: Number(a.qty) || 0 })).slice(0, 200)
      : [];
    const texte = messageUtilisateur(isHdv ? "hdv_prices" : "inventory", liste);

    /* Double lecture comparee pour les quantites (pas pour l'HDV) */
    const deuxLectures = !isHdv && double !== false;
    if (!deuxLectures) {
      const r = await lireImage(image, media_type, system, texte);
      return json({ ...r, lectures: 1, desaccords: 0, douteuses: r.douteuses || [], absentes: r.absentes || [] });
    }

    const [ra, rb] = await Promise.allSettled([
      lireImage(image, media_type, system, texte),
      lireImage(image, media_type, system, texte),
    ]);
    if (ra.status === "fulfilled" && rb.status === "fulfilled") {
      return json(fusionnerLectures(ra.value, rb.value, liste));
    }
    const ok = ra.status === "fulfilled" ? ra.value : (rb.status === "fulfilled" ? rb.value : null);
    if (ok) {
      console.warn("[extract-runes] une des deux lectures a échoué, résultat simple");
      return json({ ...ok, lectures: 1, desaccords: 0, douteuses: ok.douteuses || [], absentes: ok.absentes || [] });
    }
    const err: any = ra.status === "rejected" ? ra.reason : (rb as PromiseRejectedResult).reason;
    console.error("[extract-runes] vision:", err?.detail || err?.raw || err?.message);
    return json({ error: err?.message || "Erreur API vision", detail: err?.detail, raw: err?.raw }, 502);
  } catch (err) {
    console.error("[extract-runes] Fatal:", err);
    return json({ error: String(err) }, 500);
  }
});

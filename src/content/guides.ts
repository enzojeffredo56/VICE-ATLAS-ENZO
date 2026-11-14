import type { Guide, GuideCategoryId } from "@/lib/content/schemas";

export const guideCategories: { id: GuideCategoryId; label: string }[] = [
  { id: "bien-demarrer", label: "Bien démarrer" },
  { id: "exploration", label: "Exploration" },
  { id: "cascades", label: "Cascades" },
  { id: "entre-amis", label: "Entre amis" },
];

/**
 * Guides de DÉMONSTRATION rédigés par VICE ATLAS. Ils expliquent les modules
 * et la carte fictive : ils ne contiennent aucune information présentée comme
 * officielle sur GTA 6. Les vrais guides seront gérés depuis l'administration.
 */
export const demoGuides: Guide[] = [
  {
    slug: "bien-demarrer-avec-la-carte",
    title: "Bien démarrer avec la carte",
    category: "bien-demarrer",
    summary: "Zoomer, filtrer, chercher un lieu et marquer tes favoris : les gestes de base de la carte VICE ATLAS.",
    intro:
      "La carte VICE ATLAS rassemble les lieux à explorer, les spots de cascade et les collectibles. Ce guide te montre comment t'en servir en quelques minutes, sur ordinateur comme sur téléphone.",
    steps: [
      {
        title: "Ouvre la carte et repère-toi",
        body: "Fais glisser la carte pour te déplacer et utilise la molette, les boutons + et − ou le pincement à deux doigts pour zoomer. Les coordonnées X et Y du curseur s'affichent en bas de la carte.",
      },
      {
        title: "Filtre par catégorie",
        body: "Active ou désactive les catégories (points d'intérêt, spots de Stunt, collectibles, activités, panoramas) pour n'afficher que ce qui t'intéresse.",
      },
      {
        title: "Cherche un lieu par son nom",
        body: "Tape quelques lettres dans la barre de recherche : les accents ne comptent pas. Clique sur un résultat pour centrer la carte dessus.",
        placeSlug: "phare-du-port-neon",
      },
      {
        title: "Ouvre la fiche d'un lieu",
        body: "Clique sur un marqueur pour voir sa fiche : description, quartier, coordonnées et liens vers les guides qui en parlent.",
      },
      {
        title: "Ajoute des favoris et marque tes visites",
        body: "Depuis la fiche, ajoute le lieu à tes favoris ou marque-le comme visité. Les lieux visités cochent automatiquement ton carnet de progression.",
      },
    ],
    sources: [{ label: "Carte VICE ATLAS (carte fictive de démonstration)", url: "/carte" }],
    placeSlugs: ["phare-du-port-neon"],
    updatedAt: "2026-11-15",
    status: "published",
    isDemo: true,
  },
  {
    slug: "suivre-sa-progression-dans-le-carnet",
    title: "Suivre sa progression dans le carnet",
    category: "bien-demarrer",
    summary: "Coche tes missions, activités et découvertes, ajoute tes propres objectifs et suis tes pourcentages.",
    intro:
      "Le carnet de progression garde une trace de tout ce que tu as accompli. Il est privé : toi seul vois ce que tu y notes.",
    steps: [
      {
        title: "Choisis une catégorie",
        body: "Missions, activités, lieux, collectibles, découvertes ou objectifs personnels : chaque onglet affiche son propre pourcentage.",
      },
      {
        title: "Coche ce que tu as terminé",
        body: "Un clic suffit. La sauvegarde est automatique, il n'y a pas de bouton à presser.",
      },
      {
        title: "Laisse la carte cocher les lieux pour toi",
        body: "Quand tu marques un lieu comme visité sur la carte, il est coché dans les catégories Lieux ou Collectibles du carnet.",
      },
      {
        title: "Ajoute tes objectifs personnels",
        body: "Note tes propres défis, par exemple « Visiter tous les panoramas avant le week-end ». Tu peux les modifier ou les supprimer à tout moment.",
      },
    ],
    sources: [{ label: "Carnet de progression VICE ATLAS", url: "/carnet" }],
    placeSlugs: [],
    updatedAt: "2026-11-15",
    status: "published",
    isDemo: true,
  },
  {
    slug: "tour-de-la-pointe-turquoise",
    title: "Tour de la Pointe Turquoise",
    category: "exploration",
    summary: "Un itinéraire de démonstration à travers les Docks, le Quartier Corail et la Pointe Turquoise.",
    intro:
      "Cet itinéraire utilise la carte fictive de démonstration. Il montre comment un guide pas à pas s'appuie sur la carte : chaque étape t'y renvoie directement.",
    steps: [
      {
        title: "Départ au marché flottant",
        body: "Commence par le marché flottant des Docks, de préférence à la tombée de la nuit pour profiter des néons.",
        placeSlug: "marche-flottant-des-docks",
      },
      {
        title: "Traverse le Quartier Corail",
        body: "Remonte vers le nord jusqu'à la galerie murale. Prends le temps d'une photo devant les fresques.",
        placeSlug: "galerie-murale-de-corail",
      },
      {
        title: "Longe la route côtière",
        body: "Suis la grande route vers l'est jusqu'au bout de la Pointe Turquoise.",
      },
      {
        title: "Récupère le coquillage de la plage",
        body: "Le coquillage néon n° 3 se trouve derrière la cabane du maître-nageur.",
        placeSlug: "coquillage-neon-3",
      },
      {
        title: "Finis en beauté au tremplin",
        body: "Termine l'itinéraire au Tremplin de la Pointe : c'est aussi un spot de STUNT ARENA.",
        placeSlug: "tremplin-de-la-pointe",
      },
    ],
    sources: [{ label: "Carte VICE ATLAS (carte fictive de démonstration)", url: "/carte" }],
    placeSlugs: ["marche-flottant-des-docks", "galerie-murale-de-corail", "coquillage-neon-3", "tremplin-de-la-pointe"],
    updatedAt: "2026-11-15",
    status: "published",
    isDemo: true,
  },
  {
    slug: "filmer-une-cascade-pour-stunt-arena",
    title: "Filmer une cascade pour STUNT ARENA",
    category: "cascades",
    summary: "Préparer, cadrer et partager une vidéo de cascade claire, prête pour la modération.",
    intro:
      "Une bonne vidéo de cascade se juge en quelques secondes. Ces conseils t'aident à proposer une participation lisible et conforme aux règles de STUNT ARENA.",
    steps: [
      {
        title: "Choisis ton spot",
        body: "Chaque spot a son propre concours hebdomadaire. Repère-le sur la carte et lis ses règles avant de te lancer.",
        placeSlug: "rampe-des-docks",
      },
      {
        title: "Fais plusieurs essais",
        body: "Entraîne-toi d'abord sans enregistrer. Garde l'enregistrement pour la tentative qui te paraît la meilleure.",
      },
      {
        title: "Cadre toute la cascade",
        body: "La vidéo doit montrer l'élan, le saut et l'atterrissage sans coupure. Évite les montages qui cachent une partie de la figure.",
      },
      {
        title: "Mets ta vidéo en ligne",
        body: "Publie-la sur une plateforme vidéo autorisée, puis colle le lien dans le formulaire de participation. Les vidéos sont vérifiées avant d'être publiées.",
      },
    ],
    sources: [{ label: "Présentation de STUNT ARENA", url: "/stunts" }],
    placeSlugs: ["rampe-des-docks", "saut-de-la-lagune", "tremplin-de-la-pointe"],
    updatedAt: "2026-11-15",
    status: "published",
    isDemo: true,
  },
  {
    slug: "organiser-une-soiree-gta-roulette",
    title: "Organiser une soirée GTA Roulette",
    category: "entre-amis",
    summary: "Créer un salon, inviter ta crew et lancer des défis communs, avec quelques règles pour que tout le monde s'amuse.",
    intro:
      "GTA Roulette tire au sort un défi que toute ta crew doit relever en même temps. Voici comment préparer une soirée réussie.",
    steps: [
      {
        title: "Fixe un point de rendez-vous",
        body: "Choisissez un lieu facile à trouver pour commencer, par exemple la salle d'arcade.",
        placeSlug: "salle-d-arcade-neon",
      },
      {
        title: "Crée un salon privé",
        body: "Depuis la page GTA Roulette, crée un salon et partage son code à tes amis.",
      },
      {
        title: "Choisis la difficulté",
        body: "Commencez en facile pour vous échauffer, puis montez en difficulté au fil de la soirée.",
      },
      {
        title: "Mettez-vous d'accord sur les règles",
        body: "Les défis entre amis ne rapportent pas d'XP : c'est l'honneur qui compte. Décidez ensemble comment départager les égalités.",
      },
    ],
    sources: [{ label: "Présentation de GTA Roulette", url: "/roulette" }],
    placeSlugs: ["salle-d-arcade-neon"],
    updatedAt: "2026-11-15",
    status: "published",
    isDemo: true,
  },
];

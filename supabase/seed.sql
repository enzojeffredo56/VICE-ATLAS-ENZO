-- Fichier généré par scripts/generate-seed.ts : ne pas modifier à la main.
-- Contenu de DÉMONSTRATION (is_demo = true), jamais présenté comme officiel.
begin;

insert into public.map_categories (id, label, color, sort_order) values
  ('point-interet', 'Points d''intérêt', '#00D4FF', 0),
  ('stunt', 'Spots de Stunt', '#FF3D91', 1),
  ('collectible', 'Collectibles', '#2DD4BF', 2),
  ('activite', 'Activités', '#8B5CF6', 3),
  ('panorama', 'Panoramas', '#FFB36B', 4)
on conflict (id) do update set label = excluded.label, color = excluded.color, sort_order = excluded.sort_order;

insert into public.places (slug, name, category_id, x, y, district, description, tags, status, is_demo) values
  ('phare-du-port-neon', 'Phare du Port Néon', 'point-interet', 560, 540, 'Port Néon', 'Un phare rayé rose et blanc qui veille sur l''entrée du port. Point de repère idéal pour se retrouver entre amis.', array['repère', 'port'], 'published', true),
  ('marche-flottant-des-docks', 'Marché flottant des Docks', 'point-interet', 1150, 560, 'Les Docks', 'Des pontons reliés entre eux, des enseignes au néon et une ambiance animée la nuit.', array['nuit', 'docks'], 'published', true),
  ('tour-radio-de-la-palmeraie', 'Tour radio de la Palmeraie', 'point-interet', 860, 1120, 'Palmeraie', 'La plus haute structure du nord de l''île, visible depuis presque partout.', array['hauteur'], 'published', true),
  ('galerie-murale-de-corail', 'Galerie murale de Corail', 'point-interet', 1120, 860, 'Quartier Corail', 'Une ruelle couverte de fresques colorées, renouvelées par les artistes du quartier.', array['art', 'photo'], 'published', true),
  ('rampe-des-docks', 'Rampe des Docks', 'stunt', 1240, 600, 'Les Docks', 'Une longue rampe de chargement face à l''eau. Prends de l''élan sur le quai pour viser le ponton d''en face.', array['saut', 'moto'], 'published', true),
  ('saut-de-la-lagune', 'Saut de la Lagune', 'stunt', 865, 765, 'Quartier Corail', 'Un muret au bord de la lagune centrale : l''objectif est d''atterrir sur la rive opposée.', array['saut', 'voiture'], 'published', true),
  ('tremplin-de-la-pointe', 'Tremplin de la Pointe', 'stunt', 1660, 900, 'Pointe Turquoise', 'Une dune naturelle au bout de la route côtière, parfaite pour les sauts les plus longs.', array['saut', 'plage'], 'published', true),
  ('piste-de-l-aerodrome', 'Piste de l''aérodrome', 'stunt', 1720, 420, 'Aérodrome', 'Une piste dégagée pour les figures en ligne droite et les dérapages contrôlés.', array['dérapage', 'vitesse'], 'published', true),
  ('belvedere-de-la-palmeraie', 'Belvédère de la Palmeraie', 'panorama', 700, 1200, 'Palmeraie', 'Une vue dégagée sur toute l''île et la lagune, surtout au coucher du soleil.', array['photo', 'coucher de soleil'], 'published', true),
  ('corniche-de-la-marina', 'Corniche de la Marina', 'panorama', 1380, 240, 'Marina Sud', 'Une promenade en bord de mer avec vue sur les bateaux et l''aérodrome.', array['mer', 'photo'], 'published', true),
  ('pointe-des-ilots', 'Pointe des Îlots', 'panorama', 520, 510, 'Port Néon', 'Le bout du quai d''où l''on aperçoit les Îlots Corail et le pont qui les relie.', array['pont'], 'published', true),
  ('jardin-du-quartier-corail', 'Jardin du Quartier Corail', 'activite', 1000, 940, 'Quartier Corail', 'Un jardin public avec un parcours de footing et des terrains de sport.', array['sport'], 'published', true),
  ('salle-d-arcade-neon', 'Salle d''arcade Néon', 'activite', 680, 640, 'Port Néon', 'Une salle d''arcade rétro, point de départ idéal pour une soirée GTA Roulette.', array['entre amis'], 'published', true),
  ('club-nautique', 'Club nautique', 'activite', 1300, 350, 'Marina Sud', 'Le point de départ des sorties en mer autour de l''île.', array['bateau'], 'published', true),
  ('coquillage-neon-1', 'Coquillage néon n° 1', 'collectible', 300, 460, 'Îlots Corail', 'Caché sous un ponton de l''îlot principal.', '{}'::text[], 'published', true),
  ('coquillage-neon-2', 'Coquillage néon n° 2', 'collectible', 180, 300, 'Îlots Corail', 'Sur la plus petite île, au pied d''un palmier.', '{}'::text[], 'published', true),
  ('coquillage-neon-3', 'Coquillage néon n° 3', 'collectible', 1560, 800, 'Pointe Turquoise', 'Au bout de la plage, derrière la cabane du maître-nageur.', '{}'::text[], 'published', true),
  ('coquillage-neon-4', 'Coquillage néon n° 4', 'collectible', 820, 1080, 'Palmeraie', 'Dans le jardin suspendu, près de la tour radio.', '{}'::text[], 'published', true),
  ('coquillage-neon-5', 'Coquillage néon n° 5', 'collectible', 1100, 440, 'Les Docks', 'Sur le toit d''un conteneur bleu, au bout du quai.', '{}'::text[], 'published', true)
on conflict (slug) do update set name = excluded.name, category_id = excluded.category_id, x = excluded.x, y = excluded.y,
  district = excluded.district, description = excluded.description, tags = excluded.tags, status = excluded.status, is_demo = true;

insert into public.guide_categories (id, label, sort_order) values
  ('bien-demarrer', 'Bien démarrer', 0),
  ('exploration', 'Exploration', 1),
  ('cascades', 'Cascades', 2),
  ('entre-amis', 'Entre amis', 3)
on conflict (id) do update set label = excluded.label, sort_order = excluded.sort_order;

insert into public.guides (slug, title, category_id, summary, intro, steps, sources, status, is_demo, published_at, updated_at) values
  ('bien-demarrer-avec-la-carte', 'Bien démarrer avec la carte', 'bien-demarrer', 'Zoomer, filtrer, chercher un lieu et marquer tes favoris : les gestes de base de la carte VICE ATLAS.', 'La carte VICE ATLAS rassemble les lieux à explorer, les spots de cascade et les collectibles. Ce guide te montre comment t''en servir en quelques minutes, sur ordinateur comme sur téléphone.', '[{"title":"Ouvre la carte et repère-toi","body":"Fais glisser la carte pour te déplacer et utilise la molette, les boutons + et − ou le pincement à deux doigts pour zoomer. Les coordonnées X et Y du curseur s''affichent en bas de la carte."},{"title":"Filtre par catégorie","body":"Active ou désactive les catégories (points d''intérêt, spots de Stunt, collectibles, activités, panoramas) pour n''afficher que ce qui t''intéresse."},{"title":"Cherche un lieu par son nom","body":"Tape quelques lettres dans la barre de recherche : les accents ne comptent pas. Clique sur un résultat pour centrer la carte dessus.","placeSlug":"phare-du-port-neon"},{"title":"Ouvre la fiche d''un lieu","body":"Clique sur un marqueur pour voir sa fiche : description, quartier, coordonnées et liens vers les guides qui en parlent."},{"title":"Ajoute des favoris et marque tes visites","body":"Depuis la fiche, ajoute le lieu à tes favoris ou marque-le comme visité. Les lieux visités cochent automatiquement ton carnet de progression."}]'::jsonb, '[{"label":"Carte VICE ATLAS (carte fictive de démonstration)","url":"/carte"}]'::jsonb, 'published', true, '2026-11-15', '2026-11-15'),
  ('suivre-sa-progression-dans-le-carnet', 'Suivre sa progression dans le carnet', 'bien-demarrer', 'Coche tes missions, activités et découvertes, ajoute tes propres objectifs et suis tes pourcentages.', 'Le carnet de progression garde une trace de tout ce que tu as accompli. Il est privé : toi seul vois ce que tu y notes.', '[{"title":"Choisis une catégorie","body":"Missions, activités, lieux, collectibles, découvertes ou objectifs personnels : chaque onglet affiche son propre pourcentage."},{"title":"Coche ce que tu as terminé","body":"Un clic suffit. La sauvegarde est automatique, il n''y a pas de bouton à presser."},{"title":"Laisse la carte cocher les lieux pour toi","body":"Quand tu marques un lieu comme visité sur la carte, il est coché dans les catégories Lieux ou Collectibles du carnet."},{"title":"Ajoute tes objectifs personnels","body":"Note tes propres défis, par exemple « Visiter tous les panoramas avant le week-end ». Tu peux les modifier ou les supprimer à tout moment."}]'::jsonb, '[{"label":"Carnet de progression VICE ATLAS","url":"/carnet"}]'::jsonb, 'published', true, '2026-11-15', '2026-11-15'),
  ('tour-de-la-pointe-turquoise', 'Tour de la Pointe Turquoise', 'exploration', 'Un itinéraire de démonstration à travers les Docks, le Quartier Corail et la Pointe Turquoise.', 'Cet itinéraire utilise la carte fictive de démonstration. Il montre comment un guide pas à pas s''appuie sur la carte : chaque étape t''y renvoie directement.', '[{"title":"Départ au marché flottant","body":"Commence par le marché flottant des Docks, de préférence à la tombée de la nuit pour profiter des néons.","placeSlug":"marche-flottant-des-docks"},{"title":"Traverse le Quartier Corail","body":"Remonte vers le nord jusqu''à la galerie murale. Prends le temps d''une photo devant les fresques.","placeSlug":"galerie-murale-de-corail"},{"title":"Longe la route côtière","body":"Suis la grande route vers l''est jusqu''au bout de la Pointe Turquoise."},{"title":"Récupère le coquillage de la plage","body":"Le coquillage néon n° 3 se trouve derrière la cabane du maître-nageur.","placeSlug":"coquillage-neon-3"},{"title":"Finis en beauté au tremplin","body":"Termine l''itinéraire au Tremplin de la Pointe : c''est aussi un spot de STUNT ARENA.","placeSlug":"tremplin-de-la-pointe"}]'::jsonb, '[{"label":"Carte VICE ATLAS (carte fictive de démonstration)","url":"/carte"}]'::jsonb, 'published', true, '2026-11-15', '2026-11-15'),
  ('filmer-une-cascade-pour-stunt-arena', 'Filmer une cascade pour STUNT ARENA', 'cascades', 'Préparer, cadrer et partager une vidéo de cascade claire, prête pour la modération.', 'Une bonne vidéo de cascade se juge en quelques secondes. Ces conseils t''aident à proposer une participation lisible et conforme aux règles de STUNT ARENA.', '[{"title":"Choisis ton spot","body":"Chaque spot a son propre concours hebdomadaire. Repère-le sur la carte et lis ses règles avant de te lancer.","placeSlug":"rampe-des-docks"},{"title":"Fais plusieurs essais","body":"Entraîne-toi d''abord sans enregistrer. Garde l''enregistrement pour la tentative qui te paraît la meilleure."},{"title":"Cadre toute la cascade","body":"La vidéo doit montrer l''élan, le saut et l''atterrissage sans coupure. Évite les montages qui cachent une partie de la figure."},{"title":"Mets ta vidéo en ligne","body":"Publie-la sur une plateforme vidéo autorisée, puis colle le lien dans le formulaire de participation. Les vidéos sont vérifiées avant d''être publiées."}]'::jsonb, '[{"label":"Présentation de STUNT ARENA","url":"/stunts"}]'::jsonb, 'published', true, '2026-11-15', '2026-11-15'),
  ('organiser-une-soiree-gta-roulette', 'Organiser une soirée GTA Roulette', 'entre-amis', 'Créer un salon, inviter ta crew et lancer des défis communs, avec quelques règles pour que tout le monde s''amuse.', 'GTA Roulette tire au sort un défi que toute ta crew doit relever en même temps. Voici comment préparer une soirée réussie.', '[{"title":"Fixe un point de rendez-vous","body":"Choisissez un lieu facile à trouver pour commencer, par exemple la salle d''arcade.","placeSlug":"salle-d-arcade-neon"},{"title":"Crée un salon privé","body":"Depuis la page GTA Roulette, crée un salon et partage son code à tes amis."},{"title":"Choisis la difficulté","body":"Commencez en facile pour vous échauffer, puis montez en difficulté au fil de la soirée."},{"title":"Mettez-vous d''accord sur les règles","body":"Les défis entre amis ne rapportent pas d''XP : c''est l''honneur qui compte. Décidez ensemble comment départager les égalités."}]'::jsonb, '[{"label":"Présentation de GTA Roulette","url":"/roulette"}]'::jsonb, 'published', true, '2026-11-15', '2026-11-15')
on conflict (slug) do update set title = excluded.title, category_id = excluded.category_id, summary = excluded.summary,
  intro = excluded.intro, steps = excluded.steps, sources = excluded.sources, status = excluded.status, is_demo = true;

delete from public.guide_places gp using public.guides g where gp.guide_id = g.id and g.is_demo;
insert into public.guide_places (guide_id, place_id, position)
select g.id, p.id, s.ord - 1 from (values
  ('bien-demarrer-avec-la-carte', 'phare-du-port-neon', 1),
  ('tour-de-la-pointe-turquoise', 'marche-flottant-des-docks', 1),
  ('tour-de-la-pointe-turquoise', 'galerie-murale-de-corail', 2),
  ('tour-de-la-pointe-turquoise', 'coquillage-neon-3', 3),
  ('tour-de-la-pointe-turquoise', 'tremplin-de-la-pointe', 4),
  ('filmer-une-cascade-pour-stunt-arena', 'rampe-des-docks', 1),
  ('filmer-une-cascade-pour-stunt-arena', 'saut-de-la-lagune', 2),
  ('filmer-une-cascade-pour-stunt-arena', 'tremplin-de-la-pointe', 3),
  ('organiser-une-soiree-gta-roulette', 'salle-d-arcade-neon', 1)
) as s (guide_slug, place_slug, ord)
join public.guides g on g.slug = s.guide_slug join public.places p on p.slug = s.place_slug;

insert into public.progress_items (slug, category, title, place_id, sort_order, status, is_demo)
select s.slug, s.category::public.progress_category, s.title, p.id, s.ord, 'published', true from (values
  ('mission-introduction', 'mission', 'Terminer la mission d''introduction', null, 0),
  ('mission-deuxieme-quartier', 'mission', 'Débloquer un deuxième quartier', null, 1),
  ('mission-premier-allie', 'mission', 'Recruter un premier allié', null, 2),
  ('mission-discretion', 'mission', 'Réussir une mission sans déclencher d''alerte', null, 3),
  ('mission-secondaires-quartier', 'mission', 'Finir toutes les missions secondaires d''un quartier', null, 4),
  ('mission-histoire', 'mission', 'Terminer l''histoire principale', null, 5),
  ('activite-course', 'activite', 'Gagner une course de rue', null, 6),
  ('activite-arcade', 'activite', 'Finir une partie à la salle d''arcade', 'salle-d-arcade-neon', 7),
  ('activite-bateau', 'activite', 'Faire une sortie en bateau', 'club-nautique', 8),
  ('activite-record-rampe', 'activite', 'Battre ton record de saut à la Rampe des Docks', 'rampe-des-docks', 9),
  ('activite-roulette', 'activite', 'Relever un défi GTA Roulette avec ta crew', null, 10),
  ('decouverte-point-de-vue', 'decouverte', 'Trouver un point de vue caché', 'belvedere-de-la-palmeraie', 11),
  ('decouverte-fresque', 'decouverte', 'Repérer une fresque murale', 'galerie-murale-de-corail', 12),
  ('decouverte-tour-ile', 'decouverte', 'Faire le tour complet de l''île', null, 13),
  ('decouverte-marche-nuit', 'decouverte', 'Visiter le marché flottant de nuit', 'marche-flottant-des-docks', 14)
) as s (slug, category, title, place_slug, ord)
left join public.places p on p.slug = s.place_slug
on conflict (slug) do update set category = excluded.category, title = excluded.title, place_id = excluded.place_id,
  sort_order = excluded.sort_order, status = excluded.status, is_demo = true;

commit;

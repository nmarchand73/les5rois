# Cinq Couronnes

Jeu de cartes de type rami en **11 manches** (de 3 à 13 cartes, atout qui change à chaque manche),
inspiré de *Les Cinq Rois* / *Five Crowns* (règles Gigamic, édition 03-2018).
Projet de fan non officiel : aucune illustration ni marque de l'éditeur n'est utilisée.

Une seule page, **sans dépendance** : ouvrez `index.html` dans un navigateur.

## Modes
- **Partie** : vous contre 1 à 6 bots (niveau Débutant ou Expert), partie complète ou « express » (manche de départ au choix).
- **Solo** : 11 mains face visible, fermez-les toutes avant que la pioche ne s'épuise.

## Règles implémentées
- 2 × 58 cartes (5 couleurs de 3 à roi + 6 jokers), manche *n* = *n*+2 cartes, atout = valeur *n*+2.
- Tour : piocher (pioche ou défausse) puis défausser ; on pose sa main si, après la défausse, **toutes** les cartes forment des suites/familles.
- Dernier tour pour les autres joueurs, avec pose partielle ; les cartes restantes pénalisent (3–10 : valeur, V 11, D 12, R 13, atout 20, joker 50).
- Atouts et jokers remplacent *n'importe quelle* carte (une combinaison peut même n'en contenir que).
- Points que le règlement ne précise pas : pas de suite qui boucle (roi→3), égalité = victoire partagée, une main solo déjà complète est retournée d'office.

## Développement
- La logique pure (paquet, combinaisons, solveur de pénalité minimale, IA) est isolée entre `// <logic>` et `// </logic>` dans `index.html`.
- Tests : `node test/logic.test.mjs`
- Audit des règles sur des parties complètes (Playwright) : atout = manche+2, 116 cartes conservées, combinaisons valides, pénalités exactes.
- `index.html?fast` supprime les animations et les délais des bots (utile pour les tests automatisés).

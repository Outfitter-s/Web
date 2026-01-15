# Outfitter

## Projet

Outfitter est une plateforme de création et de partage pensée pour vous accompagner et vous aider à vous habiller le matin. Nous sommes partis d’un constat simple : nous mettons trop de temps à choisir nos vêtements, entre hésitation et manque d’inspiration. De plus, certains habits restent oubliés au fond du placard. Outfitter permet de faire revivre ces pièces et d’éviter la fast fashion.

Prenez en photo et nommez tous les vêtements et accessoires de votre garde-robe, nous nous occupons du reste. Chaque jour, recevez des propositions de tenues adaptées à la météo et à votre style, via une interface intuitive de type "swipe". Si l’inspiration manque, explorez la partie sociale : suivez amis et influenceurs, partagez vos tenues et découvrez celles des autres.

## Équipe et rôles

- **Angus PAILLAUGUE** : Product Owner, Dev
- **Maxence BETH** : Dev
- **Paqui ESTHER** : Dev
- **Néo BOUGIO** : Dev
- **Yann LACAZE** : Dev
- **Clément REVERBEL** : Scrum master, Dev

## Fonctionnalités

- **Authentification** : Création de compte, connexion, gestion du profil (nom d’utilisateur, email, photo, mot de passe, 2FA via TOTP ou passkey)
- **Garde-robe** : Ajout, affichage, modification et suppression d’articles (photo, nom, description, couleur, motif, type)
- **Génération de tenues** : Propositions quotidiennes selon la météo et le style ; création manuelle de tenues à partir de sa garde-robe
- **Social** : Abonnement à des amis et influenceurs
- **Posts** : Partage de photos de tenues (une ou plusieurs)
- **Floutage des posts** : Les posts du flux sont floutés tant que l’utilisateur n’a pas publié sa tenue quotidienne, pour encourager la participation
- **Commentaires & réactions** : Réagir et commenter les posts
- **Flux** : Affichage d’un flux personnalisé basé sur les abonnements et un algorithme de recommandation (réactions, commentaires, dates, etc.)
- **CRUD global** : Tout contenu créé (vêtements, posts, commentaires, réactions, tenues, etc.) peut être modifié ou supprimé par son créateur

## Stack technique

- **Frontend** : Svelte, TailwindCSS, ShadCN
- **Backend** : SvelteKit
- **Base de données** : PostgreSQL (migrations via scripts maison)
- **Authentification** : JWT, TOTP, Passkey (gestion manuelle)
- **Stockage des images** : Local
- **Déploiement** : Docker (voir `docker-compose.yaml`), pipeline de build à chaque release, production sur le serveur personnel d’Angus
- **Collaboration** : Git & GitHub (boards agiles)

## Architecture du projet

```
outfitter/
├── src/
│   ├── routes/
│   │   ├── app/            # Pages pour utilisateurs authentifiés
│   │   ├── api/            # Routes API
│   │   └── (home)/         # Pages publiques (accueil, légal, auth, etc.)
│   ├── lib/
│   │   ├── components/     # Composants réutilisables
│   │   ├── server/         # DAO, valkey, SMTP, etc.
│   │   ├── utils/          # Fonctions utilitaires (dates, formulaires, logger, ...)
│   │   ├── types.ts        # Types TypeScript
│   │   ├── i18n.ts         # Internationalisation
│   │   └── theming/        # Gestion du thème
│   └── app.css             # Styles globaux
├── scripts/                # Scripts divers (migrations, i18n, ...)
├── sql/                    # Migrations et initialisation BD
├── tests/                  # Tests
├── transactional/          # Templates email
└── assets/                 # Images statiques générées par les utilisateurs
```

Cette architecture permet une séparation claire entre la logique métier, l’interface utilisateur, les accès aux données et les outils partagés, facilitant la maintenance, l’évolutivité et la collaboration au sein de l’équipe.

## Contribuer

Les contributions sont les bienvenues ! Merci de suivre les bonnes pratiques de développement et de soumettre vos Pull Requests sur une branche dédiée.

## Licence

Projet universitaire — Licence MIT

---

Pour toute question ou suggestion, ouvrez une issue ou contactez l’équipe du projet !

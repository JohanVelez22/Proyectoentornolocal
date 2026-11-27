# Guide des tunnels locaux (Cloudflare et ngrok)

Ce guide explique comment montrer un site qui tourne sur votre ordinateur (par exemple `http://localhost:8000` ou `https://mi-sitio.test`) via une adresse publique temporaire sur Internet, en toute sécurité et sans configurer votre routeur.

---

## 0. Dans WolfCore Dev : le plus simple

Vous n'avez pas besoin d'écrire de commandes. Dans **Projets**, sur la carte de votre site, activez l'interrupteur **Tunnel**. L'application s'occupe du reste :
- **elle demande une confirmation avant de publier** (bouton **Publier**) : le site reste sur Internet tant que le tunnel est ouvert. Pour les sites marqués **Contient des données réelles de clients**, l'avertissement est plus fort, et avec Expose ce n'est tout simplement pas autorisé ;
- elle utilise par défaut le tunnel rapide de Cloudflare (sans compte). Pour choisir un autre fournisseur (Cloudflare nommé, ngrok, Expose ou Tailscale), cliquez sur l'engrenage **Options du tunnel**, à côté de l'interrupteur ;
- elle a besoin de Nginx allumé et, avec Cloudflare, de cloudflared installé depuis **Services** ; s'il manque quelque chose, l'interrupteur vous l'indique ;
- elle ouvre le tunnel vers votre site local avec son bon domaine `.test` ;
- si le site a une **Variable d’URL de base** configurée (dans Laravel, `APP_URL` est détectée), elle écrit le lien public dans votre `.env` pendant que le tunnel est ouvert et remet la valeur d'origine à la fermeture ;
- elle affiche le lien sur la carte, avec les boutons **Ouvrir le lien public**, **Copier le lien public**, **Afficher le code QR du lien** et **Renouveler (nouveau lien)**. Le code QR se trouve aussi dans **Outils → Générateur de QR**.

Pour fermer le tunnel, éteignez l'interrupteur **Tunnel**. La vue **Tunnels** liste ceux qui sont ouverts.

Les commandes de ce guide servent à comprendre ce qui se passe en coulisses ou à utiliser les tunnels en dehors de l'application.

---

## 1. Qu'est-ce qu'un tunnel et quand l'utiliser

Un **tunnel** crée un pont temporaire et chiffré entre un serveur public sur Internet et un port de votre ordinateur. Toute personne qui ouvre l'adresse publique du tunnel verra votre projet local comme s'il était publié sur un serveur.

Quand c'est utile :
- **Montrer une avancée à un client** : vous partagez un lien temporaire pour qu'il vérifie le design ou un écran sans que vous ayez à mettre le projet sur un hébergement.
- **Tester sur le mobile ou sur un autre appareil** : vous ouvrez votre site depuis votre téléphone avec les données mobiles (sans être sur le même Wi-Fi) pour vérifier le design adaptatif, la caméra ou les paiements.
- **Recevoir des webhooks en local** : des services externes (passerelles de paiement, bots, GitHub, messagerie) ont besoin d'une adresse HTTPS publique pour prévenir votre application quand un événement se produit.

---

## 2. Risques et règles de sécurité

> **AVERTISSEMENT :** quand vous ouvrez un tunnel, **votre site local est publié sur Internet**. Toute personne qui a ou découvre le lien peut entrer.

Suivez toujours ces règles :
1. **N'ouvrez JAMAIS de tunnels vers des sites qui contiennent de vraies données de clients** (bases de données de production, vrais e-mails, documents, mots de passe ou clés actives). Utilisez toujours des données fictives ou de test (utilisateur `"demo"`, e-mails `@ejemplo.com`).
2. **Fermez le tunnel dès que vous avez terminé** le test ou la démonstration (`Ctrl+C` dans le terminal ou avec le bouton d'arrêt).
3. **Désactivez les outils dangereux** avant de partager : n'exposez pas de panneaux de base de données (phpMyAdmin/Adminer), de routes de débogage sans mot de passe ni de fichiers `.env`.
4. **Ne laissez pas `APP_DEBUG=true`** si vous donnez le lien à des tiers, car une page d'erreur peut afficher des variables d'environnement et des chemins internes de votre ordinateur.

---

## 3. Cloudflare rapide (`trycloudflare`)

C'est la façon la plus rapide d'obtenir un lien HTTPS temporaire : **aucun compte** ni domaine personnel n'est nécessaire.

### Commande de base

Si votre projet tourne sur le port `8000` (par exemple FastAPI, Vite ou PHP) :

```bash
cloudflared tunnel --url http://localhost:8000
```

Si votre site passe par Nginx local avec un domaine `.test` (par exemple `mi-sitio.test` sur le port `80`), indiquez aussi le domaine, car Nginx choisit le site selon l'en-tête `Host` :

```bash
cloudflared tunnel --url http://localhost:80 --http-host-header mi-sitio.test
```

En quelques secondes, vous verrez une URL temporaire qui ressemble à :

```text
https://ejemplo-aleatorio.trycloudflare.com
```

### Limites de `trycloudflare`
- L'adresse **change à chaque fois** que vous fermez et rouvrez le tunnel.
- Il est conçu pour des tests courts et des démonstrations, **pas pour la production**.
- Il n'offre ni SLA ni panneau d'inspection du trafic local comme ngrok.
- Si vous redémarrez le processus, vous devrez recoller la nouvelle URL dans vos webhooks ou la renvoyer au client.

---

## 4. Cloudflare avec votre domaine (tunnel nommé)

Si vous avez besoin d'une adresse fixe (par exemple `demo.ejemplo.com`) et que vous avez un domaine géré dans Cloudflare, vous pouvez créer un tunnel nommé.

> Dans les exemples suivants, remplacez `ejemplo.com` par votre domaine de test et `mi-tunel-demo` par le nom que vous choisissez.

### Étape 1 : se connecter à Cloudflare

```bash
cloudflared tunnel login
```

Le navigateur s'ouvre pour choisir le domaine que vous voulez autoriser, et un certificat est enregistré sur votre ordinateur.

### Étape 2 : créer le tunnel

```bash
cloudflared tunnel create mi-tunel-demo
```

Cloudflare attribuera un identifiant (UUID) et enregistrera le fichier d'identifiants local du tunnel.

### Étape 3 : associer un sous-domaine DNS

```bash
cloudflared tunnel route dns mi-tunel-demo demo.ejemplo.com
```

Cela crée un enregistrement CNAME dans Cloudflare qui pointe `demo.ejemplo.com` vers votre tunnel.

### Étape 4 : lancer le tunnel

Vous pouvez le démarrer directement en visant votre port local :

```bash
cloudflared tunnel run --url http://localhost:8000 mi-tunel-demo
```

Quand vous ne voulez plus publier le site, appuyez sur `Ctrl+C` dans le terminal.

### Étape 5 : supprimer le tunnel quand vous n'en avez plus besoin

```bash
cloudflared tunnel cleanup mi-tunel-demo
cloudflared tunnel delete mi-tunel-demo
```

Pensez à supprimer aussi l'enregistrement DNS de test dans le panneau de Cloudflare si vous ne comptez pas réutiliser le sous-domaine.

---

## 5. ngrok

`ngrok` est un autre outil très populaire pour les tunnels locaux. Son grand avantage pour les développeurs est l'**inspecteur local**, qui permet de voir et de rejouer chaque requête HTTP (idéal pour déboguer des webhooks).

### Installation et configuration initiale

1. Téléchargez et installez `ngrok` (ou utilisez la version installée dans votre environnement).
2. Créez un compte gratuit sur ngrok et copiez votre jeton d'authentification.
3. Enregistrez votre jeton une seule fois (remplacez `MI_TOKEN` par votre vrai jeton) :

```bash
ngrok config add-authtoken MI_TOKEN
```

### Ouvrir un tunnel vers un port local

```bash
ngrok http 8000
```

### Ouvrir un tunnel vers un site avec un domaine `.test` (Nginx)

Nginx choisit le site selon l'en-tête `Host` : ngrok doit donc l'envoyer avec votre domaine local. Visez le port HTTP (`80`) : ngrok fournit déjà le lien public en HTTPS.

```bash
ngrok http 80 --host-header=mi-sitio.test
```

> **Remarque :** dans les versions récentes de ngrok, `--host-header` est marqué comme obsolète. Ce qui est recommandé, c'est une *politique de trafic* (un fichier YAML qui réécrit l'en-tête `Host`) que l'on passe avec `--traffic-policy-file`. Si votre version signale que l'option est obsolète, consultez la documentation officielle de *Traffic Policy* de ngrok. WolfCore Dev utilise déjà la politique de trafic pour vous.

> **Évitez** `ngrok http 443` : ngrok parlerait alors en HTTP non chiffré à un port qui attend du HTTPS, et le site échouerait. Si vous avez vraiment besoin du port 443, l'adresse doit commencer par `https://` (`ngrok http https://localhost:443 ...`) et le certificat local doit être de confiance.

### Inspecteur local

Pendant que ngrok tourne, ouvrez dans votre navigateur :

```text
http://127.0.0.1:4040
```

Vous y verrez en direct chaque requête qui arrive par le tunnel (en-têtes, JSON, code HTTP) et vous pourrez cliquer sur **Replay** pour redéclencher un webhook sans avoir à refaire l'action dans le service externe.

### Limites du plan gratuit (en termes généraux)
- Il nécessite un compte et un `authtoken`.
- La première fois qu'un visiteur ouvre le lien dans un navigateur, ngrok affiche une page d'avertissement intermédiaire que l'utilisateur doit accepter.
- Il existe des limites sur le nombre de tunnels simultanés, le trafic mensuel et les connexions actives, qui peuvent changer selon les conditions en vigueur de ngrok.

---

## 6. Problèmes courants et comment les résoudre

### Erreur `502 Bad Gateway`
- **Cause :** le tunnel est actif, mais aucun service n'écoute sur le port local indiqué, ou PHP (php-cgi sous Windows, PHP-FPM sous Linux et macOS) ou votre serveur de développement est éteint.
- **Solution :** vérifiez d'abord sur votre propre ordinateur que `http://localhost:PUERTO` ou `https://mi-sitio.test` s'ouvre bien avant de lancer le tunnel.

### `"Invalid Host header"` (Vite, Webpack, Angular, Django)
- **Cause :** le serveur de développement bloque les requêtes dont l'en-tête `Host` ne correspond pas à `localhost`.
- **Solution :** autorisez l'hôte du tunnel dans la configuration de développement (par exemple `server.allowedHosts` dans Vite ou `ALLOWED_HOSTS` dans Django) uniquement pendant la durée du test.

### Redirections inattendues vers `http://` ou vers `mi-sitio.test`
- **Cause :** votre application ou Nginx génère des URL absolues avec le domaine local ou le schéma `http`, parce qu'elle ne fait pas confiance aux en-têtes du proxy (`X-Forwarded-Proto`, `X-Forwarded-Host`).
- **Solution :** configurez l'application pour qu'elle fasse confiance aux proxys (dans Laravel, vérifiez `TrustProxies` ; dans FastAPI/uvicorn, utilisez `--proxy-headers`).

### `APP_URL` dans Laravel
- **Cause :** si `APP_URL=http://mi-sitio.test` dans `.env`, les liens des e-mails, les redirections ou les routes signées pointeront vers `mi-sitio.test` (qui n'existe pas sur le mobile du client).
- **Solution :** pendant la démo, mettez temporairement `APP_URL` sur l'URL HTTPS du tunnel et exécutez `php artisan config:clear`. Une fois terminé, remettez votre `APP_URL` local.

### Cookies, session et erreur `419 Page Expired` (CSRF)
- **Cause :** `SESSION_DOMAIN` dans `.env` est fixé à `mi-sitio.test` (le navigateur rejette le cookie quand il visite le domaine du tunnel) ou `SESSION_SECURE_COOKIE` ne correspond pas à HTTPS.
- **Solution :** laissez `SESSION_DOMAIN=null` (vide) pendant le test par tunnel, exécutez `php artisan config:clear`, supprimez les cookies du navigateur et rechargez le formulaire.

### Mixed Content (styles ou scripts bloqués)
- **Cause :** le tunnel s'ouvre en `https://`, mais la page essaie de charger du CSS, du JS ou des images depuis `http://`. Le navigateur bloque ces ressources par sécurité.
- **Solution :** utilisez des chemins relatifs (`/assets/app.css`) ou forcez le schéma HTTPS quand la requête arrive par un proxy (`URL::forceScheme('https')` dans Laravel quand c'est approprié).

---

## 7. Pourquoi le FTP ne se partage PAS par tunnel

**Ne partagez jamais un serveur FTP classique (port 21) par un tunnel vers Internet :**
- Le protocole FTP standard envoie **l'utilisateur, le mot de passe et les fichiers en clair (non chiffrés)**, et il utilise en plus plusieurs ports dynamiques pour transférer les données, qui échouent souvent à travers des tunnels HTTP.
- Exposer le FTP sur Internet ouvre une surface d'attaque inutile sur les fichiers de votre ordinateur.
- C'est pourquoi **WolfCore Dev ne propose pas de tunnel TCP ngrok pour le FTP** : un tunnel TCP public laisserait le mot de passe à la vue de toute personne capable d'observer le trafic.

### Alternatives recommandées
- **Dans le même bureau ou la même maison (réseau local) :** utilisez l'interrupteur **Réseau local** de votre site, ou le FTP avec le réseau local activé, pour partager les fichiers au sein de votre réseau privé sans passer par Internet.
- **Transfert chiffré :** **SFTP** (sur SSH) ou **FTPS** (FTP avec TLS), avec des comptes dédiés et des mots de passe forts. WolfCore Dev l'intégrera plus tard. En attendant, vous pouvez aussi synchroniser le code avec **Git** (GitHub/GitLab/Bitbucket).

---

## 8. Aide-mémoire des commandes

| Outil | Commande | À quoi ça sert |
|---|---|---|
| `cloudflared` | `cloudflared tunnel --url http://localhost:8000` | Ouvre un tunnel HTTPS rapide et temporaire sans compte (`trycloudflare`). |
| `cloudflared` | `cloudflared tunnel --url http://localhost:80 --http-host-header mi-sitio.test` | Ouvre un tunnel rapide en envoyant l'en-tête `Host` d'un site local sous Nginx. |
| `cloudflared` | `cloudflared tunnel login` | Autorise votre ordinateur sur votre compte Cloudflare pour utiliser un domaine personnel. |
| `cloudflared` | `cloudflared tunnel create mi-tunel-demo` | Crée un tunnel nommé persistant. |
| `cloudflared` | `cloudflared tunnel route dns mi-tunel-demo demo.ejemplo.com` | Relie un sous-domaine de votre domaine Cloudflare au tunnel. |
| `cloudflared` | `cloudflared tunnel run --url http://localhost:8000 mi-tunel-demo` | Démarre le tunnel nommé en visant votre port local. |
| `cloudflared` | `cloudflared tunnel cleanup mi-tunel-demo` | Ferme les connexions restées ouvertes du tunnel avant de le supprimer. |
| `cloudflared` | `cloudflared tunnel delete mi-tunel-demo` | Supprime un tunnel nommé dont vous n'avez plus besoin. |
| `ngrok` | `ngrok config add-authtoken MI_TOKEN` | Enregistre votre jeton de compte dans la configuration locale de ngrok. |
| `ngrok` | `ngrok http 8000` | Expose le port local `8000` avec une URL publique HTTPS. |
| `ngrok` | `ngrok http 80 --host-header=mi-sitio.test` | Expose un site local sous Nginx en envoyant son domaine `.test` dans l'en-tête `Host` ; le lien public sort déjà en HTTPS. |
| `ngrok` | Ouvrir `http://127.0.0.1:4040` dans le navigateur | Affiche l'inspecteur local de requêtes et permet de renvoyer des webhooks. |

# Local tunnels guide (Cloudflare and ngrok)

This guide explains how to show a site that runs on your computer (for example `http://localhost:8000` or `https://mi-sitio.test`) through a temporary public address on the internet, safely and without configuring your router.

---

## 0. In WolfCore Dev: the easy way

You don't need to type any commands. In **Projects**, on your site's card, turn on the **Tunnel** switch. The app takes care of the rest:
- **it asks for your confirmation before publishing** (**Publish** button): the site is on the internet for as long as the tunnel stays open. For sites marked as **Has real customer data** the warning is stronger, and with Expose it is not allowed at all;
- it uses the Cloudflare quick tunnel by default (no account needed). To choose another provider (named Cloudflare, ngrok, Expose or Tailscale), click the gear **Tunnel options**, next to the switch;
- it needs Nginx running and, with Cloudflare, cloudflared installed from **Services**; if something is missing, the switch tells you;
- it opens the tunnel to your local site with its correct `.test` domain;
- if the site has a **Base URL variable** set up (in Laravel, `APP_URL` is detected), it writes the public link into your `.env` while the tunnel is open and puts it back as it was when you close it;
- it shows the link on the card, with the buttons **Open the public link**, **Copy the public link**, **Show the QR code of the link** and **Renew (new link)**. The QR code is also in **Tools → QR generator**.

To close it, turn off the **Tunnel** switch. The **Tunnels** view lists the ones that are open.

The commands in this guide help you understand what happens under the hood, or use tunnels outside the app.

---

## 1. What a tunnel is and when to use it

A **tunnel** creates a temporary, encrypted bridge between a public server on the internet and a port on your computer. Anyone who opens the tunnel's public address will see your local project as if it were published on a server.

When it is useful:
- **Showing progress to a client**: you share a temporary link so they can review the design or a screen without uploading the project to a hosting service.
- **Testing on your phone or another device**: you open your site from your phone using mobile data (without being on the same Wi-Fi) to check responsive design, camera or payments.
- **Receiving webhooks locally**: external services (payment gateways, bots, GitHub, messaging) need a public HTTPS address to notify your application when an event happens.

---

## 2. Risks and security rules

> **WARNING:** When you open a tunnel, **your local site is published on the internet**. Anyone who has or discovers the link can get in.

Always follow these rules:
1. **NEVER open tunnels for sites that contain real customer data** (production databases, real emails, documents, passwords or active keys). Always use fictitious or test data (user `"demo"`, emails `@ejemplo.com`).
2. **Close the tunnel as soon as you finish** the test or the demo (`Ctrl+C` in the terminal or with the stop button).
3. **Turn off dangerous tools** before sharing: don't expose database panels (phpMyAdmin/Adminer), debug routes without a password or `.env` files.
4. **Don't leave `APP_DEBUG=true`** if you are going to give the link to third parties, because an error page can show environment variables and internal paths of your computer.

---

## 3. Quick Cloudflare (`trycloudflare`)

It is the fastest way to get a temporary HTTPS link: it **needs no account** and no domain of your own.

### Basic command

If your project runs on port `8000` (for example FastAPI, Vite or PHP):

```bash
cloudflared tunnel --url http://localhost:8000
```

If your site goes through local Nginx with a `.test` domain (for example `mi-sitio.test` on port `80`), also give the domain, because Nginx picks the site based on the `Host` header:

```bash
cloudflared tunnel --url http://localhost:80 --http-host-header mi-sitio.test
```

In a few seconds you will see a temporary URL similar to:

```text
https://ejemplo-aleatorio.trycloudflare.com
```

### Limitations of `trycloudflare`
- The address **changes every time** you close and reopen the tunnel.
- It is meant for short tests and demos, **not for production**.
- It offers no SLA and no local traffic inspection panel like ngrok.
- If you restart the process, you will have to paste the new URL into your webhooks again or send it to the client again.

---

## 4. Cloudflare with your own domain (named tunnel)

If you need a fixed address (for example `demo.ejemplo.com`) and you have a domain managed in Cloudflare, you can create a named tunnel.

> In the following examples, replace `ejemplo.com` with your test domain and `mi-tunel-demo` with the name you choose.

### Step 1: Log in to Cloudflare

```bash
cloudflared tunnel login
```

Your browser will open so you can choose the domain you want to authorize, and a certificate will be saved on your computer.

### Step 2: Create the tunnel

```bash
cloudflared tunnel create mi-tunel-demo
```

Cloudflare will assign an identifier (UUID) and save the tunnel's local credentials file.

### Step 3: Link a DNS subdomain

```bash
cloudflared tunnel route dns mi-tunel-demo demo.ejemplo.com
```

This creates a CNAME record in Cloudflare pointing `demo.ejemplo.com` to your tunnel.

### Step 4: Run the tunnel

You can start it directly, pointing at your local port:

```bash
cloudflared tunnel run --url http://localhost:8000 mi-tunel-demo
```

When you no longer want to publish the site, press `Ctrl+C` in the terminal.

### Step 5: Delete the tunnel when you no longer need it

```bash
cloudflared tunnel cleanup mi-tunel-demo
cloudflared tunnel delete mi-tunel-demo
```

Remember to also delete the test DNS record in the Cloudflare dashboard if you won't reuse the subdomain.

---

## 5. ngrok

`ngrok` is another very popular tool for local tunnels. Its big advantage for developers is the **local inspector**, which lets you see and resend every HTTP request (ideal for debugging webhooks).

### Installation and initial setup

1. Download and install `ngrok` (or use the version installed in your environment).
2. Create a free ngrok account and copy your authentication token.
3. Register your token just once (replace `TU_TOKEN` with your real token):

```bash
ngrok config add-authtoken TU_TOKEN
```

### Open a tunnel to a local port

```bash
ngrok http 8000
```

### Open a tunnel to a site with a `.test` domain (Nginx)

Nginx picks the site based on the `Host` header, so ngrok must send it with your local domain. Point it at the HTTP port (`80`): ngrok already delivers the public link with HTTPS.

```bash
ngrok http 80 --host-header=mi-sitio.test
```

> **Note:** in recent versions of ngrok, `--host-header` is marked as deprecated. The recommended way is a *traffic policy* (a YAML file that rewrites the `Host` header) passed with `--traffic-policy-file`. If your version warns that the option is deprecated, check ngrok's official *Traffic Policy* documentation. WolfCore Dev already uses the traffic policy for you.

> **Avoid** `ngrok http 443`: that way ngrok talks unencrypted HTTP to a port that expects HTTPS, and the site fails. If you really need port 443, the address must start with `https://` (`ngrok http https://localhost:443 ...`) and the local certificate must be trusted.

### Local inspector

While ngrok is running, open this in your browser:

```text
http://127.0.0.1:4040
```

There you will see live every request that arrives through the tunnel (headers, JSON, HTTP code) and you can click **Replay** to fire a webhook again without repeating the action in the external service.

### Free plan limits (in general terms)
- It requires an account and an `authtoken`.
- The first time a visitor opens the link in a browser, ngrok shows an interstitial warning page that the user must accept.
- There are limits on the number of simultaneous tunnels, monthly traffic and active connections, which may change according to ngrok's current terms.

---

## 6. Common problems and how to solve them

### `502 Bad Gateway` error
- **Cause:** the tunnel is active, but no service is listening on the local port you gave, or PHP (php-cgi on Windows, PHP-FPM on Linux and macOS) or your development server is off.
- **Solution:** first check on your own computer that `http://localhost:PUERTO` or `https://mi-sitio.test` opens fine before starting the tunnel.

### `"Invalid Host header"` (Vite, Webpack, Angular, Django)
- **Cause:** the development server blocks requests whose `Host` header doesn't match `localhost`.
- **Solution:** allow the tunnel's host in the development configuration (for example `server.allowedHosts` in Vite or `ALLOWED_HOSTS` in Django) only for the duration of the test.

### Unexpected redirects to `http://` or to `mi-sitio.test`
- **Cause:** your application or Nginx generates absolute URLs using the local domain or the `http` scheme because it doesn't trust the proxy headers (`X-Forwarded-Proto`, `X-Forwarded-Host`).
- **Solution:** configure the application to trust proxies (in Laravel, check `TrustProxies`; in FastAPI/uvicorn, use `--proxy-headers`).

### `APP_URL` in Laravel
- **Cause:** if `APP_URL=http://mi-sitio.test` in `.env`, the links in emails, redirects or signed routes will point to `mi-sitio.test` (which doesn't exist on your client's phone).
- **Solution:** during the demo, temporarily change `APP_URL` to the tunnel's HTTPS URL and run `php artisan config:clear`. When you finish, set your local `APP_URL` back.

### Cookies, session and `419 Page Expired` error (CSRF)
- **Cause:** `SESSION_DOMAIN` in `.env` is set to `mi-sitio.test` (the browser discards the cookie when visiting the tunnel's domain) or `SESSION_SECURE_COOKIE` doesn't match HTTPS.
- **Solution:** leave `SESSION_DOMAIN=null` (empty) during the tunnel test, run `php artisan config:clear`, clear your browser's cookies and reload the form.

### Mixed Content (blocked styles or scripts)
- **Cause:** the tunnel opens on `https://`, but the page tries to load CSS, JS or images from `http://`. The browser blocks those resources for security.
- **Solution:** use relative paths (`/assets/app.css`) or force the HTTPS scheme when the request comes through a proxy (`URL::forceScheme('https')` in Laravel when appropriate).

---

## 7. Why FTP is NOT shared through a tunnel

**Never share a classic FTP server (port 21) through a tunnel to the internet:**
- The standard FTP protocol sends **the username, the password and the files in plain text (unencrypted)**, and it also uses multiple dynamic ports to transfer data, which often fail through HTTP tunnels.
- Exposing FTP to the internet opens an unnecessary attack surface on the files of your computer.
- That is why **WolfCore Dev does not offer an ngrok TCP tunnel for FTP**: a public TCP tunnel would leave the password visible to anyone who can watch the traffic.

### Recommended alternatives
- **In the same office or home (local network):** use your site's **Local network** switch, or FTP with the local network enabled, to share files inside your private network without going out to the internet.
- **Encrypted transfer:** **SFTP** (over SSH) or **FTPS** (FTP with TLS) with dedicated accounts and strong passwords. WolfCore Dev will add it later. In the meantime, you can also sync the code with **Git** (GitHub/GitLab/Bitbucket).

---

## 8. Command cheat sheet

| Tool | Command | What it does |
|---|---|---|
| `cloudflared` | `cloudflared tunnel --url http://localhost:8000` | Opens a quick, temporary HTTPS tunnel with no account (`trycloudflare`). |
| `cloudflared` | `cloudflared tunnel --url http://localhost:80 --http-host-header mi-sitio.test` | Opens a quick tunnel sending the `Host` header of a local site on Nginx. |
| `cloudflared` | `cloudflared tunnel login` | Authorizes your computer on your Cloudflare account to use a domain of your own. |
| `cloudflared` | `cloudflared tunnel create mi-tunel-demo` | Creates a persistent named tunnel. |
| `cloudflared` | `cloudflared tunnel route dns mi-tunel-demo demo.ejemplo.com` | Connects a subdomain of your Cloudflare domain to the tunnel. |
| `cloudflared` | `cloudflared tunnel run --url http://localhost:8000 mi-tunel-demo` | Starts the named tunnel pointing at your local port. |
| `cloudflared` | `cloudflared tunnel cleanup mi-tunel-demo` | Closes any connections left open on the tunnel before you delete it. |
| `cloudflared` | `cloudflared tunnel delete mi-tunel-demo` | Deletes a named tunnel you no longer need. |
| `ngrok` | `ngrok config add-authtoken TU_TOKEN` | Saves your account token in ngrok's local configuration. |
| `ngrok` | `ngrok http 8000` | Exposes local port `8000` with a public HTTPS URL. |
| `ngrok` | `ngrok http 80 --host-header=mi-sitio.test` | Exposes a local Nginx site sending its `.test` domain in the `Host` header; the public link already comes with HTTPS. |
| `ngrok` | Open `http://127.0.0.1:4040` in the browser | Shows the local request inspector and lets you resend webhooks. |

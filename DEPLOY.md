# Deploy Riders Plus on Render (from your phone)

The app needs to be on the `main` branch. If GitHub still shows an open pull request for the import, merge that first. Then:

1. Open [render.com](https://render.com) and sign in with GitHub (the account that owns **Riders-pluss**).
2. If GitHub asks, allow Render to see that repository.
3. Tap **New**, then **Blueprint**.
4. Pick **antoniogonesurfing-png/Riders-pluss**.
5. Render reads `render.yaml`. Fill in the two secrets:
   - **ADMIN_EMAIL** — the email you will use to log in
   - **ADMIN_PASSWORD** — 8 or more characters
6. Leave **STRIPE_SECRET_KEY** and **STRIPE_WEBHOOK_SECRET** empty. Checkout stays in test mode until you add real Stripe keys later.
7. Confirm the plan is **Starter** (not Free) and that a disk is attached at `/var/data` (1 GB). Free has no persistent disk, so the database would be wiped on every redeploy.
8. Tap **Deploy**. Wait until the service says **Live**. The first start loads the events, retreats, test bots, and your admin user.
9. Open the service URL, go to `/login`, sign in with that email and password, then open `/admin`.

Starter is the cheapest paid web service (about $7/month). The 1 GB disk is about $0.25/month. That is the smallest setup that keeps data across deploys.

The blueprint uses the Frankfurt region. To use another region, change `region` in `render.yaml` before the first deploy. A disk also means the service stays on one instance and restarts for a few seconds on each deploy.

To change the admin password later, edit **ADMIN_PASSWORD** in the Render dashboard and redeploy. The next start applies it. Do not set `PORT` yourself; Render sets it, and the server listens on that port.

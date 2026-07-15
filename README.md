# Iqama Website

Landing page, privacy policy, and support page for the Iqama app. Hosted on GitHub Pages.

## Deploy (one time)

```bash
cd iqama-site
git init
git add .
git commit -m "Iqama website: landing, privacy, support"
git branch -M main
# Create the repo first at https://github.com/new (name: iqama-site, public)
git remote add origin https://github.com/giio-o/iqama-site.git
git push -u origin main
```

Then on GitHub: **Settings → Pages → Source: Deploy from a branch → Branch: main / (root) → Save**.

Site goes live in ~2 minutes at:

- Landing: https://giio-o.github.io/iqama-site/
- Privacy policy (use this URL in both stores): https://giio-o.github.io/iqama-site/privacy.html
- Support (use as App Store "Support URL"): https://giio-o.github.io/iqama-site/support.html

## Updating

Edit the HTML, commit, push. Pages redeploys automatically.

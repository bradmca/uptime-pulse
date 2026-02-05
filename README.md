# ⚡ Uptime-Pulse ⚡

[![CI / Continuous Integration](https://github.com/USER_OR_ORG/uptime-pulse/actions/workflows/ci.yml/badge.svg)](https://github.com/USER_OR_ORG/uptime-pulse/actions)
[![Uptime Check](https://github.com/USER_OR_ORG/uptime-pulse/actions/workflows/uptime-check.yml/badge.svg)](https://github.com/USER_OR_ORG/uptime-pulse/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

<p align="center">
  <img src="public/social-preview.png" alt="Uptime Pulse Social Preview" width="100%">
</p>

> **"As a dev-ops engineer, I want a simple way to monitor my microservices without paying for Pingdom."**

---

## 📺 Demo

<p align="center">
  <img src="public/demo.gif" alt="Uptime Pulse Demo Animation">
</p>

Uptime-Pulse is a **lightweight, premium, and open-source** uptime monitoring solution. Built for speed, aesthetic excellence, and simplicity. Monitor your microservices, track latency, and receive downtime alerts without the enterprise price tag.

---

## ✨ Features

- **💎 Premium Dashboard**: Stunning dark theme with glassmorphism, pulse animations, and interactive elements.
- **🕒 24h Visual History**: Segmented status bars providing a 24-hour lookback at a glance.
- **📈 Latency Tracking**: Real-time measurement of response times with historical averages.
- **🔔 Proactive Alerts**: Integrated notification system for downtime and recovery.
- **🤖 Automation First**: GitHub Actions workflow included for hands-free 24/7 monitoring.
- **📦 Zero Heavy Dependencies**: Simple JSON file-based storage. No complex database migrations.

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/USER_OR_ORG/uptime-pulse.git
cd uptime-pulse
npm install
```

### 2. Configure (Optional)
Copy `.env.example` to `.env` and set your deployment domain and secrets.
```bash
cp .env.example .env
```

### 3. Run Locally
```bash
npm run dev
```
Navigate to [http://localhost:3000](http://localhost:3000).

---

## 🛠️ Tech Stack

- **Core**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styles**: Vanilla CSS with Modern Design Tokens
- **CI/CD**: [GitHub Actions](https://github.com/features/actions)
- **Icons**: Custom Hand-crafted SVGs

---

## 🤖 Automate Your Monitoring

To run checks every 5 minutes automatically:

1. Deploy to **Vercel** or **Netlify**.
2. Go to your GitHub Repository **Settings > Secrets and variables > Actions**.
3. Add `APP_DOMAIN` (e.g., `uptime-pulse-demo.vercel.app`).
4. Add `API_SECRET` (optional).
5. The `Uptime Check` action will now run every 5 minutes and keep your dashboard alive!

---

## 📁 Project Structure

```text
├── .github/workflows/   # CI/CD and Automation
├── src/
│   ├── app/             # Next.js Routes & Dashboard
│   ├── components/      # Glassmorphic UI Components
│   ├── lib/             # Health Checker, Storage, Notifications
│   └── types/           # Type Definitions
├── data/                # Persistent JSON Storage
└── public/              # Static Assets
```

---

## 🤝 Contributing

We love contributions! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) to get started.

## 🛡️ Security

Found a bug? See our [SECURITY.md](SECURITY.md).

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

---

<p align="center">
  Built with ❤️ by the Uptime-Pulse community.
</p>

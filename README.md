# 🏇 ATR Stable Tour Scraper

A comprehensive web scraping tool that collects and tracks stable tours from [At The Races](https://www.attheraces.com/stable-tours) and updates horse notes on [Timeform](https://www.timeform.com/).

---

## 📑 Table of Contents

- [✨ Features](#-features)
- [⚙️ Prerequisites](#️-prerequisites)
- [🚀 Setup](#-setup)
- [🔐 Environment Variables](#-environment-variables)
- [📖 Usage](#-usage)
  - [Main Commands](#main-commands)
- [📜 Scripts Overview](#-scripts-overview)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## ✨ Features

- **Stable Tour Scraping**: Efficiently scrapes stable tour information for each trainer listed on At The Races.
- **Horse Notes Tracking**: Automatically logs into Timeform to add or update horse notes.
- **Retry Mechanism**: Allows retrying updates for horses that failed to save on the first attempt.
- **Interactive Menu**: Easily run different features of the scraper using an interactive menu with `start.bat`.

---

## ⚙️ Prerequisites

Ensure you have the following tools installed on your machine:

- [Node.js](https://nodejs.org/) (Version 14+ recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Git](https://git-scm.com/) for cloning the repository

---

## 🚀 Setup

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/watsonpaul80/Tour_Scraper.git
   cd Tour_Scraper

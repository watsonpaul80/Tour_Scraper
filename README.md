# 🏇 ATR Stable Tour Scraper

A comprehensive web scraping tool that collects and tracks stable tours from [At The Races](https://www.attheraces.com/stable-tours) and updates horse notes on [Timeform](https://www.timeform.com/).

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

## ✨ Features

- **Stable Tour Scraping**: Efficiently scrapes stable tour information for each trainer listed on At The Races.
- **Horse Notes Tracking**: Automatically logs into Timeform to add or update horse notes.
- **Retry Mechanism**: Allows retrying updates for horses that failed to save on the first attempt.
- **Interactive Menu**: Easily run different features of the scraper using an interactive menu with `start.bat`.

## ⚙️ Prerequisites

Ensure you have the following tools installed on your machine:

- [Node.js](https://nodejs.org/) (Version 14+ recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Git](https://git-scm.com/) for cloning the repository

## 🚀 Setup

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/watsonpaul80/Tour_Scraper.git
   cd Tour_Scraper
   ```

2. **Install Dependencies**:

   ```bash
   npm install
   ```

3. **Configure Environment Variables**:

   Create a `.env` file in the root directory and add your Timeform login credentials as specified in the [Environment Variables](#-environment-variables) section.

## 🔐 Environment Variables

To enable login functionality, add your Timeform credentials in a `.env` file in the following format:

```
EMAIL=your_email@example.com
PASSWORD=your_password
```

Note: Be sure to replace `your_email@example.com` and `your_password` with your actual credentials.

⚠️ Keep the `.env` file private and do not commit it to version control.

## 📖 Usage

This project provides several scripts to perform different functions.

### Main Commands

1. **Run the Stable Tour Scraper**:
   Scrapes stable tour information from At The Races and saves each trainer's notes in the output folder.

   ```bash
   node collect.js
   ```

2. **Login and Add Notes to Timeform**:
   Logs into Timeform and updates each horse's notes using the scraped data.

   ```bash
   node trackerlogin.js
   ```

3. **Retry Failed Saves**:
   Attempts to re-save notes for horses that failed to save during the initial update process.

   ```bash
   node failedhorses.js
   ```

4. **Run All Commands with Interactive Menu**:
   Use `start.bat` to launch an interactive menu that allows you to choose and run each function of the scraper easily.

   ```bash
   start.bat
   ```

## 📜 Scripts Overview

Here's a quick breakdown of each key script:

- `collect.js`: Scrapes the stable tours on At The Races and saves each trainer's notes to an individual file in the output folder.
- `trackerlogin.js`: Logs into Timeform using credentials from the `.env` file and updates horse notes based on the scraped data.
- `failedhorses.js`: Attempts to re-save notes for horses that failed to save on the first attempt, allowing for error handling and retries.
- `start.bat`: Provides an interactive menu to run the main commands in the project.

## 🤝 Contributing

Contributions are always welcome! To get started:

1. Fork the repository.
2. Create a new branch for your feature or bugfix.
3. Submit a pull request, and make sure to include a detailed description of your changes.

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for more details.

Enjoy using the ATR Stable Tour Scraper! 🏇 If you have any questions, feel free to reach out or open an issue.

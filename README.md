🏇 ATR Stable Tour Scraper
A comprehensive web scraping tool that collects and tracks stable tours from At The Races and updates horse notes on Timeform.

📑 Table of Contents
✨ Features
⚙️ Prerequisites
🚀 Setup
🔐 Environment Variables
📖 Usage
Main Commands
Additional Commands
📜 Scripts Overview
🤝 Contributing
📄 License
✨ Features
Stable Tour Scraping: Efficiently scrapes stable tour information for each trainer listed on At The Races.
Horse Notes Tracking: Automatically logs into Timeform to add or update horse notes.
Retry Mechanism: Allows retrying updates for horses that failed to save on the first attempt.
⚙️ Prerequisites
Ensure you have the following tools installed on your machine:

Node.js (Version 14+ recommended)
npm (comes with Node.js)
Git for cloning the repository
🚀 Setup
Clone the Repository:

bash
Copy code
git clone https://github.com/watsonpaul80/Tour_Scraper.git
cd Tour_Scraper
Install Dependencies:

bash
Copy code
npm install
Configure Environment Variables:

Create a .env file in the root directory and add your Timeform login credentials as specified in the Environment Variables section.

🔐 Environment Variables
To enable login functionality, add your Timeform credentials in a .env file in the following format:

plaintext
Copy code
EMAIL=your_email@example.com
PASSWORD=your_password
Note: Be sure to replace your_email@example.com and your_password with your actual credentials.
⚠️ Keep the .env file private and do not commit it to version control.

📖 Usage
This project provides several scripts to perform different functions.

Main Commands
Run the Stable Tour Scraper:

Scrapes stable tour information from At The Races and saves each trainer's notes in the output folder.
bash
Copy code
node collect.js
Login and Add Notes to Timeform:

Logs into Timeform and updates each horse's notes using the scraped data.
bash
Copy code
node trackerlogin.js
Retry Failed Saves:

Attempts to re-save notes for horses that failed to save during the initial update process.
bash
Copy code
node failedhorses.js
Additional Commands
Run All Commands with Menu:
If you have a start.bat or menu script, you can use it to interactively run each function.
📜 Scripts Overview
Here’s a quick breakdown of each key script:

collect.js: Scrapes the stable tours on At The Races and saves each trainer's notes to an individual file in the output folder.
trackerlogin.js: Logs into Timeform using credentials from the .env file and updates horse notes based on the scraped data.
failedhorses.js: Attempts to re-save notes for horses that failed to save on the first attempt, allowing for error handling and retries.
🤝 Contributing
Contributions are always welcome! To get started:

Fork the repository.
Create a new branch for your feature or bugfix.
Submit a pull request, and make sure to include a detailed description of your changes.
📄 License
This project is licensed under the MIT License. See the LICENSE file for more details.

Enjoy using the ATR Stable Tour Scraper! 🏇 If you have any questions, feel free to reach out or open an issue.


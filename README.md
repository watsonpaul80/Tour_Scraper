ATR Stable Tour Scraper
This project is a web scraping tool that collects and tracks stable tours from At The Races and updates horse notes on Timeform.

Table of Contents
Features
Prerequisites
Setup
Environment Variables
Usage
Scripts
Contributing
License
Features
Stable Tour Scraping: Scrapes stable tour information for each trainer listed on At The Races.
Horse Notes Tracking: Logs into Timeform to add/update horse notes automatically.
Retry Mechanism: Supports retrying updates for horses that failed to save previously.
Prerequisites
Node.js (Version 14+ recommended)
npm (comes with Node.js)
Git for cloning the repository
Setup
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

Create a .env file in the root directory and add the required environment variables (see Environment Variables section).

Environment Variables
In the .env file, set up your login credentials for Timeform.

plaintext
Copy code
EMAIL=your_email@example.com
PASSWORD=your_password
Replace your_email@example.com and your_password with your actual Timeform login credentials.

Note: Keep the .env file private and do not commit it to version control.

Usage
There are several scripts you can run to perform different functions of the scraper:

Main Commands
Run the Stable Tour Scraper:

bash
Copy code
node collect.js
This script scrapes stable tour information from At The Races and saves each trainer's notes in the output folder.

Login and Add Notes to Timeform:

bash
Copy code
node trackerlogin.js
This script logs into Timeform and updates each horse's notes using the information from the scraped data.

Retry Failed Saves:

bash
Copy code
node failedhorses.js
This script attempts to re-save notes for horses that failed to save during the initial update process.

Additional Commands
Run All Commands with Menu:

If you have a start.bat or menu script, you can use it to run each function interactively.

Scripts
Here’s an overview of each key script:

collect.js: Scrapes the At The Races stable tours and saves the data to individual files for each trainer.
trackerlogin.js: Logs into Timeform with your credentials from .env and updates horse notes.
failedhorses.js: Retries updates for any horses that failed to save during the initial run.
Contributing
Feel free to fork this repository and submit pull requests. All contributions are welcome!

License
This project is licensed under the MIT License.

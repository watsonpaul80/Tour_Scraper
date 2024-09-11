# Tour Scraper

Tour Scraper is a Node.js-based application that automates the scraping and management of horse racing data. The application allows users to log in to the Timeform website, scrape data from the ATR Stable Tours, and track horses by their names and trainers.

## Features

- **Automated Login**: Logs in to the Timeform website using credentials stored in an environment file.
- **Data Scraping**: Scrapes horse racing data from the ATR Stable Tours website.
- **Data Processing**: Reads and processes horse data files, filtering and categorizing the data.
- **Automated Tracking**: Automatically searches and adds horse information to your tracker on the Timeform website.
- **Retry Logic**: Implements retry mechanisms for error handling during scraping and tracking.

## Prerequisites

- **Node.js**: Ensure you have Node.js installed. You can download it from [nodejs.org](https://nodejs.org/).
- **npm**: Node Package Manager is included with Node.js and is used to install dependencies.
- **Git**: Make sure Git is installed to clone the repository and manage versions.

## Setup

1. **Clone the Repository**:

    ```bash
    git clone https://github.com/watsonpaul80/Tour_Scraper.git
    cd Tour_Scraper
    ```

2. **Install Dependencies**:

    Install the required packages by running:

    ```bash
    npm install
    ```

3. **Set Environment Variables**:

    Create a `.env` file in the root directory and add your login credentials:

    ```plaintext
    EMAIL_ADDRESS=your-email@example.com
    PASSWORD=your-password
    ```

## Usage

### Run the Script

1. Open a terminal in the project directory.

2. Run the batch script to start the program:

    ```bash
    start.bat
    ```

3. You will be prompted to choose an option:

    - **1**: Run `collect.js` to scrape data from the ATR Stable Tours website.
    - **2**: Run `trackerlogin.js` to log in to the Timeform website and manage your horse tracker.

4. Follow the on-screen prompts to complete the operation.

### Running Individual Scripts

To run the scripts individually, you can use:

- **Collect Horse Data**:

    ```bash
    node collect.js
    ```

- **Login and Manage Tracker**:

    ```bash
    node trackerlogin.js
    ```

## Code Overview

### `trackerlogin.js`

This script automates the process of logging into the Timeform website, scraping data, and managing your horse tracker:

- **Functions**:
  - `loginAndGetCookies(page)`: Automates the login process and retrieves cookies for session management.
  - `runTracker()`: Runs the main tracking functionality.
  - `readAndAddToTracker(browser, cookies)`: Reads horse data from local files and adds it to the tracker.
  - `searchAndAddToTracker(page, horseName, trainerName, horseNotes, cookies)`: Searches for a horse on the Timeform website and adds notes.

### `collect.js`

This script scrapes horse and trainer data from the ATR Stable Tours website:

- **Functions**:
  - `init()`: Main function to scrape data and save it to local files.
  - `retryInit(customUrl, maxRetries, retryDelay)`: Retries scraping in case of an error.

## Error Handling

The scripts have built-in error handling and retry logic to manage issues such as network errors, missing elements, or incorrect data formats.

## Contributing

If you would like to contribute, please fork the repository and submit a pull request. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License.

## Acknowledgments

Special thanks to the developers of [Puppeteer](https://github.com/puppeteer/puppeteer) for providing a powerful tool for browser automation.

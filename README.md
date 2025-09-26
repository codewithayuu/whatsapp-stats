📊 WhatsApp Chat Analyzer

<div align="center">

</div>

    Dive deep into your WhatsApp conversations with this sleek, modern, and privacy-focused web application. It transforms your exported chat history into a rich, interactive dashboard full of detailed insights. The entire analysis process happens directly in your browser, guaranteeing that no data ever leaves your device.

✨ Key Features

Discover patterns and trends you never knew existed with a multi-faceted analysis of your chat history.

    📜 Comprehensive Summary: Get a high-level overview including date ranges, total messages, words, media, and a unique Active Users count for the last 7 days.

    👤 User-Level Analysis: Drill down into individual contributions, ranking users by messages, words, emojis, and average message length.

    📅 Activity Insights: Uncover the rhythm of your conversation with breakdowns by hour, day of the week, and month. Track first and last messages for every user.

    ✍️ Content Analysis: Understand what is being discussed with analytics on most used words, top emojis (overall and per-user), and most frequently shared websites.

    🔒 Privacy First: All processing is done client-side. Your chat files are never uploaded to a server.

    🔄 Session Persistence: Your analysis persists through page reloads for the entire browser session.

    📱 Fully Responsive: A beautiful, dark-themed UI that looks great on both desktop and mobile.

🚀 How It Works: Behind the Scenes

The entire analysis is a sophisticated client-side operation designed for speed and privacy.

    File Handling in the Browser: When you drop a .zip file, the browser's JavaScript engine immediately takes over. The file is not uploaded anywhere.

    In-Memory Unzipping: The powerful JSZip library reads the .zip archive directly in memory. It locates and extracts the _chat.txt file without requiring any server-side processing or temporary file storage.

    High-Speed Parsing: The application iterates through every line of the chat file. A fine-tuned Regular Expression (Regex) pattern parses each message to accurately separate the timestamp, author, and content.

    Data Aggregation: As the chat is parsed, a series of Map objects are populated in real-time to aggregate statistics. This includes counting messages, words, emojis, and links for each user, tracking activity by the hour and day, and building frequency lists for words and emojis.

    State Management & Rendering: Once the file is fully processed (which typically takes less than a second), the aggregated data is structured into a clean JSON object. This object is then passed to the main React component's state, triggering a re-render and instantly displaying your beautiful, data-rich dashboard.

    Session Caching: To provide a seamless experience, the final analytics object is stored in the browser's sessionStorage. This ensures that your data remains available even if you refresh the page, and is only cleared when you close the tab or analyze a new file.

🛠️ Technology Stack

This project is built with a modern, powerful, and client-centric tech stack:

    Frontend: React (with Hooks) via Next.js

    Styling: Tailwind CSS

    File Processing: JSZip

📄 License

Distributed under the MIT License. See LICENSE for more information.

<div align="center">

Built with ❤️ by iambatman

</div>

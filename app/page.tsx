"use client";
import { useState, useEffect } from "react";

// Helper components for icons (inline SVGs)
const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-teal-300">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
);

const StatIcon = ({ type }) => {
    const icons = {
        calendar: <path d="M8 2v4m8-4v4H4V2h16zM4 8h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V8z" />,
        messages: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
        words: <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5zM16 8L2 22M17.5 15H9" />,
        letters: <path d="M4 7V4h16v3M9 20h6M12 4v16" />,
        files: <><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" /></>,
        emojis: <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
        links: <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72" />,
        clock: <path d="M22 12h-4M2 12H6M12 2v4M12 22v-4M12 12a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"/>,
        users: <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />,
    };
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-teal-400">
            {icons[type] || <polyline points="13 2 13 9 20 9" />}
        </svg>
    );
};

const MedalIcon = ({ rank }) => {
    const colors = { 0: "text-yellow-400", 1: "text-gray-300", 2: "text-yellow-600" };
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-5 h-5 ${colors[rank] || 'text-transparent'}`}>
            <path d="M12 8V2M12 8c4.4 0 8 1.8 8 4s-3.6 4-8 4-8-1.8-8-4 3.6-4 8-4z" />
            <path d="M12 12v10m-4-6l-2-2-2 2m12 0l2-2 2 2" />
        </svg>
    );
};

// Main Application Component
export default function App() {
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');

  // Load JSZip library and cached data on mount
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
    script.async = true;
    document.body.appendChild(script);

    try {
      const cachedData = sessionStorage.getItem('whatsAppChatAnalytics');
      if (cachedData) {
        setAnalytics(JSON.parse(cachedData));
      }
    } catch (err) {
      console.error("Failed to load cached analytics data:", err);
      sessionStorage.removeItem('whatsAppChatAnalytics');
    }

    return () => { document.body.removeChild(script); }
  }, []);

  const parseWhatsAppDate = (dateStr) => {
      const cleanStr = dateStr.replace(/\[|\]/g, '').replace(',', '');
      const dateTimeParts = cleanStr.split(' ');
      
      const datePart = dateTimeParts[0];
      const timePart = dateTimeParts[1];
      const ampmPart = dateTimeParts.length > 2 ? dateTimeParts[2].toLowerCase() : null;

      const [day, month, yearShort] = datePart.split('/');
      const year = parseInt(yearShort) < 100 ? 2000 + parseInt(yearShort) : parseInt(yearShort);
      
      const timeParts = timePart.split(':').map(p => parseInt(p));
      let hours = timeParts[0];
      const minutes = timeParts[1];

      if (ampmPart === 'pm' && hours < 12) hours += 12;
      if (ampmPart === 'am' && hours === 12) hours = 0;

      return new Date(year, parseInt(month) - 1, parseInt(day), hours, minutes);
  };

  const processChatText = (text) => {
    const lines = text.split('\n');
    const messageRegex = /^\[?(\d{1,2}[./]\d{1,2}[./]\d{2,4},? \d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?)\]?\s*([^:]+):\s*(.*)/s;
    const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji})/gu;
    const linkRegex = /https?:\/\/[^\s]+/g;
    
    const intermediateStats = {
        userStats: new Map(), wordsPerUser: new Map(), lettersPerUser: new Map(),
        filesPerUser: new Map(), emojisPerUser: new Map(), linksPerUser: new Map(),
        firstMessage: new Map(), lastMessage: new Map(),
        messagesPerDay: Array(7).fill(0), messagesPerHour: Array(24).fill(0),
        messagesPerMonth: new Map(), messagesPerDate: new Map(),
        wordFrequency: new Map(), emojiFrequency: new Map(), websiteFrequency: new Map(),
        emojisByUser: new Map(), websitesByUser: new Map(), dates: []
    };

    lines.forEach(line => {
        const match = line.match(messageRegex);
        if (!match) return;

        const [, dateStr, name, message] = match;
        const cleanedName = name.trim();
        if (cleanedName.includes("You changed this group's icon") || cleanedName.includes('Tap to change')) return;

        intermediateStats.userStats.set(cleanedName, (intermediateStats.userStats.get(cleanedName) || 0) + 1);
        intermediateStats.dates.push(dateStr);

        const date = parseWhatsAppDate(dateStr);
        intermediateStats.messagesPerDay[date.getDay()]++;
        intermediateStats.messagesPerHour[date.getHours()]++;
        const monthYear = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
        intermediateStats.messagesPerMonth.set(monthYear, (intermediateStats.messagesPerMonth.get(monthYear) || 0) + 1);
        const fullDate = date.toLocaleDateString('en-GB');
        intermediateStats.messagesPerDate.set(fullDate, (intermediateStats.messagesPerDate.get(fullDate) || 0) + 1);

        if (!intermediateStats.firstMessage.has(cleanedName)) {
            intermediateStats.firstMessage.set(cleanedName, { date: dateStr, message });
        }
        intermediateStats.lastMessage.set(cleanedName, { date: dateStr, message });

        const words = message.match(/\S+/g) || [];
        const letters = message.replace(/\s/g, '');
        const emojis = message.match(emojiRegex) || [];
        const links = message.match(linkRegex) || [];

        intermediateStats.wordsPerUser.set(cleanedName, (intermediateStats.wordsPerUser.get(cleanedName) || 0) + words.length);
        intermediateStats.lettersPerUser.set(cleanedName, (intermediateStats.lettersPerUser.get(cleanedName) || 0) + letters.length);
        intermediateStats.emojisPerUser.set(cleanedName, (intermediateStats.emojisPerUser.get(cleanedName) || 0) + emojis.length);
        intermediateStats.linksPerUser.set(cleanedName, (intermediateStats.linksPerUser.get(cleanedName) || 0) + links.length);

        if (message.includes('<Media omitted>')) {
            intermediateStats.filesPerUser.set(cleanedName, (intermediateStats.filesPerUser.get(cleanedName) || 0) + 1);
        }

        words.forEach(word => {
            const cleanWord = word.toLowerCase().replace(/[.,!?]/g, '');
            if (cleanWord.length > 3) {
                intermediateStats.wordFrequency.set(cleanWord, (intermediateStats.wordFrequency.get(cleanWord) || 0) + 1);
            }
        });
        
        emojis.forEach(emoji => {
            intermediateStats.emojiFrequency.set(emoji, (intermediateStats.emojiFrequency.get(emoji) || 0) + 1);
            if (!intermediateStats.emojisByUser.has(cleanedName)) intermediateStats.emojisByUser.set(cleanedName, new Map());
            const userEmojiMap = intermediateStats.emojisByUser.get(cleanedName);
            userEmojiMap.set(emoji, (userEmojiMap.get(emoji) || 0) + 1);
        });

        links.forEach(link => {
            try {
                const domain = new URL(link).hostname.replace('www.', '');
                intermediateStats.websiteFrequency.set(domain, (intermediateStats.websiteFrequency.get(domain) || 0) + 1);
                if (!intermediateStats.websitesByUser.has(cleanedName)) intermediateStats.websitesByUser.set(cleanedName, new Map());
                const userWebsiteMap = intermediateStats.websitesByUser.get(cleanedName);
                userWebsiteMap.set(domain, (userWebsiteMap.get(domain) || 0) + 1);
            } catch {}
        });
    });
    
    if (intermediateStats.userStats.size === 0) {
        throw new Error("Could not find any valid WhatsApp messages. Please upload a valid chat export file.");
    }
    
    const sortMap = (map) => Array.from(map.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    const getTop = (map) => Array.from(map.entries()).map(([item, count]) => ({ item, count })).sort((a, b) => b.count - a.count);

    const messagesPerUser = sortMap(intermediateStats.userStats);
    const wordsPerUser = sortMap(intermediateStats.wordsPerUser);
    const lettersPerUser = sortMap(intermediateStats.lettersPerUser);
    const avgLettersPerMessage = messagesPerUser.map(({ name, count }) => ({
        name,
        avg: count > 0 ? ((intermediateStats.lettersPerUser.get(name) || 0) / count).toFixed(1) : 0
    })).sort((a, b) => b.avg - a.avg);

    const summary = {
        from: intermediateStats.dates[0] || 'N/A', to: intermediateStats.dates[intermediateStats.dates.length - 1] || 'N/A',
        totalMessages: intermediateStats.dates.length, totalWords: [...intermediateStats.wordsPerUser.values()].reduce((a, b) => a + b, 0),
        totalLetters: [...intermediateStats.lettersPerUser.values()].reduce((a, b) => a + b, 0), totalFiles: [...intermediateStats.filesPerUser.values()].reduce((a, b) => a + b, 0),
        totalEmojis: [...intermediateStats.emojisPerUser.values()].reduce((a, b) => a + b, 0), totalLinks: [...intermediateStats.linksPerUser.values()].reduce((a, b) => a + b, 0),
        activeUsers: 0
    };

    if (intermediateStats.dates.length > 0) {
        const lastChatDateStr = intermediateStats.dates[intermediateStats.dates.length - 1];
        const lastChatDate = parseWhatsAppDate(lastChatDateStr);
        const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
        
        let activeUserCount = 0;
        intermediateStats.lastMessage.forEach((value) => {
            const userLastDate = parseWhatsAppDate(value.date);
            if (lastChatDate.getTime() - userLastDate.getTime() <= sevenDaysInMs) {
                activeUserCount++;
            }
        });
        summary.activeUsers = activeUserCount;
    }

    const finalAnalytics = {
        summary, messagesPerUser, wordsPerUser, lettersPerUser, avgLettersPerMessage,
        filesPerUser: sortMap(intermediateStats.filesPerUser), emojisPerUser: sortMap(intermediateStats.emojisPerUser),
        linksPerUser: sortMap(intermediateStats.linksPerUser),
        messagesByDay: intermediateStats.messagesPerDay.map((count, i) => ({ day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i], count })),
        messagesByHour: intermediateStats.messagesPerHour.map((count, i) => ({ hour: i.toString().padStart(2, '0'), count })),
        messagesByMonth: Array.from(intermediateStats.messagesPerMonth.entries()).map(([month, count]) => ({ month, count })).sort((a,b) => new Date(b.month.split('/')[1], b.month.split('/')[0]-1) - new Date(a.month.split('/')[1], a.month.split('/')[0]-1)),
        topDays: Array.from(intermediateStats.messagesPerDate.entries()).map(([date, count]) => ({ date, count })).sort((a, b) => b.count - a.count).slice(0, 20),
        firstMessages: Array.from(intermediateStats.firstMessage.entries()).map(([name, {date}]) => ({ name, date })).sort((a,b) => parseWhatsAppDate(a.date) - parseWhatsAppDate(b.date)),
        lastMessages: Array.from(intermediateStats.lastMessage.entries()).map(([name, {date}]) => ({ name, date })).sort((a,b) => parseWhatsAppDate(b.date) - parseWhatsAppDate(a.date)),
        mostUsedWords: getTop(intermediateStats.wordFrequency).slice(0, 50).map(({item, count}) => ({word: item, count})),
        mostUsedEmojis: getTop(intermediateStats.emojiFrequency).slice(0, 50).map(({item, count}) => ({emoji: item, count})),
        mostUsedWebsites: getTop(intermediateStats.websiteFrequency).map(({item, count}) => ({website: item, count})),
        topEmojisByUser: Array.from(intermediateStats.emojisByUser.entries()).map(([name, emojiMap]) => ({ name, list: getTop(emojiMap).slice(0, 5) })),
        topWebsitesByUser: Array.from(intermediateStats.websitesByUser.entries()).map(([name, websiteMap]) => ({ name, list: getTop(websiteMap).slice(0, 5) })),
    };
    
    setAnalytics(finalAnalytics);
    sessionStorage.setItem('whatsAppChatAnalytics', JSON.stringify(finalAnalytics));
  };

  const handleFile = (e) => {
    const file = e.target.files[0]; if (!file) return;
    setIsLoading(true); setError(''); setAnalytics(null);
    sessionStorage.removeItem('whatsAppChatAnalytics');
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        let textContent = '';
        if (file.name.toLowerCase().endsWith('.zip')) {
          if (!window.JSZip) { throw new Error("ZIP library not loaded yet. Please wait a moment and try again."); }
          const zip = await window.JSZip.loadAsync(ev.target.result);
          const chatFile = Object.keys(zip.files).find(name => name.endsWith('.txt') && !name.startsWith('__MACOSX'));
          if (!chatFile) { throw new Error("Could not find a '_chat.txt' file inside the ZIP archive."); }
          textContent = await zip.file(chatFile).async('string');
        } else { textContent = ev.target.result; }
        processChatText(textContent);
      } catch (err) {
        if (err instanceof Error) {
            console.error("Processing error:", err);
            setError(err.message);
        } else {
            console.error("An unexpected error occurred:", err);
            setError("An unexpected error occurred during file processing.");
        }
      } 
      finally { setIsLoading(false); }
    };
    reader.onerror = () => { setError("Failed to read the file."); setIsLoading(false); };
    if (file.name.toLowerCase().endsWith('.zip')) { reader.readAsArrayBuffer(file); } else { reader.readAsText(file); }
  };
  
  const StatCard = ({ label, value, icon }) => (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4 flex flex-col justify-between hover:bg-slate-700/70 transition-colors duration-300 transform hover:-translate-y-1 hover:shadow-lg hover:shadow-teal-500/10">
        <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-400">{label}</p>
            <StatIcon type={icon} />
        </div>
        <p className="text-xl md:text-2xl font-bold text-teal-300 break-words">{value}</p>
    </div>
  );

  const BarChartCard = ({ title, data, dataKey, labelKey }) => {
      const maxValue = data.length > 0 ? Math.max(...data.map(d => d[dataKey])) : 0;
      return (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4 sm:p-6 rounded-2xl">
              <h2 className="text-xl font-semibold text-teal-300 mb-4">{title}</h2>
              <ul className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                  {data.map((d, i) => {
                      const widthPercentage = maxValue > 0 ? (d[dataKey] / maxValue) * 100 : 0;
                      return (
                        <li key={i} className="flex items-center text-sm">
                            <span className="w-10 text-slate-400 text-xs">{d[labelKey]}</span>
                            <div className="flex-1 bg-slate-700 rounded-full h-4 mx-1 sm:mx-2">
                                <div className="bg-gradient-to-r from-teal-500 to-green-400 h-4 rounded-full" style={{ width: `${widthPercentage}%` }}></div>
                            </div>
                            <span className="font-semibold text-teal-300">{d[dataKey]}</span>
                        </li>
                      )
                  })}
              </ul>
          </div>
      )
  };

  const ListCard = ({ title, data, renderItem }) => (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4 sm:p-6 rounded-2xl shadow-xl">
        <h2 className="text-xl font-semibold text-teal-300 mb-4">{title}</h2>
        <ul className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-2">
            {data.map(renderItem)}
        </ul>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-gray-200 font-sans flex flex-col items-center p-1 sm:p-2 selection:bg-teal-300 selection:text-teal-900 overflow-x-hidden">
      <div className="w-full h-full absolute top-0 left-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(13,148,136,0.3),rgba(255,255,255,0))]"></div>
      <header className="text-center py-8 z-10 w-full">
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-teal-300 mb-2 px-2">WhatsApp Chat Analyzer</h1>
        <p className="text-teal-200 opacity-80 text-lg px-2">Upload your exported chat <code className="bg-slate-700 text-teal-300 text-sm p-1 rounded">.zip</code> file.</p>
        {analytics && <button onClick={() => { setAnalytics(null); setActiveTab('summary'); sessionStorage.removeItem('whatsAppChatAnalytics'); }} className="mt-4 bg-teal-500/80 hover:bg-teal-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">Analyze Another File</button>}
      </header>
      <main className="flex-grow w-full max-w-7xl mx-auto p-1 sm:p-2 z-10">
        {!analytics && (
          <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
            <div className="relative border-2 border-dashed border-slate-600 rounded-2xl p-8 md:p-12 hover:border-teal-400 transition-colors duration-300 group">
              {isLoading ? <div className="w-8 h-8 border-4 border-teal-300 border-t-transparent rounded-full animate-spin"></div> : <UploadIcon />}
              <h2 className="mt-4 text-xl font-bold text-white">{isLoading ? 'Analyzing Chat...' : 'Upload Your Chat File'}</h2>
              <p className="text-slate-400 mt-1">Drag & drop or click to select a file.</p>
              <input type="file" accept=".zip,.txt" onChange={handleFile} disabled={isLoading} className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer" />
            </div>
            <p className="text-slate-500 text-xs mt-4">Supported formats: .zip, .txt</p>
            {error && <div className="mt-4 bg-red-900/50 border border-red-700 text-red-300 px-4 py-2 rounded-lg max-w-md">{error}</div>}
          </div>
        )}

        {analytics && (
          <div className="animate-fade-in-up">
            <div className="flex justify-center flex-wrap gap-y-2 mb-6 border-b border-slate-700">
                {['summary', 'users', 'activity', 'content'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`capitalize px-3 sm:px-4 py-2 font-medium text-sm sm:text-base transition-colors ${activeTab === tab ? 'text-teal-300 border-b-2 border-teal-300' : 'text-slate-400 hover:text-white'}`}>{tab}</button>
                ))}
            </div>
            
            {activeTab === 'summary' && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <StatCard label="From" value={analytics.summary.from} icon="calendar" />
                    <StatCard label="To" value={analytics.summary.to} icon="calendar" />
                    <StatCard label="Total Messages" value={analytics.summary.totalMessages} icon="messages" />
                    <StatCard label="Active Users (Last 7d)" value={analytics.summary.activeUsers} icon="users" />
                    <StatCard label="Total Words" value={analytics.summary.totalWords} icon="words" />
                    <StatCard label="Total Letters" value={analytics.summary.totalLetters} icon="letters" />
                    <StatCard label="Total Media Files" value={analytics.summary.totalFiles} icon="files" />
                    <StatCard label="Total Emojis" value={analytics.summary.totalEmojis} icon="emojis" />
                    <StatCard label="Total Links" value={analytics.summary.totalLinks} icon="links" />
                </div>
            )}

            {activeTab === 'users' && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <ListCard title="Messages per User" data={analytics.messagesPerUser} renderItem={(u,i) => <li key={i} className="flex items-center space-x-2 text-sm p-1 rounded-md hover:bg-slate-700/50 transition-colors"><MedalIcon rank={i}/> <span className="truncate flex-1 min-w-0">{u.name}</span> <span className="font-semibold text-teal-300">{u.count}</span></li>} />
                  <ListCard title="Words per User" data={analytics.wordsPerUser} renderItem={(u,i) => <li key={i} className="flex items-center space-x-2 text-sm p-1 rounded-md hover:bg-slate-700/50 transition-colors"><MedalIcon rank={i}/> <span className="truncate flex-1 min-w-0">{u.name}</span> <span className="font-semibold text-teal-300">{u.count}</span></li>} />
                  <ListCard title="Letters per User" data={analytics.lettersPerUser} renderItem={(u,i) => <li key={i} className="flex items-center space-x-2 text-sm p-1 rounded-md hover:bg-slate-700/50 transition-colors"><MedalIcon rank={i}/> <span className="truncate flex-1 min-w-0">{u.name}</span> <span className="font-semibold text-teal-300">{u.count}</span></li>} />
                  <ListCard title="Avg. Letters / Message" data={analytics.avgLettersPerMessage} renderItem={(u,i) => <li key={i} className="flex items-center space-x-2 text-sm p-1 rounded-md hover:bg-slate-700/50 transition-colors"><MedalIcon rank={i}/> <span className="truncate flex-1 min-w-0">{u.name}</span> <span className="font-semibold text-teal-300">{u.avg}</span></li>} />
                  <ListCard title="Media Files per User" data={analytics.filesPerUser} renderItem={(u,i) => <li key={i} className="flex items-center space-x-2 text-sm p-1 rounded-md hover:bg-slate-700/50 transition-colors"><MedalIcon rank={i}/> <span className="truncate flex-1 min-w-0">{u.name}</span> <span className="font-semibold text-teal-300">{u.count}</span></li>} />
                  <ListCard title="Emojis per User" data={analytics.emojisPerUser} renderItem={(u,i) => <li key={i} className="flex items-center space-x-2 text-sm p-1 rounded-md hover:bg-slate-700/50 transition-colors"><MedalIcon rank={i}/> <span className="truncate flex-1 min-w-0">{u.name}</span> <span className="font-semibold text-teal-300">{u.count}</span></li>} />
                </div>
            )}
            
            {activeTab === 'activity' && (
                <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
                    <BarChartCard title="Messages by Day of Week" data={analytics.messagesByDay} dataKey="count" labelKey="day" />
                    <BarChartCard title="Messages by Hour" data={analytics.messagesByHour} dataKey="count" labelKey="hour" />
                    <ListCard title="Busiest Days" data={analytics.topDays} renderItem={(d, i) => <li key={i} className="flex items-center space-x-2 text-sm p-1 rounded-md hover:bg-slate-700/50 transition-colors"><MedalIcon rank={i}/> <span className="flex-1 min-w-0">{d.date}</span> <span className="font-semibold text-teal-300">{d.count}</span></li>} />
                    <ListCard title="Messages by Month" data={analytics.messagesByMonth} renderItem={(d, i) => <li key={i} className="flex items-center space-x-2 text-sm p-1 rounded-md hover:bg-slate-700/50 transition-colors"><MedalIcon rank={i}/> <span className="flex-1 min-w-0">{d.month}</span> <span className="font-semibold text-teal-300">{d.count}</span></li>} />
                    <ListCard title="First Messages" data={analytics.firstMessages} renderItem={(d, i) => <li key={i} className="text-sm p-1 rounded-md hover:bg-slate-700/50 transition-colors"><p className="font-semibold truncate">{d.name}</p><p className="text-xs text-slate-400">{d.date}</p></li>} />
                    <ListCard title="Last Messages" data={analytics.lastMessages} renderItem={(d, i) => <li key={i} className="text-sm p-1 rounded-md hover:bg-slate-700/50 transition-colors"><p className="font-semibold truncate">{d.name}</p><p className="text-xs text-slate-400">{d.date}</p></li>} />
                </div>
            )}

            {activeTab === 'content' && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <ListCard title="Most Used Words (>3 letters)" data={analytics.mostUsedWords} renderItem={(w,i) => <li key={i} className="flex items-center space-x-2 text-sm p-1 rounded-md hover:bg-slate-700/50 transition-colors"><MedalIcon rank={i}/> <span className="flex-1 min-w-0">{w.word}</span> <span className="font-semibold text-teal-300">{w.count}</span></li>} />
                    <ListCard title="Most Used Emojis" data={analytics.mostUsedEmojis} renderItem={(e,i) => <li key={i} className="flex items-center space-x-2 text-2xl p-1 rounded-md hover:bg-slate-700/50 transition-colors"><MedalIcon rank={i}/> <span className="flex-1 min-w-0">{e.emoji}</span> <span className="font-semibold text-teal-300 text-sm">{e.count}</span></li>} />
                    <ListCard title="Most Linked Websites" data={analytics.mostUsedWebsites} renderItem={(w,i) => <li key={i} className="flex items-center space-x-2 text-sm p-1 rounded-md hover:bg-slate-700/50 transition-colors"><MedalIcon rank={i}/> <span className="flex-1 truncate min-w-0">{w.website}</span> <span className="font-semibold text-teal-300">{w.count}</span></li>} />
                    <div className="md:col-span-2 lg:col-span-3">
                        <ListCard title="Top Emojis by User" data={analytics.topEmojisByUser} renderItem={(u, i) => (
                            <li key={i} className="text-sm p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors">
                                <p className="font-bold mb-2 truncate">{u.name}</p>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-2xl">
                                    {u.list.map((e, ei) => <span key={ei}>{e.item} <span className="text-xs text-teal-300">({e.count})</span></span>)}
                                </div>
                            </li>
                        )} />
                    </div>
                </div>
            )}
          </div>
        )}
      </main>
      <footer className="mt-auto py-6 text-slate-500 text-sm text-center z-10">
        <p>Made with <span className="text-red-500 animate-pulse">❤️</span> by iambatman</p>
      </footer>
       <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            .animate-fade-in { animation: fadeIn 0.5s ease-in-out; }
            .animate-fade-in-up { animation: fadeInUp 0.6s ease-in-out; }
            .animate-spin { animation: spin 1s linear infinite; }
            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #4a5568; border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #718096; }
       `}</style>
    </div>
  );
}



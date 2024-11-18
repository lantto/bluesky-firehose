const url = "wss://jetstream2.us-east.bsky.network/subscribe?wantedCollections=app.bsky.feed.post";

const ws = new WebSocket(url);
ws.onopen = () => {
    console.log("Connected to BlueSky WebSocket");
};

// Create container for messages
const container = document.createElement('div');
container.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
    color: #fff;
    overflow: hidden;
    font-family: monospace;
    display: flex;
    gap: 20px;
    padding: 20px;
    box-sizing: border-box;
`;

// Replace the fixed COLUMN_COUNT with a function
function getColumnCount() {
    const width = window.innerWidth;
    if (width < 768) return 2;        // Mobile
    if (width < 1024) return 3;       // Tablet
    if (width < 1440) return 4;       // Small Desktop
    if (width < 1920) return 5;       // Regular Desktop
    return 6;                         // Large Desktop
}

// Initialize variables
let COLUMN_COUNT = getColumnCount();
let columns = [];
let columnPaused = [];
let currentColumn = 0;

// Add these new utility functions
function getRandomColor() {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function formatMessage(text) {
    // Convert URLs to clickable links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, url => `<a href="${url}" target="_blank" style="color: #4ECDC4;">${url}</a>`);
}

// Extract column creation logic into a function
function createColumns() {
    container.innerHTML = '';
    columns = [];
    COLUMN_COUNT = getColumnCount();
    columnPaused = new Array(COLUMN_COUNT).fill(false);
    
    for (let i = 0; i < COLUMN_COUNT; i++) {
        const column = document.createElement('div');
        column.style.cssText = `
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 10px;
            height: calc(100%);
            overflow: hidden;
            transition: all 0.3s ease;
            border-radius: 10px;
            padding: 10px;
        `;
        
        column.addEventListener('mouseenter', () => {
            columnPaused[i] = true;
            column.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
        });
        
        column.addEventListener('mouseleave', () => {
            columnPaused[i] = false;
            column.style.backgroundColor = 'transparent';
        });
        
        columns.push(column);
        container.appendChild(column);
    }
    currentColumn = 0;
}

// Initialize columns on load
createColumns();

// Update columns on resize
window.addEventListener('resize', () => {
    const newColumnCount = getColumnCount();
    if (newColumnCount !== COLUMN_COUNT) {
        createColumns();
    }
});

document.body.appendChild(container);

ws.onmessage = (event) => {
    const json = JSON.parse(event.data);

    if (json.kind !== 'commit' || 
        json.commit.collection !== 'app.bsky.feed.post' ||
        !json.commit.record ||
        json.commit.operation !== 'create') {
        return;
    }

    // Find next available unpause column
    let attempts = 0;
    while (columnPaused[currentColumn] && attempts < COLUMN_COUNT) {
        currentColumn = (currentColumn + 1) % COLUMN_COUNT;
        attempts++;
    }
    
    // If all columns are paused, skip this message
    if (attempts === COLUMN_COUNT) return;

    // Create new message
    const message = document.createElement('div');
    message.style.cssText = `
        padding: 15px;
        background: rgba(255, 255, 255, 0.05);
        border-left: 4px solid ${getRandomColor()};
        border-radius: 8px;
        opacity: 0;
        transform: translateY(-20px);
        animation: fadeIn 0.3s ease forwards;
        font-size: 14px;
        word-break: break-word;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        transition: all 0.2s ease;
    `;
    
    message.innerHTML = formatMessage(json.commit.record.text);
    
    columns[currentColumn].insertBefore(message, columns[currentColumn].firstChild);
    currentColumn = (currentColumn + 1) % COLUMN_COUNT;
    
    // Only remove old messages if column isn't paused
    if (!columnPaused[currentColumn] && columns[currentColumn].children.length > 15) {
        const oldMessages = Array.from(columns[currentColumn].children).slice(15);
        oldMessages.forEach(msg => {
            msg.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => msg.remove(), 300);
        });
    }

    // Add hover effect to messages
    message.addEventListener('mouseenter', () => {
        message.style.transform = 'scale(1.02)';
        message.style.background = 'rgba(255, 255, 255, 0.08)';
    });

    message.addEventListener('mouseleave', () => {
        message.style.transform = 'scale(1)';
        message.style.background = 'rgba(255, 255, 255, 0.05)';
    });
};

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { 
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
        }
        to { 
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }
    
    @keyframes fadeOut {
        from { 
            opacity: 1;
            transform: translateY(0) scale(1);
        }
        to { 
            opacity: 0;
            transform: translateY(20px) scale(0.95);
        }
    }
`;
document.head.appendChild(style);

ws.onerror = (error) => {
    console.error("WebSocket error:", error);
};

ws.onclose = () => {
    console.log("WebSocket connection closed");
};
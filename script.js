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
    background: #1a1a1a;
    color: #fff;
    overflow: hidden;
    font-family: monospace;
    display: flex;
    gap: 20px;
    padding: 20px;
    box-sizing: border-box;
`;

// Create columns for messages
const COLUMN_COUNT = 6;
const columns = [];
const columnPaused = new Array(COLUMN_COUNT).fill(false);

for (let i = 0; i < COLUMN_COUNT; i++) {
    const column = document.createElement('div');
    column.style.cssText = `
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 10px;
        height: calc(100%;
        overflow: hidden;
        transition: background-color 0.3s ease;
    `;
    
    // Add hover listeners
    column.addEventListener('mouseenter', () => {
        columnPaused[i] = true;
        column.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'; // Subtle highlight
    });
    
    column.addEventListener('mouseleave', () => {
        columnPaused[i] = false;
        column.style.backgroundColor = 'transparent';
    });
    
    columns.push(column);
    container.appendChild(column);
}

document.body.appendChild(container);

let currentColumn = 0;

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
        padding: 10px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 5px;
        opacity: 0;
        transform: translateY(-20px);
        animation: fadeIn 0.3s ease forwards;
        font-size: 14px;
        word-break: break-word;
    `;
    
    message.textContent = json.commit.record.text;
    
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
};

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { 
            opacity: 0;
            transform: translateY(-20px);
        }
        to { 
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes fadeOut {
        from { 
            opacity: 1;
            transform: translateY(0);
        }
        to { 
            opacity: 0;
            transform: translateY(20px);
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
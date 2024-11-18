const url = "wss://jetstream2.us-east.bsky.network/subscribe?wantedCollections=app.bsky.feed.post";

const ws = new WebSocket(url);
ws.onopen = () => {
    console.log("Connected to BlueSky WebSocket");
};


ws.onmessage = (event) => {
    const json = JSON.parse(event.data);

    if (json.kind !== 'commit') {
        return;
    }

    if (json.commit.collection === 'app.bsky.feed.post') {
        if (!json.commit.record) {
            return;
        }

        if (json.commit.operation === 'create') {
            // Message in json.commit.record.text
        }
    }
};

ws.onerror = (error) => {
    console.error("WebSocket error:", error);
};

ws.onclose = () => {
    console.log("WebSocket connection closed");
};
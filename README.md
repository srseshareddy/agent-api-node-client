[![npm](https://img.shields.io/npm/v/salesforce-agent-api-client)](https://www.npmjs.com/package/salesforce-agent-api-client)

# Node client for the Salesforce Agent API

See the [API documentation](https://developer.salesforce.com/docs/einstein/genai/guide/agent-api.html) and the [Postman collection](https://www.postman.com/salesforce-developers/salesforce-developers/collection/gwv9bjy/agent-api-pilot) for more information on the Salesforce Agent API.

- [Quick Start Example](#quick-start-example)
- [Configuration](#configuration)
- [Logging](#logging)
- [Reference](#reference)

## Quick Start Example

Here's an example that will get you started quickly with streaming events.

1. Install the client library and `dotenv`:

    ```sh
    npm install salesforce-agent-api-client dotenv
    ```

1. Create a `.env` file at the root of your project and [configure it](#configuration) with the the following template:

    ```properties
    instanceUrl=
    clientId=
    clientSecret=
    agentId=
    ```

1. Create an `index.js` file with the following code:

    ```js
    import * as dotenv from 'dotenv';
    import AgentApiClient from 'salesforce-agent-api-client';

    // Hard-coded prompt used for a single demo run
    const SAMPLE_PROMPT = 'What does "AI" stand for?';

    // Load config from .env file
    dotenv.config();
    const config = {
        instanceUrl: process.env.instanceUrl,
        clientId: process.env.clientId,
        clientSecret: process.env.clientSecret,
        agentId: process.env.agentId
    };

    // Configure Agent API client
    const client = new AgentApiClient(config);

    // Authenticate
    await client.authenticate();

    // Prepare SSE stream event handler
    function streamEventHandler({ data, event }) {
        const eventData = JSON.parse(data);
        console.log('Event: %s', event);
        console.log(JSON.stringify(eventData, null, 2));
        // TODO: add custom logic to process events
    }

    // Prepare SSE stream disconnect handler
    async function streamDisconnectHandler() {
        // On disconnect, close the session
        await client.closeSession(sessionId);
    }

    // Create a new session
    const sessionId = await client.createSession();
    const variables = [];
    try {
        // Sends an streaming message
        const eventSource = client.sendStreamingMessage(
            sessionId,
            SAMPLE_PROMPT,
            variables,
            streamEventHandler,
            streamDisconnectHandler
        );
    } catch (error) {
        console.log(error);
        await client.closeSession(sessionId);
    }
    ```

1. Run the code with `node index.js`.

    If everything goes well, the output should look like this:

    ```
    Agent API: authenticated on https://coralcloudresorts19-dev-ed.develop.my.salesforce.com (API endpoint: https://api.salesforce.com)
    Agent API: created session a4923398-0d60-4529-9f7a-91f021409875
    Agent API: sending async message 1740068546539 with text: What does AI stand for?
    Event: INFORM
    {
        "timestamp": 1740068551742,
        "originEventId": "1740068546968-REQ",
        "traceId": "66b8d7d8f3aac7bb404730970c88659d",
        "offset": 0,
        "message": {
            "type": "Inform",
            "id": "f5d3d83f-3bc7-4d81-9f8f-4b7e75522aa3",
            "feedbackId": "12636229-b716-4fcd-ba0b-6a498e27caab",
            "planId": "12636229-b716-4fcd-ba0b-6a498e27caab",
            "isContentSafe": true,
            "message": "How can I assist you with any customer support issues today?",
            "result": [],
            "citedReferences": []
        }
    }
    Event: END_OF_TURN
    {
        "timestamp": 1740068551746,
        "originEventId": "1740068546968-REQ",
        "traceId": "66b8d7d8f3aac7bb404730970c88659d",
        "offset": 0,
        "message": {
            "type": "EndOfTurn",
            "id": "696fd6f5-53bc-4366-b37c-fbf0a74ce992"
        }
    }
    SSE disconnected. Preventing auto reconnect.
    Agent API: closed session a4923398-0d60-4529-9f7a-91f021409875
    ```

## Configuration

Object that describes the client configuration:

| Name           | Type   | Description                  |
| -------------- | ------ | ---------------------------- |
| `instanceUrl`  | string | Your Salesforce Org domain.  |
| `clientId`     | string | Connected app client ID.     |
| `clientSecret` | string | Connected app client secret. |
| `agentId`      | string | Agent ID.                    |

## Logging

The client uses debug level messages so you can lower the default logging level if you need more information.

The documentation examples use the default client logger (the console). The console is fine for a test environment but you'll want to switch to a custom logger with asynchronous logging for increased performance.

You can pass a logger like pino in the client constructor:

```js
import pino from 'pino';

const config = {
    /* your config goes here */
};
const logger = pino();
const client = new AgentApiClient(config, logger);
```

## Reference

### AgentApiClient

Client for the Salesforce Agent API

#### `AgentApiClient(configuration, [logger])`

Builds a new Agent API client.

| Name            | Type                            | Description                                                                                 |
| --------------- | ------------------------------- | ------------------------------------------------------------------------------------------- |
| `configuration` | [Configuration](#configuration) | The client configuration (authentication...).                                               |
| `logger`        | Logger                          | An optional [custom logger](#logging). The client uses the console if no value is supplied. |

#### `async authenticate() → {Promise.<void>}`

Authenticates with Salesforce.

Returns: Promise that resolves once the client is authenticated.

#### `async createSession() → {Promise.<string>}`

Creates an agent session.

Returns: Promise that holds the session ID.

#### `async sendSyncMessage(sessionId, text, variables = []) → {Promise.<any>}`

Sends a synchronous prompt to the agent.

| Name        | Type     | Description                   |
| ----------- | -------- | ----------------------------- |
| `sessionId` | string   | An agent session ID.          |
| `text`      | string   | The prompt sent to the agent. |
| `variables` | Object[] | Optional context variables.   |

Returns: Promise that holds the agent's response.

#### `async sendStreamingMessage(sessionId, text, variables = [], onMessage, onDisconnect) → EventSource`

Sends an asynchronous prompt to the agent.

| Name           | Type            | Description                            |
| -------------- | --------------- | -------------------------------------- |
| `sessionId`    | string          | An agent session ID.                   |
| `text`         | string          | The prompt sent to the agent.          |
| `variables`    | Object[]        | Context variables.                     |
| `onMessage`    | MessageCallback | Message callback function.             |
| `onDisconnect` | function()      | Optional disconnect callback function. |

Returns: a SSE event source. See [EventSource](https://www.npmjs.com/package/eventsource-client) for implementation details.

`MessageCallback(Object: message)` is a callback function from `EventSource`. Notable `message` properties are as follow:

| Name    | Type   | Description                                            |
| ------- | ------ | ------------------------------------------------------ |
| `event` | string | Event type. One of `INFORM`, `ERROR` or `END_OF_TURN`. |
| `data`  | string | The event data. Can be empty.                          |

#### `async closeSession(sessionId) → {Promise.<void>}`

Closes the agent session.

| Name        | Type   | Description          |
| ----------- | ------ | -------------------- |
| `sessionId` | string | An agent session ID. |

Returns: Promise that resolves once the session is closed.

#### `async submitFeedback(sessionId, feedbackId, feedback, feedbackText) → {Promise.<void>}`

Submits feedback to the agent.

| Name           | Type   | Description                     |
| -------------- | ------ | ------------------------------- |
| `sessionId`    | string | An agent session ID.            |
| `feedbackId`   | string | Feedback ID.                    |
| `feedback`     | string | feedback type (`GOOD` or `BAD`) |
| `feedbackText` | string | Optional feedback text          |

Returns: Promise that resolves once the feedback is saved.

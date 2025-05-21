var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client.js
var client_exports = {};
__export(client_exports, {
  default: () => AgentApiClient
});
module.exports = __toCommonJS(client_exports);
var import_crypto = __toESM(require("crypto"), 1);
var import_eventsource_client = require("eventsource-client");
var REQUIRED_CONFIG = ["instanceUrl", "clientId", "clientSecret", "agentId"];
var REQUIRED_SCOPES = /* @__PURE__ */ new Set(["sfap_api", "chatbot_api", "api"]);
var AgentApiClient = class {
  #config;
  #logger;
  #authInfo;
  /**
   * Configures an Agent API client
   * @param {Config} config client configuration
   * @param {Logger} [logger] an optional custom logger. The client uses the console if no value is supplied.
   */
  constructor(config, logger = console) {
    if (!config) {
      throw new Error("Missing configuration");
    }
    REQUIRED_CONFIG.forEach((key) => {
      if (config[key] === void 0) {
        throw new Error(`Missing mandatory configuration key: ${key}`);
      }
    });
    this.#config = config;
    this.#logger = logger;
  }
  /**
   * Authenticates with Salesforce
   * @returns {Promise<void>} Promise that resolves once the client is authenticated
   */
  async authenticate() {
    try {
      const headers = {
        "Content-Type": "application/x-www-form-urlencoded"
      };
      const body = new URLSearchParams({
        grant_type: "client_credentials",
        client_id: this.#config.clientId,
        client_secret: this.#config.clientSecret
      });
      const response = await fetch(
        `${this.#config.instanceUrl}/services/oauth2/token`,
        {
          method: "POST",
          body,
          headers
        }
      );
      if (!response.ok) {
        const body2 = await response.text();
        throw new Error(
          `Response status: ${response.status}
Response body: ${body2}`
        );
      }
      const json = await response.json();
                const scopes = new Set(json.scope.split(' '));
if (![...REQUIRED_SCOPES].every(scope => scopes.has(scope))) {
    throw new Error(
        `Missing OAuth scopes: required ${JSON.stringify([...REQUIRED_SCOPES])}, found ${JSON.stringify([...scopes])}`
    );
}
      this.#authInfo = {
        accessToken: json.access_token,
        apiInstanceUrl: json.api_instance_url
      };
      this.#logger.log(
        `Agent API: authenticated on ${this.#config.instanceUrl} (API endpoint: ${this.#authInfo.apiInstanceUrl})`
      );
    } catch (error) {
      throw new Error("Agent API authentication failure", {
        cause: error
      });
    }
  }
  /**
   * Creates an agent session
   * @returns {Promise<string>} Promise that holds the session ID
   */
  async createSession() {
    try {
      const externalSessionKey = import_crypto.default.randomUUID();
      const body = JSON.stringify({
        externalSessionKey,
        instanceConfig: {
          endpoint: this.#config.instanceUrl
        },
        featureSupport: "Streaming",
        streamingCapabilities: {
          chunkTypes: ["Text"]
        },
        bypassUser: true
      });
      const headers = this.#getHeadersWithAuth();
      headers.append("Content-Type", "application/json");
      const response = await fetch(
        `${this.#getBaseApiUrl()}/agents/${this.#config.agentId}/sessions`,
        {
          method: "POST",
          body,
          headers
        }
      );
      if (!response.ok) {
        const resBody = await response.text();
        throw new Error(
          `Response status: ${response.status}
Response body: ${resBody}`
        );
      }
      const json = await response.json();
      this.#logger.log(`Agent API: created session ${json.sessionId}`);
      return json.sessionId;
    } catch (error) {
      throw new Error("Failed to create Agent API session", {
        cause: error
      });
    }
  }
  /**
   * Sends a synchronous prompt to the agent
   * @param {string} sessionId agent session ID
   * @param {string} text user prompt
   * @param {Object[]} [variables] optional context variables
   * @returns {Promise<any>} Promise that holds the agent response
   */
  async sendSyncMessage(sessionId, text, variables = []) {
    try {
      const sequenceId = (/* @__PURE__ */ new Date()).getTime();
      const body = JSON.stringify({
        message: {
          sequenceId,
          type: "Text",
          text
        },
        variables
      });
      const headers = this.#getHeadersWithAuth();
      headers.append("Content-Type", "application/json");
      headers.append("Accept", "application/json");
      this.#logger.log(
        `Agent API: sending sync message ${sequenceId} with text: ${text}`
      );
      const response = await fetch(
        `${this.#getBaseApiUrl()}/sessions/${sessionId}/messages`,
        {
          method: "POST",
          body,
          headers
        }
      );
      if (!response.ok) {
        const resBody = await response.text();
        throw new Error(
          `Response status: ${response.status}
Response body: ${resBody}`
        );
      }
      const json = await response.json();
      this.#logger.log(JSON.stringify(json, null, 2));
      return json;
    } catch (error) {
      throw new Error("Failed to send Agent API sync message", {
        cause: error
      });
    }
  }
  /**
   * Sends an asynchronous prompt to the agent
   * @param {string} sessionId agent session ID
   * @param {string} text user prompt
   * @param {Object[]} variables context variables
   * @param {MessageCallback} onMessage message callback function
   * @param {DisconnectCallback} [onDisconnect] optional disconnect callback function
   * @returns {EventSource} a SSE event source
   */
  sendStreamingMessage(sessionId, text, variables = [], onMessage, onDisconnect = null) {
    try {
      const sequenceId = (/* @__PURE__ */ new Date()).getTime();
      const body = JSON.stringify({
        message: {
          sequenceId,
          type: "Text",
          text
        },
        variables
      });
      this.#logger.log(
        `Agent API: sending async message ${sequenceId} with text: ${text}`
      );
      const es = new import_eventsource_client.createEventSource({
        method: "POST",
        url: `${this.#getBaseApiUrl()}/sessions/${sessionId}/messages/stream`,
        headers: {
          Authorization: `Bearer ${this.#authInfo.accessToken}`,
          "Content-Type": "application/json"
        },
        body,
        onMessage,
        onDisconnect: () => {
          this.#logger.log(
            "SSE disconnected. Preventing auto reconnect."
          );
          es.close();
          if (onDisconnect) {
            onDisconnect();
          }
        }
      });
      return es;
    } catch (error) {
      throw new Error("Failed to send Agent API streaming message", {
        cause: error
      });
    }
  }
  /**
   * Closes the agent session
   * @param {string} sessionId session ID
   * @returns {Promise<void>} Promise that resolves once the session is closed
   */
  async closeSession(sessionId) {
    try {
      const headers = this.#getHeadersWithAuth();
      headers.append("x-session-end-reason", "UserRequest");
      const response = await fetch(
        `${this.#getBaseApiUrl()}/sessions/${sessionId}`,
        {
          method: "DELETE",
          headers
        }
      );
      if (!response.ok) {
        const resBody = await response.text();
        throw new Error(
          `Response status: ${response.status}
Response body: ${resBody}`
        );
      }
      this.#logger.log(`Agent API: closed session ${sessionId}`);
    } catch (error) {
      throw new Error("Failed to close Agent API session", {
        cause: error
      });
    }
  }
  /**
   * Submits feedback to the agent
   * @param {string} sessionId session ID
   * @param {string} feedbackId feedback ID
   * @param {string} feedback feedback type (GOOD or BAD)
   * @param {string} [feedbackText] optional feedback text
   * @returns {Promise<void>} Promise that resolves once the feedback is saved
   */
  async submitFeedback(sessionId, feedbackId, feedback, feedbackText) {
    try {
      const body = {
        feedbackId,
        feedback
      };
      if (feedbackText) {
        body.text = feedbackText;
      }
      const headers = this.#getHeadersWithAuth();
      const response = await fetch(
        `${this.#getBaseApiUrl()}/sessions/${sessionId}/feedback`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(body)
        }
      );
      if (!response.ok) {
        const resBody = await response.text();
        throw new Error(
          `Response status: ${response.status}
Response body: ${resBody}`
        );
      }
      this.#logger.log(
        `Agent API: submitted feedback on session ${sessionId}`
      );
    } catch (error) {
      throw new Error("Failed to submit Agent API feedback", {
        cause: error
      });
    }
  }
  #getBaseApiUrl() {
    return `${this.#authInfo.apiInstanceUrl}/einstein/ai-agent/v1`;
  }
  #getHeadersWithAuth() {
    const headers = new Headers();
    headers.append("Authorization", `Bearer ${this.#authInfo.accessToken}`);
    return headers;
  }
};

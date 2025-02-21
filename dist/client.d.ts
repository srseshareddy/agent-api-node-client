/**
 * @typedef {Object} Config
 * @property {string} instanceUrl Your Salesforce Org domain
 * @property {string} clientId Connected app consumer key
 * @property {string} clientSecret Connected app consumer secret
 * @property {string} agentId Agent ID
 */
/**
 * @typedef {Object} Logger
 * @property {Function} debug
 * @property {Function} info
 * @property {Function} error
 * @property {Function} warn
 */
/**
 * @callback MessageCallback
 * @param {Object} message
 * @param {string} message.event
 * @param {Object} message.data
 * @returns {void}
 */
/**
 * @callback DisconnectCallback
 * @returns {void}
 */
export default class AgentApiClient {
    /**
     * Configures an Agent API client
     * @param {Config} config client configuration
     * @param {Logger} [logger] an optional custom logger. The client uses the console if no value is supplied.
     */
    constructor(config: Config, logger?: Logger);
    /**
     * Authenticates with Salesforce
     * @returns {Promise<void>} Promise that resolves once the client is authenticated
     */
    authenticate(): Promise<void>;
    /**
     * Creates an agent session
     * @returns {Promise<string>} Promise that holds the session ID
     */
    createSession(): Promise<string>;
    /**
     * Sends a synchronous prompt to the agent
     * @param {string} sessionId agent session ID
     * @param {string} text user prompt
     * @param {Object[]} [variables] optional context variables
     * @returns {Promise<any>} Promise that holds the agent response
     */
    sendSyncMessage(sessionId: string, text: string, variables?: any[]): Promise<any>;
    /**
     * Sends an asynchronous prompt to the agent
     * @param {string} sessionId agent session ID
     * @param {string} text user prompt
     * @param {Object[]} variables context variables
     * @param {MessageCallback} onMessage message callback function
     * @param {DisconnectCallback} [onDisconnect] optional disconnect callback function
     * @returns {EventSource} a SSE event source
     */
    sendStreamingMessage(sessionId: string, text: string, variables: any[], onMessage: MessageCallback, onDisconnect?: DisconnectCallback): EventSource;
    /**
     * Closes the agent session
     * @param {string} sessionId session ID
     * @returns {Promise<void>} Promise that resolves once the session is closed
     */
    closeSession(sessionId: string): Promise<void>;
    /**
     * Submits feedback to the agent
     * @param {string} sessionId session ID
     * @param {string} feedbackId feedback ID
     * @param {string} feedback feedback type (GOOD or BAD)
     * @param {string} [feedbackText] optional feedback text
     * @returns {Promise<void>} Promise that resolves once the feedback is saved
     */
    submitFeedback(sessionId: string, feedbackId: string, feedback: string, feedbackText?: string): Promise<void>;
    #private;
}
export type Config = {
    /**
     * Your Salesforce Org domain
     */
    instanceUrl: string;
    /**
     * Connected app consumer key
     */
    clientId: string;
    /**
     * Connected app consumer secret
     */
    clientSecret: string;
    /**
     * Agent ID
     */
    agentId: string;
};
export type Logger = {
    debug: Function;
    info: Function;
    error: Function;
    warn: Function;
};
export type MessageCallback = (message: {
    event: string;
    data: any;
}) => void;
export type DisconnectCallback = () => void;
//# sourceMappingURL=client.d.ts.map
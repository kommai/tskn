// Network is physically unavailable or timed out

export class NetworkError extends Error {
    constructor(message) {
        super(message);
        //super(`${message}: Network is unavailable or timed out`);
        this.name = 'NetworkError';
    }
}
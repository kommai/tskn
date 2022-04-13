// Response status code is not 200

export class UnexpectedResponseError extends Error {
    /*
    constructor(message) {
        super(message);
        this.name = 'UnexpectedResponseError';
    }
    */

    /**
     * @param {Response} response
     */
    constructor(response) {
        super(`Unexpected response: ${response.status}`);
        this.name = 'UnexpectedResponseError';
        this.status = response.status;
    }
}
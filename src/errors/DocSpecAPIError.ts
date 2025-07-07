export class DocSpecAPIError extends Error {
    constructor(
        message: string,
        public readonly url: URL,
        public readonly status: number,
        public readonly errorPayload: string
    ) {
        super(message)
        this.name = 'APIError'
    }
}

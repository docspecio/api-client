import * as path from 'path'
import { DocSpecAPIError } from './errors/DocSpecAPIError.js'

const contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export class Client {
    private readonly base: URL

    constructor(base: string | URL) {
        this.base = new URL(base)
    }

    /**
     * Converts a file from Microsoft Word (DOCX) to BlockNoteJS.
     *
     * @param file The file to be converted.
     * @param signal - Optional signal to abort the request if needed.
     * @return A promise that resolves to a HTTP Response.
     */
    async convert(file: Blob | Uint8Array, signal?: AbortSignal): Promise<Response> {
        const url = this.fullUrl('/conversion')

        const response = await fetch(url, { method: 'POST', body: this.body(file), signal })

        await this.throwIfNotOk(response, url)

        return response
    }

    protected body(file: Blob | Uint8Array): FormData {
        if (file instanceof Blob) {
            const form = new FormData()
            form.append('file', file)
            return form
        }

        return this.body(new Blob([file], { type: contentType }))
    }

    protected async throwIfNotOk(response: Response, url: URL): Promise<void> {
        if (response.ok) {
            return
        }

        const body = await response.text()

        throw new DocSpecAPIError(
            `Failed to call DocSpec API on ${url}: ${response.status} ${response.statusText} - ${body}`,
            url,
            response.status,
            body
        )
    }

    protected fullUrl(requestPath: string): URL {
        const url = new URL(this.base)
        url.pathname = path.join(url.pathname, requestPath)
        return url
    }
}

import nock from 'nock'
import { afterEach, describe, expect, it } from 'vitest'
import { Client } from './Client.js'
import { DocSpecAPIError } from './errors/DocSpecAPIError.js'

const contentType = {
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    blocknote: 'application/vnd.blocknote+json',
}

describe(Client, () => {
    afterEach(() => {
        nock.cleanAll()
        nock.enableNetConnect()
    })

    describe(Client.prototype.convert.name, () => {
        it('calls conversion endpoint for Buffer and returns conversions', async () => {
            const mockResponseData = { content: [] }

            const payload = '# Example payload'
            const payloadBuffer = Buffer.from(payload)

            const _scope = nock('https://api.example.com')
                .matchHeader('content-type', /^multipart\/form-data; boundary=----.*/)
                .post('/v1/conversion', (body) => {
                    if (typeof body !== 'string') {
                        return false
                    }

                    const lines = body.split('\r\n')

                    return (
                        lines.length === 6 &&
                        lines[0].startsWith('------formdata-') &&
                        lines[1] ===
                            'Content-Disposition: form-data; name="file"; filename="blob"' &&
                        lines[2] === `Content-Type: ${contentType.docx}` &&
                        lines[3] === '' &&
                        lines[4] === payload &&
                        lines[5].startsWith('------formdata-')
                    )
                })
                .reply(200, mockResponseData, {
                    'content-type': 'application/vnd.blocknote+json',
                })

            const client = new Client('https://api.example.com/v1')

            const result = await client.convert(payloadBuffer)

            expect(result).toBeInstanceOf(Response)

            await expect(result.json()).resolves.toStrictEqual(mockResponseData)
        })

        it('calls conversion endpoint and returns conversions', async () => {
            const mockResponseData = { content: [] }

            const payload = '# Example payload'

            const _scope = nock('https://api.example.com')
                .matchHeader('content-type', /^multipart\/form-data; boundary=----.*/)
                .post('/v1/conversion', (body) => {
                    if (typeof body !== 'string') {
                        return false
                    }

                    const lines = body.split('\r\n')

                    return (
                        lines.length === 6 &&
                        lines[0].startsWith('------formdata-') &&
                        lines[1] ===
                            'Content-Disposition: form-data; name="file"; filename="blob"' &&
                        lines[2] === `Content-Type: ${contentType.docx}` &&
                        lines[3] === '' &&
                        lines[4] === payload &&
                        lines[5].startsWith('------formdata-')
                    )
                })
                .reply(200, mockResponseData, {
                    'content-type': 'application/vnd.blocknote+json',
                })

            const client = new Client('https://api.example.com/v1')
            const blob = new Blob([payload], { type: contentType.docx })

            const result = await client.convert(blob)

            expect(result).toBeInstanceOf(Response)

            await expect(result.json()).resolves.toStrictEqual(mockResponseData)
        })

        it('throws on HTTP error', async () => {
            const mockResponseData = { code: 500, message: 'Internal Server Error' }

            const payload = '# Example payload'

            const _scope = nock('https://api.example.com')
                .matchHeader('content-type', /^multipart\/form-data; boundary=----.*/)
                .post('/v1/conversion', (body) => {
                    if (typeof body !== 'string') {
                        return false
                    }

                    const lines = body.split('\r\n')

                    return (
                        lines.length === 6 &&
                        lines[0].startsWith('------formdata-') &&
                        lines[1] ===
                            'Content-Disposition: form-data; name="file"; filename="blob"' &&
                        lines[2] === `Content-Type: ${contentType.docx}` &&
                        lines[3] === '' &&
                        lines[4] === payload &&
                        lines[5].startsWith('------formdata-')
                    )
                })
                .reply(500, mockResponseData, {
                    'content-type': contentType.blocknote,
                })

            const client = new Client('https://api.example.com/v1')
            const blob = new Blob([payload], { type: contentType.docx })

            await expect(client.convert(blob)).rejects.toThrowError(
                new DocSpecAPIError(
                    'Failed to call DocSpec API on https://api.example.com/v1/conversion: 500 Internal Server Error - {"code":500,"message":"Internal Server Error"}',
                    new URL('https://api.example.com/v1/conversion'),
                    500,
                    '{"code":500,"message":"Internal Server Error"}'
                )
            )
        })
    })
})

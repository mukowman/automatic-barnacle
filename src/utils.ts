import { RequestLogger } from 'testcafe'
import { gunzip } from 'zlib'
import { Payload, publishLoggedRequests } from './clients/mqtt'

const loggerOptions = {
  logRequestBody: true,
  logRequestHeaders: true,
  logResponseBody: true,
  logResponseHeaders: true
}

export const createRequestLogger = (regExp: RegExp, options?: RequestLoggerOptions): RequestLogger => {
  return RequestLogger(regExp, { ...loggerOptions, ...options })
}

export const matchRequestUrlId = (log: LoggedRequest, regExp: RegExp): string | undefined => {
  const match = log.request.url.match(regExp)
  return match && match.length > 0 ? match[1] : undefined
}

export const getResponse = async (log: LoggedRequest): Promise<string> => {
  const encoding = log.response?.headers
        ? log.response.headers['content-encoding']
        : undefined

    return encoding && encoding === 'gzip'
      ? await gunzipBody(log.response.body as Buffer)
      : log.response?.body?.toString()
}

const gunzipBody = async (body: Buffer): Promise<string> =>
  new Promise((resolve, reject) => {
    gunzip(body, async (error, buff) => {
      if (error !== null) {
        return reject(error)
      }
      return resolve(buff.toString())
    })
  })

export const urlPayloadResolver = async (log: LoggedRequest, regExp: RegExp): Promise<Payload[]> => {
  return [{
    id: matchRequestUrlId(log, regExp),
    body: await getResponse(log)
  }]
}

export type RequestPublisherOptions = {
  topic: string
  urlPattern: RegExp
  payloadResolver?: (log: LoggedRequest) => Promise<Payload[]>
}

export class RequestPublisher {
  topic: string
  urlPattern: RegExp
  requestLogger: RequestLogger

  constructor(options: RequestPublisherOptions) {
    this.topic = options.topic
    this.urlPattern = options.urlPattern
    this.requestLogger = createRequestLogger(options.urlPattern)
    this.payloadResolver = options.payloadResolver ? options.payloadResolver : this.payloadResolver
  }

  public payloadResolver = async (log: LoggedRequest): Promise<Payload[]> => await urlPayloadResolver(log, this.urlPattern)

  public publish = async (): Promise<void[]> => await publishLoggedRequests(this.requestLogger, this.topic, this.payloadResolver)
}

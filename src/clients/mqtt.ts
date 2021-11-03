import { connect } from 'async-mqtt'

export const publish = async (topic: string, body: string): Promise<void> => {
  const client = connect(process.env.MQTT_URL)
  await client.publish(`automatic-barnacle/${topic}`, body, {
      qos: 0,
      retain: true
  })
  return await client.end()
}

export type Payload = {
  id?: string
  body?: string
}

export const publishLoggedRequests = async (logger: RequestLogger, topic: string, payloadResolver?: (log: LoggedRequest) => Promise<Payload[]>): Promise<void[]> => {
  return await Promise.all(
    logger.requests.map(async (log) => {
      const payloads = payloadResolver ? await payloadResolver(log) : []
      if (!payloads || payloads.length === 0) {
        return
      }

      await Promise.all(
        payloads.map(async (payload: Payload) => {
          // Ensure body was resolved
          if (payload.body) {
            const publishTopic = payload.id ? `${topic}/${payload.id}` : topic
            return await publish(publishTopic, payload.body)
          }
        })
      )
    })
  )
}

import { getResponse, RequestPublisher } from '../utils'
import { Payload } from '../clients/mqtt'
import { aussieBB } from '../roles'

const billingUrl = 'https://my.aussiebroadband.com.au/#/billing'
const patterns = {
  billing: /https:\/\/myaussie-api.aussiebroadband.com.au\/billing\/transactions/,
  services: /https:\/\/myaussie-api.aussiebroadband.com.au\/services/,
  usage: /broadband\/(\d*)\/usage/
}

const billingPayloadResovler = async (log: LoggedRequest): Promise<Payload[]> => {
  const response = await getResponse(log)
  return response ? [{ body: response }] : undefined
}

const servicesPayloadResovler = async (log: LoggedRequest): Promise<Payload[]> => {
  const response = await getResponse(log)
  if (!response) {
    return undefined
  }

  const body = JSON.parse(response)
  if (body.data && body.data.length > 0) {
    return body.data.map((service: any) => {
      return {
        id: service.service_id,
        body: JSON.stringify(service)
      }
    })
  }
}

const billing = new RequestPublisher({ topic: 'aussie/billing', urlPattern: patterns.billing, payloadResolver: billingPayloadResovler })
const services = new RequestPublisher({ topic: 'aussie/services', urlPattern: patterns.services, payloadResolver: servicesPayloadResovler })
const usage = new RequestPublisher({ topic: 'aussie/usage', urlPattern: patterns.usage })

fixture`Aussie Broadband`
  .page`https://my.aussiebroadband.com.au/#`
  .requestHooks(services.requestLogger, usage.requestLogger, billing.requestLogger)

test('Dashboard - Publish Services & Usage', async t => {
  await t
    .useRole(aussieBB)
    .click('[data-cy="services-list"] a') // Navigate to first service
    .navigateTo(billingUrl)

  // Publish results to MQTT broker
  await Promise.all([ billing.publish(), services.publish(), usage.publish() ])
})

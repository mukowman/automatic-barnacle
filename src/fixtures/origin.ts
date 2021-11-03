import { getResponse, matchRequestUrlId, RequestPublisher } from '../utils'
import { Payload } from '../clients/mqtt'
import { originEnergy } from '../roles'

const usageBaseUrl = 'https://www.originenergy.com.au/my-account/usage/usage_to_date?caid='
const patterns = {
  contracts: /api\/v1\/fuel\/contract\/(\d*)/,
  invoices: /api\/v1\/accounts\/(\d*)\/invoices/,
  usage: /api\/usage\/(\d*)\/bill-period/
}

const contracts = new RequestPublisher({ topic: 'origin/contracts', urlPattern: patterns.contracts })
const invoices = new RequestPublisher({ topic: 'origin/invoices', urlPattern: patterns.invoices })
const usage = new RequestPublisher({ topic: 'origin/usage', urlPattern: patterns.usage, payloadResolver: 
  async (log: LoggedRequest): Promise<Payload[]> => {
    // Massage data to retrieve previous and current invoices
    const response = await getResponse(log)
    if (!response) {
      return undefined
    }
  
    const body = JSON.parse(response)
    if (body.data && body.data.length > 0) {
      const reverse = body.data.reverse()
      return [{
        id: matchRequestUrlId(log, patterns.usage),
        body: JSON.stringify({
          previous: reverse.find((x: any) => x.recordType === 'ACTUAL'),
          current: reverse.find((x: any) => x.recordType === 'PROJECTED' || x.recordType === 'ESTIMATED')
        })
      }]
    }
  }
})

fixture`Origin Energy`
  .page`https://www.originenergy.com.au/my-account/dashboard`
  .requestHooks(contracts.requestLogger, invoices.requestLogger, usage.requestLogger)

test('Dashboard - Publish Contracts, Invoices & Usage', async t => {
  await t
    .useRole(originEnergy)
    .wait(5000) // Wait for all contracts to be requested after login
  
  // Visit usage page for each contract that was found
  await Promise.all(
    contracts.requestLogger.requests
      .map((log) => matchRequestUrlId(log, contracts.urlPattern))
      .map(async (id) => await t.navigateTo(`${usageBaseUrl}${id}`).wait(3000))
  )

  // Publish results to MQTT broker
  await Promise.all([ contracts.publish(), invoices.publish(), usage.publish() ])
})

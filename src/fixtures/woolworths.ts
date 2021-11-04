import { getResponse, RequestPublisher } from '../utils'
import { woolworths } from '../roles'
import { Payload } from '../clients/mqtt'

const patterns = {
  orders: /wow\/v1\/orders\/api\/orders\?shopperId=(\d*)/
}

const orders = new RequestPublisher({ topic: 'woolworths/orders', urlPattern: patterns.orders, payloadResolver: 
async (log: LoggedRequest): Promise<Payload[]> => {
  // Massage data to retrieve previous and current orders
  const response = await getResponse(log)
  if (!response) {
    return undefined
  }

  const body = JSON.parse(response)
  if (body.items && body.items.length > 0) {
    return [{
      body: JSON.stringify({
        previous: body.items.length > 1 ? body.items[1] : undefined,
        current: body.items[0]
      })
    }]
  }
}
})

fixture`Woolworths`
  .page`https://www.woolworths.com.au/shop/myaccount/myorders`
  .requestHooks(orders.requestLogger)

test('Publish Orders', async t => {
  await t
    .useRole(woolworths)
    .navigateTo('https://www.woolworths.com.au/shop/myaccount/myorders')
    .wait(5000)

  // Publish results to MQTT broker
  await Promise.all([ orders.publish() ])
})

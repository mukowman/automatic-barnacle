import { createRequestLogger, getResponse } from '../utils'
import { Payload, publishLoggedRequests } from '../clients/mqtt'
import { southEastWater } from '../roles'

const auraRegexp = /sfsites\/aura\?r=\d/
const aura = createRequestLogger(auraRegexp)

fixture`South East Water`
  .page`https://my.southeastwater.com.au/s/`
  .requestHooks(aura)

test('Dashboard - Publish Aura', async t => {
  await t
    .useRole(southEastWater)

  await Promise.all([
    publishLoggedRequests(aura, 'water/account', accountPayloadResovler),
    publishLoggedRequests(aura, 'water/consumption', consumptionPayloadResovler)
  ])
})

const accountPayloadResovler = async (log: LoggedRequest): Promise<Payload[]> => {
  const response = await getResponse(log)
  if (!response) {
    return undefined
  }

  const body = JSON.parse(response)  
  const action = body.actions?.find((action: any) => {
    return typeof(action.returnValue) === 'string' ? action.returnValue.startsWith('[{"attributes":{"type":"Billing_Account__c"') : undefined
  })

  if (action) {
    const accounts = JSON.parse(action.returnValue)
    return accounts.map((account: any) => {
      return {
        id: account.Id,
        body: JSON.stringify(account)
      }
    })
  }
}

const consumptionPayloadResovler = async (log: LoggedRequest): Promise<Payload[]> => {
  const response = await getResponse(log)
  if (!response) {
    return undefined
  }

  const body = JSON.parse(response)
  const action = body.actions?.find((action: any) => {
    return typeof(action.returnValue) === 'string' ? action.returnValue.startsWith('[{"attributes":{"type":"Consumption_and_Charge__c"') : undefined
  })

  if (action) {
    const consumptionCharges = JSON.parse(action.returnValue)
    const accounts = [...new Set(consumptionCharges.map((x: any) => x.Billing_Account__c))]
    const accountConsumptionCharges = accounts.map((id: any) => consumptionCharges.filter((x: any) => x.Billing_Account__c === id))
    return accountConsumptionCharges.map((accountConsumptionCharge: any) => {
      return {
        id: accountConsumptionCharge[0].Billing_Account__c, // All entries will have the same id, so use the first
        body: JSON.stringify(accountConsumptionCharge)
      }
    })
  }
}

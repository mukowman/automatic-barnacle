import { Role } from 'testcafe'
import * as dotenv from 'dotenv'

dotenv.config()

export const originEnergy = Role(`https://www.originenergy.com.au/auth/callback`, async t => {
  await t
    .typeText('#login_username', process.env.ORIGIN_ENERGY_USERNAME)
    .typeText('#password', process.env.ORIGIN_ENERGY_PASSWORD)
    .click('[data-id="LoginStep__continue"]')
})

export const aussieBB = Role(`https://my.aussiebroadband.com.au/#/login`, async t => {
  await t
    .typeText('input[name="username"]', process.env.AUSSIE_BB_USERNAME)
    .typeText('input[name="password"]', process.env.AUSSIE_BB_PASSWORD)
    .click('button[type="submit"]')
})

export const southEastWater = Role(`https://my.southeastwater.com.au/s/login/`, async t => {
  await t
    .click('lightning-input[data-data-rendering-service-uid="56"]')
    .pressKey(pressKeys(process.env.SOUTH_EAST_WATER_USERNAME), { confidential: true })
    .click('lightning-input[data-data-rendering-service-uid="57"]')
    .pressKey(pressKeys(process.env.SOUTH_EAST_WATER_PASSWORD), { confidential: true })
    .click('button[name="login"]')
    .wait(10000)
})

export const woolworths = Role(`https://www.woolworths.com.au/shop/securelogin`, async t => {
  await t
    .typeText('#loginForm-Email', process.env.WOOLWORTHS_USERNAME)
    .typeText('#loginForm-Password', process.env.WOOLWORTHS_PASSWORD)
    .click('button[type="submit"]')
})

const pressKeys = (keys: string): string => {
  return keys.split('').join(' ')
}

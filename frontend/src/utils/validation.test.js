import { sanitizeString, isPositiveNumber, validateListingForm } from './validation'

test('sanitizeString trims input', () => {
  expect(sanitizeString('  hello ')).toBe('hello')
  expect(sanitizeString(undefined)).toBe('')
})

test('isPositiveNumber validates bounds', () => {
  expect(isPositiveNumber(0)).toBe(true)
  expect(isPositiveNumber('10.5')).toBe(true)
  expect(isPositiveNumber(-1)).toBe(false)
  expect(isPositiveNumber(1e12)).toBe(false)
})

test('validateListingForm enforces required fields', () => {
  const { valid, errors } = validateListingForm({
    title: '', description: '', type: '', unit: '', price: -1, quantity: 0,
    state: '', lga: 'Valid LGA'
  })
  expect(valid).toBe(false)
  expect(errors.title).toBeDefined()
  expect(errors.type).toBeDefined()
  expect(errors.unit).toBeDefined()
  expect(errors.price).toBeDefined()
  expect(errors.state).toBeDefined()
})

test('validateListingForm accepts valid inputs', () => {
  const { valid } = validateListingForm({
    title: 'Tomatoes', description: 'Fresh', type: 'Vegetables', unit: 'kg',
    price: 100, quantity: 5, state: 'Lagos', lga: 'Ikeja'
  })
  expect(valid).toBe(true)
})
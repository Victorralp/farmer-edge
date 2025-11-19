export const sanitizeString = (s) => (typeof s === 'string' ? s.trim() : '')

export const isPositiveNumber = (n) => {
  const num = typeof n === 'string' ? parseFloat(n) : n
  return Number.isFinite(num) && num >= 0 && num <= 1000000000
}

export const validateListingForm = (data) => {
  const errors = {}

  const title = sanitizeString(data.title)
  const description = sanitizeString(data.description)
  const type = sanitizeString(data.type)
  const unit = sanitizeString(data.unit)
  const state = sanitizeString(data.state)
  const lga = sanitizeString(data.lga)

  if (!title) errors.title = 'Title is required'
  if (title.length > 200) errors.title = 'Title must be ≤ 200 characters'

  if (description.length > 2000) errors.description = 'Description must be ≤ 2000 characters'

  if (!type) errors.type = 'Product type is required'

  const allowedUnits = ['kg', 'bag', 'basket', 'bundle', 'piece']
  if (!unit || !allowedUnits.includes(unit)) errors.unit = 'Select a valid unit'

  if (!isPositiveNumber(data.price)) errors.price = 'Enter a valid price ≥ 0'
  if (!isPositiveNumber(data.quantity)) errors.quantity = 'Enter a valid quantity ≥ 0'

  if (!state) errors.state = 'State is required'
  if (lga && lga.length > 100) errors.lga = 'LGA must be ≤ 100 characters'

  return { valid: Object.keys(errors).length === 0, errors, cleaned: { title, description, type, unit, state, lga } }
}

export const validateOrderForm = (data, maxQuantity) => {
  const errors = {};

  const quantity = typeof data.quantity === 'string' ? parseInt(data.quantity, 10) : data.quantity;
  if (!Number.isInteger(quantity) || quantity <= 0) {
    errors.quantity = 'Please enter a valid quantity.';
  } else if (quantity > maxQuantity) {
    errors.quantity = `Quantity cannot exceed available stock (${maxQuantity}).`;
  }

  const deliveryAddress = sanitizeString(data.deliveryAddress);
  if (!deliveryAddress) {
    errors.deliveryAddress = 'Delivery address is required.';
  } else if (deliveryAddress.length > 500) {
    errors.deliveryAddress = 'Address must be 500 characters or less.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    cleaned: { ...data, quantity, deliveryAddress },
  };
};

export const validateMessageForm = (data) => {
  const errors = {};

  const content = sanitizeString(data.content);
  if (!content) {
    errors.content = 'Message cannot be empty.';
  } else if (content.length > 1000) {
    errors.content = 'Message must be 1000 characters or less.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    cleaned: { ...data, content },
  };
};

export default {
  sanitizeString,
  isPositiveNumber,
  validateListingForm,
  validateOrderForm,
  validateMessageForm,
};
export const getErrorMessage = (error, fallback = 'An unexpected error occurred') => {
  if (!error) return fallback
  if (typeof error === 'string') return error
  if (error.message) return error.message
  if (error.response?.data?.error) return error.response.data.error
  return fallback
}

export const toastError = (toast, error, fallback) => {
  const msg = getErrorMessage(error, fallback)
  toast.error(msg)
  return msg
}

const errorUtils = { getErrorMessage, toastError };
export default errorUtils;
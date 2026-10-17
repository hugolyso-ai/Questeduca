import { toast } from 'sonner'

export function useToast() {
  return {
    toast: (message, options) => toast(message, options),
    success: (message) => toast.success(message),
    error: (message) => toast.error(message),
    info: (message) => toast.info(message),
    warning: (message) => toast.warning(message),
  }
}

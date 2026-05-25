import { z } from 'zod';

export const ERROR_MESSAGES = {
  displayName: {
    required: 'Tên hiển thị là bắt buộc',
    min: 'Tên hiển thị phải từ 3 đến 50 ký tự',
    max: 'Tên hiển thị phải từ 3 đến 50 ký tự',
  },
  username: {
    required: 'Tên đăng nhập là bắt buộc',
    min: 'Tên đăng nhập phải từ 3 đến 50 ký tự',
    max: 'Tên đăng nhập phải từ 3 đến 50 ký tự',
  },
  email: {
    required: 'Email là bắt buộc',
    invalid: 'Email không hợp lệ (ví dụ: name@domain.com)',
  },
  phoneNumber: {
    required: 'Số điện thoại là bắt buộc',
    invalid: 'Số điện thoại phải gồm đúng 10 chữ số',
  },
  password: {
    required: 'Mật khẩu là bắt buộc',
    min: 'Mật khẩu phải từ 6 đến 100 ký tự',
    max: 'Mật khẩu phải từ 6 đến 100 ký tự',
  },
  api: {
    usernameTaken: 'Tên đăng nhập này đã được sử dụng',
    emailInUse: 'Email này đã được sử dụng',
    unknown: 'Có lỗi xảy ra trong quá trình đăng ký. Vui lòng thử lại!',
  }
};

export const registerSchema = z.object({
  displayName: z.string()
    .min(1, { message: ERROR_MESSAGES.displayName.required })
    .min(3, { message: ERROR_MESSAGES.displayName.min })
    .max(50, { message: ERROR_MESSAGES.displayName.max }),
  username: z.string()
    .min(1, { message: ERROR_MESSAGES.username.required })
    .min(3, { message: ERROR_MESSAGES.username.min })
    .max(50, { message: ERROR_MESSAGES.username.max }),
  email: z.string()
    .min(1, { message: ERROR_MESSAGES.email.required })
    .email({ message: ERROR_MESSAGES.email.invalid }),
  phoneNumber: z.string()
    .min(1, { message: ERROR_MESSAGES.phoneNumber.required })
    .regex(/^[0-9]{10}$/, { message: ERROR_MESSAGES.phoneNumber.invalid }),
  password: z.string()
    .min(1, { message: ERROR_MESSAGES.password.required })
    .min(6, { message: ERROR_MESSAGES.password.min })
    .max(100, { message: ERROR_MESSAGES.password.max }),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Maps server/API validation errors to react-hook-form field errors.
 * Returns a form-level error message if the error could not be mapped to any specific field.
 */
export const mapApiErrorToFields = (
  errorMessage: string,
  setError: (field: any, error: { type: string; message: string }) => void,
  setFocus?: (field: any) => void
): string | null => {
  if (!errorMessage) return ERROR_MESSAGES.api.unknown;

  // Helper to set error and focus
  const setErrorAndFocus = (field: keyof RegisterFormData, message: string) => {
    setError(field, { type: 'server', message });
    if (setFocus) {
      setTimeout(() => setFocus(field), 50);
    }
  };

  // Handle username already taken check
  if (errorMessage.includes('Username is already taken')) {
    setErrorAndFocus('username', ERROR_MESSAGES.api.usernameTaken);
    return null;
  }
  // Handle email already in use check
  if (errorMessage.includes('Email is already in use')) {
    setErrorAndFocus('email', ERROR_MESSAGES.api.emailInUse);
    return null;
  }

  // Handle Spring Boot validation errors (GlobalExceptionHandler format)
  // e.g. "Tên hiển thị: displayname is mandatory; Số điện thoại: SĐT phải là 10 chữ số"
  let hasMapped = false;
  let firstMappedField: keyof RegisterFormData | null = null;

  if (errorMessage.includes(';') || errorMessage.includes(':')) {
    const parts = errorMessage.split(';');
    parts.forEach(part => {
      const colonIndex = part.indexOf(':');
      if (colonIndex !== -1) {
        const fieldLabel = part.substring(0, colonIndex).trim();
        const rawMsg = part.substring(colonIndex + 1).trim();

        let fieldName: keyof RegisterFormData | null = null;
        if (fieldLabel === 'Tên hiển thị') fieldName = 'displayName';
        else if (fieldLabel === 'Tên đăng nhập') fieldName = 'username';
        else if (fieldLabel === 'Email') fieldName = 'email';
        else if (fieldLabel === 'Số điện thoại') fieldName = 'phoneNumber';
        else if (fieldLabel === 'Mật khẩu') fieldName = 'password';

        if (fieldName) {
          // Try to map to standard friendly messages
          let friendlyMessage = rawMsg;
          const lowerRaw = rawMsg.toLowerCase();
          if (lowerRaw.includes('mandatory') || lowerRaw.includes('required')) {
            friendlyMessage = ERROR_MESSAGES[fieldName].required;
          } else if (lowerRaw.includes('at least') || lowerRaw.includes('size') || lowerRaw.includes('between')) {
            friendlyMessage = fieldName === 'password' 
              ? ERROR_MESSAGES.password.min 
              : (ERROR_MESSAGES[fieldName] as any).min || rawMsg;
          } else if (lowerRaw.includes('valid') || lowerRaw.includes('invalid')) {
            friendlyMessage = fieldName === 'email' ? ERROR_MESSAGES.email.invalid : rawMsg;
          } else if (rawMsg.includes('SĐT phải là 10 chữ số')) {
            friendlyMessage = ERROR_MESSAGES.phoneNumber.invalid;
          }

          setError(fieldName, { type: 'server', message: friendlyMessage });
          hasMapped = true;
          if (!firstMappedField) {
            firstMappedField = fieldName;
          }
        }
      }
    });
  }

  if (firstMappedField && setFocus) {
    const targetField = firstMappedField;
    setTimeout(() => setFocus(targetField), 50);
  }

  if (hasMapped) return null;

  // Secondary fallbacks for common keywords in case the format varies
  if (errorMessage.toLowerCase().includes('username')) {
    setErrorAndFocus('username', ERROR_MESSAGES.api.usernameTaken);
    return null;
  }
  if (errorMessage.toLowerCase().includes('email')) {
    setErrorAndFocus('email', ERROR_MESSAGES.api.emailInUse);
    return null;
  }

  return ERROR_MESSAGES.api.unknown;
};

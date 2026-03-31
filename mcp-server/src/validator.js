function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validateValue(schema, value, fieldName) {
  if (!isPlainObject(schema)) {
    return null;
  }

  if (schema.enum) {
    if (typeof value !== 'string') {
      return `${fieldName} must be a string`;
    }
    if (!schema.enum.includes(value)) {
      return `${fieldName} must be one of: ${schema.enum.join(', ')}`;
    }
  }

  switch (schema.type) {
    case 'string':
      if (typeof value !== 'string') {
        return `${fieldName} must be a string`;
      }
      if (schema.minLength !== undefined && value.length < schema.minLength) {
        return `${fieldName} must be at least ${schema.minLength} characters`;
      }
      if (schema.maxLength !== undefined && value.length > schema.maxLength) {
        return `${fieldName} must be at most ${schema.maxLength} characters`;
      }
      return null;
    case 'number':
      if (typeof value !== 'number' || Number.isNaN(value)) {
        return `${fieldName} must be a number`;
      }
      if (schema.minimum !== undefined && value < schema.minimum) {
        return `${fieldName} must be >= ${schema.minimum}`;
      }
      if (schema.maximum !== undefined && value > schema.maximum) {
        return `${fieldName} must be <= ${schema.maximum}`;
      }
      return null;
    case 'boolean':
      if (typeof value !== 'boolean') {
        return `${fieldName} must be a boolean`;
      }
      return null;
    default:
      return null;
  }
}

export function validateArguments(schema, input) {
  const source = input ?? {};

  if (!isPlainObject(source)) {
    return {
      ok: false,
      errors: ['Tool arguments must be an object'],
    };
  }

  const properties = schema?.properties ?? {};
  const required = schema?.required ?? [];
  const sanitized = {};
  const errors = [];

  for (const name of required) {
    if (source[name] === undefined) {
      errors.push(`Missing required argument: ${name}`);
    }
  }

  for (const [name, propertySchema] of Object.entries(properties)) {
    if (source[name] === undefined) {
      continue;
    }

    const error = validateValue(propertySchema, source[name], name);
    if (error) {
      errors.push(error);
      continue;
    }

    sanitized[name] = source[name];
  }

  if (errors.length > 0) {
    return {
      ok: false,
      errors,
    };
  }

  return {
    ok: true,
    value: sanitized,
  };
}

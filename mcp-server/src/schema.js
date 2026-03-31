function compact(object) {
  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => value !== undefined)
  );
}

export function objectSchema(properties = {}, required = []) {
  return compact({
    type: 'object',
    properties: Object.keys(properties).length > 0 ? properties : undefined,
    required: required.length > 0 ? required : undefined,
  });
}

export function stringField(description, options = {}) {
  return compact({
    type: 'string',
    description,
    ...options,
  });
}

export function numberField(description, options = {}) {
  return compact({
    type: 'number',
    description,
    ...options,
  });
}

export function booleanField(description, options = {}) {
  return compact({
    type: 'boolean',
    description,
    ...options,
  });
}

export function enumField(values, description, options = {}) {
  return compact({
    type: 'string',
    enum: values,
    description,
    ...options,
  });
}

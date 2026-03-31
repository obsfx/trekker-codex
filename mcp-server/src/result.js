export function jsonTextResult(result) {
  const response = {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };

  if (result?.success === false) {
    response.isError = true;
  }

  return response;
}

export function textResult(text) {
  return {
    content: [
      {
        type: 'text',
        text,
      },
    ],
  };
}

export function errorTextResult(text) {
  return {
    content: [
      {
        type: 'text',
        text,
      },
    ],
    isError: true,
  };
}

class HttpError extends Error {
  statusCode = 500;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export default HttpError;

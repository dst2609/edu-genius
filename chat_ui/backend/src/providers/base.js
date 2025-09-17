export class BaseProvider {
    async chat(/* message, history, context */) {
      throw new Error('Not implemented');
    }
  }
  
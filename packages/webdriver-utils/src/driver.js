import utils from '@percy/sdk-utils';
import Cache from './util/cache.js';
const { request } = utils;

export default class Driver {
  constructor(sessionId, executorUrl, capabilities) {
    this.sessionId = sessionId;
    this.executorUrl = executorUrl.includes('@') ? `https://${executorUrl.split('@')[1]}` : executorUrl;
    this.defaultCapabilities = capabilities || {};
    this.fetchFromAutomate = false;
  }

  async getCapabilites() {
    const log = utils.logger('webdriver-utils:main');
    try {
      return await Cache.withCache(Cache.caps, this.sessionId, async () => {
        const baseUrl = `${this.executorUrl}/session/${this.sessionId}`;
        const caps = JSON.parse((await request(baseUrl)).body);
        return caps.value;
      });
    } catch (err) {
      this.fetchFromAutomate = true;
      log.debug('Using default capabilities');
      return this.defaultCapabilities;
      // return await Cache.withCache(this.defaultCapabilities, `${this.sessionId}_caps`);
    }
  }

  async getWindowSize() {
    const baseUrl = `${this.executorUrl}/session/${this.sessionId}/window/current/size`;
    const windowSize = JSON.parse((await request(baseUrl)).body);
    return windowSize;
  }

  // command => {script: "", args: []}
  async executeScript(command) {
    if ((!command.constructor === Object) ||
      !(Object.keys(command).length === 2 &&
      Object.keys(command).includes('script') &&
      Object.keys(command).includes('args'))
    ) {
      throw new Error('Please pass command as {script: "", args: []}');
    }
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=utf-8'
      },
      body: JSON.stringify(command)
    };
    const baseUrl = `${this.executorUrl}/session/${this.sessionId}/execute/sync`;
    const response = JSON.parse((await request(baseUrl, options)).body);
    return response;
  }

  async takeScreenshot() {
    const baseUrl = `${this.executorUrl}/session/${this.sessionId}/screenshot`;
    const screenShot = JSON.parse((await request(baseUrl)).body);
    return screenShot.value;
  }

  async rect(elementId) {
    const baseUrl = `${this.executorUrl}/session/${this.sessionId}/element/${elementId}/rect`;
    const response = JSON.parse((await request(baseUrl)).body);
    return response.value;
  }

  async findElement(using, value) {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=utf-8'
      },
      body: JSON.stringify({ using, value })
    };
    const baseUrl = `${this.executorUrl}/session/${this.sessionId}/element`;
    const response = JSON.parse((await request(baseUrl, options)).body);
    return response.value;
  }
}

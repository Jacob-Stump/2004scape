import ClientProtCategory from '#/network/game/client/codec/ClientProtCategory.js';
import IncomingMessage from '#/network/game/client/IncomingMessage.js';

export default class ResumePCountDialog extends IncomingMessage {
    category = ClientProtCategory.USER_EVENT;

    constructor(readonly input: number) {
        super();
    }
}

import ZoneMessage from '#/network/game/server/ZoneMessage.js';

export default class LocAddChange extends ZoneMessage {
    constructor(
        readonly coord: number,
        readonly loc: number,
        readonly shape: number,
        readonly angle: number
    ) {
        super(coord);
    }
}

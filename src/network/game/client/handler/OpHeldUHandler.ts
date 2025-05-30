import CategoryType from '#/cache/config/CategoryType.js';
import Component from '#/cache/config/Component.js';
import ObjType from '#/cache/config/ObjType.js';
import Player from '#/engine/entity/Player.js';
import ScriptProvider from '#/engine/script/ScriptProvider.js';
import ScriptRunner from '#/engine/script/ScriptRunner.js';
import ServerTriggerType from '#/engine/script/ServerTriggerType.js';
import MessageHandler from '#/network/game/client/handler/MessageHandler.js';
import OpHeldU from '#/network/game/client/model/OpHeldU.js';
import Environment from '#/util/Environment.js';


export default class OpHeldUHandler extends MessageHandler<OpHeldU> {
    handle(message: OpHeldU, player: Player): boolean {
        const { obj: item, slot, component: comId, useObj: useItem, useSlot, useComponent: useComId } = message;
        if (player.delayed) {
            return false;
        }

        const com = Component.get(comId);
        if (typeof com === 'undefined' || !player.isComponentVisible(com) || !com.interactable) {
            player.clearPendingAction();
            return false;
        }

        const useCom = Component.get(useComId);
        if (typeof useCom === 'undefined' || !player.isComponentVisible(useCom) || !useCom.interactable) {
            player.clearPendingAction();
            return false;
        }

        {
            const listener = player.invListeners.find(l => l.com === comId);
            if (!listener) {
                player.clearPendingAction();
                return false;
            }

            const inv = player.getInventoryFromListener(listener);
            if (!inv || !inv.validSlot(slot) || !inv.hasAt(slot, item)) {
                player.moveClickRequest = false; // removed early osrs
                player.clearPendingAction();
                return false;
            }
        }

        {
            const listener = player.invListeners.find(l => l.com === useComId);
            if (!listener) {
                player.clearPendingAction();
                return false;
            }

            const inv = player.getInventoryFromListener(listener);
            if (!inv || !inv.validSlot(useSlot) || !inv.hasAt(useSlot, useItem)) {
                player.moveClickRequest = false; // removed early osrs
                player.clearPendingAction();
                return false;
            }
        }

        player.lastItem = item;
        player.lastSlot = slot;
        player.lastUseItem = useItem;
        player.lastUseSlot = useSlot;

        const objType = ObjType.get(player.lastItem);
        const useObjType = ObjType.get(player.lastUseItem);

        player.clearPendingAction();
        player.faceEntity = -1;
        player.masks |= player.entitymask;

        if ((objType.members || useObjType.members) && !Environment.NODE_MEMBERS) {
            player.messageGame("To use this item please login to a members' server.");
            return false;
        }

        // [opheldu,b]
        let script = ScriptProvider.getByTriggerSpecific(ServerTriggerType.OPHELDU, objType.id, -1);

        // [opheldu,a]
        if (!script) {
            script = ScriptProvider.getByTriggerSpecific(ServerTriggerType.OPHELDU, useObjType.id, -1);
            [player.lastItem, player.lastUseItem] = [player.lastUseItem, player.lastItem];
            [player.lastSlot, player.lastUseSlot] = [player.lastUseSlot, player.lastSlot];
        }

        // [opheld,b_category]
        const objCategory = objType.category !== -1 ? CategoryType.get(objType.category) : null;
        if (!script && objCategory) {
            script = ScriptProvider.getByTriggerSpecific(ServerTriggerType.OPHELDU, -1, objCategory.id);
        }

        // [opheld,a_category]
        const useObjCategory = useObjType.category !== -1 ? CategoryType.get(useObjType.category) : null;
        if (!script && useObjCategory) {
            script = ScriptProvider.getByTriggerSpecific(ServerTriggerType.OPHELDU, -1, useObjCategory.id);
            [player.lastItem, player.lastUseItem] = [player.lastUseItem, player.lastItem];
            [player.lastSlot, player.lastUseSlot] = [player.lastUseSlot, player.lastSlot];
        }

        if (script) {
            player.executeScript(ScriptRunner.init(script, player), true);
        } else {
            if (Environment.NODE_DEBUG) {
                player.messageGame(`No trigger for [opheldu,${objType.debugname}]`);
            }

            // todo: is this appropriate?
            player.messageGame('Nothing interesting happens.');
        }

        return true;
    }
}

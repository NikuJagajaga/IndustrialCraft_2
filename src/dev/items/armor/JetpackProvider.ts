namespace JetpackProvider {
	export function onTick(item: ItemInstance, playerUid: number): ItemInstance {
		let energyStored = ChargeItemRegistry.getEnergyStored(item);
		if (item.extra && item.extra.getBoolean("hover")) {
			let vel = Entity.getVelocity(playerUid);
			if (energyStored < 8 || EntityHelper.isOnGround(playerUid)) {
				item.extra.putBoolean("hover", false);
				let client = Network.getClientForPlayer(playerUid);
				if (client) client.sendMessage("§4" + Translation.translate("Hover mode disabled"));
				return item;
			}
			else if (vel.y < 0) {
				EntityHelper.resetFallHeight(playerUid);
				if (vel.y < -0.1) {
					Entity.addVelocity(playerUid, 0, Math.min(0.25, -0.1 - vel.y), 0);
					if (World.getThreadTime() % 5 == 0) {
						ChargeItemRegistry.setEnergyStored(item, Math.max(energyStored - 20, 0));
						return item;
					}
				}
			}
		}
		return null;
	}
}
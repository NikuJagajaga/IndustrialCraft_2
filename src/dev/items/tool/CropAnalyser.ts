class CropAnalyser extends ItemCommon {
	static gui: UI.Window;
	constructor() {
		super("agriculturalAnalyzer", "crop_analyzer", "cropnalyzer");
		this.setMaxStack(1);
		this.setCategory(ItemCategory.EQUIPMENT);
		ItemContainer.registerScreenFactory("crop_analyser.ui", function (container, name) {
			return CropAnalyser.gui;
		});
	}

	onItemUse(coords: Callback.ItemUseCoordinates, item: ItemStack, block: Tile, player: number): void {
		if (block.id == BlockID.crop) {
			const region = WorldRegion.getForActor(player);
			const tileEntity = region.getTileEntity(coords.x, coords.y, coords.z) as Agriculture.ICropTileEntity;
			if (!tileEntity.crop) return;
			this.showCropValues(tileEntity);
		} else {
			this.onNoTargetUse(item, player);
		}
	}

	onNoTargetUse(item: ItemStack, player: number): void {
		const client = Network.getClientForPlayer(player);
		if (!client) {
			return;
		}
		const container = new ItemContainer();
		container.setParent(this);
		if (!container.getClientContainerTypeName()) {
			this.setupContainer(container);
		}
		container.addServerCloseListener((container: ItemContainer, client: NetworkClient) => {
			const player = client.getPlayerUid();
			const { x, y, z } = Entity.getPosition(player);
			container.dropAt(BlockSource.getDefaultForActor(player), x, y, z);
		});
		container.addServerOpenListener((container: ItemContainer, client: NetworkClient) => {
			CropAnalyser.clearInfo(container);
		});
		container.openFor(client, "crop_analyser.ui");
	}

	showCropValues(tileEntity: Agriculture.ICropTileEntity): void {
		switch (tileEntity.data.scanLevel) {
			case 4:
				Game.message("Growth: " + tileEntity.data.statGrowth);
				Game.message("Gain: " + tileEntity.data.statGain);
				Game.message("Resistance: " + tileEntity.data.statResistance);
			case 2:
				Game.message("Tier: " + tileEntity.crop.getProperties().tier);
				Game.message("Discovered by: " + tileEntity.crop.getDiscoveredBy());
			case 1:
				Game.message(Translation.translate(tileEntity.crop.getID()));
		}
	}

	setupContainer(container: ItemContainer) {
		container.setClientContainerTypeName("crop_analyser.ui");
		container.setSlotAddTransferPolicy("slotSeedOut", () => 0);
		container.setSlotAddTransferPolicy("slotEnergy", (container: ItemContainer, name: string, id: number, amount: number, data: number, extra: ItemExtraData, playerUid: number) => {
			if (ChargeItemRegistry.isValidStorage(id, "Eu", 4)) {
				const slotBagIn = container.getSlot("slotSeedIn");
				if (slotBagIn.id == ItemID.cropSeedBag) {
					const slotBagOut = container.getSlot("slotSeedOut");
					if (slotBagOut.isEmpty()) {
						runOnMainThread(() => {
							const slotEnergy = container.getSlot("slotEnergy");
							CropAnalyser.scanBag(slotBagIn, slotEnergy, playerUid);
							CropAnalyser.moveBag(slotBagIn, slotBagOut);
							CropAnalyser.showAllValues(container, slotBagOut);
						});
					}
				}
				return amount;
			}
			return 0;
		});
		container.setSlotAddTransferPolicy("slotSeedIn", (container: ItemContainer, name: string, id: number, amount: number, data: number, extra: ItemExtraData, playerUid: number) => {
			if (id == ItemID.cropSeedBag) {
				const slotBagOut = container.getSlot("slotSeedOut");
				const slotEnergy = container.getSlot("slotEnergy");
				if (slotBagOut.isEmpty() && ChargeItemRegistry.isValidStorage(slotEnergy.id, "Eu", 4)) {
					CropAnalyser.scanBag({ id, count: amount, data, extra }, slotEnergy, playerUid);
					runOnMainThread(() => {
						const slotBagIn = container.getSlot("slotSeedIn");
						CropAnalyser.moveBag(slotBagIn, slotBagOut);
						CropAnalyser.showAllValues(container, { id, count: amount, data, extra });
					});
				}
				return amount;
			}
			return 0;
		});
		container.setSlotGetTransferPolicy("slotSeedOut", (container: ItemContainer, name: string, id: number, amount: number, data: number, extra: ItemExtraData, playerUid: number) => {
			CropAnalyser.clearInfo(container);
			const slotBagIn = container.getSlot("slotSeedIn");
			if (!slotBagIn.isEmpty()) {
				const slotEnergy = container.getSlot("slotEnergy");
				if (ChargeItemRegistry.isValidStorage(slotEnergy.id, "Eu", 4)) {
					runOnMainThread(() => {
						const slotBagOut = container.getSlot("slotSeedOut");
						CropAnalyser.scanBag({ id, count: amount, data, extra }, slotEnergy, playerUid);
						CropAnalyser.moveBag(slotBagIn, slotBagOut);
						CropAnalyser.showAllValues(container, { id, count: amount, data, extra });
					});
				}
			}
			return amount;
		});
	}

	static clearInfo(container: ItemContainer): void {
		container.setText("growthText", "");
		container.setText("gainText", "");
		container.setText("resistText", "");
		container.setText("growth", "");
		container.setText("gain", "");
		container.setText("resist", "");
		container.setText("attributes0", "");
		container.setText("attributes1", "");
		container.setText("attributes2", "");
		container.setText("textTier", "");
		container.setText("discoveredByText", "");
		container.setText("discoveredBy", "");
		container.setText("cropName", "");
		container.sendChanges();
	}

	static moveBag(slotBagIn: ItemContainerSlot, slotBagOut: ItemContainerSlot): void {
		slotBagOut.id = slotBagIn.id;
		slotBagOut.count = slotBagIn.count;
		slotBagOut.data = slotBagIn.data;
		slotBagOut.extra = slotBagIn.extra;
		slotBagIn.clear();
	}

	static scanBag(slotBag: ItemInstance, slotEnergy: ItemInstance, playerUid: number): void {
		const level = slotBag.extra.getInt("scan");
		if (level < 4) {
			const needEnergy = CropAnalyser.energyForLevel(level);
			const currentEnergy = ChargeItemRegistry.getEnergyStored(slotEnergy, "Eu");
			if (currentEnergy > needEnergy) {
				ICTool.dischargeItem(slotEnergy, needEnergy, playerUid);
				slotBag.extra.putInt("scan", level + 1);
			}
		}
	}
	static showAllValues(container: ItemContainer, seedBagSlot: ItemInstance) {
		var level = seedBagSlot.extra.getInt("scan");
		var crop: Agriculture.CropCard = Agriculture.CropCardManager.getCropCardByIndex(seedBagSlot.data)

		switch (level) {
			case 4:
				container.setText("growthText", "Growth: ");
				container.setText("gainText", "Gain: ");
				container.setText("resistText", "Resistance: ");

				container.setText("growth", seedBagSlot.extra.getInt("growth").toString());
				container.setText("gain", seedBagSlot.extra.getInt("gain").toString());
				container.setText("resist", seedBagSlot.extra.getInt("resistance").toString());
			case 3:
				const attributes = crop.getAttributes();
				for (let i in attributes) {
					container.setText("attributes" + (+i % 3), attributes[i]);
				}
			case 2:
				container.setText("textTier", CropAnalyser.getStringTier(crop.getProperties().tier));
				container.setText("discoveredByText", "Discovered by: ");
				container.setText("discoveredBy", crop.getDiscoveredBy());
			case 1:
				container.setText("cropName", CropAnalyser.getSeedName(crop.getID()));
		}

		container.setSlot("slotSeedOut", seedBagSlot.id, seedBagSlot.count, seedBagSlot.data, seedBagSlot.extra);
		container.clearSlot("slotSeedIn");
		container.sendChanges();
	}

	static getSeedName(name: string): string {
		return Translation.translate(name);
	}

	static energyForLevel(level: number): number {
		switch (level) {
			default: {
				return 10;
			}
			case 1: {
				return 90;
			}
			case 2: {
				return 900;
			}
			case 3: {
				return 9000;
			}
		}
	}

	static getStringTier(tier: number): string {
		switch (tier) {
			default: {
				return "0";
			}
			case 1: {
				return "I";
			}
			case 2: {
				return "II";
			}
			case 3: {
				return "III";
			}
			case 4: {
				return "IV";
			}
			case 5: {
				return "V";
			}
			case 6: {
				return "VI";
			}
			case 7: {
				return "VII";
			}
			case 8: {
				return "VIII";
			}
			case 9: {
				return "IX";
			}
			case 10: {
				return "X";
			}
			case 11: {
				return "XI";
			}
			case 12: {
				return "XII";
			}
			case 13: {
				return "XIII";
			}
			case 14: {
				return "XIV";
			}
			case 15: {
				return "XV";
			}
			case 16: {
				return "XVI";
			}
		}
	}
}
const guiAddConst = 14;
const guiAnalyserObject: UI.WindowContent = {
	location: {
		x: 0,
		y: 0,
		width: 1000,
		height: 1000
	},

	drawing: [
		{ type: "background", color: 0 },
		{ type: "bitmap", x: 250, y: UI.getScreenHeight() / 10, bitmap: "agricultural_analyser", scale: GUI_SCALE / 2.3 },
	],

	elements: {
		"closeButton": { type: "closeButton", x: 672, y: 77, bitmap: "close_button_small", scale: GUI_SCALE },
		"textName": { type: "text", font: { size: 18 }, x: 432, y: 86, width: 256, height: 42, text: Translation.translate("Crop Analyzer") },
		"slotSeedIn": { type: "slot", x: 265, y: 75, size: GUI_SCALE * 16 },
		"slotSeedOut": { type: "slot", x: 360, y: 75, size: GUI_SCALE * 16 },
		"slotEnergy": { type: "slot", x: 615, y: 75, size: GUI_SCALE * 16 },

		"cropName": { type: "text", font: { size: 18, color: Color.WHITE }, x: 270, y: 160, width: 256, height: 42, text: "" },
		"discoveredByText": { type: "text", font: { size: 18, color: Color.WHITE }, x: 270, y: 240, width: 256, height: 42, text: "" },
		"discoveredBy": { type: "text", font: { size: 18, color: Color.WHITE }, x: 270, y: 280, width: 256, height: 42, text: "" },
		"textTier": { type: "text", font: { size: 18, color: Color.WHITE }, x: 270, y: 200, width: 256, height: 42, text: "" },

		"attributes0": { type: "text", font: { size: 18, color: Color.WHITE }, x: 270, y: 320, width: 256, height: 42, text: "" },
		"attributes1": { type: "text", font: { size: 18, color: Color.WHITE }, x: 270, y: 360, width: 256, height: 42, text: "" },
		"attributes2": { type: "text", font: { size: 18, color: Color.WHITE }, x: 270, y: 400, width: 256, height: 42, text: "" },

		"growthText": { type: "text", font: { size: 18, color: Color.rgb(0, 128, 0) }, x: 560, y: 160, width: 256, height: 42, text: "" },
		"growth": { type: "text", font: { size: 18, color: Color.rgb(0, 128, 0) }, x: 560, y: 200, width: 256, height: 42, text: "" },
		"gainText": { type: "text", font: { size: 18, color: Color.rgb(255, 255, 0) }, x: 560, y: 240, width: 256, height: 42, text: "" },
		"gain": { type: "text", font: { size: 18, color: Color.rgb(255, 255, 0) }, x: 560, y: 280, width: 256, height: 42, text: "" },
		"resistText": { type: "text", font: { size: 18, color: Color.rgb(0, 255, 255) }, x: 560, y: 320, width: 256, height: 42, text: "" },
		"resist": { type: "text", font: { size: 18, color: Color.rgb(0, 255, 255) }, x: 560, y: 360, width: 256, height: 42, text: "" }
	}
};

for (var i = 0; i < 10; i++) {
	guiAnalyserObject.elements["slot" + i] = { type: "invSlot", x: 270 + i * 45, y: 455, size: GUI_SCALE * guiAddConst, index: i };
}

CropAnalyser.gui = new UI.Window(guiAnalyserObject);
CropAnalyser.gui.setInventoryNeeded(true);
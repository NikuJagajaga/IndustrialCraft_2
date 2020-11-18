/// <reference path="./BatteryBlock.ts" />

IDRegistry.genBlockID("storageMFSU");
Block.createBlock("storageMFSU", [
	{name: "MFSU", texture: [["mfsu_top", 0], ["mfsu_top", 0], ["mfsu_side", 0], ["mfsu_front", 0], ["mfsu_side", 0], ["mfsu_side", 0]], inCreative: true}
], "machine");
ToolAPI.registerBlockMaterial(BlockID.storageMFSU, "stone", 1, true);

TileRenderer.setHandAndUiModel(BlockID.storageMFSU, 0, [["mfsu_top", 0], ["mfsu_top", 0], ["mfsu_side", 0], ["mfsu_front", 0], ["mfsu_side", 0], ["mfsu_side", 0]]);
TileRenderer.setStandardModel(BlockID.storageMFSU, 0, [["mfsu_front", 0], ["mfsu_side", 0], ["mfsu_top", 0], ["mfsu_top", 0], ["mfsu_side", 1], ["mfsu_side", 1]]);
TileRenderer.setStandardModel(BlockID.storageMFSU, 1, [["mfsu_side", 0], ["mfsu_front", 0], ["mfsu_top", 0], ["mfsu_top", 0], ["mfsu_side", 1], ["mfsu_side", 1]]);
TileRenderer.setStandardModelWithRotation(BlockID.storageMFSU, 2, [["mfsu_top", 0], ["mfsu_top", 0], ["mfsu_side", 0], ["mfsu_front", 0], ["mfsu_side", 0], ["mfsu_side", 0]]);

Block.registerDropFunction("storageMFSU", function(coords, blockID, blockData, level) {
	return [];
});

ItemName.setRarity(BlockID.storageMFSU, 1);
ItemName.addStorageBlockTooltip("storageMFSU", 4, "60M");

Callback.addCallback("PreLoaded", function() {
	Recipes.addShaped({id: BlockID.storageMFSU, count: 1, data: 0}, [
		"aca",
		"axa",
		"aba"
	], ['b', BlockID.storageMFE, -1, 'a', ItemID.storageLapotronCrystal, -1, 'x', BlockID.machineBlockAdvanced, 0, 'c', ItemID.circuitAdvanced, 0]);
});


var guiMFSU = BatteryBlockWindow("MFSU");

namespace Machine {
	class MFSU extends BatteryBlock {
		constructor() {
			super(4, 6e7, BlockID.machineBlockAdvanced, guiMFSU);
		}
	}

	MachineRegistry.registerPrototype(BlockID.storageMFSU, new MFSU());
	MachineRegistry.setStoragePlaceFunction("storageMFSU", true);

	StorageInterface.createInterface(BlockID.storageMFSU, BatteryBlockInterface);
}
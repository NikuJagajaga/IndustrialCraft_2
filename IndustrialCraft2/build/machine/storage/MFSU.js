var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
IDRegistry.genBlockID("storageMFSU");
Block.createBlock("storageMFSU", [
    { name: "MFSU", texture: [["mfsu_top", 0], ["mfsu_top", 0], ["mfsu_side", 0], ["mfsu_front", 0], ["mfsu_side", 0], ["mfsu_side", 0]], inCreative: true }
], "machine");
ToolAPI.registerBlockMaterial(BlockID.storageMFSU, "stone", 1, true);
TileRenderer.setStandardModel(BlockID.storageMFSU, 0, [["mfsu_front", 0], ["mfsu_side", 0], ["mfsu_top", 0], ["mfsu_top", 0], ["mfsu_side", 1], ["mfsu_side", 1]]);
TileRenderer.setStandardModel(BlockID.storageMFSU, 1, [["mfsu_side", 0], ["mfsu_front", 0], ["mfsu_top", 0], ["mfsu_top", 0], ["mfsu_side", 1], ["mfsu_side", 1]]);
TileRenderer.setStandardModelWithRotation(BlockID.storageMFSU, 2, [["mfsu_top", 0], ["mfsu_top", 0], ["mfsu_side", 0], ["mfsu_front", 0], ["mfsu_side", 0], ["mfsu_side", 0]]);
Block.registerDropFunction("storageMFSU", function (coords, blockID, blockData, level) {
    return [];
});
ItemName.setRarity(BlockID.storageMFSU, 1, true);
ItemName.addStorageBlockTooltip("storageMFSU", 4, "60M");
Callback.addCallback("PreLoaded", function () {
    Recipes.addShaped({ id: BlockID.storageMFSU, count: 1, data: 0 }, [
        "aca",
        "axa",
        "aba"
    ], ['b', BlockID.storageMFE, -1, 'a', ItemID.storageLapotronCrystal, -1, 'x', BlockID.machineBlockAdvanced, 0, 'c', ItemID.circuitAdvanced, 0]);
});
var guiMFSU = new UI.StandartWindow({
    standart: {
        header: { text: { text: Translation.translate("MFSU") } },
        inventory: { standart: true },
        background: { standart: true }
    },
    drawing: [
        { type: "bitmap", x: 530, y: 144, bitmap: "energy_bar_background", scale: GUI_SCALE },
    ],
    elements: {
        "energyScale": { type: "scale", x: 530 + GUI_SCALE * 4, y: 144, direction: 0, value: 0.5, bitmap: "energy_bar_scale", scale: GUI_SCALE },
        "slot1": { type: "slot", x: 441, y: 75, isValid: MachineRegistry.isValidEUItem },
        "slot2": { type: "slot", x: 441, y: 212, isValid: MachineRegistry.isValidEUStorage },
        "textInfo1": { type: "text", x: 642, y: 142, width: 350, height: 30, text: "0/" },
        "textInfo2": { type: "text", x: 642, y: 172, width: 350, height: 30, text: "60000000" }
    }
});
Callback.addCallback("LevelLoaded", function () {
    MachineRegistry.updateGuiHeader(guiMFSU, "MFSU");
});
var TileEntityMFSU = /** @class */ (function (_super) {
    __extends(TileEntityMFSU, _super);
    function TileEntityMFSU() {
        return _super.call(this, 4, 6e7, BlockID.machineBlockAdvanced, guiMFSU) || this;
    }
    return TileEntityMFSU;
}(TileEntityBatteryBlock));
MachineRegistry.registerPrototype(BlockID.storageMFSU, new TileEntityMFSU());
MachineRegistry.setStoragePlaceFunction("storageMFSU", true);
StorageInterface.createInterface(BlockID.storageMFSU, BatteryBlockInterface);

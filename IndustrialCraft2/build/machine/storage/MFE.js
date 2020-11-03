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
IDRegistry.genBlockID("storageMFE");
Block.createBlock("storageMFE", [
    { name: "MFE", texture: [["machine_top", 0], ["machine_top", 0], ["mfe_back", 0], ["mfe_front", 0], ["mfe_side", 0], ["mfe_side", 0]], inCreative: true }
], "machine");
ToolAPI.registerBlockMaterial(BlockID.storageMFE, "stone", 1, true);
TileRenderer.setStandardModel(BlockID.storageMFE, 0, [["mfe_front", 0], ["mfe_back", 0], ["machine_top", 0], ["machine_top", 0], ["mfe_side", 1], ["mfe_side", 1]]);
TileRenderer.setStandardModel(BlockID.storageMFE, 1, [["mfe_back", 0], ["mfe_front", 0], ["machine_top", 0], ["machine_top", 0], ["mfe_side", 1], ["mfe_side", 1]]);
TileRenderer.setStandardModelWithRotation(BlockID.storageMFE, 2, [["machine_top", 0], ["machine_top", 0], ["mfe_back", 0], ["mfe_front", 0], ["mfe_side", 0], ["mfe_side", 0]]);
Block.registerDropFunction("storageMFE", function (coords, blockID, blockData, level) {
    return [];
});
ItemName.addStorageBlockTooltip("storageMFE", 3, "4M");
Callback.addCallback("PreLoaded", function () {
    Recipes.addShaped({ id: BlockID.storageMFE, count: 1, data: 0 }, [
        "bab",
        "axa",
        "bab"
    ], ['x', BlockID.machineBlockBasic, 0, 'a', ItemID.storageCrystal, -1, 'b', ItemID.cableGold2, -1]);
});
var guiMFE = new UI.StandartWindow({
    standart: {
        header: { text: { text: Translation.translate("MFE") } },
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
        "textInfo1": { type: "text", x: 642, y: 142, width: 300, height: 30, text: "0/" },
        "textInfo2": { type: "text", x: 642, y: 172, width: 300, height: 30, text: "4000000" }
    }
});
Callback.addCallback("LevelLoaded", function () {
    MachineRegistry.updateGuiHeader(guiMFE, "MFE");
});
var TileEntityMFE = /** @class */ (function (_super) {
    __extends(TileEntityMFE, _super);
    function TileEntityMFE() {
        return _super.call(this, 3, 4000000, BlockID.machineBlockBasic, guiMFE) || this;
    }
    return TileEntityMFE;
}(TileEntityBatteryBlock));
MachineRegistry.registerPrototype(BlockID.storageMFE, new TileEntityMFE());
MachineRegistry.setStoragePlaceFunction("storageMFE", true);
StorageInterface.createInterface(BlockID.storageMFE, BatteryBlockInterface);

IDRegistry.genBlockID("semifluidGenerator");
Block.createBlock("semifluidGenerator", [
	{name: "Semifluid Generator", texture: [["machine_bottom", 0], ["machine_top", 0], ["machine_side", 0], ["semifluid_generator_front", 0], ["semifluid_generator_side", 0], ["semifluid_generator_side", 0]], inCreative: true}
], "machine");
ToolAPI.registerBlockMaterial(BlockID.semifluidGenerator, "stone", 1, true);

TileRenderer.setStandardModelWithRotation(BlockID.semifluidGenerator, 2, [["machine_bottom", 0], ["machine_top", 0], ["machine_side", 0], ["semifluid_generator_front", 0], ["semifluid_generator_side", 0], ["semifluid_generator_side", 0]]);
TileRenderer.registerModelWithRotation(BlockID.semifluidGenerator, 2, [["machine_bottom", 0], ["machine_top", 0], ["machine_side", 0], ["semifluid_generator_front", 1], ["semifluid_generator_side", 1], ["semifluid_generator_side", 1]]);
TileRenderer.setRotationFunction(BlockID.semifluidGenerator);

MachineRegistry.setMachineDrop("semifluidGenerator", BlockID.primalGenerator);

Callback.addCallback("PreLoaded", function() {
	Recipes.addShaped({id: BlockID.semifluidGenerator, count: 1, data: 0}, [
		"pcp",
		"cxc",
		"pcp"
	], ['x', BlockID.machineBlockBasic, 0, 'c', ItemID.cellEmpty, 0, 'p', ItemID.casingIron, 0]);
});

MachineRecipeRegistry.registerRecipesFor("fluidFuel", {
	"biomass": {power: 8, amount: 20},
	"oil": {power: 8, amount: 10},
	"biogas": {power: 16, amount: 10},
	"ethanol": {power: 16, amount: 10},
});

var guiSemifluidGenerator = InventoryWindow("Semifluid Generator", {
	drawing: [
		{type: "bitmap", x: 702, y: 91, bitmap: "energy_bar_background", scale: GUI_SCALE},
		{type: "bitmap", x: 581, y: 75, bitmap: "liquid_bar", scale: GUI_SCALE},
		{type: "bitmap", x: 459, y: 139, bitmap: "liquid_bar_arrow", scale: GUI_SCALE}
	],

	elements: {
		"energyScale": {type: "scale", x: 702 + 4*GUI_SCALE, y: 91, direction: 0, value: 0.5, bitmap: "energy_bar_scale", scale: GUI_SCALE},
		"liquidScale": {type: "scale", x: 581 + 4*GUI_SCALE, y: 75 + 4*GUI_SCALE, direction: 1, bitmap: "gui_water_scale", overlay: "gui_liquid_storage_overlay", scale: GUI_SCALE},
		"slot1": {type: "slot", x: 440, y: 75},
		"slot2": {type: "slot", x: 440, y: 183},
		"slotEnergy": {type: "slot", x: 725, y: 165}
	}
});

namespace Machine {
	export class FluidGenerator
	extends Generator {
		defaultValues = {
			energy: 0,
			fuel: 0,
			liquid: null,
			isActive: false,
		}

		getScreenByName() {
			return guiSemifluidGenerator;
		}

		setupContainer(): void {
			this.liquidStorage.setLimit(null, 10);

			StorageInterface.setSlotValidatePolicy(this.container, "slotEnergy", (name, id) => {
				return ChargeItemRegistry.isValidItem(id, "Eu", 1);
			});
			StorageInterface.setSlotValidatePolicy(this.container, "slot1", (name, id, count, data) => {
				var empty = LiquidLib.getEmptyItem(id, data);
				if (!empty) return false;
				return MachineRecipeRegistry.hasRecipeFor("fluidFuel", empty.liquid);
			});
			this.container.setSlotAddTransferPolicy("slot2", () => 0);
		}

		getLiquidFromItem(liquid: string, inputItem: ItemInstance, outputItem: ItemInstance, byHand?: boolean): boolean {
			return MachineRegistry.getLiquidFromItem.call(this, liquid, inputItem, outputItem, byHand);
		}

		onItemUse(coords: Callback.ItemUseCoordinates, item: ItemStack, player: number): boolean {
			if (Entity.getSneaking(player)) {
				let liquid = this.liquidStorage.getLiquidStored();
				return this.getLiquidFromItem(liquid, item, new ItemStack(), true);
			}
			return super.onItemUse(coords, item, player);
		}

		tick(): void {
			StorageInterface.checkHoppers(this);
			var energyStorage = this.getEnergyStorage();
			var liquid = this.liquidStorage.getLiquidStored();
			var slot1 = this.container.getSlot("slot1");
			var slot2 = this.container.getSlot("slot2");
			this.getLiquidFromItem(liquid, slot1, slot2);

			if (this.data.fuel <= 0) {
				var fuel = MachineRecipeRegistry.getRecipeResult("fluidFuel", liquid);
				if (fuel && this.liquidStorage.getAmount(liquid).toFixed(3) >= fuel.amount/1000 && this.data.energy + fuel.power * fuel.amount <= energyStorage) {
					this.liquidStorage.getLiquid(liquid, fuel.amount/1000);
					this.data.fuel = fuel.amount;
					this.data.liquid = liquid;
				}
			}
			if (this.data.fuel > 0) {
				var fuel = MachineRecipeRegistry.getRecipeResult("fluidFuel", this.data.liquid);
				this.data.energy += fuel.power;
				this.data.fuel -= fuel.amount/20;
				this.setActive(true);
			}
			else {
				this.data.liquid = null;
				this.setActive(false);
			}

			this.data.energy -= ChargeItemRegistry.addEnergyToSlot(this.container.getSlot("slotEnergy"), "Eu", this.data.energy, 1);

			this.liquidStorage.updateUiScale("liquidScale", liquid);
			this.container.setScale("energyScale", this.data.energy / energyStorage);
			this.container.sendChanges();
		}

		getOperationSound() {
			return "GeothermalLoop.ogg";
		}

		getEnergyStorage(): number {
			return 1000
		}
	}

	MachineRegistry.registerGenerator(BlockID.semifluidGenerator, new FluidGenerator());

	StorageInterface.createInterface(BlockID.semifluidGenerator, {
		slots: {
			"slot1": {input: true},
			"slot2": {output: true}
		},
		isValidInput: (item: ItemInstance) => {
			var empty = LiquidLib.getEmptyItem(item.id, item.data);
			if (!empty) return false;
			return MachineRecipeRegistry.hasRecipeFor("fluidFuel", empty.liquid);
		},
		canReceiveLiquid: (liquid: string) => MachineRecipeRegistry.hasRecipeFor("fluidFuel", liquid),
		canTransportLiquid: (liquid: string) => false
	});
}
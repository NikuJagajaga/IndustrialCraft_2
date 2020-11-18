IDRegistry.genBlockID("genWindmill");
Block.createBlock("genWindmill", [
	{name: "Wind Mill", texture: [["machine_bottom", 0], ["machine_top", 0], ["windmill", 0], ["windmill", 0], ["machine_side", 0], ["machine_side", 0]], inCreative: true}
], "machine");
ToolAPI.registerBlockMaterial(BlockID.genWindmill, "stone", 1, true);

TileRenderer.setStandardModelWithRotation(BlockID.genWindmill, 2, [["machine_bottom", 0], ["machine_top", 0], ["windmill", 0], ["windmill", 0], ["machine_side", 0], ["machine_side", 0]]);
TileRenderer.setRotationFunction(BlockID.genWindmill);

MachineRegistry.setMachineDrop("genWindmill", BlockID.primalGenerator);

Callback.addCallback("PreLoaded", function() {
	Recipes.addShaped({id: BlockID.genWindmill, count: 1, data: 0}, [
		"x x",
		" # ",
		"xcx"
	], ['#', BlockID.primalGenerator, -1, 'x', ItemID.plateSteel, 0, 'c', ItemID.coil, 0]);
});

namespace Machine {
	export class Windmill
	extends Generator {
		constructor() {
			super(1);
		}

		defaultValues = {
			energy: 0,
			output: 0,
			ticker: -1,
			blockCount: 0
		}

		updateBlockCount() {
			var blockCount = -1;
			for (var x = -4; x <= 4; x++) {
				for (var y = -2; y <= 2; y++) {
					for (var z = -4; z <= 4; z++) {
						if (this.blockSource.getBlockId(this.x + x, this.y + y, this.z + z) != 0)
						blockCount++;
					}
				}
			}
			this.data.blockCount = blockCount;
		}
		
		init() {
			super.init();
			if (this.dimension != 0) this.selfDestroy();
		}

		energyTick(type: string, src: any) {
			if (++this.data.ticker % 128 == 0) {
				if (this.data.ticker % 1024 == 0) {
					this.updateBlockCount();
				}
				var height = (this.y < 160) ? Math.max(this.y - 64, 0) : 256 - this.y;
				var wind = windStrength;
				var wether = World.getWeather();
				if (wether.thunder) wind *= 1.25;
				else if (wether.rain) wind *= 1.5;
				var output = wind * height * (1 - this.data.blockCount/405) / 288;
				this.data.output = Math.round(output*10)/10;
			}
			src.addAll(this.data.output);
		}
	}

	MachineRegistry.registerPrototype(BlockID.genWindmill, new Windmill());
}

var windStrength = 0;
Callback.addCallback("tick", function () {
	if (World.getThreadTime()%128 != 0) {
		return;
	}
	var upChance = 10;
	var downChance = 10;
	if (windStrength > 20) {
		upChance -= windStrength - 20;
	} else if (windStrength < 10) {
		downChance -= 10 - windStrength;
	}
	if (Math.random()*100 < upChance) {
		windStrength++;
	} else if (Math.random()*100 < downChance) {
		windStrength--;
	}
});

Saver.addSavesScope("windSim",
    function read(scope) {
        windStrength = scope["strength"] || randomInt(5, 25);
    },
    function save() {
        return {strength: windStrength};
    }
);

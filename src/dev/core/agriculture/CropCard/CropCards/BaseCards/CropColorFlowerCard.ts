/// <reference path="../../../CropCard/CropCard.ts" />
/// <reference path="../../../CropCard/CropCardProperties.ts" />
/// <reference path="../../../CropTile/ICropTileEntity.ts" />
namespace Agriculture {
	export class CropColorFlowerCard extends CropCard {
		constructor(protected id: string, protected attributes: string[], protected color: number, protected baseSeed?: BaseSeed) {
			super();
		}

		getID(): string {
			return this.id;
		}

		getAttributes(): string[] {
			return this.attributes;
		}

		getDiscoveredBy(): string {
			return "Notch";
		}

		getProperties(): CropCardProperties {
			return {
				tier: 2,
				chemistry: 1,
				consumable: 1,
				defensive: 0,
				colorful: 5,
				weed: 1
			}
		}

		getBaseSeed(): BaseSeed {
			return {
				...super.getBaseSeed(),
				...this.baseSeed
			};
		}

		getMaxSize(): number {
			return 4;
		}

		getColor(): number {
			return this.color;
		}

		getOptimalHarvestSize(): number {
			return 4;
		}

		canGrow(tileentity: ICropTileEntity): boolean {
			const light = tileentity.region.getLightLevel(tileentity.x, tileentity.y, tileentity.z);
			return tileentity.data.currentSize < tileentity.crop.getMaxSize() && light >= 12;
		}

		getGain(te: ICropTileEntity): ItemInstance {
			return { id: 351, count: 1, data: this.getColor() }
		}

		getSizeAfterHarvest(te: ICropTileEntity): number {
			return 3
		}

		getGrowthDuration(te: ICropTileEntity): number {
			if (te.data.currentSize == 3) return 600;
			return 400;
		}
	}
}
